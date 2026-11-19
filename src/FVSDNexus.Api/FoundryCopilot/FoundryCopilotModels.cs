namespace FVSDNexus.Api.FoundryCopilot;

public sealed record FoundryCopilotChatRequest(
    string Prompt,
    string? ConversationId,
    string Scope,
    string? School,
    string AssessmentType,
    string Period,
    int Eligible,
    int Completed,
    int Missing,
    int CompletionRate,
    Guid? SchoolId,
    string? SectionGroup,
    string? CourseNumber,
    Guid? TeacherId,
    int AssessmentPeriod,
    bool ObfuscateStudentData);

public sealed record FoundryCopilotAccountabilityContext(
    string Label,
    int Expected,
    int Completed,
    int Missing,
    int CompletionRate);

public sealed record FoundryCopilotMissingStudentContext(
    string Name,
    string? Asn,
    string? Grade);

public sealed record FoundryCopilotPrompt(
    string Prompt,
    string? ConversationId,
    string Role,
    string? UserEmail,
    string ScopeLabel,
    string? School,
    string AssessmentType,
    string Period,
    int Eligible,
    int Completed,
    int Missing,
    int CompletionRate,
    IReadOnlyList<FoundryCopilotAccountabilityContext> Accountability,
    IReadOnlyList<FoundryCopilotMissingStudentContext> MissingStudents,
    int OmittedAccountabilityRows,
    int OmittedMissingStudents,
    bool AllowWorkIqExecution = false);

public sealed record FoundryCopilotReply(
    string Message,
    string ConversationId,
    string? ResponseId,
    Guid? HandoffId = null,
    string? HandoffStatus = null,
    string? HandoffTitle = null,
    string? HandoffMessage = null,
    DateTimeOffset? HandoffExpiresAtUtc = null,
    FoundryResponseOutcome? Outcome = null);

// What the agent actually did, read from the Responses API payload rather than its
// prose: the response status and every tool-call item it emitted.
public sealed record FoundryResponseOutcome(
    string? Status,
    IReadOnlyList<string> ToolCalls,
    int FailedToolCalls,
    IReadOnlyList<string> PendingActions)
{
    // A confirmed Work IQ action counts as completed only with tool evidence: the
    // response finished, at least one tool call succeeded, and nothing awaits the
    // client (approvals or function calls are never fulfilled by Nexus).
    public bool HasCompletedToolEvidence =>
        string.Equals(Status, "completed", StringComparison.OrdinalIgnoreCase)
        && ToolCalls.Count > FailedToolCalls
        && PendingActions.Count == 0;
}

public interface IFoundryCopilotClient
{
    Task<FoundryCopilotReply> SendAsync(
        FoundryCopilotPrompt prompt,
        CancellationToken cancellationToken);

    Task<FoundryCopilotReply> SendDelegatedAsync(
        FoundryCopilotPrompt prompt,
        string accessToken,
        CancellationToken cancellationToken);
}
