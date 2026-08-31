# FVSD Nexus

FVSD Nexus is the proposed unified operational and analytics platform for Fort Vermilion School Division. It is intended to give staff a purpose-built experience for moving from governed evidence to action without requiring them to understand Power BI report mechanics.

The repository begins with the locked Leadership Analytics proof of concept formerly called **FVSD Insights**. That PoC proves that a custom React application can securely query the existing `FVSDAnalytics` Fabric semantic model, respect the signed-in user's Fabric permissions and row-level security, and present its governed measures in a more approachable format than a conventional Power BI report.

> **Current status — August 31, 2026:** The Leadership Analytics PoC is complete and deployed for Leadership discussion. The broader assessment-entry and IPP capabilities described below are proposed direction and have not yet been authorized for implementation.

## Vision

FVSD Nexus can grow into one coherent, role-aware experience spanning:

- Leadership and school analytics.
- Student assessment entry and scoring.
- School and student profiles.
- Literacy, numeracy and wellbeing evidence.
- Individual Program Plan (IPP) creation and progress monitoring.
- Intervention planning and tracking.
- Governed analytics from the existing Fabric semantic model.

The objective is not to replace Dataverse, Fabric or Power Platform licensing. Nexus would provide a better user experience over those governed services.

## Architectural premises

The following premises guide future design decisions:

1. **Dataverse remains the operational system of record.** Assessment, IPP and related operational records are created and maintained in Dataverse.
2. **The Fabric semantic model remains the calculation and analytics layer.** Existing DAX measures continue to define governed results; the application does not recreate them with simplified row counts or client-side sums.
3. **Users act as themselves.** Interactive data access uses named FVSD identities and delegated tokens. A shared system identity must not be used to conceal the people reading or changing student information.
4. **Authorization is enforced by the service.** React visibility rules improve the experience but are not a security boundary. The ASP.NET Core API, Dataverse security and Fabric RLS remain authoritative.
5. **Canadian data residency is a non-negotiable boundary.** Identifiable student data, assessment records, IPP information and student-level AI context must not be moved to a US-hosted environment to gain access to preview tooling.
6. **Existing stable structures are reused.** The assessment Canvas App, Dataverse tables, PowerSchool synchronization, reference tables and semantic model are established assets—not systems to rebuild without cause.
7. **Operational saves and analytics refreshes are different concerns.** A successful write is confirmed directly from Dataverse. Fabric reflects Dataverse changes through the existing low-latency OneLake connection, currently observed at approximately 15 minutes.

## Current proof of concept

The current vertical slice provides:

- Microsoft Entra single-tenant sign-in using a secure server-side session cookie.
- Delegated Power BI/Fabric access so the signed-in user's permissions and RLS remain effective.
- Predefined server-side DAX queries against `FVSDAnalytics` in the `Assessment Screening` workspace.
- Governed school comparison data using existing semantic-model measures.
- Multi-select school year, period, school and grade context.
- Literacy assessment views for TOSREC, TOWRE and applicable CTOPP data.
- Assessment-group-controlled matrix and chart visibility.
- Matrix-to-chart selection for focused school, school year and grade analysis.
- A developer-only role simulator for testing role-aware UX and RLS behaviour.
- Responsive charts, comparison matrices and contextual signals.
- Azure App Service, Key Vault, Application Insights, Log Analytics and Bicep/Azure Developer CLI deployment assets.

Current PoC endpoint:

<https://app-fvsd-insights-iwmpkez4.azurewebsites.net/>

The Azure resources retain their existing `fvsd-insights` identifiers while the product and active source solution move forward as FVSD Nexus. Renaming deployed resources is not required for the repository transition and could create unnecessary operational risk.

## Decision register

