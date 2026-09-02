using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;

namespace FVSDNexus.Api.Dataverse;

public sealed class DataverseAssessmentWorkspaceClient(
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

        using var sectionsDocument = await GetJsonAsync(
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
        var filter = $"statecode eq 0 and _fvsd_school_value eq {schoolId:D}";
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
            .Where(option => option is not null)
            .Cast<AssessmentSectionGroupOption>()
            .DistinctBy(option => option.Value, StringComparer.OrdinalIgnoreCase)
            .OrderBy(option => option.SortOrder)
            .ThenBy(option => option.Label, StringComparer.OrdinalIgnoreCase)
            .ToArray();

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
                "This assessment changed after it was loaded. Reload it before saving again.");
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
        "Other" => 4,
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

    private static int? ReadInteger(JsonElement row, string propertyName) =>
        row.TryGetProperty(propertyName, out var property)
        && property.ValueKind == JsonValueKind.Number
        && property.TryGetInt32(out var value)
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
