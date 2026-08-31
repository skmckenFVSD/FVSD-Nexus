using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace FVSDNexus.Api.Tests;

public sealed class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("AzureAd:ClientId", "00000000-0000-0000-0000-000000000001");
            builder.UseSetting("AzureAd:ClientSecret", "test-only-secret");
        }).CreateClient();
    }

    [Fact]
    public async Task Health_endpoint_is_available_without_sign_in()
    {
        var response = await _client.GetAsync("/health");
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("healthy", body?.Status);
        Assert.Equal("FVSD Nexus", body?.Service);
    }

    private sealed record HealthResponse(string Status, string Service);
}
