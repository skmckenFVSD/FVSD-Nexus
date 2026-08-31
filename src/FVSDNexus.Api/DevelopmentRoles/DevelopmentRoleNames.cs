namespace FVSDNexus.Api.DevelopmentRoles;

public static class DevelopmentRoleNames
{
    public const string Executive = "Executive";
    public const string SchoolAdministration = "School Administration";
    public const string Teacher = "Teacher";
    public const string ClassRoomSupport = "Class Room Support";
    public const string DataAnalystAdministrator = "Data Analyst (Administrator)";

    public static readonly IReadOnlyList<string> All =
    [
        Executive,
        SchoolAdministration,
        Teacher,
        ClassRoomSupport,
        DataAnalystAdministrator
    ];

    public static bool IsValid(string? role) =>
        role is not null && All.Contains(role, StringComparer.Ordinal);
}
