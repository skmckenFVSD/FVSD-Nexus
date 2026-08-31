namespace FVSDNexus.Api.SemanticModel;

public interface IPowerBiSemanticModelClient
{
    Task<ModelConnectionStatus> CheckConnectionAsync(CancellationToken cancellationToken);

    Task<SemanticFilterOptions> GetFilterOptionsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<SchoolComparisonRow>> GetSchoolComparisonAsync(
        SchoolComparisonFilters filters,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TermDefinition>> GetTermDefinitionsAsync(
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ExecutiveOverviewRow>> GetExecutiveOverviewAsync(
        ExecutiveDomainDefinition domain,
        ExecutiveDashboardFilters filters,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ExecutiveSchoolComparisonRow>> GetExecutiveSchoolComparisonAsync(
        ExecutiveInstrumentDefinition instrument,
        ExecutiveDashboardFilters filters,
        CancellationToken cancellationToken);
}