| Status | Decision or question |
|---|---|
| Confirmed | Keep the current Leadership Analytics PoC locked for discussion. |
| Confirmed | Use Dataverse as the operational truth store and Fabric as the governed analytical layer. |
| Confirmed | Reuse the existing assessment, PowerSchool synchronization and Dataverse structures. |
| Confirmed | Do not move identifiable student data across the approved Canadian geographic boundary. |
| Confirmed | Require named-user authentication, licensing, authorization and auditability for operational access. |
| Proposed | Expand Nexus to replace the assessment Canvas UX and, subject to approval, the third-party IPP experience. |
| Proposed | Deliver a complete testable PoC by the end of February 2027 and target phased production use in September 2027. |
| Open | Obtain formal Leadership authorization and confirm the first implementation scope. |
| Open | Confirm a supported pay-as-you-go metering pattern for the Azure-hosted app or adopt Power Apps Premium per user. |
| Open | Complete the third-party IPP capability and historical-data migration inventory. |
| Monitor | Reconsider Power Apps Vibe or Fabric Apps/Rayfin when Canadian production availability and residency requirements are satisfied. |

## Platform architecture

```text
FVSD user
   │
   ▼
FVSD Nexus — React / TypeScript
   │
   ▼
ASP.NET Core backend-for-frontend
   ├── Delegated Dataverse access
   │      Assessments, IPPs, reference tables, workflow and auditing
   │
   └── Delegated Fabric access
          Governed DAX measures, trends, comparisons and signals

PowerSchool ── existing synchronization ──► Dataverse
Dataverse  ── low-latency OneLake link ──► Fabric ──► FVSDAnalytics
```

The browser calls only same-origin, purpose-built endpoints. ASP.NET Core obtains delegated service tokens and sends predefined queries to the appropriate Microsoft service. Access tokens and arbitrary DAX are never exposed to the browser.

## Data foundations

### Dataverse

Dataverse is the de facto truth store for operational student records.

- The assessment tables and relationships used by the existing Canvas App are built, working and stable.
- Existing assessment forms contain the correct field visibility and contextual behaviour.
- Most assessment behaviour is query-and-fetch orchestration rather than complex calculation logic.
- Approximately 80% of the anticipated IPP capability can use existing Dataverse structures.
- The current estimate is no more than approximately ten additional tables for the remaining IPP information.

### PowerSchool

Required demographic information already synchronizes from PowerSchool into Dataverse tables. Nexus should query the synchronized Dataverse representation instead of repeatedly calling the PowerSchool Web API during interactive workflows.

### OneLake and Fabric

The Dataverse-to-OneLake connection is established and uses the newer low-latency model. The environment currently observes approximately 15 minutes for changes to appear in the analytical layer.

### Semantic model

- **Workspace:** `Assessment Screening`
- **Semantic model:** `FVSDAnalytics`
- **Purpose:** governed measures, calculation logic, terminology and RLS-aware analytical results.

The application must not expose a general-purpose DAX execution endpoint. Each experience should map a clear user question to predefined server-side queries.

## Proposed operational expansion

### Assessment entry

The existing Canvas App is not a data-platform migration. It is principally a UX modernization over stable Dataverse structures.

The intended interaction pattern mirrors the assessment selector already proven in the analytics PoC:

```text
Select student
   ▼
Select assessment
   ▼
Render the applicable assessment form
   ▼
Validate input and derive lookup keys
   ▼
Query governed Dataverse reference tables
   ▼
Preview score and classification
   ▼
Save the complete assessment context to Dataverse
```

Shared assessment capabilities should include:

- Student, school, school year and period context.
- Assessment-specific form selection.
- Conditional field and form visibility.
- Input validation and friendly error messages.
- Reference-table lookup and scoring preview.
- Existing-record and duplicate-submission checks.
- Create, update, cancel and read-only states.
- Delegated-user attribution and Dataverse auditing.

Critical validation should be enforced by Dataverse or the backend even when React also provides immediate feedback.

### Scoring model

Most scoring is intentionally data-driven. The application validates inputs, derives lookup keys, fetches the governed reference result and saves the scoring context.

| Assessment | Calculation and reference lookup pattern |
|---|---|
| TOSREC | `Correct - Incorrect`, then Grade + Period + Raw Score |
| TOSWRF | Chronological Age + Period + Raw Score |
| TOWRE | Age + SWE to RW SS; Age + PDE to NW SS; combined subtest scores to composite |
| WRAT-5 | Form Colour + Age + calculated Raw Score to SS; then SS to percentile |
| Descriptive term | Standard Score to term, range, fill colour, font colour and cohort group |

