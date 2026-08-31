# Assessment entry and scoring

**Status:** Proposed; stable Canvas App and Dataverse foundation already exists

Assessment entry is expected to be primarily a UX modernization rather than a data-platform rebuild.

## Existing foundation

- Assessment Dataverse tables and relationships are built, working, and stable.
- Existing Canvas forms contain the correct field and form visibility behaviour.
- Required PowerSchool demographic context already synchronizes into Dataverse.
- Reference tables contain governed assessment scoring results.
- Most runtime behaviour is query-and-fetch orchestration rather than complex calculation logic.

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

## Related documentation

- [Data and integrations](../../architecture/data-and-integrations.md)
- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
- [Full PoC definition](../../delivery/full-poc-definition.md)

