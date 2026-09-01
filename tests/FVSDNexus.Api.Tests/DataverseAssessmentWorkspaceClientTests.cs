using System.Text.Json;
using FVSDNexus.Api.Dataverse;

namespace FVSDNexus.Api.Tests;

public sealed class DataverseAssessmentWorkspaceClientTests
{
    [Fact]
    public void Teacher_section_query_scopes_school_and_signed_in_teacher()
    {
        var schoolId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var entraObjectId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildTeacherSectionsQuery(
                schoolId,
                sectionGroupValue: 1,
                teacherEntraObjectId: entraObjectId));

        Assert.Contains($"_fvsd_school_value eq {schoolId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_sectiongrouping eq 1", decoded, StringComparison.Ordinal);
        Assert.Contains(
            $"fvsd_teacher/fvsd_azureadobjectid eq '{entraObjectId:D}'",
            decoded,
            StringComparison.Ordinal);
        Assert.Contains("fvsd_studentsection_teachersection", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Section_group_query_is_lightweight_and_teacher_scoped_when_required()
    {
        var schoolId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var entraObjectId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildSectionGroupsQuery(schoolId, entraObjectId));

        Assert.Contains("$select=fvsd_sectiongrouping", decoded, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_school_value eq {schoolId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains(
            $"fvsd_teacher/fvsd_azureadobjectid eq '{entraObjectId:D}'",
            decoded,
            StringComparison.Ordinal);
        Assert.DoesNotContain("fvsd_studentsection_teachersection", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Section_groups_are_distinct_and_follow_the_power_fx_order()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_sectiongrouping": 3,
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Homeroom"
                },
                {
                  "fvsd_sectiongrouping": 2,
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Numeracy"
                },
                {
                  "fvsd_sectiongrouping": 1,
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Literacy"
                },
                {
                  "fvsd_sectiongrouping": 5,
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Foundations"
                },
                {
                  "fvsd_sectiongrouping": 1,
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Literacy"
                },
                {
                  "fvsd_sectiongrouping": 4,
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Other"
                }
              ]
            }
            """);

        var groups = DataverseAssessmentWorkspaceClient.ParseSectionGroups(document.RootElement);

        Assert.Equal(
            ["Literacy", "Numeracy", "Foundations", "Homeroom", "Other"],
            groups.Select(group => group.Label).ToArray());
    }

    [Fact]
    public void Section_group_and_mapping_sort_are_applied_before_course_and_teacher()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_teachersectionid": "10000000-0000-0000-0000-000000000001",
                  "_fvsd_school_value": "20000000-0000-0000-0000-000000000001",
                  "_fvsd_school_value@OData.Community.Display.V1.FormattedValue": "Test School",
                  "_fvsd_teacher_value": "30000000-0000-0000-0000-000000000001",
                  "fvsd_courseno": "MAT2",
                  "fvsd_coursename": "Mathematics 2",
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Numeracy",
                  "fvsd_teacher": { "fvsd_name": "Teacher B" },
                  "fvsd_studentsection_teachersection": [{ "fvsd_studentsectionid": "40000000-0000-0000-0000-000000000001" }]
                },
                {
                  "fvsd_teachersectionid": "10000000-0000-0000-0000-000000000002",
                  "_fvsd_school_value": "20000000-0000-0000-0000-000000000001",
                  "_fvsd_teacher_value": "30000000-0000-0000-0000-000000000002",
                  "fvsd_courseno": "ELA1",
                  "fvsd_coursename": "English 1",
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Literacy",
                  "fvsd_teacher": { "fvsd_name": "Teacher A" },
                  "fvsd_studentsection_teachersection": [{ "fvsd_studentsectionid": "40000000-0000-0000-0000-000000000002" }]
                },
                {
                  "fvsd_teachersectionid": "10000000-0000-0000-0000-000000000003",
                  "_fvsd_school_value": "20000000-0000-0000-0000-000000000001",
                  "_fvsd_teacher_value": "30000000-0000-0000-0000-000000000003",
                  "fvsd_courseno": "EMPTY",
                  "fvsd_coursename": "Empty Course",
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Literacy",
                  "fvsd_teacher": { "fvsd_name": "Teacher C" },
                  "fvsd_studentsection_teachersection": []
                }
              ]
            }
            """);

