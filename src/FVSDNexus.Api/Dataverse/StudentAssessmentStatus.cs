using System.Text.Json;

namespace FVSDNexus.Api.Dataverse;

public sealed record StudentAssessmentPeriodStatus(int Period, string Label, bool Required, bool Complete);

public sealed record StudentAssessmentRequirementStatus(
    string AssessmentType,
    bool Simulated,
    IReadOnlyList<StudentAssessmentPeriodStatus> Periods);

public sealed record StudentAssessmentStatus(
    Guid StudentId,
    string SchoolYear,
    IReadOnlyList<StudentAssessmentRequirementStatus> Assessments);

public sealed partial class DataverseAssessmentWorkspaceClient
{
    private const string TosrecEntitySet = "fvsd_studenttosrecassessments";

    public async Task<IReadOnlyList<StudentAssessmentStatus>> GetStudentAssessmentStatusesAsync(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper,
        Guid teacherSectionId,
        string schoolYear,
        CancellationToken cancellationToken = default)
    {
        var students = await GetStudentsAsync(
            accessContext,
            developmentRole,
            isDeveloper,
            teacherSectionId,
            cancellationToken);

        using var sectionDocument = await GetJsonAsync(
            BuildAssessmentSectionQuery(teacherSectionId),
            cancellationToken);
        var sectionRows = sectionDocument.RootElement.GetProperty("value");
        if (sectionRows.GetArrayLength() != 1)
        {
            throw new AssessmentWorkspaceAccessException("The selected teacher section is not available.");
        }

        var courseNumber = ReadString(sectionRows[0], "fvsd_courseno") ?? string.Empty;
        var distinctStudents = students.DistinctBy(student => student.Id).ToArray();
        var requirements = distinctStudents.ToDictionary(
            student => student.Id,
            student => GetStudentAssessmentRequirements(student.Grade, courseNumber));
        var applicableStudents = requirements
            .Where(pair => pair.Value.Count > 0)
            .Select(pair => pair.Key)
            .ToArray();

        var completedTosrec = new HashSet<(Guid StudentId, int Period)>();

        foreach (var batch in applicableStudents.Chunk(40))
        {
            using var document = await GetAllJsonAsync(
                BuildStudentAssessmentStatusQuery(TosrecEntitySet, batch, schoolYear),
                cancellationToken);
            foreach (var row in document.RootElement.GetProperty("value").EnumerateArray())
            {
                if (ReadGuid(row, "_fvsd_student_value") is Guid studentId
                    && ReadInteger(row, "fvsd_period") is int period
                    && period is >= 1 and <= 3)
                {
                    completedTosrec.Add((studentId, period));
                }
            }
        }

        return distinctStudents.Select(student => new StudentAssessmentStatus(
            student.Id,
            schoolYear,
            requirements[student.Id].Select(requirement => new StudentAssessmentRequirementStatus(
                requirement.Key,
                !string.Equals(requirement.Key, "TOSREC", StringComparison.OrdinalIgnoreCase),
                Enumerable.Range(1, 3).Select(period => new StudentAssessmentPeriodStatus(
                    period,
                    GetPeriodLabel(period) ?? $"Period {period}",
                    requirement.Value.Contains(period),
                    requirement.Value.Contains(period) && (string.Equals(requirement.Key, "TOSREC", StringComparison.OrdinalIgnoreCase)
                        ? completedTosrec.Contains((student.Id, period))
                        : GetSimulatedCompletion(student.Id, requirement.Key, period))))
                    .ToArray()))
                .ToArray()))
            .ToArray();
    }

    internal static IReadOnlyDictionary<string, IReadOnlySet<int>> GetStudentAssessmentRequirements(
        string? grade,
        string? courseNumber)
    {
        if (string.Equals(courseNumber?.Trim(), "ELA", StringComparison.OrdinalIgnoreCase))
        {
            return new Dictionary<string, IReadOnlySet<int>>();
        }

        if (string.Equals(grade, "Grade 1", StringComparison.OrdinalIgnoreCase)
            && string.Equals(courseNumber?.Trim(), "ELALIT1", StringComparison.OrdinalIgnoreCase))
        {
            return new Dictionary<string, IReadOnlySet<int>>
            {
                ["TOSREC"] = new HashSet<int> { 2, 3 },
            };
        }

        if (!IsCompletionGrade(grade))
        {
            return new Dictionary<string, IReadOnlySet<int>>();
        }

        return new Dictionary<string, IReadOnlySet<int>>
        {
            ["TOSREC"] = new HashSet<int> { 1, 2, 3 },
            ["TOWRE"] = new HashSet<int> { 1, 2, 3 },
            ["PNSA"] = GetGradeNumber(grade) is >= 2 and <= 6 ? new HashSet<int> { 1, 2, 3 } : new HashSet<int>(),
            ["WRAT-5"] = new HashSet<int> { 1, 2, 3 },
        }.Where(pair => pair.Value.Count > 0).ToDictionary(pair => pair.Key, pair => pair.Value);
    }

    internal static string BuildStudentAssessmentStatusQuery(
        string entitySet,
        IEnumerable<Guid> studentIds,
        string schoolYear)
    {
        if (!string.Equals(entitySet, TosrecEntitySet, StringComparison.Ordinal))
        {
            throw new ArgumentException("The assessment table is not supported.", nameof(entitySet));
        }

        var studentFilter = string.Join(" or ", studentIds.Select(id => $"_fvsd_student_value eq {id:D}"));
        var filter = $"statecode eq 0 and fvsd_schoolyear eq '{schoolYear.Replace("'", "''")}' and ({studentFilter})";
        return $"{entitySet}?$select=_fvsd_student_value,fvsd_period&$filter={Uri.EscapeDataString(filter)}";
    }

    private static int? GetGradeNumber(string? grade) => grade is not null
        && grade.StartsWith("Grade ", StringComparison.OrdinalIgnoreCase)
        && int.TryParse(grade[6..], out var number) ? number : null;

    internal static bool GetSimulatedCompletion(Guid studentId, string assessmentType, int period)
    {
        var bytes = studentId.ToByteArray();
        var seed = bytes[0] + bytes[5] + period + assessmentType.Sum(character => character);
        return seed % 4 != 0;
    }
}
