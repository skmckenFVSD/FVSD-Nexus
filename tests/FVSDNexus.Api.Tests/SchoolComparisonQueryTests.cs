using FVSDNexus.Api.SemanticModel;

namespace FVSDNexus.Api.Tests;

public sealed class SchoolComparisonQueryTests
{
    [Fact]
    public void Query_uses_controlled_treatas_filters_and_model_measures()
    {
        var filters = new SchoolComparisonFilters(
            ["High Level Public School"],
            ["2025-2026", "2024-2025"],
            ["PNSA"],
            ["Literacy"],
            ["Grade 3"],
            ["Spring", "Fall"]);

        var query = PowerBiSemanticModelClient.BuildSchoolComparisonQuery(filters);

        Assert.Contains("TREATAS({ \"High Level Public School\" }, 'School'[School])", query);
        Assert.Contains("TREATAS({ \"2025-2026\", \"2024-2025\" }, 'Date'[School Year])", query);
        Assert.Contains("TREATAS({ \"Spring\", \"Fall\" }, 'Date'[Period])", query);
        Assert.Contains("[Assessment (Median Score)]", query);
        Assert.Contains("[Submitted %]", query);
        Assert.Contains("[Total Students (Period)]", query);
    }

    [Fact]
    public void Query_escapes_quotes_inside_filter_values()
    {
        var filters = new SchoolComparisonFilters(
            ["A \"quoted\" school"],
            [],
            [],
            [],
            [],
            []);

        var query = PowerBiSemanticModelClient.BuildSchoolComparisonQuery(filters);

        Assert.Contains("A \"\"quoted\"\" school", query);
        Assert.DoesNotContain("A \"quoted\" school", query);
    }

    [Fact]
    public void Query_rejects_control_characters()
    {
        var filters = new SchoolComparisonFilters(
            ["School\nEVALUATE ROW(\"Injected\", 1)"],
            [],
            [],
            [],
            [],
            []);

        Assert.Throws<ArgumentException>(() =>
            PowerBiSemanticModelClient.BuildSchoolComparisonQuery(filters));
    }

    [Fact]
    public void Filter_options_sort_school_years_descending_and_schools_ascending()
    {
        var years = PowerBiSemanticModelClient.OrderFilterOptions(
            "schoolYear",
            ["2023-2024", "2025-2026", "2024-2025"]);
        var schools = PowerBiSemanticModelClient.OrderFilterOptions(
            "school",
            ["Riverside", "Fort Vermilion", "Blue Hills"]);

        Assert.Equal(["2025-2026", "2024-2025", "2023-2024"], years);
        Assert.Equal(["Blue Hills", "Fort Vermilion", "Riverside"], schools);
    }

    [Fact]
    public void Period_options_use_model_sort_and_exclude_summer()
    {
        var periods = PowerBiSemanticModelClient.OrderFilterOptions(
            "period",
            [
                ("Spring", 3),
                ("Summer", 4),
                ("Fall", 1),
                ("Winter", 2)
            ]);

        Assert.Equal(["Fall", "Winter", "Spring"], periods);
    }

    [Fact]
    public void Period_options_use_business_fallback_order_without_sort_values()
    {
        var periods = PowerBiSemanticModelClient.OrderFilterOptions(
            "period",
            ["Spring", "Summer", "Winter", "Fall"]);

        Assert.Equal(["Fall", "Winter", "Spring"], periods);
    }

    [Fact]
    public void Grade_options_use_model_sort_from_kindergarten_through_grade_twelve()
    {
        var grades = PowerBiSemanticModelClient.OrderFilterOptions(
            "grade",
            [
                ("Grade 12", 12),
                ("Grade 2", 2),
                ("Kindergarten", 0),
                ("Grade 1", 1),
                ("Post-secondary", 13)
            ]);

        Assert.Equal(["Kindergarten", "Grade 1", "Grade 2", "Grade 12"], grades);
    }

    [Fact]
    public void Grade_options_use_numeric_label_fallback_without_sort_values()
    {
        var grades = PowerBiSemanticModelClient.OrderFilterOptions(
            "grade",
            ["Grade 10", "Grade 2", "Kindergarten", "Grade 1", "Unknown"]);

        Assert.Equal(["Kindergarten", "Grade 1", "Grade 2", "Grade 10"], grades);
    }

    [Fact]
    public void Query_rejects_more_than_one_hundred_values()
    {
        var filters = new SchoolComparisonFilters(
            Enumerable.Range(1, 101).Select(index => $"School {index}").ToArray(),
            [],
            [],
            [],
            [],
            []);

        Assert.Throws<ArgumentException>(() =>
            PowerBiSemanticModelClient.BuildSchoolComparisonQuery(filters));
    }

