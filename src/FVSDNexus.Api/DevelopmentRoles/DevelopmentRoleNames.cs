namespace FVSDNexus.Api.DevelopmentRoles;

public static class DevelopmentRoleNames
{
    public const string Executive = "Executive";
    public const string SchoolAdministration = "School Administration";
    public const string Teacher = "Teacher";
    public const string StudentSupport = "Student Support";
    public const string SpecialistSupport = "Specialist Support";
    public const string DataAdministrator = "Data Administrator";

    public const string LegacyClassRoomSupport = "Class Room Support";
    public const string LegacyDataAnalystAdministrator = "Data Analyst (Administrator)";

    public static readonly IReadOnlyList<string> All =
    [
        Executive,
        SchoolAdministration,
        Teacher,
        StudentSupport,
        SpecialistSupport,
        DataAdministrator
    ];

    public static bool IsValid(string? role) =>
        Normalize(role) is not null;

    public static string? Normalize(string? role) => role switch
    {
        Executive => Executive,
        SchoolAdministration or "Administrator" => SchoolAdministration,
        Teacher => Teacher,
        StudentSupport or LegacyClassRoomSupport => StudentSupport,
        SpecialistSupport => SpecialistSupport,
        DataAdministrator or LegacyDataAnalystAdministrator or "Data Analyst" => DataAdministrator,
        _ => null
    };
}
