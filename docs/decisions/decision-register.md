# Decision register

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / Decision register

This register summarizes confirmed premises, proposals, open decisions, and monitored platform options. Material architecture decisions should also receive a dedicated ADR.

| Status | Decision or question | Related record |
|---|---|---|
| Confirmed | Maintain the deployed Leadership Analytics capability while the wider product is built. | [Phase 1 product build](../delivery/phase-1-product-build.md) |
| Confirmed | Dataverse is the operational truth store. | [ADR-0001](adr/0001-dataverse-operational-truth.md) |
| Confirmed | The Fabric semantic model is the governed analytical layer. | [ADR-0002](adr/0002-fabric-governed-analytics.md) |
| Confirmed | Reuse the existing assessment, PowerSchool synchronization, reference, and Dataverse structures. | [ADR-0001](adr/0001-dataverse-operational-truth.md) |
| Confirmed | Use named-user delegated access for interactive operations. | [ADR-0003](adr/0003-named-user-delegated-access.md) |
| Confirmed | Do not move identifiable student data outside the approved Canadian geography. | [ADR-0004](adr/0004-canadian-data-residency.md) |
| Confirmed | Retain existing Azure resource identifiers during the repository/product rename. | [ADR-0005](adr/0005-preserve-existing-azure-resources.md) |
| Confirmed | Build the approved next-year Nexus application within the current scope. | [Phased delivery plan](../delivery/roadmap.md) |
| Confirmed | Permit one annual IEP/IPP record per student and school year, using its audited pipe-delimited GUID field to allocate governed module definitions. | [ADR-0006](adr/0006-modular-annual-student-plans.md) |
| Confirmed | Deliver Nexus as an Azure App and use Microsoft Foundry for approved APIs, services, evaluation, agents, tools, and MCP components. | [ADR-0007](adr/0007-azure-app-and-microsoft-foundry.md) |
| Confirmed | Deliver the product in four phases: core build; Dossier transition; Microsoft 365 Copilot integration; PASI connector. | [Phased delivery plan](../delivery/roadmap.md) |
| Confirmed | Complete the assessment experience and adapters as part of Phase 1. | [Assessment capability](../capabilities/assessments/README.md) |
| Confirmed | Extend IEP/IPP with agreed Dossier functionality in Phase 2. | [IEP/IPP capability](../capabilities/ipp/README.md) |
| Confirmed | Bring the existing FVSD Data Product Agent, Fabric Documentation Agent, Work IQ, and applicable Purview controls into a bounded Phase 3 experience. | [Purview governance](../capabilities/purview-governance/README.md) |
| Confirmed | Support both an embedded Nexus Copilot experience and Microsoft 365 Copilot interoperability through shared governed service contracts. | [Copilot interoperability](../architecture/copilot-interoperability.md) |
| Confirmed | Generate IEP/IPP PDFs inside Nexus without using Power Automate and OneDrive as the conversion chain. | [Document generation](../architecture/document-generation.md) |
| Confirmed | Stage an FVSD-owned PASI connector as Phase 4, subject to onboarding and operation-level approval. | [PASI connector](../capabilities/pasi-connector/README.md) |
| Open | Confirm supported pay-as-you-go metering or adopt Power Apps Premium per user. | [Identity and licensing](../architecture/identity-licensing-security.md) |
| Open | Complete Dossier capability, document, integration, and historical-data migration inventory. | [IPP capability](../capabilities/ipp/README.md) |
| Open | Confirm the enforced rule that classifies the shared annual plan as an IEP or IPP. | [IEP/IPP capability](../capabilities/ipp/README.md) |
| Open | Confirm FVSD PASI onboarding, registered-client certificate process, supported contract version, approved operations, environments, support ownership, and incumbent integration inventory. | [PASI connector](../capabilities/pasi-connector/README.md) |
| Open | Confirm the Purview account type, governance domains and ownership, existing policies, supported APIs, least-privilege permissions, authoritative metadata fields, and Nexus-to-agent invocation mechanism. | [Purview governance](../capabilities/purview-governance/README.md) |
| Open | Confirm the embedded-agent host, Work IQ and Copilot licensing, plugin/skill/MCP packaging, tenant administration, and supported Canadian processing path. | [Copilot interoperability](../architecture/copilot-interoperability.md) |
| Open | Confirm PDF renderer hosting, synchronous or queued execution, Dataverse or Blob storage, retention, accessibility, and signed-document requirements after the Phase 1 spike. | [Document generation](../architecture/document-generation.md) |
| Open | Define the final role and permission matrix. | [Identity and licensing](../architecture/identity-licensing-security.md) |
| Monitor | Reconsider Power Apps Vibe or Fabric Apps/Rayfin when Canadian requirements are met. | [Residency and platform options](../architecture/residency-and-platform-options.md) |

## Status changes

When a proposal is approved, rejected, or materially changed:

1. Update this register.
2. Update the canonical capability or architecture page.
3. Add or supersede an ADR when the decision affects system structure or long-term constraints.
4. Link the implementing issue or pull request when available.
