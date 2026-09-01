# Purview governance and Data Analyst workspace

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Capabilities](../README.md) / Purview governance

**Status:** Proposed Nexus capability; substantial related agent and Fabric documentation assets already exist outside this repository

FVSD Nexus can provide a Data Analyst workspace that brings governed Fabric documentation, data-product lifecycle orchestration, Microsoft Purview catalog context, and application-level policy enforcement into one role-aware experience.

This is documentation and architecture direction only. No Purview permissions, policies, API calls, agent integration, or Nexus interface have been added.

## Existing FVSD foundation

The separate [FVSD Data Product Agent repository](https://github.com/skmckenFVSD/FVSDDataProductAgent) already establishes much of the governance model:

- An M365 Copilot orchestrator that routes intent but holds no direct MCP access.
- A Fabric Analytics Documentation Agent that surfaces authoritative Catalog and Lineage values from the `FVSDAnalyticDocumentation` Lakehouse.
- Contract-first handoffs for validation, deterministic payload compilation, Dataverse upsert, notification, and audit.
- A read-only Data Catalog Agent for FVSD data-product discovery.
- A proposed Enterprise Catalog Agent using Purview/Graph plus read-only Dataverse context.
- Governance roles including Business Owner, Technical Owner, Data Steward, and Administrator.
- FOIP-aligned constitutional constraints, correlation identifiers, and auditable terminal paths.

Nexus should consume or deep-link to these governed capabilities. It should not duplicate their agent instructions, silently reinterpret their contracts, or become a second source of truth for data-product metadata.

## Two Purview planes

The capability must keep two related but different Microsoft Purview planes explicit.

### Data governance and catalog

Microsoft Purview Data Map and Unified Catalog govern metadata, discovery, lineage, domains, data products, glossary concepts, ownership, quality, and access workflows. Microsoft states that these surfaces contain metadata rather than the underlying data, and their roles do not grant access to the underlying source.

For FVSD, this plane can complement:

- Fabric semantic-model documentation and lineage.
- Dataverse `fvsd_dataproduct` lifecycle records.
- Business Owner, Technical Owner, and Data Steward assignments.
- Enterprise catalog publication and curation.
- Data-product health, ownership, classification, and review.

### Application policy enforcement

The Microsoft Purview APIs in Microsoft Graph let an Entra-registered application become policy-aware for a known user and activity. The documented flow can:

- Compute applicable protection scopes for text/file upload and download activities.
- Determine whether an activity needs no evaluation, offline evaluation, or inline evaluation.
- Submit content for policy evaluation.
- Enforce returned actions, including blocking when required.
- Send content activities into Purview for audit, compliance, risk, and policy purposes.
- Interpret sensitivity-label rights and inheritance through applicable Graph APIs.

Microsoft explicitly states that the policy APIs send activity/content into Purview and do not provide an API for extracting Purview analytics. Nexus analytics and documentation therefore remain grounded in Fabric, Dataverse, and approved catalog sources.

## Executive value

Within the Data Analyst role, this capability could demonstrate:

- One governed place to discover, explain, register, review, publish, and monitor FVSD data products.
- Traceable movement from Fabric technical metadata to business ownership and enterprise catalog publication.
- Clear separation between documentation, validation, write, publication, and notification responsibilities.
- Purview policies applied to Nexus exports, generated documents, prompts, responses, or uploaded files where those activities are introduced.
- Consistent governance controls for human workflows and agent-assisted workflows.
- Reuse of existing FVSD work instead of rebuilding a competing catalog or agent stack.

The strongest story is not simply "Nexus connects to Purview." It is that a Data Analyst can move from technical truth to governed enterprise publication through bounded, auditable steps, while Purview policies protect content crossing the application boundary.

## Proposed Data Analyst experiences

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

- Prepare an approved data product for Purview enterprise catalog publication.
- Require human confirmation for catalog writes or changes in governance status.
- Surface publication outcome, warnings, missing metadata, and follow-up actions.
- Keep Purview catalog permission separate from the Nexus Data Analyst experience role.

### Protect in-app content

Where Nexus later supports text/file upload, export, generated documents, or AI-assisted interactions:

- Compute the signed-in user's protection scope after authentication and refresh it according to the documented policy/ETag behaviour.
- Apply the most restrictive applicable scope when multiple scopes cover one activity.
- Block the user path while an inline evaluation is required.
- Process offline evaluations asynchronously without misrepresenting them as completed.
- Enforce returned policy actions and provide an accessible, non-sensitive explanation.
- Never bypass evaluation because the content originated from an FVSD agent.

## Role and authorization boundary

The Data Analyst role controls the Nexus experience, not the underlying authority:

- Entra, Fabric, Dataverse, Purview, Power BI, and Copilot permissions remain authoritative.
- A Data Analyst who can see a Nexus page does not automatically gain permission to source data, Purview assets, governance domains, catalog writes, or policy administration.
- Microsoft recommends least-privilege Purview roles; Nexus must preserve that boundary.
- Purview catalog access does not grant access to the underlying Fabric or Azure data.
- Agent operations must retain their existing tool scopes and constitutional limits.

## Proposed integration boundary

```text
Data Analyst in Nexus
  -> Nexus role-aware governance workspace
  -> governed command/query contract
     |-> FVSD Data Product Agent orchestration
     |-> Fabric Analytics Documentation Agent
     |-> Dataverse data-product lifecycle
     |-> Purview Data Map / Unified Catalog capability
     `-> Microsoft Graph Purview policy evaluation
  -> structured result, review, notification, and audit correlation
```

See the [reference architecture](../../architecture/purview-governance.md) for system boundaries and trust decisions.

## Staged delivery

| Stage | Outcome | Evidence |
|---|---|---|
| 0. Inventory and contract alignment | Confirm the current Data Product Agent, Documentation Agent, Dataverse schema, Purview tenant/account type, domains, policies, and permissions. | Authoritative inventory, role matrix, integration contracts, no duplicate ownership. |
| 1. Read-only Data Analyst workspace | Surface documentation, lineage, data-product records, and permitted catalog context. | Grounded answers match source agents/systems; denied assets remain denied. |
| 2. Governed lifecycle actions | Invoke registration/review/publication workflows through existing agent contracts with human confirmation. | End-to-end correlation, deterministic payloads, review evidence, safe failure path. |
| 3. Purview policy proof | Apply protection-scope and content-processing APIs to one approved Nexus text or file activity. | No-policy, offline, inline-block, policy-change, and failure cases verified. |
| 4. Operational hardening | Add health, permission diagnostics, policy/configuration runbooks, audit retention, and support ownership. | Security, privacy, accessibility, failure/recovery, and operational acceptance. |

## Executive demonstration

A high-value demonstration could show a Data Analyst:

1. Asking Nexus to explain a Fabric measure or model object.
2. Receiving grounded documentation and lineage from the existing Fabric agent.
3. Finding the corresponding FVSD data-product registration and governance owners.
4. Starting a governed create/update workflow with an explicit preview and approval point.
5. Publishing or updating the approved enterprise catalog representation through a scoped agent.
6. Exporting or generating a document that is evaluated against the signed-in user's Purview policy.
7. Seeing an allowed activity complete and a restricted activity block with a safe explanation.
8. Reconstructing the complete workflow through one correlation identifier without exposing sensitive payloads.

## Open decisions

- Which current Data Product Agent and Copilot capabilities are production-ready, pilot-ready, or still placeholders?
- Should Nexus invoke the M365 Copilot orchestrator, individual agents, a stable API facade, or initially provide deep links?
- Which system is authoritative for each metadata field: Fabric documentation, Dataverse data product, or Purview catalog?
- Which Purview account type, governance domains, collections, roles, and data products currently exist in the FVSD tenant?
- Which Data Analyst activities require catalog write permission versus read-only discovery?
- Which Nexus text/file activities should be subject to collection or DLP policies?
- Which content may legally and operationally be submitted to Purview policy processing?
- How will policy outages, timeouts, and unavailable inline evaluation be handled?
- Which audit events belong in Nexus, the agent audit chain, Purview, or all three with shared correlation?

## Explicit exclusions

- No Purview tenant configuration or DLP policy creation.
- No new Entra or Graph permissions.
- No Nexus calls to Purview, Fabric agents, or the Data Product Agent.
- No copy of the external agent repository into Nexus.
- No assumption that Purview catalog permissions grant source-data access.
- No expansion of Data Analyst rights beyond existing destination permissions.

## Related documentation

- [Purview and agent architecture](../../architecture/purview-governance.md)
- [Purview and FVSD agent references](../../reference/purview-resources.md)
- [Data and integrations](../../architecture/data-and-integrations.md)
- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
- [Platform administration](../administration/README.md)
- [Decision register](../../decisions/decision-register.md)
