namespace FVSDNexus.Api.SemanticModel;

public sealed record ModelConnectionStatus(
    string Status,
    string Workspace,
    string SemanticModel,
    DateTimeOffset CheckedAtUtc);
