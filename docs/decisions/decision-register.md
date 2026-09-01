# Decision register

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / Decision register

This register summarizes confirmed premises, proposals, open decisions, and monitored platform options. Material architecture decisions should also receive a dedicated ADR.

| Status | Decision or question | Related record |
|---|---|---|
| Confirmed | Keep the current Leadership Analytics PoC stable for discussion. | - |
| Confirmed | Dataverse is the operational truth store. | [ADR-0001](adr/0001-dataverse-operational-truth.md) |
| Confirmed | The Fabric semantic model is the governed analytical layer. | [ADR-0002](adr/0002-fabric-governed-analytics.md) |
| Confirmed | Reuse the existing assessment, PowerSchool synchronization, reference, and Dataverse structures. | [ADR-0001](adr/0001-dataverse-operational-truth.md) |
| Confirmed | Use named-user delegated access for interactive operations. | [ADR-0003](adr/0003-named-user-delegated-access.md) |
| Confirmed | Do not move identifiable student data outside the approved Canadian geography. | [ADR-0004](adr/0004-canadian-data-residency.md) |
| Confirmed | Retain existing Azure resource identifiers during the repository/product rename. | [ADR-0005](adr/0005-preserve-existing-azure-resources.md) |
| Proposed | Expand Nexus to replace the assessment Canvas UX. | [Assessment capability](../capabilities/assessments/README.md) |
| Proposed | Expand Nexus to replace the third-party IPP experience. | [IPP capability](../capabilities/ipp/README.md) |
| Proposed | Evaluate and stage an FVSD-owned PASI connector as a strategic differentiator and potential enabler for retiring overlapping third-party functions. | [PASI connector](../capabilities/pasi-connector/README.md) |
| Proposed | Bring the existing FVSD Data Product Agent, Fabric Documentation Agent, and applicable Microsoft Purview capabilities into a bounded Data Analyst workspace. | [Purview governance](../capabilities/purview-governance/README.md) |
| Proposed | Complete a testable full PoC by the end of February 2027. | [Full PoC definition](../delivery/full-poc-definition.md) |
| Proposed | Conduct wider testing March-June and target phased production use in September 2027. | [Roadmap](../delivery/roadmap.md) |
| Open | Obtain formal Leadership authorization and confirm first implementation scope. | - |
| Open | Confirm supported pay-as-you-go metering or adopt Power Apps Premium per user. | [Identity and licensing](../architecture/identity-licensing-security.md) |
| Open | Complete vendor IPP capability and historical-data migration inventory. | [IPP capability](../capabilities/ipp/README.md) |
| Open | Confirm FVSD PASI onboarding, registered-client certificate process, supported contract version, approved operations, environments, support ownership, and incumbent integration inventory. | [PASI connector](../capabilities/pasi-connector/README.md) |
| Open | Confirm the Purview account type, governance domains and ownership, existing policies, supported APIs, least-privilege permissions, authoritative metadata fields, and Nexus-to-agent invocation mechanism. | [Purview governance](../capabilities/purview-governance/README.md) |
| Open | Define the final role and permission matrix. | [Identity and licensing](../architecture/identity-licensing-security.md) |
| Monitor | Reconsider Power Apps Vibe or Fabric Apps/Rayfin when Canadian requirements are met. | [Residency and platform options](../architecture/residency-and-platform-options.md) |

## Status changes

When a proposal is approved, rejected, or materially changed:

1. Update this register.
2. Update the canonical capability or architecture page.
3. Add or supersede an ADR when the decision affects system structure or long-term constraints.
4. Link the implementing issue or pull request when available.
