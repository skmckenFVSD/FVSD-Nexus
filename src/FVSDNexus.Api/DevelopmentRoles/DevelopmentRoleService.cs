using System.Security.Claims;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;

namespace FVSDNexus.Api.DevelopmentRoles;

public sealed class DevelopmentRoleService : IDevelopmentRoleService
{
    internal const string CookieName = "fvsd-insights-development-role";
    internal const string UserCookieName = "fvsd-nexus-development-user";
    private const string ObjectIdentifierClaim = "http://schemas.microsoft.com/identity/claims/objectidentifier";
    private const string ShortObjectIdentifierClaim = "oid";
    private const string RlsEvaluation = "Fabric evaluates the signed-in Entra identity";

    private readonly DevelopmentRoleOptions _options;
    private readonly IDataProtector _protector;
    private readonly IDataProtector _userProtector;
    private readonly HashSet<string> _developerObjectIds;

    public DevelopmentRoleService(
        IOptions<DevelopmentRoleOptions> options,
        IDataProtectionProvider dataProtectionProvider)
    {
        _options = options.Value;
        _protector = dataProtectionProvider.CreateProtector("FVSDNexus.DevelopmentRole.v1");
        _userProtector = dataProtectionProvider.CreateProtector("FVSDNexus.DevelopmentUser.v1");
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

        var activeUserEmail = ReadProtectedValue(
            context.Request.Cookies[UserCookieName],
            _userProtector);

        // A user preview must be evaluated as that user, including the role resolved from
        // Dataverse. A role-only simulation is useful when no user preview is active, but it
        // must never broaden or replace the selected user's governed scope.
        var protectedRole = context.Request.Cookies[CookieName];
        var activeRole = activeUserEmail is not null || string.IsNullOrWhiteSpace(protectedRole)
            ? null
            : DevelopmentRoleNames.Normalize(ReadProtectedRole(protectedRole))
                ?? DevelopmentRoleNames.Normalize(_options.DefaultRole)
                ?? DevelopmentRoleNames.Executive;

        return new DevelopmentRoleContext(
            true,
            activeRole,
            DevelopmentRoleNames.All,
            rlsIdentity,
            RlsEvaluation,
            activeUserEmail);
    }

    public bool IsDeveloper(ClaimsPrincipal user)
    {
        var objectId = user.FindFirst(ObjectIdentifierClaim)?.Value
            ?? user.FindFirst(ShortObjectIdentifierClaim)?.Value;

        return objectId is not null && _developerObjectIds.Contains(objectId);
    }

    public bool TrySetRole(HttpContext context, string? role)
    {
        var normalizedRole = DevelopmentRoleNames.Normalize(role);
        if (!IsDeveloper(context.User) || normalizedRole is null)
        {
            return false;
        }

        context.Response.Cookies.Append(
            CookieName,
            _protector.Protect(normalizedRole),
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

    public bool TrySetUserEmail(HttpContext context, string? email)
    {
        if (!IsDeveloper(context.User) || !IsValidEmail(email))
        {
            return false;
        }

        var normalizedEmail = email!.Trim().ToLowerInvariant();
        context.Response.Cookies.Append(
            UserCookieName,
            _userProtector.Protect(normalizedEmail),
            CreateCookieOptions(context, TimeSpan.FromHours(8)));
        return true;
    }

    public bool TryClearUserEmail(HttpContext context)
    {
        if (!IsDeveloper(context.User))
        {
            return false;
        }

        context.Response.Cookies.Delete(
            UserCookieName,
            CreateCookieOptions(context, null));
        return true;
    }

    public bool TryClearSimulation(HttpContext context)
    {
        if (!IsDeveloper(context.User))
        {
            return false;
        }

        var expiredCookie = CreateCookieOptions(context, null);
        context.Response.Cookies.Delete(UserCookieName, expiredCookie);
        context.Response.Cookies.Delete(CookieName, expiredCookie);
        return true;
    }

    private string? ReadProtectedRole(string? protectedRole)
        => ReadProtectedValue(protectedRole, _protector);

    private static string? ReadProtectedValue(string? protectedValue, IDataProtector protector)
    {
        if (string.IsNullOrWhiteSpace(protectedValue))
        {
            return null;
        }

        try
        {
            return protector.Unprotect(protectedValue);
        }
        catch (Exception exception) when (exception is System.Security.Cryptography.CryptographicException or FormatException)
        {
            return null;
        }
    }

    private static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254)
        {
            return false;
        }

        try
        {
            var address = new System.Net.Mail.MailAddress(email.Trim());
            return string.Equals(address.Address, email.Trim(), StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static CookieOptions CreateCookieOptions(HttpContext context, TimeSpan? maxAge) => new()
    {
        HttpOnly = true,
        Secure = context.Request.IsHttps,
        SameSite = SameSiteMode.Strict,
        IsEssential = true,
        MaxAge = maxAge,
        Path = "/"
    };
}
