namespace FVSDNexus.Api.SemanticModel;

public sealed record SemanticFilterOptions(
    IReadOnlyList<string> Schools,
    IReadOnlyList<string> SchoolYears,
    IReadOnlyList<string> AssessmentGroups,
    IReadOnlyList<string> Curricula,
    IReadOnlyList<string> Grades,
    IReadOnlyList<string> Periods);
