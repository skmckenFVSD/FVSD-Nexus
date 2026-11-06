using System.Text.Json;
using FVSDNexus.Api.Dataverse;

namespace FVSDNexus.Api.Tests;

public sealed class DataverseAssessmentWorkspaceClientTests
{
    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    [InlineData(67)]
    [InlineData(100)]
    public void Attendance_percentage_accepts_blank_and_whole_values_in_range(int? value)
    {
        DataverseAssessmentWorkspaceClient.ValidateAttendancePercentage(value, "Fall");
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public void Attendance_percentage_rejects_values_outside_percentage_range(int value)
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateAttendancePercentage(value, "Winter"));

        Assert.Equal("Winter Attendance must be a whole number from 0 to 100.", exception.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("parent@example.ca")]
    [InlineData("parent.guardian+iep@school.example.org")]
    public void Parent_or_guardian_email_accepts_blank_and_valid_addresses(string? value)
    {
        DataverseAssessmentWorkspaceClient.ValidateParentOrGuardianEmail(value);
    }

    [Theory]
    [InlineData("parent")]
    [InlineData("parent@")]
    [InlineData("@example.ca")]
    [InlineData("parent@example")]
    [InlineData("parent @example.ca")]
    public void Parent_or_guardian_email_rejects_invalid_addresses(string value)
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateParentOrGuardianEmail(value));

        Assert.Equal("Enter a valid Parent or Guardian Email address.", exception.Message);
    }

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
        Assert.Contains("fvsd_sectiongrouping ne 4", decoded, StringComparison.Ordinal);
        Assert.Contains(
            $"fvsd_teacher/fvsd_azureadobjectid eq '{entraObjectId:D}'",
            decoded,
            StringComparison.Ordinal);
        Assert.DoesNotContain("fvsd_studentsection_teachersection", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Section_groups_are_distinct_ordered_and_exclude_other()
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
            ["Literacy", "Numeracy", "Foundations", "Homeroom"],
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
                  "fvsd_sectionno": "ELA4-02",
                  "fvsd_student": {
                    "fvsd_studentdetailid": "50000000-0000-0000-0000-000000000002",
                    "fvsd_name": "Alpha Student",
                    "fvsd_obfuscatedname": "Demo Learner 01",
                    "fvsd_asn": "123456789",
                    "fvsd_obfuscatedasn": "900000001",
                    "fvsd_grade": 6,
                    "fvsd_grade@OData.Community.Display.V1.FormattedValue": "Grade 5"
                  }
                }
              ]
            }
            """);

        var rows = DataverseAssessmentWorkspaceClient.ParseStudents(document.RootElement);

        Assert.Equal("Alpha Student", rows[0].Name);
        Assert.Equal("Demo Learner 01", rows[0].ObfuscatedName);
        Assert.Equal("123456789", rows[0].Asn);
        Assert.Equal("900000001", rows[0].ObfuscatedAsn);
        Assert.Equal("ELA4-02", rows[0].SectionNumber);
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
    public void Student_plan_query_is_student_scoped_and_returns_annual_plan_context()
    {
        var studentId = Guid.Parse("50000000-0000-0000-0000-000000000001");

        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlansQuery(studentId));

        Assert.Contains("fvsd_studentipps", decoded, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_student_value eq {studentId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_schoolyear", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_gradeatipp", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=fvsd_schoolyear desc,modifiedon desc", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Student_plan_history_is_normalized_and_sorted_by_school_year()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_studentippid": "80000000-0000-0000-0000-000000000001",
                  "fvsd_name": "Earlier plan",
                  "fvsd_schoolyear": "2025 / 2026",
                  "fvsd_gradeatipp": 4,
                  "fvsd_gradeatipp@OData.Community.Display.V1.FormattedValue": "Grade 3",
                  "fvsd_schoolatipp": "Test School",
                  "fvsd_teacheratipp": "Teacher A",
                  "modifiedon": "2026-06-01T19:00:00Z"
                },
                {
                  "fvsd_studentippid": "80000000-0000-0000-0000-000000000002",
                  "fvsd_name": "Current plan",
                  "fvsd_schoolyear": "2026 / 2027",
                  "fvsd_gradeatipp": 5,
                  "fvsd_gradeatipp@OData.Community.Display.V1.FormattedValue": "Grade 4",
                  "fvsd_schoolatipp": "Test School",
                  "fvsd_teacheratipp": "Teacher B",
                  "fvsd_coursename": "Foundations",
                  "fvsd_curriculum": "English Language Arts and Literature",
                  "modifiedon": "2026-11-04T18:00:00Z"
                }
              ]
            }
            """);

        var plans = DataverseAssessmentWorkspaceClient.ParseStudentPlans(document.RootElement);

        Assert.Equal(2, plans.Count);
        Assert.Equal("Current plan", plans[0].Name);
        Assert.Equal("2026 / 2027", plans[0].SchoolYear);
        Assert.Equal("Grade 4", plans[0].GradeAtPlan);
        Assert.Equal("Foundations", plans[0].CourseName);
        Assert.Equal("Earlier plan", plans[1].Name);
    }

    [Fact]
    public void Student_plan_document_queries_are_plan_and_document_scoped()
    {
        var planId = Guid.Parse("80000000-0000-0000-0000-000000000001");
        var documentId = Guid.Parse("81000000-0000-0000-0000-000000000001");

        var gallery = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlanDocumentsQuery(planId));
        var content = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlanDocumentContentQuery(planId, documentId));

        Assert.Contains("annotations", gallery, StringComparison.Ordinal);
        Assert.Contains($"_objectid_value eq {planId:D}", gallery, StringComparison.Ordinal);
        Assert.Contains("isdocument eq true", gallery, StringComparison.Ordinal);
        Assert.DoesNotContain("documentbody", gallery, StringComparison.Ordinal);
        Assert.Contains("$orderby=modifiedon desc", gallery, StringComparison.Ordinal);
        Assert.Contains($"annotationid eq {documentId:D}", content, StringComparison.Ordinal);
        Assert.Contains($"_objectid_value eq {planId:D}", content, StringComparison.Ordinal);
        Assert.Contains("documentbody", content, StringComparison.Ordinal);
    }

    [Fact]
    public void Student_plan_coding_queries_use_the_existing_student_and_governed_reference_tables()
    {
        var studentId = Guid.Parse("50000000-0000-0000-0000-000000000001");

        var student = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlanCodingQuery(studentId));
        var categories = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildSpedCategoryOptionsQuery());
        var conditions = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildSpedConditionOptionsQuery());

        Assert.Contains("fvsd_studentdetails", student, StringComparison.Ordinal);
        Assert.Contains($"fvsd_studentdetailid eq {studentId:D}", student, StringComparison.Ordinal);
        Assert.Contains("fvsd_spedseriesname", student, StringComparison.Ordinal);
        Assert.Contains("fvsd_additionalspedcategoryone", student, StringComparison.Ordinal);
        Assert.Contains("fvsd_additionalspedobservationsthree", student, StringComparison.Ordinal);
        Assert.Contains("fvsd_powerschoolcodemappings", categories, StringComparison.Ordinal);
        Assert.Contains("fvsd_mappingtype eq 1", categories, StringComparison.Ordinal);
        Assert.Contains("fvsd_spedconditions", conditions, StringComparison.Ordinal);
        Assert.Contains("fvsd_conditiondetails", conditions, StringComparison.Ordinal);
        Assert.Contains("$expand=fvsd_spedcategory", conditions, StringComparison.Ordinal);
    }

    [Fact]
    public void Saved_sped_condition_names_are_trimmed_and_deduplicated()
    {
        var conditions = DataverseAssessmentWorkspaceClient.ParseConditionNames(
            " Dyslexia, ADHD, dyslexia, ,  Visual impairment ");

        Assert.Equal(3, conditions.Count);
        Assert.Equal("Dyslexia", conditions[0]);
        Assert.Equal("ADHD", conditions[1]);
        Assert.Equal("Visual impairment", conditions[2]);
    }

    [Fact]
    public void Student_plan_documents_include_only_pdf_notes_and_sort_newest_first()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                {
                  "annotationid": "81000000-0000-0000-0000-000000000001",
                  "subject": "Earlier IEP export",
                  "notetext": "Requested by Test User",
                  "filename": "earlier.pdf",
                  "mimetype": "application/pdf",
                  "filesize": 1200,
                  "modifiedon": "2026-11-05T17:00:00Z"
                },
                {
                  "annotationid": "81000000-0000-0000-0000-000000000002",
                  "subject": "Current IEP export",
                  "notetext": "Requested by Test User",
                  "filename": "current.pdf",
                  "mimetype": "application/pdf",
                  "filesize": 2400,
                  "modifiedon": "2026-11-06T17:00:00Z"
                },
                {
                  "annotationid": "81000000-0000-0000-0000-000000000003",
                  "subject": "Supporting note",
                  "filename": "note.txt",
                  "mimetype": "text/plain",
                  "modifiedon": "2026-11-06T18:00:00Z"
                }
              ]
            }
            """);

        var documents = DataverseAssessmentWorkspaceClient.ParseStudentPlanDocuments(document.RootElement);

        Assert.Equal(2, documents.Count);
        Assert.Equal("current.pdf", documents[0].FileName);
        Assert.Equal("Current IEP export", documents[0].Title);
        Assert.Equal(2400, documents[0].FileSize);
        Assert.Equal("earlier.pdf", documents[1].FileName);
    }

    [Fact]
    public void Plan_screener_queries_are_student_and_school_year_scoped()
    {
        var studentId = Guid.Parse("12345678-1234-1234-1234-123456789012");
        var schoolYear = "2026 / 2027";
        var tosrec = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildPlanTosrecScreenersQuery(studentId, schoolYear));
        var towre = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildPlanTowreScreenersQuery(studentId, schoolYear));
        var wrat = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildPlanWratScreenersQuery(studentId, schoolYear));

        Assert.Contains("fvsd_studenttosrecassessments", tosrec, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_student_value eq {studentId:D}", tosrec, StringComparison.Ordinal);
        Assert.Contains("fvsd_schoolyear eq '2026 / 2027'", tosrec, StringComparison.Ordinal);
        Assert.Contains("fvsd_studenttowreassessments", towre, StringComparison.Ordinal);
        Assert.Contains("fvsd_rwstandardscore", towre, StringComparison.Ordinal);
        Assert.Contains("fvsd_nwdescriptiveterm", towre, StringComparison.Ordinal);
        Assert.Contains("fvsd_studentwratassessments", wrat, StringComparison.Ordinal);
        Assert.Contains("$orderby=fvsd_assessmentdate desc,modifiedon desc", wrat, StringComparison.Ordinal);
    }

    [Fact]
    public void Plan_screeners_flatten_towre_subscores_and_keep_the_latest_period_record()
    {
        using var tosrec = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_period": 1,
                "fvsd_period@OData.Community.Display.V1.FormattedValue": "Fall",
                "fvsd_assessmentdate": "2026-09-24T00:00:00Z",
                "fvsd_standardscore": 62,
                "fvsd_descriptiveterm": {
                  "fvsd_name": "Very Poor",
                  "fvsd_fillhexcode": "FF0000",
                  "fvsd_fonthexcode": "FFFFFF"
                }
              },
              {
                "fvsd_period": 1,
                "fvsd_period@OData.Community.Display.V1.FormattedValue": "Fall",
                "fvsd_assessmentdate": "2026-09-01T00:00:00Z",
                "fvsd_standardscore": 59
              }
            ] }
            """);
        using var towre = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_period": 1,
                "fvsd_period@OData.Community.Display.V1.FormattedValue": "Fall",
                "fvsd_assessmentdate": "2026-09-25T00:00:00Z",
                "fvsd_standardscore": 63,
                "fvsd_rwstandardscore": 67,
                "fvsd_nwstandardscore": 61,
                "fvsd_descriptiveterm": { "fvsd_name": "Very Poor", "fvsd_fillhexcode": "FF0000", "fvsd_fonthexcode": "FFFFFF" },
                "fvsd_rwdescriptiveterm": { "fvsd_name": "Poor", "fvsd_fillhexcode": "F47B20", "fvsd_fonthexcode": "071940" },
                "fvsd_nwdescriptiveterm": { "fvsd_name": "Very Poor", "fvsd_fillhexcode": "FF0000", "fvsd_fonthexcode": "FFFFFF" }
              }
            ] }
            """);
        using var wrat = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_period": 1,
                "fvsd_period@OData.Community.Display.V1.FormattedValue": "Fall",
                "fvsd_assessmentdate": "2026-09-26T00:00:00Z",
                "fvsd_standardscore": 66,
                "fvsd_descriptiveterm": { "fvsd_name": "Poor", "fvsd_fillhexcode": "F47B20", "fvsd_fonthexcode": "071940" }
              }
            ] }
            """);

        var results = DataverseAssessmentWorkspaceClient.ParseStudentPlanScreeners(
            tosrec.RootElement,
            towre.RootElement,
            wrat.RootElement);

        Assert.Equal(5, results.Count);
        Assert.Equal(["TOSREC", "TOWRE", "TOWRE RW", "TOWRE NW", "WRAT-5"],
            results.Select(result => result.AssessmentType).ToArray());
        Assert.Equal(62, results[0].StandardScore);
        Assert.Equal("#FF0000", results[0].DescriptiveTermFill);
        Assert.Equal(67, results[2].StandardScore);
        Assert.Equal("Poor", results[2].DescriptiveTerm);
        Assert.Equal(61, results[3].StandardScore);
        Assert.Equal(66, results[4].StandardScore);
    }

    [Fact]
    public void Plan_intervention_query_is_student_and_school_year_scoped_without_hiding_withdrawn_records()
    {
        var studentId = Guid.Parse("12345678-1234-1234-1234-123456789012");
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildPlanInterventionsQuery(studentId, "2026 / 2027"));

        Assert.Contains("fvsd_studentinterventions", decoded, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_student_value eq {studentId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_schoolyear eq '2026 / 2027'", decoded, StringComparison.Ordinal);
        Assert.Contains("$expand=fvsd_interventiontype($select=fvsd_name)", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=fvsd_datestarted desc,modifiedon desc", decoded, StringComparison.Ordinal);
        Assert.DoesNotContain("statecode eq 0", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Plan_interventions_include_formatted_context_and_sort_newest_first()
    {
        using var document = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_studentinterventionid": "90000000-0000-0000-0000-000000000001",
                "fvsd_interventiontype": { "fvsd_name": "Small-group reading" },
                "fvsd_interventionist": "Interventionist One",
                "fvsd_teacheratintervention": "Teacher One",
                "fvsd_schoolatintervention": "Test School",
                "fvsd_gradeatintervention": 4,
                "fvsd_gradeatintervention@OData.Community.Display.V1.FormattedValue": "Grade 3",
                "fvsd_curriculum": "English Language Arts and Literature",
                "fvsd_datestarted": "2026-09-15T00:00:00Z",
                "fvsd_additionalinformation": "Three sessions per week."
              },
              {
                "fvsd_studentinterventionid": "90000000-0000-0000-0000-000000000002",
                "fvsd_interventiontype": { "fvsd_name": "Earlier intervention" },
                "fvsd_teacheratintervention": "Teacher Two",
                "fvsd_datestarted": "2026-09-01T00:00:00Z",
                "fvsd_datewithdrawn": "2026-10-15T00:00:00Z",
                "fvsd_withdrawnreason": 1,
                "fvsd_withdrawnreason@OData.Community.Display.V1.FormattedValue": "Completed"
              }
            ] }
            """);

        var interventions = DataverseAssessmentWorkspaceClient.ParseStudentPlanInterventions(
            document.RootElement);

        Assert.Equal(2, interventions.Count);
        Assert.Equal("Small-group reading", interventions[0].InterventionType);
        Assert.Equal("Grade 3", interventions[0].Grade);
        Assert.Equal("Interventionist One", interventions[0].Interventionist);
        Assert.Equal("Three sessions per week.", interventions[0].AdditionalInformation);
        Assert.Equal("Earlier intervention", interventions[1].InterventionType);
        Assert.Equal("Completed", interventions[1].WithdrawnReason);
        Assert.NotNull(interventions[1].DateWithdrawn);
    }

    [Fact]
    public void Homeroom_intervention_sections_are_scoped_to_student_and_school()
    {
        var studentId = Guid.Parse("12345678-1234-1234-1234-123456789012");
        var schoolId = Guid.Parse("87654321-4321-4321-4321-210987654321");
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentInterventionSectionsQuery(studentId, schoolId));

        Assert.Contains($"_fvsd_student_value eq {studentId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_school_value eq {schoolId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("$expand=fvsd_teachersection", decoded, StringComparison.Ordinal);
        Assert.Contains("$expand=fvsd_teacher($select=fvsd_name)", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Homeroom_intervention_sections_include_only_literacy_and_numeracy_curricula()
    {
        using var document = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_teachersection": {
                  "fvsd_teachersectionid": "91000000-0000-0000-0000-000000000001",
                  "fvsd_courseno": "ELA3",
                  "fvsd_coursename": "English Language Arts 3",
                  "fvsd_sectiongrouping": 1,
                  "fvsd_sectiongrouping@OData.Community.Display.V1.FormattedValue": "Literacy",
                  "fvsd_teacher": { "fvsd_name": "Teacher One" }
                }
              },
              {
                "fvsd_teachersection": {
                  "fvsd_teachersectionid": "91000000-0000-0000-0000-000000000002",
                  "fvsd_courseno": "MAT3",
                  "fvsd_coursename": "Mathematics 3",
                  "fvsd_sectiongrouping": 2,
                  "fvsd_teacher": { "fvsd_name": "Teacher Two" }
                }
              },
              {
                "fvsd_teachersection": {
                  "fvsd_teachersectionid": "91000000-0000-0000-0000-000000000003",
                  "fvsd_coursename": "Homeroom",
                  "fvsd_sectiongrouping": 3
                }
              }
            ] }
            """);

        var sections = DataverseAssessmentWorkspaceClient.ParseStudentInterventionSections(document.RootElement);

        Assert.Equal(2, sections.Count);
        Assert.Equal("English Language Arts and Literature", sections[0].Curriculum);
        Assert.Equal("Mathematics", sections[1].Curriculum);
        Assert.Equal("Teacher One", sections[0].TeacherName);
    }

    [Fact]
    public void Intervention_closure_requires_matching_date_and_reason()
    {
        var command = new StudentPlanInterventionCommand(
            Guid.NewGuid(),
            new DateOnly(2026, 9, 1),
            null,
            new DateOnly(2026, 10, 1),
            null,
            null,
            null,
            null);

        var exception = Assert.Throws<ArgumentException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateInterventionCommand(command));

        Assert.Equal("Select Completed or Incomplete when a Date Withdrawn is entered.", exception.Message);
    }

    [Fact]
    public void Intervention_closure_rejects_withdrawal_before_start()
    {
        var command = new StudentPlanInterventionCommand(
            Guid.NewGuid(),
            new DateOnly(2026, 10, 1),
            null,
            new DateOnly(2026, 9, 30),
            1,
            null,
            null,
            null);

        var exception = Assert.Throws<ArgumentException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateInterventionCommand(command));

        Assert.Equal("Date Withdrawn cannot be before Date Started.", exception.Message);
    }

    [Fact]
    public void Tosrec_reference_query_is_filtered_by_grade_and_period_and_sorted_numerically()
    {
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildTosrecReferencesQuery(4, 2));

        Assert.Contains("fvsd_tosrecreferences", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_grade eq 4", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_period eq 2", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=fvsd_rawscore asc", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Tosrec_reference_options_include_zero_and_governed_term_colours()
    {
        using var references = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_rawscore": 1,
                  "fvsd_standardscore": 75,
                  "fvsd_percentilerank": "5"
                },
                {
                  "fvsd_rawscore": 0,
                  "fvsd_standardscore": 65,
                  "fvsd_percentilerank": "1"
                }
              ]
            }
            """);
        using var terms = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_descriptivetermid": "a0000000-0000-0000-0000-000000000001",
                  "fvsd_name": "Very Poor",
                  "fvsd_rangelowvalue": 0,
                  "fvsd_rangehighvalue": 69,
                  "fvsd_fillhexcode": "ff0000",
                  "fvsd_fonthexcode": "ffffff"
                },
                {
                  "fvsd_descriptivetermid": "a0000000-0000-0000-0000-000000000002",
                  "fvsd_name": "Poor",
                  "fvsd_rangelowvalue": 70,
                  "fvsd_rangehighvalue": 79,
                  "fvsd_fillhexcode": "F47B20",
                  "fvsd_fonthexcode": "071940"
                }
              ]
            }
            """);

        var options = DataverseAssessmentWorkspaceClient.ParseTosrecReferenceOptions(
            references.RootElement,
            terms.RootElement);

        Assert.Equal([0, 1], options.Select(option => option.RawScore).ToArray());
        Assert.Equal("Very Poor", options[0].DescriptiveTerm);
        Assert.Equal("#FF0000", options[0].DescriptiveTermFill);
        Assert.Equal("#FFFFFF", options[0].DescriptiveTermFont);
        Assert.Equal("Poor", options[1].DescriptiveTerm);
    }

    [Theory]
    [InlineData("2018-07-20", "2026-07-19", "7-11")]
    [InlineData("2018-07-20", "2026-07-20", "8-0")]
    [InlineData("2018-07-20", "2027-02-10", "8-6")]
    public void Chronological_age_matches_the_existing_power_fx(
        string dateOfBirth,
        string assessmentDate,
        string expected)
    {
        Assert.Equal(
            expected,
            DataverseAssessmentWorkspaceClient.CalculateChronologicalAge(
                DateOnly.Parse(dateOfBirth),
                DateOnly.Parse(assessmentDate)));
    }

    [Theory]
    [InlineData("2026-09-01", 1)]
    [InlineData("2026-12-31", 1)]
    [InlineData("2027-01-01", 2)]
    [InlineData("2027-03-30", 2)]
    [InlineData("2027-04-01", 3)]
    [InlineData("2027-06-30", 3)]
    [InlineData("2027-03-31", null)]
    [InlineData("2027-07-01", null)]
    [InlineData("2027-08-31", null)]
    public void Assessment_period_is_derived_from_the_selected_date(string date, int? expected)
    {
        Assert.Equal(
            expected,
            DataverseAssessmentWorkspaceClient.GetAssessmentPeriod(DateOnly.Parse(date)));
    }

    [Fact]
    public void Tosrec_duplicate_query_escapes_the_record_key()
    {
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildTosrecDuplicateQuery(
                "2026|123'456|TOSREC|Fall",
                null));

        Assert.Contains("fvsd_name eq '2026|123''456|TOSREC|Fall'", decoded, StringComparison.Ordinal);
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
        Assert.True(policy.CanManageHistoricalAssessments);
        Assert.True(policy.CanDeleteAssessments);
    }

    [Theory]
    [InlineData("School Administration", true)]
    [InlineData("Data Analyst", true)]
    [InlineData("Executive", false)]
    [InlineData("Teacher", false)]
    [InlineData("Class Room Support", false)]
    public void Assessment_deletion_is_limited_to_governed_roles(string role, bool expected)
    {
        var policy = AssessmentAccessPolicy.Create(
            CreateAccessContext(role, includeAlternativeSchool: false),
            null,
            isDeveloper: false);

        Assert.Equal(expected, policy.CanDeleteAssessments);
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
