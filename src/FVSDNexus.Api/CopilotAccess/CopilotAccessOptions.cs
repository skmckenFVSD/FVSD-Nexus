using System.ComponentModel.DataAnnotations;

namespace FVSDNexus.Api.CopilotAccess;

public sealed class CopilotAccessOptions
{
    public const string SectionName = "CopilotAccess";

    // The entitlement check reads only the signed-in user's own /me profile
    // (assignedLicenses, assignedPlans), so User.Read is sufficient.
    [Required]
    public string GraphScope { get; init; } = "https://graph.microsoft.com/User.Read";

    public int ConnectedCacheMinutes { get; init; } = 480;

    public int UnconfirmedCacheMinutes { get; init; } = 5;

    [Required]
    public Uri ApiBaseUrl { get; init; } = new("https://graph.microsoft.com/v1.0/");

    public string[] LicensedSkuIds { get; init; } =
    [
        "639dec6b-bb19-468b-871c-c5c441c4b0cb",
        "ad9c22b3-52d7-4e7e-973c-88121ea96436"
    ];

    // Microsoft 365 Copilot is sold through multiple parent SKUs. These service
    // plans provide a stable secondary entitlement signal without requiring the
    // directory roles needed by Graph's licenseDetails endpoint.
    public string[] LicensedServicePlanIds { get; init; } =
    [
        "a62f8878-de10-42f3-b68f-6149a25ceb97", // M365_COPILOT_APPS
        "3f30311c-6b1e-48a4-ab79-725b469da960", // M365_COPILOT_BUSINESS_CHAT
        "b95945de-b3bd-46db-8437-f2beb6ea2347", // M365_COPILOT_TEAMS
        "0aedf20c-091d-420b-aadf-30c042609612", // M365_COPILOT_SHAREPOINT
        "931e4a88-a67f-48b5-814f-16a5f1e6028d"  // M365_COPILOT_INTELLIGENT_SEARCH
    ];

    public string WorkBasedBillingPolicyName { get; init; } = "Nexus Work IQ";

    // Fail closed until a governed Work-Based Billing policy source/API is connected.
    // The development configuration may explicitly allow local test users.
    public string[] WorkBasedBillingPolicyUserEmails { get; init; } = [];
}
