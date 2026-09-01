# Purview and FVSD governance-agent references

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / Purview and governance-agent references

**Reviewed:** September 1, 2026

This page indexes official Microsoft material and the existing FVSD Data Product Agent documentation used to frame the proposed Nexus Data Analyst capability. Tenant configuration, licensing, API availability, permissions, and supported integration mechanisms must be validated again before implementation.

## Microsoft Purview developer platform

- [Microsoft Purview Developer Platform](https://learn.microsoft.com/en-us/purview/developer/) - entry point for app and agent integration.
- [Overview of Microsoft Purview APIs](https://learn.microsoft.com/en-us/purview/developer/microsoft-purview-sdk-documentation-overview) - policy-aware applications, protection scopes, content processing, content activities, and sensitivity labels.
- [Use Microsoft Purview APIs to leverage policies in apps](https://learn.microsoft.com/en-us/purview/developer/use-the-api) - tutorial for computing user protection scopes and processing content.
- [Microsoft Graph data security and governance APIs](https://learn.microsoft.com/en-us/graph/security-datasecurityandgovernance-overview) - API flow, collection policy, DLP policy, and runtime enforcement concepts.
- [Compute protection scopes](https://learn.microsoft.com/en-us/graph/api/userprotectionscopecontainer-compute) - Microsoft Graph operation reference.
- [Process content](https://learn.microsoft.com/en-us/graph/api/userdatasecurityandgovernance-processcontent) - Microsoft Graph operation reference.
- [Submit content activity](https://learn.microsoft.com/en-us/graph/api/activitiescontainer-post-contentactivities) - Microsoft Graph operation for compliance/audit activity submission.
- [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference) - authoritative permission catalogue, including applicable Purview delegated permissions.
- [Purview API samples](https://github.com/microsoft/purview-api-samples) - Microsoft-owned developer examples.

## Purview governance and Fabric

- [Data governance with Microsoft Purview](https://learn.microsoft.com/en-us/purview/data-governance-overview) - Data Map, Unified Catalog, metadata boundary, governance domains, data products, quality, and stewardship.
- [Data governance roles and permissions](https://learn.microsoft.com/en-us/purview/data-governance-roles-permissions) - tenant, catalog, domain, collection, and source permission boundaries.
- [Use Microsoft Purview to govern Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/governance/microsoft-purview-fabric) - Unified Catalog, Fabric live view, lineage, sensitivity labels, DLP, Audit, and related integrations.
- [Data Security and Compliance for apps](https://learn.microsoft.com/en-us/purview/developer/purview-data-security-genai) - DSPM for AI, classification, DLP, insider risk, communication compliance, Audit, eDiscovery, and lifecycle context.
- [New-DlpComplianceRule](https://learn.microsoft.com/en-us/powershell/module/exchangepowershell/new-dlpcompliancerule) - current command reference for application-targeted DLP configuration scenarios described by Microsoft.

## Existing FVSD assets

- [FVSD Data Product Agent](https://github.com/skmckenFVSD/FVSDDataProductAgent) - governance-aligned M365 Copilot orchestration repository.
- [System architecture](https://github.com/skmckenFVSD/FVSDDataProductAgent/blob/main/docs/architecture/README.md) - orchestration layers, responsibilities, tools, and data ownership.
- [Agent registry](https://github.com/skmckenFVSD/FVSDDataProductAgent/blob/main/docs/architecture/agent-registry.md) - Data Product Agent, Fabric Documentation Agent, Data Catalog Agent, Enterprise Catalog Agent, and bounded child agents.
- [Governance framework](https://github.com/skmckenFVSD/FVSDDataProductAgent/blob/main/docs/governance/README.md) - constitutional constraints, governance roles, and cross-platform enforcement.
- [Audit framework](https://github.com/skmckenFVSD/FVSDDataProductAgent/blob/main/docs/governance/audit-framework.md) - correlation, audit events, immutable feed, notification, and review sinks.
- [Fabric Analytics Documentation Agent](https://github.com/skmckenFVSD/FVSDDataProductAgent/blob/main/agents/10-connected-tools-a2a/MS%20Fabric%20-%20Documentation%20Agent%20%28A2A%29.md) - authoritative Catalog/Lineage grounding and output behaviour.
- [Contract documentation](https://github.com/skmckenFVSD/FVSDDataProductAgent/tree/main/docs/contracts) - structured handoffs and end-to-end traces.
- [Published JSON schemas](https://github.com/skmckenFVSD/FVSDDataProductAgent/tree/main/schemas) - machine-readable payload boundaries.

## Important distinctions

- Purview Data Map/Unified Catalog govern metadata; their roles do not grant access to underlying source data.
- The Microsoft Graph policy APIs evaluate and submit application activity/content. Microsoft states this API surface does not extract Purview analytics.
- The Fabric Documentation Agent is the existing FVSD authority for surfaced semantic-model Catalog and Lineage documentation.
- Dataverse remains the FVSD operational record for data-product registration and governance bindings.
- The Enterprise Catalog Agent is represented in the external repository, while its detailed instruction implementation is still identified there as future work. Nexus documentation must not overstate its delivery state.
