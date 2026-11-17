using FVSDNexus.Api.Authentication;

namespace FVSDNexus.Api.Tests;

public sealed class AuthenticationRedirectsTests
{
    [Fact]
    public void Development_redirect_returns_to_the_frontend_origin()
    {
        var redirect = AuthenticationRedirects.Resolve(
            "http://localhost:5173/",
            "/?shell-preview");

        Assert.Equal("http://localhost:5173/?shell-preview", redirect);
    }

    [Fact]
    public void Production_same_origin_redirect_remains_relative()
    {
        var redirect = AuthenticationRedirects.Resolve("/", "/?shell-preview");

        Assert.Equal("/?shell-preview", redirect);
    }

    [Theory]
    [InlineData("https://malicious.example/")]
    [InlineData("//malicious.example/")]
    [InlineData("/\\malicious.example/")]
    public void External_return_urls_fall_back_to_the_configured_frontend(string returnUrl)
    {
        var redirect = AuthenticationRedirects.Resolve(
            "http://localhost:5173/",
            returnUrl);

        Assert.Equal("http://localhost:5173/", redirect);
    }
}
