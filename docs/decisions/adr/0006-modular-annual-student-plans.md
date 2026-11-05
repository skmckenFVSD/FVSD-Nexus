# ADR-0006: Compose one annual student plan from governed module allocations

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Decision register](../decision-register.md) / [Architecture decision records](README.md) / ADR-0006

- **Status:** Accepted
- **Date:** 2026-11-05

## Context

FVSD has approved development of the next-year Nexus application. The working Educational Framework Canvas app provides the functional baseline. `fvsd_studentipp` is the annual master record and `fvsd_ippsection` is the module-definition catalogue. Students receive different combinations of modules, and additional definitions will be introduced during Dossier migration.

The existing `fvsd_studentipp.fvsd_ippsections` column stores selected module-definition GUIDs as pipe-delimited text. It is an audited, writable 2,000-character Dataverse string. The current Canvas app also maintains multiple module-specific HTML columns to assemble its document output; these HTML values duplicate information held in activities, goals, notes, student details, assessments, and other structured records.

## Decision

Nexus will permit at most one annual plan per student and school year. IEP and IPP are classifications of that shared plan rather than separate annual records.

Nexus will retain `fvsd_studentipp.fvsd_ippsections` as the module-allocation mechanism. It will store a canonical pipe-delimited list of distinct `fvsd_ippsection` GUIDs. Module labels, availability, required/locked behaviour, and display order remain governed by the module catalogue.

New plans always allocate Student Details and Screener Results. If the student is SPED Coded when the plan is created, Student Conditions and Coding is also allocated. Teachers add or remove other applicable modules.

The API, not the browser, owns parsing, validation, defaulting, de-duplication, canonical serialization, required-module protection, and optimistic-concurrency handling. The allocation string contains membership only; module content remains in structured records.

Nexus will not introduce new per-module HTML columns. Interactive rendering and print/export generation will use structured module data. Existing HTML columns may remain temporarily for Canvas compatibility and migration comparison but are not authoritative Nexus data.

## Consequences

- Student plan history follows the established assessment-history navigation pattern.
- Student and school-year uniqueness must be enforced by the API and a Dataverse alternate key or equivalent constraint.
- The allocation field can hold approximately 54 canonical GUIDs, which is comfortably above the current module catalogue but must be monitored as Dossier modules are added.
- Module order is resolved from `fvsd_ippsection.fvsd_sortorder`, not from string position.
- The allocation field is not used for cross-plan module filtering or analytics.
- Two editors cannot safely perform read-modify-write without Dataverse ETag/`If-Match` handling.
- A related allocation table will be reconsidered if repeated instances, per-allocation metadata, cross-plan queries, or capacity requirements emerge.
- The automatic rule that displays IEP versus IPP remains a separate business decision.

## Alternatives considered

- **Add a plan-module allocation table immediately:** deferred because the current requirement is distinct module membership without per-allocation data, and the existing audited field is sufficient and already used successfully.
- **Store module membership in individual Boolean columns:** rejected because every Dossier module would require a schema change.
- **Store module content as HTML or generic JSON:** rejected because it weakens validation, querying, auditing, migration, accessible rendering, and reuse.
- **Create separate IEP and IPP annual records:** rejected because both classifications use the same workflow and a student must have only one plan per school year.

## Related documentation

- [IEP/IPP capability](../../capabilities/ipp/README.md)
- [Data and integrations](../../architecture/data-and-integrations.md)
- [ADR-0001: Dataverse operational truth](0001-dataverse-operational-truth.md)
