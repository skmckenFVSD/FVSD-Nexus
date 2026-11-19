namespace FVSDNexus.Api.Dataverse;

public sealed record ProgramPlanDashboardRow(
    StudentPlanHistoryRecord Plan, AssessmentStudent Student,
    IReadOnlyList<AssessmentTeacherSection> Assignments);

public sealed record ProgramPlanRosterStudent(AssessmentStudent Student, IReadOnlyList<AssessmentTeacherSection> Assignments);

public sealed record StudentProgramPlansDashboard(
    string SchoolYear, IReadOnlyList<AssessmentTeacherSection> Sections,
    IReadOnlyList<ProgramPlanDashboardRow> Plans, IReadOnlyList<ProgramPlanRosterStudent> Students);

public sealed partial class DataverseAssessmentWorkspaceClient
{
    public async Task<StudentProgramPlansDashboard> GetStudentProgramPlansDashboardAsync(
        DataverseAccessContext accessContext, string? developmentRole, bool isDeveloper,
        Guid? schoolId, string schoolYear, CancellationToken cancellationToken = default)
    {
        var policy = AssessmentAccessPolicy.Create(accessContext, developmentRole, isDeveloper);
        var schools = await GetPermittedSchoolsAsync(policy, accessContext, cancellationToken);
        if (schoolId is not null && !policy.AllowsSchool(schoolId.Value, schools))
            throw new AssessmentWorkspaceAccessException("The selected school is outside your Student Program Plan scope.");

        var scopedSchools = schools.Where(school => schoolId is null || school.Id == schoolId).ToArray();
        var identity = GetScopedTeacherIdentity(policy, accessContext);
        if (scopedSchools.Length == 0 || (policy.TeacherLockedToSignedInUser && !identity.IsAvailable))
            return new(schoolYear, [], [], []);

        // Only plan-bearing section groups, with the same server-enforced teacher scope as Class Assignments.
        var sections = new List<AssessmentTeacherSection>();
        using var mappings = await GetJsonAsync(BuildSectionMappingsQuery(), cancellationToken);
        foreach (var group in new[] { "Foundations", "Homeroom" })
        {
            using var data = await GetAllJsonAsync(BuildScreenersDashboardSectionsQuery(
                scopedSchools.Select(school => school.Id), group, identity.Upn, identity.EntraObjectId), cancellationToken);
            sections.AddRange(ParseTeacherSections(data.RootElement, ParseMappings(mappings.RootElement)));
        }

        var sectionLookup = sections.ToDictionary(section => section.Id);
        var students = new Dictionary<Guid, AssessmentStudent>();
        var assignments = new Dictionary<Guid, HashSet<Guid>>();
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
                    || !sectionLookup.ContainsKey(sectionId)) continue;
                students[student.Id] = student;
                if (!assignments.TryGetValue(student.Id, out var ids)) assignments[student.Id] = ids = [];
                ids.Add(sectionId);
            }
        }

        var plans = new List<ProgramPlanDashboardRow>();
        foreach (var batch in students.Keys.Chunk(40))
        {
            using var data = await GetAllJsonAsync(BuildProgramPlansDashboardQuery(batch, schoolYear), cancellationToken);
            var owners = data.RootElement.GetProperty("value").EnumerateArray()
                .Where(row => ReadGuid(row, "fvsd_studentippid") is not null)
                .ToDictionary(row => ReadGuid(row, "fvsd_studentippid")!.Value,
                    row => ReadGuid(row, "_fvsd_student_value"));
            foreach (var plan in ParseStudentPlans(data.RootElement))
            {
                if (owners.GetValueOrDefault(plan.Id) is not Guid studentId || !students.TryGetValue(studentId, out var student)) continue;
                plans.Add(new(plan, student, assignments[studentId].Select(id => sectionLookup[id]).ToArray()));
            }
        }
        return new(schoolYear, sections, plans.OrderByDescending(row => row.Plan.ModifiedOn).ToArray(),
            students.Values.Select(student => new ProgramPlanRosterStudent(student, assignments[student.Id].Select(id => sectionLookup[id]).ToArray())).ToArray());
    }

    internal static string BuildProgramPlansDashboardQuery(IEnumerable<Guid> studentIds, string schoolYear)
    {
        var ids = studentIds.Distinct().ToArray();
        if (ids.Length == 0) throw new ArgumentException("A permitted student roster is required.", nameof(studentIds));
        var start = GetSchoolYearStart(schoolYear);
        if (start == int.MinValue) throw new ArgumentException("Select a valid school year.", nameof(schoolYear));
        var yearFilter = string.Join(" or ", new[] { $"{start} / {start + 1}", $"{start}/{start + 1}", $"{start}-{start + 1}" }
            .Select(year => $"fvsd_schoolyear eq '{EscapeODataString(year)}'"));
        var filter = $"({yearFilter}) and ("
            + string.Join(" or ", ids.Select(id => $"_fvsd_student_value eq {id:D}")) + ")";
        return "fvsd_studentipps?$select=fvsd_studentippid,_fvsd_student_value,fvsd_name,fvsd_schoolyear,fvsd_gradeatipp,"
            + "fvsd_schoolatipp,fvsd_teacheratipp,fvsd_coursename,fvsd_curriculum,statecode,statuscode,modifiedon&$filter="
            + Uri.EscapeDataString(filter) + "&$orderby=modifiedon desc";
    }
}
