using System.Security.Claims;

namespace FVSDNexus.Api.DevelopmentRoles;

public interface IDevelopmentRoleService
{
    DevelopmentRoleContext GetContext(HttpContext context);
    bool IsDeveloper(ClaimsPrincipal user);
    bool TrySetRole(HttpContext context, string? role);
}
