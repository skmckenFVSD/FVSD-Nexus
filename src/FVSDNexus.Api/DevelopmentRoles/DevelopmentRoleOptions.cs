using System.ComponentModel.DataAnnotations;

namespace FVSDNexus.Api.DevelopmentRoles;

public sealed class DevelopmentRoleOptions
{
    public const string SectionName = "DevelopmentRoles";

    [Required]
    public string[] DeveloperObjectIds { get; init; } = [];

    [Required]
    public string DefaultRole { get; init; } = DevelopmentRoleNames.Executive;
}
