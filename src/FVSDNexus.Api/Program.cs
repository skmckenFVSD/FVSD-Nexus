using Azure.Core;
using Azure.Identity;
using Azure.Monitor.OpenTelemetry.AspNetCore;
using FVSDNexus.Api.Dataverse;
using FVSDNexus.Api.DevelopmentRoles;
using FVSDNexus.Api.Authentication;
using FVSDNexus.Api.CopilotAccess;
using FVSDNexus.Api.FoundryCopilot;
using FVSDNexus.Api.SemanticModel;
using FVSDNexus.Api.SessionContext;
using FVSDNexus.Api.WorkIq;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using OpenTelemetry.Trace;
using System.Security.Claims;
using System.Text.Json;

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

builder.Services.AddOptions<CopilotAccessOptions>()
    .Bind(builder.Configuration.GetSection(CopilotAccessOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();
builder.Services.AddMemoryCache();

builder.Services.AddOptions<FoundryCopilotOptions>()
    .Bind(builder.Configuration.GetSection(FoundryCopilotOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton<IDevelopmentRoleService, DevelopmentRoleService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<SchoolYearSessionContext>();
builder.Services.AddSingleton<IWorkIqHandoffStore, WorkIqHandoffStore>();
builder.Services.AddSingleton<TokenCredential>(_ =>
{
    // Local development runs outside Azure, so it cannot use the App Service
    // managed-identity endpoint. Use the developer's explicit Azure CLI session
    // locally and retain managed identity as the governed production path.
    if (builder.Environment.IsDevelopment())
    {
        return new AzureCliCredential();
    }

    return new DefaultAzureCredential(new DefaultAzureCredentialOptions
    {
        ExcludeInteractiveBrowserCredential = true,
        ExcludeAzureCliCredential = true,
        ExcludeAzureDeveloperCliCredential = true,
        ExcludeVisualStudioCredential = true,
        ExcludeVisualStudioCodeCredential = true
    });
});

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

builder.Services.AddHttpClient<ICopilotAccessClient, CopilotAccessClient>((services, client) =>
{
    var options = services.GetRequiredService<Microsoft.Extensions.Options.IOptions<CopilotAccessOptions>>().Value;
    client.BaseAddress = options.ApiBaseUrl;
    client.Timeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddHttpClient<IFoundryCopilotClient, FoundryCopilotClient>((services, client) =>
{
    var options = services.GetRequiredService<IOptions<FoundryCopilotOptions>>().Value;
    client.Timeout = TimeSpan.FromSeconds(options.RequestTimeoutSeconds);
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

if (app.Environment.IsDevelopment())
{
    var frontendDistPath = Path.GetFullPath(Path.Combine(
        app.Environment.ContentRootPath,
        "..",
        "FVSDNexus.Web",
        "dist"));

    if (Directory.Exists(frontendDistPath))
    {
        app.Environment.WebRootFileProvider = new PhysicalFileProvider(frontendDistPath);
    }
}

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

app.MapGet("/api/auth/signin", (HttpRequest request) =>
{
    var requestedRedirect = request.Query["returnUrl"].FirstOrDefault();
    var redirectUri = AuthenticationRedirects.Resolve(
        postAuthenticationRedirect,
        requestedRedirect);

    return Results.Challenge(
        new Microsoft.AspNetCore.Authentication.AuthenticationProperties
        {
            RedirectUri = redirectUri
        },
        [OpenIdConnectDefaults.AuthenticationScheme]);
})
    .AllowAnonymous();

app.MapGet("/api/auth/signout", (HttpRequest request) => Results.SignOut(
    new Microsoft.AspNetCore.Authentication.AuthenticationProperties
    {
        RedirectUri = AuthenticationRedirects.Resolve(
            postAuthenticationRedirect,
            request.Query["returnUrl"].FirstOrDefault())
    },
    [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]))
    .AllowAnonymous();

// Tenant-wide admin consent for the delegated scopes Nexus acquires silently after
// sign-in. target=copilot grants Microsoft Graph User.Read (licence check);
// target=workiq grants the Foundry delegated scope used by confirmed Work IQ actions.
// Non-administrators are stopped by Entra itself.
app.MapGet("/api/auth/admin-consent", (
    HttpContext context,
    string? target,
    IOptions<CopilotAccessOptions> copilotOptions,
    IOptions<FoundryCopilotOptions> foundryOptions) =>
{
    var scope = (target ?? "copilot").ToLowerInvariant() switch
    {
        "copilot" => copilotOptions.Value.GraphScope,
        "workiq" => foundryOptions.Value.DelegatedConsentScope,
        _ => null
    };
    if (scope is null)
    {
        return Results.BadRequest(new { error = "Unsupported admin-consent target. Use 'copilot' or 'workiq'." });
    }

    var azureAd = builder.Configuration.GetSection("AzureAd");
    var clientId = azureAd["ClientId"];
    var tenantId = azureAd["TenantId"];
    if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(tenantId))
    {
        return Results.Problem(
            title: "The Entra app registration is not configured.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    var state = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(16));
    context.Response.Cookies.Append(AdminConsent.StateCookieName, state, new CookieOptions
    {
        HttpOnly = true,
        Secure = context.Request.IsHttps,
        SameSite = SameSiteMode.Lax,
        Path = AdminConsent.CallbackPath,
        MaxAge = TimeSpan.FromMinutes(10)
    });

    var consentUri = AdminConsent.BuildConsentUri(
        azureAd["Instance"] ?? "https://login.microsoftonline.com/",
        tenantId,
        clientId,
        AdminConsent.ResolveRedirectUri(postAuthenticationRedirect, context.Request),
        [scope],
        state);
    return Results.Redirect(consentUri.AbsoluteUri);
});

app.MapGet(AdminConsent.CallbackPath, async (
    HttpContext context,
    ICopilotAccessClient copilotAccess,
    CancellationToken cancellationToken) =>
{
    var query = context.Request.Query;
    var expectedState = context.Request.Cookies[AdminConsent.StateCookieName];
    context.Response.Cookies.Delete(AdminConsent.StateCookieName, new CookieOptions { Path = AdminConsent.CallbackPath });

    string outcome;
    if (string.IsNullOrEmpty(expectedState)
        || !string.Equals(expectedState, query["state"].FirstOrDefault(), StringComparison.Ordinal))
    {
        outcome = "invalid_state";
    }
    else if (string.Equals(query["admin_consent"].FirstOrDefault(), "True", StringComparison.OrdinalIgnoreCase))
    {
        outcome = "granted";
        if (context.User.Identity?.IsAuthenticated == true)
        {
            // Replace the cached "unconfirmed" entitlement with a fresh Graph check.
            var status = await copilotAccess.GetStatusAsync(GetUserEmail(context.User), true, cancellationToken);
            app.Logger.LogInformation(
                "Admin consent granted. Copilot licence check is now {LicenseCheckStatus}.",
                status.LicenseCheckStatus);
        }
    }
    else
    {
        outcome = "failed";
        app.Logger.LogWarning(
            "Admin consent was not granted. Error: {Error}. Description: {Description}",
            query["error"].FirstOrDefault(),
            query["error_description"].FirstOrDefault());
    }

    return Results.Redirect(AuthenticationRedirects.Resolve(
        postAuthenticationRedirect,
        $"/?adminConsent={outcome}"));
})
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
        activeDevelopmentUserEmail = roleContext.ActiveUserEmail,
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
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        var workspaceContext = await assessments.GetWorkspaceContextAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            cancellationToken);
        return Results.Ok(workspaceContext);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
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
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
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

app.MapGet("/api/assessments/completion/tosrec", async (
    Guid schoolId, string sectionGroup, string? courseNumber, Guid? teacherId,
    HttpContext context, IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments, IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears, CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Assessment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetCompletionAsync(accessContext, role.ActiveRole, role.IsDeveloper,
            schoolId, sectionGroup, courseNumber, teacherId, schoolYears.GetCurrentSchoolYear(context.User), cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
});

app.MapGet("/api/program-plans/class-overview", async (
    Guid? schoolId, Guid teacherId, string? sectionGroup, string? schoolYear, string? ippSection,
    HttpContext context, IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments, IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears, CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Student Program Plan access is not enabled for this user.", statusCode: 403);

    var year = schoolYear ?? schoolYears.GetCurrentSchoolYear(context.User);
    var match = System.Text.RegularExpressions.Regex.Match(year, @"^(\d{4})\s*[-/]\s*(\d{4})$");
    if (!match.Success || int.Parse(match.Groups[2].Value) != int.Parse(match.Groups[1].Value) + 1)
        return Results.BadRequest(new { error = "Select a valid school year." });
    year = $"{match.Groups[1].Value} / {match.Groups[2].Value}";
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetEmpowerClassOverviewAsync(accessContext, role.ActiveRole,
            role.IsDeveloper, schoolId, teacherId, sectionGroup, year, cancellationToken, ippSection ?? "Empower Reading",
            schoolYears.GetCurrentSchoolYear(context.User)));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
});

app.MapGet("/api/program-plans/dashboard", async (
    Guid? schoolId, string? schoolYear,
    HttpContext context, IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments, IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears, CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Student Program Plan access is not enabled for this user.", statusCode: 403);

    var year = schoolYear ?? schoolYears.GetCurrentSchoolYear(context.User);
    var yearMatch = System.Text.RegularExpressions.Regex.Match(year, @"^(\d{4})\s*[-/]\s*(\d{4})$");
    if (!yearMatch.Success
        || int.Parse(yearMatch.Groups[2].Value) != int.Parse(yearMatch.Groups[1].Value) + 1)
        return Results.BadRequest(new { error = "Select a valid school year." });
    year = $"{yearMatch.Groups[1].Value} / {yearMatch.Groups[2].Value}";

    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentProgramPlansDashboardAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, schoolId, year, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
});

app.MapGet("/api/assessments/dashboard", async (
    Guid? schoolId, string? sectionGroup, string? courseNumber, Guid? teacherId,
    string? assessmentType, int? period,
    HttpContext context, IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments, IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears, CancellationToken cancellationToken) =>
{
    if (!string.IsNullOrWhiteSpace(assessmentType)
        && !string.Equals(assessmentType, "TOSREC", StringComparison.OrdinalIgnoreCase))
    {
        return Results.BadRequest(new { error = "Only the TOSREC dashboard is connected in this release." });
    }

    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Assessment access is not enabled for this user.", statusCode: 403);

    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentScreenersDashboardAsync(
            accessContext, role.ActiveRole, role.IsDeveloper,
            schoolId, sectionGroup, courseNumber, teacherId,
            period ?? 1, schoolYears.GetCurrentSchoolYear(context.User), cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
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
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
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
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
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

app.MapGet("/api/assessments/teacher-sections/{teacherSectionId:guid}/student-statuses", async (
    Guid teacherSectionId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "private, max-age=30";
        var statuses = await assessments.GetStudentAssessmentStatusesAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            schoolYears.GetCurrentSchoolYear(context.User),
            cancellationToken);
        return Results.Ok(statuses);
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
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
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

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans", async (
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        var plans = await assessments.GetStudentPlansAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        return Results.Ok(plans);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
});

app.MapPost("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans", async (
    Guid teacherSectionId,
    Guid studentId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        var plan = await assessments.CreateStudentPlanAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            schoolYears.GetCurrentSchoolYear(context.User),
            cancellationToken);
        return Results.Created(
            $"/api/class-assignments/teacher-sections/{teacherSectionId:D}/students/{studentId:D}/plans/{plan.Id:D}",
            plan);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/modules", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanModulesAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/screeners", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanScreenersAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/oral-reading-fluency", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanOralReadingFluencyAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/oral-reading-fluency/options", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanOralReadingFluencyOptionsAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPost("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/oral-reading-fluency", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanOralReadingFluencyCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.CreateStudentPlanOralReadingFluencyAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            schoolYears.GetCurrentSchoolYear(context.User), command, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/oral-reading-fluency/{resultId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid resultId,
    StudentPlanOralReadingFluencyCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        var commandWithETag = command with { ETag = context.Request.Headers.IfMatch.FirstOrDefault() };
        return Results.Ok(await assessments.UpdateStudentPlanOralReadingFluencyAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, resultId,
            schoolYears.GetCurrentSchoolYear(context.User), commandWithETag, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapDelete("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/oral-reading-fluency/{resultId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid resultId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.DeleteStudentPlanOralReadingFluencyAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, resultId,
            schoolYears.GetCurrentSchoolYear(context.User),
            context.Request.Headers.IfMatch.FirstOrDefault(), cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});


app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/word-study", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanWordStudyAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/word-study/options", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanWordStudyOptionsAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPost("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/word-study", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanWordStudyCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.CreateStudentPlanWordStudyAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            schoolYears.GetCurrentSchoolYear(context.User), command, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/word-study/{recordId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid recordId,
    StudentPlanWordStudyCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        var commandWithETag = command with { ETag = context.Request.Headers.IfMatch.FirstOrDefault() };
        return Results.Ok(await assessments.UpdateStudentPlanWordStudyAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, recordId,
            schoolYears.GetCurrentSchoolYear(context.User), commandWithETag, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapDelete("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/word-study/{recordId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid recordId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.DeleteStudentPlanWordStudyAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, recordId,
            schoolYears.GetCurrentSchoolYear(context.User),
            context.Request.Headers.IfMatch.FirstOrDefault(), cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/empower-reading", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanEmpowerAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPut("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/empower-reading/goals/{goalId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid goalId,
    StudentPlanEmpowerProgressCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        var commandWithETag = command with { ETag = context.Request.Headers.IfMatch.FirstOrDefault() };
        return Results.Ok(await assessments.SaveStudentPlanEmpowerProgressAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, goalId,
            schoolYears.GetCurrentSchoolYear(context.User), commandWithETag, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/mathematics", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanMathematicsAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPut("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/mathematics/goals/{goalId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid goalId,
    StudentPlanMathematicsProgressCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        var commandWithETag = command with { ETag = context.Request.Headers.IfMatch.FirstOrDefault() };
        return Results.Ok(await assessments.SaveStudentPlanMathematicsProgressAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, goalId,
            schoolYears.GetCurrentSchoolYear(context.User), commandWithETag, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/fmcs-foundations", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanFmcsAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPost("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/fmcs-foundations/outcomes", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanFmcsOutcomeCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.InitializeStudentPlanFmcsOutcomeAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            schoolYears.GetCurrentSchoolYear(context.User), command, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPut("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/fmcs-foundations/goals/{goalId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid goalId,
    StudentPlanFmcsProgressCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        var commandWithETag = command with { ETag = context.Request.Headers.IfMatch.FirstOrDefault() };
        return Results.Ok(await assessments.SaveStudentPlanFmcsProgressAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, goalId,
            schoolYears.GetCurrentSchoolYear(context.User), commandWithETag, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/writing-snapshots", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanWritingSnapshotsAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPost("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/writing-snapshots", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var form = await ReadWritingSnapshotFormAsync(context.Request, null, cancellationToken);
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.CreateStudentPlanWritingSnapshotAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            schoolYears.GetCurrentSchoolYear(context.User), form.Command, form.File, form.Image, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/writing-snapshots/{snapshotId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid snapshotId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var form = await ReadWritingSnapshotFormAsync(
            context.Request, context.Request.Headers.IfMatch.FirstOrDefault(), cancellationToken);
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.UpdateStudentPlanWritingSnapshotAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, snapshotId,
            schoolYears.GetCurrentSchoolYear(context.User), form.Command, form.File, form.Image, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapDelete("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/writing-snapshots/{snapshotId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid snapshotId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.DeleteStudentPlanWritingSnapshotAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, snapshotId,
            schoolYears.GetCurrentSchoolYear(context.User), context.Request.Headers.IfMatch.FirstOrDefault(), cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/writing-snapshots/{snapshotId:guid}/{contentKind}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid snapshotId,
    string contentKind,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    if (contentKind is not ("file" or "image"))
        return Results.NotFound();
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        var content = await assessments.GetStudentPlanWritingSnapshotContentAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, snapshotId,
            string.Equals(contentKind, "image", StringComparison.OrdinalIgnoreCase), cancellationToken);
        context.Response.Headers.CacheControl = "private, max-age=300";
        return string.Equals(contentKind, "image", StringComparison.OrdinalIgnoreCase)
            ? Results.File(content.Content, content.ContentType, enableRangeProcessing: false)
            : Results.File(content.Content, content.ContentType, content.FileName, enableRangeProcessing: false);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (HttpRequestException exception) when (exception.StatusCode == System.Net.HttpStatusCode.NotFound)
    {
        return Results.NotFound();
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/teacher-comments", async (
    Guid teacherSectionId, Guid studentId, Guid planId, HttpContext context,
    IDataverseAccessContextClient accessContextClient, IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles, CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanTeacherCommentsAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
});

app.MapPost("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/teacher-comments", async (
    Guid teacherSectionId, Guid studentId, Guid planId, StudentPlanTeacherCommentCommand command,
    HttpContext context, IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments, IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears, CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.CreateStudentPlanTeacherCommentAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            schoolYears.GetCurrentSchoolYear(context.User), command, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/teacher-comments/{commentId:guid}", async (
    Guid teacherSectionId, Guid studentId, Guid planId, Guid commentId,
    StudentPlanTeacherCommentCommand command, HttpContext context,
    IDataverseAccessContextClient accessContextClient, IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles, SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.UpdateStudentPlanTeacherCommentAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, commentId,
            schoolYears.GetCurrentSchoolYear(context.User),
            command with { ETag = context.Request.Headers.IfMatch.FirstOrDefault() }, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapDelete("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/teacher-comments/{commentId:guid}", async (
    Guid teacherSectionId, Guid studentId, Guid planId, Guid commentId, HttpContext context,
    IDataverseAccessContextClient accessContextClient, IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles, SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.DeleteStudentPlanTeacherCommentAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId, commentId,
            schoolYears.GetCurrentSchoolYear(context.User), context.Request.Headers.IfMatch.FirstOrDefault(), cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});


app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/interventions", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanInterventionsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/interventions/options", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanInterventionOptionsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
});

app.MapPost("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/interventions", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanInterventionCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.CreateStudentPlanInterventionAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            schoolYears.GetCurrentSchoolYear(context.User), command, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/interventions/{interventionId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid interventionId,
    StudentPlanInterventionCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        var commandWithETag = command with { ETag = context.Request.Headers.IfMatch.FirstOrDefault() };
        return Results.Ok(await assessments.UpdateStudentPlanInterventionAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            interventionId, schoolYears.GetCurrentSchoolYear(context.User), commandWithETag, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapDelete("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/interventions/{interventionId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid interventionId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.DeleteStudentPlanInterventionAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            interventionId, schoolYears.GetCurrentSchoolYear(context.User),
            context.Request.Headers.IfMatch.FirstOrDefault(), cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/signatures", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanSignaturesAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/signatures/options", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanSignatureOptionsAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
});

app.MapPost("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/signatures", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanSignatureCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.CreateStudentPlanSignatureAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            schoolYears.GetCurrentSchoolYear(context.User), command, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/signatures/order", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanSignatureOrderCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.ReorderStudentPlanSignaturesAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            schoolYears.GetCurrentSchoolYear(context.User), command, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/signatures/{signatureId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid signatureId,
    StudentPlanSignatureCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        var commandWithETag = command with { ETag = context.Request.Headers.IfMatch.FirstOrDefault() };
        return Results.Ok(await assessments.UpdateStudentPlanSignatureAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            signatureId, schoolYears.GetCurrentSchoolYear(context.User), commandWithETag, cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapDelete("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/signatures/{signatureId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid signatureId,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
        return Results.Problem(title: "Class Assignment access is not enabled for this user.", statusCode: 403);
    try
    {
        var role = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.DeleteStudentPlanSignatureAsync(
            accessContext, role.ActiveRole, role.IsDeveloper, teacherSectionId, studentId, planId,
            signatureId, schoolYears.GetCurrentSchoolYear(context.User),
            context.Request.Headers.IfMatch.FirstOrDefault(), cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 403);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: 409);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message, title = exception.Message });
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/coding", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanCodingAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/coding", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanCodingCommand command,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.UpdateStudentPlanCodingAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            command,
            context.Request.Headers.IfMatch.FirstOrDefault() ?? string.Empty,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/documents", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.GetStudentPlanDocumentsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
});

app.MapGet("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/documents/{documentId:guid}/content", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid documentId,
    bool download,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        var document = await assessments.GetStudentPlanDocumentContentAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            documentId,
            cancellationToken);
        context.Response.Headers.CacheControl = "private, no-store";
        context.Response.Headers.ContentSecurityPolicy =
            "default-src 'none'; frame-ancestors 'self';";
        context.Response.Headers.XContentTypeOptions = "nosniff";
        var mimeType = string.Equals(document.MimeType, "application/pdf", StringComparison.OrdinalIgnoreCase)
            ? document.MimeType
            : "application/pdf";
        return Results.File(
            document.Content,
            mimeType,
            download ? document.FileName : null,
            enableRangeProcessing: true);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/attendance", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanAttendanceCommand command,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.UpdateStudentPlanAttendanceAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            command,
            context.Request.Headers.IfMatch.FirstOrDefault() ?? string.Empty,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
});

app.MapPatch("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/signature-details", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    StudentPlanSignatureDetailsCommand command,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await assessments.UpdateStudentPlanSignatureDetailsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            command,
            context.Request.Headers.IfMatch.FirstOrDefault() ?? string.Empty,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
});

app.MapPut("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/modules/{moduleId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid moduleId,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        return Results.Ok(await assessments.AddStudentPlanModuleAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            moduleId,
            context.Request.Headers.IfMatch.FirstOrDefault() ?? string.Empty,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
});

app.MapDelete("/api/class-assignments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/plans/{planId:guid}/modules/{moduleId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid planId,
    Guid moduleId,
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
            title: "The signed-in user is not enabled for the FVSD Nexus Class Assignment workspace.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        return Results.Ok(await assessments.RemoveStudentPlanModuleAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            planId,
            moduleId,
            context.Request.Headers.IfMatch.FirstOrDefault() ?? string.Empty,
            cancellationToken));
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
});

app.MapGet("/api/assessments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/entry/tosrec/references", async (
    Guid teacherSectionId,
    Guid studentId,
    int period,
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
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        var options = await assessments.GetTosrecReferenceOptionsAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            period,
            cancellationToken);
        return Results.Ok(options);
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
});

app.MapPost("/api/assessments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/entry/tosrec", async (
    Guid teacherSectionId,
    Guid studentId,
    TosrecAssessmentCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        await assessments.CreateTosrecAssessmentAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            schoolYears.GetCurrentSchoolYear(context.User),
            command,
            cancellationToken);
        return Results.NoContent();
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
});

app.MapPatch("/api/assessments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/entry/tosrec/{assessmentId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid assessmentId,
    TosrecAssessmentCommand command,
    HttpContext context,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    IDevelopmentRoleService developmentRoles,
    SchoolYearSessionContext schoolYears,
    TimeProvider timeProvider,
    CancellationToken cancellationToken) =>
{
    var accessContext = await GetDataverseAccessContextAsync(context, accessContextClient, cancellationToken);
    if (accessContext is null || !accessContext.RoleRecordFound || !accessContext.PocEnabled)
    {
        return Results.Problem(
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        await assessments.UpdateTosrecAssessmentAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            assessmentId,
            schoolYears.GetCurrentSchoolYear(context.User),
            GetCurrentAssessmentPeriod(timeProvider),
            command,
            cancellationToken);
        return Results.NoContent();
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
    }
});

app.MapDelete("/api/assessments/teacher-sections/{teacherSectionId:guid}/students/{studentId:guid}/entry/tosrec/{assessmentId:guid}", async (
    Guid teacherSectionId,
    Guid studentId,
    Guid assessmentId,
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
            title: "The signed-in user is not enabled for FVSD Nexus assessment access.",
            statusCode: StatusCodes.Status403Forbidden);
    }

    try
    {
        var developmentContext = developmentRoles.GetContext(context);
        await assessments.DeleteTosrecAssessmentAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            teacherSectionId,
            studentId,
            assessmentId,
            context.Request.Headers["If-Match"].FirstOrDefault(),
            cancellationToken);
        return Results.NoContent();
    }
    catch (AssessmentWorkspaceAccessException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status403Forbidden);
    }
    catch (AssessmentWorkspaceConflictException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status409Conflict);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(title: exception.Message, statusCode: StatusCodes.Status400BadRequest);
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

    var normalizedRole = DevelopmentRoleNames.Normalize(change.Role);
    if (normalizedRole is null || !developmentRoles.TrySetRole(context, normalizedRole))
    {
        return Results.BadRequest(new { error = "The selected development role is not supported." });
    }

    return Results.Ok(new
    {
        activeDevelopmentRole = normalizedRole,
        rlsIdentity = context.User.Identity?.Name ?? "Signed-in FVSD user",
        rlsEvaluation = "Fabric evaluates the signed-in Entra identity"
    });
});

app.MapPost("/api/development/user", (
    DevelopmentUserChange change,
    HttpContext context,
    IDevelopmentRoleService developmentRoles) =>
{
    if (!developmentRoles.IsDeveloper(context.User))
    {
        return Results.Forbid();
    }

    if (!string.Equals(
        context.Request.Headers["X-FVSD-Development-Request"],
        "user-switcher",
        StringComparison.Ordinal))
    {
        return Results.BadRequest(new { error = "The user change must originate from the FVSD Nexus development controls." });
    }

    if (!developmentRoles.TrySetUserEmail(context, change.Email))
    {
        return Results.BadRequest(new { error = "Enter a valid user email address." });
    }

    return Results.Ok(new { activeDevelopmentUserEmail = change.Email.Trim().ToLowerInvariant() });
});

app.MapDelete("/api/development/user", (
    HttpContext context,
    IDevelopmentRoleService developmentRoles) =>
{
    if (!developmentRoles.IsDeveloper(context.User))
    {
        return Results.Forbid();
    }

    if (!string.Equals(
        context.Request.Headers["X-FVSD-Development-Request"],
        "user-switcher",
        StringComparison.Ordinal))
    {
        return Results.BadRequest(new { error = "The user change must originate from the FVSD Nexus development controls." });
    }

    return developmentRoles.TryClearSimulation(context)
        ? Results.NoContent()
        : Results.Forbid();
});

app.MapGet("/api/development/user-context", async (
    HttpContext context,
    IDevelopmentRoleService developmentRoles,
    IDataverseAccessContextClient dataverse,
    CancellationToken cancellationToken) =>
{
    var developmentContext = developmentRoles.GetContext(context);
    if (!developmentContext.IsDeveloper)
    {
        return Results.Forbid();
    }

    if (string.IsNullOrWhiteSpace(developmentContext.ActiveUserEmail))
    {
        return Results.BadRequest(new { error = "No development user preview is active." });
    }

    var accessContext = await dataverse.GetAccessContextAsync(
        developmentContext.ActiveUserEmail,
        null,
        cancellationToken);
    return Results.Ok(accessContext);
});

app.MapGet("/api/semantic-model/status", async (
    IPowerBiSemanticModelClient semanticModel,
    CancellationToken cancellationToken) =>
{
    var status = await semanticModel.CheckConnectionAsync(cancellationToken);
    return Results.Ok(status);
});

app.MapGet("/api/copilot/access", async (
    HttpContext context,
    bool? refresh,
    ICopilotAccessClient copilotAccess,
    CancellationToken cancellationToken) =>
{
    var status = await copilotAccess.GetStatusAsync(
        GetUserEmail(context.User),
        refresh == true,
        cancellationToken);
    context.Response.Headers.CacheControl = "no-store";
    return Results.Ok(status);
});

app.MapPost("/api/copilot/chat", async (
    HttpContext context,
    FoundryCopilotChatRequest request,
    IFoundryCopilotClient copilot,
    ICopilotAccessClient copilotAccess,
    IWorkIqHandoffStore handoffs,
    IOptions<FoundryCopilotOptions> options,
    IDevelopmentRoleService developmentRoles,
    IDataverseAccessContextClient accessContextClient,
    IDataverseAssessmentWorkspaceClient assessments,
    SchoolYearSessionContext schoolYears,
    CancellationToken cancellationToken) =>
{
    if (!options.Value.Enabled)
    {
        return Results.Problem(
            title: "The Nexus assistant is not enabled.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    if (string.IsNullOrWhiteSpace(request.Prompt) || request.Prompt.Length > 4000)
    {
        return Results.BadRequest(new { error = "Enter a Copilot prompt between 1 and 4,000 characters." });
    }

    if (request.AssessmentPeriod is < 1 or > 3)
    {
        return Results.BadRequest(new { error = "The selected Assessment Period is not supported." });
    }

    var developmentContext = developmentRoles.GetContext(context);
    var accessContext = await GetDataverseAccessContextAsync(
        context,
        accessContextClient,
        cancellationToken);
    if (accessContext is null
        || !accessContext.RoleRecordFound
        || !accessContext.PocEnabled
        || string.Equals(accessContext.EffectiveRole, "No Access", StringComparison.OrdinalIgnoreCase))
    {
        return Results.Forbid();
    }

    try
    {
        var dashboard = await assessments.GetStudentScreenersDashboardAsync(
            accessContext,
            developmentContext.ActiveRole,
            developmentContext.IsDeveloper,
            request.SchoolId,
            request.SectionGroup,
            request.CourseNumber,
            request.TeacherId,
            request.AssessmentPeriod,
            schoolYears.GetCurrentSchoolYear(context.User),
            cancellationToken);
        var selectedPeriod = dashboard.Periods.FirstOrDefault(item => item.Period == request.AssessmentPeriod)
            ?? throw new ArgumentException("The selected Assessment Period is not available.");

        const int accountabilityLimit = 50;
        const int missingStudentLimit = 100;
        var accountability = dashboard.Accountability
            .Take(accountabilityLimit)
            .Select(item => new FoundryCopilotAccountabilityContext(
                item.Label,
                item.Expected,
                item.Completed,
                item.Missing,
                item.CompletionRate))
            .ToArray();
        var missingStudents = selectedPeriod.Missing
            .Take(missingStudentLimit)
            .Select(student => new FoundryCopilotMissingStudentContext(
                request.ObfuscateStudentData
                    ? student.ObfuscatedName ?? student.Name
                    : student.Name,
                request.ObfuscateStudentData
                    ? student.ObfuscatedAsn ?? student.Asn
                    : student.Asn,
                student.Grade))
            .ToArray();
        var school = request.SchoolId is Guid selectedSchoolId
            ? dashboard.Schools.FirstOrDefault(item => item.Id == selectedSchoolId)?.Name
            : null;
        var completionRate = selectedPeriod.Expected == 0
            ? 0
            : (int)Math.Round(selectedPeriod.Completed * 100d / selectedPeriod.Expected);
        // Copilot entitlement and delegated execution always belong to the real signed-in
        // identity. A development preview user may only change the governed Nexus data scope.
        var userEmail = GetUserEmail(context.User);
        var prompt = new FoundryCopilotPrompt(
            request.Prompt,
            request.ConversationId,
            dashboard.Role,
            userEmail,
            dashboard.ScopeLabel,
            school,
            dashboard.AssessmentType,
            selectedPeriod.Label,
            selectedPeriod.Expected,
            selectedPeriod.Completed,
            Math.Max(0, selectedPeriod.Expected - selectedPeriod.Completed),
            completionRate,
            accountability,
            missingStudents,
            Math.Max(0, dashboard.Accountability.Count - accountability.Length),
            Math.Max(0, selectedPeriod.Missing.Count - missingStudents.Length));

        if (IsWorkIqActionRequest(request.Prompt))
        {
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                return Results.Forbid();
            }

            var entitlement = await copilotAccess.GetStatusAsync(userEmail, false, cancellationToken);
            if (!string.Equals(entitlement.LicenseCheckStatus, "Connected", StringComparison.OrdinalIgnoreCase))
            {
                return Results.Ok(new FoundryCopilotReply(
                    "Nexus could not confirm your Microsoft 365 Copilot entitlement at sign-in. Copilot Chat remains available, but Work IQ actions are disabled until the access check succeeds.",
                    request.ConversationId ?? Guid.NewGuid().ToString("N"),
                    null,
                    HandoffStatus: "UnableToConfirm",
                    HandoffTitle: "Work IQ access not confirmed",
                    HandoffMessage: entitlement.Message));
            }

            if (!entitlement.HasMicrosoft365Copilot)
            {
                return Results.Ok(new FoundryCopilotReply(
                    "This action requires a Microsoft 365 Copilot licence for your signed-in account. Copilot Chat remains available for questions and summaries.",
                    request.ConversationId ?? Guid.NewGuid().ToString("N"),
                    null,
                    HandoffStatus: "NotLicensed",
                    HandoffTitle: "Work IQ action unavailable",
                    HandoffMessage: entitlement.Message));
            }

            if (!entitlement.WorkIqAvailable)
            {
                return Results.Ok(new FoundryCopilotReply(
                    "Your Microsoft 365 Copilot licence is active, but Work IQ actions require an assigned Work-Based Billing policy.",
                    request.ConversationId ?? Guid.NewGuid().ToString("N"),
                    null,
                    HandoffStatus: "WorkBasedBillingPolicyRequired",
                    HandoffTitle: "Work-Based Billing policy required",
                    HandoffMessage: entitlement.Message));
            }

            var review = await copilot.SendAsync(prompt, cancellationToken);
            var proposal = handoffs.Create(userEmail, prompt, BuildWorkIqTitle(request.Prompt));
            return Results.Ok(review with
            {
                HandoffId = proposal.Id,
                HandoffStatus = "RequiresConfirmation",
                HandoffTitle = proposal.Title,
                HandoffMessage = "Everything is ready. Review the proposed Work IQ action, then confirm it to run using your signed-in Microsoft 365 account.",
                HandoffExpiresAtUtc = proposal.ExpiresAtUtc
            });
        }

        var reply = await copilot.SendAsync(prompt, cancellationToken);
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(reply);
    }
    catch (AssessmentWorkspaceAccessException)
    {
        return Results.Forbid();
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
    catch (AuthenticationFailedException exception)
    {
        app.Logger.LogWarning(exception, "Managed Foundry authentication failed for the Nexus assistant.");
        return Results.Problem(
            title: "The Nexus assistant could not authenticate to Microsoft Foundry.",
            detail: "Verify the local Azure sign-in or the App Service managed identity assignment.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception exception) when (exception is HttpRequestException or JsonException)
    {
        app.Logger.LogWarning(exception, "The managed Foundry agent request failed.");
        return Results.Problem(
            title: "The Nexus assistant could not complete the request.",
            detail: "The managed Foundry service did not return a usable response.",
            statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapPost("/api/copilot/handoff/{handoffId:guid}/confirm", async (
    HttpContext context,
    Guid handoffId,
    IWorkIqHandoffStore handoffs,
    ICopilotAccessClient copilotAccess,
    IFoundryCopilotClient copilot,
    IOptions<FoundryCopilotOptions> options,
    ITokenAcquisition tokenAcquisition,
    CancellationToken cancellationToken) =>
{
    var userEmail = GetUserEmail(context.User);
    if (string.IsNullOrWhiteSpace(userEmail)
        || !handoffs.TryGet(handoffId, userEmail, out var pending)
        || pending is null)
    {
        return Results.NotFound(new { error = "This Work IQ handoff is unavailable or has expired." });
    }

    // Use the signed-in entitlement established by the opening access gate. The
    // short-lived server cache prevents every Work IQ action from repeating Graph.
    var entitlement = await copilotAccess.GetStatusAsync(userEmail, false, cancellationToken);
    if (!string.Equals(entitlement.LicenseCheckStatus, "Connected", StringComparison.OrdinalIgnoreCase))
    {
        return Results.Json(new { error = "Microsoft 365 Copilot entitlement could not be confirmed at sign-in." }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    if (!entitlement.HasMicrosoft365Copilot)
    {
        return Results.Json(new { error = "A Microsoft 365 Copilot licence is required to run this Work IQ action." }, statusCode: StatusCodes.Status403Forbidden);
    }

    if (!entitlement.WorkIqAvailable)
    {
        return Results.Json(new { error = "The Work-Based Billing policy is not assigned to your signed-in account." }, statusCode: StatusCodes.Status403Forbidden);
    }

    var delegatedToken = await tokenAcquisition.GetAccessTokenForUserAsync([options.Value.Scope]);
    if (!handoffs.TryTake(handoffId, userEmail, out var proposal) || proposal is null)
    {
        return Results.NotFound(new { error = "This Work IQ handoff is unavailable or has expired." });
    }

    var reply = await copilot.SendDelegatedAsync(
        proposal.Prompt with { ConversationId = null, AllowWorkIqExecution = true },
        delegatedToken,
        cancellationToken);
    // Never report completion from the agent's prose alone; require tool evidence.
    var completed = reply.Outcome?.HasCompletedToolEvidence == true;
    return Results.Ok(reply with
    {
        HandoffId = handoffId,
        HandoffStatus = completed ? "Completed" : "NotConfirmed",
        HandoffTitle = proposal.Title,
        HandoffMessage = completed
            ? "The confirmed Work IQ action was run as your signed-in identity."
            : "The assistant finished without evidence that the Microsoft 365 action was carried out. Check Outlook before trying again."
    });
});

app.MapPost("/api/copilot/handoff/{handoffId:guid}/cancel", (
    HttpContext context,
    Guid handoffId,
    IWorkIqHandoffStore handoffs) =>
{
    var userEmail = GetUserEmail(context.User);
    if (string.IsNullOrWhiteSpace(userEmail)
        || !handoffs.TryTake(handoffId, userEmail, out var proposal)
        || proposal is null)
    {
        return Results.NotFound(new { error = "This Work IQ handoff is unavailable or has expired." });
    }

    return Results.Ok(new
    {
        handoffId,
        handoffStatus = "Cancelled",
        handoffTitle = proposal.Title,
        message = "The Work IQ action was cancelled. No action was run."
    });
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

app.MapFallback("/api/{**path}", () => Results.Problem(
    title: "The requested API endpoint is not available in this running version.",
    statusCode: StatusCodes.Status404NotFound)).AllowAnonymous();
app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();

static bool IsWorkIqActionRequest(string prompt)
{
    var value = prompt.ToLowerInvariant();
    string[] actionWords = ["create", "add", "send", "schedule", "assign", "update", "delete", "cancel", "post", "publish", "submit"];
    string[] workTargets = ["task", "planner", "email", "message", "meeting", "calendar", "event", "document", "file", "team", "channel", "approval", "reminder"];
    return actionWords.Any(value.Contains) && workTargets.Any(value.Contains);
}

static string BuildWorkIqTitle(string prompt)
{
    var title = string.Join(' ', prompt.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    return title.Length <= 120 ? title : $"{title[..117]}...";
}

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

static int? GetCurrentAssessmentPeriod(TimeProvider timeProvider)
{
    TimeZoneInfo mountainTime;
    try
    {
        mountainTime = TimeZoneInfo.FindSystemTimeZoneById("America/Edmonton");
    }
    catch (TimeZoneNotFoundException)
    {
        mountainTime = TimeZoneInfo.FindSystemTimeZoneById("Mountain Standard Time");
    }

    var localDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), mountainTime).DateTime);
    return DataverseAssessmentWorkspaceClient.GetAssessmentPeriod(localDate);
}

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
    var developmentContext = context.RequestServices
        .GetRequiredService<IDevelopmentRoleService>()
        .GetContext(context);
    var email = developmentContext.ActiveUserEmail ?? GetUserEmail(context.User);
    if (string.IsNullOrWhiteSpace(email))
    {
        return null;
    }

    var accessContext = await accessContextClient.GetAccessContextAsync(
        email,
        developmentContext.ActiveUserEmail is null ? GetEntraObjectId(context.User) : null,
        cancellationToken);

    return developmentContext.ActiveUserEmail is not null && accessContext.RoleRecordFound
        ? accessContext with { PocEnabled = true }
        : accessContext;
}

static async Task<(
    StudentPlanWritingSnapshotCommand Command,
    StudentPlanWritingSnapshotUpload? File,
    StudentPlanWritingSnapshotUpload? Image)> ReadWritingSnapshotFormAsync(
        HttpRequest request,
        string? eTag,
        CancellationToken cancellationToken)
{
    if (!request.HasFormContentType)
    {
        throw new ArgumentException("Writing Snapshot details must be submitted as form data.");
    }

    var form = await request.ReadFormAsync(cancellationToken);
    if (!DateOnly.TryParseExact(
        form["commentDate"].FirstOrDefault(),
        "yyyy-MM-dd",
        System.Globalization.CultureInfo.InvariantCulture,
        System.Globalization.DateTimeStyles.None,
        out var commentDate))
    {
        throw new ArgumentException("Enter a valid Date of Comment.");
    }

    var description = form["evidenceOfDevelopment"].FirstOrDefault() ?? string.Empty;
    var includeInExport = bool.TryParse(
        form["includeInExport"].FirstOrDefault(), out var include) && include;
    var file = await ReadWritingSnapshotUploadAsync(
        form.Files.GetFile("writingSampleFile"), 20 * 1024 * 1024, cancellationToken);
    var image = await ReadWritingSnapshotUploadAsync(
        form.Files.GetFile("writingSampleImage"), 8 * 1024 * 1024, cancellationToken);
    return (
        new StudentPlanWritingSnapshotCommand(commentDate, description, includeInExport, eTag),
        file,
        image);
}

static async Task<StudentPlanWritingSnapshotUpload?> ReadWritingSnapshotUploadAsync(
    IFormFile? file,
    long maximumBytes,
    CancellationToken cancellationToken)
{
    if (file is null)
    {
        return null;
    }
    if (file.Length <= 0 || file.Length > maximumBytes)
    {
        throw new ArgumentException(
            $"{file.FileName} must be larger than zero and no more than {maximumBytes / 1024 / 1024} MB.");
    }

    await using var stream = new MemoryStream((int)file.Length);
    await file.CopyToAsync(stream, cancellationToken);
    return new StudentPlanWritingSnapshotUpload(
        Path.GetFileName(file.FileName),
        string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
        stream.ToArray());
}

public partial class Program;
