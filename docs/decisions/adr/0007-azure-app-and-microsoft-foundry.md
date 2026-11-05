# ADR-0007: Use an Azure App with Microsoft Foundry as the intelligence service plane

**Status:** Accepted

**Date:** 2026-11-05

## Context

FVSD Nexus must support structured operational workflows, governed analytics, annual student plans, and future conversational access. These concerns need a clear product boundary so that AI capabilities do not become a second application architecture or bypass existing domain controls.

Nexus already has a React and ASP.NET Core application, delegated access to Dataverse and Fabric, Canadian Azure hosting, and a growing set of validated operational experiences. FVSD also has a Data Product Agent and Fabric Documentation Agent and intends to connect approved skills through the Microsoft 365 Copilot harness in Phase 3.

## Decision

1. FVSD Nexus remains an Azure-hosted application. Its React interface and ASP.NET Core API are the primary experience and application boundary.
2. Microsoft Foundry is the intelligence service plane for approved APIs, model access, agent services, evaluation, toolboxes, and MCP components.
3. The Microsoft 365 Copilot harness and Work IQ become an additional Phase 3 experience for approved skills, agents, and permission-aware Microsoft 365 context.
4. Dataverse remains the operational source of truth and the Fabric semantic model remains the governed analytical layer.
5. Domain validation, authorization, scoring, workflow state, and consequential writes remain in deterministic services and destination systems. They are not delegated to prompts.
6. Agents use published, typed contracts and least-privilege tools. Human confirmation is required where the underlying workflow requires approval, publication, or another consequential decision.
7. Entra, Dataverse, Fabric, Purview, and Nexus continue to enforce their respective authorization and policy boundaries regardless of whether the request begins in Nexus or Microsoft 365 Copilot.

## Consequences

- The application can continue to deliver complete workflows without waiting for Phase 3.
- Foundry components are reusable from Nexus and Microsoft 365 Copilot without duplicating domain logic.
- Work IQ can supply permission-aware work context without being treated as authority for student records or analytical definitions.
- Agent evaluation, tracing, safety, privacy, residency, and operational support become explicit release requirements.
- MCP servers and agent tools must be administered, versioned, tested, and monitored as privileged integration surfaces.
- The solution requires a stable service-contract layer between user experiences, agents, and domain services.

## Alternatives considered

### Make Microsoft 365 Copilot the primary application

Rejected because Nexus requires rich, structured, accessible operational workflows and predictable document experiences that should not depend on a conversational harness.

### Put business rules and writes directly in agent prompts

Rejected because it would weaken determinism, testability, auditability, and destination authorization.

### Build a separate AI product beside Nexus

Rejected because it would duplicate identity, governance, workflow, and support boundaries. Foundry should extend the product through shared services.

## Related documentation

- [Architecture overview](../../architecture/overview.md)
- [Phased delivery plan](../../delivery/roadmap.md)
- [Purview governance and agent architecture](../../architecture/purview-governance.md)
- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
