using FVSDNexus.Api.SessionContext;
using System.Security.Claims;

namespace FVSDNexus.Api.Tests;

public sealed class SchoolYearSessionContextTests
{
    [Theory]
    [InlineData(2026, 1, 1, "2025 / 2026")]
    [InlineData(2026, 7, 31, "2025 / 2026")]
    [InlineData(2026, 8, 1, "2026 / 2027")]
    [InlineData(2026, 12, 31, "2026 / 2027")]
    public void School_year_changes_on_august_first(
        int year,
        int month,
        int day,
        string expected)
    {
        var actual = SchoolYearSessionContext.Calculate(new DateOnly(year, month, day));

        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Sign_in_adds_the_school_year_to_the_authenticated_identity()
    {
        var schoolYears = new SchoolYearSessionContext(
            new FixedTimeProvider(new DateTimeOffset(2026, 9, 1, 18, 0, 0, TimeSpan.Zero)));
        var identity = new ClaimsIdentity("TestAuthentication");
        var principal = new ClaimsPrincipal(identity);

        schoolYears.EnsureCurrentSchoolYearClaim(principal);

        Assert.Equal("2026 / 2027", principal.FindFirst(SchoolYearSessionContext.ClaimType)?.Value);
    }

    [Fact]
    public void Existing_session_school_year_is_not_recalculated()
    {
        var schoolYears = new SchoolYearSessionContext(
            new FixedTimeProvider(new DateTimeOffset(2026, 9, 1, 18, 0, 0, TimeSpan.Zero)));
        var identity = new ClaimsIdentity(
            [new Claim(SchoolYearSessionContext.ClaimType, "2025 / 2026")],
            "TestAuthentication");
        var principal = new ClaimsPrincipal(identity);

        schoolYears.EnsureCurrentSchoolYearClaim(principal);

        Assert.Single(principal.FindAll(SchoolYearSessionContext.ClaimType));
        Assert.Equal("2025 / 2026", schoolYears.GetCurrentSchoolYear(principal));
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
