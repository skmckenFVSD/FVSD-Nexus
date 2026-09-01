using System.Security.Claims;

namespace FVSDNexus.Api.SessionContext;

internal sealed class SchoolYearSessionContext(TimeProvider timeProvider)
{
    internal const string ClaimType = "fvsd:current_school_year";
    private static readonly TimeZoneInfo SchoolDivisionTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("America/Edmonton");

    public string GetCurrentSchoolYear(ClaimsPrincipal principal)
    {
        return principal.FindFirst(ClaimType)?.Value ?? CreateCurrentSchoolYear();
    }

    public void EnsureCurrentSchoolYearClaim(ClaimsPrincipal? principal)
    {
        if (principal is null || principal.HasClaim(claim => claim.Type == ClaimType))
        {
            return;
        }

        if (principal.Identity is ClaimsIdentity identity)
        {
            identity.AddClaim(new Claim(ClaimType, CreateCurrentSchoolYear()));
        }
    }

    internal static string Calculate(DateOnly currentDate)
    {
        var startingYear = currentDate.Month is >= 1 and < 8
            ? currentDate.Year - 1
            : currentDate.Year;

        return $"{startingYear} / {startingYear + 1}";
    }

    private string CreateCurrentSchoolYear()
    {
        var localNow = TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), SchoolDivisionTimeZone);
        return Calculate(DateOnly.FromDateTime(localNow.DateTime));
    }
}
