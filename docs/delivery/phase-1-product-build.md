# Phase 1 product build

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Delivery](README.md) / Phase 1 product build

**Status:** Active implementation

Phase 1 establishes the supported Nexus application foundation and completes the capabilities already approved for the next school year. It turns the validated vertical slices into a coherent product rather than a collection of demonstrations.

## Outcomes completed to date

- FVSD Entra sign-in and named-user delegated access to Fabric and Dataverse.
- Role-aware, responsive application shell and navigation.
- Leadership Analytics over governed `FVSDAnalytics` measures.
- Class Assignment filters, teacher sections, student selection, and assessment history.
- Current-year TOSREC completion monitoring and missing-student lists.
- TOSREC creation, governed reference scoring, exemption handling, current-period editing, historical viewing, and controlled deletion.
- Shared filter context between Class Assignments and Assessments.
- One annual IEP/IPP master record per student and school year.
- Governed modular IEP/IPP selection using `fvsd_ippsection` definitions.
- Live Student Details, Screener Results, Signatures, and Intervention Focus plan sections.

## Remaining Phase 1 work

### Fabric integration and analytics design

- Finish the approved Leadership Analytics pages and role-specific views.
- Complete the predefined semantic-model query catalogue and remove temporary page states.
- Confirm analytical refresh, RLS, performance, accessibility, and error behaviour.
- Document the semantic measures and lineage surfaced in Nexus.

### Class Assignments and assessments

- Complete the assessment adapters and grade/period requirements beyond TOSREC.
- Add the governed TOWRE, WRAT-5, and other agreed assessment-entry experiences.
- Complete administrative amendment workflows and required audit evidence.
- Validate completion counts, student history, and calculated results against current operational sources.

### IEP / IPP

- Complete the core annual-plan modules based on the working Educational Framework Canvas app.
- Add structured entry and update experiences for goals, activities, notes, coding, comments, and other approved Phase 1 sections.
- Generate print/PDF output inside Nexus from structured records, without the current Power Automate and OneDrive conversion chain, while retaining required DocuSign anchors.
- Complete a server-side Playwright/Chromium rendering spike and confirm Azure hosting, storage, accessibility, retention, and performance decisions.
- Define plan status, review, approval, export, and historical read-only behaviour.
- Confirm the rule that classifies the shared annual record as an IEP or IPP.

### Product readiness

- Complete the role and permission matrix.
- Confirm licensing, privacy, Canadian residency, audit, accessibility, telemetry, backup, recovery, and operational support requirements.
- Conduct representative school and role testing while incumbent workflows remain available.
- Prepare deployment, migration, training, support, and rollback runbooks.

## Phase 1 acceptance evidence

- Critical journeys pass automated and representative user testing.
- Named-user authorization is enforced by Nexus and the destination service.
- Dataverse remains the immediate operational confirmation source; Fabric refresh is not presented as transaction confirmation.
- Scoring and completion results match governed reference data and current business rules.
- The IEP/IPP screen and exported document are explainably derived from the same structured records.
- Keyboard, screen-reader, responsive, privacy, security, failure, and recovery behaviour meet the agreed readiness threshold.
- Leadership, school administrators, teachers, and support owners understand the release boundary and unresolved items.

## Phase boundary

Phase 1 does not silently include the full Dossier migration, Microsoft 365 Copilot integration, or the PASI connector. Those are explicit later phases with their own authorization, contracts, testing, privacy, and operational gates.
