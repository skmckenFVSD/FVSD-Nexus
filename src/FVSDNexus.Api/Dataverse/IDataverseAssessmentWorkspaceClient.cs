namespace FVSDNexus.Api.Dataverse;

public interface IDataverseAssessmentWorkspaceClient
{
    Task<IReadOnlyList<StudentAssessmentStatus>> GetStudentAssessmentStatusesAsync(
        DataverseAccessContext accessContext, string? developmentRole, bool isDeveloper,
        Guid teacherSectionId, string schoolYear, CancellationToken cancellationToken = default);

    Task<AssessmentCompletionSummary> GetCompletionAsync(
        DataverseAccessContext accessContext, string? developmentRole, bool isDeveloper,
        Guid schoolId, string sectionGroup, string? courseNumber, Guid? teacherId,
        string schoolYear, CancellationToken cancellationToken = default);

    Task<AssessmentWorkspaceContext> GetWorkspaceContextAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AssessmentSectionGroupOption>> GetSectionGroupsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid schoolId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AssessmentTeacherSection>> GetTeacherSectionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid schoolId,
        string sectionGroup,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AssessmentStudent>> GetStudentsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AssessmentHistoryRecord>> GetTosrecAssessmentsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentPlanHistoryRecord>> GetStudentPlansAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        CancellationToken cancellationToken = default);

    Task<StudentPlanHistoryRecord> CreateStudentPlanAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        string currentSchoolYear,
        CancellationToken cancellationToken = default);

    Task<StudentPlanModulesResponse> GetStudentPlanModulesAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default);

    Task<StudentPlanScreenersResponse> GetStudentPlanScreenersAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default);

    Task<StudentPlanInterventionsResponse> GetStudentPlanInterventionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default);

    Task<StudentPlanModulesResponse> AddStudentPlanModuleAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid moduleId,
        string eTag,
        CancellationToken cancellationToken = default);

    Task<StudentPlanModulesResponse> RemoveStudentPlanModuleAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid moduleId,
        string eTag,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TosrecReferenceOption>> GetTosrecReferenceOptionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        int period,
        CancellationToken cancellationToken = default);

    Task CreateTosrecAssessmentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        string currentSchoolYear,
        TosrecAssessmentCommand command,
        CancellationToken cancellationToken = default);

    Task UpdateTosrecAssessmentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid assessmentId,
        string currentSchoolYear,
        int? currentPeriod,
        TosrecAssessmentCommand command,
        CancellationToken cancellationToken = default);

    Task DeleteTosrecAssessmentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid assessmentId,
        string? eTag,
        CancellationToken cancellationToken = default);
}
