using System.Text.Json;
using FVSDNexus.Api.Dataverse;

namespace FVSDNexus.Api.Tests;

public sealed class EmpowerClassOverviewTests
{
    [Theory]
    [InlineData("Mathematics", "In Progress", "Met", "Not Met")]
    [InlineData("FMCS Foundations", "Developing", "Met", null)]
    [InlineData("RLNS Foundations", "Met", "Not Met", null)]
    public void Level_choices_match_canvas_section_filters(string section, string first, string second, string? third)
    {
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildIppSectionLevelsQuery(section, "Other"));
        Assert.Contains("fvsd_curriculum/fvsd_name eq 'Mathematics'", query);
        Assert.Contains($"fvsd_name eq '{first}'", query);
        Assert.Contains($"fvsd_name eq '{second}'", query);
        if (third is not null) Assert.Contains($"fvsd_name eq '{third}'", query);
        foreach (var excluded in new[] { "In Progress", "Met", "Not Met", "Developing" }.Except(new[] { first, second, third }))
            Assert.DoesNotContain($"fvsd_name eq '{excluded}'", query);
        Assert.Contains("$orderby=fvsd_sortorder asc", query);
    }

    [Fact]
    public void Default_levels_use_section_curriculum_without_restricting_rating_names()
    {
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildIppSectionLevelsQuery("Empower Reading", "English Language Arts and Literature"));
        Assert.Contains("fvsd_curriculum/fvsd_name eq 'English Language Arts and Literature'", query);
        Assert.DoesNotContain("and (fvsd_name eq", query);
    }

    [Theory]
    [InlineData("2026 / 2027", 1, true)]
    [InlineData("2026-2027", 1, true)]
    [InlineData("2025 / 2026", 1, false)]
    [InlineData("2026 / 2027", 2, false)]
    public void Grid_editability_requires_active_current_year_plan(string schoolYear, int status, bool expected)
    {
        var plan = new StudentPlanHistoryRecord(Guid.NewGuid(), "Plan", schoolYear, null, null, null, null, null, status, "Status", null);
        Assert.Equal(expected, DataverseAssessmentWorkspaceClient.CanEditClassOverviewPlan(plan, "2026 / 2027"));
        Assert.False(DataverseAssessmentWorkspaceClient.CanEditClassOverviewPlan(null, "2026 / 2027"));
    }

    [Fact]
    public void Grade_three_class_roster_selects_lower_division_without_section_grade_fields()
    {
        var grades = DataverseAssessmentWorkspaceClient.GetClassOverviewRosterGrades(["Grade 3", "Grade 3", null]);
        Assert.Equal([3], grades);
        var divisions = DataverseAssessmentWorkspaceClient.GetEmpowerGradeDivisions(grades);
        Assert.Equal("Grade 2 to 5", Assert.Single(divisions));
        Assert.DoesNotContain("Grade 6 to 9", divisions);
    }

    [Fact]
    public void Mixed_class_roster_selects_only_divisions_represented_by_its_students()
    {
        var grades = DataverseAssessmentWorkspaceClient.GetClassOverviewRosterGrades(["Grade 5", "Grade 6", "Grade 6"]);
        Assert.Equal([5, 6], grades);
        Assert.Equal(["Grade 2 to 5", "Grade 6 to 9"], DataverseAssessmentWorkspaceClient.GetEmpowerGradeDivisions(grades));
    }

    [Fact]
    public void Older_class_does_not_include_lower_division_goals()
    {
        var grades = DataverseAssessmentWorkspaceClient.GetClassOverviewRosterGrades(["Grade 6", "Grade 9"]);
        Assert.Equal("Grade 6 to 9", Assert.Single(DataverseAssessmentWorkspaceClient.GetEmpowerGradeDivisions(grades)));
    }

    [Fact]
    public void Missing_or_out_of_range_roster_grades_do_not_load_every_division()
    {
        var grades = DataverseAssessmentWorkspaceClient.GetClassOverviewRosterGrades([null, "", "Grade 1", "Grade 10"]);
        Assert.Empty(DataverseAssessmentWorkspaceClient.GetEmpowerGradeDivisions(grades));
    }

    [Fact]
    public void Mathematics_roster_grade_scope_handles_kindergarten_and_preserves_exact_grades()
    {
        var grades = DataverseAssessmentWorkspaceClient.GetClassOverviewRosterGrades(["Kindergarten", "Grade 3"]);
        Assert.Equal([0, 3], grades);
    }

    [Fact]
    public void Mathematics_master_query_uses_section_grade_choices_and_its_own_ipp_section()
    {
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildMathematicsClassGoalsQuery([102370003]));
        Assert.Contains("fvsd_grade eq 102370003", query);
        Assert.Contains("fvsd_ippsection/fvsd_name eq 'Mathematics'", query);
        Assert.DoesNotContain("Empower Reading", query);
        Assert.DoesNotContain("fvsd_div eq", query);
        Assert.Throws<ArgumentException>(() => DataverseAssessmentWorkspaceClient.BuildMathematicsClassGoalsQuery([]));
    }

    [Fact]
    public void Progress_query_follows_the_selected_ipp_section()
    {
        var id = Guid.NewGuid();
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildEmpowerClassProgressQuery([id], "Mathematics"));
        Assert.Contains($"_fvsd_studentipp_value eq {id:D}", query);
        Assert.Contains("fvsd_ippgoal/fvsd_ippsection/fvsd_name eq 'Mathematics'", query);
        Assert.DoesNotContain("Empower Reading", query);
        Assert.Throws<ArgumentException>(() => DataverseAssessmentWorkspaceClient.BuildEmpowerClassProgressQuery([id], "Unknown"));
    }

    [Fact]
    public void Section_grade_scope_retains_exact_grades_for_mathematics()
    {
        using var section = JsonDocument.Parse("""{"fvsd_grade":"Grade 3 to 4"}""");
        Assert.Equal([3, 4], DataverseAssessmentWorkspaceClient.GetClassOverviewSectionGrades(section.RootElement).Order().ToArray());
    }

    [Theory]
    [InlineData("Grade 2", "Grade 2 to 5")]
    [InlineData("Grade 3", "Grade 2 to 5")]
    [InlineData("Grade 5", "Grade 2 to 5")]
    [InlineData("Grade 6", "Grade 6 to 9")]
    [InlineData("Grade 9", "Grade 6 to 9")]
    public void Teacher_section_grade_selects_the_correct_goal_division(string grade, string expected)
    {
        using var section = JsonDocument.Parse(JsonSerializer.Serialize(new Dictionary<string, object>
        {
            ["fvsd_grade"] = 102370003,
            ["fvsd_grade@OData.Community.Display.V1.FormattedValue"] = grade
        }));
        Assert.Equal(expected, Assert.Single(DataverseAssessmentWorkspaceClient.GetEmpowerSectionDivisions(section.RootElement)));
    }

    [Fact]
    public void Mixed_section_grade_range_includes_both_boundaries()
    {
        using var section = JsonDocument.Parse("""{"fvsd_grade":"Grade 5 to 6"}""");
        var result = DataverseAssessmentWorkspaceClient.GetEmpowerSectionDivisions(section.RootElement);
        Assert.Contains("Grade 2 to 5", result);
        Assert.Contains("Grade 6 to 9", result);
    }

    [Fact]
    public void Explicit_section_grade_does_not_inherit_an_unrelated_division()
    {
        using var section = JsonDocument.Parse("""{"fvsd_grade":"Grade 3","fvsd_div":"Grade 6 to 9"}""");
        Assert.Equal("Grade 2 to 5", Assert.Single(DataverseAssessmentWorkspaceClient.GetEmpowerSectionDivisions(section.RootElement)));
    }

    [Fact]
    public void Section_division_is_used_when_no_grade_is_recorded()
    {
        using var section = JsonDocument.Parse("""{"fvsd_div@OData.Community.Display.V1.FormattedValue":"Grade 2 to 5"}""");
        Assert.Equal("Grade 2 to 5", Assert.Single(DataverseAssessmentWorkspaceClient.GetEmpowerSectionDivisions(section.RootElement)));
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"fvsd_grade\":\"Grade 10\"}")]
    [InlineData("{\"fvsd_grade\":102370003}")]
    public void Missing_or_out_of_range_section_grade_does_not_default_to_all_goals(string json)
    {
        using var section = JsonDocument.Parse(json);
        Assert.Empty(DataverseAssessmentWorkspaceClient.GetEmpowerSectionDivisions(section.RootElement));
    }

    [Fact]
    public void Master_goal_fetch_filters_division_while_retaining_all_foundation_levels()
    {
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildEmpowerClassGoalsQuery([1]));
        Assert.Contains("fvsd_div eq 1", query);
        Assert.DoesNotContain("fvsd_div eq 2", query);
        Assert.DoesNotContain("fvsd_foundationlevel eq", query);
        Assert.Throws<ArgumentException>(() => DataverseAssessmentWorkspaceClient.BuildEmpowerClassGoalsQuery([]));
    }

    [Fact]
    public void Progress_query_is_limited_to_permitted_plans_and_empower_goals()
    {
        var first = Guid.NewGuid();
        var second = Guid.NewGuid();
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildEmpowerClassProgressQuery([first, second]));
        Assert.Contains($"_fvsd_studentipp_value eq {first:D}", query);
        Assert.Contains($"_fvsd_studentipp_value eq {second:D}", query);
        Assert.Contains("fvsd_ippgoal/fvsd_ippsection/fvsd_name eq 'Empower Reading'", query);
        Assert.Contains("fvsd_currentdateachieved", query);
        Assert.Contains("$orderby=modifiedon desc", query);
        Assert.DoesNotContain("$top", query);
    }

    [Fact]
    public void Empty_plan_scope_cannot_issue_an_unrestricted_progress_query() =>
        Assert.Throws<ArgumentException>(() => DataverseAssessmentWorkspaceClient.BuildEmpowerClassProgressQuery([]));

    [Fact]
    public void Master_goals_are_retained_without_any_student_progress()
    {
        var first = Guid.NewGuid();
        var second = Guid.NewGuid();
        using var goals = JsonDocument.Parse(JsonSerializer.Serialize(new { value = new[] {
            new Dictionary<string, object> { ["fvsd_ippgoalid"] = first, ["fvsd_name"] = "Shared name", ["fvsd_alias"] = "first", ["fvsd_sortorder"] = 1, ["fvsd_div@OData.Community.Display.V1.FormattedValue"] = "Grade 2 to 5", ["fvsd_foundationlevel@OData.Community.Display.V1.FormattedValue"] = "Level 1" },
            new Dictionary<string, object> { ["fvsd_ippgoalid"] = second, ["fvsd_name"] = "Shared name", ["fvsd_alias"] = "second", ["fvsd_sortorder"] = 2, ["fvsd_div@OData.Community.Display.V1.FormattedValue"] = "Grade 6 to 9", ["fvsd_foundationlevel@OData.Community.Display.V1.FormattedValue"] = "Level 2" }
        }}));
        using var empty = JsonDocument.Parse("{\"value\":[]}");
        var result = DataverseAssessmentWorkspaceClient.ParseStudentPlanEmpowerGoals(goals.RootElement, empty.RootElement);
        Assert.Equal(2, result.Count);
        Assert.All(result, goal => Assert.Null(goal.CurrentLevelId));
        Assert.Contains(result, goal => goal.GoalId == first && goal.Division == "Grade 2 to 5" && goal.FoundationLevel == "Level 1");
        Assert.Contains(result, goal => goal.GoalId == second && goal.Division == "Grade 6 to 9" && goal.FoundationLevel == "Level 2");
    }
}
