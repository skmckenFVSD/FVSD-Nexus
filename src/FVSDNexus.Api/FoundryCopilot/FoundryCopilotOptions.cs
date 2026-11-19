using System.ComponentModel.DataAnnotations;

namespace FVSDNexus.Api.FoundryCopilot;

public sealed class FoundryCopilotOptions
{
    public const string SectionName = "FoundryCopilot";

    public bool Enabled { get; init; } = true;

    [Required]
    public Uri AgentEndpoint { get; init; } = new(
        "https://fabriciq-resource.services.ai.azure.com/api/projects/fabriciq/agents/nexus-assistant/endpoint/protocols/openai/responses?api-version=v1");

    [Required]
    public string Scope { get; init; } = "https://ai.azure.com/.default";

    // Explicit delegated permission an administrator grants tenant-wide so the
    // confirmed Work IQ action can acquire Scope silently (".default" cannot be
    // combined with other scopes in an admin-consent request).
    [Required]
    public string DelegatedConsentScope { get; init; } = "https://ai.azure.com/user_impersonation";

    [Range(5, 180)]
    public int RequestTimeoutSeconds { get; init; } = 90;
}
