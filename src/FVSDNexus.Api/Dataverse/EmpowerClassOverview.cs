using System.Text.Json;
using System.Text.RegularExpressions;

namespace FVSDNexus.Api.Dataverse;

public sealed record EmpowerClassOverviewStudent(AssessmentStudent Student, Guid? PlanId,
    IReadOnlyList<StudentPlanEmpowerGoal> Results, Guid TeacherSectionId, bool CanEdit);
public sealed record EmpowerClassOverview(string SchoolYear,
    IReadOnlyList<StudentPlanEmpowerLevelOption> Levels,
    IReadOnlyList<StudentPlanEmpowerGoal> Goals,
    IReadOnlyList<EmpowerClassOverviewStudent> Students);

public sealed partial class DataverseAssessmentWorkspaceClient
{
    public async Task<EmpowerClassOverview> GetEmpowerClassOverviewAsync(
        DataverseAccessContext accessContext, string? developmentRole, bool isDeveloper,
        Guid? schoolId, Guid teacherId, string? sectionGroup, string schoolYear,
        CancellationToken cancellationToken = default, string ippSection = "Empower Reading", string? currentSchoolYear = null)
    {
        if (ippSection is not ("Empower Reading" or "Mathematics"))
            throw new ArgumentException("Select a supported IPP section.");
        var mathematics = ippSection == "Mathematics";
        if (teacherId == Guid.Empty) throw new ArgumentException("Select a single teacher.");
        if (!string.IsNullOrEmpty(sectionGroup) && sectionGroup is not ("Foundations" or "Homeroom"))
            throw new ArgumentException("Select Foundations or Homeroom.");

        // Reuse the governed roster; requesting a teacher never grants additional access.
        var dashboard = await GetStudentProgramPlansDashboardAsync(accessContext, developmentRole,
            isDeveloper, schoolId, schoolYear, cancellationToken);
        bool Matches(AssessmentTeacherSection section) => section.TeacherId == teacherId
            && (string.IsNullOrEmpty(sectionGroup) || section.SectionGroup == sectionGroup);
        if (!dashboard.Sections.Any(Matches))
            throw new AssessmentWorkspaceAccessException("The selected teacher is outside the available class scope.");

        var roster = dashboard.Students.Where(row => row.Assignments.Any(Matches)).ToArray();
        var plans = dashboard.Plans.Where(row => row.Assignments.Any(Matches))
            .GroupBy(row => row.Student.Id).ToDictionary(group => group.Key,
                group => group.OrderBy(row => row.Plan.StatusCode == 2).ThenByDescending(row => row.Plan.ModifiedOn).First().Plan);
        // The roster has already been restricted to the selected school, teacher and section group.
        // Foundations sections may have no grade/div attributes even when their students have valid grades.
        var grades = GetClassOverviewRosterGrades(roster.Select(row => row.Student.Grade)).ToHashSet();
        var divisions = GetEmpowerGradeDivisions(grades).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (grades.Count == 0)
        {
            foreach (var batch in dashboard.Sections.Where(Matches).Select(section => section.Id).Chunk(40))
            {
                var filter = "statecode eq 0 and (" + string.Join(" or ", batch.Select(id => $"fvsd_teachersectionid eq {id:D}")) + ")";
                using var sections = await GetAllJsonAsync("fvsd_teachersections?$filter=" + Uri.EscapeDataString(filter), cancellationToken);
                foreach (var section in sections.RootElement.GetProperty("value").EnumerateArray())
                {
                    divisions.UnionWith(GetEmpowerSectionDivisions(section));
                    grades.UnionWith(GetClassOverviewSectionGrades(section));
                }
            }
        }
        if (mathematics ? grades.Count == 0 : divisions.Count == 0)
            throw new ArgumentException("No student grades in the selected class match the selected IPP section. Empower Reading supports Grades 2 to 5 and Grades 6 to 9.");

        var scopeAttribute = mathematics ? "fvsd_grade" : "fvsd_div";
        using var divisionChoices = await GetJsonAsync(
            $"EntityDefinitions(LogicalName='fvsd_ippgoal')/Attributes(LogicalName='{scopeAttribute}')/"
            + "Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)", cancellationToken);
        var divisionValues = ParseStudentPlanOralReadingFluencyOptions(divisionChoices.RootElement)
            .Where(option => mathematics
                ? GetClassOverviewRosterGrades([option.Label]).Any(grades.Contains)
                : divisions.Contains(option.Label)).Select(option => option.Value).ToArray();
        var goalsQuery = mathematics ? BuildMathematicsClassGoalsQuery(divisionValues) : BuildEmpowerClassGoalsQuery(divisionValues);
        using var goalsDocument = await GetAllJsonAsync(goalsQuery, cancellationToken);
        var levelsQuery = mathematics ? BuildStudentPlanMathematicsLevelsQuery() : BuildStudentPlanEmpowerLevelsQuery();
        using var levelsDocument = await GetAllJsonAsync(levelsQuery.Replace("&$top=5000", ""), cancellationToken);
        using var empty = JsonDocument.Parse("{\"value\":[]}");
        IReadOnlyList<StudentPlanEmpowerGoal> ReadGoals(JsonElement progressRoot) => mathematics
            ? ParseStudentPlanMathematicsGoals(goalsDocument.RootElement, progressRoot).Select(NormalizeMathematicsClassGoal).ToArray()
            : ParseStudentPlanEmpowerGoals(goalsDocument.RootElement, progressRoot);
        var goals = ReadGoals(empty.RootElement);
        var levels = mathematics
            ? ParseStudentPlanMathematicsLevels(levelsDocument.RootElement).Select(level => new StudentPlanEmpowerLevelOption(
                level.Id, level.Name, level.Description, level.FillHex, level.FontHex, level.SortOrder)).ToArray()
            : ParseStudentPlanEmpowerLevels(levelsDocument.RootElement);
        if (goals.Count == 0 || levels.Count == 0)
            throw new InvalidOperationException($"{ippSection} master goals and rating levels must be configured.");

        var progress = new Dictionary<Guid, List<JsonElement>>();
        foreach (var batch in plans.Values.Select(plan => plan.Id).Distinct().Chunk(40))
        {
            using var data = await GetAllJsonAsync(BuildEmpowerClassProgressQuery(batch, ippSection), cancellationToken);
            foreach (var row in data.RootElement.GetProperty("value").EnumerateArray())
            {
                if (ReadGuid(row, "_fvsd_studentipp_value") is not Guid planId) continue;
                if (!progress.TryGetValue(planId, out var records)) progress[planId] = records = [];
                records.Add(row.Clone());
            }
        }
        var students = roster.Select(row =>
        {
            plans.TryGetValue(row.Student.Id, out var plan);
            using var records = JsonDocument.Parse(JsonSerializer.Serialize(new
            {
                value = plan is not null && progress.TryGetValue(plan.Id, out var entries) ? entries : []
            }));
            var results = ReadGoals(records.RootElement)
                .Where(goal => goal.ProgressId is not null).ToArray();
            return new EmpowerClassOverviewStudent(row.Student, plan?.Id, results, row.Assignments.First(Matches).Id,
                CanEditClassOverviewPlan(plan, currentSchoolYear));
        }).OrderBy(row => row.Student.Name, StringComparer.OrdinalIgnoreCase).ToArray();
        return new(schoolYear, levels, goals, students);
    }

