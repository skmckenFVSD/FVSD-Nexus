using Azure.Monitor.OpenTelemetry.AspNetCore;
using FVSDNexus.Api.DevelopmentRoles;
using FVSDNexus.Api.SemanticModel;
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

builder.Services.AddOptions<DevelopmentRoleOptions>()
    .Bind(builder.Configuration.GetSection(DevelopmentRoleOptions.SectionName))
    .ValidateDataAnnotations()
    .Validate(options => DevelopmentRoleNames.IsValid(options.DefaultRole), "The default development role is not supported.")
    .ValidateOnStart();

builder.Services.AddSingleton<IDevelopmentRoleService, DevelopmentRoleService>();

builder.Services
    .AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"))
    .EnableTokenAcquisitionToCallDownstreamApi(
        [builder.Configuration["FabricSemanticModel:Scope"]!])
    .AddInMemoryTokenCaches();

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

if (!string.IsNullOrWhiteSpace(builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]))
{
    builder.Services.AddOpenTelemetry()
        .UseAzureMonitor()
        .WithTracing(tracing => tracing.AddSource(PowerBiSemanticModelClient.ActivitySourceName));
}

builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
var postAuthenticationRedirect = builder.Configuration["Frontend:BaseUrl"] ?? "/";

app.UseExceptionHandler();
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

app.MapGet("/api/me", (HttpContext context, IDevelopmentRoleService developmentRoles) =>
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
        rlsEvaluation = roleContext.RlsEvaluation
    });
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

public partial class Program;
