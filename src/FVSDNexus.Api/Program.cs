using Azure.Monitor.OpenTelemetry.AspNetCore;
using FVSDNexus.Api.Dataverse;
using FVSDNexus.Api.DevelopmentRoles;
using FVSDNexus.Api.SemanticModel;
using FVSDNexus.Api.SessionContext;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;
using OpenTelemetry.Trace;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<FabricSemanticModelOptions>()
    .Bind(builder.Configuration.GetSection(FabricSemanticModelOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<DataverseOptions>()
    .Bind(builder.Configuration.GetSection(DataverseOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<DevelopmentRoleOptions>()
    .Bind(builder.Configuration.GetSection(DevelopmentRoleOptions.SectionName))
    .ValidateDataAnnotations()
    .Validate(options => DevelopmentRoleNames.IsValid(options.DefaultRole), "The default development role is not supported.")
    .ValidateOnStart();

builder.Services.AddSingleton<IDevelopmentRoleService, DevelopmentRoleService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<SchoolYearSessionContext>();

builder.Services
    .AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"))
    // Entra authorization-code requests can target only one downstream resource.
    // Dataverse is acquired at sign-in; already-consented Fabric access is acquired silently when needed.
    .EnableTokenAcquisitionToCallDownstreamApi(
        [
            builder.Configuration["Dataverse:Scope"]!
        ])
    .AddInMemoryTokenCaches();

builder.Services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme)
    .Configure<SchoolYearSessionContext>((options, schoolYears) =>
    {
        options.Events ??= new CookieAuthenticationEvents();
        var existingOnSigningIn = options.Events.OnSigningIn;
        var existingOnValidatePrincipal = options.Events.OnValidatePrincipal;
        options.Events.OnSigningIn = async context =>
        {
            await existingOnSigningIn(context);
            schoolYears.EnsureCurrentSchoolYearClaim(context.Principal);
        };
        options.Events.OnValidatePrincipal = async context =>
        {
            await existingOnValidatePrincipal(context);
            if (context.Principal?.HasClaim(claim => claim.Type == SchoolYearSessionContext.ClaimType) == false)
            {
                schoolYears.EnsureCurrentSchoolYearClaim(context.Principal);
                context.ShouldRenew = true;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddHttpClient<IPowerBiSemanticModelClient, PowerBiSemanticModelClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<IDataverseAccessContextClient, DataverseAccessContextClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<IDataverseAssessmentWorkspaceClient, DataverseAssessmentWorkspaceClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

if (!string.IsNullOrWhiteSpace(builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]))
{
    builder.Services.AddOpenTelemetry()
        .UseAzureMonitor()
        .WithTracing(tracing => tracing
            .AddSource(PowerBiSemanticModelClient.ActivitySourceName)
            .AddSource(DataverseAccessContextClient.ActivitySourceName));
}

builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
var postAuthenticationRedirect = builder.Configuration["Frontend:BaseUrl"] ?? "/";

app.UseExceptionHandler();
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (MicrosoftIdentityWebChallengeUserException exception)
        when (context.Request.Path.StartsWithSegments("/api"))
    {
        app.Logger.LogInformation(
            "A fresh delegated sign-in is required for {Path}. Error code: {ErrorCode}",
            context.Request.Path,
            exception.MsalUiRequiredException?.ErrorCode);
        context.Response.Clear();
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new
        {
            type = "https://tools.ietf.org/html/rfc9110#section-15.5.2",
            title = "Your delegated Microsoft session needs to be reconnected.",
            status = StatusCodes.Status401Unauthorized,
            reauthorizeUrl = "/api/auth/signin"
        });
    }
});
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.ContentSecurityPolicy =
        "default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';";
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.Append("Referrer-Policy", "no-referrer");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
});
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", [AllowAnonymous] () => Results.Ok(new
{
    status = "healthy",
    service = "FVSD Nexus"
}));

app.MapGet("/api/auth/signin", () => Results.Challenge(
    new Microsoft.AspNetCore.Authentication.AuthenticationProperties
    {
        RedirectUri = postAuthenticationRedirect
    },
    [OpenIdConnectDefaults.AuthenticationScheme]))
    .AllowAnonymous();

app.MapGet("/api/auth/signout", () => Results.SignOut(
    new Microsoft.AspNetCore.Authentication.AuthenticationProperties
    {
        RedirectUri = postAuthenticationRedirect
    },
    [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]))
    .AllowAnonymous();

