# School and student profiles

**Status:** Planned

Profiles will provide a role-aware entry point into the evidence and operational records relevant to a school or student.

## Intended outcomes

- Give school leaders a coherent school-level view using the same focus-area pattern as the Executive experience.
- Give authorized staff a student-level context for assessments, IPPs, interventions, and progress.
- Preserve context as users move between analytics and operational workflows.
- Avoid recreating separate, disconnected pages for the same school or student facts.

## Proposed school profile

- Persistent school, year, period, and grade context.
- Literacy, numeracy, and wellbeing focus areas.
- School-level measures and trends from the semantic model.
- Assessment completion and performance evidence.
- Navigation into authorized student and operational workflows.

## Proposed student profile

- PowerSchool-synchronized demographic and enrolment context from Dataverse.
- Assessment history and current-period entry actions.
- Current and historical IPP context where authorized.
- Intervention and progress evidence.
- Clear distinction between operational records and refreshed analytics.

## Security boundary

Profile visibility must be determined by delegated identity and destination-service authorization. Hiding a profile link or field in React is not sufficient protection.

## Open questions

- Final role-to-profile access matrix.
- Which demographic attributes are appropriate for each role.
- The initial student-profile scope for the February PoC.
- Whether profile navigation starts from school, class, caseload, or search for each role.

## Related documentation

- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
- [Assessment entry and scoring](../assessments/README.md)
- [Individual Program Plans](../ipp/README.md)

