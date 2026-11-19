namespace FVSDNexus.Api.CopilotAccess;

public sealed record CopilotAccessStatus(
    string Experience,
    bool HasMicrosoft365Copilot,
    bool WorkIqAvailable,
    string WorkIqStatus,
    string WorkBasedBillingPolicyStatus,
    string WorkBasedBillingStatus,
    string LicenseCheckStatus,
    string Source,
    string Message,
    DateTimeOffset CheckedAtUtc);