    internal static bool CanEditClassOverviewPlan(StudentPlanHistoryRecord? plan, string? currentSchoolYear) =>
        plan is not null && plan.StatusCode != 2 && !string.IsNullOrWhiteSpace(currentSchoolYear)
        && Regex.Replace(plan.SchoolYear, @"\D", "") == Regex.Replace(currentSchoolYear, @"\D", "");

    internal static string BuildIppSectionLevelsQuery(string sectionName, string curriculumName)
    {
        var names = sectionName switch
        {
            "Mathematics" => new[] { "In Progress", "Met", "Not Met" },
            "FMCS Foundations" => new[] { "Developing", "Met" },
            "RLNS Foundations" => new[] { "Met", "Not Met" },
            _ => Array.Empty<string>()
        };
        var curriculum = names.Length > 0 ? "Mathematics" : curriculumName;
        var filter = $"statecode eq 0 and fvsd_curriculum/fvsd_name eq '{EscapeODataString(curriculum)}'";
        if (names.Length > 0)
            filter += " and (" + string.Join(" or ", names.Select(name => $"fvsd_name eq '{EscapeODataString(name)}'")) + ")";
        return "fvsd_ipplevels?$select=fvsd_ipplevelid,fvsd_name,fvsd_description,fvsd_fillhexcode,fvsd_fonthexcode,fvsd_sortorder&$filter="
            + Uri.EscapeDataString(filter) + "&$expand=fvsd_curriculum($select=fvsd_name)&$orderby=fvsd_sortorder asc,fvsd_name asc";
    }

