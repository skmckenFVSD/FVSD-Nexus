using FVSDNexus.Api.Dataverse;

namespace FVSDNexus.Api.Tests;

public sealed class AssessmentCompletionTests
{
    [Theory]
    [InlineData("Grade 1", false)]
    [InlineData("Grade 2", true)]
    [InlineData("Grade 10", true)]
    [InlineData("Grade 11", false)]
    [InlineData("Kindergarten", false)]
    [InlineData(null, false)]
    public void Eligibility_is_grades_two_through_ten(string? grade, bool expected) =>
        Assert.Equal(expected, DataverseAssessmentWorkspaceClient.IsCompletionGrade(grade));

    [Fact]
    public void Counts_distinct_eligible_students_per_period_and_lists_missing()
    {
        var first = new CompletionStudent(Guid.NewGuid(), "First", null, null, null, "Grade 2");
        var second = new CompletionStudent(Guid.NewGuid(), "Second", null, null, null, "Grade 10");
        var ineligible = new CompletionStudent(Guid.NewGuid(), "Other", null, null, null, "Grade 1");
        var summary = DataverseAssessmentWorkspaceClient.CalculateCompletion(
            [first, first, second, ineligible],
            [(first.Id, 1), (first.Id, 1), (second.Id, 2), (Guid.NewGuid(), 3)], "2026-2027");
        Assert.All(summary.Periods, period => Assert.Equal(2, period.Expected));
        Assert.Equal(1, summary.Periods[0].Completed);
        Assert.Equal(second.Id, Assert.Single(summary.Periods[0].Missing).Id);
        Assert.Equal(first.Id, Assert.Single(summary.Periods[1].Missing).Id);
        Assert.Equal(0, summary.Periods[2].Completed);
        Assert.Equal(2, summary.Periods[2].Missing.Count);
        Assert.Equal(3, summary.RosterCount);
        Assert.Equal(1, summary.RosterGrades.Single(grade => grade.Grade == "Grade 1").Students);
    }

    [Fact]
    public void Query_counts_record_existence_without_exemption_or_previous_teacher_restrictions()
    {
        var id = Guid.NewGuid();
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildCompletionRecordsQuery([id], "2026-2027"));
        Assert.Contains("statecode eq 0", query);
        Assert.Contains("fvsd_schoolyear eq '2026-2027'", query);
        Assert.Contains($"_fvsd_student_value eq {id:D}", query);
        Assert.DoesNotContain("exempt", query);
        Assert.DoesNotContain("teacher", query);
        Assert.DoesNotContain("standardscore", query);
        Assert.DoesNotContain("$top", query);
    }

    [Fact]
    public void Grade_one_roster_is_distinguished_from_no_matching_students()
    {
        var student = new CompletionStudent(Guid.NewGuid(), "Student", null, null, null, "Grade 1");
        var summary = DataverseAssessmentWorkspaceClient.CalculateCompletion([student], [], "2026-2027");
        Assert.Equal(1, summary.RosterCount);
        Assert.Equal("Grade 1", Assert.Single(summary.RosterGrades).Grade);
        Assert.All(summary.Periods, period => Assert.Equal(0, period.Expected));
    }

    [Fact]
    public void Elalit1_requires_winter_and_spring_but_ela_requires_nothing()
    {
        var gradeOne = new CompletionStudent(Guid.NewGuid(), "Grade one", null, null, null, "Grade 1", GradeOneWinterSpring: true);
        var ela = new CompletionStudent(Guid.NewGuid(), "ELA", null, null, null, "Grade 2", ExcludedFromTosrec: true);
        var summary = DataverseAssessmentWorkspaceClient.CalculateCompletion([gradeOne, ela], [(gradeOne.Id, 2)], "2026-2027");
        Assert.Equal(0, summary.Periods[0].Expected);
        Assert.Equal(1, summary.Periods[1].Expected);
        Assert.Equal(1, summary.Periods[1].Completed);
        Assert.Equal(gradeOne.Id, Assert.Single(summary.Periods[2].Missing).Id);
    }

    [Fact]
    public void Empty_roster_returns_three_zero_periods()
    {
        var summary = DataverseAssessmentWorkspaceClient.CalculateCompletion([], [], "2026-2027");
        Assert.Equal(3, summary.Periods.Count);
        Assert.All(summary.Periods, period => { Assert.Equal(0, period.Expected); Assert.Equal(0, period.Completed); Assert.Empty(period.Missing); });
    }
}
