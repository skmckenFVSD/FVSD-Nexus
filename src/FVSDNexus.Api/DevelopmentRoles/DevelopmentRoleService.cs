using System.Security.Claims;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;

namespace FVSDNexus.Api.DevelopmentRoles;

public sealed class DevelopmentRoleService : IDevelopmentRoleService
{
    internal const string CookieName = "fvsd-insights-development-role";
    private const string ObjectIdentifierClaim = "http://schemas.microsoft.com/identity/claims/objectidentifier";
    private const string ShortObjectIdentifierClaim = "oid";
    private const string RlsEvaluation = "Fabric evaluates the signed-in Entra identity";

    private readonly DevelopmentRoleOptions _options;
    private readonly IDataProtector _protector;
    private readonly HashSet<string> _developerObjectIds;

    public DevelopmentRoleService(
        IOptions<DevelopmentRoleOptions> options,
        IDataProtectionProvider dataProtectionProvider)
    {
        _options = options.Value;
        _protector = dataProtectionProvider.CreateProtector("FVSDNexus.DevelopmentRole.v1");
        _developerObjectIds = new HashSet<string>(
            _options.DeveloperObjectIds.Where(value => !string.IsNullOrWhiteSpace(value)),
            StringComparer.OrdinalIgnoreCase);
    }

    public DevelopmentRoleContext GetContext(HttpContext context)
    {
        var user = context.User;
        var rlsIdentity = user.Identity?.Name
            ?? user.FindFirst("preferred_username")?.Value
            ?? "Signed-in FVSD user";

        if (!IsDeveloper(user))
        {
            return new DevelopmentRoleContext(false, null, [], rlsIdentity, RlsEvaluation);
        }

        var activeRole = ReadProtectedRole(context.Request.Cookies[CookieName]);
        if (!DevelopmentRoleNames.IsValid(activeRole))
        {
            activeRole = DevelopmentRoleNames.IsValid(_options.DefaultRole)
                ? _options.DefaultRole
                : DevelopmentRoleNames.Executive;
        }

        return new DevelopmentRoleContext(
            true,
            activeRole,
            DevelopmentRoleNames.All,
            rlsIdentity,
            RlsEvaluation);
    }

    public bool IsDeveloper(ClaimsPrincipal user)
    {
        var objectId = user.FindFirst(ObjectIdentifierClaim)?.Value
            ?? user.FindFirst(ShortObjectIdentifierClaim)?.Value;

        return objectId is not null && _developerObjectIds.Contains(objectId);
    }

    public bool TrySetRole(HttpContext context, string? role)
    {
        if (!IsDeveloper(context.User) || !DevelopmentRoleNames.IsValid(role))
        {
            return false;
        }

        context.Response.Cookies.Append(
            CookieName,
            _protector.Protect(role!),
            new CookieOptions
            {
                HttpOnly = true,
                Secure = context.Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                IsEssential = true,
                MaxAge = TimeSpan.FromDays(30),
                Path = "/"
            });

        return true;
    }

    private string? ReadProtectedRole(string? protectedRole)
    {
        if (string.IsNullOrWhiteSpace(protectedRole))
        {
            return null;
        }

        try
        {
            return _protector.Unprotect(protectedRole);
        }
        catch (Exception exception) when (exception is System.Security.Cryptography.CryptographicException or FormatException)
        {
            return null;
        }
    }
}
