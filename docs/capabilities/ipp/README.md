# Individual Program Plans

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Capabilities](../README.md) / Individual Program Plans

**Status:** Static Foundations 1 design preview available; operational capability proposed; approximately 80% of the anticipated Dataverse foundation already exists

The IPP capability would replace the current third-party user experience while retaining Dataverse as the FVSD operational truth store.

## Current design preview

The Nexus navigation includes a view-only **Foundations 1 preview** under Individual Program Plans. It adapts the proposed printable IPP format into the Nexus shell and demonstrates:

- Student and reporting context.
- TOSREC and TOWRE screener evidence.
- Cohort placement and intervention focus.
- Empower Reading goal ratings.
- Word Study term tracking.
- Writing snapshot, teacher summary, and sign-off sections.
- A return path to Class Assignment representing the intended future student-to-plan journey.

All displayed values are illustrative. The preview does not query Dataverse, create or update a plan, load question definitions, enforce workflow rules, or represent accurate live student data. The builder and student-linked navigation remain future work.

## Current premise

- Existing Dataverse structures cover most required IPP information.
- The current estimate is no more than approximately ten additional tables.
- Required PowerSchool demographic context already synchronizes to Dataverse.
- The principal delivery work is expected to be UX, workflow, and controlled migration rather than foundational integration.

## Anticipated capability areas

- Plan creation and lifecycle.
- Goals, objectives, and baselines.
- Progress observations and evidence.
- Assigned staff and collaborative work.
- Review cycles, status, and approval history.
- Attachments and supporting documentation.
- Printable or exportable plans and progress summaries.
- Role-aware student and school access.
- Historical data migration from the existing third-party system.

## Experience direction

- Start from the authorized student's profile or staff caseload.
- Allow an authorized Class Assignment user to open the selected student's current plan without rebuilding the student context as a separate filter workflow.
- Present the current plan, required actions, and recent progress clearly.
- Use progressive disclosure so occasional users are not confronted with the entire data structure.
- Reuse the same form, validation, audit, and status patterns established for assessment entry.
- Separate current operational values from Fabric analytics that update through OneLake.

## Discovery priorities

1. Inventory every current vendor workflow, including less-visible administrative behaviour.
2. Confirm the remaining Dataverse tables and relationships.
3. Determine plan versioning and amendment rules.
4. Confirm attachment, evidence, retention, and export requirements.
5. Obtain and validate a complete historical-data export.
6. Define the staff, school, student, and administrative access matrix.
7. Establish parallel-run and migration acceptance criteria.

## Primary risks

- Incomplete vendor exports or undocumented workflows.
- Historical plan and progress versioning.
- Attachment volume and retention requirements.
- Concurrent editing and approval behaviour.
- Reproducing printable outputs relied upon by staff.
- Support and product ownership after vendor retirement.

## PASI relationship

The proposed [PASI connector](../pasi-connector/README.md) could materially strengthen the case for replacing third-party IPP and related student-support tooling, but the boundaries must remain explicit:

- Nexus IPP owns plan, goal, progress, review, approval, and export workflows.
- PASI integration owns only provincially supported and FVSD-authorized exchanges.
- Discovery must identify which current Intellimedia, Jigsaw, and PowerSchool functions depend on PASI.
- No assumption has been made that an IPP document or every IPP field is submitted to PASI.
- PASI connector tables and IPP tables should be designed only after the provincial operation and retention requirements are confirmed.

## Related documentation

- [Profiles](../profiles/README.md)
- [Data and integrations](../../architecture/data-and-integrations.md)
- [Proposed roadmap](../../delivery/roadmap.md)
- [PASI provincial connector](../pasi-connector/README.md)
