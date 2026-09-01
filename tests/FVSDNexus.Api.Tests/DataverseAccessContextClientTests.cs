using System.Text.Json;
using FVSDNexus.Api.Dataverse;

namespace FVSDNexus.Api.Tests;

public sealed class DataverseAccessContextClientTests
{
    private static readonly Guid EntraObjectId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public void User_role_query_normalizes_and_escapes_the_signed_in_email()
    {
        var query = DataverseAccessContextClient.BuildUserRoleQuery("  O'User@FVSD.ab.ca ");
        var decoded = Uri.UnescapeDataString(query);

        Assert.Contains("statecode eq 0", decoded, StringComparison.Ordinal);
        Assert.Contains("fvsd_powerappssignin eq 'o''user@fvsd.ab.ca'", decoded, StringComparison.Ordinal);
        Assert.EndsWith("&$top=2", decoded, StringComparison.Ordinal);
    }

    [Fact]
    public void Assessment_team_flag_overrides_the_stored_role()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_userroleid": "22222222-2222-2222-2222-222222222222",
                  "_fvsd_systemuser_value": "33333333-3333-3333-3333-333333333333",
                  "fvsd_role": 3,
                  "fvsd_role@OData.Community.Display.V1.FormattedValue": "Teacher",
                  "fvsd_assessmentteam": true,
                  "fvsd_pocenabled": true,
                  "fvsd_continuumadministrator": false,
                  "_fvsd_assignmentone_value": "44444444-4444-4444-4444-444444444444",
                  "_fvsd_assignmentone_value@OData.Community.Display.V1.FormattedValue": "Test School"
                }
              ]
            }
            """);

        var result = DataverseAccessContextClient.ParseAccessContext(
            document.RootElement,
            "Test.User@FVSD.ab.ca",
            EntraObjectId);

        Assert.True(result.RoleRecordFound);
        Assert.Equal("test.user@fvsd.ab.ca", result.Email);
        Assert.Equal("Teacher", result.StoredRole);
        Assert.Equal("Assessment Team", result.EffectiveRole);
        Assert.True(result.AssessmentTeam);
        Assert.True(result.PocEnabled);
        Assert.False(result.ContinuumAdministrator);
        Assert.Equal("Test School", result.PrimarySchool?.Name);
        Assert.Equal(result.PrimarySchool, result.DefaultSchool);
        Assert.Null(result.AlternativeSchool);
    }

    [Fact]
    public void Two_school_assignments_do_not_force_a_default_school()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                {
                  "fvsd_userroleid": "22222222-2222-2222-2222-222222222222",
                  "fvsd_role": 2,
                  "fvsd_role@OData.Community.Display.V1.FormattedValue": "Administrator",
                  "fvsd_assessmentteam": false,
                  "fvsd_pocenabled": true,
                  "fvsd_continuumadministrator": true,
                  "_fvsd_assignmentone_value": "44444444-4444-4444-4444-444444444444",
                  "_fvsd_assignmentone_value@OData.Community.Display.V1.FormattedValue": "Primary School",
                  "_fvsd_assignmenttwo_value": "55555555-5555-5555-5555-555555555555",
                  "_fvsd_assignmenttwo_value@OData.Community.Display.V1.FormattedValue": "Alternative School"
                }
              ]
            }
            """);

        var result = DataverseAccessContextClient.ParseAccessContext(
            document.RootElement,
            "administrator@fvsd.ab.ca",
            EntraObjectId);

        Assert.Equal("Administrator", result.EffectiveRole);
        Assert.True(result.ContinuumAdministrator);
        Assert.NotNull(result.PrimarySchool);
        Assert.NotNull(result.AlternativeSchool);
        Assert.Null(result.DefaultSchool);
    }

    [Fact]
    public void Missing_role_record_returns_explicit_no_access_context()
    {
        using var document = JsonDocument.Parse("""{ "value": [] }""");

        var result = DataverseAccessContextClient.ParseAccessContext(
            document.RootElement,
            "missing@fvsd.ab.ca",
            EntraObjectId);

        Assert.False(result.RoleRecordFound);
        Assert.Equal("No Access", result.StoredRole);
        Assert.Equal("No Access", result.EffectiveRole);
        Assert.False(result.PocEnabled);
        Assert.Null(result.DefaultSchool);
    }

    [Fact]
    public void Duplicate_active_role_records_are_rejected()
    {
        using var document = JsonDocument.Parse("""
            {
              "value": [
                { "fvsd_userroleid": "22222222-2222-2222-2222-222222222222" },
                { "fvsd_userroleid": "33333333-3333-3333-3333-333333333333" }
              ]
            }
            """);

        var exception = Assert.Throws<InvalidOperationException>(() =>
            DataverseAccessContextClient.ParseAccessContext(
                document.RootElement,
                "duplicate@fvsd.ab.ca",
                EntraObjectId));

        Assert.Contains("More than one active", exception.Message, StringComparison.Ordinal);
    }
}
