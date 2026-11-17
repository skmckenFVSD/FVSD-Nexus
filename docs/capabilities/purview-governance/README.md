---
title: Data governance and Data Analyst workspace
description: A Phase 3 Data Analyst workspace combining governed Fabric documentation, the data-product lifecycle, the OneLake catalog, and Purview protection for in-app content.
type: capability
status: proposed
icon: 🛡️
area: capabilities
audience: [leadership, product, architects]
owner: Scott McKenzie
tags: [nexus, nexus/capabilities, nexus/purview-governance]
aliases: [Purview governance, Data governance workspace, OneLake catalog]
updated: 2026-11-17
related: ["[[decisions/adr/0008-onelake-catalog-governance-purview-protection]]", "[[architecture/purview-governance]]", "[[reference/purview-resources]]", "[[architecture/data-and-integrations]]", "[[architecture/identity-licensing-security]]", "[[capabilities/administration/README]]", "[[decisions/decision-register]]"]
---

# 🛡️ Data governance and Data Analyst workspace

[🏠 Home](../../README.md) › [🧩 Capabilities](../README.md) › Data governance and Data Analyst workspace

**Status:** 🟠 Phase 3 architecture; substantial related agent and Fabric documentation assets already exist outside this repository

FVSD Nexus can provide a Data Analyst workspace that brings governed Fabric documentation, data-product lifecycle orchestration, **OneLake catalog** context, and **Purview** policy enforcement for in-app content into one role-aware experience.

> [!IMPORTANT]
> **Re-anchored on the OneLake catalog — November 17, 2026.** Microsoft is moving data governance into Fabric and retiring Purview Data Governance (support ends November 12, 2027). The governance catalogue for this capability is now the **Fabric OneLake catalog**; **Purview** is used only for protection and compliance. Earlier plans to publish to Purview Unified Catalog or Data Map are withdrawn. See [ADR-0008](../../decisions/adr/0008-onelake-catalog-governance-purview-protection.md).

This is the approved Phase 3 direction, not a claim that the integration is already implemented. No catalog or Purview permissions, policies, API calls, agent integration, or Nexus interface have been added.

## 🗄️ Existing FVSD foundation

