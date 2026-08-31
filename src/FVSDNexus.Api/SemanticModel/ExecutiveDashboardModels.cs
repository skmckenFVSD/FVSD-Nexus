namespace FVSDNexus.Api.SemanticModel;

public sealed record ExecutiveDashboardFilters(
    IReadOnlyList<string> Schools,
    IReadOnlyList<string> SchoolYears,
    IReadOnlyList<string> Grades,
    IReadOnlyList<string> Periods);

public sealed record ExecutiveInstrumentDefinition(
    string Key,
    string Label,
    string Curriculum,
    string AssessmentGroup,
    IReadOnlyList<string> Grades,
    int SortOrder);

public sealed record ExecutiveDomainDefinition(
    string Key,
    string Label,
    IReadOnlyList<ExecutiveInstrumentDefinition> Instruments);

public sealed record TermDefinition(
    string DescriptiveTerm,
    int SortOrder,
    string TermGroup,
    int TermGroupSortOrder,
    string CohortGroup,
    string? Range,
    int? LowValue,
    int? HighValue,
    string? FillHexCode,
    string? FontHexCode,
    string? TermGroupFillHexCode,
    string? TermGroupFontHexCode);

public sealed record ExecutiveOverviewRow(
    string Instrument,
    int InstrumentSortOrder,
    string SchoolYear,
    int SchoolYearSortOrder,
    string Period,
    int PeriodSortOrder,
    string DescriptiveTerm,
    int TermSortOrder,
    string TermGroup,
    int TermGroupSortOrder,
    string? Range,
    int? LowValue,
    int? HighValue,
    string? FillHexCode,
    string? FontHexCode,
    int Submitted,
    decimal? MedianScore);

public sealed record ExecutiveSchoolComparisonRow(
    string School,
    string SchoolYear,
    int SchoolYearSortOrder,
    string Grade,
    int GradeSortOrder,
    string Period,
    int PeriodSortOrder,
    string TermGroup,
    int TermGroupSortOrder,
    decimal? MedianScore);

public static class ExecutiveDashboardDomains
{
    private const string EnglishLanguageArts = "English Language Arts and Literature";
    private const string Mathematics = "Mathematics";
    private static readonly string[] GradeOneToTwelve = Enumerable.Range(1, 12)
        .Select(grade => $"Grade {grade}")
        .ToArray();
    private static readonly string[] KindergartenToGradeSix = [
        "Kindergarten",
        .. Enumerable.Range(1, 6).Select(grade => $"Grade {grade}")
    ];

    private static readonly ExecutiveDomainDefinition[] Definitions =
    [
        new(
            "literacy",
            "Literacy",
            [
                new("tosrec", "TOSREC", EnglishLanguageArts, "TOSREC", GradeOneToTwelve, 1),
                new("towre", "TOWRE", EnglishLanguageArts, "TOWRE", GradeOneToTwelve, 2),
                new("ctopp", "CTOPP", EnglishLanguageArts, "CTOPP", ["Kindergarten"], 3)
            ]),
        new(
            "numeracy",
            "Numeracy",
            [
                new("pnsa", "PNSA", Mathematics, "PNSA", KindergartenToGradeSix, 1),
                new("wrat-5", "WRAT-5", Mathematics, "WRAT-5", GradeOneToTwelve, 2)
            ])
    ];

    public static IReadOnlyList<ExecutiveDomainDefinition> All => Definitions;

    public static bool TryGet(string? key, out ExecutiveDomainDefinition definition)
    {
        definition = Definitions.FirstOrDefault(item =>
            string.Equals(item.Key, key, StringComparison.OrdinalIgnoreCase))!;
        return definition is not null;
    }

    public static bool TryGetInstrument(
        ExecutiveDomainDefinition domain,
        string? assessmentGroup,
        out ExecutiveInstrumentDefinition instrument)
    {
        instrument = domain.Instruments.FirstOrDefault(item =>
            string.Equals(item.AssessmentGroup, assessmentGroup, StringComparison.OrdinalIgnoreCase))!;
        return instrument is not null;
    }
}