    [Fact]
    public void Executive_overview_uses_governed_literacy_instruments_and_term_context()
    {
        Assert.True(ExecutiveDashboardDomains.TryGet("literacy", out var domain));
        var filters = new ExecutiveDashboardFilters(
            ["Fort Vermilion Public School"],
            ["2025 / 2026"],
            [],
            ["Fall", "Spring"]);

        var query = PowerBiSemanticModelClient.BuildExecutiveOverviewQuery(domain, filters);

        Assert.Contains("TREATAS({ \"TOSREC\" }, 'Type'[Assessment Group])", query);
        Assert.Contains("TREATAS({ \"TOWRE\" }, 'Type'[Assessment Group])", query);
        Assert.Contains("TREATAS({ \"CTOPP\" }, 'Type'[Assessment Group])", query);
        Assert.DoesNotContain("TOSWRF", query);
        Assert.Contains("TREATAS({ \"Kindergarten\" }, 'Assessments'[Grade At Assessment])", query);
        Assert.Contains("REMOVEFILTERS('Term')", query);
        Assert.Contains("[Submitted]", query);
        Assert.Contains("[Assessment (Median Score)]", query);
        Assert.Contains("'Date'[School Year]", query);
        Assert.Contains("'Date'[SchoolYearNumber]", query);
        Assert.Contains("ORDER BY [InstrumentSort], [SchoolYearSort], [PeriodSort], [TermSort]", query);
    }

    [Fact]
    public void Executive_overview_intersects_user_grade_with_instrument_grade_rules()
    {
        Assert.True(ExecutiveDashboardDomains.TryGet("literacy", out var domain));
        var filters = new ExecutiveDashboardFilters([], [], ["Grade 4"], []);

        var query = PowerBiSemanticModelClient.BuildExecutiveOverviewQuery(domain, filters);

        Assert.Contains("TREATAS({ \"Grade 4\" }, 'Assessments'[Grade At Assessment])", query);
        Assert.Contains("TREATAS({ \"__no_applicable_grade__\" }, 'Assessments'[Grade At Assessment])", query);
        Assert.DoesNotContain("TOSWRF", query);
    }

    [Fact]
    public void Executive_matrix_uses_one_assessment_group_and_grade_specific_six_column_context()
    {
        Assert.True(ExecutiveDashboardDomains.TryGet("numeracy", out var domain));
        Assert.True(ExecutiveDashboardDomains.TryGetInstrument(domain, "WRAT-5", out var instrument));
        var filters = new ExecutiveDashboardFilters([], ["2025 / 2026", "2024 / 2025"], [], []);

        var query = PowerBiSemanticModelClient.BuildExecutiveSchoolComparisonQuery(instrument, filters);

        Assert.Contains("TREATAS({ \"WRAT-5\" }, 'Type'[Assessment Group])", query);
        Assert.DoesNotContain("TREATAS({ \"PNSA\" }, 'Type'[Assessment Group])", query);
        Assert.Contains("TREATAS({ \"Fall\", \"Winter\", \"Spring\" }, 'Date'[Period])", query);
        Assert.Contains("TREATAS({ \"Below Average\", \"Average and Above\" }, 'Term'[Term Group])", query);
        Assert.Contains("'Date'[School Year]", query);
        Assert.Contains("'Date'[SchoolYearNumber]", query);
        Assert.Contains("'Assessments'[Grade At Assessment]", query);
        Assert.Contains("VALUE(MIN('Assessments'[Grade At Assessment Sort]))", query);
        Assert.Contains("\"Grade\", 'Assessments'[Grade At Assessment]", query);
        Assert.Contains("ORDER BY [School], [SchoolYearSort] DESC, [GradeSort], [Grade], [PeriodSort], [TermGroupSort]", query);
        Assert.Contains("[Assessment (Median Score)]", query);
        Assert.DoesNotContain("[Submitted %]", query);
    }

    [Fact]
    public void Executive_domain_configuration_enforces_confirmed_grade_mappings()
    {
        Assert.True(ExecutiveDashboardDomains.TryGet("literacy", out var literacy));
        Assert.True(ExecutiveDashboardDomains.TryGet("numeracy", out var numeracy));

        Assert.Equal(["TOSREC", "TOWRE", "CTOPP"], literacy.Instruments.Select(item => item.AssessmentGroup));
        Assert.Equal(["Kindergarten"], literacy.Instruments.Single(item => item.AssessmentGroup == "CTOPP").Grades);
        Assert.Equal(["PNSA", "WRAT-5"], numeracy.Instruments.Select(item => item.AssessmentGroup));
        Assert.Equal("Kindergarten", numeracy.Instruments.Single(item => item.AssessmentGroup == "PNSA").Grades[0]);
        Assert.Equal("Grade 6", numeracy.Instruments.Single(item => item.AssessmentGroup == "PNSA").Grades[^1]);
        Assert.DoesNotContain("Kindergarten", numeracy.Instruments.Single(item => item.AssessmentGroup == "WRAT-5").Grades);
    }
}