The separate [FVSD Data Product Agent repository](https://github.com/skmckenFVSD/FVSDDataProductAgent) already establishes much of the governance model:

- An M365 Copilot orchestrator that routes intent but holds no direct MCP access.
- A Fabric Analytics Documentation Agent that surfaces authoritative Catalog and Lineage values from the `FVSDAnalyticDocumentation` Lakehouse.
- Contract-first handoffs for validation, deterministic payload compilation, Dataverse upsert, notification, and audit.
- A read-only Data Catalog Agent for FVSD data-product discovery.
- A proposed Enterprise Catalog Agent currently designed around Purview catalog entries; under [ADR-0008](../../decisions/adr/0008-onelake-catalog-governance-purview-protection.md) it is re-pointed to OneLake catalog publication before November 12, 2027.
- Governance roles including Business Owner, Technical Owner, Data Steward, and Administrator.
- FOIP-aligned constitutional constraints, correlation identifiers, and auditable terminal paths.

Nexus should consume or deep-link to these governed capabilities. It should not duplicate their agent instructions, silently reinterpret their contracts, or become a second source of truth for data-product metadata.

## 🛡️ OneLake catalog governance and Purview protection

The capability keeps two responsibilities explicit: **governance** (what data means, who owns it, where it came from) in the OneLake catalog, and **protection and compliance** in Purview.

### OneLake catalog: discovery and governance

The OneLake catalog is FVSD's governance catalogue. It brings together metadata, ownership, endorsement, domains, lineage, and security and protection context for Fabric items, and can govern Azure and third-party sources through shortcuts, mirroring and supported connectors without copying the data. It is embedded in Teams, Excel and Foundry, so the same permissions, labels, endorsements and lineage that govern data also govern how AI uses it. Catalog access never replaces the permissions on the underlying item.

For FVSD, this plane can complement:

- Fabric semantic-model documentation and lineage.
- Dataverse `fvsd_dataproduct` lifecycle records.
- Business Owner, Technical Owner, and Data Steward assignments.
- Publication and endorsement of approved FVSD data products in the OneLake catalog.
- Data-product health, ownership, classification, and review.

### Microsoft Purview: protection and compliance

Purview supplies the information-protection and compliance plane: sensitivity labels, DLP across the estate and AI, audit, retention, insider-risk and related controls. FVSD does **not** adopt Purview Unified Catalog or Data Map for new work ([ADR-0008](../../decisions/adr/0008-onelake-catalog-governance-purview-protection.md)). If a future requirement exceeds the OneLake catalog, a third-party governance tool that integrates with Fabric is evaluated instead.

### Application policy enforcement

The Microsoft Purview APIs in Microsoft Graph let an Entra-registered application become policy-aware for a known user and activity. The documented flow can:

- Compute applicable protection scopes for text/file upload and download activities.
- Determine whether an activity needs no evaluation, offline evaluation, or inline evaluation.
- Submit content for policy evaluation.
- Enforce returned actions, including blocking when required.
- Send content activities into Purview for audit, compliance, risk, and policy purposes.
- Interpret sensitivity-label rights and inheritance through applicable Graph APIs.

Microsoft explicitly states that the policy APIs send activity/content into Purview and do not provide an API for extracting Purview analytics. Nexus analytics and documentation therefore remain grounded in Fabric, Dataverse, and the OneLake catalog.

## 🎯 Executive value

Within the Data Analyst role, this capability could demonstrate:

- One governed place to discover, explain, register, review, publish, and monitor FVSD data products.
- Traceable movement from Fabric technical metadata to business ownership and OneLake catalog publication.
- Clear separation between documentation, validation, write, publication, and notification responsibilities.
- Purview policies applied to Nexus exports, generated documents, prompts, responses, or uploaded files where those activities are introduced.
- Consistent governance controls for human workflows and agent-assisted workflows.
- Reuse of existing FVSD work instead of rebuilding a competing catalog or agent stack.

The strongest story is not simply "Nexus connects to a catalog." It is that a Data Analyst can move from technical truth to a governed, endorsed data product in the OneLake catalog through bounded, auditable steps, beside the semantic model it describes, while Purview policies protect content crossing the application boundary.

## 📊 Planned Data Analyst experiences

### Discover and explain

- Search FVSD data products and governed enterprise assets.
- Ask for business, technical, minimal, or audit-oriented documentation.
- Explain a semantic object using the Fabric Documentation Agent's authoritative contract.
- Trace surfaced direct and indirect lineage without inventing missing relationships.
- Show ownership, stewardship, sensitivity, publication, and review status.

### Register and govern

- Start a data-product registration from a documented Fabric object.
- Confirm create versus update before a write.
- Resolve required governance owners through the established validation workflow.
- Preview the compiled governance payload before it is committed.
- Route review and notification through the existing contract chain.
- Preserve a correlation identifier across every agent and system boundary.

### Publish and curate

- Prepare an approved data product for OneLake catalog publication and endorsement.
- Require human confirmation for catalog writes or changes in governance status.
- Surface publication outcome, warnings, missing metadata, and follow-up actions.
- Keep OneLake catalog and endorsement permissions separate from the Nexus Data Analyst experience role.

### Protect in-app content

Where Nexus later supports text/file upload, export, generated documents, or AI-assisted interactions:

- Compute the signed-in user's protection scope after authentication and refresh it according to the documented policy/ETag behaviour.
- Apply the most restrictive applicable scope when multiple scopes cover one activity.
- Block the user path while an inline evaluation is required.
- Process offline evaluations asynchronously without misrepresenting them as completed.
- Enforce returned policy actions and provide an accessible, non-sensitive explanation.
- Never bypass evaluation because the content originated from an FVSD agent.

## 🔐 Role and authorization boundary

The Data Analyst role controls the Nexus experience, not the underlying authority:

- Entra, Fabric (including the OneLake catalog), Dataverse, Purview, Power BI, and Copilot permissions remain authoritative.
- A Data Analyst who can see a Nexus page does not automatically gain permission to source data, governance domains, catalog publication or endorsement, or Purview policy administration.
- Microsoft recommends least-privilege roles for Fabric governance and Purview; Nexus must preserve that boundary.
- OneLake catalog visibility does not grant access to the underlying Fabric, Azure or third-party data.
- Agent operations must retain their existing tool scopes and constitutional limits.

## 👥 Who uses the catalog and Purview at FVSD

Governance and protection affect many users, but only a smaller group administers them.

| FVSD audience | Expected relationship to the OneLake catalog and Purview |
|---|---|
| Teachers, specialists, and principals | Work in Nexus and Microsoft 365 under applicable labels, DLP, retention, and audit controls. They are not expected to administer Purview. |
| Data Analyst and data stewards | Use OneLake catalog definitions, ownership, endorsement, lineage and review context to help people understand and govern data products. Their Nexus role does not automatically grant catalog or Purview administration. |
| Business and technical owners | Confirm meaning, appropriate use, sensitivity, publication, and review of data products in their area. |
| IT, privacy, security, and records staff | Configure and monitor the protection, compliance, audit, retention, and risk controls within their assigned responsibilities. |
| Fabric and catalog administrators | Maintain OneLake catalog domains, endorsement, shortcuts, mirroring and connectors, role assignments, health, and integration configuration. |

Named owners, role assignments, and the exact tenant configuration must be confirmed during the Phase 3 inventory. Until then, Nexus documentation describes a target operating model rather than assigning authority to an individual.

## 💡 From governance to understanding

Nexus should translate governance into questions that matter to staff: What does this mean? Where did it come from? How current is it? Who owns it? Who may change it? What happens if it is wrong? The OneLake catalog provides meaning and lineage, Purview provides protection, and Nexus presents the result in language appropriate to the user's task.

## 🗺️ Planned integration boundary

```text
Data Analyst in Nexus
  -> Nexus role-aware governance workspace
  -> governed command/query contract
     |-> FVSD Data Product Agent orchestration
     |-> Fabric Analytics Documentation Agent
     |-> Dataverse data-product lifecycle
     |-> OneLake catalog (discovery, endorsement, publication)
     `-> Microsoft Graph Purview policy evaluation (protection)
  -> structured result, review, notification, and audit correlation
```

See the [reference architecture](../../architecture/purview-governance.md) for system boundaries and trust decisions.

## 🚀 Phase 3 staged delivery

| Stage | Outcome | Evidence |
|---|---|---|
| 0. Inventory and contract alignment | Confirm the current Data Product Agent, Documentation Agent, Dataverse schema, OneLake catalog domains and endorsement, the Purview Data Governance retirement scope for FVSD, Purview protection policies, and permissions. | Authoritative inventory, role matrix, integration contracts, no duplicate ownership. |
| 1. Read-only Data Analyst workspace | Surface documentation, lineage, data-product records, and permitted catalog context. | Grounded answers match source agents/systems; denied assets remain denied. |
| 2. Governed lifecycle actions | Invoke registration/review/publication workflows through existing agent contracts with human confirmation. | End-to-end correlation, deterministic payloads, review evidence, safe failure path. |
| 3. Purview policy proof | Apply protection-scope and content-processing APIs to one approved Nexus text or file activity. | No-policy, offline, inline-block, policy-change, and failure cases verified. |
| 4. Operational hardening | Add health, permission diagnostics, policy/configuration runbooks, audit retention, and support ownership. | Security, privacy, accessibility, failure/recovery, and operational acceptance. |

## 🧪 Executive demonstration

A high-value demonstration could show a Data Analyst:

1. Asking Nexus to explain a Fabric measure or model object.
2. Receiving grounded documentation and lineage from the existing Fabric agent.
3. Finding the corresponding FVSD data-product registration and governance owners.
4. Starting a governed create/update workflow with an explicit preview and approval point.
5. Publishing or endorsing the approved data product in the OneLake catalog through a scoped agent.
6. Exporting or generating a document that is evaluated against the signed-in user's Purview policy.
7. Seeing an allowed activity complete and a restricted activity block with a safe explanation.
8. Reconstructing the complete workflow through one correlation identifier without exposing sensitive payloads.

## ❓ Open decisions

- Which current Data Product Agent and Copilot capabilities are production-ready, pilot-ready, or still placeholders?
- Should Nexus invoke the M365 Copilot orchestrator, individual agents, a stable API facade, or initially provide deep links?
- Which system is authoritative for each metadata field: Fabric documentation, Dataverse data product, or the OneLake catalog?
- Does FVSD currently have Purview Unified Catalog or Data Map content that must move to the OneLake catalog before November 12, 2027?
- Which OneLake catalog domains, endorsements and data products exist, and which supported API publishes to the catalog?
- Which Data Analyst activities require catalog write permission versus read-only discovery?
- Which Nexus text/file activities should be subject to collection or DLP policies?
- Which content may legally and operationally be submitted to Purview policy processing?
- How will policy outages, timeouts, and unavailable inline evaluation be handled?
- Which audit events belong in Nexus, the agent audit chain, Purview, or all three with shared correlation?

## ⚠️ Explicit exclusions

- No OneLake catalog or Purview tenant configuration, and no DLP policy creation.
- No new work on Purview Unified Catalog or Data Map.
- No new Entra or Graph permissions.
- No Nexus calls to Purview, Fabric agents, or the Data Product Agent.
- No copy of the external agent repository into Nexus.
- No assumption that catalog permissions grant source-data access.
- No expansion of Data Analyst rights beyond existing destination permissions.

## 🔗 Related documentation

- [ADR-0008: OneLake catalog and Purview protection](../../decisions/adr/0008-onelake-catalog-governance-purview-protection.md)
- [Data governance and agent architecture](../../architecture/purview-governance.md)
- [Governance and FVSD agent references](../../reference/purview-resources.md)
- [Data and integrations](../../architecture/data-and-integrations.md)
- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
- [Platform administration](../administration/README.md)
- [Decision register](../../decisions/decision-register.md)

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Capabilities*
