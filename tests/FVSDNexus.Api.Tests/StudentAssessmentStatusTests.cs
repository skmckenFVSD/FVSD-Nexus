using FVSDNexus.Api.Dataverse;

namespace FVSDNexus.Api.Tests;

public sealed class StudentAssessmentStatusTests
{
    [Fact]
    public void Grade_two_includes_confirmed_screeners_and_simulated_pnsa()
    {
        var requirements = DataverseAssessmentWorkspaceClient.GetStudentAssessmentRequirements("Grade 2", "ELALIT2");

        Assert.Equal(["TOSREC", "TOWRE", "PNSA", "WRAT-5"], requirements.Keys);
        Assert.All(requirements.Values, periods => Assert.Equal([1, 2, 3], periods.Order()));
    }

    [Fact]
    public void Pnsa_is_not_shown_above_grade_six()
    {
        var requirements = DataverseAssessmentWorkspaceClient.GetStudentAssessmentRequirements("Grade 7", "ELALIT7");

        Assert.Equal(["TOSREC", "TOWRE", "WRAT-5"], requirements.Keys);
    }

    [Fact]
    public void Elalit_one_only_requires_tosrec_in_winter_and_spring()
    {
        var requirements = DataverseAssessmentWorkspaceClient.GetStudentAssessmentRequirements("Grade 1", "ELALIT1");

        var tosrec = Assert.Single(requirements);
        Assert.Equal("TOSREC", tosrec.Key);
        Assert.Equal([2, 3], tosrec.Value.Order());
    }

    [Fact]
    public void Ela_has_no_assessment_requirements()
    {
        Assert.Empty(DataverseAssessmentWorkspaceClient.GetStudentAssessmentRequirements("Grade 4", "ELA"));
    }

    [Fact]
    public void Status_query_is_scoped_to_current_year_and_students()
    {
        var studentId = Guid.NewGuid();
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildStudentAssessmentStatusQuery(
            "fvsd_studenttosrecassessments", [studentId], "2026 / 2027"));

        Assert.Contains("$select=_fvsd_student_value,fvsd_period", query);
        Assert.Contains("statecode eq 0", query);
        Assert.Contains("fvsd_schoolyear eq '2026 / 2027'", query);
        Assert.Contains($"_fvsd_student_value eq {studentId:D}", query);
    }

    [Fact]
    public void Simulated_status_is_stable_for_the_same_student_and_period()
    {
        var studentId = Guid.NewGuid();
        var first = DataverseAssessmentWorkspaceClient.GetSimulatedCompletion(studentId, "TOWRE", 1);
        var second = DataverseAssessmentWorkspaceClient.GetSimulatedCompletion(studentId, "TOWRE", 1);

        Assert.Equal(first, second);
    }
}
