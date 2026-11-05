# Product capabilities

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / Capabilities

FVSD Nexus is being delivered as a set of related capabilities built on common identity, Dataverse, Fabric, design, and security foundations.

| Capability | Current status | Landing page |
|---|---|---|
| Leadership analytics | Current capability; Phase 1 design completion | [Leadership analytics](leadership-analytics/README.md) |
| School and student profiles | Planned | [Profiles](profiles/README.md) |
| Assessment entry and scoring | Current Class Assignment/TOSREC capability; additional Phase 1 adapters | [Assessments](assessments/README.md) |
| Individual Education / Individual Program Plans | Approved for implementation; modular annual-plan model confirmed | [IEP/IPP](ipp/README.md) |
| Intervention tracking | Student operational focus moving into the IEP/IPP module; aggregate analytics remains separate | [Interventions](interventions/README.md) |
| PASI provincial connector | Phase 4; feasibility discovery documented | [PASI connector](pasi-connector/README.md) |
| Purview governance and Data Analyst workspace | Phase 3; existing external agent and Fabric governance foundation identified | [Purview governance](purview-governance/README.md) |
| Platform administration | Partially present; expansion required | [Administration](administration/README.md) |

## Shared experience principles

Every capability should:

- Start from a user task or question rather than a database table or report visual.
- Adapt navigation, terminology, forms, and evidence to the signed-in user's role.
- Reuse persistent context such as school year, period, school, grade, and student where applicable.
- Use Dataverse for operational records and the Fabric semantic model for governed analytics.
- Apply authorization in the backend and destination service, not only in the interface.
- Remain usable for staff who are only occasional Power BI or Power Apps users.
- Meet accessibility and responsive-design expectations.

## Navigation structure

**Status:** Current shell pattern as of September 3, 2026

The application shell uses role-aware capability headings and can be collapsed manually on wider screens. It enters the same icon-first compact presentation automatically at narrower breakpoints.

- **Analytics:** Overview, Literacy, Numeracy, Wellness, Interventions, and Attendance for Executive. School Administration, Teacher, Classroom Support, and Data Analyst also receive Student Progression and Submission Tracking.
- **School Administration:** Class Assignments is the student entry point for assessments and annual IEP/IPP records; Assessments provides current-year completion. Student-level Intervention Focus is part of the modular plan rather than a separate operational destination.
- **Governance:** Data Analyst-only destinations for Data Quality, Data Catalog, and Data Administration. These are developed through the Phase 3 governance and agent scope.
- **Settings:** a single destination available to all roles for identity, assignment, licensing-policy, and governed connection context. The current-context summary was removed from the sidebar because filter context belongs with each capability's filters.
- **PASI provincial connector:** a Phase 4 backend integration capability rather than a general-user page; administrative status and reconciliation experiences will be available only to authorized roles.
- **Purview governance:** a Phase 3 Data Analyst workspace that composes governed documentation, data-product lifecycle, enterprise catalog, and policy-aware application functions; it is not a general-user or Purview-administration page.

Analytics and School Administration are initially expanded. Parent headings use stronger uppercase styling, while destination labels use title case. The compact state retains icons and the FVSD Nexus identity without overlaying the logo. Grouping and page visibility remain role-aware UX concerns; backend and destination-service authorization remain authoritative.

## Capability lifecycle

Each landing page should eventually contain:

1. Purpose and intended users.
2. Current and proposed scope.
3. Primary journeys and workflows.
4. Data ownership and dependencies.
5. Role and security expectations.
6. Acceptance criteria.
7. Open questions and exclusions.
8. Related decisions and implementation links.
