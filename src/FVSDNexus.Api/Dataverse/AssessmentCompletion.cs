using System.Text.Json;

namespace FVSDNexus.Api.Dataverse;

public sealed record CompletionStudent(Guid Id, string Name, string? ObfuscatedName, string? Asn, string? ObfuscatedAsn, string? Grade,
    bool GradeOneWinterSpring = false, bool ExcludedFromTosrec = false);
public sealed record CompletionPeriod(int Period, string Label, int Expected, int Completed, IReadOnlyList<CompletionStudent> Missing);
public sealed record CompletionGrade(string Grade, int Students);
public sealed record AssessmentCompletionSummary(string AssessmentType, string SchoolYear, DateTimeOffset RefreshedAt,
    IReadOnlyList<CompletionPeriod> Periods, int RosterCount, IReadOnlyList<CompletionGrade> RosterGrades);

public sealed partial class DataverseAssessmentWorkspaceClient
{
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
