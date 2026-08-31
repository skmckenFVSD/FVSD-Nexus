namespace FVSDNexus.Api.DevelopmentRoles;

public sealed record DevelopmentRoleContext(
    bool IsDeveloper,
    string? ActiveRole,
    IReadOnlyList<string> AvailableRoles,
    string RlsIdentity,
    string RlsEvaluation);

public sealed record DevelopmentRoleChange(string Role);
