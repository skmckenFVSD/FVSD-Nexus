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
    public void Plan_signature_query_is_scoped_to_the_master_plan_and_keeps_all_statuses()
    {
        var planId = Guid.Parse("92000000-0000-0000-0000-000000000001");
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlanSignaturesQuery(planId));

        Assert.Contains("fvsd_studentippsignatures", decoded, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_studentipp_value eq {planId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_allowcomments", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=fvsd_signatoryorder asc,fvsd_signatoryaddedorder asc", decoded, StringComparison.Ordinal);
        Assert.DoesNotContain("statecode eq 0", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Plan_signatures_include_routing_status_comments_and_immutable_added_order()
    {
        using var document = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_studentippsignatureid": "92000000-0000-0000-0000-000000000002",
                "fvsd_name": "2026|314486069|BHCS|IPP|SIG|02",
                "fvsd_recipienttype": 1,
                "fvsd_recipienttype@OData.Community.Display.V1.FormattedValue": "Needs to Sign",
                "fvsd_signatoryrole": 2,
                "fvsd_signatoryrole@OData.Community.Display.V1.FormattedValue": "Principal",
                "fvsd_signatoryname": "Principal One",
                "fvsd_signatoryemail": "principal.one@example.ca",
                "fvsd_signatoryorder": 1,
                "fvsd_signatoryaddedorder": 2,
                "fvsd_allowcomments": true,
                "statecode": 0,
                "statecode@OData.Community.Display.V1.FormattedValue": "Active",
                "statuscode": 1,
                "statuscode@OData.Community.Display.V1.FormattedValue": "Assigned",
                "@odata.etag": "W/\"12345\""
              },
              {
                "fvsd_studentippsignatureid": "92000000-0000-0000-0000-000000000001",
                "fvsd_signatoryrole": 1,
                "fvsd_signatoryrole@OData.Community.Display.V1.FormattedValue": "Parent / Guardian",
                "fvsd_signatoryname": "Guardian One",
                "fvsd_signatoryemail": "guardian.one@example.ca",
                "fvsd_signatoryorder": 2,
                "fvsd_signatoryaddedorder": 1,
                "fvsd_allowcomments": false,
                "statecode": 1,
                "statuscode": 2,
                "statuscode@OData.Community.Display.V1.FormattedValue": "Signed",
                "fvsd_datesigned": "2026-11-10"
              }
            ] }
            """);

        var signatures = DataverseAssessmentWorkspaceClient.ParseStudentPlanSignatures(document.RootElement);

        Assert.Equal(2, signatures.Count);
        Assert.Equal("Principal One", signatures[0].SignatoryName);
        Assert.Equal(2, signatures[0].SignatoryAddedOrder);
        Assert.True(signatures[0].AllowComments);
        Assert.Equal("Assigned", signatures[0].StatusLabel);
        Assert.Equal("W/\"12345\"", signatures[0].ETag);
        Assert.Equal("Guardian One", signatures[1].SignatoryName);
        Assert.False(signatures[1].AllowComments);
        Assert.Equal("2026-11-10", signatures[1].DateSigned);
    }

    [Fact]
    public void Signature_choice_metadata_is_parsed_in_value_order()
    {
        using var document = JsonDocument.Parse("""
            {
              "GlobalOptionSet": {
                "Options": [
                  { "Value": 4, "Label": { "UserLocalizedLabel": { "Label": "Specialist" } } },
                  { "Value": 1, "Label": { "UserLocalizedLabel": { "Label": "Parent / Guardian" } } }
                ]
              }
            }
            """);

        var options = DataverseAssessmentWorkspaceClient.ParseStudentPlanSignatureChoices(document.RootElement);

        Assert.Equal([1, 4], options.Select(option => option.Value).ToArray());
        Assert.Equal(["Parent / Guardian", "Specialist"], options.Select(option => option.Label).ToArray());
    }

    [Fact]
    public void Signature_reorder_requires_every_current_assigned_record_with_its_etag()
    {
        var first = CreateSignature(Guid.Parse("93000000-0000-0000-0000-000000000001"), 1, "W/\"1\"");
        var second = CreateSignature(Guid.Parse("93000000-0000-0000-0000-000000000002"), 2, "W/\"2\"");
        var command = new StudentPlanSignatureOrderCommand([
            new(second.Id, second.ETag),
            new(first.Id, first.ETag)
        ]);

        DataverseAssessmentWorkspaceClient.ValidateStudentPlanSignatureOrder([first, second], command);

        var missingRecord = new StudentPlanSignatureOrderCommand([new(first.Id, first.ETag)]);
        Assert.Throws<ArgumentException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateStudentPlanSignatureOrder([first, second], missingRecord));

        var stale = new StudentPlanSignatureOrderCommand([
            new(second.Id, "W/\"stale\""),
            new(first.Id, first.ETag)
        ]);
        Assert.Throws<AssessmentWorkspaceConflictException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateStudentPlanSignatureOrder([first, second], stale));
    }

    [Fact]
    public void Signature_reorder_is_blocked_after_the_signature_process_starts()
    {
        var assigned = CreateSignature(Guid.Parse("93000000-0000-0000-0000-000000000001"), 1, "W/\"1\"");
        var waiting = CreateSignature(Guid.Parse("93000000-0000-0000-0000-000000000002"), 2, "W/\"2\"") with
        {
            StatusCode = 102370001,
            StatusLabel = "Waiting Signature"
        };
        var command = new StudentPlanSignatureOrderCommand([
            new(assigned.Id, assigned.ETag),
            new(waiting.Id, waiting.ETag)
        ]);

        Assert.Throws<ArgumentException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateStudentPlanSignatureOrder([assigned, waiting], command));
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

    [Fact]
    public void Oral_reading_fluency_query_is_scoped_to_plan_and_orf_section()
    {
        var planId = Guid.Parse("94000000-0000-0000-0000-000000000001");
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlanOralReadingFluencyQuery(planId));

        Assert.Contains("fvsd_studentipplevels", decoded, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_studentipp_value eq {planId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_section/fvsd_name eq 'Oral Reading Fluency (ORF)'", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=fvsd_currentdateachieved desc,createdon desc", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Oral_reading_fluency_results_keep_zero_and_sort_newest_first()
    {
        using var document = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_studentipplevelid": "94000000-0000-0000-0000-000000000001",
                "fvsd_currentdateachieved": "2026-09-15T00:00:00Z",
                "fvsd_levelofreading": 3,
                "fvsd_levelofreading@OData.Community.Display.V1.FormattedValue": "Grade 3",
                "fvsd_wordsperminute": 0,
                "@odata.etag": "W/\"1\""
              },
              {
                "fvsd_studentipplevelid": "94000000-0000-0000-0000-000000000002",
                "fvsd_currentdateachieved": "2026-11-12T00:00:00Z",
                "fvsd_levelofreading": 4,
                "fvsd_levelofreading@OData.Community.Display.V1.FormattedValue": "Grade 4",
                "fvsd_wordsperminute": 30,
                "@odata.etag": "W/\"2\""
              }
            ] }
            """);

        var results = DataverseAssessmentWorkspaceClient.ParseStudentPlanOralReadingFluency(
            document.RootElement);

        Assert.Equal(2, results.Count);
        Assert.Equal(30, results[0].WordsPerMinute);
        Assert.Equal("Grade 4", results[0].LevelOfReadingLabel);
        Assert.Equal(0, results[1].WordsPerMinute);
        Assert.Equal("W/\"1\"", results[1].ETag);
    }

    [Fact]
    public void Oral_reading_fluency_local_choices_are_parsed_in_value_order()
    {
        using var document = JsonDocument.Parse("""
            {
              "OptionSet": {
                "Options": [
                  { "Value": 6, "Label": { "UserLocalizedLabel": { "Label": "Grade 6" } } },
                  { "Value": 1, "Label": { "UserLocalizedLabel": { "Label": "Grade 1" } } }
                ]
              }
            }
            """);

        var options = DataverseAssessmentWorkspaceClient.ParseStudentPlanOralReadingFluencyOptions(
            document.RootElement);

        Assert.Equal([1, 6], options.Select(option => option.Value).ToArray());
        Assert.Equal(["Grade 1", "Grade 6"], options.Select(option => option.Label).ToArray());
    }

    [Fact]
    public void Oral_reading_fluency_prevents_a_second_result_on_the_same_date()
    {
        var existing = new StudentPlanOralReadingFluencyResult(
            Guid.Parse("94000000-0000-0000-0000-000000000001"),
            "2026|314486069|BHCS|IPP|ORF|11122026",
            new DateTimeOffset(2026, 11, 12, 0, 0, 0, TimeSpan.Zero),
            5,
            "Grade 5",
            30,
            "W/\"1\"");

        var exception = Assert.Throws<AssessmentWorkspaceConflictException>(() =>
            DataverseAssessmentWorkspaceClient.EnsureOralReadingFluencyDateAvailable(
                [existing],
                new DateOnly(2026, 11, 12),
                null));

        Assert.Contains("already exists", exception.Message, StringComparison.OrdinalIgnoreCase);
        DataverseAssessmentWorkspaceClient.EnsureOralReadingFluencyDateAvailable(
            [existing],
            new DateOnly(2026, 11, 12),
            existing.Id);
    }

    [Fact]
    public void Oral_reading_fluency_name_is_recalculated_from_plan_and_submitted_date()
    {
        var name = DataverseAssessmentWorkspaceClient.BuildStudentPlanOralReadingFluencyName(
            "2026|314486069|BHCS|IPP",
            new DateOnly(2026, 9, 15));

        Assert.Equal("2026|314486069|BHCS|IPP|ORF|09152026", name);
    }

    [Fact]
    public void Word_study_query_is_scoped_to_plan_and_word_study_section()
    {
        var planId = Guid.Parse("95000000-0000-0000-0000-000000000001");
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlanWordStudyQuery(planId));

        Assert.Contains("fvsd_studentipplevels", decoded, StringComparison.Ordinal);
        Assert.Contains($"_fvsd_studentipp_value eq {planId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_section/fvsd_name eq 'Word Study'", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_wtwstartinglevel", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=fvsd_initialdateachieved desc,createdon desc", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Word_study_records_include_stage_metadata_and_sort_newest_first()
    {
        using var document = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_studentipplevelid": "95000000-0000-0000-0000-000000000001",
                "fvsd_name": "Plan|WS|09132026",
                "fvsd_initialdateachieved": "2026-09-13T00:00:00Z",
                "_fvsd_wtwstartinglevel_value": "95000000-0000-0000-0000-000000000011",
                "fvsd_wtwstartinglevel": {
                  "fvsd_name": "Concept of word in text",
                  "fvsd_section": 1,
                  "fvsd_section@OData.Community.Display.V1.FormattedValue": "Emergent",
                  "fvsd_div": 1,
                  "fvsd_div@OData.Community.Display.V1.FormattedValue": "Pre-Kindergarten to Grade 1"
                },
                "@odata.etag": "W/\"1\""
              },
              {
                "fvsd_studentipplevelid": "95000000-0000-0000-0000-000000000002",
                "fvsd_name": "Plan|WS|11122026",
                "fvsd_initialdateachieved": "2026-11-12T00:00:00Z",
                "fvsd_currentdateachieved": "2027-01-20T00:00:00Z",
                "_fvsd_wtwstartinglevel_value": "95000000-0000-0000-0000-000000000012",
                "_fvsd_wtwfinishinglevel_value": "95000000-0000-0000-0000-000000000013",
                "fvsd_wtwstartinglevel": { "fvsd_name": "Initial consonants" },
                "fvsd_wtwfinishinglevel": {
                  "fvsd_name": "Preconsonantal nasals",
                  "fvsd_section": 2,
                  "fvsd_section@OData.Community.Display.V1.FormattedValue": "Letter Name - Alphabetic",
                  "fvsd_div": 2,
                  "fvsd_div@OData.Community.Display.V1.FormattedValue": "Kindergarten to Grade 2"
                },
                "@odata.etag": "W/\"2\""
              }
            ] }
            """);

        var records = DataverseAssessmentWorkspaceClient.ParseStudentPlanWordStudy(document.RootElement);

        Assert.Equal(2, records.Count);
        Assert.Equal("Plan|WS|11122026", records[0].Name);
        Assert.Equal("Preconsonantal nasals", records[0].FinishingLevelName);
        Assert.Equal("Letter Name - Alphabetic", records[0].FinishingStageReference);
        Assert.Equal("Kindergarten to Grade 2", records[0].FinishingExpectedGrade);
        Assert.Equal("Emergent", records[1].StartingStageReference);
        Assert.Equal("W/\"1\"", records[1].ETag);
    }

    [Fact]
    public void Word_study_stages_use_emergent_prefix_and_formatted_choice_values()
    {
        using var document = JsonDocument.Parse("""
            { "value": [
              {
                "fvsd_wordstheirwaystageid": "95000000-0000-0000-0000-000000000011",
                "fvsd_name": "Concept of word in text",
                "fvsd_section": 1,
                "fvsd_section@OData.Community.Display.V1.FormattedValue": "Emergent",
                "fvsd_div": 1,
                "fvsd_div@OData.Community.Display.V1.FormattedValue": "Pre-Kindergarten to Grade 1",
                "fvsd_sortorder": 2
              },
              {
                "fvsd_wordstheirwaystageid": "95000000-0000-0000-0000-000000000012",
                "fvsd_name": "Preconsonantal nasals",
                "fvsd_section": 2,
                "fvsd_section@OData.Community.Display.V1.FormattedValue": "Letter Name - Alphabetic",
                "fvsd_sortorder": 8
              }
            ] }
            """);

        var stages = DataverseAssessmentWorkspaceClient.ParseWordStudyStages(document.RootElement);

        Assert.Equal("E2. Concept of word in text (Emergent)", stages[0].Display);
        Assert.Equal("Pre-Kindergarten to Grade 1", stages[0].ExpectedGrade);
        Assert.Equal("8. Preconsonantal nasals (Letter Name - Alphabetic)", stages[1].Display);
    }

    [Fact]
    public void Word_study_requires_ending_date_and_level_as_a_pair()
    {
        var stageId = Guid.Parse("95000000-0000-0000-0000-000000000011");
        var options = new StudentPlanWordStudyOptionsResponse([
            new StudentPlanWordStudyStageOption(stageId, "Concept of word", "Emergent", "Grade 1", 1, "E1. Concept of word (Emergent)")
        ]);

        var exception = Assert.Throws<ArgumentException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateStudentPlanWordStudyCommand(
                new StudentPlanWordStudyCommand(
                    new DateOnly(2026, 9, 13), stageId, new DateOnly(2026, 11, 12), null),
                options));

        Assert.Contains("both the Term Ending Date and WTW Ending Level", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Word_study_name_is_recalculated_from_plan_and_start_date()
    {
        var name = DataverseAssessmentWorkspaceClient.BuildStudentPlanWordStudyName(
            "2026|314486069|BHCS|IPP",
            new DateOnly(2026, 9, 13));

        Assert.Equal("2026|314486069|BHCS|IPP|WS|09132026", name);
    }

    [Fact]
    public void Writing_snapshot_query_is_scoped_to_plan_and_subject()
    {
        var planId = Guid.Parse("96000000-0000-0000-0000-000000000001");
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlanWritingSnapshotsQuery(planId));

        Assert.Contains("fvsd_ippactivities", decoded, StringComparison.Ordinal);
        Assert.Contains($"_regardingobjectid_value eq {planId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("subject eq 'Writing Snapshot'", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=createdon desc", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Ipp_activity_section_navigation_property_is_resolved_from_relationship_metadata()
    {
        using var document = JsonDocument.Parse("""
            {
              "LogicalName": "fvsd_ippactivity",
              "ManyToOneRelationships": [
                {
                  "ReferencingAttribute": "fvsd_section",
                  "ReferencedEntity": "fvsd_ippsection",
                  "ReferencingEntityNavigationPropertyName": "fvsd_IPPActivity_Section_fvsd_ippsection"
                }
              ]
            }
            """);

        var navigationProperty =
            DataverseAssessmentWorkspaceClient.ParseIppActivitySectionNavigationProperty(
                document.RootElement);

        Assert.Equal("fvsd_IPPActivity_Section_fvsd_ippsection", navigationProperty);
    }

    [Fact]
    public void Writing_snapshot_records_keep_export_and_attachment_metadata()
    {
        using var document = JsonDocument.Parse("""
            { "value": [
              {
                "activityid": "96000000-0000-0000-0000-000000000001",
                "subject": "Writing Snapshot",
                "description": "<p>Earlier evidence</p>",
                "actualstart": "2026-09-13T12:00:00Z",
                "fvsd_includeinexport": false,
                "createdon": "2026-09-13T16:00:00Z",
                "createdby": { "fullname": "Teacher One" },
                "@odata.etag": "W/\"1\""
              },
              {
                "activityid": "96000000-0000-0000-0000-000000000002",
                "subject": "Writing Snapshot",
                "description": "Current evidence",
                "actualstart": "2026-11-12T12:00:00Z",
                "fvsd_includeinexport": true,
                "fvsd_writingsamplefile": "96000000-0000-0000-0000-000000000010",
                "fvsd_writingsamplefile_name": "writing-sample.pdf",
                "fvsd_writingsampleimage": "base64-thumbnail",
                "createdon": "2026-11-12T16:00:00Z",
                "createdby": { "fullname": "Teacher Two" },
                "@odata.etag": "W/\"2\""
              }
            ] }
            """);

        var snapshots = DataverseAssessmentWorkspaceClient.ParseStudentPlanWritingSnapshots(
            document.RootElement);

        Assert.Equal(2, snapshots.Count);
        Assert.Equal("Teacher Two", snapshots[0].AddedBy);
        Assert.True(snapshots[0].IncludeInExport);
        Assert.True(snapshots[0].HasWritingSampleFile);
        Assert.True(snapshots[0].HasWritingSampleImage);
        Assert.Equal("writing-sample.pdf", snapshots[0].WritingSampleFileName);
        Assert.False(snapshots[1].IncludeInExport);
        Assert.Equal("<p>Earlier evidence</p>", snapshots[1].Description);
    }

    [Fact]
    public void Writing_snapshot_payload_sets_subject_and_matching_activity_dates()
    {
        var payload = DataverseAssessmentWorkspaceClient.BuildStudentPlanWritingSnapshotPayload(
            new StudentPlanWritingSnapshotCommand(
                new DateOnly(2026, 11, 12), "  Evidence of development  ", true));

        Assert.Equal("Writing Snapshot", payload["subject"]);
        Assert.Equal("Evidence of development", payload["description"]);
        Assert.Equal("2026-11-12T12:00:00Z", payload["actualstart"]);
        Assert.Equal(payload["actualstart"], payload["actualend"]);
        Assert.Equal(true, payload["fvsd_includeinexport"]);
    }

    [Fact]
    public void Writing_snapshot_accepts_only_one_sample_upload_type()
    {
        var file = new StudentPlanWritingSnapshotUpload(
            "sample.pdf", "application/pdf", [1, 2, 3]);
        var image = new StudentPlanWritingSnapshotUpload(
            "sample.jpg", "image/jpeg", [4, 5, 6]);

        var exception = Assert.Throws<ArgumentException>(() =>
            DataverseAssessmentWorkspaceClient.ValidateStudentPlanWritingSnapshotCommand(
                new StudentPlanWritingSnapshotCommand(
                    new DateOnly(2026, 11, 12), "Evidence", true),
                file,
                image));

        Assert.Contains("either a Writing Sample File or a Writing Sample Image", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Teacher_comment_query_is_scoped_to_plan_and_subject()
    {
        var planId = Guid.Parse("97000000-0000-0000-0000-000000000001");
        var decoded = Uri.UnescapeDataString(
            DataverseAssessmentWorkspaceClient.BuildStudentPlanTeacherCommentsQuery(planId));

        Assert.Contains("fvsd_ippactivities", decoded, StringComparison.Ordinal);
        Assert.Contains($"_regardingobjectid_value eq {planId:D}", decoded, StringComparison.Ordinal);
        Assert.Contains("subject eq 'Teacher Comment and Next Steps'", decoded, StringComparison.Ordinal);
        Assert.Contains("activityadditionalparams", decoded, StringComparison.Ordinal);
        Assert.Contains("$orderby=createdon desc", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Teacher_comment_records_include_section_and_additional_observations()
    {
        using var document = JsonDocument.Parse("""
            { "value": [
              {
                "activityid": "97000000-0000-0000-0000-000000000001",
                "_fvsd_section_value": "97000000-0000-0000-0000-000000000011",
                "_fvsd_section_value@OData.Community.Display.V1.FormattedValue": "Empower Reading",
                "description": "Comments and next steps",
                "activityadditionalparams": "Additional observations",
                "actualstart": "2026-11-12T12:00:00Z",
                "fvsd_includeinexport": true,
                "createdon": "2026-11-12T16:00:00Z",
                "createdby": { "fullname": "Scott McKenzie" },
                "@odata.etag": "W/\"7\""
              }
            ] }
            """);

        var comments = DataverseAssessmentWorkspaceClient.ParseStudentPlanTeacherComments(
            document.RootElement);

        var comment = Assert.Single(comments);
        Assert.Equal("Empower Reading", comment.SectionName);
        Assert.Equal("Comments and next steps", comment.CommentsAndNextSteps);
        Assert.Equal("Additional observations", comment.AdditionalObservations);
        Assert.Equal("Scott McKenzie", comment.AddedBy);
        Assert.True(comment.IncludeInExport);
    }

    [Fact]
    public void Teacher_comment_payload_sets_matching_activity_dates_and_additional_parameters()
    {
        var payload = DataverseAssessmentWorkspaceClient.BuildStudentPlanTeacherCommentPayload(
            new StudentPlanTeacherCommentCommand(
                Guid.Parse("97000000-0000-0000-0000-000000000011"),
                new DateOnly(2026, 11, 12),
                " Next steps ",
                " Additional observations ",
                true));

        Assert.Equal("Teacher Comment and Next Steps", payload["subject"]);
        Assert.Equal("Next steps", payload["description"]);
        Assert.Equal("Additional observations", payload["activityadditionalparams"]);
        Assert.Equal("2026-11-12T12:00:00Z", payload["actualstart"]);
        Assert.Equal(payload["actualstart"], payload["actualend"]);
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

    private static StudentPlanSignature CreateSignature(Guid id, int order, string eTag) => new(
        id,
        $"Signature {order}",
        1,
        "Needs to Sign",
        order,
        order == 1 ? "Parent / Guardian" : "Principal",
        $"Signatory {order}",
        $"signatory{order}@example.ca",
        order,
        order,
        true,
        null,
        null,
        0,
        "Active",
        1,
        "Assigned",
        eTag);
}
