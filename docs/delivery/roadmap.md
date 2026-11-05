# Phased delivery plan

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Delivery](README.md) / Phased delivery plan

**Status:** Approved product direction; Phase 1 active

The phases describe delivery order and dependency, not separate products. Dates and release gates remain evidence-based and may move as functionality, privacy, security, accessibility, and migration findings become clearer.

| Phase | Scope | Current position |
|---|---|---|
| 1. Nexus foundation and core workflows | Finish Fabric integration and page designs; complete Class Assignments, Assessments, and the first production IEP/IPP capability. | Active build |
| 2. Dossier transition | Extend IEP/IPP modules and related workflows to incorporate the agreed functionality and historical information now held in Dossier. | Defined direction; detailed inventory required |
| 3. Microsoft 365 Copilot integration | Connect Nexus capabilities, the FVSD Data Product Agent, Work IQ, skills, and governed tools through the Microsoft 365 Copilot harness. Microsoft Foundry supplies the API, model, service, evaluation, agent, and MCP components. | Architecture and contract definition |
| 4. PASI connector | Implement the FVSD-owned provincial connector, operational status handling, reconciliation, and support model. | Feasibility established; onboarding and detailed scope required |

## Phase 1 — Nexus foundation and core workflows

Phase 1 converts the existing working slices into the supported application for the next school year.

- Finish Leadership Analytics pages, Fabric semantic-model integration, and role-specific designs.
- Complete the Class Assignment experience and shared filter context.
- Extend assessment entry, history, completion monitoring, and governed scoring beyond the TOSREC reference implementation.
- Complete the core annual IEP/IPP experience using one master record per student and school year plus governed modular sections.
- Finish document/export behaviour, lifecycle rules, delegated authorization, testing, accessibility, telemetry, and operational support.
- Preserve Dataverse as the immediate operational authority and Fabric as the governed analytical layer.

Detailed completed work, remaining work, and acceptance evidence are maintained in the [Phase 1 product build](phase-1-product-build.md).

## Phase 2 — Dossier transition

Phase 2 expands the IEP/IPP foundation rather than creating a separate programme.

- Inventory Dossier functions, records, documents, history, and integration dependencies.
- Map required capabilities to existing IEP/IPP modules and define new governed modules only where needed.
- Bring intervention planning into the annual-plan context while preserving structured, reusable records.
- Design historical migration, reconciliation, retention, and evidence requirements.
- Run parallel validation before retiring any incumbent workflow.

## Phase 3 — Microsoft 365 Copilot integration

Phase 3 makes governed Nexus capabilities available through the Microsoft 365 Copilot harness.

- Use Microsoft Foundry for APIs, model access, agent services, evaluation, toolboxes, and MCP components.
- Use the Microsoft 365 Copilot harness and Work IQ for permission-aware Microsoft 365 context and user interaction.
- Provide both a Microsoft 365 Copilot experience and an authenticated Copilot experience embedded within Nexus, backed by the same governed service contracts.
- Integrate the existing FVSD Data Product Agent and Fabric Documentation Agent through published, typed contracts.
- Evaluate declarative agents, custom engine agents, the Microsoft 365 Agents SDK, Copilot Studio, skills, API plugins, Copilot connectors, and MCP tools against the required host, identity, licensing, and support model.
- Expose approved skills and tools that respect the same Entra, Dataverse, Fabric, Purview, and Nexus authorization boundaries as the application.
- Require confirmation and deterministic validation before governed writes or publication actions.
- Apply observability, evaluation, privacy, residency, and human-review controls before broader use.

Phase 3 does not move domain rules into prompts or make an agent an operational source of truth.

See [Copilot and agent interoperability](../architecture/copilot-interoperability.md) for the investigation and shared-contract design.

## Phase 4 — PASI connector

Phase 4 connects governed Nexus operations with Alberta Education's Provincial Approach to Student Information.

- Complete Alberta Education onboarding, certificate, environment, operation, and contract-version decisions.
- Commit operational changes to Dataverse before asynchronous provincial exchange.
- Use a durable outbox/queue, idempotency, optimistic concurrency, retry, alert, and reconciliation patterns.
- Show provincial acceptance and exception status in the relevant Nexus workflow.
- Establish privacy, telemetry, support, disaster-recovery, and certificate-rotation runbooks.

## Gates applying to every phase

- Named-user authorization is enforced by Nexus and each destination service.
- Identifiable student information remains in the approved Canadian geography.
- Operational and analytical freshness is described accurately to users.
- Accessibility, privacy, security, audit, performance, and recovery evidence is reviewed before release.
- Migration and replacement decisions require parallel validation and an approved rollback path.
- Documentation and training are updated with the delivered behaviour.

## Related documentation

- [Phase 1 product build](phase-1-product-build.md)
- [Adoption and engagement](adoption-and-engagement.md)
- [Testing strategy](testing-strategy.md)
- [Decision register](../decisions/decision-register.md)
