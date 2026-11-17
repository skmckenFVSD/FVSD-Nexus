namespace FVSDNexus.Api.DevelopmentRoles;

public sealed record DevelopmentRoleContext(
    bool IsDeveloper,
    string? ActiveRole,
    IReadOnlyList<string> AvailableRoles,
    string RlsIdentity,
    string RlsEvaluation,
    string? ActiveUserEmail = null);

public sealed record DevelopmentRoleChange(string Role);
public sealed record DevelopmentUserChange(string Email);
