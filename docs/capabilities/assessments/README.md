# Assessment entry and scoring

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Capabilities](../README.md) / Assessment entry and scoring

**Status:** End-to-end Class Assignment and TOSREC lifecycle PoC complete; stable Canvas App and Dataverse foundation already exists

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
- The developer-only Current Role card includes an in-session `R` / `O` display switch. `R` uses the real student name and ASN; `O` uses `fvsd_obfuscatedname` and `fvsd_obfuscatedasn` in the Student filter, live-selection path, roster cards, and selected-student assessment heading.
- Display mode changes only the rendered identifiers. Student and section GUIDs, authorization checks, Dataverse queries, assessment-history requests, and saved data remain unchanged. Missing obfuscated values never fall back to real identifiers.

This foundation now continues into a governed TOSREC create, view, edit, and delete lifecycle while preserving the same identity, role, section, and student scope.

## TOSREC history and record lifecycle

The locked slice adds TOSREC as the first assessment-history adapter:

- A selected student's records are read from `fvsd_studenttosrecassessment` through a controlled backend endpoint.
- Results are authorized against the selected teacher section and student assignment before the assessment table is queried.
- Current Year is always the initial view; Previous Years contains every record outside the authenticated session's current school year.
- Each row presents School Year, Period, Standard Score, and Descriptive Term, and opens the complete record in a read-only modal for fields that do not belong in the compact history row.
- Descriptive Term name, fill colour, and font colour are expanded from `fvsd_descriptiveterm`, preserving the governed Dataverse presentation.
- Literacy and Foundations contexts expose TOSREC; other focus contexts remain empty until their assessment adapters are implemented.
- If the browser cookie remains valid but delegated Dataverse token acquisition requires interaction, the API returns a controlled 401 and the panel offers a Microsoft-services reconnect action instead of a generic server error.

The same typed adapter pattern will be extended to TOSWRF, TOWRE, CTOPP, LeNS, ADLOF, NLM, CELF-P, WRAT-5, and PNSA after their field variants are documented.

## End-to-end TOSREC proof

The modal uses a shared assessment-detail stage followed by an assessment-specific scoring stage:

- Assessment Type is filtered by the selected student's curriculum context and grade; TOSREC is the implemented adapter.
- The user enters Assessment Date, Period, Exempt status, and an Exempt Reason only when required. Derived identity, student, school, grade, school year, age, curriculum, course, teacher, and section values remain hidden from the user but are validated and saved.
- Period choices are constrained by Assessment Date: Fall is September 1-December 31, Winter is January 1-March 30, and Spring is April 1-June 30. March 31, July, and August do not map to an assessment period.
- For non-exempt records, Total Correct and Total Error are required reference selections. Raw Score, Standard Score, Percentile Rank, and Descriptive Term are derived from the existing `fvsd_tosrecreference` and `fvsd_descriptiveterm` records and validated again by the backend.
- Exempt records require the applicable master detail and Exempt Reason but bypass the scoring section entirely.
- Save creates or updates `fvsd_studenttosrecassessment` through the signed-in user's delegated Dataverse token, closes the modal, and reloads the selected student's history without using a cached response.
- History actions open in View mode. Edit replaces the Save action only for a record in the current operational school year and current date-derived period.
- Delete Assessment is available in View mode only to School Administration and Data Analyst roles. The API repeats authorization and scope checks, uses Dataverse concurrency information, deletes the record, and refreshes history.
- New and edited record keys use `start year|ASN|assessment type|period`, for example `2026|314899790|TOSREC|Fall`.

The API treats section number as business-recommended rather than required, matching the valid Dataverse cases where a student-section record has no section number.

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

## Locked PoC boundary - September 2, 2026

Included in this release:

- Dataverse user-role and school-assignment context.
- Role-aware School, Section Group, Course, Teacher, and Student filtering.
- Authorized teacher-section discovery and student rosters.
- Authenticated Edmonton-time current school year.
- Student focus/reset behaviour.
- TOSREC history with Current Year and Previous Years views and complete record inspection.
- Governed descriptive-term labels and colours.
- Delegated-session reconnect handling.
- TOSREC reference lookup, scoring preview, and server-side calculation validation.
- Scored and exempt TOSREC record creation.
- Current-period TOSREC editing and historical read-only enforcement.
- Role-restricted TOSREC deletion with confirmation and concurrency protection.
- Immediate assessment-history refresh after every successful mutation.

Explicitly excluded from this release:

- Additional assessment-specific adapters beyond TOSREC.
- Historical correction requests and approval workflow.
- Additional assessment-history adapters.

## Related documentation

- [Data and integrations](../../architecture/data-and-integrations.md)
- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
- [Full PoC definition](../../delivery/full-poc-definition.md)
