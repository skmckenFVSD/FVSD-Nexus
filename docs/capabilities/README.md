# Product capabilities

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / Capabilities

FVSD Nexus is expected to grow as a set of related capabilities built on common identity, Dataverse, Fabric, design, and security foundations.

| Capability | Current status | Landing page |
|---|---|---|
| Leadership analytics | Working PoC | [Leadership analytics](leadership-analytics/README.md) |
| School and student profiles | Planned | [Profiles](profiles/README.md) |
| Assessment entry and scoring | Locked and deployed Class Assignment/TOSREC history PoC | [Assessments](assessments/README.md) |
| Individual Program Plans | Proposed; majority of Dataverse foundation exists | [IPP](ipp/README.md) |
| Intervention tracking | Future definition required | [Interventions](interventions/README.md) |
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

**Status:** Current shell pattern as of September 1, 2026

The application shell groups pages beneath collapsible capability headings:

- **Analytics:** all existing analytical destinations, including the Executive overview.
- **Assessments:** contains the locked role-scoped Class Assignment workspace, student roster, and read-only TOSREC history; assessment forms and writes follow later.
- **Individual Program Plans:** reserved for IPP workflows.
- **Interventions:** reserved for future intervention workflows.
- **Administration:** settings and future authorized administration pages.

Analytics, Assessments, and Administration are initially expanded. The other capability groups can be expanded and currently explain that their pages will be added as the PoC progresses. Grouping and page visibility remain role-aware UX concerns; backend and destination-service authorization remain authoritative.

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