Additional assessments, including CTOPP and numeracy assessments, can follow the same form-and-reference adapter pattern once their inputs and lookup keys are documented.

Each saved result should preserve the inputs and scoring context used at the time of assessment, including grade, chronological age, period, raw/composite values, standard score, percentile and descriptive term. Historical results must not silently change after a PowerSchool sync or reference-table update.

### Assessment record lifecycle

Normal users may create or edit assessment records only in the current operational period.

```text
Current-period record ──► Create or edit permitted
Closed-period record  ──► Read-only
Historical error      ──► Administrative correction request
Approved correction  ──► Controlled change with audit history
```

Editability must be determined from the record's actual period and the authoritative current-period configuration—not from a dashboard filter selected in the browser.

An administrative correction should retain the requesting user, reason, original and proposed values, approval decision, administrator completing the correction and final before/after history.

### IPP capability

IPP is expected to extend the same Dataverse truth store rather than create a separate platform. Anticipated experiences include:

- Plans, goals, objectives and baselines.
- Progress observations and evidence.
- Assigned staff and collaborative workflows.
- Review cycles, status and approval history.
- Attachments and supporting documentation.
- Printable or exportable plans and progress summaries.
- Role-aware student and school access.
- Historical migration from the existing third-party system.

The principal work is expected to be UX, workflow and the limited remaining Dataverse extension. Data migration, plan versioning, attachment handling and less-visible vendor workflows remain important discovery items.

## Identity, licensing and authorization

FVSD currently uses Power Apps pay-as-you-go. The intended condition for operational Nexus access is that every user is individually authenticated and appropriately licensed.

The desired access sequence is:

1. Authenticate the user with FVSD Entra ID.
2. Establish that the user has an appropriate Power Apps entitlement.
3. Obtain a delegated Dataverse token for that user.
4. Confirm that the Dataverse user is enabled and has the required security roles.
5. Permit only the records and operations authorized for that identity.

Obtaining a Dataverse token and registering Power Apps pay-as-you-go usage are separate concerns. The supported metering mechanism for an external Azure-hosted application must be confirmed before operational implementation.

If pay-as-you-go registration is unsuitable, the proposed fallback is to assign **Power Apps Premium** per user and verify the assigned licence/service plan through Microsoft Graph. Dataverse remains responsible for the user's effective record and operation permissions.

Fabric-only analytics access and Dataverse operational access may be gated separately when appropriate.

## Security and privacy principles

- Use delegated user access for interactive student-data operations.
- Keep secrets in local .NET user secrets or Azure Key Vault; never commit them.
- Enforce authorization in the backend and destination service.
- Treat hidden UI controls as convenience, not security.
- Retain Dataverse audit history for operational changes.
- Do not log student-level payloads, access tokens or sensitive assessment responses to application telemetry.
- Keep production student data and student-identifiable AI context inside the approved Canadian geography.
- Use synthetic data for evaluation of tooling hosted outside Canada.

## Regional product constraints

As of August 31, 2026:

