# Platform administration

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Capabilities](../README.md) / Platform administration

**Status:** Initial Settings surface present; operational expansion required

Administration provides the controlled capabilities needed to operate Nexus safely without exposing technical complexity to general users.

## Current capabilities

- Developer-only role simulation for UX and RLS testing, exposed from a dedicated development-controls rail.
- Real/obfuscated student-data preview controls available only to the server-authorized developer account.
- A Settings destination showing live Fabric and Dataverse connection context.
- Signed-in identity, effective role, school assignments, named-user policy, and application access context.
- Entra sign-in and sign-out.
- Azure telemetry and health endpoint.
- Governed server-side semantic-model queries.

The sidebar no longer duplicates capability filter context. School, school year, grade, period, and other selections remain visible with the page-specific filter controls that own them.

## Proposed operational capabilities

- Verify named-user Power Apps entitlement for Dataverse operations.
- Display effective Nexus role and service access status.
- Manage administrative assessment correction requests.
- Maintain applicable assessment reference data through governed processes.
- Review audit and operational support information.
- Manage capability and page visibility by role.
- Support controlled environment diagnostics without exposing student payloads.
- Surface authorized Microsoft Fabric and OneLake Catalog integration health without granting platform administration through the Nexus experience role.

## Administrative boundaries

- Nexus administration does not replace Entra, Dataverse, Fabric, or Power Platform administration.
- Nexus administration and the Data Administrator workspace do not replace Microsoft Fabric, OneLake Catalog, security, compliance, or platform-administration roles.
- A Nexus role cannot grant access that the destination service denies.
- The development role simulator never changes the user's actual Fabric identity or Dataverse permissions.
- Production support telemetry must avoid student-level values and access tokens.

## Open questions

- Final mapping between Entra groups, Dataverse roles, Fabric roles, and Nexus experience roles.
- Which administrative functions belong in Nexus versus existing Microsoft admin portals.
- Operational support ownership and escalation procedures.
- Licensing verification and caching behaviour.
- Final ownership of Fabric/OneLake catalog administration, policy administration, data stewardship, and Nexus support.

## Related documentation

- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
- [Testing strategy](../../delivery/testing-strategy.md)
- [Decision register](../../decisions/decision-register.md)
- [Governance and Data Administrator workspace](../purview-governance/README.md)
