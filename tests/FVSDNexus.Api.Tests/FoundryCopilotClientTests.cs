using System.Net;
using System.Text;
using Azure.Core;
using FVSDNexus.Api.FoundryCopilot;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace FVSDNexus.Api.Tests;

public sealed class FoundryCopilotClientTests
{
    [Fact]
    public async Task SendAsync_CreatesConversationAndReturnsAssistantText()
    {
        var handler = new RecordingHandler(
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"id\":\"conv_test123\"}", Encoding.UTF8, "application/json")
            },
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"id\":\"resp_test123\",\"output\":[{\"content\":[{\"type\":\"output_text\",\"text\":\"The current completion rate is 87%.\"}]}]}",
                    Encoding.UTF8,
                    "application/json")
            });
        var endpoint = new Uri(
            "https://example.services.ai.azure.com/api/projects/nexus/agents/nexus-assistant/endpoint/protocols/openai/responses?api-version=v1");
        var client = new FoundryCopilotClient(
            new HttpClient(handler),
            new StaticTokenCredential(),
            Options.Create(new FoundryCopilotOptions
            {
                Enabled = true,
                AgentEndpoint = endpoint,
                Scope = "https://ai.azure.com/.default"
            }),
            NullLogger<FoundryCopilotClient>.Instance);

        var reply = await client.SendAsync(
            new FoundryCopilotPrompt(
                "Summarize completion.",
                null,
                "Executive",
                "staff@fvsd.ab.ca",
                "Division view",
                null,
                "TOSREC",
                "Fall",
                100,
                87,
                13,
                87,
                [new FoundryCopilotAccountabilityContext("Teacher One", 25, 23, 2, 92)],
                [new FoundryCopilotMissingStudentContext("Student One", "123456789", "Grade 5")],
                0,
                0),
            CancellationToken.None);

        Assert.Equal("The current completion rate is 87%.", reply.Message);
        Assert.Equal("conv_test123", reply.ConversationId);
        Assert.Equal("resp_test123", reply.ResponseId);
        Assert.Equal(2, handler.Requests.Count);
        Assert.EndsWith(
            "/conversations?api-version=v1",
            handler.Requests[0].Uri.PathAndQuery,
            StringComparison.Ordinal);
        Assert.EndsWith(
            "/responses?api-version=v1",
            handler.Requests[1].Uri.PathAndQuery,
            StringComparison.Ordinal);
        Assert.Equal("Bearer", handler.Requests[0].AuthorizationScheme);
        Assert.Equal("test-token", handler.Requests[1].AuthorizationParameter);
        Assert.Contains("\"conversation\":\"conv_test123\"", handler.Requests[1].Body);
        Assert.Contains("Completion rate: 87%", handler.Requests[1].Body);
        Assert.Contains("Teacher One", handler.Requests[1].Body);
        Assert.Contains("Student One", handler.Requests[1].Body);
        Assert.Contains("123456789", handler.Requests[1].Body);
        Assert.Contains("User question", handler.Requests[1].Body);
        Assert.Contains("respond positively and briefly", handler.Requests[1].Body);
        Assert.Contains("Do not lead with a limitation", handler.Requests[1].Body);
        Assert.Contains("Never claim the action was completed", handler.Requests[1].Body);
    }

    private sealed class StaticTokenCredential : TokenCredential
    {
        public override AccessToken GetToken(
            TokenRequestContext requestContext,
            CancellationToken cancellationToken) =>
            new("test-token", DateTimeOffset.UtcNow.AddMinutes(5));

        public override ValueTask<AccessToken> GetTokenAsync(
            TokenRequestContext requestContext,
            CancellationToken cancellationToken) =>
            ValueTask.FromResult(GetToken(requestContext, cancellationToken));
    }

    private sealed class RecordingHandler(params HttpResponseMessage[] responses) : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _responses = new(responses);

        public List<RecordedRequest> Requests { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Requests.Add(new RecordedRequest(
                request.RequestUri!,
                request.Headers.Authorization?.Scheme,
                request.Headers.Authorization?.Parameter,
                request.Content is null
                    ? string.Empty
                    : await request.Content.ReadAsStringAsync(cancellationToken)));
            return _responses.Dequeue();
        }
    }

    private sealed record RecordedRequest(
        Uri Uri,
        string? AuthorizationScheme,
        string? AuthorizationParameter,
        string Body);
}