    internal static IReadOnlyList<int> GetClassOverviewRosterGrades(IEnumerable<string?> gradeLabels) =>
        gradeLabels.SelectMany(ParseClassOverviewGradeLabel).Distinct().Order().ToArray();

    private static IEnumerable<int> ParseClassOverviewGradeLabel(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return [];
        if (Regex.IsMatch(text, @"pre[-\s]?k|preschool", RegexOptions.IgnoreCase)) return [-1];
        if (Regex.IsMatch(text, @"^(kindergarten|k|kg)$", RegexOptions.IgnoreCase)) return [0];
        var numbers = Regex.Matches(text, @"\b\d{1,2}\b").Select(match => int.Parse(match.Value)).Where(value => value <= 12).ToArray();
        if (numbers.Length == 2 && Regex.IsMatch(text, @"\bto\b|[-–]", RegexOptions.IgnoreCase) && numbers[1] >= numbers[0])
            return Enumerable.Range(numbers[0], numbers[1] - numbers[0] + 1);
        return numbers;
    }

    internal static IReadOnlyList<int> GetClassOverviewSectionGrades(JsonElement section) =>
        GetClassOverviewRosterGrades(section.EnumerateObject().Where(field =>
            field.Name.StartsWith("fvsd_", StringComparison.Ordinal)
            && field.Name.Contains("grade", StringComparison.OrdinalIgnoreCase)
            && field.Value.ValueKind == JsonValueKind.String).Select(field => field.Value.GetString()));

    internal static IReadOnlyList<string> GetEmpowerGradeDivisions(IEnumerable<int> grades)
    {
        var values = grades.ToArray();
        var divisions = new List<string>();
        if (values.Any(grade => grade is >= 2 and <= 5)) divisions.Add("Grade 2 to 5");
        if (values.Any(grade => grade is >= 6 and <= 9)) divisions.Add("Grade 6 to 9");
        return divisions;
    }

    internal static IReadOnlyList<string> GetEmpowerSectionDivisions(JsonElement section)
    {
        var grades = GetClassOverviewSectionGrades(section);
        var divisions = GetEmpowerGradeDivisions(grades).ToHashSet(StringComparer.OrdinalIgnoreCase);
        // Explicit grade boundaries take precedence over a broader division label.
        if (grades.Count > 0) return divisions.ToArray();
        foreach (var field in section.EnumerateObject().Where(field => field.Name.StartsWith("fvsd_", StringComparison.Ordinal)
            && field.Name.Contains("div", StringComparison.OrdinalIgnoreCase) && field.Value.ValueKind == JsonValueKind.String))
        {
            var label = field.Value.GetString()?.Trim();
            if (label is "Grade 2 to 5" or "Grade 6 to 9") divisions.Add(label);
        }
        return divisions.ToArray();
    }

