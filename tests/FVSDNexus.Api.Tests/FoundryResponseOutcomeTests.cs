using System.Text.Json;
using FVSDNexus.Api.FoundryCopilot;

namespace FVSDNexus.Api.Tests;

public sealed class FoundryResponseOutcomeTests
{
    private static FoundryResponseOutcome Read(string json)
    {
        using var document = JsonDocument.Parse(json);
        return FoundryCopilotClient.ReadOutcome(document.RootElement);
    }

    [Fact]
    public void TextOnlyResponse_IsNotCompletedEvidence()
    {
        // The observed failure: the agent narrated progress but made no tool call.
        var outcome = Read("""
            {"status":"completed","output":[{"type":"message","content":[{"type":"output_text","text":"I'm checking the task endpoint..."}]}]}
            """);

        Assert.Empty(outcome.ToolCalls);
        Assert.False(outcome.HasCompletedToolEvidence);
    }

    [Fact]
    public void SuccessfulToolCall_IsCompletedEvidence()
    {
        var outcome = Read("""
            {"status":"completed","output":[
              {"type":"mcp_call","name":"createTodoTask","status":"completed","error":null},
              {"type":"message","content":[{"type":"output_text","text":"Task created."}]}]}
            """);

        Assert.Equal(["mcp_call:createTodoTask"], outcome.ToolCalls);
        Assert.True(outcome.HasCompletedToolEvidence);
    }

    [Fact]
    public void FailedToolCall_IsNotCompletedEvidence()
    {
        var outcome = Read("""
            {"status":"completed","output":[{"type":"mcp_call","name":"createTodoTask","error":"Forbidden"}]}
            """);

        Assert.Equal(1, outcome.FailedToolCalls);
        Assert.False(outcome.HasCompletedToolEvidence);
    }

    [Theory]
    [InlineData("""{"type":"mcp_approval_request","name":"createTodoTask"}""")]
    [InlineData("""{"type":"function_call","name":"createTodoTask"}""")]
    public void PendingCallerAction_IsNotCompletedEvidence(string pendingItem)
    {
        var outcome = Read($$"""
            {"status":"completed","output":[{"type":"mcp_call","name":"listTasks","status":"completed"},{{pendingItem}}]}
            """);

        Assert.NotEmpty(outcome.PendingActions);
        Assert.False(outcome.HasCompletedToolEvidence);
    }

    [Fact]
    public void IncompleteResponse_IsNotCompletedEvidence()
    {
        var outcome = Read("""
            {"status":"incomplete","output":[{"type":"mcp_call","name":"createTodoTask","status":"completed"}]}
            """);

        Assert.False(outcome.HasCompletedToolEvidence);
    }
}
