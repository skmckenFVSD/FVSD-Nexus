# FVSD Nexus

FVSD Nexus is Fort Vermilion School Division's unified operational and analytics application. It helps staff move from governed evidence to action through a purpose-built, role-aware experience.

> **Status — November 5, 2026:** FVSD has approved Nexus as the application for next year. Phase 1 is active: Leadership Analytics, Class Assignments, TOSREC assessment entry and completion monitoring are working; the modular IEP/IPP experience is in active development from the Educational Framework Canvas app and existing Dataverse foundation.

## At a glance

| Area | Product position |
|---|---|
| Application | Azure-hosted React, TypeScript, and ASP.NET Core 8 application |
| Intelligence services | Microsoft Foundry for approved APIs, model access, agents, evaluation, toolboxes, and MCP components |
| Operational truth | Microsoft Dataverse |
| Governed analytics | `FVSDAnalytics` Fabric semantic model |
| Student context | PowerSchool data synchronized to Dataverse |
| Identity | FVSD Entra ID with delegated service access |
| Hosting | Azure Canada Central |
| Residency | Production student information remains in the approved Canadian geography |
| Delivery | Four phases: core build; Dossier transition; Microsoft 365 Copilot integration; PASI connector |

## Delivery phases

| Phase | Outcome | Position |
|---|---|---|
| 1. Nexus foundation and core workflows | Finish Fabric integration and page designs, Class Assignments, Assessments, and core IEP/IPP. | Active build |
| 2. Dossier transition | Extend IEP/IPP modules, interventions, history, and migration to incorporate agreed Dossier functionality. | Defined direction |
| 3. Microsoft 365 Copilot integration | Connect Copilot, Work IQ, FVSD agents, skills, and governed tools; use Foundry for the service and MCP component plane. | Architecture and contract definition |
| 4. PASI connector | Add FVSD-owned provincial exchange, status, retry, reconciliation, and support capability. | Feasibility established |

See the [phased delivery plan](docs/delivery/roadmap.md), [Phase 1 build record](docs/delivery/phase-1-product-build.md), and [adoption approach](docs/delivery/adoption-and-engagement.md).

## Product capabilities

| Capability | Status | Documentation |
|---|---|---|
| Leadership analytics | Current capability; remaining pages and design work in Phase 1 | [Leadership analytics](docs/capabilities/leadership-analytics/README.md) |
| Class Assignments and assessment history | Current capability | [Assessments](docs/capabilities/assessments/README.md) |
| Assessment entry and completion monitoring | TOSREC working; additional adapters in Phase 1 | [Assessments](docs/capabilities/assessments/README.md) |
| IEP / IPP | Active modular implementation in Phase 1; Dossier expansion in Phase 2 | [IEP/IPP](docs/capabilities/ipp/README.md) |
| Intervention tracking | Incorporated into the IEP/IPP module direction | [Interventions](docs/capabilities/interventions/README.md) |
| School and student profiles | Planned | [Profiles](docs/capabilities/profiles/README.md) |
| Microsoft 365 Copilot, Work IQ, agents, and skills | Phase 3 | [Purview and agent workspace](docs/capabilities/purview-governance/README.md) |
| PASI provincial connector | Phase 4 | [PASI connector](docs/capabilities/pasi-connector/README.md) |
| Platform administration | Partially implemented; expands with each phase | [Administration](docs/capabilities/administration/README.md) |

## Current build

The current application provides two connected foundations.

### Governed analytics

- FVSD Entra authentication and delegated Fabric access.
- Existing Fabric permissions and row-level security.
- Predefined DAX against the governed semantic model.
- Responsive, role-aware analytics without embedding a Power BI report.
- A shared application shell for Analytics, School Administration, Governance, and Settings destinations.

### Class Assignments and assessments

- Role and school context from Dataverse, with server-side section and student authorization.
- Cascading School, Section Group, Course, Teacher, and Student filters.
- Authorized teacher sections, class rosters, selected-student details, and assessment history.
- Current-year TOSREC completion by period, including exemptions and missing-student lists.
- TOSREC create, governed reference scoring, exemption, view, current-period edit, and authorized deletion workflows.
- Immediate Dataverse history refresh after a change and explicit separation from asynchronous Fabric refresh.
- Shared filter context between Class Assignments and Assessments.
- Grade- and period-aware assessment status summaries on student cards.

### IEP / IPP

