using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FVSDNexus.Api.Tests;

public sealed class DevelopmentRoleEndpointTests : IClassFixture<DevelopmentRoleEndpointTests.RoleWebApplicationFactory>
{
    private const string DeveloperObjectId = "0cf3f9d4-2ff0-40f6-ba39-4eec8f4f62d5";
    private readonly HttpClient _client;

    public DevelopmentRoleEndpointTests(RoleWebApplicationFactory factory)
    {
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true
        });
    }

    [Fact]
    public async Task Developer_can_change_role_through_the_switcher_contract()
    {
        var request = CreateRoleRequest(DeveloperObjectId, "Teacher");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        Assert.Contains(cookies, value => value.Contains("fvsd-insights-development-role=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Non_developer_is_forbidden_even_with_a_valid_role()
    {
        var request = CreateRoleRequest("11111111-1111-1111-1111-111111111111", "Executive");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Developer_cannot_select_an_unknown_role()
    {
        var request = CreateRoleRequest(DeveloperObjectId, "Tenant Administrator");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Role_change_requires_the_same_origin_switcher_header()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/development/role")
        {
            Content = JsonContent.Create(new { role = "Teacher" })
        };
        request.Headers.Add(TestAuthenticationHandler.ObjectIdHeader, DeveloperObjectId);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task User_profile_prefers_the_entra_display_name_over_the_upn()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/me");
        request.Headers.Add(TestAuthenticationHandler.ObjectIdHeader, DeveloperObjectId);

        var response = await _client.SendAsync(request);
        var profile = await response.Content.ReadFromJsonAsync<UserProfileResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Test Display Name", profile?.Name);
        Assert.Equal("test@fvsd.ab.ca", profile?.Email);
    }

    private static HttpRequestMessage CreateRoleRequest(string objectId, string role)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/development/role")
        {
            Content = JsonContent.Create(new { role })
        };
        request.Headers.Add(TestAuthenticationHandler.ObjectIdHeader, objectId);
        request.Headers.Add("X-FVSD-Development-Request", "role-switcher");
        return request;
    }

    public sealed class RoleWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseSetting("AzureAd:ClientId", "00000000-0000-0000-0000-000000000001");
            builder.UseSetting("AzureAd:ClientSecret", "test-only-secret");
            builder.ConfigureTestServices(services =>
            {
                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthenticationHandler.TestScheme;
                    options.DefaultChallengeScheme = TestAuthenticationHandler.TestScheme;
                }).AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                    TestAuthenticationHandler.TestScheme,
                    _ => { });
            });
        }
    }

    private sealed class TestAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        public const string TestScheme = "DevelopmentRoleTests";
        public const string ObjectIdHeader = "X-Test-Object-Id";

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var objectId = Request.Headers[ObjectIdHeader].ToString();
            if (string.IsNullOrWhiteSpace(objectId))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var identity = new ClaimsIdentity(
            [
                new Claim("oid", objectId),
                new Claim("name", "Test Display Name"),
                new Claim(ClaimTypes.Name, "test@fvsd.ab.ca"),
                new Claim("preferred_username", "test@fvsd.ab.ca")
            ], TestScheme);
            var principal = new ClaimsPrincipal(identity);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, TestScheme)));
        }
    }

    private sealed record UserProfileResponse(string Name, string Email);
}