app.MapGet("/api/me", (
    HttpContext context,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears) =>
{
    var roleContext = developmentRoles.GetContext(context);
    return Results.Ok(new
    {
        name = GetDisplayName(context.User),
        email = context.User.FindFirst("preferred_username")?.Value
            ?? context.User.FindFirst("email")?.Value,
        isDeveloper = roleContext.IsDeveloper,
        activeDevelopmentRole = roleContext.ActiveRole,
        availableDevelopmentRoles = roleContext.AvailableRoles,
        rlsIdentity = roleContext.RlsIdentity,
        rlsEvaluation = roleContext.RlsEvaluation,
        currentSchoolYear = schoolYears.GetCurrentSchoolYear(context.User)
    });
});

app.MapGet("/api/dataverse/access-context", async (
    HttpContext context,
    IDataverseAccessContextClient dataverse,
    CancellationToken cancellationToken) =>
{
    var email = GetUserEmail(context.User);
    if (string.IsNullOrWhiteSpace(email))
    {
        return Results.Problem(
            title: "The signed-in account does not contain an email address.",
            statusCode: StatusCodes.Status400BadRequest);
    }

    var accessContext = await dataverse.GetAccessContextAsync(
        email,
        GetEntraObjectId(context.User),
        cancellationToken);
    return Results.Ok(accessContext);
});

app.MapGet("/api/assessments/context", async (
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null)
    {
        return Results.Problem(
            title: "The signed-in account does not contain an email address.",
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (!accessContext.RoleRecordFound || !accessContext.PocEnabled || accessContext.EffectiveRole == "No Access")
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for the FVSD Nexus assessment PoC.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    var developmentContext = developmentRoles.GetContext(context);
    var workspaceContext = await assessments.GetWorkspaceContextAsync(
        accessContext,
        developmentContext.ActiveRole,
        developmentContext.IsDeveloper,
        cancellationToken);
    return Results.Ok(workspaceContext);
});

app.MapGet("/api/assessments/teacher-sections", async (
    Guid schoolId,
    string sectionGroup,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for the FVSD Nexus assessment PoC.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        var sections = await assessments.GetTeacherSectionsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            schoolId,
            sectionGroup,
            cancellationToken);
        return Results.Ok(sections);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
});

app.MapGet("/api/assessments/section-groups", async (
    Guid schoolId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for the FVSD Nexus assessment PoC.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        var sectionGroups = await assessments.GetSectionGroupsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            schoolId,
            cancellationToken);
        return Results.Ok(sectionGroups);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
});

app.MapGet("/api/assessments/teacher-sections/{teacherSectionId:guid}/students", async (
    Guid teacherSectionId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for the FVSD Nexus assessment PoC.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        var students = await assessments.GetStudentsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            cancellationToken);
        return Results.Ok(students);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
});

app.MapGet("/api/assessments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/history/tosrec", async (
    Guid teacherSectionId,
    Guid studentId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for the FVSD Nexus assessment PoC.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        var history = await assessments.GetTosrecAssessmentsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        return Results.Ok(history);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
});

app.MapPost("/api/development/role", (
    DevelopmentRoleChange change,
    HttpContext context,
    IDevelopmentRoleService developmentRoles) =>
{
    if (!developmentRoles.IsDeveloper(context.User))
    {
        return Results.Forbid();
    }

    if (!string.Equals(
        context.Request.Headers["X-FVSD-Development-Request"],
        "role-switcher",
        StringComparison.Ordinal))
    {
        return Results.BadRequest(new { error = "The role change must originate from the FVSD Nexus role switcher." });
    }

    if (!developmentRoles.TrySetRole(context, change.Role))
    {
        return Results.BadRequest(new { error = "The selected development role is not supported." });
    }

    return Results.Ok(new
    {
        activeDevelopmentRole = change.Role,
        rlsIdentity = context.User.Identity?.Name ?? "Signed-in FVSD user",
        rlsEvaluation = "Fabric evaluates the signed-in Entra identity"
    });
});

app.MapGet("/api/semantic-model/status", async (
    IPowerBiSemanticModelClient semanticModel,
    CancellationToken cancellationToken) =>
{
    var status = await semanticModel.CheckConnectionAsync(cancellationToken);
    return Results.Ok(status);
});

app.MapGet("/api/filters", async (
    IPowerBiSemanticModelClient semanticModel,
    CancellationToken cancellationToken) =>
{
    var options = await semanticModel.GetFilterOptionsAsync(cancellationToken);
    return Results.Ok(options);
});

app.MapGet("/api/executive/domains", () => Results.Ok(ExecutiveDashboardDomains.All));

