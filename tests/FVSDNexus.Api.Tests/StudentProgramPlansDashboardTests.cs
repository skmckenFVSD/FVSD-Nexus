using FVSDNexus.Api.Dataverse;

namespace FVSDNexus.Api.Tests;

public sealed class StudentProgramPlansDashboardTests
{
    [Fact]
    public void Query_limits_plans_to_permitted_students_and_selected_year_including_archived()
    {
        var student = Guid.NewGuid();
        var other = Guid.NewGuid();
        var query = Uri.UnescapeDataString(DataverseAssessmentWorkspaceClient.BuildProgramPlansDashboardQuery([student, other], "2025 / 2026"));
        Assert.Contains($"_fvsd_student_value eq {student:D}", query);
        Assert.Contains($"_fvsd_student_value eq {other:D}", query);
        Assert.Contains("fvsd_schoolyear eq '2025 / 2026'", query);
        Assert.Contains("fvsd_schoolyear eq '2025-2026'", query);
        Assert.Contains("fvsd_schoolyear eq '2025/2026'", query);
        Assert.DoesNotContain("statecode eq 0", query);
        Assert.DoesNotContain("$top", query);
        Assert.Contains("statuscode", query);
    }

    [Fact]
    public void Query_rejects_an_empty_scope_instead_of_loading_every_plan() =>
        Assert.Throws<ArgumentException>(() => DataverseAssessmentWorkspaceClient.BuildProgramPlansDashboardQuery([], "2026 / 2027"));
}
