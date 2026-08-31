using System.ComponentModel.DataAnnotations;

namespace FVSDNexus.Api.SemanticModel;

public sealed class FabricSemanticModelOptions
{
    public const string SectionName = "FabricSemanticModel";

    [Required]
    public string WorkspaceId { get; init; } = string.Empty;

    [Required]
    public string DatasetId { get; init; } = string.Empty;

    [Required]
    public string Scope { get; init; } = "https://analysis.windows.net/powerbi/api/Dataset.Read.All";

    [Required]
    public Uri ApiBaseUrl { get; init; } = new("https://api.powerbi.com/v1.0/myorg/");
}
