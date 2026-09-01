# FVSD Nexus

FVSD Nexus is the proposed unified operational and analytics platform for Fort Vermilion School Division. It is intended to help staff move from governed evidence to action through a purpose-built, role-aware experience.

> **Status - September 1, 2026:** Leadership Analytics and the initial Class Assignment/TOSREC history vertical slice are locked PoC releases. Assessment data-entry forms and Dataverse writes, IPP, and the broader operational platform remain future phases until formally authorized.

## At a glance

| Area | Current position |
|---|---|
| Operational truth | Microsoft Dataverse |
| Governed analytics | `FVSDAnalytics` Fabric semantic model |
| Student context | PowerSchool data synchronized to Dataverse |
| Application | React, TypeScript, and ASP.NET Core 8 |
| Identity | FVSD Entra ID with delegated service access |
| Hosting | Azure Canada Central |
| Residency | Production student information remains in the approved Canadian geography |
| Delivery horizon | Full testable PoC proposed for February 2027; phased production target September 2027 |

## Product capabilities

| Capability | Status | Documentation |
|---|---|---|
| Leadership analytics | Working PoC | [Leadership analytics](docs/capabilities/leadership-analytics/README.md) |
| School and student profiles | Planned | [Profiles](docs/capabilities/profiles/README.md) |
| Assessment entry and scoring | Working Class Assignment and TOSREC history PoC | [Assessments](docs/capabilities/assessments/README.md) |
| Individual Program Plans | Proposed; majority of data foundation exists | [IPP](docs/capabilities/ipp/README.md) |
| Intervention tracking | Future definition required | [Interventions](docs/capabilities/interventions/README.md) |
| PASI provincial connector | Proposed strategic differentiator; public technical feasibility established | [PASI connector](docs/capabilities/pasi-connector/README.md) |
| Platform administration | Partially present | [Administration](docs/capabilities/administration/README.md) |

## Current proof of concept

The Nexus PoC now contains two connected vertical slices. The first was developed as **FVSD Insights** and proves that the application can:

- Authenticate an FVSD user with Microsoft Entra ID.
- Query Fabric using the signed-in user's delegated identity.
- Preserve Fabric permissions and row-level security.
- Use predefined DAX against the existing semantic model.
- Present governed measures without embedding a Power BI report.
- Provide responsive, task-oriented filters, signals, matrices, and charts.
- Adapt the experience by role while retaining the real service identity.

The second slice begins the operational assessment experience and proves that the application can:

- Establish the signed-in user's Dataverse role, permitted schools, default school, and teacher boundary.
- Cascade School, Section Group, Course, Teacher, and Student selections without loading class assignments prematurely.
- Return authorized teacher sections and assigned student rosters from the existing Dataverse structures.
- Establish a stable Edmonton-time school-year context for the authenticated session.
- Load a selected student's TOSREC history with Current Year and Previous Years views.
- Present the governed descriptive term and its existing Dataverse colours alongside school year, period, and standard score.
- Enforce section/student scope on the server and request a fresh delegated Microsoft session when token acquisition requires user interaction.

This locked slice is read-only. Assessment forms, scoring previews, record creation, record updates, and historical correction workflows are intentionally deferred.

Current PoC endpoint:

<https://app-fvsd-insights-iwmpkez4.azurewebsites.net/>

The deployed Azure resources retain their existing `fvsd-insights` identifiers. The active source solution and future product use the FVSD Nexus name.

## Architecture

```text
FVSD user
  |
  v
FVSD Nexus - React / TypeScript
  |
  v
ASP.NET Core backend-for-frontend
  |-- Delegated Dataverse access for operational workflows
  `-- Delegated Fabric access for governed analytics

PowerSchool -- existing synchronization --> Dataverse
Dataverse  -- low-latency OneLake link --> Fabric --> FVSDAnalytics
Dataverse  -- proposed durable connector --> Alberta Education PASI
```

Core premises:

1. Dataverse remains the operational system of record.
2. The Fabric semantic model remains the calculation and analytics layer.
3. Users act through named identities and delegated tokens.
4. Backend, Dataverse, and Fabric authorization are authoritative.
5. Canadian data residency is a non-negotiable production boundary.
6. Existing stable structures and calculations are reused.
7. Dataverse confirms operational saves; Fabric analytics update asynchronously.

Read the [architecture documentation](docs/architecture/README.md) and [decision register](docs/decisions/decision-register.md) for the detailed rationale.

## Documentation

The [documentation hub](docs/README.md) provides navigation across:

- [Capabilities](docs/capabilities/README.md)
- [Architecture](docs/architecture/README.md)
- [Delivery](docs/delivery/README.md)
- [Decision register](docs/decisions/decision-register.md)
- [Architecture decision records](docs/decisions/adr/README.md)
- [Glossary](docs/reference/glossary.md)
- [PASI official references](docs/reference/pasi-resources.md)

Documentation uses explicit status labels so current functionality, confirmed premises, proposals, and open questions do not become confused.

## Repository structure

```text
FVSD-Nexus/
|-- src/
|   |-- FVSDNexus.Api/          ASP.NET Core backend-for-frontend
|   `-- FVSDNexus.Web/          React and TypeScript interface
|-- tests/
|   `-- FVSDNexus.Api.Tests/    API, role, and semantic-query tests
|-- docs/                       Product, architecture, and delivery documentation
|-- infra/                      Azure Bicep infrastructure
|-- scripts/                    Entra and environment configuration
|-- .azure/                     Deployment plan; local azd state is ignored
|-- FVSD Insights (Vibe Code Sample)/
|                               Original exported prototype retained as reference
`-- FVSDNexus.sln
```

## Local development

### Prerequisites

- .NET 8 SDK
- Node.js 20 or later
- Azure CLI
- Azure Developer CLI
- Required FVSD tenant and Fabric access

### Run the application

Run the API and web development server in separate terminals:

```powershell
dotnet run --project .\src\FVSDNexus.Api
```

```powershell
npm run dev --prefix .\src\FVSDNexus.Web
```

Open <http://localhost:5173>.

Local authentication configuration is performed with `scripts/configure-entra-app.ps1`. Secrets belong in the .NET user-secret store or ignored azd environment and must never be committed.

## Validation

```powershell
dotnet test .\FVSDNexus.sln --configuration Release
npm ci --prefix .\src\FVSDNexus.Web
npm run build --prefix .\src\FVSDNexus.Web
dotnet publish .\src\FVSDNexus.Api\FVSDNexus.Api.csproj --configuration Release
```

For the September 1 Class Assignment/TOSREC history release, all 45 backend tests pass, the React production build succeeds, dependency audits report no known high-severity vulnerabilities, and ASP.NET publish bundles the web application successfully.

## Deployment

Repository updates and Azure deployment are intentionally separate. The current PoC remains deployed in Canada Central using its established resources and Entra registration. Deployment should occur only after the applicable validation and explicit approval.

See the retained [deployment plan](.azure/deployment-plan.md) for the current Azure implementation history.

## Security and repository hygiene

- Do not commit credentials, tokens, certificates, connection strings, or student records.
- Do not place production student data or student-identifiable AI context outside the approved Canadian geography.
- Treat React visibility as UX, not authorization.
- Do not expose arbitrary DAX or reusable service tokens to the browser.
- Keep operational writes attributable to the signed-in user.

The repository currently contains FVSD-specific architecture and generated prototype metadata. Repository visibility should remain an explicit governance decision before operational detail is expanded.

## Living documentation

This repository is expected to grow capability by capability. Update the relevant landing page and decision record in the same change that introduces new behaviour or changes a premise.
