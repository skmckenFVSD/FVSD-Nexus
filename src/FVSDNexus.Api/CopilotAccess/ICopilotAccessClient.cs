namespace FVSDNexus.Api.CopilotAccess;

public interface ICopilotAccessClient
{
    Task<CopilotAccessStatus> GetStatusAsync(
        string? signedInUserEmail,
        bool forceRefresh,
        CancellationToken cancellationToken);
}
