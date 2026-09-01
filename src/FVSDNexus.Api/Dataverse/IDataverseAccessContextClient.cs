namespace FVSDNexus.Api.Dataverse;

public interface IDataverseAccessContextClient
{
    Task<DataverseAccessContext> GetAccessContextAsync(
        string email,
        Guid? entraObjectId,
        CancellationToken cancellationToken = default);
}
