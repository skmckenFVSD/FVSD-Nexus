using System.Collections.Concurrent;
using FVSDNexus.Api.FoundryCopilot;

namespace FVSDNexus.Api.WorkIq;

public sealed record WorkIqHandoffProposal(
    Guid Id,
    string UserEmail,
    FoundryCopilotPrompt Prompt,
    string Title,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset ExpiresAtUtc);

public interface IWorkIqHandoffStore
{
    WorkIqHandoffProposal Create(string userEmail, FoundryCopilotPrompt prompt, string title);

    bool TryGet(Guid id, string userEmail, out WorkIqHandoffProposal? proposal);

    bool TryTake(Guid id, string userEmail, out WorkIqHandoffProposal? proposal);
}

public sealed class WorkIqHandoffStore(TimeProvider timeProvider) : IWorkIqHandoffStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    private readonly ConcurrentDictionary<Guid, WorkIqHandoffProposal> _proposals = new();

    public WorkIqHandoffProposal Create(string userEmail, FoundryCopilotPrompt prompt, string title)
    {
        var now = timeProvider.GetUtcNow();
        var proposal = new WorkIqHandoffProposal(
            Guid.NewGuid(),
            NormalizeEmail(userEmail),
            prompt with { ConversationId = null, AllowWorkIqExecution = false },
            string.IsNullOrWhiteSpace(title) ? "Work IQ action" : title.Trim()[..Math.Min(title.Trim().Length, 160)],
            now,
            now.Add(Lifetime));
        _proposals[proposal.Id] = proposal;
        RemoveExpired(now);
        return proposal;
    }

    public bool TryGet(Guid id, string userEmail, out WorkIqHandoffProposal? proposal)
    {
        proposal = null;
        if (!_proposals.TryGetValue(id, out var stored))
        {
            return false;
        }

        if (stored.ExpiresAtUtc <= timeProvider.GetUtcNow())
        {
            _proposals.TryRemove(id, out _);
            return false;
        }

        if (!string.Equals(stored.UserEmail, NormalizeEmail(userEmail), StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        proposal = stored;
        return true;
    }

    public bool TryTake(Guid id, string userEmail, out WorkIqHandoffProposal? proposal)
    {
        proposal = null;
        if (!TryGet(id, userEmail, out var stored) || stored is null)
        {
            return false;
        }

        if (!_proposals.TryRemove(id, out var removed))
        {
            return false;
        }

        proposal = removed;
        return true;
    }

    private void RemoveExpired(DateTimeOffset now)
    {
        foreach (var item in _proposals)
        {
            if (item.Value.ExpiresAtUtc <= now)
            {
                _proposals.TryRemove(item.Key, out _);
            }
        }
    }

    private static string NormalizeEmail(string value) => value.Trim().ToLowerInvariant();
}
