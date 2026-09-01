namespace FVSDNexus.Api.Dataverse;

public sealed record DataverseSchoolAssignment(Guid Id, string Name);

public sealed record DataverseAccessContext(
    bool RoleRecordFound,
    Guid? UserRoleId,
    Guid? DataverseSystemUserId,
    string Email,
    Guid? EntraObjectId,
    string StoredRole,
    string EffectiveRole,
    bool AssessmentTeam,
    bool PocEnabled,
    bool ContinuumAdministrator,
    DataverseSchoolAssignment? PrimarySchool,
    DataverseSchoolAssignment? AlternativeSchool)
{
    public DataverseSchoolAssignment? DefaultSchool =>
        PrimarySchool is not null && AlternativeSchool is null
            ? PrimarySchool
            : PrimarySchool is null && AlternativeSchool is not null
                ? AlternativeSchool
                : null;
}
