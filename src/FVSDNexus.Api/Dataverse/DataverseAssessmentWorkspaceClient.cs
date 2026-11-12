using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;

namespace FVSDNexus.Api.Dataverse;

public sealed partial class DataverseAssessmentWorkspaceClient(
    HttpClient httpClient,
    ITokenAcquisition tokenAcquisition,
    IOptions<DataverseOptions> options,
    ILogger<DataverseAssessmentWorkspaceClient> logger) : IDataverseAssessmentWorkspaceClient
{
    private const string FormattedValueSuffix = "@OData.Community.Display.V1.FormattedValue";
    private readonly DataverseOptions _options = options.Value;

    public async Task<AssessmentWorkspaceContext> GetWorkspaceContextAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        CancellationToken cancellationToken = default)
    {
        var policy = AssessmentAccessPolicy.Create(accessContext, developmentRole, isDeveloper);
        var schools = await GetPermittedSchoolsAsync(policy, cancellationToken);
        var defaultSchoolId = GetDefaultSchoolId(policy, schools);

        return new AssessmentWorkspaceContext(
            policy.Role,
            schools,
            defaultSchoolId,
            policy.SchoolSelectionEnabled && schools.Count > 1,
            policy.TeacherLockedToSignedInUser);
    }

    public async Task<IReadOnlyList<AssessmentSectionGroupOption>> GetSectionGroupsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid schoolId,
        CancellationToken cancellationToken = default)
    {
        var policy = AssessmentAccessPolicy.Create(accessContext, developmentRole, isDeveloper);
        var schools = await GetPermittedSchoolsAsync(policy, cancellationToken);
        if (!policy.AllowsSchool(schoolId, schools))
        {
            throw new AssessmentWorkspaceAccessException("The selected school is outside the signed-in user's assessment scope.");
        }

        var teacherEntraObjectId = GetScopedTeacherObjectId(policy, accessContext);
        if (policy.TeacherLockedToSignedInUser && teacherEntraObjectId is null)
        {
            return [];
        }

        using var document = await GetJsonAsync(
            BuildSectionGroupsQuery(schoolId, teacherEntraObjectId),
            cancellationToken);
        return ParseSectionGroups(document.RootElement);
    }

    public async Task<IReadOnlyList<AssessmentTeacherSection>> GetTeacherSectionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid schoolId,
        string sectionGroup,
        CancellationToken cancellationToken = default)
    {
        var policy = AssessmentAccessPolicy.Create(accessContext, developmentRole, isDeveloper);
        var schools = await GetPermittedSchoolsAsync(policy, cancellationToken);
        if (!policy.AllowsSchool(schoolId, schools))
        {
            throw new AssessmentWorkspaceAccessException("The selected school is outside the signed-in user's assessment scope.");
        }

        var teacherEntraObjectId = GetScopedTeacherObjectId(policy, accessContext);
        if (policy.TeacherLockedToSignedInUser && teacherEntraObjectId is null)
        {
            return [];
        }

        using var sectionsDocument = await GetAllJsonAsync(
            BuildTeacherSectionsQuery(
                schoolId,
                GetSectionGroupValue(sectionGroup),
                teacherEntraObjectId),
            cancellationToken);
        using var mappingsDocument = await GetJsonAsync(BuildSectionMappingsQuery(), cancellationToken);

        var mappings = ParseMappings(mappingsDocument.RootElement);
        return ParseTeacherSections(sectionsDocument.RootElement, mappings);
    }

    public async Task<IReadOnlyList<AssessmentStudent>> GetStudentsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        CancellationToken cancellationToken = default)
    {
        var policy = AssessmentAccessPolicy.Create(accessContext, developmentRole, isDeveloper);
        var schools = await GetPermittedSchoolsAsync(policy, cancellationToken);
        using var sectionDocument = await GetJsonAsync(
            BuildTeacherSectionValidationQuery(teacherSectionId),
            cancellationToken);
        var section = sectionDocument.RootElement.GetProperty("value");
        if (section.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException("The selected teacher section is not available.");
        }

        var sectionRow = section[0];
        var schoolId = ReadGuid(sectionRow, "_fvsd_school_value");
        var teacherEntraObjectId = ReadString(sectionRow, "fvsd_teacher", "fvsd_azureadobjectid");
        var teacherAllowed = !policy.TeacherLockedToSignedInUser
            || (accessContext.EntraObjectId is not null
                && string.Equals(
                    teacherEntraObjectId,
                    accessContext.EntraObjectId.Value.ToString(),
                    StringComparison.OrdinalIgnoreCase));
        if (schoolId is null || !policy.AllowsSchool(schoolId.Value, schools) || !teacherAllowed)
        {
            throw new AssessmentWorkspaceAccessException("The selected teacher section is outside the signed-in user's assessment scope.");
        }

        using var studentsDocument = await GetJsonAsync(BuildStudentsQuery(teacherSectionId), cancellationToken);
        return ParseStudents(studentsDocument.RootElement);
    }

    public async Task<IReadOnlyList<AssessmentHistoryRecord>> GetTosrecAssessmentsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        var permittedStudents = await GetStudentsAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            cancellationToken);
        if (!permittedStudents.Any(student => student.Id == studentId))
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected student is outside the signed-in user's teacher-section scope.");
        }

        using var document = await GetJsonAsync(BuildTosrecAssessmentsQuery(studentId), cancellationToken);
        return ParseTosrecAssessments(document.RootElement);
    }

    public async Task<IReadOnlyList<StudentPlanHistoryRecord>> GetStudentPlansAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        var permittedStudents = await GetStudentsAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            cancellationToken);
        if (!permittedStudents.Any(student => student.Id == studentId))
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected student is outside the signed-in user's teacher-section scope.");
        }

        using var document = await GetJsonAsync(BuildStudentPlansQuery(studentId), cancellationToken);
        return ParseStudentPlans(document.RootElement);
    }

    public async Task<StudentPlanHistoryRecord> CreateStudentPlanAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        string currentSchoolYear,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanDuplicateQuery(studentId, currentSchoolYear),
            cancellationToken);
        if (existingDocument.RootElement.GetProperty("value").GetArrayLength() > 0)
        {
            throw new AssessmentWorkspaceConflictException(
                "This student already has an IEP / IPP for the current school year.");
        }

        using var modulesDocument = await GetJsonAsync(BuildIppSectionsQuery(), cancellationToken);
        var definitions = ParseIppSections(modulesDocument.RootElement);
        var requiredNames = new List<string> { "Student Details", "Screener Results" };
        if (subject.IsSpedCoded)
        {
            requiredNames.Add("Student Conditions and Coding");
        }

        var selectedIds = requiredNames.Select(name =>
            definitions.FirstOrDefault(module => string.Equals(module.Name, name, StringComparison.OrdinalIgnoreCase))
                ?? throw new InvalidOperationException($"The required IPP module '{name}' is not configured."))
            .Select(module => module.Id)
            .ToHashSet();
        var selectedText = SerializeIppSectionIds(selectedIds, definitions);
        var school = await GetPlanSchoolContextAsync(subject.SchoolId, cancellationToken);
        var schoolYearStart = GetSchoolYearStart(currentSchoolYear);
        if (schoolYearStart == int.MinValue)
        {
            throw new ArgumentException("The current school year is not valid.");
        }

        var payload = new Dictionary<string, object?>
        {
            ["fvsd_name"] = $"{schoolYearStart}|{subject.StudentAsn}|{school.Alias}|IPP",
            ["fvsd_student@odata.bind"] = $"/fvsd_studentdetails({subject.StudentId:D})",
            ["fvsd_schoolyear"] = currentSchoolYear,
            ["fvsd_schoolatipp"] = subject.SchoolName,
            ["fvsd_gradeatipp"] = subject.StudentGradeValue,
            ["fvsd_curriculum"] = subject.SectionGroup,
            ["fvsd_coursename"] = subject.CourseName,
            ["fvsd_courseno"] = subject.CourseNumber,
            ["fvsd_teacheratipp"] = subject.TeacherName,
            ["fvsd_principalatipp"] = school.PrincipalName,
            ["fvsd_ippsections"] = selectedText
        };
        await SendJsonAsync(
            HttpMethod.Post,
            "fvsd_studentipps",
            payload,
            null,
            cancellationToken);

        using var createdDocument = await GetJsonAsync(
            BuildStudentPlanDuplicateQuery(studentId, currentSchoolYear),
            cancellationToken);
        return ParseStudentPlans(createdDocument.RootElement).Single();
    }

    public async Task<StudentPlanModulesResponse> GetStudentPlanModulesAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        return await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
    }

    public async Task<StudentPlanScreenersResponse> GetStudentPlanScreenersAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId),
            cancellationToken);
        var planRows = planDocument.RootElement.GetProperty("value");
        if (planRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        var schoolYear = ReadString(planRows[0], "fvsd_schoolyear")
            ?? throw new InvalidOperationException("The selected plan does not have a school year.");
        var assessmentDocuments = await Task.WhenAll(
            GetJsonAsync(BuildPlanTosrecScreenersQuery(studentId, schoolYear), cancellationToken),
            GetJsonAsync(BuildPlanTowreScreenersQuery(studentId, schoolYear), cancellationToken),
            GetJsonAsync(BuildPlanWratScreenersQuery(studentId, schoolYear), cancellationToken));
        using var tosrecDocument = assessmentDocuments[0];
        using var towreDocument = assessmentDocuments[1];
        using var wratDocument = assessmentDocuments[2];
        return new StudentPlanScreenersResponse(
            planId,
            schoolYear,
            ParseStudentPlanScreeners(
                tosrecDocument.RootElement,
                towreDocument.RootElement,
                wratDocument.RootElement));
    }

    public async Task<StudentPlanOralReadingFluencyResponse> GetStudentPlanOralReadingFluencyAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanOralReadingFluencyAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanOralReadingFluencyOptionsResponse> GetStudentPlanOralReadingFluencyOptionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanOralReadingFluencyOptionsAsync(cancellationToken);
    }

    public async Task<StudentPlanOralReadingFluencyResponse> CreateStudentPlanOralReadingFluencyAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        string currentSchoolYear,
        StudentPlanOralReadingFluencyCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId),
            cancellationToken);
        var planRows = planDocument.RootElement.GetProperty("value");
        if (planRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        var plan = planRows[0];
        var schoolYear = ReadString(plan, "fvsd_schoolyear")
            ?? throw new InvalidOperationException("The selected plan does not have a school year.");
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        var normalized = await ValidateStudentPlanOralReadingFluencyCommandAsync(command, cancellationToken);
        var sectionId = await GetOralReadingFluencySectionIdAsync(cancellationToken);
        var currentResults = await LoadStudentPlanOralReadingFluencyAsync(planId, schoolYear, cancellationToken);
        EnsureOralReadingFluencyDateAvailable(currentResults.Results, normalized.AssessmentDate, null);
        var planName = ReadString(plan, "fvsd_name") ?? $"{schoolYear}|{subject.StudentAsn}|IPP";
        await RecalculateStudentPlanOralReadingFluencyNamesAsync(
            planName,
            currentResults.Results,
            cancellationToken);
        var payload = BuildStudentPlanOralReadingFluencyPayload(normalized);
        payload["fvsd_name"] = BuildStudentPlanOralReadingFluencyName(planName, normalized.AssessmentDate);
        payload["fvsd_studentipp@odata.bind"] = $"/fvsd_studentipps({planId:D})";
        payload["fvsd_section@odata.bind"] = $"/fvsd_ippsections({sectionId:D})";

        await SendJsonAsync(
            HttpMethod.Post,
            "fvsd_studentipplevels",
            payload,
            null,
            cancellationToken);
        return await LoadStudentPlanOralReadingFluencyAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanOralReadingFluencyResponse> UpdateStudentPlanOralReadingFluencyAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid resultId,
        string currentSchoolYear,
        StudentPlanOralReadingFluencyCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId),
            cancellationToken);
        var planRows = planDocument.RootElement.GetProperty("value");
        if (planRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        var plan = planRows[0];
        var schoolYear = ReadString(plan, "fvsd_schoolyear")
            ?? throw new InvalidOperationException("The selected plan does not have a school year.");
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        var normalized = await ValidateStudentPlanOralReadingFluencyCommandAsync(command, cancellationToken);
        if (string.IsNullOrWhiteSpace(normalized.ETag))
        {
            throw new ArgumentException("Reload the oral reading fluency result before saving your changes.");
        }

        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanOralReadingFluencyValidationQuery(planId, resultId),
            cancellationToken);
        if (existingDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected oral reading fluency result is not available for this annual plan.");
        }

        var currentResults = await LoadStudentPlanOralReadingFluencyAsync(planId, schoolYear, cancellationToken);
        EnsureOralReadingFluencyDateAvailable(currentResults.Results, normalized.AssessmentDate, resultId);
        var planName = ReadString(plan, "fvsd_name") ?? $"{schoolYear}|{subject.StudentAsn}|IPP";
        var payload = BuildStudentPlanOralReadingFluencyPayload(normalized);
        payload["fvsd_name"] = BuildStudentPlanOralReadingFluencyName(planName, normalized.AssessmentDate);

        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studentipplevels({resultId:D})",
            payload,
            normalized.ETag,
            cancellationToken);
        return await LoadStudentPlanOralReadingFluencyAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanOralReadingFluencyResponse> DeleteStudentPlanOralReadingFluencyAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid resultId,
        string currentSchoolYear,
        string? eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the oral reading fluency result before deleting it.");
        }

        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanOralReadingFluencyValidationQuery(planId, resultId),
            cancellationToken);
        if (existingDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected oral reading fluency result is not available for this annual plan.");
        }

        await SendJsonAsync(
            HttpMethod.Delete,
            $"fvsd_studentipplevels({resultId:D})",
            null,
            eTag,
            cancellationToken);
        return await LoadStudentPlanOralReadingFluencyAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWordStudyResponse> GetStudentPlanWordStudyAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanWordStudyAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWordStudyOptionsResponse> GetStudentPlanWordStudyOptionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanWordStudyOptionsAsync(cancellationToken);
    }

    public async Task<StudentPlanWordStudyResponse> CreateStudentPlanWordStudyAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        string currentSchoolYear,
        StudentPlanWordStudyCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId), cancellationToken);
        var planRows = planDocument.RootElement.GetProperty("value");
        if (planRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        var plan = planRows[0];
        var schoolYear = ReadString(plan, "fvsd_schoolyear")
            ?? throw new InvalidOperationException("The selected plan does not have a school year.");
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        var options = await LoadStudentPlanWordStudyOptionsAsync(cancellationToken);
        ValidateStudentPlanWordStudyCommand(command, options);
        var sectionId = await GetIppSectionIdAsync("Word Study", cancellationToken);
        var current = await LoadStudentPlanWordStudyAsync(planId, schoolYear, cancellationToken);
        EnsureWordStudyStartDateAvailable(current.Records, command.TermStartDate, null);
        var planName = ReadString(plan, "fvsd_name") ?? $"{schoolYear}|{subject.StudentAsn}|IPP";
        await RecalculateStudentPlanWordStudyNamesAsync(planName, current.Records, cancellationToken);

        var payload = BuildStudentPlanWordStudyPayload(command);
        payload["fvsd_name"] = BuildStudentPlanWordStudyName(planName, command.TermStartDate);
        payload["fvsd_studentipp@odata.bind"] = $"/fvsd_studentipps({planId:D})";
        payload["fvsd_section@odata.bind"] = $"/fvsd_ippsections({sectionId:D})";
        await SendJsonAsync(HttpMethod.Post, "fvsd_studentipplevels", payload, null, cancellationToken);
        return await LoadStudentPlanWordStudyAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWordStudyResponse> UpdateStudentPlanWordStudyAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid recordId,
        string currentSchoolYear,
        StudentPlanWordStudyCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId), cancellationToken);
        var planRows = planDocument.RootElement.GetProperty("value");
        if (planRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        var plan = planRows[0];
        var schoolYear = ReadString(plan, "fvsd_schoolyear")
            ?? throw new InvalidOperationException("The selected plan does not have a school year.");
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        var options = await LoadStudentPlanWordStudyOptionsAsync(cancellationToken);
        ValidateStudentPlanWordStudyCommand(command, options);
        if (string.IsNullOrWhiteSpace(command.ETag))
        {
            throw new ArgumentException("Reload the Word Study record before saving your changes.");
        }

        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanWordStudyValidationQuery(planId, recordId), cancellationToken);
        if (existingDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected Word Study record is not available for this annual plan.");
        }

        var current = await LoadStudentPlanWordStudyAsync(planId, schoolYear, cancellationToken);
        EnsureWordStudyStartDateAvailable(current.Records, command.TermStartDate, recordId);
        var planName = ReadString(plan, "fvsd_name") ?? $"{schoolYear}|{subject.StudentAsn}|IPP";
        var payload = BuildStudentPlanWordStudyPayload(command);
        payload["fvsd_name"] = BuildStudentPlanWordStudyName(planName, command.TermStartDate);
        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studentipplevels({recordId:D})",
            payload,
            command.ETag,
            cancellationToken);
        return await LoadStudentPlanWordStudyAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWordStudyResponse> DeleteStudentPlanWordStudyAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid recordId,
        string currentSchoolYear,
        string? eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the Word Study record before deleting it.");
        }

        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanWordStudyValidationQuery(planId, recordId), cancellationToken);
        if (existingDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected Word Study record is not available for this annual plan.");
        }

        await SendJsonAsync(
            HttpMethod.Delete,
            $"fvsd_studentipplevels({recordId:D})",
            null,
            eTag,
            cancellationToken);
        return await LoadStudentPlanWordStudyAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWritingSnapshotsResponse> GetStudentPlanWritingSnapshotsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanWritingSnapshotsAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWritingSnapshotsResponse> CreateStudentPlanWritingSnapshotAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        string currentSchoolYear,
        StudentPlanWritingSnapshotCommand command,
        StudentPlanWritingSnapshotUpload? writingSampleFile,
        StudentPlanWritingSnapshotUpload? writingSampleImage,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        ValidateStudentPlanWritingSnapshotCommand(command, writingSampleFile, writingSampleImage);
        var sectionId = await GetIppSectionIdAsync("Writing Snapshot", cancellationToken);
        var sectionNavigationProperty = await GetIppActivitySectionNavigationPropertyAsync(cancellationToken);
        var payload = BuildStudentPlanWritingSnapshotPayload(command);
        payload["regardingobjectid_fvsd_studentipp@odata.bind"] = $"/fvsd_studentipps({planId:D})";
        payload[$"{sectionNavigationProperty}@odata.bind"] = $"/fvsd_ippsections({sectionId:D})";

        var snapshotId = await CreateRecordAsync(
            "fvsd_ippactivities", payload, "activityid", cancellationToken);
        try
        {
            await SetIppActivityOpenAsync(snapshotId, cancellationToken);
            await SaveWritingSnapshotUploadsAsync(
                snapshotId, writingSampleFile, writingSampleImage, false, cancellationToken);
        }
        catch
        {
            try
            {
                await SendJsonAsync(
                    HttpMethod.Delete,
                    $"fvsd_ippactivities({snapshotId:D})",
                    null,
                    null,
                    cancellationToken);
            }
            catch (Exception rollbackException)
            {
                logger.LogWarning(
                    rollbackException,
                    "Writing Snapshot {SnapshotId} could not be rolled back after its save failed.",
                    snapshotId);
            }
            throw;
        }

        return await LoadStudentPlanWritingSnapshotsAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWritingSnapshotsResponse> UpdateStudentPlanWritingSnapshotAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid snapshotId,
        string currentSchoolYear,
        StudentPlanWritingSnapshotCommand command,
        StudentPlanWritingSnapshotUpload? writingSampleFile,
        StudentPlanWritingSnapshotUpload? writingSampleImage,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        ValidateStudentPlanWritingSnapshotCommand(command, writingSampleFile, writingSampleImage);
        if (string.IsNullOrWhiteSpace(command.ETag))
        {
            throw new ArgumentException("Reload the Writing Snapshot before saving your changes.");
        }

        await EnsureWritingSnapshotAvailableAsync(planId, snapshotId, cancellationToken);
        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_ippactivities({snapshotId:D})",
            BuildStudentPlanWritingSnapshotPayload(command),
            command.ETag,
            cancellationToken);
        await SetIppActivityOpenAsync(snapshotId, cancellationToken);
        await SaveWritingSnapshotUploadsAsync(
            snapshotId, writingSampleFile, writingSampleImage, true, cancellationToken);
        return await LoadStudentPlanWritingSnapshotsAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWritingSnapshotsResponse> DeleteStudentPlanWritingSnapshotAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid snapshotId,
        string currentSchoolYear,
        string? eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the Writing Snapshot before deleting it.");
        }

        await EnsureWritingSnapshotAvailableAsync(planId, snapshotId, cancellationToken);
        await SendJsonAsync(
            HttpMethod.Delete,
            $"fvsd_ippactivities({snapshotId:D})",
            null,
            eTag,
            cancellationToken);
        return await LoadStudentPlanWritingSnapshotsAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanWritingSnapshotContent> GetStudentPlanWritingSnapshotContentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid snapshotId,
        bool image,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        var fileName = await EnsureWritingSnapshotAvailableAsync(planId, snapshotId, cancellationToken);
        var column = image ? "fvsd_writingsampleimage" : "fvsd_writingsamplefile";
        var suffix = image ? "/$value?size=full" : "/$value";
        var defaultFileName = image
            ? $"writing-sample-{snapshotId:D}.jpg"
            : fileName ?? $"writing-sample-{snapshotId:D}";
        return await GetWritingSnapshotContentAsync(
            $"fvsd_ippactivities({snapshotId:D})/{column}{suffix}",
            defaultFileName,
            image ? "image/jpeg" : "application/octet-stream",
            cancellationToken);
    }

    public async Task<StudentPlanTeacherCommentsResponse> GetStudentPlanTeacherCommentsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanTeacherCommentsAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanTeacherCommentsResponse> CreateStudentPlanTeacherCommentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        string currentSchoolYear,
        StudentPlanTeacherCommentCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        var modules = await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
        ValidateStudentPlanTeacherCommentCommand(command, modules.Modules);
        var sectionNavigationProperty = await GetIppActivitySectionNavigationPropertyAsync(cancellationToken);
        var payload = BuildStudentPlanTeacherCommentPayload(command);
        payload["regardingobjectid_fvsd_studentipp@odata.bind"] = $"/fvsd_studentipps({planId:D})";
        payload[$"{sectionNavigationProperty}@odata.bind"] = $"/fvsd_ippsections({command.SectionId:D})";
        var commentId = await CreateRecordAsync(
            "fvsd_ippactivities", payload, "activityid", cancellationToken);
        await SetIppActivityOpenAsync(commentId, cancellationToken);
        return await LoadStudentPlanTeacherCommentsAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanTeacherCommentsResponse> UpdateStudentPlanTeacherCommentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid commentId,
        string currentSchoolYear,
        StudentPlanTeacherCommentCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        var modules = await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
        ValidateStudentPlanTeacherCommentCommand(command, modules.Modules);
        if (string.IsNullOrWhiteSpace(command.ETag))
        {
            throw new ArgumentException("Reload the Teacher Comment before saving your changes.");
        }
        await EnsureTeacherCommentAvailableAsync(planId, commentId, cancellationToken);
        var sectionNavigationProperty = await GetIppActivitySectionNavigationPropertyAsync(cancellationToken);
        var payload = BuildStudentPlanTeacherCommentPayload(command);
        payload[$"{sectionNavigationProperty}@odata.bind"] = $"/fvsd_ippsections({command.SectionId:D})";
        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_ippactivities({commentId:D})",
            payload,
            command.ETag,
            cancellationToken);
        await SetIppActivityOpenAsync(commentId, cancellationToken);
        return await LoadStudentPlanTeacherCommentsAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanTeacherCommentsResponse> DeleteStudentPlanTeacherCommentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid commentId,
        string currentSchoolYear,
        string? eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext, developmentRole, isDeveloper, teacherSectionId, studentId, cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the Teacher Comment before deleting it.");
        }
        await EnsureTeacherCommentAvailableAsync(planId, commentId, cancellationToken);
        await SendJsonAsync(
            HttpMethod.Delete,
            $"fvsd_ippactivities({commentId:D})",
            null,
            eTag,
            cancellationToken);
        return await LoadStudentPlanTeacherCommentsAsync(planId, schoolYear, cancellationToken);
    }


    public async Task<StudentPlanInterventionsResponse> GetStudentPlanInterventionsAsync(

        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId),
            cancellationToken);
        var planRows = planDocument.RootElement.GetProperty("value");
        if (planRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        var schoolYear = ReadString(planRows[0], "fvsd_schoolyear")
            ?? throw new InvalidOperationException("The selected plan does not have a school year.");
        return await LoadStudentPlanInterventionsAsync(planId, studentId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanInterventionOptionsResponse> GetStudentPlanInterventionOptionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanInterventionOptionsAsync(subject, cancellationToken);
    }

    public async Task<StudentPlanInterventionsResponse> CreateStudentPlanInterventionAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        string currentSchoolYear,
        StudentPlanInterventionCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        ValidateInterventionCommand(command);

        var options = await LoadStudentPlanInterventionOptionsAsync(subject, cancellationToken);
        var type = options.InterventionTypes.FirstOrDefault(option => option.Id == command.InterventionTypeId)
            ?? throw new ArgumentException("Select a valid Intervention Type.");
        var source = ResolveInterventionSource(subject, options, type, command.SourceTeacherSectionId);
        ValidateInterventionist(command.Interventionist, options.Interventionists, null);

        var schoolYearStart = GetSchoolYearStart(schoolYear);
        if (schoolYearStart == int.MinValue)
        {
            throw new ArgumentException("The plan school year is not valid.");
        }

        var payload = BuildStudentPlanInterventionPayload(
            subject,
            schoolYear,
            type,
            source,
            command,
            $"{schoolYearStart}|{subject.StudentAsn}|{command.DateStarted:MMddyyyy}|{type.Alias}",
            includeContext: true);
        await SendJsonAsync(
            HttpMethod.Post,
            "fvsd_studentinterventions",
            payload,
            null,
            cancellationToken);

        return await LoadStudentPlanInterventionsAsync(planId, subject.StudentId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanInterventionsResponse> UpdateStudentPlanInterventionAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid interventionId,
        string currentSchoolYear,
        StudentPlanInterventionCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        ValidateInterventionCommand(command);
        if (string.IsNullOrWhiteSpace(command.ETag))
        {
            throw new ArgumentException("Reload the intervention before saving your changes.");
        }

        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanInterventionValidationQuery(subject.StudentId, schoolYear, interventionId),
            cancellationToken);
        var rows = existingDocument.RootElement.GetProperty("value");
        if (rows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected intervention is not available for this student and annual plan.");
        }

        var existing = rows[0];
        var existingTypeId = ReadGuid(existing, "_fvsd_interventiontype_value");
        if (existingTypeId is null || existingTypeId.Value != command.InterventionTypeId)
        {
            throw new ArgumentException("The Intervention Type cannot be changed after the intervention is created.");
        }

        var options = await LoadStudentPlanInterventionOptionsAsync(subject, cancellationToken);
        ValidateInterventionist(
            command.Interventionist,
            options.Interventionists,
            ReadString(existing, "fvsd_interventionist"));
        var type = options.InterventionTypes.FirstOrDefault(option => option.Id == existingTypeId.Value)
            ?? new StudentPlanInterventionTypeOption(
                existingTypeId.Value,
                ReadFormattedString(existing, "_fvsd_interventiontype_value") ?? "Intervention",
                string.Empty,
                ReadString(existing, "fvsd_curriculum"));
        var source = new InterventionSource(
            ReadString(existing, "fvsd_curriculum") ?? type.Curriculum ?? string.Empty,
            ReadString(existing, "fvsd_courseno") ?? string.Empty,
            ReadString(existing, "fvsd_coursename") ?? string.Empty,
            ReadString(existing, "fvsd_teacheratintervention") ?? string.Empty);
        var payload = BuildStudentPlanInterventionPayload(
            subject,
            schoolYear,
            type,
            source,
            command,
            null,
            includeContext: false);
        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studentinterventions({interventionId:D})",
            payload,
            command.ETag,
            cancellationToken);

        return await LoadStudentPlanInterventionsAsync(planId, subject.StudentId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanInterventionsResponse> DeleteStudentPlanInterventionAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid interventionId,
        string currentSchoolYear,
        string? eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the intervention before deleting it.");
        }

        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanInterventionValidationQuery(subject.StudentId, schoolYear, interventionId),
            cancellationToken);
        if (existingDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected intervention is not available for this student and annual plan.");
        }

        await SendJsonAsync(
            HttpMethod.Delete,
            $"fvsd_studentinterventions({interventionId:D})",
            null,
            eTag,
            cancellationToken);
        return await LoadStudentPlanInterventionsAsync(planId, subject.StudentId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanSignaturesResponse> GetStudentPlanSignaturesAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanSignatureOptionsResponse> GetStudentPlanSignatureOptionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        return await LoadStudentPlanSignatureOptionsAsync(cancellationToken);
    }

    public async Task<StudentPlanSignaturesResponse> CreateStudentPlanSignatureAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        string currentSchoolYear,
        StudentPlanSignatureCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        var normalized = await ValidateStudentPlanSignatureCommandAsync(command, cancellationToken);
        var current = await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
        var addedOrder = current.Signatures.Count == 0
            ? 1
            : current.Signatures.Max(signature => signature.SignatoryAddedOrder) + 1;
        var schoolYearStart = GetSchoolYearStart(schoolYear);
        if (schoolYearStart == int.MinValue)
        {
            throw new ArgumentException("The plan school year is not valid.");
        }

        var school = await GetPlanSchoolContextAsync(subject.SchoolId, cancellationToken);
        var recordName = $"{schoolYearStart}|{subject.StudentAsn}|{school.Alias}|IPP|SIG|{addedOrder:00}";
        await SendJsonAsync(
            HttpMethod.Post,
            "fvsd_studentippsignatures",
            new Dictionary<string, object?>
            {
                ["fvsd_name"] = recordName,
                ["fvsd_studentipp@odata.bind"] = $"/fvsd_studentipps({planId:D})",
                ["fvsd_recipienttype"] = normalized.RecipientType,
                ["fvsd_signatoryrole"] = normalized.SignatoryRole,
                ["fvsd_signatoryname"] = normalized.SignatoryName,
                ["fvsd_signatoryemail"] = normalized.SignatoryEmail,
                ["fvsd_signatoryorder"] = normalized.SignatoryOrder,
                ["fvsd_signatoryaddedorder"] = addedOrder,
                ["fvsd_allowcomments"] = normalized.AllowComments
            },
            null,
            cancellationToken);
        return await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanSignaturesResponse> UpdateStudentPlanSignatureAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid signatureId,
        string currentSchoolYear,
        StudentPlanSignatureCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        if (string.IsNullOrWhiteSpace(command.ETag))
        {
            throw new ArgumentException("Reload the signature before saving your changes.");
        }

        var normalized = await ValidateStudentPlanSignatureCommandAsync(command, cancellationToken);
        var current = await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
        var existing = current.Signatures.FirstOrDefault(signature => signature.Id == signatureId)
            ?? throw new AssessmentWorkspaceAccessException(
                "The selected signature is not available for this annual plan.");
        EnsureSignatureCanBeChanged(existing);

        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studentippsignatures({signatureId:D})",
            new Dictionary<string, object?>
            {
                ["fvsd_recipienttype"] = normalized.RecipientType,
                ["fvsd_signatoryrole"] = normalized.SignatoryRole,
                ["fvsd_signatoryname"] = normalized.SignatoryName,
                ["fvsd_signatoryemail"] = normalized.SignatoryEmail,
                ["fvsd_signatoryorder"] = normalized.SignatoryOrder,
                ["fvsd_allowcomments"] = normalized.AllowComments
            },
            command.ETag,
            cancellationToken);
        return await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanSignaturesResponse> ReorderStudentPlanSignaturesAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        string currentSchoolYear,
        StudentPlanSignatureOrderCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        var current = await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
        ValidateStudentPlanSignatureOrder(current.Signatures, command);

        for (var index = 0; index < command.Signatures.Count; index++)
        {
            var item = command.Signatures[index];
            await SendJsonAsync(
                HttpMethod.Patch,
                $"fvsd_studentippsignatures({item.Id:D})",
                new Dictionary<string, object?>
                {
                    ["fvsd_signatoryorder"] = index + 1
                },
                item.ETag,
                cancellationToken);
        }

        return await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanSignaturesResponse> DeleteStudentPlanSignatureAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid signatureId,
        string currentSchoolYear,
        string? eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var schoolYear = await GetPlanSchoolYearAsync(subject.StudentId, planId, cancellationToken);
        EnsureCurrentPlan(schoolYear, currentSchoolYear);
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the signature before deleting it.");
        }

        var current = await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
        var existing = current.Signatures.FirstOrDefault(signature => signature.Id == signatureId)
            ?? throw new AssessmentWorkspaceAccessException(
                "The selected signature is not available for this annual plan.");
        EnsureSignatureCanBeChanged(existing);
        await SendJsonAsync(
            HttpMethod.Delete,
            $"fvsd_studentippsignatures({signatureId:D})",
            null,
            eTag,
            cancellationToken);
        return await LoadStudentPlanSignaturesAsync(planId, schoolYear, cancellationToken);
    }

    public async Task<StudentPlanCodingResponse> GetStudentPlanCodingAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        await ValidateStudentPlanAccessAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken);
        return await LoadStudentPlanCodingAsync(studentId, planId, cancellationToken);
    }

    public async Task<StudentPlanCodingResponse> UpdateStudentPlanCodingAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        StudentPlanCodingCommand command,
        string eTag,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the coding and conditions section before saving changes.");
        }

        await ValidateStudentPlanAccessAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken);
        var current = await LoadStudentPlanCodingAsync(studentId, planId, cancellationToken);
        var additionalOne = NormalizeCodingGroupCommand(command.AdditionalOne);
        var additionalTwo = NormalizeCodingGroupCommand(command.AdditionalTwo);
        var additionalThree = NormalizeCodingGroupCommand(command.AdditionalThree);
        if (additionalTwo.CategoryId is not null && additionalOne.CategoryId is null)
        {
            throw new ArgumentException("Select the first additional category before selecting the second.");
        }
        if (additionalThree.CategoryId is not null && additionalTwo.CategoryId is null)
        {
            throw new ArgumentException("Select the second additional category before selecting the third.");
        }

        var primaryConditions = ValidateCodingConditions(
            NormalizeConditionNames(command.PrimaryConditions),
            current.Primary.CategoryId,
            current.Primary.CategoryName,
            current.Primary.Conditions,
            current.ConditionOptions);
        var one = ValidateCodingGroup(additionalOne, current.AdditionalGroups[0], current);
        var two = ValidateCodingGroup(additionalTwo, current.AdditionalGroups[1], current);
        var three = ValidateCodingGroup(additionalThree, current.AdditionalGroups[2], current);

        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studentdetails({studentId:D})",
            new Dictionary<string, object?>
            {
                ["fvsd_spedconditions"] = SerializeConditionNames(primaryConditions),
                ["fvsd_additionalspedcategoryone@odata.bind"] = CodingCategoryBind(one.CategoryId),
                ["fvsd_additionalspedconditionsone"] = SerializeConditionNames(one.Conditions),
                ["fvsd_additionalspedobservationsone"] = one.Observations,
                ["fvsd_additionalspedcategorytwo@odata.bind"] = CodingCategoryBind(two.CategoryId),
                ["fvsd_additionalspedconditionstwo"] = SerializeConditionNames(two.Conditions),
                ["fvsd_additionalspedobservationstwo"] = two.Observations,
                ["fvsd_additionalspedcategorythree@odata.bind"] = CodingCategoryBind(three.CategoryId),
                ["fvsd_additionalspedconditionsthree"] = SerializeConditionNames(three.Conditions),
                ["fvsd_additionalspedobservationsthree"] = three.Observations
            },
            eTag,
            cancellationToken);
        return await LoadStudentPlanCodingAsync(studentId, planId, cancellationToken);
    }

    public async Task<IReadOnlyList<StudentPlanDocument>> GetStudentPlanDocumentsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        await ValidateStudentPlanAccessAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken);
        using var document = await GetJsonAsync(BuildStudentPlanDocumentsQuery(planId), cancellationToken);
        return ParseStudentPlanDocuments(document.RootElement);
    }

    public async Task<StudentPlanDocumentContent> GetStudentPlanDocumentContentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        await ValidateStudentPlanAccessAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            planId,
            cancellationToken);
        using var document = await GetJsonAsync(
            BuildStudentPlanDocumentContentQuery(planId, documentId),
            cancellationToken);
        var rows = document.RootElement.GetProperty("value");
        if (rows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected compiled document is not available for this plan.");
        }

        var row = rows[0];
        var mimeType = ReadString(row, "mimetype") ?? "application/octet-stream";
        var fileName = ReadString(row, "filename") ?? "compiled-iep.pdf";
        var encodedContent = ReadString(row, "documentbody");
        if (string.IsNullOrWhiteSpace(encodedContent))
        {
            throw new InvalidOperationException("The selected compiled document does not contain a file.");
        }

        try
        {
            return new StudentPlanDocumentContent(
                ReadGuid(row, "annotationid") ?? documentId,
                fileName,
                mimeType,
                Convert.FromBase64String(encodedContent));
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException(
                "The selected compiled document contains an invalid file payload.",
                exception);
        }
    }

    public async Task<StudentPlanModulesResponse> UpdateStudentPlanAttendanceAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        StudentPlanAttendanceCommand command,
        string eTag,
        CancellationToken cancellationToken = default)
    {
        ValidateAttendancePercentage(command.FallAttendance, "Fall");
        ValidateAttendancePercentage(command.WinterAttendance, "Winter");
        ValidateAttendancePercentage(command.SpringAttendance, "Spring");
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the plan before updating attendance.");
        }

        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId),
            cancellationToken);
        if (planDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studentipps({planId:D})",
            new Dictionary<string, object?>
            {
                ["fvsd_fallattendance"] = command.FallAttendance,
                ["fvsd_winterattendance"] = command.WinterAttendance,
                ["fvsd_springattendance"] = command.SpringAttendance
            },
            eTag,
            cancellationToken);
        return await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
    }

    public async Task<StudentPlanModulesResponse> UpdateStudentPlanSignatureDetailsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        StudentPlanSignatureDetailsCommand command,
        string eTag,
        CancellationToken cancellationToken = default)
    {
        var parentOrGuardianName = NormalizeOptionalText(command.ParentOrGuardianName);
        var parentOrGuardianEmail = NormalizeOptionalText(command.ParentOrGuardianEmail);
        ValidateParentOrGuardianEmail(parentOrGuardianEmail);
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the plan before updating signature details.");
        }

        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId),
            cancellationToken);
        if (planDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studentipps({planId:D})",
            new Dictionary<string, object?>
            {
                ["fvsd_parentorguardianname"] = parentOrGuardianName,
                ["fvsd_parentorguardianemail"] = parentOrGuardianEmail
            },
            eTag,
            cancellationToken);
        return await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
    }

    public async Task<StudentPlanModulesResponse> AddStudentPlanModuleAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid moduleId,
        string eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var current = await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
        var module = current.Modules.FirstOrDefault(item => item.Id == moduleId)
            ?? throw new ArgumentException("The selected IEP / IPP module is not configured.");
        if (!module.Available && !module.Selected)
        {
            throw new AssessmentWorkspaceAccessException(
                module.StateReason ?? "The selected module is not available for this plan.");
        }
        if (module.Selected)
        {
            return current;
        }

        var selectedIds = current.Modules.Where(item => item.Selected).Select(item => item.Id).ToHashSet();
        selectedIds.Add(moduleId);
        await UpdateStudentPlanSectionsAsync(planId, selectedIds, eTag, cancellationToken);
        return await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
    }

    public async Task<StudentPlanModulesResponse> RemoveStudentPlanModuleAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        Guid moduleId,
        string eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var current = await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
        var module = current.Modules.FirstOrDefault(item => item.Id == moduleId)
            ?? throw new ArgumentException("The selected IEP / IPP module is not configured.");
        if (!module.Selected)
        {
            return current;
        }
        if (!module.CanRemove)
        {
            throw new AssessmentWorkspaceAccessException(
                module.StateReason ?? "The selected module is locked and cannot be removed.");
        }

        var selectedIds = current.Modules.Where(item => item.Selected).Select(item => item.Id).ToHashSet();
        selectedIds.Remove(moduleId);
        await UpdateStudentPlanSectionsAsync(planId, selectedIds, eTag, cancellationToken);
        return await LoadStudentPlanModulesAsync(subject, planId, cancellationToken);
    }

    public async Task<IReadOnlyList<TosrecReferenceOption>> GetTosrecReferenceOptionsAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        int period,
        CancellationToken cancellationToken = default)
    {
        ValidatePeriod(period);
        var subject = await GetAssessmentSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        if (subject.StudentGradeValue is null)
        {
            throw new ArgumentException("The selected student does not have a Grade Choice value.");
        }

        using var referencesDocument = await GetJsonAsync(
            BuildTosrecReferencesQuery(subject.StudentGradeValue.Value, period),
            cancellationToken);
        using var termsDocument = await GetJsonAsync(BuildDescriptiveTermsQuery(), cancellationToken);
        return ParseTosrecReferenceOptions(referencesDocument.RootElement, termsDocument.RootElement);
    }

    public async Task CreateTosrecAssessmentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        string currentSchoolYear,
        TosrecAssessmentCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetAssessmentSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        var payload = await BuildTosrecPayloadAsync(subject, currentSchoolYear, command, cancellationToken);
        var recordName = (string)payload["fvsd_name"]!;
        using var duplicateDocument = await GetJsonAsync(
            BuildTosrecDuplicateQuery(recordName, null),
            cancellationToken);
        if (duplicateDocument.RootElement.GetProperty("value").GetArrayLength() > 0)
        {
            throw new AssessmentWorkspaceConflictException(
                "A TOSREC assessment already exists for this student, school year and period.");
        }

        await SendJsonAsync(
            HttpMethod.Post,
            "fvsd_studenttosrecassessments",
            payload,
            null,
            cancellationToken);
    }

    public async Task UpdateTosrecAssessmentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid assessmentId,
        string currentSchoolYear,
        int? currentPeriod,
        TosrecAssessmentCommand command,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetAssessmentSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var existingDocument = await GetJsonAsync(
            BuildTosrecAssessmentValidationQuery(studentId, assessmentId),
            cancellationToken);
        var rows = existingDocument.RootElement.GetProperty("value");
        if (rows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException("The selected TOSREC assessment is not available for this student.");
        }

        var existing = rows[0];
        var existingPeriod = ReadInteger(existing, "fvsd_period");
        var existingSchoolYear = ReadString(existing, "fvsd_schoolyear");
        var isCurrentPeriod = currentPeriod is not null
            && existingPeriod == currentPeriod
            && string.Equals(existingSchoolYear, currentSchoolYear, StringComparison.Ordinal);
        if (!isCurrentPeriod && !subject.Policy.CanManageHistoricalAssessments)
        {
            throw new AssessmentWorkspaceAccessException(
                "This assessment is outside the current period and requires an administrator correction.");
        }

        if (string.IsNullOrWhiteSpace(command.ETag))
        {
            throw new ArgumentException("Reload the assessment before saving your changes.");
        }

        var schoolYearToPersist = string.IsNullOrWhiteSpace(existingSchoolYear)
            ? currentSchoolYear
            : existingSchoolYear;
        var payload = await BuildTosrecPayloadAsync(subject, schoolYearToPersist, command, cancellationToken);
        var recordName = (string)payload["fvsd_name"]!;
        using var duplicateDocument = await GetJsonAsync(
            BuildTosrecDuplicateQuery(recordName, assessmentId),
            cancellationToken);
        if (duplicateDocument.RootElement.GetProperty("value").GetArrayLength() > 0)
        {
            throw new AssessmentWorkspaceConflictException(
                "A TOSREC assessment already exists for this student, school year and period.");
        }

        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studenttosrecassessments({assessmentId:D})",
            payload,
            command.ETag,
            cancellationToken);
    }

    public async Task DeleteTosrecAssessmentAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid assessmentId,
        string? eTag,
        CancellationToken cancellationToken = default)
    {
        var subject = await GetAssessmentSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        if (!subject.Policy.CanDeleteAssessments)
        {
            throw new AssessmentWorkspaceAccessException(
                "Only School Administration and Data Analyst roles can delete assessments.");
        }

        using var existingDocument = await GetJsonAsync(
            BuildTosrecAssessmentValidationQuery(studentId, assessmentId),
            cancellationToken);
        if (existingDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected TOSREC assessment is not available for this student.");
        }

        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the assessment before deleting it.");
        }

        await SendJsonAsync(
            HttpMethod.Delete,
            $"fvsd_studenttosrecassessments({assessmentId:D})",
            null,
            eTag,
            cancellationToken);
    }

    internal static string BuildTeacherSectionsQuery(
        Guid schoolId,
        int sectionGroupValue,
        Guid? teacherEntraObjectId)
    {
        var filter = $"statecode eq 0 and _fvsd_school_value eq {schoolId:D} and fvsd_sectiongrouping eq {sectionGroupValue}";
        if (teacherEntraObjectId is not null)
        {
            filter += $" and fvsd_teacher/fvsd_azureadobjectid eq '{teacherEntraObjectId.Value:D}'";
        }

        return "fvsd_teachersections?" +
            "$select=fvsd_teachersectionid,fvsd_name,fvsd_coursename,fvsd_courseno,fvsd_sectiongrouping," +
            "_fvsd_school_value,_fvsd_teacher_value&" +
            $"$filter={Uri.EscapeDataString(filter)}&" +
            "$expand=fvsd_teacher($select=fvsd_teacherdetailid,fvsd_name,fvsd_azureadobjectid)," +
            "fvsd_studentsection_teachersection($select=fvsd_studentsectionid;$filter=statecode eq 0)&" +
            "$top=5000";
    }

    internal static string BuildSectionGroupsQuery(Guid schoolId, Guid? teacherEntraObjectId)
    {
        var filter = $"statecode eq 0 and _fvsd_school_value eq {schoolId:D} and fvsd_sectiongrouping ne 4";
        if (teacherEntraObjectId is not null)
        {
            filter += $" and fvsd_teacher/fvsd_azureadobjectid eq '{teacherEntraObjectId.Value:D}'";
        }

        return "fvsd_teachersections?" +
            "$select=fvsd_sectiongrouping&" +
            $"$filter={Uri.EscapeDataString(filter)}&$top=5000";
    }

    internal static string BuildTeacherSectionValidationQuery(Guid teacherSectionId) =>
        "fvsd_teachersections?" +
        "$select=fvsd_teachersectionid,_fvsd_school_value&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and fvsd_teachersectionid eq {teacherSectionId:D}")}&" +
        "$expand=fvsd_teacher($select=fvsd_azureadobjectid)&$top=1";

    internal static string BuildStudentsQuery(Guid teacherSectionId) =>
        "fvsd_studentsections?" +
        "$select=fvsd_studentsectionid,fvsd_sectionno,_fvsd_student_value&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and _fvsd_teachersection_value eq {teacherSectionId:D}")}&" +
        "$expand=fvsd_student($select=fvsd_studentdetailid,fvsd_name,fvsd_obfuscatedname,fvsd_asn," +
        "fvsd_obfuscatedasn,fvsd_dateofbirth,fvsd_gender,fvsd_grade,fvsd_spedcategory," +
        "fvsd_spedseriesname,fvsd_fnmi,fvsd_eslcategory,fvsd_spokenlanguage)&$top=5000";

    internal static string BuildAssessmentSectionQuery(Guid teacherSectionId) =>
        "fvsd_teachersections?" +
        "$select=fvsd_teachersectionid,fvsd_name,fvsd_coursename,fvsd_courseno,fvsd_sectiongrouping," +
        "_fvsd_school_value,_fvsd_teacher_value&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and fvsd_teachersectionid eq {teacherSectionId:D}")}&" +
        "$expand=fvsd_teacher($select=fvsd_teacherdetailid,fvsd_name,fvsd_azureadobjectid)&$top=1";

    internal static string BuildAssessmentStudentQuery(Guid teacherSectionId, Guid studentId) =>
        "fvsd_studentsections?" +
        "$select=fvsd_studentsectionid,fvsd_sectionno,_fvsd_student_value&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and _fvsd_teachersection_value eq {teacherSectionId:D} and _fvsd_student_value eq {studentId:D}")}&" +
        "$expand=fvsd_student($select=fvsd_studentdetailid,fvsd_name,fvsd_asn,fvsd_dateofbirth,fvsd_grade)&$top=1";

    internal static string BuildTosrecAssessmentsQuery(Guid studentId) =>
        "fvsd_studenttosrecassessments?" +
        "$select=fvsd_studenttosrecassessmentid,fvsd_name,fvsd_schoolyear,fvsd_period,fvsd_assessmentdate," +
        "fvsd_gradeatassessment,fvsd_chronologicalage,fvsd_curriculum,fvsd_schoolatassessment," +
        "fvsd_courseno,fvsd_coursename,fvsd_teacheratassessment,fvsd_sectionno,fvsd_totalcorrect," +
        "fvsd_totalerror,fvsd_rawscore,fvsd_standardscore,fvsd_percentilerank,fvsd_exempt,fvsd_exemptreason&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and _fvsd_student_value eq {studentId:D}")}&" +
        "$expand=fvsd_descriptiveterm(" +
        "$select=fvsd_name,fvsd_fillhexcode,fvsd_fonthexcode)&" +
        "$orderby=fvsd_schoolyear desc,fvsd_period desc&$top=5000";

    internal static string BuildStudentPlansQuery(Guid studentId) =>
        "fvsd_studentipps?" +
        "$select=fvsd_studentippid,fvsd_name,fvsd_schoolyear,fvsd_gradeatipp," +
        "fvsd_schoolatipp,fvsd_teacheratipp,fvsd_coursename,fvsd_curriculum,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and _fvsd_student_value eq {studentId:D}")}&" +
        "$orderby=fvsd_schoolyear desc,modifiedon desc&$top=5000";

    private static string BuildStudentPlanDuplicateQuery(Guid studentId, string schoolYear) =>
        "fvsd_studentipps?" +
        "$select=fvsd_studentippid,fvsd_name,fvsd_schoolyear,fvsd_gradeatipp," +
        "fvsd_schoolatipp,fvsd_teacheratipp,fvsd_coursename,fvsd_curriculum,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"_fvsd_student_value eq {studentId:D} and fvsd_schoolyear eq '{EscapeODataString(schoolYear)}'")}&" +
        "$orderby=modifiedon desc&$top=2";

    private static string BuildStudentPlanValidationQuery(Guid studentId, Guid planId) =>
        "fvsd_studentipps?" +
        "$select=fvsd_studentippid,fvsd_name,fvsd_ippsections,fvsd_schoolyear,fvsd_gradeatipp," +
        "fvsd_schoolatipp,fvsd_coursename,fvsd_teacheratipp,fvsd_principalatipp," +
        "fvsd_parentorguardianname,fvsd_parentorguardianemail,fvsd_fallattendance,fvsd_winterattendance," +
        "fvsd_springattendance,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and fvsd_studentippid eq {planId:D} and _fvsd_student_value eq {studentId:D}")}&$top=1";

    internal static string BuildStudentPlanCodingQuery(Guid studentId) =>
        "fvsd_studentdetails?" +
        "$select=fvsd_studentdetailid,fvsd_spedseriesname,fvsd_spedconditions," +
        "_fvsd_additionalspedcategoryone_value,fvsd_additionalspedconditionsone,fvsd_additionalspedobservationsone," +
        "_fvsd_additionalspedcategorytwo_value,fvsd_additionalspedconditionstwo,fvsd_additionalspedobservationstwo," +
        "_fvsd_additionalspedcategorythree_value,fvsd_additionalspedconditionsthree,fvsd_additionalspedobservationsthree&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and fvsd_studentdetailid eq {studentId:D}")}&" +
        "$expand=fvsd_additionalspedcategoryone($select=fvsd_powerschoolcodemappingid,fvsd_name)," +
        "fvsd_additionalspedcategorytwo($select=fvsd_powerschoolcodemappingid,fvsd_name)," +
        "fvsd_additionalspedcategorythree($select=fvsd_powerschoolcodemappingid,fvsd_name)&$top=1";

    internal static string BuildSpedCategoryOptionsQuery() =>
        "fvsd_powerschoolcodemappings?" +
        "$select=fvsd_powerschoolcodemappingid,fvsd_code,fvsd_name&" +
        $"$filter={Uri.EscapeDataString("statecode eq 0 and fvsd_mappingtype eq 1")}&" +
        "$orderby=fvsd_code asc,fvsd_name asc&$top=5000";

    internal static string BuildSpedConditionOptionsQuery() =>
        "fvsd_spedconditions?" +
        "$select=fvsd_spedconditionid,fvsd_name,fvsd_conditiondetails,_fvsd_spedcategory_value&" +
        "$filter=statecode eq 0&" +
        "$expand=fvsd_spedcategory($select=fvsd_powerschoolcodemappingid,fvsd_name)&" +
        "$orderby=fvsd_name asc&$top=5000";

    internal static string BuildStudentPlanDocumentsQuery(Guid planId) =>
        "annotations?" +
        "$select=annotationid,subject,notetext,filename,mimetype,filesize,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"isdocument eq true and _objectid_value eq {planId:D}")}&" +
        "$orderby=modifiedon desc&$top=5000";

    internal static string BuildStudentPlanDocumentContentQuery(Guid planId, Guid documentId) =>
        "annotations?" +
        "$select=annotationid,filename,mimetype,documentbody&" +
        $"$filter={Uri.EscapeDataString($"isdocument eq true and annotationid eq {documentId:D} and _objectid_value eq {planId:D}")}&$top=1";

    private static string BuildIppSectionsQuery() =>
        "fvsd_ippsections?" +
        "$select=fvsd_ippsectionid,fvsd_name,fvsd_description,fvsd_frontfacingdescription," +
        "fvsd_includeindropdown,fvsd_showlevelskey,fvsd_lockonselect,fvsd_schoolspecific," +
        "fvsd_sortorder,_fvsd_curriculum_value,_fvsd_school_value&" +
        "$filter=statecode eq 0&" +
        "$expand=fvsd_curriculum($select=fvsd_name),fvsd_school($select=name)&$top=5000";

    internal static string BuildIppSectionByNameQuery(string name) =>
        "fvsd_ippsections?" +
        "$select=fvsd_ippsectionid,fvsd_name&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and fvsd_name eq '{EscapeODataString(name)}'")}&$top=2";

    private static string BuildPlanSchoolContextQuery(Guid schoolId) =>
        "businessunits?" +
        "$select=businessunitid,name,fvsd_alias,_fvsd_principal_value&" +
        $"$filter={Uri.EscapeDataString($"isdisabled eq false and businessunitid eq {schoolId:D}")}&" +
        "$expand=fvsd_principal($select=fullname)&$top=1";

    internal static string BuildPlanTosrecScreenersQuery(Guid studentId, string schoolYear) =>
        "fvsd_studenttosrecassessments?" +
        "$select=fvsd_period,fvsd_assessmentdate,fvsd_standardscore,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and _fvsd_student_value eq {studentId:D} and fvsd_schoolyear eq '{EscapeODataString(schoolYear)}'")}&" +
        "$expand=fvsd_descriptiveterm($select=fvsd_name,fvsd_fillhexcode,fvsd_fonthexcode)&" +
        "$orderby=fvsd_assessmentdate desc,modifiedon desc&$top=50";

    internal static string BuildPlanTowreScreenersQuery(Guid studentId, string schoolYear) =>
        "fvsd_studenttowreassessments?" +
        "$select=fvsd_period,fvsd_assessmentdate,fvsd_standardscore,fvsd_rwstandardscore," +
        "fvsd_nwstandardscore,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and _fvsd_student_value eq {studentId:D} and fvsd_schoolyear eq '{EscapeODataString(schoolYear)}'")}&" +
        "$expand=fvsd_descriptiveterm($select=fvsd_name,fvsd_fillhexcode,fvsd_fonthexcode)," +
        "fvsd_rwdescriptiveterm($select=fvsd_name,fvsd_fillhexcode,fvsd_fonthexcode)," +
        "fvsd_nwdescriptiveterm($select=fvsd_name,fvsd_fillhexcode,fvsd_fonthexcode)&" +
        "$orderby=fvsd_assessmentdate desc,modifiedon desc&$top=50";

    internal static string BuildPlanWratScreenersQuery(Guid studentId, string schoolYear) =>
        "fvsd_studentwratassessments?" +
        "$select=fvsd_period,fvsd_assessmentdate,fvsd_standardscore,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and _fvsd_student_value eq {studentId:D} and fvsd_schoolyear eq '{EscapeODataString(schoolYear)}'")}&" +
        "$expand=fvsd_descriptiveterm($select=fvsd_name,fvsd_fillhexcode,fvsd_fonthexcode)&" +
        "$orderby=fvsd_assessmentdate desc,modifiedon desc&$top=50";

    internal static string BuildPlanInterventionsQuery(Guid studentId, string schoolYear) =>
        "fvsd_studentinterventions?" +
        "$select=fvsd_studentinterventionid,fvsd_curriculum,fvsd_schoolatintervention," +
        "fvsd_teacheratintervention,fvsd_interventionist,fvsd_gradeatintervention," +
        "fvsd_courseno,fvsd_coursename,_fvsd_interventiontype_value," +
        "fvsd_datestarted,fvsd_datewithdrawn,fvsd_withdrawnreason," +
        "fvsd_additionalinformation,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"_fvsd_student_value eq {studentId:D} and fvsd_schoolyear eq '{EscapeODataString(schoolYear)}'")}&" +
        "$expand=fvsd_interventiontype($select=fvsd_name)&" +
        "$orderby=fvsd_datestarted desc,modifiedon desc&$top=5000";

    internal static string BuildStudentPlanSignaturesQuery(Guid planId) =>
        "fvsd_studentippsignatures?" +
        "$select=fvsd_studentippsignatureid,fvsd_name,fvsd_recipienttype,fvsd_signatoryrole," +
        "fvsd_signatoryname,fvsd_signatoryemail,fvsd_signatoryorder,fvsd_signatoryaddedorder," +
        "fvsd_allowcomments,fvsd_daterequested,fvsd_datesigned,statecode,statuscode,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"_fvsd_studentipp_value eq {planId:D}")}&" +
        "$orderby=fvsd_signatoryorder asc,fvsd_signatoryaddedorder asc&$top=5000";

    internal static string BuildStudentPlanOralReadingFluencyQuery(Guid planId) =>
        "fvsd_studentipplevels?" +
        "$select=fvsd_studentipplevelid,fvsd_name,fvsd_currentdateachieved," +
        "fvsd_levelofreading,fvsd_wordsperminute,_fvsd_studentipp_value,_fvsd_section_value,createdon,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"_fvsd_studentipp_value eq {planId:D} and fvsd_section/fvsd_name eq 'Oral Reading Fluency (ORF)'")}&" +
        "$expand=fvsd_section($select=fvsd_name)&" +
        "$orderby=fvsd_currentdateachieved desc,createdon desc&$top=5000";

    internal static string BuildStudentPlanOralReadingFluencyValidationQuery(Guid planId, Guid resultId) =>
        "fvsd_studentipplevels?" +
        "$select=fvsd_studentipplevelid&" +
        $"$filter={Uri.EscapeDataString($"fvsd_studentipplevelid eq {resultId:D} and _fvsd_studentipp_value eq {planId:D} and fvsd_section/fvsd_name eq 'Oral Reading Fluency (ORF)'")}&$top=1";

    internal static string BuildStudentPlanOralReadingFluencyChoicesQuery() =>
        "EntityDefinitions(LogicalName='fvsd_studentipplevel')/" +
        "Attributes(LogicalName='fvsd_levelofreading')/" +
        "Microsoft.Dynamics.CRM.PicklistAttributeMetadata?" +
        "$select=LogicalName&$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)";

    internal static string BuildStudentPlanWordStudyQuery(Guid planId) =>
        "fvsd_studentipplevels?" +
        "$select=fvsd_studentipplevelid,fvsd_name,fvsd_initialdateachieved,fvsd_currentdateachieved," +
        "_fvsd_wtwstartinglevel_value,_fvsd_wtwfinishinglevel_value,_fvsd_studentipp_value,_fvsd_section_value,createdon,modifiedon&" +
        $"$filter={Uri.EscapeDataString($"_fvsd_studentipp_value eq {planId:D} and fvsd_section/fvsd_name eq 'Word Study'")}&" +
        "$expand=fvsd_section($select=fvsd_name)," +
        "fvsd_wtwstartinglevel($select=fvsd_wordstheirwaystageid,fvsd_name,fvsd_section,fvsd_div,fvsd_sortorder)," +
        "fvsd_wtwfinishinglevel($select=fvsd_wordstheirwaystageid,fvsd_name,fvsd_section,fvsd_div,fvsd_sortorder)&" +
        "$orderby=fvsd_initialdateachieved desc,createdon desc&$top=5000";

    internal static string BuildStudentPlanWordStudyValidationQuery(Guid planId, Guid recordId) =>
        "fvsd_studentipplevels?" +
        "$select=fvsd_studentipplevelid&" +
        $"$filter={Uri.EscapeDataString($"fvsd_studentipplevelid eq {recordId:D} and _fvsd_studentipp_value eq {planId:D} and fvsd_section/fvsd_name eq 'Word Study'")}&$top=1";

    internal static string BuildWordStudyStagesQuery() =>
        "fvsd_wordstheirwaystages?" +
        "$select=fvsd_wordstheirwaystageid,fvsd_name,fvsd_section,fvsd_div,fvsd_sortorder&" +
        "$filter=statecode eq 0&$orderby=fvsd_sortorder asc,fvsd_name asc&$top=5000";

    internal static string BuildStudentPlanWritingSnapshotsQuery(Guid planId) =>
        "fvsd_ippactivities?" +
        "$select=activityid,subject,description,actualstart,actualend,fvsd_includeinexport," +
        "fvsd_writingsamplefile,fvsd_writingsamplefile_name,fvsd_writingsampleimage," +
        "createdon,modifiedon,_createdby_value,_regardingobjectid_value&" +
        $"$filter={Uri.EscapeDataString($"_regardingobjectid_value eq {planId:D} and subject eq 'Writing Snapshot'")}&" +
        "$expand=createdby($select=fullname)&" +
        "$orderby=createdon desc&$top=5000";

    internal static string BuildStudentPlanWritingSnapshotValidationQuery(Guid planId, Guid snapshotId) =>
        "fvsd_ippactivities?" +
        "$select=activityid,fvsd_writingsamplefile_name&" +
        $"$filter={Uri.EscapeDataString($"activityid eq {snapshotId:D} and _regardingobjectid_value eq {planId:D} and subject eq 'Writing Snapshot'")}&$top=1";

    internal static string BuildStudentPlanTeacherCommentsQuery(Guid planId) =>
        "fvsd_ippactivities?" +
        "$select=activityid,subject,description,activityadditionalparams,actualstart,actualend," +
        "fvsd_includeinexport,createdon,modifiedon,_createdby_value,_regardingobjectid_value,_fvsd_section_value&" +
        $"$filter={Uri.EscapeDataString($"_regardingobjectid_value eq {planId:D} and subject eq 'Teacher Comment and Next Steps'")}&" +
        "$expand=createdby($select=fullname)&$orderby=createdon desc&$top=5000";

    internal static string BuildStudentPlanTeacherCommentValidationQuery(Guid planId, Guid commentId) =>
        "fvsd_ippactivities?" +
        "$select=activityid&" +
        $"$filter={Uri.EscapeDataString($"activityid eq {commentId:D} and _regardingobjectid_value eq {planId:D} and subject eq 'Teacher Comment and Next Steps'")}&$top=1";

    internal static string BuildIppActivityRelationshipsQuery() =>
        "EntityDefinitions(LogicalName='fvsd_ippactivity')?" +
        "$select=LogicalName&$expand=ManyToOneRelationships(" +
        "$select=ReferencingAttribute,ReferencedEntity,ReferencingEntityNavigationPropertyName)";

    internal static string BuildStudentPlanSignatureChoicesQuery(string attributeName) =>
        "EntityDefinitions(LogicalName='fvsd_studentippsignature')/" +
        $"Attributes(LogicalName='{attributeName}')/" +
        "Microsoft.Dynamics.CRM.PicklistAttributeMetadata?" +
        "$select=LogicalName&$expand=GlobalOptionSet($select=Options)";

    internal static string BuildInterventionReferencesQuery() =>
        "fvsd_interventionreferences?" +
        "$select=fvsd_interventionreferenceid,fvsd_name,fvsd_alias&" +
        "$filter=statecode eq 0&" +
        "$expand=fvsd_curriculum($select=fvsd_name)&" +
        "$orderby=fvsd_name asc&$top=5000";

    internal static string BuildInterventionistsQuery(Guid schoolId) =>
        "fvsd_userroles?" +
        "$select=fvsd_userroleid,fvsd_role,_fvsd_systemuser_value&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and (_fvsd_assignmentone_value eq {schoolId:D} or _fvsd_assignmenttwo_value eq {schoolId:D})")}&" +
        "$expand=fvsd_systemuser($select=fullname)&$top=5000";

    internal static string BuildStudentInterventionSectionsQuery(Guid studentId, Guid schoolId) =>
        "fvsd_studentsections?" +
        "$select=fvsd_studentsectionid,_fvsd_teachersection_value&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and _fvsd_student_value eq {studentId:D} and _fvsd_school_value eq {schoolId:D}")}&" +
        "$expand=fvsd_teachersection(" +
        "$select=fvsd_teachersectionid,fvsd_coursename,fvsd_courseno,fvsd_sectiongrouping;" +
        "$expand=fvsd_teacher($select=fvsd_name))&$top=5000";

    internal static string BuildStudentPlanInterventionValidationQuery(
        Guid studentId,
        string schoolYear,
        Guid interventionId) =>
        "fvsd_studentinterventions?" +
        "$select=fvsd_studentinterventionid,fvsd_schoolyear,fvsd_interventionist," +
        "fvsd_curriculum,fvsd_courseno,fvsd_coursename,fvsd_teacheratintervention," +
        "_fvsd_interventiontype_value&" +
        $"$filter={Uri.EscapeDataString($"fvsd_studentinterventionid eq {interventionId:D} and _fvsd_student_value eq {studentId:D} and fvsd_schoolyear eq '{EscapeODataString(schoolYear)}'")}&$top=1";

    internal static string BuildTosrecReferencesQuery(int grade, int period) =>
        "fvsd_tosrecreferences?" +
        "$select=fvsd_tosrecreferenceid,fvsd_name,fvsd_grade,fvsd_period,fvsd_rawscore," +
        "fvsd_standardscore,fvsd_percentilerank&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and fvsd_grade eq {grade} and fvsd_period eq {period}")}&" +
        "$orderby=fvsd_rawscore asc&$top=5000";

    internal static string BuildDescriptiveTermsQuery() =>
        "fvsd_descriptiveterms?" +
        "$select=fvsd_descriptivetermid,fvsd_name,fvsd_rangelowvalue,fvsd_rangehighvalue," +
        "fvsd_fillhexcode,fvsd_fonthexcode&$filter=statecode eq 0&$top=5000";

    internal static string BuildTosrecAssessmentValidationQuery(Guid studentId, Guid assessmentId) =>
        "fvsd_studenttosrecassessments?" +
        "$select=fvsd_studenttosrecassessmentid,fvsd_schoolyear,fvsd_period&" +
        $"$filter={Uri.EscapeDataString($"statecode eq 0 and fvsd_studenttosrecassessmentid eq {assessmentId:D} and _fvsd_student_value eq {studentId:D}")}&$top=1";

    internal static string BuildTosrecDuplicateQuery(string recordName, Guid? excludedAssessmentId)
    {
        var filter = $"statecode eq 0 and fvsd_name eq '{EscapeODataString(recordName)}'";
        if (excludedAssessmentId is not null)
        {
            filter += $" and fvsd_studenttosrecassessmentid ne {excludedAssessmentId.Value:D}";
        }

        return "fvsd_studenttosrecassessments?" +
            "$select=fvsd_studenttosrecassessmentid&" +
            $"$filter={Uri.EscapeDataString(filter)}&$top=1";
    }

    internal static IReadOnlyList<AssessmentTeacherSection> ParseTeacherSections(
        JsonElement root,
        IReadOnlyDictionary<string, int> mappings)
    {
        var rows = new List<AssessmentTeacherSection>();
        foreach (var row in root.GetProperty("value").EnumerateArray())
        {
            var id = ReadGuid(row, "fvsd_teachersectionid");
            var schoolId = ReadGuid(row, "_fvsd_school_value");
            var teacherId = ReadGuid(row, "_fvsd_teacher_value");
            if (id is null || schoolId is null || teacherId is null)
            {
                continue;
            }

            var courseNumber = ReadString(row, "fvsd_courseno") ?? string.Empty;
            var courseName = ReadString(row, "fvsd_coursename") ?? courseNumber;
            var sectionGroup = ReadFormattedString(row, "fvsd_sectiongrouping") ?? "Other";
            var teacherName = ReadString(row, "fvsd_teacher", "fvsd_name")
                ?? ReadFormattedString(row, "_fvsd_teacher_value")
                ?? "Teacher";
            var studentCount = row.TryGetProperty("fvsd_studentsection_teachersection", out var students)
                && students.ValueKind == JsonValueKind.Array
                    ? students.GetArrayLength()
                    : 0;

            rows.Add(new AssessmentTeacherSection(
                id.Value,
                ReadString(row, "fvsd_name") ?? string.Empty,
                schoolId.Value,
                ReadFormattedString(row, "_fvsd_school_value") ?? schoolId.Value.ToString(),
                sectionGroup,
                GetSectionGroupOrder(sectionGroup),
                courseNumber,
                courseName,
                mappings.GetValueOrDefault(courseNumber, int.MaxValue),
                teacherId.Value,
                teacherName,
                studentCount));
        }

        return rows
            .Where(row => row.StudentCount > 0)
            .OrderBy(row => row.SchoolName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(row => row.SectionGroupOrder)
            .ThenBy(row => row.SortOrder)
            .ThenBy(row => row.CourseName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(row => row.TeacherName, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    internal static IReadOnlyList<AssessmentStudent> ParseStudents(JsonElement root)
    {
        var students = new List<AssessmentStudent>();
        foreach (var row in root.GetProperty("value").EnumerateArray())
        {
            var studentSectionId = ReadGuid(row, "fvsd_studentsectionid");
            if (studentSectionId is null
                || !row.TryGetProperty("fvsd_student", out var student)
                || student.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var studentId = ReadGuid(student, "fvsd_studentdetailid");
            if (studentId is null)
            {
                continue;
            }

            students.Add(new AssessmentStudent(
                studentSectionId.Value,
                ReadString(row, "fvsd_sectionno"),
                studentId.Value,
                ReadString(student, "fvsd_name") ?? "Student",
                ReadString(student, "fvsd_obfuscatedname"),
                ReadString(student, "fvsd_asn"),
                ReadString(student, "fvsd_obfuscatedasn"),
                ReadDateTimeOffset(student, "fvsd_dateofbirth"),
                ReadFormattedString(student, "fvsd_gender"),
                ReadFormattedString(student, "fvsd_grade"),
                ReadInteger(student, "fvsd_grade"),
                ReadFormattedString(student, "fvsd_spedcategory"),
                ReadString(student, "fvsd_spedseriesname"),
                ReadString(student, "fvsd_fnmi"),
                ReadFormattedString(student, "fvsd_eslcategory"),
                ReadString(student, "fvsd_spokenlanguage")));
        }

        return students.OrderBy(student => student.Name, StringComparer.OrdinalIgnoreCase).ToArray();
    }

    internal static IReadOnlyList<AssessmentHistoryRecord> ParseTosrecAssessments(JsonElement root)
    {
        var assessments = new List<AssessmentHistoryRecord>();
        foreach (var row in root.GetProperty("value").EnumerateArray())
        {
            var id = ReadGuid(row, "fvsd_studenttosrecassessmentid");
            if (id is null)
            {
                continue;
            }

            var period = ReadFormattedString(row, "fvsd_period")
                ?? GetPeriodLabel(ReadInteger(row, "fvsd_period"));
            var term = row.TryGetProperty("fvsd_descriptiveterm", out var descriptiveTerm)
                && descriptiveTerm.ValueKind == JsonValueKind.Object
                    ? descriptiveTerm
                    : default;

            assessments.Add(new AssessmentHistoryRecord(
                id.Value,
                "TOSREC",
                ReadString(row, "fvsd_name") ?? string.Empty,
                ReadString(row, "fvsd_schoolyear") ?? "School year not recorded",
                period ?? "Period not recorded",
                GetPeriodSortOrder(period),
                ReadDateTimeOffset(row, "fvsd_assessmentdate"),
                ReadFormattedString(row, "fvsd_gradeatassessment"),
                ReadString(row, "fvsd_chronologicalage"),
                ReadString(row, "fvsd_curriculum"),
                ReadString(row, "fvsd_schoolatassessment"),
                ReadString(row, "fvsd_courseno"),
                ReadString(row, "fvsd_coursename"),
                ReadString(row, "fvsd_teacheratassessment"),
                ReadString(row, "fvsd_sectionno"),
                ReadInteger(row, "fvsd_totalcorrect"),
                ReadInteger(row, "fvsd_totalerror"),
                ReadInteger(row, "fvsd_rawscore"),
                ReadInteger(row, "fvsd_standardscore"),
                ReadString(row, "fvsd_percentilerank"),
                term.ValueKind == JsonValueKind.Object
                    ? ReadString(term, "fvsd_name") ?? "Unassigned"
                    : "Unassigned",
                term.ValueKind == JsonValueKind.Object
                    ? NormalizeHexColour(ReadString(term, "fvsd_fillhexcode"))
                    : null,
                term.ValueKind == JsonValueKind.Object
                    ? NormalizeHexColour(ReadString(term, "fvsd_fonthexcode"))
                    : null,
                ReadBoolean(row, "fvsd_exempt") ?? false,
                ReadString(row, "fvsd_exemptreason"),
                ReadString(row, "@odata.etag")));
        }

        return assessments
            .OrderByDescending(assessment => GetSchoolYearStart(assessment.SchoolYear))
            .ThenByDescending(assessment => assessment.PeriodSortOrder)
            .ThenByDescending(assessment => assessment.AssessmentDate)
            .ToArray();
    }

    internal static IReadOnlyList<StudentPlanHistoryRecord> ParseStudentPlans(JsonElement root)
    {
        var plans = new List<StudentPlanHistoryRecord>();
        foreach (var row in root.GetProperty("value").EnumerateArray())
        {
            var id = ReadGuid(row, "fvsd_studentippid");
            if (id is null)
            {
                continue;
            }

            plans.Add(new StudentPlanHistoryRecord(
                id.Value,
                ReadString(row, "fvsd_name") ?? "IEP / IPP",
                ReadString(row, "fvsd_schoolyear") ?? "School year not recorded",
                ReadFormattedString(row, "fvsd_gradeatipp"),
                ReadString(row, "fvsd_schoolatipp"),
                ReadString(row, "fvsd_teacheratipp"),
                ReadString(row, "fvsd_coursename"),
                ReadString(row, "fvsd_curriculum"),
                ReadDateTimeOffset(row, "modifiedon")));
        }

        return plans
            .OrderByDescending(plan => GetSchoolYearStart(plan.SchoolYear))
            .ThenByDescending(plan => plan.ModifiedOn)
            .ToArray();
    }

    internal static IReadOnlyList<StudentPlanScreenerResult> ParseStudentPlanScreeners(
        JsonElement tosrecRoot,
        JsonElement towreRoot,
        JsonElement wratRoot)
    {
        var results = new List<StudentPlanScreenerResult>();
        foreach (var row in tosrecRoot.GetProperty("value").EnumerateArray())
        {
            results.Add(CreatePlanScreenerResult(
                row,
                "TOSREC",
                "fvsd_standardscore",
                "fvsd_descriptiveterm"));
        }

        foreach (var row in towreRoot.GetProperty("value").EnumerateArray())
        {
            results.Add(CreatePlanScreenerResult(
                row,
                "TOWRE",
                "fvsd_standardscore",
                "fvsd_descriptiveterm"));
            results.Add(CreatePlanScreenerResult(
                row,
                "TOWRE RW",
                "fvsd_rwstandardscore",
                "fvsd_rwdescriptiveterm"));
            results.Add(CreatePlanScreenerResult(
                row,
                "TOWRE NW",
                "fvsd_nwstandardscore",
                "fvsd_nwdescriptiveterm"));
        }

        foreach (var row in wratRoot.GetProperty("value").EnumerateArray())
        {
            results.Add(CreatePlanScreenerResult(
                row,
                "WRAT-5",
                "fvsd_standardscore",
                "fvsd_descriptiveterm"));
        }

        return results
            .Where(result => result.PeriodSortOrder > 0)
            .GroupBy(result => new { result.AssessmentType, result.Period })
            .Select(group => group.First())
            .OrderBy(result => GetPlanScreenerOrder(result.AssessmentType))
            .ThenBy(result => result.PeriodSortOrder)
            .ToArray();
    }

    private static StudentPlanScreenerResult CreatePlanScreenerResult(
        JsonElement row,
        string assessmentType,
        string standardScoreProperty,
        string descriptiveTermProperty)
    {
        var period = ReadFormattedString(row, "fvsd_period")
            ?? GetPeriodLabel(ReadInteger(row, "fvsd_period"))
            ?? "Period not recorded";
        var term = row.TryGetProperty(descriptiveTermProperty, out var descriptiveTerm)
            && descriptiveTerm.ValueKind == JsonValueKind.Object
                ? descriptiveTerm
                : default;
        return new StudentPlanScreenerResult(
            assessmentType,
            period,
            GetPeriodSortOrder(period),
            ReadDateTimeOffset(row, "fvsd_assessmentdate"),
            ReadInteger(row, standardScoreProperty),
            term.ValueKind == JsonValueKind.Object ? ReadString(term, "fvsd_name") : null,
            term.ValueKind == JsonValueKind.Object
                ? NormalizeHexColour(ReadString(term, "fvsd_fillhexcode"))
                : null,
            term.ValueKind == JsonValueKind.Object
                ? NormalizeHexColour(ReadString(term, "fvsd_fonthexcode"))
                : null);
    }

    private static int GetPlanScreenerOrder(string assessmentType) => assessmentType switch
    {
        "TOSREC" => 1,
        "TOWRE" => 2,
        "TOWRE RW" => 3,
        "TOWRE NW" => 4,
        "WRAT-5" => 5,
        _ => int.MaxValue
    };

    internal static IReadOnlyList<StudentPlanOralReadingFluencyResult> ParseStudentPlanOralReadingFluency(
        JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var id = ReadGuid(row, "fvsd_studentipplevelid");
                var level = ReadInteger(row, "fvsd_levelofreading");
                var wordsPerMinute = ReadInteger(row, "fvsd_wordsperminute");
                return id is null || level is null || wordsPerMinute is null
                    ? null
                    : new StudentPlanOralReadingFluencyResult(
                        id.Value,
                        ReadString(row, "fvsd_name") ?? "Oral Reading Fluency",
                        ReadDateTimeOffset(row, "fvsd_currentdateachieved"),
                        level.Value,
                        ReadFormattedString(row, "fvsd_levelofreading") ?? $"Level {level.Value}",
                        wordsPerMinute.Value,
                        ReadString(row, "@odata.etag"));
            })
            .Where(result => result is not null)
            .Cast<StudentPlanOralReadingFluencyResult>()
            .OrderByDescending(result => result.AssessmentDate)
            .ThenByDescending(result => result.Id)
            .ToArray();

    internal static IReadOnlyList<StudentPlanOralReadingFluencyOption> ParseStudentPlanOralReadingFluencyOptions(
        JsonElement root)
    {
        JsonElement optionSet;
        if ((!root.TryGetProperty("OptionSet", out optionSet) || optionSet.ValueKind != JsonValueKind.Object)
            && (!root.TryGetProperty("GlobalOptionSet", out optionSet) || optionSet.ValueKind != JsonValueKind.Object))
        {
            return Array.Empty<StudentPlanOralReadingFluencyOption>();
        }
        if (!optionSet.TryGetProperty("Options", out var options) || options.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<StudentPlanOralReadingFluencyOption>();
        }

        return options.EnumerateArray()
            .Select(option =>
            {
                var value = ReadInteger(option, "Value");
                var label = option.TryGetProperty("Label", out var labelContainer)
                    && labelContainer.ValueKind == JsonValueKind.Object
                    && labelContainer.TryGetProperty("UserLocalizedLabel", out var localizedLabel)
                    && localizedLabel.ValueKind == JsonValueKind.Object
                        ? ReadString(localizedLabel, "Label")
                        : null;
                return value is null || string.IsNullOrWhiteSpace(label)
                    ? null
                    : new StudentPlanOralReadingFluencyOption(value.Value, label);
            })
            .Where(option => option is not null)
            .Cast<StudentPlanOralReadingFluencyOption>()
            .OrderBy(option => option.Value)
            .ToArray();
    }

    internal static IReadOnlyList<StudentPlanWordStudyRecord> ParseStudentPlanWordStudy(JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var id = ReadGuid(row, "fvsd_studentipplevelid");
                var startingId = ReadGuid(row, "_fvsd_wtwstartinglevel_value");
                if (id is null || startingId is null)
                {
                    return null;
                }

                var starting = row.TryGetProperty("fvsd_wtwstartinglevel", out var startingStage)
                    && startingStage.ValueKind == JsonValueKind.Object ? startingStage : default;
                var finishing = row.TryGetProperty("fvsd_wtwfinishinglevel", out var finishingStage)
                    && finishingStage.ValueKind == JsonValueKind.Object ? finishingStage : default;
                return new StudentPlanWordStudyRecord(
                    id.Value,
                    ReadString(row, "fvsd_name") ?? "Word Study",
                    ReadDateTimeOffset(row, "fvsd_initialdateachieved"),
                    ReadDateTimeOffset(row, "fvsd_currentdateachieved"),
                    startingId.Value,
                    starting.ValueKind == JsonValueKind.Object
                        ? ReadString(starting, "fvsd_name") ?? "Starting level"
                        : ReadFormattedString(row, "_fvsd_wtwstartinglevel_value") ?? "Starting level",
                    starting.ValueKind == JsonValueKind.Object ? ReadFormattedString(starting, "fvsd_section") : null,
                    starting.ValueKind == JsonValueKind.Object ? ReadFormattedString(starting, "fvsd_div") : null,
                    ReadGuid(row, "_fvsd_wtwfinishinglevel_value"),
                    finishing.ValueKind == JsonValueKind.Object ? ReadString(finishing, "fvsd_name") : null,
                    finishing.ValueKind == JsonValueKind.Object ? ReadFormattedString(finishing, "fvsd_section") : null,
                    finishing.ValueKind == JsonValueKind.Object ? ReadFormattedString(finishing, "fvsd_div") : null,
                    ReadString(row, "@odata.etag"));
            })
            .Where(record => record is not null)
            .Cast<StudentPlanWordStudyRecord>()
            .OrderByDescending(record => record.TermStartDate)
            .ThenByDescending(record => record.Id)
            .ToArray();

    internal static IReadOnlyList<StudentPlanWordStudyStageOption> ParseWordStudyStages(JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var id = ReadGuid(row, "fvsd_wordstheirwaystageid");
                var name = ReadString(row, "fvsd_name");
                if (id is null || string.IsNullOrWhiteSpace(name))
                {
                    return null;
                }

                var section = ReadFormattedString(row, "fvsd_section");
                var expectedGrade = ReadFormattedString(row, "fvsd_div");
                var sortOrder = ReadInteger(row, "fvsd_sortorder")
                    ?? ParseSortOrder(ReadString(row, "fvsd_sortorder"));
                var prefix = string.Equals(section, "Emergent", StringComparison.OrdinalIgnoreCase)
                    ? $"E{sortOrder}"
                    : sortOrder.ToString(CultureInfo.InvariantCulture);
                var display = $"{prefix}. {name}" + (string.IsNullOrWhiteSpace(section) ? string.Empty : $" ({section})");
                return new StudentPlanWordStudyStageOption(
                    id.Value, name, section, expectedGrade, sortOrder, display);
            })
            .Where(option => option is not null)
            .Cast<StudentPlanWordStudyStageOption>()
            .OrderBy(option => option.SortOrder)
            .ThenBy(option => option.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    internal static IReadOnlyList<StudentPlanWritingSnapshotRecord> ParseStudentPlanWritingSnapshots(
        JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var id = ReadGuid(row, "activityid");
                if (id is null)
                {
                    return null;
                }

                var fileName = ReadString(row, "fvsd_writingsamplefile_name");
                var addedBy = row.TryGetProperty("createdby", out var creator)
                    && creator.ValueKind == JsonValueKind.Object
                        ? ReadString(creator, "fullname")
                        : null;
                return new StudentPlanWritingSnapshotRecord(
                    id.Value,
                    ReadString(row, "subject") ?? "Writing Snapshot",
                    ReadString(row, "description") ?? string.Empty,
                    ReadBoolean(row, "fvsd_includeinexport") ?? false,
                    ReadDateTimeOffset(row, "actualstart"),
                    addedBy ?? ReadFormattedString(row, "_createdby_value") ?? "—",
                    ReadDateTimeOffset(row, "createdon"),
                    ReadGuid(row, "fvsd_writingsamplefile") is not null || !string.IsNullOrWhiteSpace(fileName),
                    fileName,
                    !string.IsNullOrWhiteSpace(ReadString(row, "fvsd_writingsampleimage")),
                    ReadString(row, "@odata.etag"));
            })
            .Where(record => record is not null)
            .Cast<StudentPlanWritingSnapshotRecord>()
            .OrderByDescending(record => record.CreatedOn)
            .ThenByDescending(record => record.Id)
            .ToArray();

    internal static IReadOnlyList<StudentPlanTeacherCommentRecord> ParseStudentPlanTeacherComments(
        JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var id = ReadGuid(row, "activityid");
                var sectionId = ReadGuid(row, "_fvsd_section_value");
                if (id is null || sectionId is null)
                {
                    return null;
                }
                var addedBy = row.TryGetProperty("createdby", out var creator)
                    && creator.ValueKind == JsonValueKind.Object
                        ? ReadString(creator, "fullname")
                        : null;
                return new StudentPlanTeacherCommentRecord(
                    id.Value,
                    sectionId.Value,
                    ReadFormattedString(row, "_fvsd_section_value") ?? "Plan section",
                    ReadString(row, "description") ?? string.Empty,
                    ReadString(row, "activityadditionalparams"),
                    ReadBoolean(row, "fvsd_includeinexport") ?? false,
                    ReadDateTimeOffset(row, "actualstart"),
                    addedBy ?? ReadFormattedString(row, "_createdby_value") ?? "—",
                    ReadDateTimeOffset(row, "createdon"),
                    ReadString(row, "@odata.etag"));
            })
            .Where(record => record is not null)
            .Cast<StudentPlanTeacherCommentRecord>()
            .OrderByDescending(record => record.CreatedOn)
            .ThenByDescending(record => record.Id)
            .ToArray();

    internal static string? ParseIppActivitySectionNavigationProperty(JsonElement root)
    {
        if (!root.TryGetProperty("ManyToOneRelationships", out var relationships)
            || relationships.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var candidates = relationships.EnumerateArray()
            .Where(relationship => string.Equals(
                ReadString(relationship, "ReferencedEntity"),
                "fvsd_ippsection",
                StringComparison.OrdinalIgnoreCase))
            .ToArray();
        return candidates
            .OrderByDescending(relationship => string.Equals(
                ReadString(relationship, "ReferencingAttribute"),
                "fvsd_section",
                StringComparison.OrdinalIgnoreCase))
            .Select(relationship => ReadString(relationship, "ReferencingEntityNavigationPropertyName"))
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    internal static IReadOnlyList<StudentPlanIntervention> ParseStudentPlanInterventions(JsonElement root)
    {
        var interventions = new List<StudentPlanIntervention>();
        foreach (var row in root.GetProperty("value").EnumerateArray())
        {
            var id = ReadGuid(row, "fvsd_studentinterventionid");
            if (id is null)
            {
                continue;
            }

            var typeName = row.TryGetProperty("fvsd_interventiontype", out var type)
                && type.ValueKind == JsonValueKind.Object
                    ? ReadString(type, "fvsd_name")
                    : null;
            interventions.Add(new StudentPlanIntervention(
                id.Value,
                ReadGuid(row, "_fvsd_interventiontype_value"),
                typeName ?? "Intervention type not recorded",
                ReadString(row, "fvsd_interventionist"),
                ReadString(row, "fvsd_teacheratintervention"),
                ReadString(row, "fvsd_schoolatintervention"),
                ReadFormattedString(row, "fvsd_gradeatintervention"),
                ReadString(row, "fvsd_curriculum"),
                ReadString(row, "fvsd_courseno"),
                ReadString(row, "fvsd_coursename"),
                ReadDateTimeOffset(row, "fvsd_datestarted"),
                ReadDateTimeOffset(row, "fvsd_datewithdrawn"),
                ReadFormattedString(row, "fvsd_withdrawnreason"),
                ReadString(row, "fvsd_additionalinformation"),
                ReadString(row, "@odata.etag")));
        }

        return interventions
            .OrderByDescending(intervention => intervention.DateStarted)
            .ToArray();
    }

    internal static IReadOnlyList<StudentPlanSignature> ParseStudentPlanSignatures(JsonElement root)
    {
        var signatures = new List<StudentPlanSignature>();
        foreach (var row in root.GetProperty("value").EnumerateArray())
        {
            var id = ReadGuid(row, "fvsd_studentippsignatureid");
            if (id is null)
            {
                continue;
            }

            var recipientType = ReadInteger(row, "fvsd_recipienttype") ?? 0;
            var signatoryRole = ReadInteger(row, "fvsd_signatoryrole") ?? 0;
            var stateCode = ReadInteger(row, "statecode") ?? 0;
            var statusCode = ReadInteger(row, "statuscode") ?? 0;
            signatures.Add(new StudentPlanSignature(
                id.Value,
                ReadString(row, "fvsd_name") ?? "Signature",
                recipientType,
                ReadFormattedString(row, "fvsd_recipienttype") ?? $"Recipient type {recipientType}",
                signatoryRole,
                ReadFormattedString(row, "fvsd_signatoryrole") ?? $"Signatory role {signatoryRole}",
                ReadString(row, "fvsd_signatoryname") ?? string.Empty,
                ReadString(row, "fvsd_signatoryemail") ?? string.Empty,
                ReadInteger(row, "fvsd_signatoryorder") ?? 0,
                ReadInteger(row, "fvsd_signatoryaddedorder") ?? 0,
                ReadBoolean(row, "fvsd_allowcomments") ?? false,
                ReadDateTimeOffset(row, "fvsd_daterequested"),
                ReadString(row, "fvsd_datesigned"),
                stateCode,
                ReadFormattedString(row, "statecode") ?? (stateCode == 0 ? "Active" : "Inactive"),
                statusCode,
                ReadFormattedString(row, "statuscode") ?? $"Status {statusCode}",
                ReadString(row, "@odata.etag")));
        }

        return signatures
            .OrderBy(signature => signature.SignatoryOrder)
            .ThenBy(signature => signature.SignatoryAddedOrder)
            .ToArray();
    }

    internal static IReadOnlyList<StudentPlanSignatureChoiceOption> ParseStudentPlanSignatureChoices(
        JsonElement root)
    {
        if (!root.TryGetProperty("GlobalOptionSet", out var optionSet)
            || optionSet.ValueKind != JsonValueKind.Object
            || !optionSet.TryGetProperty("Options", out var options)
            || options.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<StudentPlanSignatureChoiceOption>();
        }

        return options.EnumerateArray()
            .Select(option =>
            {
                var value = ReadInteger(option, "Value");
                var label = option.TryGetProperty("Label", out var labelContainer)
                    && labelContainer.ValueKind == JsonValueKind.Object
                    && labelContainer.TryGetProperty("UserLocalizedLabel", out var localizedLabel)
                    && localizedLabel.ValueKind == JsonValueKind.Object
                        ? ReadString(localizedLabel, "Label")
                        : null;
                return value is null || string.IsNullOrWhiteSpace(label)
                    ? null
                    : new StudentPlanSignatureChoiceOption(value.Value, label);
            })
            .Where(option => option is not null)
            .Cast<StudentPlanSignatureChoiceOption>()
            .OrderBy(option => option.Value)
            .ToArray();
    }

    internal static IReadOnlyList<StudentPlanInterventionTypeOption> ParseStudentPlanInterventionTypes(
        JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var id = ReadGuid(row, "fvsd_interventionreferenceid");
                var name = ReadString(row, "fvsd_name");
                if (id is null || string.IsNullOrWhiteSpace(name))
                {
                    return null;
                }

                return new StudentPlanInterventionTypeOption(
                    id.Value,
                    name,
                    ReadString(row, "fvsd_alias") ?? name,
                    ReadString(row, "fvsd_curriculum", "fvsd_name"));
            })
            .Where(option => option is not null)
            .Cast<StudentPlanInterventionTypeOption>()
            .OrderBy(option => option.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    internal static IReadOnlyList<StudentPlanInterventionistOption> ParseStudentPlanInterventionists(
        JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var name = ReadString(row, "fvsd_systemuser", "fullname");
                if (string.IsNullOrWhiteSpace(name))
                {
                    return null;
                }

                var role = ReadFormattedString(row, "fvsd_role") ?? "Role not recorded";
                return new StudentPlanInterventionistOption(name, role, $"{name} - {role}");
            })
            .Where(option => option is not null)
            .Cast<StudentPlanInterventionistOption>()
            .DistinctBy(option => option.Display, StringComparer.OrdinalIgnoreCase)
            .OrderBy(option => option.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(option => option.Role, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    internal static IReadOnlyList<StudentPlanInterventionSectionOption> ParseStudentInterventionSections(
        JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                if (!row.TryGetProperty("fvsd_teachersection", out var section)
                    || section.ValueKind != JsonValueKind.Object)
                {
                    return null;
                }

                var sectionId = ReadGuid(section, "fvsd_teachersectionid");
                var sectionGroup = ReadFormattedString(section, "fvsd_sectiongrouping")
                    ?? GetSectionGroupLabel(ReadInteger(section, "fvsd_sectiongrouping"));
                var curriculum = sectionGroup switch
                {
                    "Literacy" => "English Language Arts and Literature",
                    "Numeracy" => "Mathematics",
                    _ => null
                };
                if (sectionId is null || curriculum is null || sectionGroup is null)
                {
                    return null;
                }

                return new StudentPlanInterventionSectionOption(
                    sectionId.Value,
                    curriculum,
                    sectionGroup,
                    ReadString(section, "fvsd_courseno") ?? string.Empty,
                    ReadString(section, "fvsd_coursename") ?? "Course name not recorded",
                    ReadString(section, "fvsd_teacher", "fvsd_name") ?? "Teacher not recorded");
            })
            .Where(option => option is not null)
            .Cast<StudentPlanInterventionSectionOption>()
            .DistinctBy(option => option.TeacherSectionId)
            .OrderBy(option => option.Curriculum, StringComparer.OrdinalIgnoreCase)
            .ThenBy(option => option.CourseName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(option => option.TeacherName, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    internal static IReadOnlyList<StudentPlanDocument> ParseStudentPlanDocuments(JsonElement root)
    {
        var documents = new List<StudentPlanDocument>();
        foreach (var row in root.GetProperty("value").EnumerateArray())
        {
            var id = ReadGuid(row, "annotationid");
            var fileName = ReadString(row, "filename");
            var mimeType = ReadString(row, "mimetype") ?? "application/octet-stream";
            if (id is null || string.IsNullOrWhiteSpace(fileName))
            {
                continue;
            }

            if (!string.Equals(mimeType, "application/pdf", StringComparison.OrdinalIgnoreCase)
                && !fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            documents.Add(new StudentPlanDocument(
                id.Value,
                ReadString(row, "subject") ?? fileName,
                ReadString(row, "notetext"),
                fileName,
                mimeType,
                ReadInteger(row, "filesize"),
                ReadDateTimeOffset(row, "modifiedon")));
        }

        return documents
            .OrderByDescending(document => document.ModifiedOn)
            .ToArray();
    }

    private async Task<PlanSubject> GetPlanSubjectAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var students = await GetStudentsAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            cancellationToken);
        var student = students.FirstOrDefault(item => item.Id == studentId)
            ?? throw new AssessmentWorkspaceAccessException(
                "The selected student is outside the signed-in user's teacher-section scope.");

        using var sectionDocument = await GetJsonAsync(
            BuildAssessmentSectionQuery(teacherSectionId),
            cancellationToken);
        var sectionRows = sectionDocument.RootElement.GetProperty("value");
        if (sectionRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException("The selected teacher section is not available.");
        }

        var section = sectionRows[0];
        var schoolId = ReadGuid(section, "_fvsd_school_value")
            ?? throw new AssessmentWorkspaceAccessException("The selected teacher section does not have a school.");
        var sectionGroup = ReadFormattedString(section, "fvsd_sectiongrouping")
            ?? GetSectionGroupLabel(ReadInteger(section, "fvsd_sectiongrouping"))
            ?? string.Empty;
        if (sectionGroup is not ("Foundations" or "Homeroom"))
        {
            throw new AssessmentWorkspaceAccessException(
                "IEP / IPP entry is available only from Foundations or Homeroom sections.");
        }

        return new PlanSubject(
            student.Id,
            student.Name,
            student.Asn ?? string.Empty,
            student.Grade,
            student.GradeValue,
            string.Equals(student.SpedCategory, "Coded", StringComparison.OrdinalIgnoreCase),
            schoolId,
            ReadFormattedString(section, "_fvsd_school_value") ?? schoolId.ToString(),
            ReadString(section, "fvsd_courseno") ?? string.Empty,
            ReadString(section, "fvsd_coursename") ?? string.Empty,
            ReadString(section, "fvsd_teacher", "fvsd_name")
                ?? ReadFormattedString(section, "_fvsd_teacher_value")
                ?? "Teacher",
            sectionGroup);
    }

    private async Task<string> GetPlanSchoolYearAsync(
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken)
    {
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(studentId, planId),
            cancellationToken);
        var planRows = planDocument.RootElement.GetProperty("value");
        if (planRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        return ReadString(planRows[0], "fvsd_schoolyear")
            ?? throw new InvalidOperationException("The selected plan does not have a school year.");
    }

    private async Task<StudentPlanInterventionsResponse> LoadStudentPlanInterventionsAsync(
        Guid planId,
        Guid studentId,
        string schoolYear,
        CancellationToken cancellationToken)
    {
        using var interventionsDocument = await GetJsonAsync(
            BuildPlanInterventionsQuery(studentId, schoolYear),
            cancellationToken);
        return new StudentPlanInterventionsResponse(
            planId,
            schoolYear,
            ParseStudentPlanInterventions(interventionsDocument.RootElement));
    }

    private async Task<StudentPlanOralReadingFluencyResponse> LoadStudentPlanOralReadingFluencyAsync(
        Guid planId,
        string schoolYear,
        CancellationToken cancellationToken)
    {
        using var resultsDocument = await GetJsonAsync(
            BuildStudentPlanOralReadingFluencyQuery(planId),
            cancellationToken);
        return new StudentPlanOralReadingFluencyResponse(
            planId,
            schoolYear,
            ParseStudentPlanOralReadingFluency(resultsDocument.RootElement));
    }

    private async Task<StudentPlanWordStudyResponse> LoadStudentPlanWordStudyAsync(
        Guid planId,
        string schoolYear,
        CancellationToken cancellationToken)
    {
        using var recordsDocument = await GetJsonAsync(
            BuildStudentPlanWordStudyQuery(planId), cancellationToken);
        return new StudentPlanWordStudyResponse(
            planId,
            schoolYear,
            ParseStudentPlanWordStudy(recordsDocument.RootElement));
    }

    private async Task<StudentPlanWordStudyOptionsResponse> LoadStudentPlanWordStudyOptionsAsync(
        CancellationToken cancellationToken)
    {
        using var stagesDocument = await GetJsonAsync(BuildWordStudyStagesQuery(), cancellationToken);
        var stages = ParseWordStudyStages(stagesDocument.RootElement);
        if (stages.Count == 0)
        {
            throw new InvalidOperationException("Words Their Way stages are not configured in Dataverse.");
        }

        return new StudentPlanWordStudyOptionsResponse(stages);
    }

    private async Task<StudentPlanWritingSnapshotsResponse> LoadStudentPlanWritingSnapshotsAsync(
        Guid planId,
        string schoolYear,
        CancellationToken cancellationToken)
    {
        using var snapshotsDocument = await GetJsonAsync(
            BuildStudentPlanWritingSnapshotsQuery(planId), cancellationToken);
        return new StudentPlanWritingSnapshotsResponse(
            planId,
            schoolYear,
            ParseStudentPlanWritingSnapshots(snapshotsDocument.RootElement));
    }

    private async Task<StudentPlanTeacherCommentsResponse> LoadStudentPlanTeacherCommentsAsync(
        Guid planId,
        string schoolYear,
        CancellationToken cancellationToken)
    {
        using var commentsDocument = await GetJsonAsync(
            BuildStudentPlanTeacherCommentsQuery(planId), cancellationToken);
        return new StudentPlanTeacherCommentsResponse(
            planId,
            schoolYear,
            ParseStudentPlanTeacherComments(commentsDocument.RootElement));
    }

    private async Task<StudentPlanOralReadingFluencyOptionsResponse> LoadStudentPlanOralReadingFluencyOptionsAsync(
        CancellationToken cancellationToken)
    {
        using var optionsDocument = await GetJsonAsync(
            BuildStudentPlanOralReadingFluencyChoicesQuery(),
            cancellationToken);
        var options = ParseStudentPlanOralReadingFluencyOptions(optionsDocument.RootElement);
        if (options.Count == 0)
        {
            throw new InvalidOperationException("Level of Reading choices are not configured in Dataverse.");
        }

        return new StudentPlanOralReadingFluencyOptionsResponse(options);
    }

    private async Task<StudentPlanOralReadingFluencyCommand> ValidateStudentPlanOralReadingFluencyCommandAsync(
        StudentPlanOralReadingFluencyCommand command,
        CancellationToken cancellationToken)
    {
        if (command.WordsPerMinute < 0)
        {
            throw new ArgumentException("Words per Minute must be a whole number of zero or greater.");
        }

        var options = await LoadStudentPlanOralReadingFluencyOptionsAsync(cancellationToken);
        if (!options.LevelsOfReading.Any(option => option.Value == command.LevelOfReading))
        {
            throw new ArgumentException("Select a valid Level of Reading.");
        }

        return command;
    }

    internal static void EnsureOralReadingFluencyDateAvailable(
        IReadOnlyList<StudentPlanOralReadingFluencyResult> results,
        DateOnly assessmentDate,
        Guid? excludedResultId)
    {
        var duplicate = results.Any(result =>
            result.Id != excludedResultId
            && result.AssessmentDate is not null
            && DateOnly.FromDateTime(result.AssessmentDate.Value.Date) == assessmentDate);
        if (duplicate)
        {
            throw new AssessmentWorkspaceConflictException(
                "An oral reading fluency result already exists for this Assessment Date. Edit the existing result or select a different date.");
        }
    }

    internal static string BuildStudentPlanOralReadingFluencyName(
        string planName,
        DateOnly assessmentDate) =>
        $"{planName}|ORF|{assessmentDate:MMddyyyy}";

    private async Task RecalculateStudentPlanOralReadingFluencyNamesAsync(
        string planName,
        IReadOnlyList<StudentPlanOralReadingFluencyResult> results,
        CancellationToken cancellationToken)
    {
        foreach (var result in results)
        {
            if (result.AssessmentDate is null || string.IsNullOrWhiteSpace(result.ETag))
            {
                continue;
            }

            var assessmentDate = DateOnly.FromDateTime(result.AssessmentDate.Value.Date);
            var expectedName = BuildStudentPlanOralReadingFluencyName(planName, assessmentDate);
            if (string.Equals(result.Name, expectedName, StringComparison.Ordinal))
            {
                continue;
            }

            await SendJsonAsync(
                HttpMethod.Patch,
                $"fvsd_studentipplevels({result.Id:D})",
                new Dictionary<string, object?> { ["fvsd_name"] = expectedName },
                result.ETag,
                cancellationToken);
        }
    }

    internal static void ValidateStudentPlanWordStudyCommand(
        StudentPlanWordStudyCommand command,
        StudentPlanWordStudyOptionsResponse options)
    {
        if (!options.Stages.Any(stage => stage.Id == command.StartingLevelId))
        {
            throw new ArgumentException("Select a valid WTW Starting Level.");
        }
        if (command.TermEndDate < command.TermStartDate)
        {
            throw new ArgumentException("Term Ending Date cannot be before Term Starting Date.");
        }
        if ((command.TermEndDate is null) != (command.FinishingLevelId is null))
        {
            throw new ArgumentException("Enter both the Term Ending Date and WTW Ending Level, or leave both blank.");
        }
        if (command.FinishingLevelId is not null
            && !options.Stages.Any(stage => stage.Id == command.FinishingLevelId.Value))
        {
            throw new ArgumentException("Select a valid WTW Ending Level.");
        }
    }

    private static Dictionary<string, object?> BuildStudentPlanWordStudyPayload(
        StudentPlanWordStudyCommand command) =>
        new()
        {
            ["fvsd_initialdateachieved"] = command.TermStartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ["fvsd_currentdateachieved"] = command.TermEndDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ["fvsd_wtwstartinglevel@odata.bind"] = $"/fvsd_wordstheirwaystages({command.StartingLevelId:D})",
            ["fvsd_wtwfinishinglevel@odata.bind"] = command.FinishingLevelId is null
                ? null
                : $"/fvsd_wordstheirwaystages({command.FinishingLevelId.Value:D})"
        };

    internal static void EnsureWordStudyStartDateAvailable(
        IReadOnlyList<StudentPlanWordStudyRecord> records,
        DateOnly startDate,
        Guid? excludedRecordId)
    {
        if (records.Any(record =>
            record.Id != excludedRecordId
            && record.TermStartDate is not null
            && DateOnly.FromDateTime(record.TermStartDate.Value.Date) == startDate))
        {
            throw new AssessmentWorkspaceConflictException(
                "A Word Study record already exists for this Term Starting Date. Edit the existing record or select a different date.");
        }
    }

    internal static string BuildStudentPlanWordStudyName(string planName, DateOnly startDate) =>
        $"{planName}|WS|{startDate:MMddyyyy}";

    private async Task RecalculateStudentPlanWordStudyNamesAsync(
        string planName,
        IReadOnlyList<StudentPlanWordStudyRecord> records,
        CancellationToken cancellationToken)
    {
        foreach (var record in records)
        {
            if (record.TermStartDate is null || string.IsNullOrWhiteSpace(record.ETag))
            {
                continue;
            }

            var expectedName = BuildStudentPlanWordStudyName(
                planName,
                DateOnly.FromDateTime(record.TermStartDate.Value.Date));
            if (string.Equals(record.Name, expectedName, StringComparison.Ordinal))
            {
                continue;
            }

            await SendJsonAsync(
                HttpMethod.Patch,
                $"fvsd_studentipplevels({record.Id:D})",
                new Dictionary<string, object?> { ["fvsd_name"] = expectedName },
                record.ETag,
                cancellationToken);
        }
    }

    internal static void ValidateStudentPlanWritingSnapshotCommand(
        StudentPlanWritingSnapshotCommand command,
        StudentPlanWritingSnapshotUpload? writingSampleFile,
        StudentPlanWritingSnapshotUpload? writingSampleImage)
    {
        if (command.CommentDate == default)
        {
            throw new ArgumentException("Date of Comment is required.");
        }
        if (string.IsNullOrWhiteSpace(command.EvidenceOfDevelopment))
        {
            throw new ArgumentException("Evidence of Development is required.");
        }
        if (writingSampleFile is not null && writingSampleImage is not null)
        {
            throw new ArgumentException("Upload either a Writing Sample File or a Writing Sample Image, not both.");
        }

        ValidateWritingSnapshotUpload(writingSampleFile, false);
        ValidateWritingSnapshotUpload(writingSampleImage, true);
    }

    private static void ValidateWritingSnapshotUpload(
        StudentPlanWritingSnapshotUpload? upload,
        bool image)
    {
        if (upload is null)
        {
            return;
        }

        if (upload.Content.Length == 0 || string.IsNullOrWhiteSpace(upload.FileName))
        {
            throw new ArgumentException($"The Writing Sample {(image ? "Image" : "File")} is empty.");
        }
        var maximumBytes = image ? 8 * 1024 * 1024 : 20 * 1024 * 1024;
        if (upload.Content.Length > maximumBytes)
        {
            throw new ArgumentException(
                $"The Writing Sample {(image ? "Image" : "File")} must be {maximumBytes / 1024 / 1024} MB or smaller.");
        }
        if (image && !upload.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Writing Sample Image must use an image file format.");
        }
    }

    internal static Dictionary<string, object?> BuildStudentPlanWritingSnapshotPayload(
        StudentPlanWritingSnapshotCommand command)
    {
        var commentDate = $"{command.CommentDate:yyyy-MM-dd}T12:00:00Z";
        return new Dictionary<string, object?>
        {
            ["subject"] = "Writing Snapshot",
            ["description"] = command.EvidenceOfDevelopment.Trim(),
            ["fvsd_includeinexport"] = command.IncludeInExport,
            ["actualstart"] = commentDate,
            ["actualend"] = commentDate
        };
    }

    internal static void ValidateStudentPlanTeacherCommentCommand(
        StudentPlanTeacherCommentCommand command,
        IReadOnlyList<StudentPlanModuleState> modules)
    {
        if (command.CommentDate == default)
        {
            throw new ArgumentException("Date of Comment is required.");
        }
        if (string.IsNullOrWhiteSpace(command.CommentsAndNextSteps))
        {
            throw new ArgumentException("Comments and Next Steps is required.");
        }
        var excludedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Student Details",
            "Student Conditions and Coding",
            "Writing Snapshot",
            "Teacher Comment and Next Steps",
            "Signatures"
        };
        if (!modules.Any(module =>
            module.Id == command.SectionId
            && module.Selected
            && !excludedNames.Contains(module.Name)))
        {
            throw new ArgumentException("Select an available plan Section for this Teacher Comment.");
        }
    }

    internal static Dictionary<string, object?> BuildStudentPlanTeacherCommentPayload(
        StudentPlanTeacherCommentCommand command)
    {
        var commentDate = $"{command.CommentDate:yyyy-MM-dd}T12:00:00Z";
        return new Dictionary<string, object?>
        {
            ["subject"] = "Teacher Comment and Next Steps",
            ["description"] = command.CommentsAndNextSteps.Trim(),
            ["activityadditionalparams"] = NormalizeOptionalText(command.AdditionalObservations),
            ["fvsd_includeinexport"] = command.IncludeInExport,
            ["actualstart"] = commentDate,
            ["actualend"] = commentDate
        };
    }

    private async Task EnsureTeacherCommentAvailableAsync(
        Guid planId,
        Guid commentId,
        CancellationToken cancellationToken)
    {
        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanTeacherCommentValidationQuery(planId, commentId), cancellationToken);
        if (existingDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected Teacher Comment is not available for this annual plan.");
        }
    }

    private async Task<string?> EnsureWritingSnapshotAvailableAsync(
        Guid planId,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        using var existingDocument = await GetJsonAsync(
            BuildStudentPlanWritingSnapshotValidationQuery(planId, snapshotId), cancellationToken);
        var rows = existingDocument.RootElement.GetProperty("value");
        if (rows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected Writing Snapshot is not available for this annual plan.");
        }

        return ReadString(rows[0], "fvsd_writingsamplefile_name");
    }

    private async Task SetIppActivityOpenAsync(
        Guid activityId,
        CancellationToken cancellationToken) =>
        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_ippactivities({activityId:D})",
            new Dictionary<string, object?>
            {
                ["statecode"] = 0,
                ["statuscode"] = 1
            },
            null,
            cancellationToken);

    private async Task SaveWritingSnapshotUploadsAsync(
        Guid snapshotId,
        StudentPlanWritingSnapshotUpload? writingSampleFile,
        StudentPlanWritingSnapshotUpload? writingSampleImage,
        bool replaceExisting,
        CancellationToken cancellationToken)
    {
        if (writingSampleFile is not null)
        {
            if (replaceExisting)
            {
                await SendJsonAsync(
                    HttpMethod.Patch,
                    $"fvsd_ippactivities({snapshotId:D})",
                    new Dictionary<string, object?> { ["fvsd_writingsampleimage"] = null },
                    null,
                    cancellationToken);
            }
            await UploadFileColumnAsync(
                $"fvsd_ippactivities({snapshotId:D})/fvsd_writingsamplefile",
                writingSampleFile,
                cancellationToken);
        }
        else if (writingSampleImage is not null)
        {
            if (replaceExisting)
            {
                await DeleteFileColumnIfPresentAsync(
                    $"fvsd_ippactivities({snapshotId:D})/fvsd_writingsamplefile",
                    cancellationToken);
            }
            await SendJsonAsync(
                HttpMethod.Patch,
                $"fvsd_ippactivities({snapshotId:D})",
                new Dictionary<string, object?>
                {
                    ["fvsd_writingsampleimage"] = Convert.ToBase64String(writingSampleImage.Content)
                },
                null,
                cancellationToken);
        }
    }

    private async Task<Guid> GetOralReadingFluencySectionIdAsync(CancellationToken cancellationToken)
        => await GetIppSectionIdAsync("Oral Reading Fluency (ORF)", cancellationToken);

    private async Task<string> GetIppActivitySectionNavigationPropertyAsync(
        CancellationToken cancellationToken)
    {
        using var metadataDocument = await GetJsonAsync(
            BuildIppActivityRelationshipsQuery(), cancellationToken);
        return ParseIppActivitySectionNavigationProperty(metadataDocument.RootElement)
            ?? throw new InvalidOperationException(
                "The Section lookup relationship for IPP Activities is not configured in Dataverse.");
    }

    private async Task<Guid> GetIppSectionIdAsync(string sectionName, CancellationToken cancellationToken)
    {
        using var sectionDocument = await GetJsonAsync(
            BuildIppSectionByNameQuery(sectionName),
            cancellationToken);
        var rows = sectionDocument.RootElement.GetProperty("value");
        var sectionId = rows.GetArrayLength() == 1
            ? ReadGuid(rows[0], "fvsd_ippsectionid")
            : null;
        return sectionId ?? throw new InvalidOperationException(
            $"The {sectionName} IPP Section is not configured in Dataverse.");
    }

    private static Dictionary<string, object?> BuildStudentPlanOralReadingFluencyPayload(
        StudentPlanOralReadingFluencyCommand command) =>
        new()
        {
            ["fvsd_currentdateachieved"] = command.AssessmentDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ["fvsd_levelofreading"] = command.LevelOfReading,
            ["fvsd_wordsperminute"] = command.WordsPerMinute
        };

    private async Task<StudentPlanSignaturesResponse> LoadStudentPlanSignaturesAsync(
        Guid planId,
        string schoolYear,
        CancellationToken cancellationToken)
    {
        using var signaturesDocument = await GetJsonAsync(
            BuildStudentPlanSignaturesQuery(planId),
            cancellationToken);
        return new StudentPlanSignaturesResponse(
            planId,
            schoolYear,
            ParseStudentPlanSignatures(signaturesDocument.RootElement));
    }

    private async Task<StudentPlanSignatureOptionsResponse> LoadStudentPlanSignatureOptionsAsync(
        CancellationToken cancellationToken)
    {
        try
        {
            var recipientTypesTask = GetJsonAsync(
                BuildStudentPlanSignatureChoicesQuery("fvsd_recipienttype"),
                cancellationToken);
            var rolesTask = GetJsonAsync(
                BuildStudentPlanSignatureChoicesQuery("fvsd_signatoryrole"),
                cancellationToken);
            await Task.WhenAll(recipientTypesTask, rolesTask);
            using var recipientTypesDocument = await recipientTypesTask;
            using var rolesDocument = await rolesTask;
            var recipientTypes = ParseStudentPlanSignatureChoices(recipientTypesDocument.RootElement);
            var roles = ParseStudentPlanSignatureChoices(rolesDocument.RootElement);
            if (recipientTypes.Count > 0 && roles.Count > 0)
            {
                return new StudentPlanSignatureOptionsResponse(recipientTypes, roles);
            }
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(
                exception,
                "Dataverse signature choice metadata was unavailable; using the known choice values.");
        }

        return new StudentPlanSignatureOptionsResponse(
            [
                new(1, "Needs to Sign"),
                new(2, "In Person Signer"),
                new(3, "Receives a Copy"),
                new(4, "Needs to View")
            ],
            [
                new(1, "Parent / Guardian"),
                new(2, "Principal"),
                new(3, "Teacher"),
                new(4, "Specialist")
            ]);
    }

    private async Task<StudentPlanSignatureCommand> ValidateStudentPlanSignatureCommandAsync(
        StudentPlanSignatureCommand command,
        CancellationToken cancellationToken)
    {
        var name = NormalizeOptionalText(command.SignatoryName);
        var email = NormalizeOptionalText(command.SignatoryEmail);
        if (name is null)
        {
            throw new ArgumentException("Enter the Signatory Name.");
        }
        if (email is null || !ParentOrGuardianEmailRegex().IsMatch(email))
        {
            throw new ArgumentException("Enter a valid Signatory Email address.");
        }
        if (command.SignatoryOrder < 1)
        {
            throw new ArgumentException("Signatory Order must be a whole number greater than zero.");
        }

        var options = await LoadStudentPlanSignatureOptionsAsync(cancellationToken);
        if (!options.RecipientTypes.Any(option => option.Value == command.RecipientType))
        {
            throw new ArgumentException("Select a valid Recipient Type.");
        }
        if (!options.SignatoryRoles.Any(option => option.Value == command.SignatoryRole))
        {
            throw new ArgumentException("Select a valid Signatory Role.");
        }

        return command with { SignatoryName = name, SignatoryEmail = email };
    }

    private static void EnsureSignatureCanBeChanged(StudentPlanSignature signature)
    {
        if (signature.StateCode != 0 || signature.StatusCode != 1)
        {
            throw new ArgumentException(
                "Only a signature in Assigned status can be edited or removed.");
        }
    }

    internal static void ValidateStudentPlanSignatureOrder(
        IReadOnlyList<StudentPlanSignature> current,
        StudentPlanSignatureOrderCommand command)
    {
        if (current.Count < 2)
        {
            throw new ArgumentException("At least two signatures are required to change the routing order.");
        }
        if (current.Any(signature => signature.StateCode != 0 || signature.StatusCode != 1))
        {
            throw new ArgumentException(
                "Signature routing order can be changed only while every signature is in Assigned status.");
        }
        if (command.Signatures is null
            || command.Signatures.Count != current.Count
            || command.Signatures.Select(item => item.Id).Distinct().Count() != current.Count)
        {
            throw new ArgumentException("Submit every signature exactly once when changing the routing order.");
        }

        var currentById = current.ToDictionary(signature => signature.Id);
        foreach (var item in command.Signatures)
        {
            if (!currentById.TryGetValue(item.Id, out var existing))
            {
                throw new ArgumentException("The signature order contains a record outside this annual plan.");
            }
            if (string.IsNullOrWhiteSpace(item.ETag)
                || !string.Equals(item.ETag, existing.ETag, StringComparison.Ordinal))
            {
                throw new AssessmentWorkspaceConflictException(
                    "A signature changed after the manager was opened. Reload the signatures before reordering them.");
            }
        }
    }

    private async Task<StudentPlanInterventionOptionsResponse> LoadStudentPlanInterventionOptionsAsync(
        PlanSubject subject,
        CancellationToken cancellationToken)
    {
        var referencesTask = GetJsonAsync(BuildInterventionReferencesQuery(), cancellationToken);
        var interventionistsTask = GetJsonAsync(BuildInterventionistsQuery(subject.SchoolId), cancellationToken);
        Task<JsonDocument>? sectionsTask = string.Equals(
            subject.SectionGroup,
            "Homeroom",
            StringComparison.OrdinalIgnoreCase)
                ? GetJsonAsync(
                    BuildStudentInterventionSectionsQuery(subject.StudentId, subject.SchoolId),
                    cancellationToken)
                : null;

        await Task.WhenAll(sectionsTask is null
            ? [referencesTask, interventionistsTask]
            : [referencesTask, interventionistsTask, sectionsTask]);
        using var referencesDocument = await referencesTask;
        using var interventionistsDocument = await interventionistsTask;
        using var sectionsDocument = sectionsTask is null ? null : await sectionsTask;
        var sections = sectionsDocument is null
            ? Array.Empty<StudentPlanInterventionSectionOption>()
            : ParseStudentInterventionSections(sectionsDocument.RootElement);
        var curricula = sections
            .Select(section => section.Curriculum)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(curriculum => curriculum, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new StudentPlanInterventionOptionsResponse(
            subject.SectionGroup,
            string.Equals(subject.SectionGroup, "Homeroom", StringComparison.OrdinalIgnoreCase),
            curricula,
            sections,
            ParseStudentPlanInterventionTypes(referencesDocument.RootElement),
            ParseStudentPlanInterventionists(interventionistsDocument.RootElement));
    }

    private static InterventionSource ResolveInterventionSource(
        PlanSubject subject,
        StudentPlanInterventionOptionsResponse options,
        StudentPlanInterventionTypeOption type,
        Guid? sourceTeacherSectionId)
    {
        if (!options.RequiresSourceSection)
        {
            if (string.IsNullOrWhiteSpace(type.Curriculum))
            {
                throw new ArgumentException(
                    "The selected Intervention Type does not have a configured Curriculum.");
            }

            return new InterventionSource(
                type.Curriculum,
                subject.CourseNumber,
                subject.CourseName,
                subject.TeacherName);
        }

        if (sourceTeacherSectionId is null)
        {
            throw new ArgumentException("Select the student's Curriculum and Student Section.");
        }

        var selectedSection = options.StudentSections.FirstOrDefault(
            section => section.TeacherSectionId == sourceTeacherSectionId.Value)
            ?? throw new ArgumentException(
                "Select a valid Student Section for this student and school.");
        if (!string.Equals(
            type.Curriculum,
            selectedSection.Curriculum,
            StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "The Intervention Type must match the selected Student Section curriculum.");
        }

        return new InterventionSource(
            selectedSection.Curriculum,
            selectedSection.CourseNumber,
            selectedSection.CourseName,
            selectedSection.TeacherName);
    }

    private static IReadOnlyDictionary<string, object?> BuildStudentPlanInterventionPayload(
        PlanSubject subject,
        string schoolYear,
        StudentPlanInterventionTypeOption type,
        InterventionSource source,
        StudentPlanInterventionCommand command,
        string? recordName,
        bool includeContext)
    {
        var payload = new Dictionary<string, object?>
        {
            ["fvsd_datestarted"] = command.DateStarted.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ["fvsd_interventionist"] = NormalizeOptionalText(command.Interventionist),
            ["fvsd_datewithdrawn"] = command.DateWithdrawn?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ["fvsd_withdrawnreason"] = command.WithdrawnReason,
            ["fvsd_additionalinformation"] = NormalizeOptionalText(command.AdditionalInformation)
        };
        if (!includeContext)
        {
            return payload;
        }

        payload["fvsd_name"] = recordName;
        payload["fvsd_student@odata.bind"] = $"/fvsd_studentdetails({subject.StudentId:D})";
        payload["fvsd_schoolatintervention"] = subject.SchoolName;
        payload["fvsd_gradeatintervention"] = subject.StudentGradeValue;
        payload["fvsd_schoolyear"] = schoolYear;
        payload["fvsd_curriculum"] = source.Curriculum;
        payload["fvsd_courseno"] = source.CourseNumber;
        payload["fvsd_coursename"] = source.CourseName;
        payload["fvsd_teacheratintervention"] = source.TeacherName;
        payload["fvsd_interventiontype@odata.bind"] =
            $"/fvsd_interventionreferences({type.Id:D})";
        return payload;
    }

    internal static void ValidateInterventionCommand(StudentPlanInterventionCommand command)
    {
        if (command.InterventionTypeId == Guid.Empty)
        {
            throw new ArgumentException("Select an Intervention Type.");
        }

        if (command.DateWithdrawn is not null && command.DateWithdrawn < command.DateStarted)
        {
            throw new ArgumentException("Date Withdrawn cannot be before Date Started.");
        }

        if (command.DateWithdrawn is not null && command.WithdrawnReason is not (1 or 2))
        {
            throw new ArgumentException("Select Completed or Incomplete when a Date Withdrawn is entered.");
        }

        if (command.DateWithdrawn is null && command.WithdrawnReason is not null)
        {
            throw new ArgumentException("Enter a Date Withdrawn before selecting a Withdrawn Reason.");
        }
    }

    private static void ValidateInterventionist(
        string? interventionist,
        IReadOnlyList<StudentPlanInterventionistOption> options,
        string? existingInterventionist)
    {
        var normalized = NormalizeOptionalText(interventionist);
        if (normalized is null
            || string.Equals(normalized, existingInterventionist, StringComparison.OrdinalIgnoreCase)
            || options.Any(option => string.Equals(option.Name, normalized, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        throw new ArgumentException("Select an Interventionist assigned to this school.");
    }

    private static void EnsureCurrentPlan(string schoolYear, string currentSchoolYear)
    {
        if (!string.Equals(schoolYear, currentSchoolYear, StringComparison.Ordinal))
        {
            throw new AssessmentWorkspaceAccessException(
                "Only the current school-year IEP / IPP can be changed.");
        }
    }

    private async Task<StudentPlanModulesResponse> LoadStudentPlanModulesAsync(
        PlanSubject subject,
        Guid planId,
        CancellationToken cancellationToken)
    {
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId),
            cancellationToken);
        var planRows = planDocument.RootElement.GetProperty("value");
        if (planRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }

        var plan = planRows[0];
        var selectedIds = ParseIppSectionIds(ReadString(plan, "fvsd_ippsections"));
        using var definitionsDocument = await GetJsonAsync(BuildIppSectionsQuery(), cancellationToken);
        var definitions = ParseIppSections(definitionsDocument.RootElement);
        var modules = definitions
            .Select(definition => BuildStudentPlanModuleState(definition, selectedIds, subject))
            .Concat(selectedIds
                .Where(id => definitions.All(definition => definition.Id != id))
                .Select(id => new StudentPlanModuleState(
                    id,
                    "Unavailable module",
                    "General",
                    "This allocated module definition is inactive or unavailable.",
                    string.Empty,
                    int.MaxValue,
                    true,
                    false,
                    true,
                    true,
                    false,
                    "Retained to prevent existing plan data from being hidden.")))
            .Where(module => module.Selected || module.Available)
            .OrderBy(module => module.SortOrder)
            .ThenBy(module => module.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var eTag = ReadString(plan, "@odata.etag")
            ?? throw new InvalidOperationException("Dataverse did not return concurrency information for the plan.");
        var details = new StudentPlanDetails(
            ReadString(plan, "fvsd_schoolyear") ?? "School year not recorded",
            ReadFormattedString(plan, "fvsd_gradeatipp"),
            ReadString(plan, "fvsd_schoolatipp"),
            ReadString(plan, "fvsd_coursename"),
            ReadString(plan, "fvsd_teacheratipp"),
            ReadString(plan, "fvsd_principalatipp"),
            ReadString(plan, "fvsd_parentorguardianname"),
            ReadString(plan, "fvsd_parentorguardianemail"),
            ReadDecimal(plan, "fvsd_fallattendance"),
            ReadDecimal(plan, "fvsd_winterattendance"),
            ReadDecimal(plan, "fvsd_springattendance"),
            ReadDateTimeOffset(plan, "modifiedon"));
        return new StudentPlanModulesResponse(planId, eTag, details, modules);
    }

    private async Task UpdateStudentPlanSectionsAsync(
        Guid planId,
        IReadOnlySet<Guid> selectedIds,
        string eTag,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(eTag))
        {
            throw new ArgumentException("Reload the plan before changing its modules.");
        }

        using var definitionsDocument = await GetJsonAsync(BuildIppSectionsQuery(), cancellationToken);
        var definitions = ParseIppSections(definitionsDocument.RootElement);
        var selectedText = SerializeIppSectionIds(selectedIds, definitions);
        if (selectedText.Length > 2000)
        {
            throw new ArgumentException("The selected module list exceeds the Dataverse column limit.");
        }

        await SendJsonAsync(
            HttpMethod.Patch,
            $"fvsd_studentipps({planId:D})",
            new Dictionary<string, object?> { ["fvsd_ippsections"] = selectedText },
            eTag,
            cancellationToken);
    }

    private async Task<StudentPlanCodingResponse> LoadStudentPlanCodingAsync(
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken)
    {
        var documents = await Task.WhenAll(
            GetJsonAsync(BuildStudentPlanCodingQuery(studentId), cancellationToken),
            GetJsonAsync(BuildSpedCategoryOptionsQuery(), cancellationToken),
            GetJsonAsync(BuildSpedConditionOptionsQuery(), cancellationToken));
        using var studentDocument = documents[0];
        using var categoriesDocument = documents[1];
        using var conditionsDocument = documents[2];
        var studentRows = studentDocument.RootElement.GetProperty("value");
        if (studentRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException("The selected student details are not available.");
        }

        var student = studentRows[0];
        var categories = ParseSpedCategoryOptions(categoriesDocument.RootElement);
        var conditionOptions = ParseSpedConditionOptions(conditionsDocument.RootElement);
        var primaryCategoryName = ReadString(student, "fvsd_spedseriesname");
        var primaryCategoryId = categories.FirstOrDefault(category =>
            string.Equals(category.Name, primaryCategoryName, StringComparison.OrdinalIgnoreCase))?.Id;
        var primary = new StudentPlanCodingGroup(
            "Primary",
            "Primary SPED",
            primaryCategoryId,
            primaryCategoryName,
            ParseConditionNames(ReadString(student, "fvsd_spedconditions")),
            null);
        var additionalGroups = new[]
        {
            CreateCodingGroup(
                student,
                "One",
                "First Additional",
                "fvsd_additionalspedcategoryone",
                "fvsd_additionalspedconditionsone",
                "fvsd_additionalspedobservationsone"),
            CreateCodingGroup(
                student,
                "Two",
                "Second Additional",
                "fvsd_additionalspedcategorytwo",
                "fvsd_additionalspedconditionstwo",
                "fvsd_additionalspedobservationstwo"),
            CreateCodingGroup(
                student,
                "Three",
                "Third Additional",
                "fvsd_additionalspedcategorythree",
                "fvsd_additionalspedconditionsthree",
                "fvsd_additionalspedobservationsthree")
        };
        var eTag = ReadString(student, "@odata.etag")
            ?? throw new InvalidOperationException("Dataverse did not return a concurrency token for the student details record.");
        return new StudentPlanCodingResponse(
            planId,
            eTag,
            primary,
            additionalGroups,
            categories,
            conditionOptions);
    }

    private static IReadOnlyList<StudentPlanCodingCategoryOption> ParseSpedCategoryOptions(JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row => new StudentPlanCodingCategoryOption(
                ReadGuid(row, "fvsd_powerschoolcodemappingid") ?? Guid.Empty,
                ReadString(row, "fvsd_code") ?? string.Empty,
                ReadString(row, "fvsd_name") ?? string.Empty))
            .Where(category => category.Id != Guid.Empty && !string.IsNullOrWhiteSpace(category.Name))
            .OrderBy(category => category.Code, StringComparer.OrdinalIgnoreCase)
            .ThenBy(category => category.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static IReadOnlyList<StudentPlanCodingConditionOption> ParseSpedConditionOptions(JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row => new StudentPlanCodingConditionOption(
                ReadGuid(row, "fvsd_spedconditionid") ?? Guid.Empty,
                ReadGuid(row, "_fvsd_spedcategory_value")
                    ?? ReadGuid(row, "fvsd_spedcategory", "fvsd_powerschoolcodemappingid"),
                ReadString(row, "fvsd_spedcategory", "fvsd_name")
                    ?? ReadFormattedString(row, "_fvsd_spedcategory_value")
                    ?? string.Empty,
                ReadString(row, "fvsd_name") ?? string.Empty,
                ReadString(row, "fvsd_conditiondetails")))
            .Where(condition => condition.Id != Guid.Empty && !string.IsNullOrWhiteSpace(condition.Name))
            .OrderBy(condition => condition.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static StudentPlanCodingGroup CreateCodingGroup(
        JsonElement student,
        string key,
        string title,
        string categoryProperty,
        string conditionsProperty,
        string observationsProperty) =>
        new(
            key,
            title,
            ReadGuid(student, categoryProperty, "fvsd_powerschoolcodemappingid")
                ?? ReadGuid(student, $"_{categoryProperty}_value"),
            ReadString(student, categoryProperty, "fvsd_name")
                ?? ReadFormattedString(student, $"_{categoryProperty}_value"),
            ParseConditionNames(ReadString(student, conditionsProperty)),
            ReadString(student, observationsProperty));

    private static NormalizedCodingGroup NormalizeCodingGroupCommand(StudentPlanCodingGroupCommand? command) =>
        command?.CategoryId is Guid categoryId
            ? new NormalizedCodingGroup(
                categoryId,
                NormalizeConditionNames(command.Conditions),
                NormalizeOptionalText(command.Observations))
            : new NormalizedCodingGroup(null, [], null);

    private static NormalizedCodingGroup ValidateCodingGroup(
        NormalizedCodingGroup requested,
        StudentPlanCodingGroup current,
        StudentPlanCodingResponse response)
    {
        if (requested.CategoryId is not Guid categoryId)
        {
            return requested;
        }

        var category = response.Categories.FirstOrDefault(item => item.Id == categoryId)
            ?? throw new ArgumentException("Select a valid additional SPED category.");
        var retainedNames = current.CategoryId == categoryId ? current.Conditions : [];
        return requested with
        {
            Conditions = ValidateCodingConditions(
                requested.Conditions,
                category.Id,
                category.Name,
                retainedNames,
                response.ConditionOptions)
        };
    }

    private static IReadOnlyList<string> ValidateCodingConditions(
        IReadOnlyList<string> requested,
        Guid? categoryId,
        string? categoryName,
        IReadOnlyList<string> retainedNames,
        IReadOnlyList<StudentPlanCodingConditionOption> options)
    {
        var available = options
            .Where(option => categoryId is Guid id
                ? option.CategoryId == id
                : string.Equals(option.CategoryName, categoryName, StringComparison.OrdinalIgnoreCase))
            .Select(option => option.Name)
            .Concat(retainedNames)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToDictionary(name => name, name => name, StringComparer.OrdinalIgnoreCase);
        var invalid = requested.FirstOrDefault(name => !available.ContainsKey(name));
        if (invalid is not null)
        {
            throw new ArgumentException($"The condition '{invalid}' is not available for the selected SPED category.");
        }

        return requested.Select(name => available[name]).ToArray();
    }

    internal static IReadOnlyList<string> ParseConditionNames(string? value) =>
        NormalizeConditionNames(value?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

    private static IReadOnlyList<string> NormalizeConditionNames(IEnumerable<string>? values) =>
        (values ?? [])
            .Select(value => value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static string? SerializeConditionNames(IReadOnlyList<string> values) =>
        values.Count == 0 ? null : string.Join(", ", values);

    private static string? CodingCategoryBind(Guid? categoryId) =>
        categoryId is Guid id ? $"/fvsd_powerschoolcodemappings({id:D})" : null;

    private async Task ValidateStudentPlanAccessAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        Guid planId,
        CancellationToken cancellationToken)
    {
        var subject = await GetPlanSubjectAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            studentId,
            cancellationToken);
        using var planDocument = await GetJsonAsync(
            BuildStudentPlanValidationQuery(subject.StudentId, planId),
            cancellationToken);
        if (planDocument.RootElement.GetProperty("value").GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected IEP / IPP is not available for this student.");
        }
    }

    private async Task<PlanSchoolContext> GetPlanSchoolContextAsync(
        Guid schoolId,
        CancellationToken cancellationToken)
    {
        using var document = await GetJsonAsync(BuildPlanSchoolContextQuery(schoolId), cancellationToken);
        var rows = document.RootElement.GetProperty("value");
        if (rows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException("The selected school is not available.");
        }

        var row = rows[0];
        return new PlanSchoolContext(
            ReadString(row, "fvsd_alias")
                ?? ReadString(row, "name")
                ?? schoolId.ToString("N"),
            ReadString(row, "fvsd_principal", "fullname")
                ?? ReadFormattedString(row, "_fvsd_principal_value"));
    }

    private static IReadOnlyList<IppSectionDefinition> ParseIppSections(JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row => new IppSectionDefinition(
                ReadGuid(row, "fvsd_ippsectionid") ?? Guid.Empty,
                ReadString(row, "fvsd_name") ?? "Unnamed module",
                ReadString(row, "fvsd_curriculum", "fvsd_name") ?? "General",
                ReadString(row, "fvsd_description") ?? string.Empty,
                ReadString(row, "fvsd_frontfacingdescription") ?? string.Empty,
                ReadBoolean(row, "fvsd_includeindropdown") ?? false,
                ReadBoolean(row, "fvsd_lockonselect") ?? false,
                ReadBoolean(row, "fvsd_schoolspecific") ?? false,
                ReadString(row, "fvsd_school", "name"),
                ParseSortOrder(ReadString(row, "fvsd_sortorder"))))
            .Where(module => module.Id != Guid.Empty)
            .OrderBy(module => module.SortOrder)
            .ThenBy(module => module.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static StudentPlanModuleState BuildStudentPlanModuleState(
        IppSectionDefinition definition,
        IReadOnlySet<Guid> selectedIds,
        PlanSubject subject)
    {
        var selected = selectedIds.Contains(definition.Id);
        string? unavailableReason = null;
        if (!definition.IncludeInDropdown)
        {
            unavailableReason = "This module is not available for new selection.";
        }
        else if (string.Equals(definition.Name, "Student Conditions and Coding", StringComparison.OrdinalIgnoreCase)
            && !subject.IsSpedCoded)
        {
            unavailableReason = "Available only when the student is SPED Coded.";
        }
        else if (string.Equals(definition.Group, "English Language Arts and Literature", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(subject.SectionGroup, "Foundations", StringComparison.OrdinalIgnoreCase))
        {
            unavailableReason = "Available only from a Foundations section.";
        }
        else if (definition.SchoolSpecific
            && !string.Equals(definition.SchoolName, subject.SchoolName, StringComparison.OrdinalIgnoreCase))
        {
            unavailableReason = $"Available only at {definition.SchoolName ?? "its configured school"}.";
        }

        var required = string.Equals(definition.Name, "Student Details", StringComparison.OrdinalIgnoreCase)
            || string.Equals(definition.Name, "Screener Results", StringComparison.OrdinalIgnoreCase)
            || (subject.IsSpedCoded
                && string.Equals(definition.Name, "Student Conditions and Coding", StringComparison.OrdinalIgnoreCase));
        var locked = selected && (required || definition.LockOnSelect || unavailableReason is not null);
        var stateReason = locked
            ? required
                ? "Required for this annual plan."
                : unavailableReason is not null
                    ? $"Retained from the existing plan. {unavailableReason}"
                    : "Locked when selected by module configuration."
            : selected && unavailableReason is not null
                ? $"Retained from the existing plan. {unavailableReason}"
                : unavailableReason;
        return new StudentPlanModuleState(
            definition.Id,
            definition.Name,
            definition.Group,
            definition.Description,
            definition.FrontFacingDescription,
            definition.SortOrder,
            selected,
            unavailableReason is null,
            definition.LockOnSelect || required,
            locked,
            selected && !locked,
            stateReason);
    }

    private static HashSet<Guid> ParseIppSectionIds(string? value) =>
        (value ?? string.Empty)
            .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => Guid.TryParse(item, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToHashSet();

    private static string SerializeIppSectionIds(
        IReadOnlySet<Guid> selectedIds,
        IReadOnlyList<IppSectionDefinition> definitions)
    {
        var definitionOrder = definitions
            .Select((definition, index) => new { definition.Id, index })
            .ToDictionary(item => item.Id, item => item.index);
        return string.Join(
            '|',
            selectedIds
                .OrderBy(id => definitionOrder.GetValueOrDefault(id, int.MaxValue))
                .ThenBy(id => id)
                .Select(id => id.ToString("D")));
    }

    internal static IReadOnlyList<TosrecReferenceOption> ParseTosrecReferenceOptions(
        JsonElement referencesRoot,
        JsonElement termsRoot)
    {
        var terms = termsRoot.GetProperty("value").EnumerateArray()
            .Select(row => new DescriptiveTermRange(
                ReadGuid(row, "fvsd_descriptivetermid") ?? Guid.Empty,
                ReadString(row, "fvsd_name") ?? "Unassigned",
                ReadInteger(row, "fvsd_rangelowvalue"),
                ReadInteger(row, "fvsd_rangehighvalue"),
                NormalizeHexColour(ReadString(row, "fvsd_fillhexcode")),
                NormalizeHexColour(ReadString(row, "fvsd_fonthexcode"))))
            .Where(term => term.Id != Guid.Empty && term.Low is not null && term.High is not null)
            .ToArray();

        return referencesRoot.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var rawScore = ReadInteger(row, "fvsd_rawscore");
                var standardScore = ReadInteger(row, "fvsd_standardscore");
                var percentileRank = ReadString(row, "fvsd_percentilerank");
                if (rawScore is null || standardScore is null || percentileRank is null)
                {
                    return null;
                }

                var term = terms.FirstOrDefault(candidate =>
                    candidate.Low!.Value <= standardScore.Value && candidate.High!.Value >= standardScore.Value);
                if (term is null)
                {
                    return null;
                }

                return new TosrecReferenceOption(
                    rawScore.Value,
                    standardScore.Value,
                    percentileRank,
                    term.Id,
                    term.Name,
                    term.Fill,
                    term.Font);
            })
            .Where(option => option is not null)
            .Cast<TosrecReferenceOption>()
            .DistinctBy(option => option.RawScore)
            .OrderBy(option => option.RawScore)
            .ToArray();
    }

    internal static IReadOnlyList<AssessmentSectionGroupOption> ParseSectionGroups(JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row =>
            {
                var numericValue = ReadInteger(row, "fvsd_sectiongrouping");
                var label = ReadFormattedString(row, "fvsd_sectiongrouping")
                    ?? GetSectionGroupLabel(numericValue);
                return label is null
                    ? null
                    : new AssessmentSectionGroupOption(label, label, GetSectionGroupOrder(label));
            })
            .Where(option => option is not null && IsClassAssignmentSectionGroup(option.Value))
            .Cast<AssessmentSectionGroupOption>()
            .DistinctBy(option => option.Value, StringComparer.OrdinalIgnoreCase)
            .OrderBy(option => option.SortOrder)
            .ThenBy(option => option.Label, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static bool IsClassAssignmentSectionGroup(string sectionGroup) =>
        sectionGroup is "Literacy" or "Numeracy" or "Foundations" or "Homeroom";

    internal static string CalculateChronologicalAge(DateOnly dateOfBirth, DateOnly assessmentDate)
    {
        if (assessmentDate < dateOfBirth)
        {
            throw new ArgumentException("Assessment Date cannot be before the student's date of birth.");
        }

        var birthdayHasPassed = dateOfBirth.Month < assessmentDate.Month
            || (dateOfBirth.Month == assessmentDate.Month && dateOfBirth.Day <= assessmentDate.Day);
        var years = assessmentDate.Year - dateOfBirth.Year - (birthdayHasPassed ? 0 : 1);
        var monthDifference = assessmentDate.Month - dateOfBirth.Month - (dateOfBirth.Day > assessmentDate.Day ? 1 : 0);
        var months = ((monthDifference % 12) + 12) % 12;
        return $"{years}-{months}";
    }

    private async Task<AssessmentSubject> GetAssessmentSubjectAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var policy = AssessmentAccessPolicy.Create(accessContext, developmentRole, isDeveloper);
        var schools = await GetPermittedSchoolsAsync(policy, cancellationToken);
        using var sectionDocument = await GetJsonAsync(
            BuildAssessmentSectionQuery(teacherSectionId),
            cancellationToken);
        var sectionRows = sectionDocument.RootElement.GetProperty("value");
        if (sectionRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException("The selected teacher section is not available.");
        }

        var section = sectionRows[0];
        var schoolId = ReadGuid(section, "_fvsd_school_value");
        var teacherEntraObjectId = ReadString(section, "fvsd_teacher", "fvsd_azureadobjectid");
        var teacherAllowed = !policy.TeacherLockedToSignedInUser
            || (accessContext.EntraObjectId is not null
                && string.Equals(
                    teacherEntraObjectId,
                    accessContext.EntraObjectId.Value.ToString(),
                    StringComparison.OrdinalIgnoreCase));
        if (schoolId is null || !policy.AllowsSchool(schoolId.Value, schools) || !teacherAllowed)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected teacher section is outside the signed-in user's assessment scope.");
        }

        using var studentDocument = await GetJsonAsync(
            BuildAssessmentStudentQuery(teacherSectionId, studentId),
            cancellationToken);
        var studentRows = studentDocument.RootElement.GetProperty("value");
        if (studentRows.GetArrayLength() != 1
            || !studentRows[0].TryGetProperty("fvsd_student", out var student)
            || student.ValueKind != JsonValueKind.Object)
        {
            throw new AssessmentWorkspaceAccessException(
                "The selected student is outside the signed-in user's teacher-section scope.");
        }

        var grade = ReadFormattedString(student, "fvsd_grade");
        var sectionGroup = ReadFormattedString(section, "fvsd_sectiongrouping")
            ?? GetSectionGroupLabel(ReadInteger(section, "fvsd_sectiongrouping"))
            ?? "Other";
        if (!IsTosrecAvailable(grade, sectionGroup))
        {
            throw new AssessmentWorkspaceAccessException(
                "TOSREC is not available for this student's grade and Section Group.");
        }

        return new AssessmentSubject(
            policy,
            studentId,
            ReadString(student, "fvsd_name") ?? "Student",
            ReadString(student, "fvsd_asn") ?? string.Empty,
            ReadDateTimeOffset(student, "fvsd_dateofbirth"),
            grade,
            ReadInteger(student, "fvsd_grade"),
            ReadFormattedString(section, "_fvsd_school_value") ?? schoolId.Value.ToString(),
            ReadString(section, "fvsd_courseno") ?? string.Empty,
            ReadString(section, "fvsd_coursename") ?? string.Empty,
            ReadString(section, "fvsd_teacher", "fvsd_name")
                ?? ReadFormattedString(section, "_fvsd_teacher_value")
                ?? "Teacher",
            ReadString(studentRows[0], "fvsd_sectionno") ?? string.Empty,
            sectionGroup);
    }

    private async Task<Dictionary<string, object?>> BuildTosrecPayloadAsync(
        AssessmentSubject subject,
        string currentSchoolYear,
        TosrecAssessmentCommand command,
        CancellationToken cancellationToken)
    {
        ValidatePeriod(command.Period);
        if (command.AssessmentDate == default)
        {
            throw new ArgumentException("Assessment Date is required.");
        }

        var datePeriod = GetAssessmentPeriod(command.AssessmentDate);
        if (datePeriod is null)
        {
            throw new ArgumentException("Assessment Date must be between September 1 and June 30, excluding March 31.");
        }

        if (command.Period != datePeriod.Value)
        {
            throw new ArgumentException("Assessment Period must match the selected Assessment Date.");
        }

        if (subject.StudentGradeValue is null || string.IsNullOrWhiteSpace(subject.StudentGrade))
        {
            throw new ArgumentException("The selected student does not have a Grade Choice value.");
        }

        if (subject.StudentDateOfBirth is null)
        {
            throw new ArgumentException("The selected student does not have a date of birth.");
        }

        if (string.IsNullOrWhiteSpace(subject.StudentAsn))
        {
            throw new ArgumentException("The selected student does not have an ASN.");
        }

        if (command.Exempt && string.IsNullOrWhiteSpace(command.ExemptReason))
        {
            throw new ArgumentException("Exempt Reason is required when Exempt is Yes.");
        }

        TosrecReferenceOption? score = null;
        int? rawScore = null;
        if (!command.Exempt)
        {
            if (command.TotalCorrect is null || command.TotalError is null)
            {
                throw new ArgumentException("Total Correct and Total Error are required, including when the value is zero.");
            }

            using var referencesDocument = await GetJsonAsync(
                BuildTosrecReferencesQuery(subject.StudentGradeValue.Value, command.Period),
                cancellationToken);
            using var termsDocument = await GetJsonAsync(BuildDescriptiveTermsQuery(), cancellationToken);
            var references = ParseTosrecReferenceOptions(
                referencesDocument.RootElement,
                termsDocument.RootElement);
            if (!references.Any(option => option.RawScore == command.TotalCorrect.Value)
                || !references.Any(option => option.RawScore == command.TotalError.Value))
            {
                throw new ArgumentException(
                    "Total Correct and Total Error must be selected from the available TOSREC reference values.");
            }

            rawScore = Math.Max(0, command.TotalCorrect.Value - command.TotalError.Value);
            score = references.FirstOrDefault(option => option.RawScore == rawScore.Value)
                ?? throw new ArgumentException("No TOSREC reference score exists for the calculated Raw Score.");
        }

        var schoolYearStart = GetSchoolYearStart(currentSchoolYear);
        if (schoolYearStart == int.MinValue)
        {
            throw new ArgumentException("The current school year is not valid.");
        }

        var periodLabel = GetPeriodLabel(command.Period)
            ?? throw new ArgumentException("The selected Assessment Period is not supported.");
        var birthDate = DateOnly.FromDateTime(subject.StudentDateOfBirth.Value.Date);
        var payload = new Dictionary<string, object?>
        {
            ["fvsd_name"] = $"{schoolYearStart}|{subject.StudentAsn}|TOSREC|{periodLabel}",
            ["fvsd_assessmenttype"] = 1,
            ["fvsd_student@odata.bind"] = $"/fvsd_studentdetails({subject.StudentId:D})",
            ["fvsd_schoolatassessment"] = subject.SchoolName,
            ["fvsd_gradeatassessment"] = subject.StudentGradeValue.Value,
            ["fvsd_schoolyear"] = currentSchoolYear,
            ["fvsd_assessmentdate"] = command.AssessmentDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ["fvsd_period"] = command.Period,
            ["fvsd_chronologicalage"] = CalculateChronologicalAge(birthDate, command.AssessmentDate),
            ["fvsd_curriculum"] = "English Language Arts and Literature",
            ["fvsd_courseno"] = subject.CourseNumber,
            ["fvsd_coursename"] = subject.CourseName,
            ["fvsd_teacheratassessment"] = subject.TeacherName,
            ["fvsd_sectionno"] = subject.SectionNumber,
            ["fvsd_exempt"] = command.Exempt,
            ["fvsd_exemptreason"] = command.Exempt ? command.ExemptReason?.Trim() : null,
            ["fvsd_totalcorrect"] = command.Exempt ? null : command.TotalCorrect,
            ["fvsd_totalerror"] = command.Exempt ? null : command.TotalError,
            ["fvsd_rawscore"] = rawScore,
            ["fvsd_standardscore"] = score?.StandardScore,
            ["fvsd_percentilerank"] = score?.PercentileRank,
            ["fvsd_descriptiveterm@odata.bind"] = score is null
                ? null
                : $"/fvsd_descriptiveterms({score.DescriptiveTermId:D})"
        };
        return payload;
    }

    private async Task<IReadOnlyList<AssessmentSchoolOption>> GetPermittedSchoolsAsync(
        AssessmentAccessPolicy policy,
        CancellationToken cancellationToken)
    {
        if (!policy.CanViewAllSelectableSchools)
        {
            return policy.AssignedSchools
                .Select(school => new AssessmentSchoolOption(school.Id, school.Name))
                .ToArray();
        }

        using var document = await GetJsonAsync(
            "businessunits?$select=businessunitid,name&" +
            $"$filter={Uri.EscapeDataString("isdisabled eq false and fvsd_allowselection eq true")}&" +
            "$orderby=name asc&$top=5000",
            cancellationToken);
        return document.RootElement.GetProperty("value").EnumerateArray()
            .Select(row => new AssessmentSchoolOption(
                ReadGuid(row, "businessunitid") ?? Guid.Empty,
                ReadString(row, "name") ?? "School"))
            .Where(school => school.Id != Guid.Empty)
            .OrderBy(school => school.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static Guid? GetDefaultSchoolId(
        AssessmentAccessPolicy policy,
        IReadOnlyList<AssessmentSchoolOption> schools)
    {
        if (policy.CanViewAllSelectableSchools)
        {
            return schools.Count == 1 ? schools[0].Id : null;
        }

        return schools.Count > 0 ? schools[0].Id : null;
    }

    private static string BuildSectionMappingsQuery() =>
        "fvsd_powerschoolsectionmappings?" +
        "$select=fvsd_courseno,fvsd_sortorder&$filter=statecode eq 0&$top=5000";

    private static IReadOnlyDictionary<string, int> ParseMappings(JsonElement root) =>
        root.GetProperty("value").EnumerateArray()
            .Select(row => new
            {
                CourseNumber = ReadString(row, "fvsd_courseno"),
                SortOrder = ParseSortOrder(ReadString(row, "fvsd_sortorder"))
            })
            .Where(row => !string.IsNullOrWhiteSpace(row.CourseNumber))
            .GroupBy(row => row.CourseNumber!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.Min(row => row.SortOrder),
                StringComparer.OrdinalIgnoreCase);

    private async Task<JsonDocument> GetJsonAsync(string relativeUri, CancellationToken cancellationToken)
    {
        var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.Scope]);
        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(_options.ApiBaseUrl, relativeUri));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.TryAddWithoutValidation("OData-MaxVersion", "4.0");
        request.Headers.TryAddWithoutValidation("OData-Version", "4.0");
        request.Headers.TryAddWithoutValidation(
            "Prefer",
            "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\"");

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var correlationId = response.Headers.TryGetValues("x-ms-service-request-id", out var values)
                ? values.FirstOrDefault()
                : null;
            logger.LogWarning(
                "Dataverse assessment query failed with HTTP {StatusCode}. Correlation ID: {CorrelationId}",
                response.StatusCode,
                correlationId);
            throw new HttpRequestException(
                $"The Dataverse assessment query failed with HTTP {(int)response.StatusCode}.",
                null,
                response.StatusCode);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
    }

    private async Task<Guid> CreateRecordAsync(
        string relativeUri,
        IReadOnlyDictionary<string, object?> payload,
        string primaryIdName,
        CancellationToken cancellationToken)
    {
        var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.Scope]);
        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri(_options.ApiBaseUrl, relativeUri))
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.TryAddWithoutValidation("OData-MaxVersion", "4.0");
        request.Headers.TryAddWithoutValidation("OData-Version", "4.0");
        request.Headers.TryAddWithoutValidation("Prefer", "return=representation");

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw await CreateDataverseWriteExceptionAsync(response, cancellationToken);
        }

        if (response.Content.Headers.ContentLength is > 0)
        {
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var id = ReadGuid(document.RootElement, primaryIdName);
            if (id is not null)
            {
                return id.Value;
            }
        }

        var entityUri = response.Headers.TryGetValues("OData-EntityId", out var values)
            ? values.FirstOrDefault()
            : response.Headers.Location?.ToString();
        var match = Regex.Match(entityUri ?? string.Empty, @"\((?<id>[0-9a-fA-F-]{36})\)");
        if (match.Success && Guid.TryParse(match.Groups["id"].Value, out var entityId))
        {
            return entityId;
        }

        throw new InvalidOperationException("Dataverse created the record but did not return its identifier.");
    }

    private async Task UploadFileColumnAsync(
        string relativeUri,
        StudentPlanWritingSnapshotUpload upload,
        CancellationToken cancellationToken)
    {
        var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.Scope]);
        var fileName = Path.GetFileName(upload.FileName);
        var uploadUri = $"{relativeUri}?x-ms-file-name={Uri.EscapeDataString(fileName)}";
        using var request = new HttpRequestMessage(HttpMethod.Patch, new Uri(_options.ApiBaseUrl, uploadUri))
        {
            Content = new ByteArrayContent(upload.Content)
        };
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.TryAddWithoutValidation("OData-MaxVersion", "4.0");
        request.Headers.TryAddWithoutValidation("OData-Version", "4.0");
        request.Headers.TryAddWithoutValidation("If-None-Match", "null");
        if (fileName.All(character => character <= 127))
        {
            request.Headers.TryAddWithoutValidation("x-ms-file-name", fileName);
        }

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw await CreateDataverseWriteExceptionAsync(response, cancellationToken);
        }
    }

    private async Task DeleteFileColumnIfPresentAsync(
        string relativeUri,
        CancellationToken cancellationToken)
    {
        var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.Scope]);
        using var request = new HttpRequestMessage(HttpMethod.Delete, new Uri(_options.ApiBaseUrl, relativeUri));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.TryAddWithoutValidation("OData-MaxVersion", "4.0");
        request.Headers.TryAddWithoutValidation("OData-Version", "4.0");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode && response.StatusCode != HttpStatusCode.NotFound)
        {
            throw await CreateDataverseWriteExceptionAsync(response, cancellationToken);
        }
    }

    private async Task<StudentPlanWritingSnapshotContent> GetWritingSnapshotContentAsync(
        string relativeUri,
        string defaultFileName,
        string defaultContentType,
        CancellationToken cancellationToken)
    {
        var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.Scope]);
        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(_options.ApiBaseUrl, relativeUri));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/octet-stream"));
        request.Headers.TryAddWithoutValidation("OData-MaxVersion", "4.0");
        request.Headers.TryAddWithoutValidation("OData-Version", "4.0");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"The Writing Snapshot attachment could not be loaded (HTTP {(int)response.StatusCode}).",
                null,
                response.StatusCode);
        }

        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar
            ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"')
            ?? (response.Headers.TryGetValues("x-ms-file-name", out var fileNames)
                ? fileNames.FirstOrDefault()
                : null)
            ?? defaultFileName;
        var contentType = response.Content.Headers.ContentType?.MediaType ?? defaultContentType;
        var content = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        return new StudentPlanWritingSnapshotContent(content, contentType, fileName);
    }

    private async Task<HttpRequestException> CreateDataverseWriteExceptionAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        var correlationId = response.Headers.TryGetValues("x-ms-service-request-id", out var values)
            ? values.FirstOrDefault()
            : null;
        var detail = await response.Content.ReadAsStringAsync(cancellationToken);
        logger.LogWarning(
            "Dataverse assessment write failed with HTTP {StatusCode}. Correlation ID: {CorrelationId}. Detail: {Detail}",
            response.StatusCode,
            correlationId,
            detail);
        return new HttpRequestException(
            $"The Dataverse assessment write failed with HTTP {(int)response.StatusCode}.",
            null,
            response.StatusCode);
    }

    private async Task SendJsonAsync(
        HttpMethod method,
        string relativeUri,
        IReadOnlyDictionary<string, object?>? payload,
        string? ifMatch,
        CancellationToken cancellationToken)
    {
        var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.Scope]);
        using var request = new HttpRequestMessage(method, new Uri(_options.ApiBaseUrl, relativeUri));
        if (payload is not null)
        {
            request.Content = JsonContent.Create(payload);
        }
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.TryAddWithoutValidation("OData-MaxVersion", "4.0");
        request.Headers.TryAddWithoutValidation("OData-Version", "4.0");
        request.Headers.TryAddWithoutValidation("Prefer", "return=minimal");
        if (!string.IsNullOrWhiteSpace(ifMatch))
        {
            request.Headers.TryAddWithoutValidation("If-Match", ifMatch);
        }

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (response.StatusCode == HttpStatusCode.PreconditionFailed)
        {
            throw new AssessmentWorkspaceConflictException(
                "This record changed after it was loaded. Reload it before saving again.");
        }

        if (!response.IsSuccessStatusCode)
        {
            var correlationId = response.Headers.TryGetValues("x-ms-service-request-id", out var values)
                ? values.FirstOrDefault()
                : null;
            logger.LogWarning(
                "Dataverse assessment write failed with HTTP {StatusCode}. Correlation ID: {CorrelationId}",
                response.StatusCode,
                correlationId);
            throw new HttpRequestException(
                $"The Dataverse assessment write failed with HTTP {(int)response.StatusCode}.",
                null,
                response.StatusCode);
        }
    }

    private static bool IsTosrecAvailable(string? grade, string sectionGroup)
    {
        if (string.Equals(grade, "Kindergarten", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.Equals(sectionGroup, "Literacy", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(sectionGroup, "Foundations", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(grade, "Grade 1", StringComparison.OrdinalIgnoreCase);
    }

    private static void ValidatePeriod(int period)
    {
        if (period is < 1 or > 3)
        {
            throw new ArgumentException("Select Fall, Winter or Spring for the Assessment Period.");
        }
    }

    internal static void ValidateAttendancePercentage(int? value, string period)
    {
        if (value is < 0 or > 100)
        {
            throw new ArgumentException($"{period} Attendance must be a whole number from 0 to 100.");
        }
    }

    internal static void ValidateParentOrGuardianEmail(string? value)
    {
        if (!string.IsNullOrWhiteSpace(value) && !ParentOrGuardianEmailRegex().IsMatch(value))
        {
            throw new ArgumentException("Enter a valid Parent or Guardian Email address.");
        }
    }

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.CultureInvariant)]
    private static partial Regex ParentOrGuardianEmailRegex();

    internal static int? GetAssessmentPeriod(DateOnly assessmentDate)
    {
        if (assessmentDate.Month is >= 9 and <= 12)
        {
            return 1;
        }

        if (assessmentDate.Month is 1 or 2 || (assessmentDate.Month == 3 && assessmentDate.Day <= 30))
        {
            return 2;
        }

        if (assessmentDate.Month is >= 4 and <= 6)
        {
            return 3;
        }

        return null;
    }

    private static string EscapeODataString(string value) => value.Replace("'", "''", StringComparison.Ordinal);

    private static int GetSectionGroupOrder(string sectionGroup) => sectionGroup switch
    {
        "Literacy" => 1,
        "Numeracy" => 2,
        "Foundations" => 3,
        "Homeroom" => 4,
        _ => 5
    };

    private static string? GetPeriodLabel(int? periodValue) => periodValue switch
    {
        1 => "Fall",
        2 => "Winter",
        3 => "Spring",
        _ => null
    };

    private static int GetPeriodSortOrder(string? period) => period switch
    {
        "Fall" => 1,
        "Winter" => 2,
        "Spring" => 3,
        _ => 0
    };

    private static int GetSchoolYearStart(string schoolYear) =>
        int.TryParse(
            schoolYear.AsSpan(0, Math.Min(4, schoolYear.Length)),
            NumberStyles.Integer,
            CultureInfo.InvariantCulture,
            out var value)
                ? value
                : int.MinValue;

    private static string? NormalizeHexColour(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim().TrimStart('#');
        return normalized.Length == 6 && normalized.All(Uri.IsHexDigit)
            ? $"#{normalized.ToUpperInvariant()}"
            : null;
    }

    private static int GetSectionGroupValue(string sectionGroup) => sectionGroup switch
    {
        "Literacy" => 1,
        "Numeracy" => 2,
        "Homeroom" => 3,
        "Foundations" => 5,
        _ => throw new ArgumentException("The selected Section Group is not supported.", nameof(sectionGroup))
    };

    private static string? GetSectionGroupLabel(int? sectionGroupValue) => sectionGroupValue switch
    {
        1 => "Literacy",
        2 => "Numeracy",
        3 => "Homeroom",
        4 => "Other",
        5 => "Foundations",
        _ => null
    };

    private static Guid? GetScopedTeacherObjectId(
        AssessmentAccessPolicy policy,
        DataverseAccessContext accessContext) =>
        policy.TeacherLockedToSignedInUser ? accessContext.EntraObjectId : null;

    private static int ParseSortOrder(string? value) =>
        int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var sortOrder)
            ? sortOrder
            : int.MaxValue;

    private static string? ReadFormattedString(JsonElement row, string propertyName) =>
        ReadString(row, $"{propertyName}{FormattedValueSuffix}");

    private static string? ReadString(JsonElement row, string propertyName) =>
        row.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;

    private static string? ReadString(JsonElement row, string objectName, string propertyName) =>
        row.TryGetProperty(objectName, out var nested)
        && nested.ValueKind == JsonValueKind.Object
            ? ReadString(nested, propertyName)
            : null;

    private static Guid? ReadGuid(JsonElement row, string propertyName) =>
        Guid.TryParse(ReadString(row, propertyName), out var value) ? value : null;

    private static Guid? ReadGuid(JsonElement row, string objectName, string propertyName) =>
        row.TryGetProperty(objectName, out var nested)
        && nested.ValueKind == JsonValueKind.Object
            ? ReadGuid(nested, propertyName)
            : null;

    private static int? ReadInteger(JsonElement row, string propertyName) =>
        row.TryGetProperty(propertyName, out var property)
        && property.ValueKind == JsonValueKind.Number
        && property.TryGetInt32(out var value)
            ? value
            : null;

    private static decimal? ReadDecimal(JsonElement row, string propertyName) =>
        row.TryGetProperty(propertyName, out var property)
        && property.ValueKind == JsonValueKind.Number
        && property.TryGetDecimal(out var value)
            ? value
            : null;

    private static bool? ReadBoolean(JsonElement row, string propertyName) =>
        row.TryGetProperty(propertyName, out var property)
        && property.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? property.GetBoolean()
            : null;

    private static DateTimeOffset? ReadDateTimeOffset(JsonElement row, string propertyName) =>
        DateTimeOffset.TryParse(
            ReadString(row, propertyName),
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal,
            out var value)
                ? value
                : null;

    private sealed record AssessmentSubject(
        AssessmentAccessPolicy Policy,
        Guid StudentId,
        string StudentName,
        string StudentAsn,
        DateTimeOffset? StudentDateOfBirth,
        string? StudentGrade,
        int? StudentGradeValue,
        string SchoolName,
        string CourseNumber,
        string CourseName,
        string TeacherName,
        string SectionNumber,
        string SectionGroup);

    private sealed record PlanSubject(
        Guid StudentId,
        string StudentName,
        string StudentAsn,
        string? StudentGrade,
        int? StudentGradeValue,
        bool IsSpedCoded,
        Guid SchoolId,
        string SchoolName,
        string CourseNumber,
        string CourseName,
        string TeacherName,
        string SectionGroup);

    private sealed record InterventionSource(
        string Curriculum,
        string CourseNumber,
        string CourseName,
        string TeacherName);

    private sealed record PlanSchoolContext(
        string Alias,
        string? PrincipalName);

    private sealed record NormalizedCodingGroup(
        Guid? CategoryId,
        IReadOnlyList<string> Conditions,
        string? Observations);

    private sealed record IppSectionDefinition(
        Guid Id,
        string Name,
        string Group,
        string Description,
        string FrontFacingDescription,
        bool IncludeInDropdown,
        bool LockOnSelect,
        bool SchoolSpecific,
        string? SchoolName,
        int SortOrder);

    private sealed record DescriptiveTermRange(
        Guid Id,
        string Name,
        int? Low,
        int? High,
        string? Fill,
        string? Font);
}

public sealed class AssessmentWorkspaceAccessException(string message) : Exception(message);

public sealed class AssessmentWorkspaceConflictException(string message) : Exception(message);
