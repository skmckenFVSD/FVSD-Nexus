using FVSDNexus.Api.Authentication;
using FVSDNexus.Api.CopilotAccess;
using Microsoft.AspNetCore.Http;

namespace FVSDNexus.Api.Tests;

public sealed class AdminConsentTests
{
    [Fact]
    public void BuildConsentUri_TargetsTenantV2AdminConsentWithEncodedParameters()
    {
        var uri = AdminConsent.BuildConsentUri(
            "https://login.microsoftonline.com/",
            "42242eff-faf6-4ccd-aea3-e2c4479f8ccb",
            "b9a8631e-8e03-4204-8d7e-a487bfe33b2f",
            new Uri("http://localhost:5173/api/auth/admin-consent/callback"),
            ["https://graph.microsoft.com/User.Read", " https://graph.microsoft.com/User.Read "],
            "ABC123");

        Assert.Equal(
            "https://login.microsoftonline.com/42242eff-faf6-4ccd-aea3-e2c4479f8ccb/v2.0/adminconsent"
                + "?client_id=b9a8631e-8e03-4204-8d7e-a487bfe33b2f"
                + "&scope=https%3A%2F%2Fgraph.microsoft.com%2FUser.Read"
                + "&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fapi%2Fauth%2Fadmin-consent%2Fcallback"
                + "&state=ABC123",
            uri.AbsoluteUri);
    }

    [Fact]
    public void BuildConsentUri_RejectsEmptyScopes()
    {
        Assert.Throws<ArgumentException>(() => AdminConsent.BuildConsentUri(
            "https://login.microsoftonline.com/",
            "tenant",
            "client",
            new Uri("http://localhost:5173/api/auth/admin-consent/callback"),
            ["  "],
            "state"));
    }

    [Fact]
    public void ResolveRedirectUri_UsesFrontendOriginWhenConfigured()
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "http";
        context.Request.Host = new HostString("localhost", 5029);

        var uri = AdminConsent.ResolveRedirectUri("http://localhost:5173/", context.Request);

        Assert.Equal("http://localhost:5173/api/auth/admin-consent/callback", uri.AbsoluteUri);
    }

    [Fact]
    public void ResolveRedirectUri_FallsBackToRequestOrigin()
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "https";
        context.Request.Host = new HostString("nexus.example.org");

        var uri = AdminConsent.ResolveRedirectUri(null, context.Request);

        Assert.Equal("https://nexus.example.org/api/auth/admin-consent/callback", uri.AbsoluteUri);
    }

    [Fact]
    public void CopilotAccessOptions_DefaultsToLeastPrivilegeGraphScope()
    {
        Assert.Equal("https://graph.microsoft.com/User.Read", new CopilotAccessOptions().GraphScope);
    }
}
