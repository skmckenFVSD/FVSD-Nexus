# Identity, licensing, and security

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Architecture](README.md) / Identity, licensing, and security

## Identity premise

Users act as themselves. Interactive student-data access must use the named FVSD identity rather than a pooled system identity.

## Intended operational sign-in sequence

1. Authenticate the user with FVSD Entra ID.
2. Establish that the user has the required Power Apps entitlement.
3. Obtain a delegated Dataverse token for the user.
4. Confirm that the Dataverse user is enabled and has the required security roles.
5. Permit only the records and operations authorized for that identity.

## Licensing

FVSD currently uses Power Apps pay-as-you-go.

Obtaining an OAuth token for Dataverse and registering a Power Apps pay-as-you-go app launch are separate mechanisms. A supported metering pattern for an external Azure-hosted application must be confirmed before operational implementation.

If that pattern is unsuitable, the proposed fallback is:

- Assign Power Apps Premium per user.
- Query Microsoft Graph for the signed-in user's assigned SKU and enabled service plans.
- Enforce the licence prerequisite in the backend before enabling Dataverse operations.

A Graph licence check establishes entitlement; it does not grant record access. Dataverse remains responsible for effective permissions.

Analytics-only Fabric access and operational Dataverse access may be gated separately.

## Authorization layers

| Layer | Responsibility |
|---|---|
| React | Present only relevant pages, forms, fields, and actions. |
| Nexus API | Validate session, licence prerequisite, workflow state, and requested operation. |
| Dataverse | Enforce effective table, record, team, business-unit, and column permissions. |
| Fabric | Enforce semantic-model permissions and analytical RLS. |

Access is not granted merely because a control is visible. Conversely, hiding a control does not secure the underlying data.

## Nexus role scopes

| Role | Governed visibility | Assignment source | Implementation |
|---|---|---|---|
| Executive | All schools, sections, and students. | Division-wide scope. | Active. |
| School Administrator | All data within the schools assigned to the user. | `fvsd_userrole.fvsd_assignmentone` and `fvsd_assignmenttwo`. | Active. |
| Teacher | Teacher sections whose teacher system-user UPN matches the signed-in UPN, plus the students in those sections. | `fvsd_teachersection.fvsd_teacher`. | Active. |
| Student Support | Support staff sections and the relevant student records contained in those sections. | Planned Support Staff Sections table. | Planned; access remains closed until the relationship is implemented. |
| Specialist Support | Student records individually assigned to the specialist. | Planned specialist-to-student assignment table. | Planned; access remains closed until the relationship is implemented. |
| Data Administrator | Full operational visibility and governed Microsoft Fabric access. | Nexus data-administration assignment plus Fabric authorization and RLS. | Active. |

Legacy labels such as `Data Analyst (Administrator)` and `Class Room Support` are normalized at the application boundary while Dataverse values are migrated. They are not new authorization scopes.

## Role simulation

The developer-only role switcher exists to test experience variations. It does not change the signed-in identity or override Fabric RLS. The server-side developer allowlist remains authoritative; during the current build it contains only Scott McKenzie. Student-name obfuscation is also a preview control and does not change the underlying record authorization.

## Operational integrity

- Normal assessment records are editable only in the current operational period.
- Historical correction requires a controlled administrative request.
- Every create or update must be attributable to the signed-in user.
- Dataverse audit history should be enabled for applicable operational tables and columns.
- Concurrency behaviour must prevent unnoticed overwrites.

## Secret management

- Local secrets belong in the .NET user-secret store or ignored environment configuration.
- Azure secrets belong in Key Vault and should be referenced by the application.
- Never commit access tokens, client secrets, certificates, connection strings, or student data.

## Telemetry

Application telemetry may include route, duration, result status, dependency type, and correlation identifiers. It must not intentionally include:

- Student names or identifiers.
- Assessment responses or IPP narrative.
- Access or refresh tokens.
- Raw Dataverse payloads.
- DAX results containing student-level information.

## Open decisions

- Supported pay-as-you-go metering or Power Apps Premium adoption.
- Final Entra group, Dataverse role, Fabric role, and Nexus experience-role mapping for the two planned support roles.
- Licence verification permissions, refresh interval, and failure behaviour.
- Administrative correction approval roles.
