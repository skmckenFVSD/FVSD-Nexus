using System.Security.Claims;
using FVSDNexus.Api.DevelopmentRoles;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

namespace FVSDNexus.Api.Tests;

public sealed class DevelopmentRoleServiceTests
{
    private const string DeveloperObjectId = "0cf3f9d4-2ff0-40f6-ba39-4eec8f4f62d5";

    [Fact]
    public void Developer_can_persist_a_supported_role_in_a_protected_cookie()
    {
        var service = CreateService();
        var writeContext = CreateContext(DeveloperObjectId);

        var changed = service.TrySetRole(writeContext, DevelopmentRoleNames.Teacher);

        Assert.True(changed);
        var cookie = SetCookieHeaderValue.Parse(writeContext.Response.Headers.SetCookie.ToString());
        Assert.True(cookie.HttpOnly);
        Assert.True(cookie.Secure);
        Assert.Equal(Microsoft.Net.Http.Headers.SameSiteMode.Strict, cookie.SameSite);

        var readContext = CreateContext(DeveloperObjectId);
        readContext.Request.Headers.Cookie = $"{cookie.Name}={cookie.Value}";
        var roleContext = service.GetContext(readContext);

        Assert.True(roleContext.IsDeveloper);
        Assert.Equal(DevelopmentRoleNames.Teacher, roleContext.ActiveRole);
        Assert.Equal(DevelopmentRoleNames.All, roleContext.AvailableRoles);
    }

    [Fact]
    public void Non_developer_cannot_use_a_valid_development_role_cookie()
    {
        var service = CreateService();
        var developerContext = CreateContext(DeveloperObjectId);
        Assert.True(service.TrySetRole(developerContext, DevelopmentRoleNames.Executive));
        var cookie = SetCookieHeaderValue.Parse(developerContext.Response.Headers.SetCookie.ToString());

        var otherUserContext = CreateContext("11111111-1111-1111-1111-111111111111");
        otherUserContext.Request.Headers.Cookie = $"{cookie.Name}={cookie.Value}";
        var roleContext = service.GetContext(otherUserContext);

        Assert.False(roleContext.IsDeveloper);
        Assert.Null(roleContext.ActiveRole);
        Assert.Empty(roleContext.AvailableRoles);
        Assert.False(service.TrySetRole(otherUserContext, DevelopmentRoleNames.Teacher));
    }

    [Fact]
    public void Unsupported_role_is_rejected()
    {
        var service = CreateService();
        var context = CreateContext(DeveloperObjectId);

        Assert.False(service.TrySetRole(context, "Fabric Administrator"));
        Assert.False(context.Response.Headers.ContainsKey(HeaderNames.SetCookie));
    }

    [Fact]
    public void Tampered_cookie_falls_back_to_the_configured_default()
    {
        var service = CreateService();
        var context = CreateContext(DeveloperObjectId);
        context.Request.Headers.Cookie = $"{DevelopmentRoleService.CookieName}=not-a-protected-value";

        var roleContext = service.GetContext(context);

        Assert.Equal(DevelopmentRoleNames.Executive, roleContext.ActiveRole);
    }

    private static DevelopmentRoleService CreateService()
    {
        var options = Options.Create(new DevelopmentRoleOptions
        {
            DeveloperObjectIds = [DeveloperObjectId],
            DefaultRole = DevelopmentRoleNames.Executive
        });
        return new DevelopmentRoleService(options, new EphemeralDataProtectionProvider());
    }

    private static DefaultHttpContext CreateContext(string objectId)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim("oid", objectId),
            new Claim(ClaimTypes.Name, "Test FVSD user")
        ], "Test");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        context.Request.Scheme = "https";
        return context;
    }
}