        var rows = DataverseAssessmentWorkspaceClient.ParseTeacherSections(
            document.RootElement,
            new Dictionary<string, int> { ["ELA1"] = 10, ["MAT2"] = 1 });

        Assert.Equal(2, rows.Count);
        Assert.Equal("ELA1", rows[0].CourseNumber);
        Assert.Equal("MAT2", rows[1].CourseNumber);
        Assert.All(rows, row => Assert.True(row.StudentCount > 0));
    }

    [Fact]
    public void Students_are_projected_and_sorted_by_name()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_studentsectionid": "40000000-0000-0000-0000-000000000001",
                  "fvsd_student": {
                    "fvsd_studentdetailid": "50000000-0000-0000-0000-000000000001",
                    "fvsd_name": "Zed Student",
                    "fvsd_grade": 5,
                    "fvsd_grade@OData.Community.Display.V1.FormattedValue": "Grade 4"
                  }
                },
                {
                  "fvsd_studentsectionid": "40000000-0000-0000-0000-000000000002",
                  "fvsd_student": {
                    "fvsd_studentdetailid": "50000000-0000-0000-0000-000000000002",
                    "fvsd_name": "Alpha Student",
                    "fvsd_grade": 6,
                    "fvsd_grade@OData.Community.Display.V1.FormattedValue": "Grade 5"
                  }
                }
              ]
            }
            """);

        var rows = DataverseAssessmentWorkspaceClient.ParseStudents(document.RootElement);

        Assert.Equal("Alpha Student", rows[0].Name);
        Assert.Equal("Grade 5", rows[0].Grade);
        Assert.Equal(6, rows[0].GradeValue);
    }

    [Fact]
    public void Tosrec_query_is_student_scoped_and_expands_governed_term_colours()
    {
        var studentId = Guid.Parse("50000000-0000-0000-0000-000000000001");

        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildTosrecAssessmentsQuery(studentId));

        Assert.Contains("fvsd_studenttosrecassessments", decoded, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_student_value eq {studentId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("$expand=fvsd_descriptiveterm", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_fillhexcode", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_fonthexcode", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=fvsd_schoolyear desc,fvsd_period desc", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Tosrec_history_is_normalized_and_sorted_like_the_power_fx_gallery()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_studenttosrecassessmentid": "90000000-0000-0000-0000-000000000001",
                  "fvsd_schoolyear": "2025 / 2026",
                  "fvsd_period": 1,
                  "fvsd_period@OData.Community.Display.V1.FormattedValue": "Fall",
                  "fvsd_assessmentdate": "2025-10-03",
                  "fvsd_gradeatassessment@OData.Community.Display.V1.FormattedValue": "Grade 4",
                  "fvsd_rawscore": 31,
                  "fvsd_standardscore": 94,
                  "fvsd_exempt": false,
                  "fvsd_descriptiveterm": {
                    "fvsd_name": "Average",
                    "fvsd_fillhexcode": "92d050",
                    "fvsd_fonthexcode": "#071940"
                  }
                },
                {
                  "fvsd_studenttosrecassessmentid": "90000000-0000-0000-0000-000000000002",
                  "fvsd_schoolyear": "2025 / 2026",
                  "fvsd_period": 3,
                  "fvsd_period@OData.Community.Display.V1.FormattedValue": "Spring",
                  "fvsd_assessmentdate": "2026-05-15",
                  "fvsd_standardscore": 110,
                  "fvsd_exempt": true,
                  "fvsd_descriptiveterm": {
                    "fvsd_name": "Average",
                    "fvsd_fillhexcode": "#92D050",
                    "fvsd_fonthexcode": "071940"
                  }
                },
                {
                  "fvsd_studenttosrecassessmentid": "90000000-0000-0000-0000-000000000003",
                  "fvsd_schoolyear": "2024 / 2025",
                  "fvsd_period": 3,
                  "fvsd_period@OData.Community.Display.V1.FormattedValue": "Spring",
                  "fvsd_standardscore": 101
                }
              ]
            }
            """);

        var rows = DataverseAssessmentWorkspaceClient.ParseTosrecAssessments(document.RootElement);

        Assert.Equal(3, rows.Count);
        Assert.Equal("Spring", rows[0].Period);
        Assert.Equal(110, rows[0].StandardScore);
        Assert.True(rows[0].Exempt);
        Assert.Equal("#92D050", rows[0].DescriptiveTermFill);
        Assert.Equal("#071940", rows[0].DescriptiveTermFont);
        Assert.Equal("Fall", rows[1].Period);
        Assert.Equal("2024 / 2025", rows[2].SchoolYear);
        Assert.Equal("Unassigned", rows[2].DescriptiveTerm);
    }

    [Fact]
    public void Administrator_school_selection_requires_two_assignments()
    {
        var oneSchool = CreateAccessContext("Administrator", includeAlternativeSchool: false);
        var twoSchools = CreateAccessContext("Administrator", includeAlternativeSchool: true);

        Assert.False(AssessmentAccessPolicy.Create(oneSchool, null, false).SchoolSelectionEnabled);
        Assert.True(AssessmentAccessPolicy.Create(twoSchools, null, false).SchoolSelectionEnabled);
    }

    [Fact]
    public void Teacher_is_locked_to_the_signed_in_identity()
    {
        var accessContext = CreateAccessContext("Teacher", includeAlternativeSchool: false);

        var policy = AssessmentAccessPolicy.Create(accessContext, null, false);

        Assert.True(policy.TeacherLockedToSignedInUser);
        Assert.False(policy.SchoolSelectionEnabled);
    }

    [Fact]
    public void Executive_uses_the_primary_assignment_without_a_school_picker()
    {
        var accessContext = CreateAccessContext("Executive", includeAlternativeSchool: true);

        var policy = AssessmentAccessPolicy.Create(accessContext, null, false);

        Assert.False(policy.CanViewAllSelectableSchools);
        Assert.False(policy.SchoolSelectionEnabled);
        Assert.Single(policy.AssignedSchools);
        Assert.Equal("Primary School", policy.AssignedSchools[0].Name);
    }

    [Fact]
    public void Development_data_analyst_can_select_from_all_available_schools()
    {
        var accessContext = CreateAccessContext("Executive", includeAlternativeSchool: false);

        var policy = AssessmentAccessPolicy.Create(
            accessContext,
            "Data Analyst (Administrator)",
            isDeveloper: true);

        Assert.Equal("Data Analyst", policy.Role);
        Assert.True(policy.CanViewAllSelectableSchools);
        Assert.True(policy.SchoolSelectionEnabled);
        Assert.False(policy.TeacherLockedToSignedInUser);
    }

    private static DataverseAccessContext CreateAccessContext(string role, bool includeAlternativeSchool) => new(
        true,
        Guid.Parse("60000000-0000-0000-0000-000000000001"),
        null,
        "test.user@fvsd.ab.ca",
        Guid.Parse("70000000-0000-0000-0000-000000000001"),
        role,
        role,
        false,
        true,
        false,
        new DataverseSchoolAssignment(
            Guid.Parse("80000000-0000-0000-0000-000000000001"),
            "Primary School"),
        includeAlternativeSchool
            ? new DataverseSchoolAssignment(
                Guid.Parse("80000000-0000-0000-0000-000000000002"),
                "Alternative School")
            : null);
}
