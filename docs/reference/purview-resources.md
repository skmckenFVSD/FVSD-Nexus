# Purview and FVSD governance-agent references

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / Purview and governance-agent references

**Reviewed:** November 5, 2026

This page indexes official Microsoft material and the existing FVSD Data Product Agent documentation used to frame Phase 3. Tenant configuration, licensing, API availability, permissions, and supported integration mechanisms must be validated again before implementation.

## Microsoft Foundry, Copilot, Work IQ, and MCP

- [Ways to extend Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/overview) - decision point between experiences inside Microsoft 365 Copilot and capabilities embedded in applications FVSD operates.
- [Declarative agents for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent) - Microsoft-managed agent orchestration, knowledge, skills, actions, and distribution.
- [MCP and API plugins for declarative agents](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/overview-plugins) - plugin manifests, REST actions, MCP tools, discovery, and host limitations.
- [Integrate web or native apps with the Microsoft 365 Agents SDK](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-integrate-web-or-native-app-m365-agents-sdk) - authenticated integration of a published Copilot Studio agent into an FVSD-operated application.
- [Microsoft Foundry Agent Service overview](https://learn.microsoft.com/en-us/azure/foundry/agents/overview) - managed agent services, tools, identity, tracing, publishing, and operational controls.
- [Work IQ overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq) - permission-aware Microsoft 365 context, chat, tools, and workspace concepts for agents.
- [Add Work IQ to an agent in Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/add-work-iq) - current harness and configuration guidance.
- [Use Model Context Protocol tools with Foundry Agent Service](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/model-context-protocol) - Foundry MCP tool integration and authorization guidance.
- [Manage plugins, skills, and MCP servers in Microsoft 365](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-plugins-skills-mcp-servers) - Microsoft 365 administration boundary for these extension types.

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

- The OneLake catalog is the primary catalogue and governance experience inside Fabric. Purview complements it with protection and compliance and may provide broader enterprise catalogue capabilities where FVSD adopts them.
- Catalog metadata and roles do not grant access to underlying source data.
- The Microsoft Graph policy APIs evaluate and submit application activity/content. Microsoft states this API surface does not extract Purview analytics.
- The Fabric Documentation Agent is the existing FVSD authority for surfaced semantic-model Catalog and Lineage documentation.
- Dataverse remains the FVSD operational record for data-product registration and governance bindings.
- The Enterprise Catalog Agent is represented in the external repository, while its detailed instruction implementation is still identified there as future work. Nexus documentation must not overstate its delivery state.
