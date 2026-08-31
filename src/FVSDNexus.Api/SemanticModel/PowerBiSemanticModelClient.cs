using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;

namespace FVSDNexus.Api.SemanticModel;

public sealed class PowerBiSemanticModelClient(
    HttpClient httpClient,
    ITokenAcquisition tokenAcquisition,
    IOptions<FabricSemanticModelOptions> options,
    ILogger<PowerBiSemanticModelClient> logger) : IPowerBiSemanticModelClient
{
    public const string ActivitySourceName = "FVSDNexus.SemanticModel";
    private static readonly ActivitySource ActivitySource = new(ActivitySourceName);
    private const string ConnectionQuery = "EVALUATE ROW(\"ConnectionStatus\", \"Connected\")";
    private const string FilterOptionsQuery = """
        EVALUATE
        FILTER(
            UNION(
                SELECTCOLUMNS(VALUES('School'[School]), "Filter", "school", "Value", 'School'[School], "SortValue", 0),
                SELECTCOLUMNS(VALUES('Date'[School Year]), "Filter", "schoolYear", "Value", 'Date'[School Year], "SortValue", 0),
                SELECTCOLUMNS(VALUES('Type'[Assessment Group]), "Filter", "assessmentGroup", "Value", 'Type'[Assessment Group], "SortValue", 0),
                SELECTCOLUMNS(VALUES('Type'[Curriculum]), "Filter", "curriculum", "Value", 'Type'[Curriculum], "SortValue", 0),
                SELECTCOLUMNS(
                    SUMMARIZE(
                        'Assessments',
                        'Assessments'[Grade At Assessment],
                        "GradeSort", VALUE(MIN('Assessments'[Grade At Assessment Sort]))
                    ),
                    "Filter", "grade",
                    "Value", 'Assessments'[Grade At Assessment],
                    "SortValue", [GradeSort]
                ),
                SELECTCOLUMNS(
                    SUMMARIZE('Date', 'Date'[Period], "PeriodSort", MIN('Date'[Period Sorting])),
                    "Filter", "period",
                    "Value", 'Date'[Period],
                    "SortValue", [PeriodSort]
                )
            ),
            NOT ISBLANK([Value])
                && ([Filter] <> "period" || [Value] IN { "Fall", "Winter", "Spring" })
        )
        ORDER BY [Filter], [SortValue], [Value]
        """;
    private const string TermDefinitionsQuery = """
        EVALUATE
        SUMMARIZECOLUMNS(
            'Term'[Descriptive Term],
            'Term'[Descriptive Term Sort Order],
            'Term'[Term Group],
            'Term'[Term Group Sort Order],
            'Term'[Cohort Group],
            'Term'[Range],
            'Term'[Range - Low Value],
            'Term'[Range - High Value],
            'Term'[Fill Hex Code],
            'Term'[Font Hex Code],
            "TermGroupFillHexCode", [Term Group (Fill – Default)],
            "TermGroupFontHexCode", [Term Group (Font – Default)]
        )
        ORDER BY 'Term'[Descriptive Term Sort Order]
        """;
    private readonly FabricSemanticModelOptions _options = options.Value;

    public async Task<ModelConnectionStatus> CheckConnectionAsync(CancellationToken cancellationToken)
    {
        using var activity = ActivitySource.StartActivity("Fabric semantic model connection check");
        activity?.SetTag("fabric.workspace.id", _options.WorkspaceId);
        activity?.SetTag("fabric.semantic_model.id", _options.DatasetId);

        using var document = await ExecuteQueryAsync(ConnectionQuery, cancellationToken);
        var row = document.RootElement
            .GetProperty("results")[0]
            .GetProperty("tables")[0]
            .GetProperty("rows")[0];

        var status = row.TryGetProperty("[ConnectionStatus]", out var bracketedValue)
            ? bracketedValue.GetString()
            : row.GetProperty("ConnectionStatus").GetString();

        return new ModelConnectionStatus(
            status ?? "Connected",
            "Assessment Screening",
            "FVSDAnalytics",
            DateTimeOffset.UtcNow);
    }

    public async Task<SemanticFilterOptions> GetFilterOptionsAsync(
        CancellationToken cancellationToken)
    {
        using var activity = ActivitySource.StartActivity("Load semantic model filters");
        using var document = await ExecuteQueryAsync(FilterOptionsQuery, cancellationToken);
        var rows = document.RootElement
            .GetProperty("results")[0]
            .GetProperty("tables")[0]
            .GetProperty("rows");

        var options = rows.EnumerateArray()
            .Select(row => new
            {
                Filter = ReadString(row, "[Filter]"),
                Value = ReadString(row, "[Value]"),
                SortValue = ReadInt32(row, "[SortValue]")
            })
            .Where(item => item.Filter is not null && item.Value is not null)
            .GroupBy(item => item.Filter!, StringComparer.Ordinal)
            .ToDictionary(
                group => group.Key,
                group => OrderFilterOptions(
                    group.Key,
                    group.Select(item => (item.Value!, item.SortValue))),
                StringComparer.Ordinal);

        return new SemanticFilterOptions(
            GetOptions(options, "school"),
            GetOptions(options, "schoolYear"),
            GetOptions(options, "assessmentGroup"),
            GetOptions(options, "curriculum"),
            GetOptions(options, "grade"),
            GetOptions(options, "period"));
    }

    public async Task<IReadOnlyList<SchoolComparisonRow>> GetSchoolComparisonAsync(
        SchoolComparisonFilters filters,
        CancellationToken cancellationToken)
    {
        using var activity = ActivitySource.StartActivity("Load school comparison");
        using var document = await ExecuteQueryAsync(
            BuildSchoolComparisonQuery(filters),
            cancellationToken);
        var rows = document.RootElement
            .GetProperty("results")[0]
            .GetProperty("tables")[0]
            .GetProperty("rows");

        return rows.EnumerateArray()
            .Select(row => new SchoolComparisonRow(
                row.GetProperty("School[School]").GetString() ?? "Unknown school",
                ReadDecimal(row, "[MedianScore]"),
                ReadDecimal(row, "[SubmittedPercent]"),
                ReadInt32(row, "[Students]")))
            .OrderByDescending(row => row.MedianScore)
            .ToArray();
    }

    public async Task<IReadOnlyList<TermDefinition>> GetTermDefinitionsAsync(
        CancellationToken cancellationToken)
    {
        using var activity = ActivitySource.StartActivity("Load term definitions");
        using var document = await ExecuteQueryAsync(TermDefinitionsQuery, cancellationToken);
        var rows = GetRows(document);

        return rows.EnumerateArray()
            .Select(row => new TermDefinition(
                ReadString(row, "Term[Descriptive Term]") ?? "Unassigned",
                ReadSortableInt(row, "Term[Descriptive Term Sort Order]") ?? int.MaxValue,
                ReadString(row, "Term[Term Group]") ?? "Unknown",
                ReadSortableInt(row, "Term[Term Group Sort Order]") ?? int.MaxValue,
                ReadString(row, "Term[Cohort Group]") ?? ReadString(row, "Term[Term Group]") ?? "Unknown",
                ReadString(row, "Term[Range]"),
                ReadInt32(row, "Term[Range - Low Value]"),
                ReadInt32(row, "Term[Range - High Value]"),
                ReadString(row, "Term[Fill Hex Code]"),
                ReadString(row, "Term[Font Hex Code]"),
                ReadString(row, "[TermGroupFillHexCode]"),
                ReadString(row, "[TermGroupFontHexCode]")))
            .OrderBy(row => row.SortOrder)
            .ToArray();
    }

    public async Task<IReadOnlyList<ExecutiveOverviewRow>> GetExecutiveOverviewAsync(
        ExecutiveDomainDefinition domain,
        ExecutiveDashboardFilters filters,
        CancellationToken cancellationToken)
    {
        using var activity = ActivitySource.StartActivity("Load executive domain overview");
        activity?.SetTag("executive.domain", domain.Key);
        using var document = await ExecuteQueryAsync(
            BuildExecutiveOverviewQuery(domain, filters),
            cancellationToken);
        var rows = GetRows(document);

        return rows.EnumerateArray()
            .Select(row => new ExecutiveOverviewRow(
                ReadString(row, "[Instrument]") ?? "Assessment",
                ReadInt32(row, "[InstrumentSort]") ?? int.MaxValue,
                ReadString(row, "[SchoolYear]") ?? "Unknown year",
                ReadInt32(row, "[SchoolYearSort]") ?? int.MinValue,
                ReadString(row, "[Period]") ?? "Unknown period",
                ReadInt32(row, "[PeriodSort]") ?? int.MaxValue,
                ReadString(row, "[DescriptiveTerm]") ?? "Unassigned",
                ReadSortableInt(row, "[TermSort]") ?? int.MaxValue,
                ReadString(row, "[TermGroup]") ?? "Unknown",
                ReadSortableInt(row, "[TermGroupSort]") ?? int.MaxValue,
                ReadString(row, "[Range]"),
                ReadInt32(row, "[LowValue]"),
                ReadInt32(row, "[HighValue]"),
                ReadString(row, "[FillHexCode]"),
                ReadString(row, "[FontHexCode]"),
                ReadInt32(row, "[Submitted]") ?? 0,
                ReadDecimal(row, "[MedianScore]")))
            .OrderBy(row => row.InstrumentSortOrder)
            .ThenBy(row => row.SchoolYearSortOrder)
            .ThenBy(row => row.PeriodSortOrder)
            .ThenBy(row => row.TermSortOrder)
            .ToArray();
    }

    public async Task<IReadOnlyList<ExecutiveSchoolComparisonRow>> GetExecutiveSchoolComparisonAsync(
        ExecutiveInstrumentDefinition instrument,
        ExecutiveDashboardFilters filters,
        CancellationToken cancellationToken)
    {
        using var activity = ActivitySource.StartActivity("Load executive school comparison");
        activity?.SetTag("executive.assessment_group", instrument.AssessmentGroup);
        using var document = await ExecuteQueryAsync(
            BuildExecutiveSchoolComparisonQuery(instrument, filters),
            cancellationToken);
        var rows = GetRows(document);

        return rows.EnumerateArray()
            .Select(row => new ExecutiveSchoolComparisonRow(
                ReadString(row, "[School]") ?? "Unknown school",
                ReadString(row, "[SchoolYear]") ?? "Unknown year",
                ReadInt32(row, "[SchoolYearSort]") ?? int.MinValue,
                ReadString(row, "[Grade]") ?? "Unknown grade",
                ReadSortableInt(row, "[GradeSort]")
                    ?? GetFallbackGradeSort(ReadString(row, "[Grade]") ?? string.Empty),
                ReadString(row, "[Period]") ?? "Unknown period",
                ReadInt32(row, "[PeriodSort]") ?? int.MaxValue,
                ReadString(row, "[TermGroup]") ?? "Unknown",
                ReadSortableInt(row, "[TermGroupSort]") ?? int.MaxValue,
                ReadDecimal(row, "[MedianScore]")))
            .OrderBy(row => row.School, StringComparer.OrdinalIgnoreCase)
            .ThenByDescending(row => row.SchoolYearSortOrder)
            .ThenBy(row => row.GradeSortOrder)
            .ThenBy(row => row.Grade, StringComparer.OrdinalIgnoreCase)
            .ThenBy(row => row.PeriodSortOrder)
            .ThenBy(row => GetRequestedTermGroupSort(row.TermGroup))
            .ToArray();
    }

    internal static string BuildSchoolComparisonQuery(SchoolComparisonFilters filters)
    {
        var filterExpressions = new List<string>();
        AddFilter(filterExpressions, filters.Schools, "'School'[School]");
        AddFilter(filterExpressions, filters.SchoolYears, "'Date'[School Year]");
        AddFilter(filterExpressions, filters.AssessmentGroups, "'Type'[Assessment Group]");
        AddFilter(filterExpressions, filters.Curricula, "'Type'[Curriculum]");
        AddFilter(filterExpressions, filters.Grades, "'Assessments'[Grade At Assessment]");
        AddFilter(filterExpressions, filters.Periods, "'Date'[Period]");

        var optionalFilters = filterExpressions.Count == 0
            ? string.Empty
            : string.Join(",\n                ", filterExpressions) + ",\n                ";

        return $$"""
            EVALUATE
            TOPN(
                25,
                SUMMARIZECOLUMNS(
                    'School'[School],
                    {{optionalFilters}}"MedianScore", [Assessment (Median Score)],
                    "SubmittedPercent", [Submitted %],
                    "Students", [Total Students (Period)]
                ),
                [MedianScore], DESC
            )
            """;
    }

    internal static string BuildExecutiveOverviewQuery(
        ExecutiveDomainDefinition domain,
        ExecutiveDashboardFilters filters)
    {
        var instrumentQueries = domain.Instruments
            .OrderBy(instrument => instrument.SortOrder)
            .Select(instrument => BuildExecutiveOverviewInstrumentQuery(instrument, filters))
            .ToArray();

        return $$"""
            EVALUATE
            VAR OverviewData =
                UNION(
                    {{string.Join(",\n                    ", instrumentQueries)}}
                )
            RETURN
                FILTER(
                    OverviewData,
                    NOT ISBLANK([Submitted]) && [Submitted] <> 0
                )
            ORDER BY [InstrumentSort], [SchoolYearSort], [PeriodSort], [TermSort]
            """;
    }

    internal static string BuildExecutiveSchoolComparisonQuery(
        ExecutiveInstrumentDefinition instrument,
        ExecutiveDashboardFilters filters)
    {
        var filterExpressions = BuildExecutiveFilterExpressions(instrument, filters);
        AddFilter(filterExpressions, ["Below Average", "Average and Above"], "'Term'[Term Group]");

        return $$"""
            EVALUATE
            VAR MatrixData =
                SELECTCOLUMNS(
                    CALCULATETABLE(
                        SUMMARIZECOLUMNS(
                            'School'[School],
                            'Date'[School Year],
                            'Date'[SchoolYearNumber],
                            'Assessments'[Grade At Assessment],
                            'Date'[Period],
                            'Date'[Period Sorting],
                            'Term'[Term Group],
                            'Term'[Term Group Sort Order],
                            "GradeSortValue", VALUE(MIN('Assessments'[Grade At Assessment Sort])),
                            "MedianValue", [Assessment (Median Score)]
                        ),
                        {{string.Join(",\n                        ", filterExpressions)}}
                    ),
                    "School", 'School'[School],
                    "SchoolYear", 'Date'[School Year],
                    "SchoolYearSort", 'Date'[SchoolYearNumber],
                    "Grade", 'Assessments'[Grade At Assessment],
                    "GradeSort", [GradeSortValue],
                    "Period", 'Date'[Period],
                    "PeriodSort", 'Date'[Period Sorting],
                    "TermGroup", 'Term'[Term Group],
                    "TermGroupSort", 'Term'[Term Group Sort Order],
                    "MedianScore", [MedianValue]
                )
            RETURN
                FILTER(MatrixData, NOT ISBLANK([MedianScore]))
            ORDER BY [School], [SchoolYearSort] DESC, [GradeSort], [Grade], [PeriodSort], [TermGroupSort]
            """;
    }

    private static string BuildExecutiveOverviewInstrumentQuery(
        ExecutiveInstrumentDefinition instrument,
        ExecutiveDashboardFilters filters)
    {
        var filterExpressions = BuildExecutiveFilterExpressions(instrument, filters);

        return $$"""
            SELECTCOLUMNS(
                CALCULATETABLE(
                    SUMMARIZECOLUMNS(
                        'Date'[School Year],
                        'Date'[SchoolYearNumber],
                        'Date'[Period],
                        'Date'[Period Sorting],
                        'Term'[Descriptive Term],
                        'Term'[Descriptive Term Sort Order],
                        'Term'[Term Group],
                        'Term'[Term Group Sort Order],
                        'Term'[Range],
                        'Term'[Range - Low Value],
                        'Term'[Range - High Value],
                        'Term'[Fill Hex Code],
                        'Term'[Font Hex Code],
                        "SubmittedValue", [Submitted],
                        "MedianValue", CALCULATE(
                            [Assessment (Median Score)],
                            REMOVEFILTERS('Term')
                        )
                    ),
                    {{string.Join(",\n                    ", filterExpressions)}}
                ),
                "Instrument", "{{EscapeDaxString(instrument.Label)}}",
                "InstrumentSort", {{instrument.SortOrder}},
                "SchoolYear", 'Date'[School Year],
                "SchoolYearSort", 'Date'[SchoolYearNumber],
                "Period", 'Date'[Period],
                "PeriodSort", 'Date'[Period Sorting],
                "DescriptiveTerm", COALESCE('Term'[Descriptive Term], "Unassigned"),
                "TermSort", COALESCE('Term'[Descriptive Term Sort Order], "99"),
                "TermGroup", COALESCE('Term'[Term Group], "Unknown"),
                "TermGroupSort", COALESCE('Term'[Term Group Sort Order], "99"),
                "Range", 'Term'[Range],
                "LowValue", 'Term'[Range - Low Value],
                "HighValue", 'Term'[Range - High Value],
                "FillHexCode", 'Term'[Fill Hex Code],
                "FontHexCode", 'Term'[Font Hex Code],
                "Submitted", [SubmittedValue],
                "MedianScore", [MedianValue]
            )
            """;
    }

    private static List<string> BuildExecutiveFilterExpressions(
        ExecutiveInstrumentDefinition instrument,
        ExecutiveDashboardFilters filters)
    {
        var filterExpressions = new List<string>();
        AddFilter(filterExpressions, filters.Schools, "'School'[School]");
        AddFilter(filterExpressions, filters.SchoolYears, "'Date'[School Year]");
        AddFilter(
            filterExpressions,
            filters.Periods.Count > 0 ? filters.Periods : ["Fall", "Winter", "Spring"],
            "'Date'[Period]");
        AddFilter(filterExpressions, [instrument.Curriculum], "'Type'[Curriculum]");
        AddFilter(filterExpressions, [instrument.AssessmentGroup], "'Type'[Assessment Group]");

        var grades = filters.Grades.Count == 0
            ? instrument.Grades
            : instrument.Grades
                .Intersect(filters.Grades, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        AddFilter(
            filterExpressions,
            grades.Count > 0 ? grades : ["__no_applicable_grade__"],
            "'Assessments'[Grade At Assessment]");

        return filterExpressions;
    }

    private static JsonElement GetRows(JsonDocument document) => document.RootElement
        .GetProperty("results")[0]
        .GetProperty("tables")[0]
        .GetProperty("rows");

    private async Task<JsonDocument> ExecuteQueryAsync(
        string dax,
        CancellationToken cancellationToken)
    {
        var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.Scope]);

        var endpoint = new Uri(
            _options.ApiBaseUrl,
            $"groups/{_options.WorkspaceId}/datasets/{_options.DatasetId}/executeQueries");

        var body = JsonSerializer.Serialize(new
        {
            queries = new[] { new { query = dax } },
            serializerSettings = new { includeNulls = true }
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Fabric query failed with HTTP {StatusCode}. Correlation ID: {CorrelationId}",
                (int)response.StatusCode,
                response.Headers.TryGetValues("RequestId", out var requestIds)
                    ? requestIds.FirstOrDefault()
                    : "not supplied");

            throw new HttpRequestException(
                $"The Fabric semantic model query failed with HTTP {(int)response.StatusCode}.",
                null,
                response.StatusCode);
        }

        return JsonDocument.Parse(responseBody);
    }

    private static decimal? ReadDecimal(JsonElement row, string propertyName) =>
        row.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.Number
            ? value.GetDecimal()
            : null;

    private static int? ReadInt32(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out var value)
            || value.ValueKind != JsonValueKind.Number)
        {
            return null;
        }

        if (value.TryGetInt32(out var integerValue))
        {
            return integerValue;
        }

        return value.TryGetDecimal(out var decimalValue)
            && decimalValue == decimal.Truncate(decimalValue)
            && decimalValue is >= int.MinValue and <= int.MaxValue
                ? decimal.ToInt32(decimalValue)
                : null;
    }

    private static int? ReadSortableInt(JsonElement row, string propertyName)
    {
        var numericValue = ReadInt32(row, propertyName);
        if (numericValue.HasValue)
        {
            return numericValue;
        }

        return int.TryParse(ReadString(row, propertyName), out var textValue)
            ? textValue
            : null;
    }

    private static string? ReadString(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out var value) || value.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        return value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : value.ToString();
    }

    private static IReadOnlyList<string> GetOptions(
        IReadOnlyDictionary<string, IReadOnlyList<string>> options,
        string key) => options.TryGetValue(key, out var values) ? values : [];

    internal static IReadOnlyList<string> OrderFilterOptions(string filter, IEnumerable<string> values)
        => OrderFilterOptions(filter, values.Select(value => (value, (int?)null)));

    internal static IReadOnlyList<string> OrderFilterOptions(
        string filter,
        IEnumerable<(string Value, int? SortValue)> values)
    {
        var distinctValues = values
            .Where(item => !string.IsNullOrWhiteSpace(item.Value))
            .GroupBy(item => item.Value, StringComparer.OrdinalIgnoreCase)
            .Select(group => new
            {
                Value = group.Key,
                SortValue = group.Where(item => item.SortValue.HasValue)
                    .Select(item => item.SortValue)
                    .FirstOrDefault()
            })
            .ToArray();

        if (string.Equals(filter, "period", StringComparison.Ordinal))
        {
            return distinctValues
                .Where(item => GetFallbackPeriodSort(item.Value) < int.MaxValue)
                .OrderBy(item => item.SortValue ?? GetFallbackPeriodSort(item.Value))
                .ThenBy(item => item.Value, StringComparer.OrdinalIgnoreCase)
                .Select(item => item.Value)
                .ToArray();
        }

        if (string.Equals(filter, "grade", StringComparison.Ordinal))
        {
            return distinctValues
                .Where(item => GetFallbackGradeSort(item.Value) < int.MaxValue)
                .OrderBy(item => item.SortValue ?? GetFallbackGradeSort(item.Value))
                .ThenBy(item => item.Value, StringComparer.OrdinalIgnoreCase)
                .Select(item => item.Value)
                .ToArray();
        }

        return string.Equals(filter, "schoolYear", StringComparison.Ordinal)
            ? distinctValues.Select(item => item.Value).OrderByDescending(value => value, StringComparer.OrdinalIgnoreCase).ToArray()
            : distinctValues.Select(item => item.Value).OrderBy(value => value, StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static int GetFallbackPeriodSort(string period) => period switch
    {
        "Fall" => 1,
        "Winter" => 2,
        "Spring" => 3,
        _ => int.MaxValue
    };

    private static int GetFallbackGradeSort(string grade)
    {
        if (string.Equals(grade, "Kindergarten", StringComparison.OrdinalIgnoreCase))
        {
            return 0;
        }

        const string prefix = "Grade ";
        if (grade.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            && int.TryParse(grade[prefix.Length..], out var gradeNumber)
            && gradeNumber is >= 1 and <= 12)
        {
            return gradeNumber;
        }

        return int.MaxValue;
    }

    private static int GetRequestedTermGroupSort(string termGroup) => termGroup switch
    {
        "Below Average" => 1,
        "Average and Above" => 2,
        _ => int.MaxValue
    };

    private static string EscapeDaxString(string value) => value.Replace("\"", "\"\"");

    private static void AddFilter(
        List<string> expressions,
        IReadOnlyList<string>? values,
        string column)
    {
        if (values is null || values.Count == 0)
        {
            return;
        }

        if (values.Count > 100)
        {
            throw new ArgumentException("Too many semantic-model filter values were selected.");
        }

        var normalizedValues = values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.Ordinal)
            .Select(value =>
            {
                if (value.Length > 150 || value.Any(char.IsControl))
                {
                    throw new ArgumentException("A semantic-model filter value is invalid.");
                }

                return $"\"{value.Replace("\"", "\"\"")}\"";
            })
            .ToArray();

        if (normalizedValues.Length > 0)
        {
            expressions.Add($"TREATAS({{ {string.Join(", ", normalizedValues)} }}, {column})");
        }
    }
}
