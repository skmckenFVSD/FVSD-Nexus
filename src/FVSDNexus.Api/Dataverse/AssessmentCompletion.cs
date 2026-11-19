using System.Text.Json;

namespace FVSDNexus.Api.Dataverse;

public sealed record CompletionStudent(Guid Id, string Name, string? ObfuscatedName, string? Asn, string? ObfuscatedAsn, string? Grade,
    bool GradeOneWinterSpring = false, bool ExcludedFromTosrec = false);
public sealed record CompletionPeriod(int Period, string Label, int Expected, int Completed, IReadOnlyList<CompletionStudent> Missing);
public sealed record CompletionGrade(string Grade, int Students);
public sealed record AssessmentCompletionSummary(string AssessmentType, string SchoolYear, DateTimeOffset RefreshedAt,
    IReadOnlyList<CompletionPeriod> Periods, int RosterCount, IReadOnlyList<CompletionGrade> RosterGrades);

public sealed record ScreenersDashboardFilterOption(string Value, string Label);
public sealed record ScreenersDashboardAccountability(
    string Id, string Label, int Expected, int Completed, int Missing, int CompletionRate);
public sealed record ScreenersDashboardAction(string Kind, string Title, string Detail, string Priority);
public sealed record StudentScreenersDashboard(
    string AssessmentType,
    string SchoolYear,
    string Role,
    string ScopeLabel,
    DateTimeOffset RefreshedAt,
    int SelectedPeriod,
    IReadOnlyList<AssessmentSchoolOption> Schools,
    IReadOnlyList<ScreenersDashboardFilterOption> SectionGroups,
    IReadOnlyList<ScreenersDashboardFilterOption> Courses,
    IReadOnlyList<ScreenersDashboardFilterOption> Teachers,
    IReadOnlyList<CompletionPeriod> Periods,
    IReadOnlyList<ScreenersDashboardAccountability> Accountability,
    IReadOnlyList<ScreenersDashboardAction> RecommendedActions,
    int RosterCount);

public sealed partial class DataverseAssessmentWorkspaceClient
{
    private sealed record DashboardRosterStudent(
        CompletionStudent Student,
        Guid SchoolId,
        string SchoolName,
        Guid TeacherId,
        string TeacherName);

