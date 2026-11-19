using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;
using Microsoft.Extensions.Caching.Memory;

namespace FVSDNexus.Api.CopilotAccess;

public sealed class CopilotAccessClient(
    HttpClient httpClient,
    ITokenAcquisition tokenAcquisition,
    IOptions<CopilotAccessOptions> options,
    IMemoryCache cache,
    TimeProvider timeProvider,
    ILogger<CopilotAccessClient> logger) : ICopilotAccessClient
{
    private readonly CopilotAccessOptions _options = options.Value;

    public async Task<CopilotAccessStatus> GetStatusAsync(
        string? signedInUserEmail,
        bool forceRefresh,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"copilot-access:{NormalizeEmail(signedInUserEmail) ?? "unknown"}";
        if (!forceRefresh && cache.TryGetValue(cacheKey, out CopilotAccessStatus? cached) && cached is not null)
        {
            return cached;
        }

        CopilotAccessStatus status;
        try
        {
            var accessToken = await tokenAcquisition.GetAccessTokenForUserAsync([_options.GraphScope]);
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                "me?$select=id,mail,userPrincipalName,assignedLicenses,assignedPlans");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using var response = await httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();
            using var payload = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(cancellationToken));
            var assignedSkuIds = ReadAssignedSkuIds(payload.RootElement);
            var enabledServicePlanIds = ReadEnabledServicePlanIds(payload.RootElement);
            var userEmail = signedInUserEmail ?? ReadUserEmail(payload.RootElement);
            status = ResolveStatus(
                assignedSkuIds,
                _options.LicensedSkuIds,
                enabledServicePlanIds,
                _options.LicensedServicePlanIds,
                userEmail,
                _options.WorkBasedBillingPolicyUserEmails,
                _options.WorkBasedBillingPolicyName,
                timeProvider.GetUtcNow());
        }
        catch (MicrosoftIdentityWebChallengeUserException exception)
        {
            // Typically AADSTS65001 (consent_required): Graph is never requested at
            // sign-in, so it must be granted tenant-wide via /api/auth/admin-consent.
            logger.LogWarning(
                exception,
                "Microsoft 365 Copilot entitlement check could not acquire a Graph token for {Scope}. MSAL error code: {ErrorCode}. user_null means the user must sign in again; consent_required means an administrator must grant consent at /api/auth/admin-consent.",
                _options.GraphScope,
                exception.MsalUiRequiredException?.ErrorCode);
            // Not cached: a fresh sign-in (e.g. user_null after an API restart clears
            // the in-memory token cache) or a new consent grant resolves this at once.
            return CreateUnconfirmedStatus(
                "Microsoft 365 Copilot licensing could not be confirmed. Sign in again to reconnect Microsoft Graph; Copilot Chat remains available.",
                timeProvider.GetUtcNow());
        }
        catch (Exception exception) when (exception is HttpRequestException or JsonException
            || (exception is TaskCanceledException && !cancellationToken.IsCancellationRequested))
        {
            logger.LogWarning(exception, "The Microsoft 365 Copilot entitlement check against Microsoft Graph failed; Copilot Chat remains available.");
            status = CreateUnconfirmedStatus(
                "Microsoft 365 Copilot licensing could not be confirmed. Copilot Chat remains available.",
                timeProvider.GetUtcNow());
        }

        var cacheMinutes = string.Equals(status.LicenseCheckStatus, "Connected", StringComparison.OrdinalIgnoreCase)
            ? Math.Max(1, _options.ConnectedCacheMinutes)
            : Math.Max(1, _options.UnconfirmedCacheMinutes);
        cache.Set(cacheKey, status, TimeSpan.FromMinutes(cacheMinutes));
        return status;
    }

    internal static CopilotAccessStatus ResolveStatus(
        IEnumerable<Guid> assignedSkuIds,
        IEnumerable<string> licensedSkuIds,
        IEnumerable<Guid> enabledServicePlanIds,
        IEnumerable<string> licensedServicePlanIds,
        string? userEmail,
        IEnumerable<string> workBasedBillingPolicyUserEmails,
        string workBasedBillingPolicyName,
        DateTimeOffset checkedAtUtc)
    {
        var licensedIds = licensedSkuIds
            .Select(value => Guid.TryParse(value, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToHashSet();
        var licensedPlanIds = licensedServicePlanIds
            .Select(value => Guid.TryParse(value, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToHashSet();
        var hasLicense = assignedSkuIds.Any(licensedIds.Contains)
            || enabledServicePlanIds.Any(licensedPlanIds.Contains);

        if (!hasLicense)
        {
            return CreateUnlicensedStatus(
                "Microsoft 365 Copilot is not assigned to your signed-in account. Copilot Chat remains available, but Work IQ actions are not licensed.",
                checkedAtUtc);
        }

        var policyUsers = workBasedBillingPolicyUserEmails
            .Select(NormalizeEmail)
            .Where(value => value is not null)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var normalizedEmail = NormalizeEmail(userEmail);
        var hasWorkBasedBillingPolicy = normalizedEmail is not null && policyUsers.Contains(normalizedEmail);

        return hasWorkBasedBillingPolicy
            ? new CopilotAccessStatus(
                "Microsoft365Copilot",
                true,
                true,
                "Available",
                "Assigned",
                "EnabledByPolicy",
                "Connected",
                "MicrosoftGraphAssignedLicensesOrPlans+ConfiguredWorkBasedBillingPolicy",
                $"Microsoft 365 Copilot and the {workBasedBillingPolicyName} Work-Based Billing policy are available for your signed-in account.",
                checkedAtUtc)
            : new CopilotAccessStatus(
                "Microsoft365Copilot",
                true,
                false,
                "WorkBasedBillingPolicyRequired",
                "NotAssigned",
                "Blocked",
                "Connected",
                "MicrosoftGraphAssignedLicensesOrPlans+ConfiguredWorkBasedBillingPolicy",
                $"Microsoft 365 Copilot is assigned, but the {workBasedBillingPolicyName} Work-Based Billing policy is not available for your signed-in account. Work IQ actions are disabled.",
                checkedAtUtc);
    }

    private static string? ReadUserEmail(JsonElement root)
    {
        foreach (var propertyName in new[] { "mail", "userPrincipalName" })
        {
            if (root.TryGetProperty(propertyName, out var value)
                && !string.IsNullOrWhiteSpace(value.GetString()))
            {
                return value.GetString();
            }
        }

        return null;
    }

    private static string? NormalizeEmail(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static HashSet<Guid> ReadAssignedSkuIds(JsonElement root)
    {
        var result = new HashSet<Guid>();
        if (!root.TryGetProperty("assignedLicenses", out var licenses) || licenses.ValueKind != JsonValueKind.Array)
        {
            return result;
        }

        foreach (var license in licenses.EnumerateArray())
        {
            if (license.TryGetProperty("skuId", out var value)
                && Guid.TryParse(value.GetString(), out var skuId))
            {
                result.Add(skuId);
            }
        }

        return result;
    }

    private static HashSet<Guid> ReadEnabledServicePlanIds(JsonElement root)
    {
        var result = new HashSet<Guid>();
        if (!root.TryGetProperty("assignedPlans", out var plans) || plans.ValueKind != JsonValueKind.Array)
        {
            return result;
        }

        foreach (var plan in plans.EnumerateArray())
        {
            if (!plan.TryGetProperty("capabilityStatus", out var status)
                || !string.Equals(status.GetString(), "Enabled", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (plan.TryGetProperty("servicePlanId", out var value)
                && Guid.TryParse(value.GetString(), out var servicePlanId))
            {
                result.Add(servicePlanId);
            }
        }

        return result;
    }

    private static CopilotAccessStatus CreateUnlicensedStatus(string message, DateTimeOffset checkedAtUtc) =>
        new(
            "CopilotChat",
            false,
            false,
            "NotLicensed",
            "NotEvaluated",
            "Blocked",
            "Connected",
            "MicrosoftGraphAssignedLicensesOrPlans",
            message,
            checkedAtUtc);

    internal static CopilotAccessStatus CreateUnconfirmedStatus(string message, DateTimeOffset checkedAtUtc) =>
        new(
            "CopilotChat",
            false,
            false,
            "UnableToConfirm",
            "NotEvaluated",
            "NotEvaluated",
            "NotConnected",
            "Fallback",
            message,
            checkedAtUtc);
}
