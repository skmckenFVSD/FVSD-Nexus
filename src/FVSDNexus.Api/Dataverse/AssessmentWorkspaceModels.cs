namespace FVSDNexus.Api.Dataverse;

public sealed record AssessmentSchoolOption(Guid Id, string Name);

public sealed record AssessmentSectionGroupOption(string Value, string Label, int SortOrder);

public sealed record AssessmentWorkspaceContext(
    string Role,
    IReadOnlyList<AssessmentSchoolOption> Schools,
    Guid? DefaultSchoolId,
    bool SchoolSelectionEnabled,
    bool TeacherLockedToSignedInUser);

public sealed record AssessmentTeacherSection(
    Guid Id,
    string SectionNumber,
    Guid SchoolId,
    string SchoolName,
    string SectionGroup,
    int SectionGroupOrder,
    string CourseNumber,
    string CourseName,
    int SortOrder,
    Guid TeacherId,
    string TeacherName,
    int StudentCount);

public sealed record AssessmentStudent(
    Guid StudentSectionId,
    string? SectionNumber,
    Guid Id,
    string Name,
    string? ObfuscatedName,
    string? Asn,
    string? ObfuscatedAsn,
    DateTimeOffset? DateOfBirth,
    string? Gender,
    string? Grade,
    int? GradeValue,
    string? SpedCategory,
    string? SpedSeries,
    string? Fnmi,
    string? EslCategory,
    string? SpokenLanguage);

public sealed record AssessmentHistoryRecord(
    Guid Id,
    string AssessmentType,
    string RecordName,
    string SchoolYear,
    string Period,
    int PeriodSortOrder,
    DateTimeOffset? AssessmentDate,
    string? GradeAtAssessment,
    string? ChronologicalAge,
    string? Curriculum,
    string? SchoolAtAssessment,
    string? CourseNumber,
    string? CourseName,
    string? TeacherAtAssessment,
    string? SectionNumber,
    int? TotalCorrect,
    int? TotalError,
    int? RawScore,
    int? StandardScore,
    string? PercentileRank,
    string DescriptiveTerm,
    string? DescriptiveTermFill,
    string? DescriptiveTermFont,
    bool Exempt,
    string? ExemptReason,
    string? ETag);

public sealed record TosrecReferenceOption(
    int RawScore,
    int StandardScore,
    string PercentileRank,
    Guid DescriptiveTermId,
    string DescriptiveTerm,
    string? DescriptiveTermFill,
    string? DescriptiveTermFont);

public sealed record TosrecAssessmentCommand(
    DateOnly AssessmentDate,
    int Period,
    bool Exempt,
    string? ExemptReason,
    int? TotalCorrect,
    int? TotalError,
    string? ETag);

internal sealed record AssessmentAccessPolicy(
    string Role,
    IReadOnlyList<DataverseSchoolAssignment> AssignedSchools,
    bool CanViewAllSelectableSchools,
    bool SchoolSelectionEnabled,
    bool TeacherLockedToSignedInUser)
{
    public static AssessmentAccessPolicy Create(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper)
    {
        var role = isDeveloper && !string.IsNullOrWhiteSpace(developmentRole)
            ? NormalizeRole(developmentRole)
            : NormalizeRole(accessContext.EffectiveRole);
        var allAssignments = new[] { accessContext.PrimarySchool, accessContext.AlternativeSchool }
            .Where(school => school is not null)
            .Cast<DataverseSchoolAssignment>()
            .DistinctBy(school => school.Id)
            .ToArray();
        var assignments = role is "Administrator" or "Data Analyst"
            ? allAssignments
            : allAssignments.Take(1).ToArray();

        var broadSchoolAccess = role == "Data Analyst";
        var schoolSelectionEnabled = broadSchoolAccess
            || (role == "Administrator" && assignments.Length > 1);

        return new AssessmentAccessPolicy(
            role,
            assignments,
            broadSchoolAccess,
            schoolSelectionEnabled,
            role is "Teacher" or "Class Room Support");
    }

    public bool AllowsSchool(Guid schoolId, IReadOnlyList<AssessmentSchoolOption> availableSchools) =>
        availableSchools.Any(school => school.Id == schoolId);

    public bool CanManageHistoricalAssessments => Role is "Administrator" or "Data Analyst";

    public bool CanDeleteAssessments => Role is "Administrator" or "Data Analyst";

    private static string NormalizeRole(string role) => role switch
    {
        "School Administration" => "Administrator",
        "Student Support" => "Class Room Support",
        "Data Analyst (Administrator)" => "Data Analyst",
        _ => role
    };
}
