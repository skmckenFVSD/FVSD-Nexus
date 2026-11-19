using FVSDNexus.Api.CopilotAccess;

namespace FVSDNexus.Api.Tests;

public sealed class CopilotAccessClientTests
{
    private static readonly DateTimeOffset CheckedAt = new(2026, 11, 17, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("639dec6b-bb19-468b-871c-c5c441c4b0cb")]
    [InlineData("ad9c22b3-52d7-4e7e-973c-88121ea96436")]
    public void ResolveStatus_ReturnsMicrosoft365Copilot_WhenKnownSkuIsAssigned(string skuId)
    {
        var status = CopilotAccessClient.ResolveStatus(
            [Guid.Parse(skuId)],
            ["639dec6b-bb19-468b-871c-c5c441c4b0cb", "ad9c22b3-52d7-4e7e-973c-88121ea96436"],
            [],
            [],
            "scottm@fvsd.ab.ca",
            ["scottm@fvsd.ab.ca"],
            "Nexus Work IQ",
            CheckedAt);

        Assert.Equal("Microsoft365Copilot", status.Experience);
        Assert.True(status.HasMicrosoft365Copilot);
        Assert.True(status.WorkIqAvailable);
        Assert.Equal("Assigned", status.WorkBasedBillingPolicyStatus);
        Assert.Equal("Connected", status.LicenseCheckStatus);
    }

    [Fact]
    public void ResolveStatus_ReturnsMicrosoft365Copilot_WhenEnabledCopilotServicePlanIsAssigned()
    {
        var status = CopilotAccessClient.ResolveStatus(
            [Guid.NewGuid()],
            ["639dec6b-bb19-468b-871c-c5c441c4b0cb"],
            [Guid.Parse("a62f8878-de10-42f3-b68f-6149a25ceb97")],
            ["a62f8878-de10-42f3-b68f-6149a25ceb97"],
            "scottm@fvsd.ab.ca",
            ["scottm@fvsd.ab.ca"],
            "Nexus Work IQ",
            CheckedAt);

        Assert.Equal("Microsoft365Copilot", status.Experience);
        Assert.True(status.HasMicrosoft365Copilot);
        Assert.True(status.WorkIqAvailable);
        Assert.Equal("Assigned", status.WorkBasedBillingPolicyStatus);
    }

    [Fact]
    public void ResolveStatus_ReturnsCopilotChat_WhenKnownSkuIsNotAssigned()
    {
        var status = CopilotAccessClient.ResolveStatus(
            [Guid.NewGuid()],
            ["639dec6b-bb19-468b-871c-c5c441c4b0cb"],
            [Guid.NewGuid()],
            ["a62f8878-de10-42f3-b68f-6149a25ceb97"],
            "teacher@fvsd.ab.ca",
            [],
            "Nexus Work IQ",
            CheckedAt);

        Assert.Equal("CopilotChat", status.Experience);
        Assert.False(status.HasMicrosoft365Copilot);
        Assert.False(status.WorkIqAvailable);
        Assert.Equal("Connected", status.LicenseCheckStatus);
    }

    [Fact]
    public void ResolveStatus_BlocksWorkIq_WhenBillingPolicyIsNotAssigned()
    {
        var status = CopilotAccessClient.ResolveStatus(
            [Guid.Parse("639dec6b-bb19-468b-871c-c5c441c4b0cb")],
            ["639dec6b-bb19-468b-871c-c5c441c4b0cb"],
            [],
            [],
            "teacher@fvsd.ab.ca",
            [],
            "Nexus Work IQ",
            CheckedAt);

        Assert.True(status.HasMicrosoft365Copilot);
        Assert.False(status.WorkIqAvailable);
        Assert.Equal("WorkBasedBillingPolicyRequired", status.WorkIqStatus);
        Assert.Equal("NotAssigned", status.WorkBasedBillingPolicyStatus);
    }

    [Fact]
    public void CreateUnconfirmedStatus_DoesNotReportNotLicensed()
    {
        var status = CopilotAccessClient.CreateUnconfirmedStatus(
            "Microsoft 365 Copilot licensing could not be confirmed.",
            CheckedAt);

        Assert.False(status.HasMicrosoft365Copilot);
        Assert.False(status.WorkIqAvailable);
        Assert.Equal("UnableToConfirm", status.WorkIqStatus);
        Assert.Equal("NotConnected", status.LicenseCheckStatus);
        Assert.Equal("NotEvaluated", status.WorkBasedBillingPolicyStatus);
    }
}
