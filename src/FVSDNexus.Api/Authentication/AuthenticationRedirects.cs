namespace FVSDNexus.Api.Authentication;

internal static class AuthenticationRedirects
{
    public static string Resolve(string? frontendBaseUrl, string? requestedReturnUrl)
    {
        var fallback = string.IsNullOrWhiteSpace(frontendBaseUrl)
            ? "/"
            : frontendBaseUrl;

        if (!IsLocalReturnUrl(requestedReturnUrl))
        {
            return fallback;
        }

        if (Uri.TryCreate(fallback, UriKind.Absolute, out var frontendBaseUri)
            && (frontendBaseUri.Scheme == Uri.UriSchemeHttp
                || frontendBaseUri.Scheme == Uri.UriSchemeHttps))
        {
            return new Uri(frontendBaseUri, requestedReturnUrl).AbsoluteUri;
        }

        return requestedReturnUrl!;
    }

    private static bool IsLocalReturnUrl(string? returnUrl) =>
        !string.IsNullOrWhiteSpace(returnUrl)
        && returnUrl.StartsWith("/", StringComparison.Ordinal)
        && !returnUrl.StartsWith("//", StringComparison.Ordinal)
        && !returnUrl.Contains('\\');
}