- One annual master plan per student and school year.
- Governed modular sections from `fvsd_ippsection` and audited section allocation on `fvsd_studentipp`.
- Module selection, locking, focus navigation, and plan-oriented rendering.
- Live Student Details, Screener Results, Signatures, and Intervention Focus sections.
- A document-oriented plan view designed to align the on-screen and exported experience.
- Planned app-native PDF generation from structured records, replacing the Power Automate and OneDrive HTML-conversion chain.

Current Azure endpoint:

<https://app-fvsd-insights-iwmpkez4.azurewebsites.net/>

The deployed resources retain their established `fvsd-insights` identifiers. The product and source solution are FVSD Nexus.

## Architecture

```text
FVSD staff
  |-- FVSD Nexus Azure App
  `-- Microsoft 365 Copilot harness (Phase 3)
            |
            v
ASP.NET Core application services + Microsoft Foundry service/agent/MCP plane
  |-- Delegated Dataverse access for operational workflows
  |-- Delegated Fabric access for governed analytics
  `-- Published tools and contracts for approved agents

PowerSchool --> Dataverse --> OneLake / Fabric --> FVSDAnalytics
                    |
                    `--> PASI durable connector (Phase 4)

Entra governs identity. Fabric catalog metadata and Purview protection/compliance
provide understanding and control without replacing source-system authorization.
```

Core premises:

1. Dataverse remains the operational system of record.
2. The Fabric semantic model remains the governed analytical layer.
3. Nexus remains the primary Azure application; Foundry supplies approved intelligence services and components.
4. Users act through named identities and delegated access where interactive user context is required.
5. Backend and destination-service authorization are authoritative.
6. Canadian data residency is a non-negotiable production boundary.
7. Dataverse confirms operational saves; Fabric analytics update asynchronously.
8. Agents retrieve, explain, validate, and coordinate through bounded contracts; they do not become the source of student records or business rules.

See the [architecture diagram](docs/architecture/overview.md), [data-layer examples](docs/architecture/data-and-integrations.md), [Copilot interoperability](docs/architecture/copilot-interoperability.md), [document generation](docs/architecture/document-generation.md), and [decision register](docs/decisions/decision-register.md).

## Documentation

The [documentation hub](docs/README.md) includes:

- [Capabilities](docs/capabilities/README.md)
- [Architecture](docs/architecture/README.md)
- [Delivery](docs/delivery/README.md)
- [Decision register](docs/decisions/decision-register.md)
- [Architecture decision records](docs/decisions/adr/README.md)
- [Glossary](docs/reference/glossary.md)

Documentation labels current functionality, approved work, future phases, and open decisions explicitly.

## Repository structure

```text
FVSD-Nexus/
|-- assets/                     Reusable FVSD Nexus brand source assets
|-- src/
|   |-- FVSDNexus.Api/          ASP.NET Core backend-for-frontend
|   `-- FVSDNexus.Web/          React and TypeScript interface
|-- tests/
|   `-- FVSDNexus.Api.Tests/    API, role, integration-contract, and query tests
|-- docs/                       Product, architecture, and delivery documentation
|-- infra/                      Azure Bicep infrastructure
|-- scripts/                    Entra and environment configuration
|-- .azure/                     Deployment plan; local azd state is ignored
`-- FVSDNexus.sln
```

## Local development

### Prerequisites

- .NET 8 SDK
- Node.js 20 or later
- Azure CLI
- Azure Developer CLI
- Required FVSD tenant and Fabric access

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

The backend suite and React production build must pass before an Azure release. Deployment validation, accessibility checks, and dependency audits remain required in proportion to the change.

## Deployment

Repository updates and Azure deployment are intentionally separate. The current application remains deployed in Canada Central using its established resources and Entra registration. Deployment occurs only after the applicable validation and explicit release decision.

See the retained [deployment plan](.azure/deployment-plan.md) for the current Azure implementation history.

## Security and repository hygiene

- Do not commit credentials, tokens, certificates, connection strings, or student records.
- Do not place production student data or student-identifiable AI context outside the approved Canadian geography.
- Treat React visibility as UX, not authorization.
- Do not expose arbitrary DAX or reusable service tokens to the browser.
- Keep operational writes attributable to the signed-in user.
- Treat MCP servers, agents, and skills as governed integration surfaces with explicit permissions and audit.

Repository visibility remains an explicit governance decision as operational detail expands.

## Living documentation

Update the relevant capability, architecture page, delivery phase, and decision record in the same change that introduces new behaviour or changes a premise.
