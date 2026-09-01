using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;

namespace FVSDNexus.Api.Dataverse;

public sealed class DataverseAccessContextClient(
    HttpClient httpClient,
    ITokenAcquisition tokenAcquisition,
    IOptions<DataverseOptions> options,
    ILogger<DataverseAccessContextClient> logger) : IDataverseAccessContextClient
{
    public const string ActivitySourceName = "FVSDNexus.Dataverse";
    private static readonly ActivitySource ActivitySource = new(ActivitySourceName);
    private const string FormattedValueSuffix = "@OData.Community.Display.V1.FormattedValue";
    private const string UserRoleSelect =
        "fvsd_userroleid,fvsd_powerappssignin,fvsd_role,fvsd_assessmentteam," +
        "fvsd_pocenabled,fvsd_continuumadministrator,_fvsd_assignmentone_value," +
        "_fvsd_assignmenttwo_value,_fvsd_systemuser_value";
    private readonly DataverseOptions _options = options.Value;

    public async Task<DataverseAccessContext> GetAccessContextAsync(
        string email,
        Guid? entraObjectId,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        using var activity = ActivitySource.StartActivity("Load Dataverse access context");

        var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.Scope]);
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            new Uri(_options.ApiBaseUrl, BuildUserRoleQuery(normalizedEmail)));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.TryAddWithoutValidation("OData-MaxVersion", "4.0");
        request.Headers.TryAddWithoutValidation("OData-Version", "4.0");
        request.Headers.TryAddWithoutValidation(
            "Prefer",
            "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\"");

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var correlationId = response.Headers.TryGetValues("x-ms-service-request-id", out var values)
                ? values.FirstOrDefault()
                : null;
            logger.LogWarning(
                "Dataverse access-context query failed with HTTP {StatusCode}. Correlation ID: {CorrelationId}",
                response.StatusCode,
                correlationId);
            throw new HttpRequestException(
                $"The Dataverse access-context query failed with HTTP {(int)response.StatusCode}.",
                null,
                response.StatusCode);
        }

        await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(responseStream, cancellationToken: cancellationToken);
        return ParseAccessContext(document.RootElement, normalizedEmail, entraObjectId);
    }

    internal static string BuildUserRoleQuery(string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        var escapedEmail = normalizedEmail.Replace("'", "''", StringComparison.Ordinal);
        var filter = Uri.EscapeDataString(
            $"statecode eq 0 and fvsd_powerappssignin eq '{escapedEmail}'");

        return $"fvsd_userroles?$select={UserRoleSelect}&$filter={filter}&$top=2";
    }

    internal static DataverseAccessContext ParseAccessContext(
        JsonElement root,
        string email,
        Guid? entraObjectId)
    {
        var normalizedEmail = NormalizeEmail(email);
        var rows = root.GetProperty("value");
        if (rows.GetArrayLength() > 1)
        {
            throw new InvalidOperationException(
                "More than one active Dataverse User Role record exists for the signed-in identity.");
        }

        if (rows.GetArrayLength() == 0)
        {
            return new DataverseAccessContext(
                false,
                null,
                null,
                normalizedEmail,
                entraObjectId,
                "No Access",
                "No Access",
                false,
                false,
                false,
                null,
                null);
        }

        var row = rows[0];
        var assessmentTeam = ReadBoolean(row, "fvsd_assessmentteam");
        var storedRole = ReadFormattedString(row, "fvsd_role")
            ?? ReadRoleFallback(row)
            ?? "No Access";
        var effectiveRole = assessmentTeam ? "Assessment Team" : storedRole;

        return new DataverseAccessContext(
            true,
            ReadGuid(row, "fvsd_userroleid"),
            ReadGuid(row, "_fvsd_systemuser_value"),
            normalizedEmail,
            entraObjectId,
            storedRole,
            effectiveRole,
            assessmentTeam,
            ReadBoolean(row, "fvsd_pocenabled"),
            ReadBoolean(row, "fvsd_continuumadministrator"),
            ReadSchool(row, "_fvsd_assignmentone_value"),
            ReadSchool(row, "_fvsd_assignmenttwo_value"));
    }

    private static string NormalizeEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("A signed-in email address is required.", nameof(email));
        }

        return email.Trim().ToLowerInvariant();
    }

    private static DataverseSchoolAssignment? ReadSchool(JsonElement row, string lookupName)
    {
        var id = ReadGuid(row, lookupName);
        if (id is null)
        {
            return null;
        }

        var name = ReadString(row, $"{lookupName}{FormattedValueSuffix}") ?? id.Value.ToString();
        return new DataverseSchoolAssignment(id.Value, name);
    }

    private static string? ReadFormattedString(JsonElement row, string propertyName) =>
        ReadString(row, $"{propertyName}{FormattedValueSuffix}");

    private static string? ReadRoleFallback(JsonElement row)
    {
        if (!row.TryGetProperty("fvsd_role", out var property)
            || property.ValueKind != JsonValueKind.Number
            || !property.TryGetInt32(out var value))
        {
            return null;
        }

        return value switch
        {
            1 => "Executive",
            2 => "Administrator",
            3 => "Teacher",
            4 => "Student Support",
            5 => "No Access",
            6 => "Assessment Team",
            _ => null
        };
    }

    private static string? ReadString(JsonElement row, string propertyName) =>
        row.TryGetProperty(propertyName, out var property)
        && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;

    private static Guid? ReadGuid(JsonElement row, string propertyName) =>
        Guid.TryParse(ReadString(row, propertyName), out var value) ? value : null;

    private static bool ReadBoolean(JsonElement row, string propertyName) =>
        row.TryGetProperty(propertyName, out var property)
        && property.ValueKind is JsonValueKind.True or JsonValueKind.False
        && property.GetBoolean();
}