    internal static string BuildEmpowerClassGoalsQuery(IEnumerable<int> divisionValues)
    {
        var values = divisionValues.Distinct().ToArray();
        if (values.Length == 0) throw new ArgumentException("No Empower goal division matches the selected teacher sections.");
        var filter = "statecode eq 0 and fvsd_ippsection/fvsd_name eq 'Empower Reading' and ("
            + string.Join(" or ", values.Select(value => $"fvsd_div eq {value}")) + ")";
        return "fvsd_ippgoals?$select=fvsd_ippgoalid,fvsd_name,fvsd_alias,fvsd_description,fvsd_foundationlevel,"
            + "fvsd_div,fvsd_subsection,fvsd_sortorder,_fvsd_ippsection_value&$filter=" + Uri.EscapeDataString(filter)
            + "&$expand=fvsd_ippsection($select=fvsd_ippsectionid,fvsd_name,fvsd_frontfacingdescription)"
            + "&$orderby=fvsd_sortorder asc,fvsd_name asc";
    }

    internal static string BuildMathematicsClassGoalsQuery(IEnumerable<int> gradeValues)
    {
        var values = gradeValues.Distinct().ToArray();
        if (values.Length == 0) throw new ArgumentException("No Mathematics goal grade matches the selected teacher sections.");
        var filter = "statecode eq 0 and fvsd_ippsection/fvsd_name eq 'Mathematics' and ("
            + string.Join(" or ", values.Select(value => $"fvsd_grade eq {value}")) + ")";
        return "fvsd_ippgoals?$select=fvsd_ippgoalid,fvsd_name,fvsd_alias,fvsd_description,fvsd_grade,"
            + "fvsd_subsection,fvsd_sortorder,_fvsd_ippsection_value&$filter=" + Uri.EscapeDataString(filter)
            + "&$expand=fvsd_ippsection($select=fvsd_ippsectionid,fvsd_name,fvsd_frontfacingdescription)"
            + "&$orderby=fvsd_subsection asc,fvsd_grade asc,fvsd_sortorder asc,fvsd_name asc";
    }

    private static StudentPlanEmpowerGoal NormalizeMathematicsClassGoal(StudentPlanMathematicsGoal goal) => new(
        goal.GoalId, goal.Name, goal.Alias, goal.Description, goal.Outcome, goal.Grade, null, goal.SortOrder,
        goal.ProgressId, goal.InitialLevelId, goal.InitialLevelName, goal.InitialLevelFillHex, goal.InitialLevelFontHex,
        goal.InitialDate, goal.CurrentLevelId, goal.CurrentLevelName, goal.CurrentLevelFillHex, goal.CurrentLevelFontHex,
        goal.CurrentDate, goal.ETag);

    internal static string BuildEmpowerClassProgressQuery(IEnumerable<Guid> planIds, string ippSection = "Empower Reading")
    {
        if (ippSection is not ("Empower Reading" or "Mathematics")) throw new ArgumentException("Select a supported IPP section.");
        var ids = planIds.Distinct().ToArray();
        if (ids.Length == 0) throw new ArgumentException("A permitted plan scope is required.", nameof(planIds));
        var filter = "(" + string.Join(" or ", ids.Select(id => $"_fvsd_studentipp_value eq {id:D}"))
            + $") and fvsd_ippgoal/fvsd_ippsection/fvsd_name eq '{EscapeODataString(ippSection)}'";
        return "fvsd_studentipplevels?$select=fvsd_studentipplevelid,fvsd_initialdateachieved,fvsd_currentdateachieved,"
            + "_fvsd_ippgoal_value,_fvsd_ippinitiallevel_value,_fvsd_ipplevel_value,_fvsd_studentipp_value,modifiedon&$filter="
            + Uri.EscapeDataString(filter)
            + "&$expand=fvsd_ippinitiallevel($select=fvsd_ipplevelid,fvsd_name,fvsd_fillhexcode,fvsd_fonthexcode),"
            + "fvsd_ipplevel($select=fvsd_ipplevelid,fvsd_name,fvsd_fillhexcode,fvsd_fonthexcode)&$orderby=modifiedon desc";
    }
}
