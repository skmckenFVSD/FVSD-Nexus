# Leadership analytics

**Status:** Current working PoC

Leadership analytics is the first implemented FVSD Nexus capability. It presents governed Fabric semantic-model measures through a guided application experience rather than embedding a conventional Power BI report.

## Purpose

Help Executive and school leaders move from district-level signals to the schools, grades, periods, and assessment groups requiring attention.

## Current implementation

- Microsoft Entra single-tenant sign-in.
- Delegated Fabric access using the signed-in user's identity.
- Existing Fabric permissions and RLS remain effective.
- Predefined DAX queries against `FVSDAnalytics` in the `Assessment Screening` workspace.
- Multi-select school year, period, school, and grade context.
- Role-aware school visibility.
- Literacy and numeracy focus selection.
- Assessment-group-controlled matrix and chart visibility.
- School, school year, and grade comparison matrix.
- Matrix-row selection that focuses the corresponding chart.
- Responsive chart layouts and contextual Executive signals.
- Developer-only role simulation for experience and RLS testing.

Current PoC endpoint:

<https://app-fvsd-insights-iwmpkez4.azurewebsites.net/>

## Current literacy pattern

- TOSREC and TOWRE are available for applicable Grades 1 to 12 contexts.
- CTOPP is shown only when applicable, including Kindergarten context.
- Charts with no data do not render.
- School year is the lowest chart grouping beneath period when multiple years are selected.
- The selected assessment group controls both the matrix and visible chart.
- Descriptive terms are grouped into the Foundation and Curriculum cohorts.

## Experience principles

- Measures remain defined in the semantic model.
- The application sends only predefined server-side queries.
- No general-purpose DAX endpoint is exposed.
- The visual hierarchy prioritizes focus area, signals, matrix evidence, and a focused chart.
- Detailed Power BI knowledge is not expected from the user.

## Next capability work

- Replicate the pattern for the School Profile experience.
- Complete Numeracy and later Wellbeing focus areas.
- Replace prototype Executive signals with fully governed signal rules.
- Define role-specific titles, pages, and evidence for additional user groups.
- Add accessible detail and export patterns where required.

## Related documentation

- [Architecture overview](../../architecture/overview.md)
- [Data and integrations](../../architecture/data-and-integrations.md)
- [Testing strategy](../../delivery/testing-strategy.md)