app.MapGet("/api/executive/terms", async (
    IPowerBiSemanticModelClient semanticModel,
    CancellationToken cancellationToken) =>
{
    var terms = await semanticModel.GetTermDefinitionsAsync(cancellationToken);
    return Results.Ok(terms);
});

app.MapGet("/api/executive/overview", async (
    HttpRequest request,
    IPowerBiSemanticModelClient semanticModel,
    CancellationToken cancellationToken) =>
{
    if (!ExecutiveDashboardDomains.TryGet(request.Query["domain"].FirstOrDefault(), out var domain))
    {
        return Results.BadRequest(new { error = "The selected Executive Dashboard domain is not supported." });
    }

    try
    {
        var rows = await semanticModel.GetExecutiveOverviewAsync(
            domain,
            GetExecutiveDashboardFilters(request),
            cancellationToken);
        return Results.Ok(rows);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
});

app.MapGet("/api/executive/school-comparison", async (
    HttpRequest request,
    IPowerBiSemanticModelClient semanticModel,
    CancellationToken cancellationToken) =>
{
    if (!ExecutiveDashboardDomains.TryGet(request.Query["domain"].FirstOrDefault(), out var domain))
    {
        return Results.BadRequest(new { error = "The selected Executive Dashboard domain is not supported." });
    }

    if (!ExecutiveDashboardDomains.TryGetInstrument(
        domain,
        request.Query["assessmentGroup"].FirstOrDefault(),
        out var instrument))
    {
        return Results.BadRequest(new { error = "The selected Assessment Group is not available for this domain." });
    }

    try
    {
        var rows = await semanticModel.GetExecutiveSchoolComparisonAsync(
            instrument,
            GetExecutiveDashboardFilters(request),
            cancellationToken);
        return Results.Ok(rows);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
});

app.MapGet("/api/schools/comparison", async (
    HttpRequest request,
    IPowerBiSemanticModelClient semanticModel,
    CancellationToken cancellationToken) =>
{
    try
    {
        var filters = new SchoolComparisonFilters(
            GetQueryValues(request, "school"),
            GetQueryValues(request, "schoolYear"),
            GetQueryValues(request, "assessmentGroup"),
            GetQueryValues(request, "curriculum"),
            GetQueryValues(request, "grade"),
            GetQueryValues(request, "period"));
        var rows = await semanticModel.GetSchoolComparisonAsync(filters, cancellationToken);
        return Results.Ok(rows);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
});

app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();

static string[] GetQueryValues(HttpRequest request, string name) =>
    request.Query[name]
        .Where(value => !string.IsNullOrWhiteSpace(value))
        .Select(value => value!)
        .ToArray();

static ExecutiveDashboardFilters GetExecutiveDashboardFilters(HttpRequest request) => new(
    GetQueryValues(request, "school"),
    GetQueryValues(request, "schoolYear"),
    GetQueryValues(request, "grade"),
    GetQueryValues(request, "period"));

static string GetDisplayName(ClaimsPrincipal user)
{
    var displayName = user.FindFirst("name")?.Value
        ?? user.FindFirst(ClaimTypes.Name)?.Value;
    if (!string.IsNullOrWhiteSpace(displayName)
        && !displayName.Contains('@', StringComparison.Ordinal))
    {
        return displayName;
    }

    var givenName = user.FindFirst("given_name")?.Value;
    var familyName = user.FindFirst("family_name")?.Value;
    var combinedName = string.Join(
        ' ',
        new[] { givenName, familyName }.Where(value => !string.IsNullOrWhiteSpace(value)));

    return !string.IsNullOrWhiteSpace(combinedName)
        ? combinedName
        : displayName ?? user.Identity?.Name ?? "FVSD user";
}

static string? GetUserEmail(ClaimsPrincipal user) =>
    user.FindFirst("preferred_username")?.Value
    ?? user.FindFirst("email")?.Value
    ?? user.FindFirst(ClaimTypes.Email)?.Value;

static Guid? GetEntraObjectId(ClaimsPrincipal user) =>
    Guid.TryParse(user.FindFirst("oid")?.Value, out var objectId)
        ? objectId
        : null;

static async Task<DataverseAccessContext?> GetDataverseAccessContextAsync(
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    CancellationToken cancellationToken)
{
    var email = GetUserEmail(context.User);
    if (string.IsNullOrWhiteSpace(email))
    {
        return null;
    }

    return await accessContextClient.GetAccessContextAsync(
        email,
        GetEntraObjectId(context.User),
        cancellationToken);
}

public partial class Program;