    public async Task<StudentScreenersDashboard> GetStudentScreenersDashboardAsync(
        DataverseAccessContext accessContext, string? developmentRole, bool isDeveloper,
        Guid? schoolId, string? sectionGroup, string? courseNumber, Guid? teacherId,
        int period, string schoolYear, CancellationToken cancellationToken = default)
    {
        if (period is < 1 or > 3)
            throw new ArgumentException("The selected Assessment Period is not supported.", nameof(period));

        var policy = AssessmentAccessPolicy.Create(accessContext, developmentRole, isDeveloper);
        if (schoolId is null && (policy.Role is "Executive" or "Data Administrator"))
        {
            throw new ArgumentException(
                "Select a permitted school before loading the Student Screeners dashboard.",
                nameof(schoolId));
        }

        var permittedSchools = await GetPermittedSchoolsAsync(policy, accessContext, cancellationToken);
        if (schoolId is not null && !policy.AllowsSchool(schoolId.Value, permittedSchools))
            throw new AssessmentWorkspaceAccessException("The selected school is outside the signed-in user's assessment scope.");

        var scopedSchools = schoolId is null
            ? permittedSchools
            : permittedSchools.Where(school => school.Id == schoolId.Value).ToArray();
        if (scopedSchools.Count == 0)
            return EmptyDashboard(policy.Role, schoolYear, period, permittedSchools);

        var teacherIdentity = GetScopedTeacherIdentity(policy, accessContext);
        if (policy.TeacherLockedToSignedInUser && !teacherIdentity.IsAvailable)
            return EmptyDashboard(policy.Role, schoolYear, period, permittedSchools);

        using var sectionsDocument = await GetAllJsonAsync(
            BuildScreenersDashboardSectionsQuery(
                scopedSchools.Select(school => school.Id),
                sectionGroup,
                teacherIdentity.Upn,
                teacherIdentity.EntraObjectId),
            cancellationToken);
        using var mappingsDocument = await GetJsonAsync(BuildSectionMappingsQuery(), cancellationToken);
        var allSections = ParseTeacherSections(sectionsDocument.RootElement, ParseMappings(mappingsDocument.RootElement));
        var sections = allSections
            .Where(section => (string.IsNullOrWhiteSpace(courseNumber)
                    || string.Equals(section.CourseNumber, courseNumber, StringComparison.OrdinalIgnoreCase))
                && (teacherId is null || section.TeacherId == teacherId.Value))
            .ToArray();

        var sectionLookup = sections.ToDictionary(section => section.Id);
        var roster = new List<DashboardRosterStudent>();
        foreach (var batch in sections.Select(section => section.Id).Chunk(40))
        {
            var filter = "statecode eq 0 and (" + string.Join(" or ", batch.Select(id => $"_fvsd_teachersection_value eq {id:D}")) + ")";
            var query = "fvsd_studentsections?$select=fvsd_studentsectionid,_fvsd_student_value,_fvsd_teachersection_value&$filter="
                + Uri.EscapeDataString(filter)
                + "&$expand=fvsd_student($select=fvsd_studentdetailid,fvsd_name,fvsd_obfuscatedname,fvsd_asn,fvsd_obfuscatedasn,fvsd_grade)";
            using var data = await GetAllJsonAsync(query, cancellationToken);
            var membership = data.RootElement.GetProperty("value").EnumerateArray()
                .Where(row => ReadGuid(row, "fvsd_studentsectionid") is not null)
                .ToDictionary(row => ReadGuid(row, "fvsd_studentsectionid")!.Value,
                    row => ReadGuid(row, "_fvsd_teachersection_value"));
            foreach (var student in ParseStudents(data.RootElement))
            {
                if (membership.GetValueOrDefault(student.StudentSectionId) is not Guid sectionId
                    || !sectionLookup.TryGetValue(sectionId, out var section))
                    continue;
                var normalizedCourse = section.CourseNumber.Trim().ToUpperInvariant();
                roster.Add(new DashboardRosterStudent(
                    new CompletionStudent(student.Id, student.Name, student.ObfuscatedName, student.Asn,
                        student.ObfuscatedAsn, student.Grade, normalizedCourse == "ELALIT1", normalizedCourse == "ELA"),
                    section.SchoolId, section.SchoolName, section.TeacherId, section.TeacherName));
            }
        }

        var eligibleAnyPeriod = roster.Where(row => Enumerable.Range(1, 3).Any(p => RequiredInPeriod(row.Student, p)))
            .DistinctBy(row => row.Student.Id).ToArray();
        var records = new List<(Guid StudentId, int Period)>();
        foreach (var batch in eligibleAnyPeriod.Chunk(40))
        {
            using var data = await GetAllJsonAsync(
                BuildCompletionRecordsQuery(batch.Select(row => row.Student.Id), schoolYear), cancellationToken);
            records.AddRange(data.RootElement.GetProperty("value").EnumerateArray()
                .Select(row => (StudentId: ReadGuid(row, "_fvsd_student_value"), Period: ReadInteger(row, "fvsd_period")))
                .Where(row => row.StudentId is not null && row.Period is not null)
                .Select(row => (row.StudentId!.Value, row.Period!.Value)));
        }

        var completion = CalculateCompletion(roster.Select(row => row.Student), records, schoolYear);
        var submitted = records.ToHashSet();
        var eligibleForSelectedPeriod = roster.Where(row => RequiredInPeriod(row.Student, period))
            .DistinctBy(row => row.Student.Id).ToArray();
        var groupBySchool = scopedSchools.Count > 1;
        var accountability = eligibleForSelectedPeriod
            .GroupBy(row => groupBySchool
                ? (row.SchoolId.ToString("D"), row.SchoolName)
                : (row.TeacherId.ToString("D"), row.TeacherName))
            .Select(group =>
            {
                var students = group.DistinctBy(row => row.Student.Id).ToArray();
                var expected = students.Length;
                var completed = students.Count(row => submitted.Contains((row.Student.Id, period)));
                return new ScreenersDashboardAccountability(group.Key.Item1, group.Key.Item2, expected,
                    completed, expected - completed, Percentage(completed, expected));
            })
            .OrderBy(item => item.CompletionRate)
            .ThenBy(item => item.Label, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var selectedCompletion = completion.Periods.Single(item => item.Period == period);
        var actions = BuildDashboardActions(selectedCompletion, accountability, period);
        var responsePeriods = BuildDashboardResponsePeriods(completion.Periods, groupBySchool);
        var responseAccountability = BuildDashboardResponseAccountability(accountability, groupBySchool);

        return new StudentScreenersDashboard(
            "TOSREC", schoolYear, policy.Role, GetDashboardScopeLabel(policy.Role, scopedSchools.Count),
            DateTimeOffset.UtcNow, period, permittedSchools,
            allSections.Select(section => section.SectionGroup).Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(GetSectionGroupOrder).Select(value => new ScreenersDashboardFilterOption(value, value)).ToArray(),
            allSections.Select(section => new ScreenersDashboardFilterOption(section.CourseNumber, section.CourseName))
                .DistinctBy(option => option.Value, StringComparer.OrdinalIgnoreCase).OrderBy(option => option.Label).ToArray(),
            allSections.Select(section => new ScreenersDashboardFilterOption(section.TeacherId.ToString("D"), section.TeacherName))
                .DistinctBy(option => option.Value).OrderBy(option => option.Label).ToArray(),
            responsePeriods, responseAccountability, actions, completion.RosterCount);
    }

    private static StudentScreenersDashboard EmptyDashboard(
        string role, string schoolYear, int period, IReadOnlyList<AssessmentSchoolOption> schools) =>
        new("TOSREC", schoolYear, role, GetDashboardScopeLabel(role, schools.Count), DateTimeOffset.UtcNow,
            period, schools, [], [], [], CalculateCompletion([], [], schoolYear).Periods, [], [], 0);

    private static IReadOnlyList<ScreenersDashboardAction> BuildDashboardActions(
        CompletionPeriod selected, IReadOnlyList<ScreenersDashboardAccountability> accountability, int period)
    {
        var periodName = new[] { "Fall", "Winter", "Spring" }[period - 1];
        var actions = new List<ScreenersDashboardAction>();
        if (selected.Missing.Count > 0)
            actions.Add(new("missing", $"{selected.Missing.Count} {periodName} TOSREC results remain outstanding",
                "Review attendance, exemptions, and outstanding assessment entry before the window closes.", "High priority"));
        var belowTarget = accountability.Count(item => item.Expected > 0 && item.CompletionRate < 95);
        if (belowTarget > 0)
            actions.Add(new("accountability", $"{belowTarget} accountability groups are below the 95% completion target",
                "Follow up with the responsible school or teacher teams.", "Review"));
        if (period < 3)
            actions.Add(new("readiness", $"{new[] { "Winter", "Spring" }[period - 1]} roster readiness check",
                "Validate eligible students before the next assessment window opens.", "Upcoming"));
        return actions;
    }

    private static int Percentage(int completed, int expected) => expected == 0 ? 0
        : (int)Math.Round(completed * 100d / expected, MidpointRounding.AwayFromZero);

    internal static IReadOnlyList<CompletionPeriod> BuildDashboardResponsePeriods(
        IReadOnlyList<CompletionPeriod> periods, bool divisionRollup) => divisionRollup
        ? periods.Select(item => item with { Missing = [] }).ToArray()
        : periods;

    internal static IReadOnlyList<ScreenersDashboardAccountability> BuildDashboardResponseAccountability(
        IReadOnlyList<ScreenersDashboardAccountability> accountability, bool divisionRollup) => divisionRollup
        ? accountability.Where(item => item.Expected > 0 && item.CompletionRate < 95)
            .OrderBy(item => item.CompletionRate)
            .ThenBy(item => item.Label, StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToArray()
        : accountability;

    private static string GetDashboardScopeLabel(string role, int schoolCount) => role switch
    {
        "Executive" or "Data Administrator" when schoolCount > 1 => "Division view",
        "Executive" or "Data Administrator" => "School view",
        "School Administrator" => "School administrator view",
        "Teacher" => "Teacher view",
        "Student Support" => "Student support view",
        "Specialist Support" => "Specialist support view",
        _ => "Governed view"
    };

    internal static string BuildScreenersDashboardSectionsQuery(
        IEnumerable<Guid> schoolIds, string? sectionGroup, string? teacherUpn, Guid? teacherEntraObjectId = null)
    {
        var ids = schoolIds.Distinct().ToArray();
        if (ids.Length == 0) throw new ArgumentException("At least one permitted school is required.", nameof(schoolIds));
        var filter = "statecode eq 0 and (" + string.Join(" or ", ids.Select(id => $"_fvsd_school_value eq {id:D}")) + ")";
        filter += string.IsNullOrWhiteSpace(sectionGroup)
            ? " and fvsd_sectiongrouping ne 4"
            : $" and fvsd_sectiongrouping eq {GetSectionGroupValue(sectionGroup)}";
        var teacherFilter = BuildTeacherIdentityFilter(teacherUpn, teacherEntraObjectId);
        if (teacherFilter is not null) filter += $" and {teacherFilter}";
        return "fvsd_teachersections?" +
            "$select=fvsd_teachersectionid,fvsd_name,fvsd_coursename,fvsd_courseno,fvsd_sectiongrouping,_fvsd_school_value,_fvsd_teacher_value&" +
            $"$filter={Uri.EscapeDataString(filter)}&" +
            "$expand=fvsd_teacher($select=fvsd_teacherdetailid,fvsd_name,fvsd_upn,fvsd_azureadobjectid)," +
            "fvsd_studentsection_teachersection($select=fvsd_studentsectionid;$filter=statecode eq 0)&$top=5000";
    }

    public async Task<AssessmentCompletionSummary> GetCompletionAsync(
        DataverseAccessContext accessContext, string? developmentRole, bool isDeveloper,
        Guid schoolId, string sectionGroup, string? courseNumber, Guid? teacherId,
        string schoolYear, CancellationToken cancellationToken = default)
    {
        // Reuse the server-enforced school and teacher scope; client filters only narrow it.
        var sections = await GetTeacherSectionsAsync(accessContext, developmentRole, isDeveloper,
            schoolId, sectionGroup, cancellationToken);
        var sectionIds = sections.Where(s => (string.IsNullOrEmpty(courseNumber) || s.CourseNumber == courseNumber)
            && (teacherId is null || s.TeacherId == teacherId)).Select(s => s.Id).ToArray();
        var roster = new List<CompletionStudent>();
        foreach (var batch in sectionIds.Chunk(40))
        {
            var filter = "statecode eq 0 and (" + string.Join(" or ", batch.Select(id => $"_fvsd_teachersection_value eq {id:D}")) + ")";
            var query = "fvsd_studentsections?$select=fvsd_studentsectionid,_fvsd_student_value,_fvsd_teachersection_value&$filter="
                + Uri.EscapeDataString(filter)
                + "&$expand=fvsd_student($select=fvsd_studentdetailid,fvsd_name,fvsd_obfuscatedname,fvsd_asn,fvsd_obfuscatedasn,fvsd_grade)";
            using var data = await GetAllJsonAsync(query, cancellationToken);
            var membership = data.RootElement.GetProperty("value").EnumerateArray()
                .ToDictionary(row => ReadGuid(row, "fvsd_studentsectionid")!.Value,
                    row => ReadGuid(row, "_fvsd_teachersection_value"));
            roster.AddRange(ParseStudents(data.RootElement).Select(s =>
            {
                var course = sections.FirstOrDefault(section => section.Id == membership[s.StudentSectionId])?.CourseNumber.Trim().ToUpperInvariant();
                return new CompletionStudent(s.Id, s.Name, s.ObfuscatedName, s.Asn, s.ObfuscatedAsn, s.Grade,
                    course == "ELALIT1", course == "ELA");
            }));
        }
        var eligible = roster.Where(s => RequiredInPeriod(s, 2)).DistinctBy(s => s.Id).ToArray();
        var records = new List<(Guid StudentId, int Period)>();
        foreach (var batch in eligible.Chunk(40))
        {
            using var data = await GetAllJsonAsync(BuildCompletionRecordsQuery(batch.Select(s => s.Id), schoolYear), cancellationToken);
            foreach (var row in data.RootElement.GetProperty("value").EnumerateArray())
            {
                if (ReadGuid(row, "_fvsd_student_value") is Guid studentId && ReadInteger(row, "fvsd_period") is int period)
                    records.Add((studentId, period));
            }
        }
        return CalculateCompletion(roster, records, schoolYear);
    }

    internal static bool IsCompletionGrade(string? grade) => grade is not null
        && grade.StartsWith("Grade ", StringComparison.OrdinalIgnoreCase)
        && int.TryParse(grade[6..], out var number) && number is >= 2 and <= 10;

    internal static bool RequiredInPeriod(CompletionStudent student, int period) => !student.ExcludedFromTosrec
        && (IsCompletionGrade(student.Grade) || (student.GradeOneWinterSpring && period is 2 or 3));

    internal static string BuildCompletionRecordsQuery(IEnumerable<Guid> studentIds, string schoolYear)
    {
        var filter = $"statecode eq 0 and fvsd_schoolyear eq '{schoolYear.Replace("'", "''")}' and ("
            + string.Join(" or ", studentIds.Select(id => $"_fvsd_student_value eq {id:D}")) + ")";
        // Record existence is completion, regardless of exemption or score values.
        return "fvsd_studenttosrecassessments?$select=_fvsd_student_value,fvsd_period&$filter=" + Uri.EscapeDataString(filter);
    }

    internal static AssessmentCompletionSummary CalculateCompletion(IEnumerable<CompletionStudent> roster,
        IEnumerable<(Guid StudentId, int Period)> records, string schoolYear)
    {
        var distinctRoster = roster.DistinctBy(s => s.Id).ToArray();
        var submitted = records.ToHashSet();
        var periods = Enumerable.Range(1, 3).Select(period =>
        {
            var eligible = roster.Where(s => RequiredInPeriod(s, period)).DistinctBy(s => s.Id).ToArray();
            var missing = eligible.Where(s => !submitted.Contains((s.Id, period))).ToArray();
            return new CompletionPeriod(period, new[] { "Fall", "Winter", "Spring" }[period - 1],
                eligible.Length, eligible.Length - missing.Length, missing);
        }).ToArray();
        var grades = distinctRoster.GroupBy(s => s.Grade ?? "Grade not recorded")
            .Select(group => new CompletionGrade(group.Key, group.Count())).OrderBy(group => group.Grade).ToArray();
        return new("TOSREC", schoolYear, DateTimeOffset.UtcNow, periods, distinctRoster.Length, grades);
    }

    private async Task<JsonDocument> GetAllJsonAsync(string query, CancellationToken cancellationToken)
    {
        // $top caps total results, so remove it and follow every server-issued page.
        query = System.Text.RegularExpressions.Regex.Replace(query, @"&\$top=\d+", "");
        var rows = new List<JsonElement>();
        string? next = query;
        while (next is not null)
        {
            var uri = new Uri(_options.ApiBaseUrl, next);
            if (!_options.ApiBaseUrl.IsBaseOf(uri))
                throw new InvalidOperationException("Dataverse returned an unexpected paging URL.");
            using var page = await GetJsonAsync(uri.AbsoluteUri, cancellationToken);
            rows.AddRange(page.RootElement.GetProperty("value").EnumerateArray().Select(row => row.Clone()));
            next = page.RootElement.TryGetProperty("@odata.nextLink", out var link) ? link.GetString() : null;
        }
        return JsonSerializer.SerializeToDocument(new { value = rows });
    }
}
