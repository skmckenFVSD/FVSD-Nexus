# Full PoC definition

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Delivery](README.md) / Full PoC definition

**Target horizon:** End of February 2027, subject to authorization

The full PoC should be a complete, end-to-end testable system. It is not required to be the final production implementation, but it must prove the critical operational and analytical paths using representative data and roles.

## Required proof areas

### Identity and authorization

- FVSD Entra sign-in.
- Named-user delegated Fabric access.
- Named-user delegated Dataverse access.
- Confirmed licensing prerequisite or approved test substitute.
- Representative role and student/school access restrictions.
- No shared system identity for interactive student transactions.

### Assessment entry

- Student and assessment selection.
- Applicable form rendering and visibility rules.
- Reference-table scoring for representative assessments.
- Current-period create and update.
- Historical read-only behaviour.
- Administrative correction request and controlled amendment.
- Audit attribution and error handling.

### IPP

- Representative plan creation and lifecycle.
- Goals, objectives, baseline, and progress entry.
- Assigned staff and role-aware access.
- Representative evidence or attachment handling.
- Review/status history.
- Representative historical migration.
- Required printable or exportable output for pilot evaluation.

### Analytics

- Existing Leadership Analytics PoC remains functional.
- Operational data follows the established Dataverse-to-OneLake path.
- Governed semantic-model measures remain authoritative.
- Operational confirmation does not depend on Fabric refresh.
- Relevant assessment or IPP analytical context is demonstrated after refresh.

### Quality

- Automated backend and frontend tests for critical rules.
- Known scoring cases match reference expectations.
- Representative role and RLS tests pass.
- Keyboard and screen-reader-critical journeys are testable.
- Responsive use is acceptable on supported form factors.
- Telemetry excludes student payloads and tokens.
- Failure and recovery behaviour is demonstrated.

## PoC exit decision

At the end of February, Leadership should have evidence to decide:

- Whether the experience provides sufficient value over the Canvas App and IPP vendor.
- Whether the March-June pilot should proceed.
- Which capability gaps must be addressed before wider use.
- Whether licensing, support, migration, and residency conditions remain acceptable.

## Strategic PASI evidence

The PASI connector is not required for the next TOSREC assessment-write slice and is not silently added to the committed full-PoC scope. Because it may materially affect Leadership's move-to-development decision, the repository now includes:

- A documented [PASI capability and staged feasibility path](../capabilities/pasi-connector/README.md).
- A proposed [connector architecture](../architecture/pasi-connector.md).
- A curated [official Alberta Education reference index](../reference/pasi-resources.md).

If Leadership authorizes a PASI technical spike and Alberta Education provides the required non-production onboarding, useful early evidence would be registered-certificate connectivity, one approved read/synchronization path, and one narrowly scoped write with concurrency and failure handling. That spike should be separately scoped and must not delay the immediate assessment-entry proof unless Leadership changes priorities.

## Strategic Purview and Data Analyst evidence

Purview integration is documented as a parallel governance opportunity, not a prerequisite for the next assessment-write slice. The proposed [Data Analyst capability](../capabilities/purview-governance/README.md) reuses the existing FVSD Data Product Agent and Fabric Documentation Agent rather than duplicating their responsibilities, and separates catalog governance from in-application policy enforcement.

An authorized proof should first inventory existing assets and contracts. A later narrow demonstration could show governed Fabric discovery, a bounded data-product lifecycle action, and policy evaluation for one approved Nexus text or file activity. It must not imply that the Nexus Data Analyst role grants Purview administration or source-data access.

## Not automatically implied

Completing the PoC does not automatically authorize vendor retirement, production migration, or September deployment.
