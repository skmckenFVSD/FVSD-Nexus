namespace FVSDNexus.Api.SemanticModel;

public sealed record SchoolComparisonRow(
    string School,
    decimal? MedianScore,
    decimal? SubmittedPercent,
    int? Students);
