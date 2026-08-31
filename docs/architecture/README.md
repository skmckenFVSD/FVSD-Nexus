# Architecture

FVSD Nexus is a custom user experience over FVSD's existing Microsoft data and identity platforms.

## Architecture documents

- [Overview](overview.md)
- [Data and integrations](data-and-integrations.md)
- [Identity, licensing, and security](identity-licensing-security.md)
- [Residency and platform options](residency-and-platform-options.md)

## Core premises

1. Dataverse is the operational truth store.
2. The Fabric semantic model is the governed analytical layer.
3. Users access interactive data with named identities and delegated tokens.
4. Backend and destination-service authorization are authoritative.
5. Canadian data residency is a non-negotiable production boundary.
6. Existing stable structures and calculations are reused.
7. Operational confirmation comes from Dataverse; Fabric analytics update asynchronously.

Material changes to these premises should be recorded in an [architecture decision record](../decisions/adr/README.md).
