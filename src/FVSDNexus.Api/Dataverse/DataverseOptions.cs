using System.ComponentModel.DataAnnotations;

namespace FVSDNexus.Api.Dataverse;

public sealed class DataverseOptions
{
    public const string SectionName = "Dataverse";

    [Required]
    public Uri EnvironmentUrl { get; init; } = new("https://fvsdef.crm3.dynamics.com/");

    [Required]
    public string Scope { get; init; } = "https://fvsdef.crm3.dynamics.com/user_impersonation";

    public Uri ApiBaseUrl => new(EnvironmentUrl, "/api/data/v9.2/");
}