- [Power Apps Vibe](https://learn.microsoft.com/en-us/power-apps/vibe/overview) remains a preview and is not available in the Canadian Power Platform region.
- [Fabric Apps/Rayfin](https://learn.microsoft.com/en-us/fabric/admin/region-availability) remains a preview and is not available in Canada Central or Canada East.
- FVSD will not move production student data to a US environment to use either preview.

Both products remain potential future hosting or development options when Canadian availability, production support, data processing boundaries, licensing, source portability and ALM requirements are satisfied. The current React/TypeScript architecture preserves a practical migration path to Rayfin if it becomes appropriate.

## Proposed delivery horizon

The working horizon discussed for Leadership consideration is:

| Period | Proposed outcome |
|---|---|
| September–October 2026 | Confirm scope, workflow inventory, UX patterns, security and migration requirements. |
| November–December 2026 | Build assessment-entry replacement and reusable operational form components. |
| January–February 2027 | Complete core IPP workflows, representative migration and the end-to-end full PoC. |
| March–June 2027 | Wider front-facing parallel user testing and refinement. |
| July–August 2027 | Remediation, migration rehearsal, security/performance testing, documentation and training. |
| September 2027 | Target phased production deployment, subject to readiness gates and approval. |

The February target means a complete, end-to-end testable system. Production deployment remains gated by migration accuracy, security, usability, accessibility, support readiness and Leadership approval.

## Repository structure

```text
FVSD-Nexus/
├── src/
│   ├── FVSDNexus.Api/          ASP.NET Core backend-for-frontend
│   └── FVSDNexus.Web/          React and TypeScript user interface
├── tests/
│   └── FVSDNexus.Api.Tests/    API, role and semantic-query tests
├── infra/                      Azure Bicep infrastructure
├── scripts/                    Entra and environment configuration
├── .azure/                     Deployment plan; local azd state is ignored
└── FVSD Insights (Vibe Code Sample)/
                                Original exported Vibe prototype retained
                                as design and interaction reference
```

The active solution is `FVSDNexus.sln`. Historical prototype names and the existing Azure resource identifiers remain unchanged intentionally.

## Local development

### Prerequisites

- .NET 8 SDK.
- Node.js 20 or later.
- Azure CLI.
- Azure Developer CLI.
- Access to the FVSD Entra tenant and the required Fabric workspace/model.

### Authentication and configuration

Sign in and select the existing Azure subscription:

```powershell
az login --tenant 42242eff-faf6-4ccd-aea3-e2c4479f8ccb
az account set --subscription 64b2bfe8-fb82-4105-991c-95a36ad469c5
azd auth login
```

Configure the existing Entra registration and place its secret in the local .NET user-secret store and ignored azd environment:

```powershell
.\scripts\configure-entra-app.ps1 -ClientId b9a8631e-8e03-4204-8d7e-a487bfe33b2f
```

An Entra administrator must grant tenant consent for delegated Power BI `Dataset.Read.All`. Users also need Read and Build permission on `FVSDAnalytics`.

### Run locally

Run the API and React development server in separate terminals:

```powershell
dotnet run --project .\src\FVSDNexus.Api
```

```powershell
npm run dev --prefix .\src\FVSDNexus.Web
```

Open <http://localhost:5173>.

## Validation

Run the backend test suite:

```powershell
dotnet test .\FVSDNexus.sln --configuration Release
```

Build the frontend:

```powershell
npm ci --prefix .\src\FVSDNexus.Web
npm run build --prefix .\src\FVSDNexus.Web
```

Publish the bundled application:

```powershell
dotnet publish .\src\FVSDNexus.Api\FVSDNexus.Api.csproj --configuration Release
```

At the time of the repository migration, all 23 backend tests pass and the production frontend build reports no npm vulnerabilities.

## Azure deployment

The existing azd environment is `fvsd-insights-dev`, the subscription is `64b2bfe8-fb82-4105-991c-95a36ad469c5`, and the deployment region is `canadacentral`.

Deployment is intentionally separate from repository updates. When an Azure deployment is approved:

1. Run the readiness validation appropriate to the change.
2. Run `azd provision` only when infrastructure changes are intended.
3. Read the production URL from `azd env get-values`.
4. Confirm that the callback URI is present on the existing Entra registration.
5. Run `azd deploy`.

The Entra client secret is stored in Azure Key Vault and referenced by App Service. Application Insights receives server telemetry through Azure Monitor OpenTelemetry.

## Living documentation

This README is the starting architecture and product record. It should evolve with the project.

Future additions should include:

- Confirmed Leadership decisions and scope boundaries.
- Dataverse table and relationship catalogue.
- Assessment form and scoring-adapter inventory.
- Role and permission matrix.
- IPP capability and migration mapping.
- API conventions and error model.
- Accessibility standards.
- Test strategy and acceptance criteria.
- Environment, branching and release strategy.
- Operational support and incident procedures.
- Architecture decision records for material changes.

When a premise changes, update the relevant section and record the decision rather than allowing the implementation and documentation to diverge.
