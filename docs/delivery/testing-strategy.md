# Testing strategy

FVSD Nexus requires evidence at the UX, API, service-security, data-integrity, and analytical layers.

## Test layers

| Layer | Primary evidence |
|---|---|
| Unit | Validation, period rules, scoring-key derivation, mapping, and signal logic. |
| Component | Form visibility, required/read-only states, filters, charts, matrices, and accessible feedback. |
| API integration | Authentication session, delegated service calls, validation, error mapping, and health behaviour. |
| Dataverse integration | Effective permissions, create/update, auditing, concurrency, and correction workflow. |
| Fabric integration | Predefined DAX results, filter propagation, RLS, and semantic-model parity. |
| End-to-end | Representative user journeys across role, student, assessment, IPP, and analytics contexts. |
| Migration | Counts, relationships, history, attachments, exception reports, and repeatability. |
| Accessibility | Keyboard, focus order, labels, contrast, zoom/reflow, screen-reader-critical paths. |
| Performance | Interactive response, reference lookups, large grids, publish output, and service dependency timing. |
| Security/privacy | Authorization bypass attempts, token handling, telemetry review, and least-privilege access. |

## Parity testing

### Assessment

- Use known students and test cases permitted for the environment.
- Compare raw inputs, lookup context, SS, percentile, and descriptive term with the existing Canvas App.
- Include boundary, invalid, missing, and historical-period cases.
- Verify that reference changes do not rewrite historical results.

### Analytics

- Compare Nexus results with the existing Power BI report under equivalent filters and identity.
- Test multiple years, periods, schools, grades, and assessment groups.
- Verify no-data chart suppression and matrix-to-chart selection.
- Repeat under representative RLS identities.

### IPP

- Compare representative plans and progress histories with the vendor system.
- Verify chronological order, ownership, status, evidence, and printable output.
- Re-run migration to prove that it is controlled and repeatable.

## Pilot testing

The March-June pilot should include:

- Multiple schools and representative roles.
- Staff with varying technical confidence.
- Structured tasks rather than only open-ended exploration.
- Feedback severity and ownership.
- Documented decisions for accepted limitations.
- Parallel-system comparison before retirement decisions.

## Current baseline

At repository migration:

- 23 ASP.NET Core tests pass.
- The React production build succeeds.
- npm reports no vulnerabilities in the active web project.
- ASP.NET publish successfully bundles the React application.

These checks are a baseline, not a complete operational test suite.
