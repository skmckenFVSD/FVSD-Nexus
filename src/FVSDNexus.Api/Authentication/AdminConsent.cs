namespace FVSDNexus.Api.Authentication;

// Builds the Microsoft Entra v2 admin-consent request. Sign-in can only request
// Dataverse (one downstream resource per authorization-code request), so Graph
// and Foundry delegated scopes are granted tenant-wide by an administrator here
// and then acquired silently at runtime.
internal static class AdminConsent
{
    public const string CallbackPath = "/api/auth/admin-consent/callback";
    public const string StateCookieName = "fvsd-nexus-admin-consent";

    public static Uri BuildConsentUri(
        string instance,
        string tenantId,
        string clientId,
        Uri redirectUri,
        IEnumerable<string> scopes,
        string state)
    {
        var scopeValue = string.Join(' ', scopes
            .Select(scope => scope?.Trim())
            .Where(scope => !string.IsNullOrWhiteSpace(scope))
            .Distinct(StringComparer.OrdinalIgnoreCase));
        if (string.IsNullOrWhiteSpace(scopeValue))
        {
            throw new ArgumentException("At least one admin-consent scope is required.", nameof(scopes));
        }

        var authority = instance.TrimEnd('/');
        var query = string.Join('&',
            $"client_id={Uri.EscapeDataString(clientId)}",
            $"scope={Uri.EscapeDataString(scopeValue)}",
            $"redirect_uri={Uri.EscapeDataString(redirectUri.AbsoluteUri)}",
            $"state={Uri.EscapeDataString(state)}");
        return new Uri($"{authority}/{Uri.EscapeDataString(tenantId)}/v2.0/adminconsent?{query}");
    }

    public static Uri ResolveRedirectUri(string? frontendBaseUrl, HttpRequest request)
    {
        // The registered redirect URI must match the browser-facing origin. Locally
        // that is the Vite dev server, which proxies /api to the API.
        var baseUri = Uri.TryCreate(frontendBaseUrl, UriKind.Absolute, out var configured)
            && (configured.Scheme == Uri.UriSchemeHttp || configured.Scheme == Uri.UriSchemeHttps)
                ? configured
                : new Uri($"{request.Scheme}://{request.Host}{request.PathBase}/");
        return new Uri(baseUri, CallbackPath);
    }
}
