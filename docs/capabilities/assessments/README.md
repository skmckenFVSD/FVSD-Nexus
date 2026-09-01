# Assessment entry and scoring

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Capabilities](../README.md) / Assessment entry and scoring

**Status:** Class Assignment and read-only TOSREC history PoC locked and deployed; stable Canvas App and Dataverse foundation already exists

Assessment entry is expected to be primarily a UX modernization rather than a data-platform rebuild.

## Existing foundation

- Assessment Dataverse tables and relationships are built, working, and stable.
- Existing Canvas forms contain the correct field and form visibility behaviour.
- Required PowerSchool demographic context already synchronizes into Dataverse.
- Reference tables contain governed assessment scoring results.
- Most runtime behaviour is query-and-fetch orchestration rather than complex calculation logic.

## Current Nexus vertical slice

The first Class Assignment slice translates the existing Canvas collection logic into a secured React and ASP.NET Core flow:

```text
Signed-in User Role
  -> permitted/default School
  -> Section Group
  -> Course Name
  -> Teacher Section
  -> assigned Students
```

- `fvsd_userrole` establishes role, school assignments, PoC access, and signed-in identity context.
- Teacher sections come from `fvsd_teachersection` and their related `fvsd_teacherdetail` records.
- Only sections with active `fvsd_studentsection` assignments are presented.
- Course ordering reuses `fvsd_powerschoolsectionmapping.fvsd_sortorder`.
- Selecting a teacher section loads its related `fvsd_studentdetail` roster.
- School, Section Group, Course, Teacher, and Student controls follow the existing cascade and reset behaviour.
- The backend validates school and teacher scope before returning operational data; the browser cannot submit arbitrary OData.
- School selection alone does not load class assignments. Section Group must be selected before Course and matching teacher sections are requested, reducing unnecessary Dataverse calls.
- Selecting a teacher section loads a three-column, internally scrolling student roster; selecting a student replaces the class roster with a focused student record and assessment panel.
- Back to class list clears the selected student, restores the full roster, hides assessment history, and resets the history view to Current Year.

This slice intentionally stops before assessment forms and Dataverse writes. It proves identity, role scope, cascading discovery, roster loading, and governed read-only history first.

## Read-only TOSREC history

The locked slice adds TOSREC as the first assessment-history adapter:

- A selected student's records are read from `fvsd_studenttosrecassessment` through a controlled backend endpoint.
- Results are authorized against the selected teacher section and student assignment before the assessment table is queried.
- Current Year is always the initial view; Previous Years contains every record outside the authenticated session's current school year.
- Each row presents School Year, Period, Standard Score, and Descriptive Term. Assessment date, grade at assessment, raw score, and exemption state remain available in the typed API model for later UX refinement.
- Descriptive Term name, fill colour, and font colour are expanded from `fvsd_descriptiveterm`, preserving the governed Dataverse presentation.
- Literacy and Foundations contexts expose TOSREC; other focus contexts remain empty until their assessment adapters are implemented.
- If the browser cookie remains valid but delegated Dataverse token acquisition requires interaction, the API returns a controlled 401 and the panel offers a Microsoft-services reconnect action instead of a generic server error.

The same typed adapter pattern will be extended to TOSWRF, TOWRE, CTOPP, LeNS, ADLOF, NLM, CELF-P, WRAT-5, and PNSA after their field variants are documented.

## Authenticated school-year context

FVSD Nexus establishes one operational school year when the user signs in:

- January through July resolves to the preceding year and current year.
- August through December resolves to the current year and following year.
- The boundary is evaluated in the `America/Edmonton` time zone.
- The resulting value is stored in the authenticated session as `fvsd:current_school_year` and exposed by `/api/me` as `currentSchoolYear`.
- Navigation and development-role switching do not recalculate or overwrite the value during the active session.

This operational context is separate from the analytics school-year filter, which may intentionally include one or more historical years.

## Primary journey

```text
Select student
  -> Select assessment
  -> Render the applicable form
  -> Validate inputs
  -> Derive lookup keys
  -> Query governed Dataverse reference tables
  -> Preview score and classification
  -> Save the complete assessment context to Dataverse
```

The interaction deliberately mirrors the working analytics pattern in which selecting TOSREC changes the matrix and chart beneath the selector.

## Shared form capabilities

- Student, school, school year, and period context.
- Assessment-specific form rendering.
- Conditional field and form visibility.
- Required and read-only field rules.
- Immediate, accessible validation messages.
- Existing-record and duplicate-submission checks.
- Reference lookup and scoring preview.
- Create, update, cancel, and read-only states.
- Delegated-user attribution and Dataverse auditing.

Critical validation must also be enforced by Dataverse or the backend. Interface visibility is not a security or integrity boundary.

## Scoring pattern

| Assessment | Calculation and reference lookup |
|---|---|
| TOSREC | `Correct - Incorrect`, then Grade + Period + Raw Score |
| TOSWRF | Chronological Age + Period + Raw Score |
| TOWRE | Age + SWE to RW SS; Age + PDE to NW SS; combined subtest scores to composite |
| WRAT-5 | Form Colour + Age + calculated Raw Score to SS; then SS to percentile |
| Descriptive term | Standard Score to term, range, fill colour, font colour, and cohort group |

CTOPP and numeracy assessments can use the same form-and-reference adapter pattern once their fields and lookup keys are documented.

## Historical scoring integrity

Each saved result should preserve the inputs and context used when it was scored:

- Assessment date.
- Grade, chronological age, and period.
- Raw and composite values.
- Standard score and percentile.
- Descriptive term and cohort group.
- Applicable reference-table version or effective context where available.

A later PowerSchool sync or reference-table update must not silently alter a historical assessment.

## Record lifecycle

```text
Current-period record -> Create or edit permitted
Closed-period record  -> Read-only
Historical error      -> Administrative correction request
Approved correction   -> Controlled change with audit history
```

Editability is determined from the record's actual period and authoritative current-period configuration, not a period selected in an analytics filter.

An administrative correction should retain the requester, reason, original and proposed values, approval decision, administrator completing the correction, and final before/after history.

## Initial acceptance direction

- A permitted user can select a student and see only applicable assessments.
- The correct form and visibility rules are applied.
- Known test inputs return the same results as the existing Canvas App and reference tables.
- Current-period records can be created and corrected by permitted users.
- Historical records remain read-only outside the administrative correction workflow.
- Every write is attributable to the signed-in user.

## Locked PoC boundary - September 1, 2026

Included in this release:

- Dataverse user-role and school-assignment context.
- Role-aware School, Section Group, Course, Teacher, and Student filtering.
- Authorized teacher-section discovery and student rosters.
- Authenticated Edmonton-time current school year.
- Student focus/reset behaviour.
- Read-only TOSREC history with Current Year and Previous Years views.
- Governed descriptive-term labels and colours.
- Delegated-session reconnect handling.

Explicitly excluded from this release:

- Assessment data-entry forms.
- Reference-table scoring previews.
- Dataverse creates or updates.
- Current-period edit enforcement and historical correction requests.
- Additional assessment-history adapters.

## Related documentation

- [Data and integrations](../../architecture/data-and-integrations.md)
- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
- [Full PoC definition](../../delivery/full-poc-definition.md)
