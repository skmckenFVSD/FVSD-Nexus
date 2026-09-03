# Azure Deployment Plan

> **Status:** Deployed - Responsive Role-Aware Sidebar Navigation UX Release

Generated: 2026-08-25

---

## 1. Project Overview

**Goal:** Create the Azure-hosted FVSD Nexus application, beginning with a guided leadership analytics experience that queries the existing `FVSDAnalytics` semantic model in the `Assessment Screening` Fabric workspace. Power BI reports will not be embedded, and semantic-model measures will remain the authoritative calculation layer.

**Path:** New Project

### Verified Fabric connection

| Item | Value |
|------|-------|
| Workspace | Assessment Screening |
| Workspace ID | `f8a1522b-e94c-4e57-a60e-392d892e27ff` |
| Semantic model | FVSDAnalytics |
| Semantic model ID | `faaef455-4f1e-4a8c-91f8-8e4eb1c6215e` |
| Query verification | `EVALUATE ROW("ConnectionStatus", "Connected")` returned `Connected` on 2026-08-25 |

---

## 2. Requirements

| Attribute | Value |
|-----------|-------|
| Classification | Development pilot |
| Scale | Small: fewer than 1,000 internal users |
| Budget | Balanced, beginning with a cost-conscious single instance |
| Subscription | Pay-As-You-Go (`64b2bfe8-fb82-4105-991c-95a36ad469c5`) |
| Location | Canada Central (`canadacentral`) |
| Authentication | Microsoft Entra single sign-on |
| Analytics source | Existing Fabric/Power BI semantic model queried with DAX |
| User experience | Guided application; no Power BI Embedded or report interface |

### Functional requirements

- React and TypeScript user interface optimized for casual data users.
- Reuse existing DAX measures, relationships, calculation logic, filter context, and semantic-model RLS.
- Translate application filters into controlled server-side DAX queries.
- Expose task-oriented JSON endpoints rather than workspace, model, or DAX concepts to the browser.
- Keep Fabric access tokens, model IDs, and query construction on the server.
- Include a health endpoint and structured telemetry.

### Policy constraints

- Subscription policy inventory found only the default Microsoft Defender for Cloud assignment.
- No subscription-level deny policy, required-tag policy, allowed-location restriction, or blocked resource type was detected.
- All selected resource providers are registered and report Canada Central support.

---

## 3. Components Detected and Planned

The workspace was empty at analysis time, so this is a greenfield application.

| Component | Type | Technology | Path |
|-----------|------|------------|------|
| client | Frontend | React, TypeScript, Vite | `src/FVSDNexus.Web` |
| server | Backend-for-frontend/API | ASP.NET Core 8, Microsoft.Identity.Web | `src/FVSDNexus.Api` |
| tests | Automated tests | xUnit and frontend tests | `tests` |
| infrastructure | Azure infrastructure | AZD with Bicep | `infra` |

### Dependencies

| Component | Depends on | Purpose |
|-----------|------------|---------|
| client | server | Same-origin authenticated application API |
| server | Microsoft Entra ID | User sign-in and delegated token acquisition |
| server | FVSDAnalytics semantic model | Execute predefined DAX queries and preserve model measures/RLS |
| server | Key Vault | Protect the Entra confidential-client credential |
| server | Application Insights | Diagnostics, request telemetry, and failure investigation |

---

## 4. Recipe Selection

**Selected:** Azure Developer CLI (AZD) with Bicep

**Rationale:**

- New Azure-only application with no existing infrastructure convention.
- One-command environment management after preparation and validation.
- Native support for App Service deployments and Bicep infrastructure.
- Straightforward dev/test and eventual production environment separation.

---

## 5. Architecture

**Stack:** App Service

```text
FVSD user
  -> Entra sign-in and secure application cookie
  -> React interface served by ASP.NET Core
  -> Authorized application API endpoint
  -> Predefined DAX query executed with delegated user token
  -> Assessment Screening / FVSDAnalytics
```

### Application design

- React is compiled to static assets and served by the ASP.NET Core application, producing one same-origin deployment.
- ASP.NET Core owns OpenID Connect sign-in, secure cookies, token acquisition, authorization, and Fabric API calls.
- The browser never receives a Power BI/Fabric access token and cannot submit arbitrary DAX.
- Backend endpoints map validated parameters to version-controlled DAX templates.
- The initial implementation uses the JSON Execute Queries endpoint for simple typed application responses; the Arrow endpoint can be introduced if later performance testing justifies it.
- Semantic-model access uses each signed-in user's delegated identity so existing RLS can apply. Users must receive the required semantic-model Read and Build permissions through an FVSD security group.
- The pilot runs as one App Service instance. A production upgrade can move from B1 to S1 or Premium without redesigning the application.

### Service mapping

| Component | Azure Service | SKU/configuration |
|-----------|---------------|-------------------|
| React + ASP.NET Core application | Azure App Service on Linux | Basic B1, one instance, Always On |
| Compute plan | Azure App Service Plan | Basic B1 Linux |
| Secrets | Azure Key Vault | Standard, RBAC authorization, soft delete and purge protection |
| Telemetry | Workspace-based Application Insights | Pay-as-you-go with sampling and a development daily cap |
| Log store | Log Analytics workspace | Pay-as-you-go, 30-day retention |
| Service identity | App Service system-assigned managed identity | Key Vault Secrets User on the app vault |

### Security controls

- Entra authentication is required for every application route except `/health`.
- Authorization policies will be prepared for future FVSD role/security-group mapping.
- Secure, HTTP-only, same-site cookies; HTTPS-only App Service configuration.
- No credentials committed to source control or placed in React build output.
- Key Vault public network access remains enabled for the pilot but RBAC-restricted; production network isolation can be added after connectivity testing.
- DAX queries are predefined server-side, parameter values are allow-listed or validated, and response data is scoped to the signed-in user.
- Sensitive telemetry fields and student identifiers are not logged.

### Research summary

- **App Service:** Use the official AZD App Service Web API base, retain the required `/health` endpoint and `azd-service-name` tag, and compose the authentication integration additively.
- **Authentication:** Use a single-tenant confidential web application with authorization-code flow, server-side secure cookies, Microsoft.Identity.Web token acquisition, and the delegated Power BI `Dataset.Read.All` permission. Do not place tokens in React or browser storage.
- **Key Vault:** Use the Standard SKU, RBAC authorization, soft delete, purge protection, and a system-assigned App Service identity with only `Key Vault Secrets User` access.
- **Telemetry:** Use workspace-based Application Insights through Azure Monitor OpenTelemetry. Supply the connection string through the App Service environment and redact query text, tokens, student identifiers, and response payloads.
- **Infrastructure:** Use AZD+Bicep with a subscription-scope entry point, a dedicated resource group, deterministic globally unique names, current resource APIs, and the required uppercase AZD outputs.
- **Local development:** Use the signed-in developer identity only for controlled connectivity checks; deployed user data access remains delegated through Entra ID.

---

## 6. Provisioning Limit Checklist

Quota CLI was invoked first for each provider. `Microsoft.Web` returned a non-applicable quota record, and the other selected providers returned `BadRequest`, so Azure Resource Graph inventory plus current Microsoft service-limit documentation was used as the required fallback.

| Resource type | Number to deploy | Existing / total after deployment | Limit or quota | Validation source and result |
|---------------|------------------|-----------------------------------|----------------|------------------------------|
| `Microsoft.Resources/resourceGroups` | 1 | 9 / 10 subscription-wide | 980 per subscription | Azure CLI inventory + Azure Resource Manager service limits; within limit |
| `Microsoft.Web/serverfarms` | 1 | 0 / 1 in the new resource group; 2 currently in Canada Central | 100 Basic plans per resource group | Quota CLI non-applicable; Azure Resource Graph + App Service limits; within limit |
| `Microsoft.Web/sites` | 1 | 0 / 1 in the new plan; 2 currently in Canada Central | Unlimited apps per Basic plan, subject to plan resources | Quota CLI non-applicable; Azure Resource Graph + App Service limits; within limit |
| `Microsoft.KeyVault/vaults` | 1 | 0 / 1 currently in Canada Central | No vault-count service limit; generic ARM limit is 800 per resource type per resource group | Quota CLI `BadRequest`; Azure Resource Graph + official limits; within limit |
| `Microsoft.OperationalInsights/workspaces` | 1 | 0 / 1 currently in Canada Central | No workspace-count limit for current pricing tiers; generic ARM limit is 800 per resource type per resource group | Quota CLI `BadRequest`; Azure Resource Graph + Azure Monitor limits; within limit |
| `Microsoft.Insights/components` | 1 | 1 / 2 currently in Canada Central | Generic ARM limit is 800 per resource type per resource group | Quota CLI `BadRequest`; Azure Resource Graph + Azure Monitor/ARM limits; within limit |

**Status:** All planned resources are within published limits, and every selected resource type is available in Canada Central.

---

## 7. Execution Checklist

### Phase 1: Planning

- [x] Analyze empty workspace and select New Project mode
- [x] Gather and record project requirements and assumptions
- [x] Confirm subscription
- [x] Select and verify Canada Central against all planned resource providers
- [x] Resolve the Fabric workspace and semantic-model IDs
- [x] Execute a live semantic-model DAX connection test
- [x] Inventory subscription policy assignments
- [x] Prepare resource inventory
- [x] Invoke azure-quotas and validate provisioning limits with required fallbacks
- [x] Scan codebase
- [x] Select AZD with Bicep recipe
- [x] Plan React + ASP.NET Core architecture
- [x] User approved this plan

### Phase 2: Execution

- [x] Load App Service, Key Vault, identity, AZD, Bicep, and security generation references
- [x] Scaffold React client, ASP.NET Core server, and tests
- [x] Implement Entra authentication and delegated semantic-model token acquisition
- [x] Implement typed semantic-model configuration and DAX query client
- [x] Implement health endpoint and initial connection/status API
- [x] Generate `azure.yaml` and Bicep infrastructure
- [x] Apply security hardening and telemetry redaction
- [x] Build and run automated tests locally
- [x] Update plan status to `Ready for Validation`

### Phase 3: Validation

- [x] Invoke azure-validate skill
- [x] All validation checks pass
  - [x] Revalidate the responsive role-aware sidebar navigation UX release
    - [x] 1. AZD Installation
    - [x] 2. Schema Validation
    - [x] 3. Environment Setup
    - [x] 4. Authentication Check
    - [x] 5. Subscription/Location Check
    - [x] 6. Aspire Pre-Provisioning Checks - not applicable; the solution is not .NET Aspire
    - [x] 7. Provision Preview
    - [x] 8. Build Verification
    - [x] 9. Docker Build Context Validation - not applicable; the service has no Dockerfile
    - [x] 10. Package Validation
    - [x] 11. Azure Policy Validation
    - [x] 12. Aspire Post-Provisioning Checks - not applicable; the solution is not .NET Aspire
  - [x] AZD installation and `azure.yaml` schema/package validation
  - [x] AZD environment, authentication, subscription, and Canada Central checks
  - [x] Confirm the solution is not .NET Aspire and has no Docker build context
  - [x] Run `azd provision --preview --no-prompt`
  - [x] Build and publish the React + ASP.NET Core application
  - [x] Package the App Service payload with `azd package --no-prompt`
  - [x] Compile and lint Bicep
  - [x] Run subscription-scope infrastructure validation and what-if through AZD preview
  - [x] Review subscription policies and selected-region support
  - [x] Verify managed-identity role assignments statically
- [x] Revalidate the user-approved Executive dashboard release
  - [x] Verify AZD installation, schema, selected environment, authentication, subscription, and location
  - [x] Confirm the existing resource group location and unique App Service service tag
  - [x] Confirm the solution remains non-Aspire and has no Docker build context
  - [x] Run clean React install, dependency audit, and production build
  - [x] Run Release-mode ASP.NET Core tests and .NET dependency audit
  - [x] Compile and lint Bicep and review managed-identity RBAC statically
  - [x] Run `azd provision --preview --no-prompt`
  - [x] Run `azd package --no-prompt`
  - [x] Record proof and set status to `Validated`
- [x] Revalidate the end-to-end governed TOSREC assessment lifecycle release
  - [x] 1. AZD Installation
  - [x] 2. Schema Validation
  - [x] 3. Environment Setup
  - [x] 4. Authentication Check
  - [x] 5. Subscription/Location Check
  - [x] 6. Aspire Pre-Provisioning Checks - not applicable; the solution is not .NET Aspire
  - [x] 7. Provision Preview
  - [x] 8. Build Verification
  - [x] 9. Docker Build Context Validation - not applicable; the service has no Dockerfile
  - [x] 10. Package Validation
  - [x] 11. Azure Policy Validation
  - [x] 12. Aspire Post-Provisioning Checks - not applicable; the solution is not .NET Aspire
- [x] Record validation proof and set status to `Validated`
- [x] Revalidate the Foundations 1 IPP preview and FVSD Nexus branding release
  - [x] Verify AZD installation, schema/package handling, selected environment, authentication, subscription, and location
  - [x] Confirm the solution remains non-Aspire and has no Docker build context
  - [x] Run the React production build and dependency audit
  - [x] Run Release-mode ASP.NET Core tests and dependency audit
  - [x] Compile and lint Bicep and review managed-identity RBAC statically
  - [x] Review active Azure policy assignments
  - [x] Run `azd provision --preview --no-prompt`
  - [x] Run `azd package --no-prompt`
  - [x] Record release fingerprints and validation proof
- [x] Revalidate the developer-only real/obfuscated student identifier display release
  - [x] Verify AZD installation, schema/package handling, selected environment, authentication, subscription, and location
  - [x] Confirm the solution remains non-Aspire and has no Docker build context
  - [x] Run the React production build and dependency audit
  - [x] Run Release-mode ASP.NET Core tests and dependency audit
  - [x] Compile and lint Bicep and review managed-identity RBAC statically
  - [x] Review active Azure policy assignments
  - [x] Run `azd provision --preview --no-prompt`
  - [x] Run `azd package --no-prompt`
  - [x] Record release fingerprints and validation proof

### Phase 4: Deployment

- [x] Invoke azure-deploy skill after validation and explicit deployment approval
- [x] Provision the six planned resources in Canada Central
- [x] Register the production Entra callback without removing the localhost callback
- [x] Deploy successfully and verify the live endpoint
- [x] Verify the App Service managed identity and Key Vault reference
- [x] Set status to `Deployed`
- [x] Deploy the user-approved Executive dashboard release on 2026-08-26
  - [x] Reconcile the existing infrastructure with `azd provision --no-prompt`
  - [x] Publish the application with `azd deploy --no-prompt`
  - [x] Confirm `azd show` reports the intended App Service endpoint
  - [x] Verify the live health endpoint and exact JavaScript release asset
  - [x] Verify production sign-in and corrected sign-out redirects
  - [x] Verify the Key Vault reference and live managed-identity role assignment
- [x] Deploy the responsive Executive Overview UX release on 2026-08-27
  - [x] Revalidate frontend, backend, dependencies, Bicep, policy, packaging, and provisioning preview
  - [x] Reconcile the existing infrastructure with no resource changes required
  - [x] Publish the validated application package to the existing App Service
  - [x] Verify production health, exact release asset, Entra sign-in challenge, Key Vault reference, and live RBAC
- [x] Deploy the Foundations 1 IPP preview, FVSD Nexus branding, and developer student identifier display release on 2026-09-02
  - [x] Reconcile the existing infrastructure with no resource changes required
  - [x] Publish GitHub commit `6444aa1` with `azd deploy --no-prompt`
  - [x] Confirm `azd show` reports the intended App Service endpoint
  - [x] Verify production health and exact JavaScript and CSS release fingerprints
  - [x] Verify the FVSD Entra sign-in challenge, Nexus favicon, Key Vault reference, and live RBAC
- [x] Deploy the end-to-end governed TOSREC assessment lifecycle release on 2026-09-02
  - [x] Reconcile the existing infrastructure with no resource changes required
  - [x] Publish GitHub commit `3afb8d1` with `azd deploy --no-prompt`
  - [x] Confirm `azd show` reports the intended App Service endpoint
  - [x] Verify production health, exact JavaScript and CSS release fingerprints, and the FVSD Entra sign-in challenge
  - [x] Verify the Key Vault reference and live managed-identity role assignment
- [x] Deploy the responsive role-aware sidebar navigation UX release on 2026-09-03
  - [x] Reconcile the existing infrastructure with no resource changes required
  - [x] Publish GitHub commit `3672464` with `azd deploy --no-prompt`
  - [x] Confirm `azd show` reports the intended App Service endpoint
  - [x] Verify production health and exact JavaScript and CSS release fingerprints
  - [x] Verify the FVSD Entra sign-in challenge, Key Vault reference, and live managed-identity role assignment

---

## 8. Validation Proof

### Responsive Role-Aware Sidebar Navigation UX Revalidation - 2026-09-03T15:15:33-06:00

> **Release boundary:** This release reorganizes the shared Nexus shell into role-aware Analytics, School Administration, Governance, and Settings destinations; adds manual desktop and automatic breakpoint-driven compact navigation; consolidates developer role simulation; and moves connection, identity, assignment, and licensing-policy context to Settings. It does not add new Analytics, assessment, intervention, IPP, or Governance business capabilities.

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd version`, `azd auth login --check-status`, `azd env list`, selected environment values, and `az account show` | Passed; signed-in FVSD identity, existing `fvsd-insights-dev` environment, Pay-As-You-Go subscription, and Canada Central |
| Project schema and specialization | `azure.yaml` inspection plus Aspire and Dockerfile scan | Passed; the existing App Service service definition remains valid, and the solution is neither Aspire nor container based |
| React build and dependency audit | `npm ci --include=dev`, `npm audit --audit-level=high`, and `npm run build` | Passed; TypeScript and Vite production bundle generated and zero vulnerabilities reported |
| ASP.NET Core tests and dependency audit | `dotnet test FVSDNexus.sln --configuration Release --no-restore` and `dotnet list ... --vulnerable --include-transitive` | Passed; 65 tests, zero failures, and no vulnerable packages reported |
| Application publish | `dotnet publish src/FVSDNexus.Api/FVSDNexus.Api.csproj --configuration Release` | Passed; React assets were bundled into the ASP.NET Core App Service output |
| Bicep compile/lint | `az bicep build --file infra/main.bicep --stdout` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Static RBAC review | `infra/resources.bicep` role-assignment inspection | Passed; the App Service system identity retains only Key Vault Secrets User on the application vault with `ServicePrincipal` principal type |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; no blocking subscription policy assignment was returned |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no resource creation or deletion; preview contains only existing App Service and monitoring property reconciliation |
| Package validation | `azd package --no-prompt` | Passed; the responsive navigation, Settings surface, and updated documentation packaged successfully |
| Release fingerprints | Local SHA-256 | JavaScript `F08BE303600247BE6233B97CC4ADAD3BF2A6B0949D0D9F089AA16BE114F9668E`; CSS `380C66D52D3A9A80D9CB47AE22D6EABEE6B6B220C7115C34D4FE947EFD7116D9` |

### Responsive Role-Aware Sidebar Navigation UX Deployment - 2026-09-03T15:21:38-06:00

> **Release designation:** This deployed state locks the shared navigation and settings-shell UX for the Executive discussion. The next planned UX focus is the Class Assignments page; analytical content remains subject to Executive question framing and current program/model design decisions.

| Check | Command | Result |
|-------|---------|--------|
| GitHub release | `git push origin main` | Passed; application release commit `3672464` is published on `main` |
| Infrastructure reconciliation | `azd provision --no-prompt` | Passed; the existing Canada Central resources required no changes |
| Application deployment | `azd deploy --no-prompt` | Passed; the validated App Service package deployed successfully |
| Endpoint inventory | `azd show` | Passed; `web` resolves to `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/` |
| Production health | `GET /health` | HTTP 200 with `{"status":"healthy","service":"FVSD Nexus"}` |
| Exact frontend release | Production HTML asset inspection and SHA-256 comparison | Passed; production serves `assets/index-VTmH0MD3.js` and `assets/index-mtsugIXW.css`, exactly matching the validated local bundle |
| Release fingerprints | Production SHA-256 | JavaScript `F08BE303600247BE6233B97CC4ADAD3BF2A6B0949D0D9F089AA16BE114F9668E`; CSS `380C66D52D3A9A80D9CB47AE22D6EABEE6B6B220C7115C34D4FE947EFD7116D9` |
| Entra sign-in challenge | `GET /api/auth/signin` without following redirects | HTTP 302 to the FVSD tenant with the production callback and delegated Dataverse scope |
| Key Vault reference | App Service configuration-reference API | `AzureAd__ClientSecret` reports `Resolved` through the system-assigned identity |
| Live RBAC | App Service identity and vault-scoped role query | `Key Vault Secrets User` remains assigned to the App Service system identity at the application vault only |

Validation completed on 2026-08-26:

| Check | Proof | Result |
|-------|-------|--------|
| React production build | `npm run build` | Passed; TypeScript and Vite production bundle generated |
| ASP.NET Core | `dotnet test FVSDNexus.sln --configuration Release` and `dotnet publish` | Passed; health endpoint integration test and bundled React publish output succeeded |
| AZD schema/package | `azd package --no-prompt` | Passed; App Service zip package generated |
| Infrastructure compile | `az bicep build` and `az bicep lint` | Passed without warnings |
| Provisioning what-if | `azd provision --preview --no-prompt` | Passed; exactly six planned creates in `rg-fvsd-insights-fvsd-insights-dev`, no changes applied |
| Dependency security | `npm audit --audit-level=high` and `dotnet list ... --vulnerable --include-transitive` | Zero reported vulnerabilities |
| Fabric connection | Live `executeQueries` calls | Passed for connection status, model-driven filter catalog, controlled filters, and school comparison measures; all runtime calls returned HTTP 200 |
| Entra sign-in | Local authorization-code flow | Passed with app `FVSDInsights` (`b9a8631e-8e03-4204-8d7e-a487bfe33b2f`) |
| Browser workflow | User-verified local React session | Passed; filter selections refreshed values returned from `FVSDAnalytics` |
| Delegated Power BI consent | User-scoped grant | `Dataset.Read.All` granted for ScottM; tenant-wide rollout remains an administrator decision |
| Theme mapping | `FVSD Fluent Theme.json` | Structural, seven active data colours, placeholder, sentiment, and divergent colours mapped to CSS variables |
| Azure provisioning | `azd provision --no-prompt` | Passed; six resources created in `rg-fvsd-insights-fvsd-insights-dev` on 2026-08-26 |
| Application deployment | `azd deploy --no-prompt` and `azd show` | Passed; service published at `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/` |
| Production health | `GET /health` | HTTP 200 with `{"status":"healthy","service":"FVSD Insights"}` after the initial App Service cold start |
| Production sign-in challenge | `GET /api/auth/signin` without following redirects | HTTP 302 to the FVSD tenant with the correct client ID, delegated scope, and production callback |
| Production browser workflow | User-verified Azure session | Passed; Entra sign-in, application load, Fabric semantic-model queries, and filter value changes work in Azure |
| Power BI value parity | User comparison against the existing Power BI report | Passed; values returned by the Azure app match the semantic model when equivalent filters are applied |
| Key Vault reference | App Service configuration-reference API | `AzureAd__ClientSecret` status is `Resolved` through the system-assigned identity |

### Bundled Update Revalidation — 2026-08-26T10:54:54-06:00

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd auth login --check-status` and selected AZD environment | Passed; ScottM signed in, Pay-As-You-Go subscription `64b2bfe8-fb82-4105-991c-95a36ad469c5`, Canada Central |
| React clean install/build | `npm ci`, `npm audit --audit-level=high`, `npm run build` | Passed; 0 vulnerabilities and production bundle generated with the FVSD Analytics Agent SVG |
| ASP.NET Core tests | `dotnet test FVSDNexus.sln --configuration Release` | Passed; 19 tests, 0 failures |
| .NET dependency audit | `dotnet list FVSDNexus.sln package --vulnerable --include-transitive` | Passed; no vulnerable packages reported |
| Bicep compile/lint | `az bicep build --file infra/main.bicep` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; only the existing Microsoft Defender for Cloud default assignment is present |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no resource creation or deletion, only reconciliation of existing App Service/monitoring properties |
| Package validation | `azd package --no-prompt` | Passed; the web application was published and packaged successfully |
| Static RBAC review | `infra/resources.bicep` role assignment inspection | Passed; App Service managed identity retains only Key Vault Secrets User on the application vault |

### Executive Dashboard Release Revalidation — 2026-08-26T14:12:38-06:00

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd version`, `azd auth login --check-status`, selected AZD environment, and `az account show` | Passed; interactive ScottM identity, Pay-As-You-Go subscription `64b2bfe8-fb82-4105-991c-95a36ad469c5`, Canada Central |
| Existing target | Resource-group and `azd-service-name` inventory | Passed; healthy existing resource group and exactly one `web` target, `app-fvsd-insights-iwmpkez4` |
| Specialized/runtime checks | Workspace marker and Dockerfile scan | Passed; not Aspire, not Copilot SDK, and no Docker build context |
| React clean install/build | `npm ci`, `npm audit --audit-level=high`, and `npm run build` | Passed; zero vulnerabilities and production bundle generated |
| ASP.NET Core tests | `dotnet test FVSDNexus.sln --configuration Release --no-restore` | Passed; 23 tests, 0 failures |
| .NET dependency audit | `dotnet list FVSDNexus.sln package --vulnerable --include-transitive` | Passed; no vulnerable packages reported |
| Bicep compile/lint | `az bicep build --file infra/main.bicep` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Static RBAC review | `infra/resources.bicep` role-assignment inspection | Passed; App Service identity has only Key Vault Secrets User on the application vault with `ServicePrincipal` principal type |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; only the existing Microsoft Defender for Cloud default assignment is present |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no create/delete operations, only reconciliation of existing App Service and monitoring properties |
| Package validation | `azd package --no-prompt` | Passed; React and ASP.NET Core application published and compressed successfully |

### Executive Dashboard Release Deployment — 2026-08-26T14:24:08-06:00

| Check | Command | Result |
|-------|---------|--------|
| Infrastructure reconciliation | `azd provision --no-prompt` | Passed; existing resources required no changes |
| Application deployment | `azd deploy --no-prompt` | Passed; App Service package deployed successfully |
| Endpoint discovery | `azd show` | Passed; `web` endpoint is `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/` |
| Production health | `GET /health` | HTTP 200 with FVSD Insights status `healthy` |
| Release-asset verification | `GET /` and deployed script inspection | HTTP 200 and exact validated asset `/assets/index-BZo9GJWD.js` is live |
| Authentication | Non-following `GET /api/auth/signin` and `GET /api/auth/signout` | Both return HTTP 302 to the FVSD Entra tenant; sign-in uses the correct client ID and sign-out clears the application cookie |
| App Service state | Azure resource query | Running with HTTPS-only enabled |
| Key Vault reference | App Service configuration-reference API | `AzureAd__ClientSecret` status is `Resolved` through the system-assigned identity |
| Live RBAC | App Service identity and vault-scoped role query | `Key Vault Secrets User` remains assigned to the system identity at the application vault only |

### Role Assignment Verification

- Identity checked: system-assigned managed identity on `app-fvsd-insights-*`.
- Role confirmed: Key Vault Secrets User (`4633458b-17de-408a-b874-0445c86b69e6`).
- Scope confirmed: the specific `kv-fvsdi-*` vault only.
- Fabric queries use the signed-in user's delegated identity rather than the App Service managed identity, preserving semantic-model permissions and RLS.
- No overly broad Azure Contributor, Owner, or subscription-scoped data-plane role is generated.

### Live Role Verification

- App Service identity: `3ac2acd7-3412-4161-b4bf-af96c4051a85`.
- Live assignment: `Key Vault Secrets User` on `kv-fvsdi-iwmpkez4` only.
- Principal type: `ServicePrincipal` (the App Service system-assigned identity).
- Key Vault client-secret reference status: `Resolved`.
- Status: Passed.

---

## 9. Files to Generate

| File or path | Purpose | Status |
|--------------|---------|--------|
| `.azure/deployment-plan.md` | Planning source of truth | Complete |
| `azure.yaml` | AZD service and infrastructure configuration | Complete |
| `infra/main.bicep` and modules | Canada Central Azure resources and RBAC | Complete |
| `src/FVSDNexus.Web` | React/TypeScript user interface | Complete |
| `src/FVSDNexus.Api` | ASP.NET Core authentication and DAX API | Complete |
| `tests` | Backend integration tests | Complete |
| `scripts/configure-entra-app.ps1` | Repeatable least-privilege Entra setup | Complete; existing registration configured |
| `README.md` | Local configuration, Entra setup, validation, and deployment guidance | Complete |

---

## 10. Next Steps

> Current phase: Deployed to the development environment in Canada Central.

1. Confirm the first production-facing view and filter requirements before expanding beyond the initial school-comparison vertical slice.
2. Obtain tenant-wide delegated Power BI consent before opening the pilot to other FVSD users.

---

## 11. Planned Change: Developer Role Switcher

> **Change status:** Implemented, user-verified locally, and deployed to Azure on 2026-08-26

### Goal

Add a role/persona switcher that is visible and usable only by ScottM. The switcher will provide a centralized role context for role-specific titles, navigation visibility, defaults, and query rules as the application grows.

### Security and identity boundary

- Authorize the switcher server-side using ScottM's immutable Entra object ID `0cf3f9d4-2ff0-40f6-ba39-4eec8f4f62d5`; do not rely on a display name or client-side visibility.
- Support the five planned personas: `Executive`, `School Administration`, `Teacher`, `Class Room Support`, and `Data Analyst (Administrator)`.
- Validate every selected role against the server-side allow-list and store it in a protected, HTTP-only, secure cookie.
- Reject role changes from any other identity, even if a request is manually constructed.
- Continue acquiring Fabric tokens for the real signed-in user. The selected persona must never impersonate another Entra identity or bypass semantic-model RLS.

### User experience

- Place the switcher at the bottom of the navigation sidebar, matching the supplied reference.
- Hide the entire control for non-developer users.
- Clearly label the selection as a simulated development role and separately show that Fabric RLS is evaluated as the real signed-in identity.
- Persist the selection across page refreshes and expose a centralized role configuration for future header and page-visibility rules.
- Initially keep the existing page available to all five simulated personas; add page-specific restrictions only when the business rules for each view are defined.

### Application changes

- Extend `/api/me` with immutable identity information, developer authorization, active role, available roles, and RLS evaluation mode.
- Add an authenticated, developer-only role-change endpoint with same-origin request protection.
- Add a server-side development-role service that other endpoints can consume when role-specific query defaults are introduced.
- Add the React role switcher, development-mode indicator, and role-aware header context.
- Refresh page data after the simulated role changes so future role-specific rules apply consistently.

### Verification

- Automated tests for developer authorization, non-developer rejection, invalid-role rejection, protected selection persistence, and `/api/me` output.
- React production build and backend test suite.
- Local sign-in check followed by Azure validation and application-only redeployment.
- Verify simulated persona behaviour separately from actual Fabric RLS results.

### Local verification result

- React production build passed.
- Backend suite passed: 12 tests, 0 failures.
- ScottM confirmed the developer-only switcher is visible and changes roles successfully at localhost.
- Azure deployment was deferred at ScottM's request so this change can be bundled with the remaining application updates.

### RLS testing limitation

The Execute Queries API evaluates RLS using the delegated Entra identity that acquired the Fabric token. A UI persona switch cannot change that identity. Genuine RLS verification therefore requires accounts or group memberships representing the intended Fabric roles; the switcher tests the application's role-driven experience and explicit query policy without weakening Fabric security.

---

## 12. Planned Change: Two-Row Filter Framework

> **Change status:** Implemented, user-verified locally, and deployed to Azure on 2026-08-26

### Persistent filter row

1. `School Year` — multi-select; model values sorted descending; latest available year selected by default.
2. `Period` — multi-select; only `Fall`, `Winter`, and `Spring`; sorted by `Date[Period Sorting]`, with Fall → Winter → Spring as the fallback order if the model sort value is unavailable; no forced default, so an empty selection means all permitted periods.
3. `School` — multi-select; model values sorted ascending; an empty selection means all schools permitted by Fabric RLS. Visible only for the `Executive` and `Data Analyst (Administrator)` development personas.

If the active persona changes to one that cannot see the School filter, any simulated School selection will be cleared so a hidden filter cannot continue affecting the page.

### Page-specific filter row for the current comparison view

1. `Curriculum`
2. `Assessment Group`
3. `Grade` — Kindergarten first, followed by Grades 1 through 12 in numeric order; use the semantic-model sort column when available and a label-aware numeric fallback otherwise.

The row will be component-driven so later pages can substitute `Assessment`, `Student`, or `Intervention Type` when those semantic-model fields and page rules are defined. Those future filters will not be invented or queried in this change.

### Interaction design

- Render multi-selects as compact dropdowns with checkboxes, selected counts, `Select all`, and `Clear` actions rather than native browser multi-select lists.
- Preserve the two-row order on desktop and collapse cleanly on narrower screens.
- Use a light-gray filter-panel background so the filter area is visually distinct from the application canvas.
- Show explicit summaries such as `Latest year`, `3 selected`, or `All permitted schools`.
- Keep second-row filters single-select for now; their multiplicity can be set per page when page contracts are defined.

### Semantic-model query contract

- Send repeated query-string values for each multi-select field.
- Convert only validated arrays into controlled DAX `TREATAS` sets on the server.
- Reject excessive, over-length, or control-character values and continue preventing arbitrary browser-supplied DAX.
- Keep the existing semantic-model measures and delegated-user RLS unchanged.

### Verification

- Extend DAX-generation tests for multiple years, periods, and schools, including quote escaping and invalid-value rejection.
- Test descending School Year and ascending School option ordering.
- Test the latest-year default, role-based School visibility, and clearing hidden School selections through the React production build and local browser workflow.
- Do not deploy this change to Azure until the remaining application updates are ready.

---

## 13. Planned Change: Dashboard Chrome Cleanup

> **Change status:** Implemented, user-verified locally, and deployed to Azure on 2026-08-26

- Remove the circular initials/avatar treatment from the signed-in user card.
- Resolve and display the user's full Entra display name, with UPN on the second line.
- Remove the Semantic Model KPI because connection metadata is not an analytical measure.
- Remove the data-source/model card from the dashboard body.
- Add a compact data-source section below the page navigation in the left sidebar, showing semantic model, workspace, delegated-user access, and live connection status.
- Keep this cleanup local until it is bundled with the remaining changes.

Local verification: ScottM confirmed the simplified user identity treatment and relocated data-source details are cleaner.

---

## 14. Planned Change: Application Branding

> **Change status:** Implemented, user-verified locally, and deployed to Azure on 2026-08-26

- Replace the generic chart glyph in the sidebar brand card with the supplied FVSD Analytics Agent SVG.
- Expand the brand card to show `FVSD Nexus`, `Fort Vermilion School Division`, and the tagline `From Insights To Action` on separate lines.
- Preserve a compact logo-only treatment when the navigation collapses at narrower breakpoints.
- Keep this branding update local until it is bundled with the remaining application changes.

Local verification: the React TypeScript and Vite production build completed successfully, including the bundled SVG asset.

---

## 15. Bundled Update Deployment — 2026-08-26

> **Deployment status:** Succeeded

- `azd provision --no-prompt` completed successfully and found no infrastructure changes to apply.
- `azd deploy --no-prompt` published the complete application bundle to the existing App Service.
- `azd show` confirmed the deployed endpoint as `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/`.
- The live `/health` endpoint returned HTTP 200 with service status `healthy`.
- The deployed JavaScript bundle contains `Fort Vermilion School Division` and `From Insights To Action`, confirming the new branded release is active.
- The Entra sign-in endpoint returned HTTP 302 with the expected FVSD tenant, `FVSDInsights` client ID, and production callback URI.
- Live RBAC verification confirmed App Service identity `3ac2acd7-3412-4161-b4bf-af96c4051a85` retains `Key Vault Secrets User` at the specific `kv-fvsdi-iwmpkez4` vault scope.
- The `AzureAd__ClientSecret` Key Vault reference reports `Resolved` through the system-assigned identity.
- No Azure SQL or EF migration steps apply to this architecture.

---

## 16. Proposed Change: Executive Literacy and Numeracy Dashboard

> **Change status:** Implemented, user-verified locally, validated, and deployed to Azure on 2026-08-26.

### Goal

Replace the current generic Executive comparison prototype with a reusable achievement-domain pattern for `Literacy` and `Numeracy`. The same component and semantic query contract should later be reusable on School Profile without duplicating calculation logic.

### Semantic-model authority

- Continue using `[Submitted]` and `[Assessment (Median Score)]` from `FVSDAnalytics`; do not reconstruct either measure in application code.
- Use semantic-model Assessment Group and Assessment Type filters to define each dashboard domain and instrument.
- For Literacy, include TOSREC and TOWRE for Grades 1–12 and CTOPP for Kindergarten, subject to verification of the exact model values and relationships.
- Obtain descriptive term, term group, range labels, range boundaries, display order, and colours from the model's Term table.
- Preserve delegated-user Fabric RLS for all new endpoints.

### Executive experience

- Provide Literacy and Numeracy as parallel domain views using the same visual and API components.
- Add Period as an explicit split in the School Comparison grid.
- Remove the existing Submitted percentage column when it only communicates 100%; show submission counts where they provide useful volume context.
- Add overview combination charts patterned after the supplied Power BI examples: term-distribution submission counts as clustered columns and semantic-model median score as a line, split by Period and instrument where applicable.
- Use model-provided term colours consistently in charts, legends, and classification indicators.
- Retain the established global filter framework and determine which page-specific filters remain user-controlled versus fixed by the selected domain.

### Discovery required before implementation

- Verify exact Literacy and Numeracy Assessment Group, Curriculum, Assessment Type, and instrument values.
- Verify the Term table's exact column names, sort columns, colour format, boundary semantics, and relationship/filter behaviour.
- Confirm whether descriptive-term counts can be produced by evaluating `[Submitted]` in Term context or require a model-defined companion measure.
- Confirm whether the comparison grid should show one row per School × Period, or one school row with grouped Period columns.
- Establish the Numeracy instrument and grade mapping equivalent to the Literacy definition.
- Validate representative query results against the existing Power BI report before building the visual layer.

### Verified discovery findings

- Live `INFO.VIEW` metadata confirms the relevant tables are `Type`, `Term`, `Assessments`, `Date`, `School`, and the measure table `Measure`.
- Active model relationships are `Assessments[AssessmentTypeID]` → `Type[AssessmentTypeID]`, `Assessments[DescriptiveTermID]` → `Term[DescriptiveTermID]`, `Assessments[Assessment Date]` → `Date[Date]`, and `Assessments[SchoolID]` → `School[SchoolID]`.
- The Term contract is model-governed through `Descriptive Term`, `Descriptive Term Sort Order`, `Term Group`, `Term Group Sort Order`, `Range`, `Range - Low Value`, `Range - High Value`, `Fill Hex Code`, and `Font Hex Code`.
- Standard-score terms are Very Poor, Poor, Below Average, Average, Above Average, Good, and Very Good. PNSA uses At Risk and Not At Risk; additional benchmark/concern terms exist for other assessment families.
- Term-group formatting measures return green `#00B050` for Average and Above, red `#FF0000` for Below Average, and white for Unknown.
- `[Submitted]` evaluated in Descriptive Term context reconciles exactly to overall `[Submitted]` for every tested 2025 / 2026 Literacy and Numeracy group/period, so the overview distribution can remain entirely measure-driven.
- `[Assessment (Median Score)]` must be evaluated with Term context removed and repeated once per Period/instrument for the line series.
- Current 2025 / 2026 coverage is CTOPP (primarily Kindergarten, with some Grade 1 records), TOSREC (Grades 1–12), TOSWRF (Grade 2 only), TOWRE (Grades 1–12), PNSA (Kindergarten–Grade 6), and WRAT-5 (Grades 1–12).
- The latest governed school year label is `2025 / 2026`; the app must continue using live model values rather than hard-coded year strings.

### Proposed API and visual contract

- Add an allow-listed `domain` parameter (`literacy` or `numeracy`) whose server-side configuration controls Curriculum, Assessment Group, Assessment Type, and grade applicability. The browser will not be allowed to submit its own DAX or redefine a domain.
- Add an overview response shaped as Domain → Instrument → Period → descriptive-term counts, with term/group/range/sort/fill/font metadata and the Term-filter-independent median score.
- Replace the current comparison response with School × Period metrics and remove `[Submitted %]`; retain governed measures only.
- Render one responsive composed chart per configured instrument, using clustered descriptive-term bars on the submission-count axis and the median line on the score axis.
- Provide a shared, model-driven term legend/range panel and accessible tabular fallback for the chart data.
- Recommend a School-row matrix with grouped Fall, Winter, and Spring columns because it makes period movement easier to compare than repeating one row per School × Period; finalize this choice with ScottM before implementation.

### Confirmed Executive rules

- Exclude TOSWRF from the Executive Dashboard. Retain its visual/query pattern for later School Profile and Literacy work.
- Literacy instruments are CTOPP for Kindergarten, plus TOSREC and TOWRE for Grades 1–12.
- Numeracy instruments are PNSA for Kindergarten–Grade 6 and WRAT-5 for Grades 1–12.
- Remove Rank and sort Schools ascending.
- Render Periods across the top in governed ascending order: Fall, Winter, Spring.
- Under each Period, render two Term Group columns: Below Average and Average and Above.
- Each cell displays `[Assessment (Median Score)]` evaluated in that Period and Term Group context, rounded for display to a whole number.
- This produces six metric columns per School/School Year: two Term Groups under each of three Periods.
- Place School Year beneath School in the row hierarchy. Selecting multiple years adds vertical rows within each School rather than additional horizontal column groups.

### Score-scale decision still required

Live verification shows that the six-column matrix must have a single Assessment Group/instrument context. At the combined Numeracy-domain level, the governed measure returns PNSA raw-score medians for some schools (for example 7–12) and WRAT-5 standard-score medians for others (for example 75–103). Placing those values in the same comparison column would be misleading even though each individual result is correctly calculated by the model.

Recommended resolution: keep the overview charts showing every configured instrument, but add an Assessment Group selector for the School comparison matrix. Its options are constrained by the active domain (CTOPP/TOSREC/TOWRE for Literacy; PNSA/WRAT-5 for Numeracy), and the six matrix columns always represent one compatible score scale.

ScottM approved the matrix-specific Assessment Group selector. Overview charts will continue showing all configured instruments for the active domain, while the comparison matrix will always evaluate one selected Assessment Group.

### Planned implementation sequence

1. Inspect model metadata and run bounded discovery queries against `FVSDAnalytics`.
2. Document the verified domain/instrument mappings and Term contract.
3. Define typed server-side DAX query builders and response DTOs for domain overview and School × Period comparison.
4. Add automated DAX-generation/parsing tests, including term colours and ordering.
5. Build reusable React overview-chart, legend, and comparison-grid components.
6. Implement Literacy first and validate values against Power BI.
7. Configure Numeracy through the same components and validate parity.
8. Keep the change local until ScottM approves a later Azure deployment.

### Local implementation verification

- Added authenticated, allow-listed Executive domain, term-definition, overview, and School-comparison API endpoints while preserving delegated-user Fabric RLS.
- Added reusable React Literacy and Numeracy views, model-coloured distribution charts, semantic-model median lines, model-driven legends, and the six-column School/School Year matrix.
- Overview charts are stacked vertically at full content width and assessment cards with no returned semantic-model data are omitted. The matrix Assessment Group options also respect the selected grade's configured applicability.
- Consolidated the duplicated chart-section heading into the top Literacy/Numeracy overview context and removed the implementation-oriented measure pill.
- Extended overview results and chart categories to School Year then Period, keeping separate term distributions and governed median values when multiple school years are selected.
- Corrected authentication sign-out to clear both the local application cookie and the OpenID Connect session. This prevents a valid identity cookie from surviving an API restart after the in-memory delegated Fabric token cache has been lost; a subsequent sign-in now performs a fresh authorization-code exchange.
- Multi-select filter menus now close when the user clicks outside the active dropdown or presses Escape, while remaining open for successive selections inside the menu.
- Grade now uses the shared multi-select control. Every selected grade is passed to the semantic-model endpoints, and instrument availability is based on whether any selected grade falls within the instrument's governed grade range.
- Constrained the application shell, main content, page header, filter panel, and Executive sections to the viewport so browser zoom cannot create page-level horizontal drift. Any necessary horizontal scrolling remains contained within the chart and matrix wrappers.
- Confirmed the Executive Literacy allow-list excludes TOSWRF and applies the approved grade mappings for CTOPP, TOSREC, TOWRE, PNSA, and WRAT-5.
- All 23 backend tests pass and the React production build completes successfully.
- Direct live-model validation returned the expected Literacy overview shape (56 rows across CTOPP, TOSREC, and TOWRE) and TOSREC School-comparison shape (96 rows across 16 RLS-visible schools and both Term Groups).
- Local API health is healthy and the local React site returns HTTP 200.
- User-facing parity and layout were reviewed iteratively; the approved release was validated and deployed to Azure on 2026-08-26.

---

## 17. Proposed Change: Responsive Chart Density and Expansion

> **Change status:** Implemented, validated, and deployed to Azure on 2026-08-27.

### Problem observed

- At full desktop width, a single full-width SVG chart scales to an excessive height and visually overwhelms the compact School comparison matrix.
- At approximately half-screen width, vertically stacked charts have an appropriate size and balance.
- Browser zoom changes the available CSS width, causing the current proportional SVG to grow while the application chrome and navigation become smaller; chart scale therefore diverges from the surrounding interface.
- Pages will generally contain no more than two visible charts, although Literacy can expose a third instrument when the selected grades span Kindergarten and Grades 1–12.

### Recommended primary layout

- Use the chart section's actual content width, not the browser viewport, as the responsive breakpoint through a CSS container query.
- Render two equal chart columns when the usable chart area is wide enough (initial target: approximately 1,150–1,250 CSS pixels).
- Reflow to one vertical column below that content-width threshold so the current half-screen layout remains intact.
- When only one chart is visible, center it and apply a readable maximum width rather than stretching it across an ultrawide display.
- When three charts are visible, render two on the first row and center the third at the same column width on the second row.

### Chart sizing correction

- Replace proportional full-width SVG scaling with container-measured chart dimensions, using `ResizeObserver` or an equivalent React sizing hook.
- Keep chart height within a controlled range (initial target: roughly 320–380 CSS pixels) while calculating plot width from the actual card width.
- Recalculate axes, period groups, bars, median line, and labels from the measured width so text and marks remain crisp without vertically stretching the SVG.
- Preserve internal horizontal scrolling only for genuinely constrained layouts and do not allow chart geometry to create page-level overflow.

### Matrix grain correction

- Extend the School comparison row hierarchy to `School -> School Year -> Grade` so selections containing multiple grades never display a median rolled up across grades.
- Include Grade in the backend `SUMMARIZECOLUMNS` grain alongside School, School Year, Period, Term Group, and the matrix-specific Assessment Group context.
- Return Grade and Grade sort order in the typed API response. Verify the model's exact Grade sort metadata before implementation; if none is available, use the established governed fallback of Kindergarten first, followed by Grades 1 through 12.
- Sort matrix rows by School ascending, School Year descending, and Grade ascending. Continue sorting Period and Term Group columns by their model-governed sort values.
- Render one explicit Grade row beneath each School Year, including when only one grade is selected, and do not add an aggregate row across selected grades.
- Continue displaying `[Assessment (Median Score)]` as a whole number, evaluated in the complete School, School Year, Grade, Period, Term Group, and Assessment Group filter context.
- Validate representative multi-grade matrix cells against the semantic model or existing Power BI report to confirm that no cross-grade rollup remains.

### Optional chart expansion

- Treat modal expansion as a secondary enhancement, not the default way to understand the chart.
- If retained after testing the responsive two-column layout, add a compact expand control to each chart header and open an accessible native dialog with a larger chart.
- The dialog must support Escape, focus return, a clear close control, and the same semantic data/legend without issuing a different calculation query.

### Verification matrix

- Test full-screen, half-screen, tablet-width, and narrow/mobile layouts.
- Test browser zoom at 50%, 67%, 80%, 100%, 125%, and 150%.
- Verify one-, two-, and three-chart states, including Kindergarten-only CTOPP and Grade 1–12 Literacy selections.
- Confirm the chart section remains visually proportionate to the School comparison matrix and that no page-level horizontal drift returns.
- Verify the matrix hierarchy and values for single-grade and multi-grade selections, including Kindergarten followed by Grades 1 through 12 in the correct order.
- Keep the work local until ScottM approves the responsive behaviour and decides whether modal expansion is still useful.

### Next-session implementation order

1. Correct responsive chart sizing and wide-screen chart density.
2. Add Grade to the matrix query grain and `School -> School Year -> Grade` row hierarchy.
3. Run local frontend, backend, responsive-layout, and semantic-value checks for both changes.
4. Review the local result with ScottM; add modal expansion only if the corrected layout still benefits from it.
5. Do not publish to Azure without explicit approval.

### Local implementation results (2026-08-27)

- Replaced full-width proportional SVG scaling with `ResizeObserver`-measured chart geometry and a controlled 300-350 CSS-pixel chart height.
- Added an `inline-size` container query: two equal chart columns render at 1,180 CSS pixels or wider; narrower sections stack vertically. A single chart is centred at a 780-pixel maximum width, and a third chart is centred at the same column width below the first two.
- Preserved contained horizontal scrolling when multiple school-year/period categories require more plot width than a narrow chart card can provide.
- Added Grade and Grade sort order to `ExecutiveSchoolComparisonRow` and to the server-controlled matrix DAX grain.
- Updated the matrix row hierarchy and presentation to `School -> School Year -> Grade`, with one semantic-model median per Grade, Period, Term Group, and matrix Assessment Group context. No cross-grade aggregate row is rendered.
- Confirmed the model column `'Assessments'[Grade At Assessment Sort]` supplies the governed ordering, with the established Kindergarten/Grade 1-12 fallback retained in API parsing.
- The React production build succeeds and all 23 backend tests pass.
- A direct bounded query against `FVSDAnalytics` for Grades 3 and 4 returned 118 grade-specific cells across 20 school/grade combinations with distinct Grade 3 and Grade 4 rows and governed sort values 3 and 4.
- The local API reports healthy and the Vite development site returns HTTP 200. Local services remain available for user visual review at `http://127.0.0.1:5173/`.
- Responsive visual review at the requested browser widths and zoom levels remains a user acceptance check; no Azure deployment will occur until explicitly approved.

---

## 18. Proposed Change: Executive Overview UX Refinement

> **Change status:** Implemented, validated, and deployed to Azure on 2026-08-27.

### Protected functional boundaries

- Do not modify semantic-model queries, DAX, measures, API response contracts, filter propagation, Fabric RLS, Entra authentication/role context, school visibility, assessment calculations, or Azure hosting.
- Retain the validated responsive chart implementation and the `School -> School Year -> Grade` matrix grain.
- Derive all new presentation from data already available in the browser; do not add AI or new semantic-model requests.

### Executive summary

- Insert a compact `What needs our attention?` section immediately below Analysis Context and above Main Area of Focus.
- Render three accessible signal cards: Performance, Participation, and Focus.
- Derive the signal copy deterministically from the already-returned overview and comparison rows for the active domain, Assessment Group, filters, and latest available year; do not add a query or AI generation.
- Keep the section reusable so future pages can adopt the same Question -> Context -> Evidence -> Action pattern.

### Focus navigation and evidence context

- Strengthen the selected focus tab using FVSD Primary Blue, white text, and additional depth; retain a neutral unselected treatment and all existing behaviour.
- Add a short purpose statement beneath each assessment acronym. Initial mappings: TOSREC term submissions and median performance; TOWRE reading fluency and efficiency trends; CTOPP phonological processing indicators; PNSA foundational numeracy risk indicators; WRAT-5 mathematics performance trends.
- Preserve the current container-responsive two-column/one-column chart layout and controlled chart height. No SVG, calculation, or data-loading changes are planned.

### Matrix scanability

- Retain exact whole-number semantic values as standard dark text and supplement them with a compact right-aligned trend indicator.
- Use Foundation `#B20000` for Declining indicators, Curriculum `#00803A` for Improving indicators, and neutral grey for Stable indicators. Keep the existing Term Group header colours without adding value-level colour fills.
- Derive period-to-period trend indicators entirely in React within the same School, School Year, Grade, and Term Group row context: `▲` when the displayed whole number rises, `▼` when it falls, and `►` when it is unchanged. The first visible period has no prior-period indicator.
- Include accessible Improving, Declining, and Stable text through labels/tooltips while retaining the numeric value as the primary content.

### Sidebar hierarchy and current context

- Order the signed-in sidebar as Navigation -> Data Source and Current Context -> flexible space -> Current Role -> User Profile.
- Restore the Data Source card directly below navigation, showing the semantic model, workspace, delegated-user access, and live connection status.
- Merge Current Context into the Data Source card below a visible divider using existing frontend state: permitted/selected Schools, selected Year context, selected/all Grades, and active Role.
- Keep the developer role switcher at the bottom of the sidebar, immediately above the signed-in user details; for non-developers, show the active role as read-only in the same location.
- Do not display an invented Student count. A live Students value would require a new governed semantic-model result and is excluded by this phase's explicit no-query constraint; it can replace the Grades line in a later authorized data phase.

### Density and reuse

- Keep the new summary cards compact and reduce avoidable section padding so Summary -> Evidence -> Comparison remains as close as practical to one standard laptop viewport.
- Add reusable class/component patterns for signal cards, assessment context, matrix badges/trends, role context, and sidebar context rather than page-specific inline styling.
- Preserve responsive reflow and keyboard/accessibility behaviour at desktop, half-screen, tablet, and narrow widths.

### Local verification

1. Run the React production build and existing backend tests to prove protected contracts remain intact.
2. Verify no backend or semantic-model files changed.
3. Review selected/unselected focus states, one/two/three chart layouts, matrix badges/trends, sidebar ordering, and summary density locally.
4. Keep the work local and do not publish to Azure without explicit approval.

### Local implementation results (2026-08-27)

- Positioned Main Area of Focus directly below Analysis Context, followed by a compact, reusable `What needs our attention?` summary with Performance, Participation, and Focus cards.
- Strengthened selected focus tabs with FVSD Primary Blue, white text, and depth while keeping unselected tabs neutral and retaining existing tab/filter behaviour.
- Added plain-language purpose context for TOSREC, TOWRE, CTOPP, PNSA, and WRAT-5 without changing chart data or SVG calculations.
- Restored matrix scores to the preferred standard dark-text treatment and removed distracting value-level colour fills.
- Added accessible, right-aligned period-to-period `▲` Improving, `▼` Declining, and `►` Stable indicators derived in React from the already-returned whole-number values. Improving is green `#00803A`, Declining is red `#B20000`, Stable is neutral grey, and the first visible period correctly has no comparison indicator.
- Restored the Data Source card directly below navigation and merged Current Context into it below the Status row and an internal divider. It shows the returned semantic model, workspace, delegated-user access, live connection status, selected/permitted Schools, Year, Grades, and Role.
- Moved the developer Current Role switcher back to the sidebar bottom above the Entra security label and signed-in user details; non-developer role context uses the same footer location.
- Current Context uses existing filter state only. No ungoverned Student count was invented and no semantic-model/API change was introduced.
- Added responsive signal-card reflow and hid the detailed role/context cards in the established compact icon-only sidebar breakpoint.
- React production build succeeds; all 23 backend tests pass; the local frontend returns HTTP 200 and the API health endpoint reports healthy.
- Backend source timestamps confirm no API, DAX, semantic-model, authentication, RLS, or hosting source was modified during this UX phase.
- Local services remain available at `http://localhost:5173/` for visual acceptance review.
- Moved the School Comparison matrix above the evidence chart so users establish school/grade context before inspecting the visual detail.
- Made the existing matrix Assessment Group selector the shared evidence focus: the matrix continues querying its selected governed instrument, while the frontend now renders only that instrument's already-returned overview chart. Selecting TOSREC, TOWRE, CTOPP, PNSA, or WRAT-5 therefore produces one matching matrix and one matching chart without changing DAX, API contracts, or filter propagation.
- Reduced the chart loading placeholder to one block because only the selected Assessment Group chart is now visible.
- Removed the redundant `Persistent context` helper label from Analysis Context and the `Prototype signals` pill from the Executive Signals heading to reduce non-essential chrome; the signal content itself remains intentionally placeholder copy for UX validation.
- Increased the Analysis Context control-label size from 10px to 11px and strengthened its text colour so School year, Period, School, and Grade remain legible against the light-grey filter panel.
- Removed the former 780px single-chart maximum width. The selected assessment chart now stretches across the evidence container with consistent 18px outer padding while retaining its controlled 300-350px height and responsive plot calculations.
- Promoted the Assessment Group selector from the matrix header into Main Area of Focus so domain and instrument context are established before Executive Signals.
- Replaced the former generic Literacy signal examples with deterministic, selection-aligned copy: Performance compares the first and latest governed medians in the latest selected year; Participation totals returned `[Submitted]` term counts for the latest available period; Focus counts schools with at least one declining latest-period Term Group comparison. These calculations reuse the existing API response and introduce no new DAX, API call, or semantic-model logic.
- Restyled Main Area of Focus to use the same information hierarchy as Executive Signals: eyebrow, left-aligned focus title, explanatory subtitle, then a separate controls row containing the domain tabs and Assessment Group selector. The controls stack responsively on narrow screens.

### Cohort Group display-label refinement — 2026-08-27

> **Change status:** Implemented, user-approved, validated, and deployed as the locked Leadership PoC release on 2026-08-27.

- Verified directly against `FVSDAnalytics` that the exact model column is `'Term'[Cohort Group]`, with Foundation and Curriculum as the active matrix labels.
- Preserve `'Term'[Term Group]` as the matrix filter, grouping key, sort context, and comparison key so the governed median calculation is unchanged.
- Extend the existing term-definition response with Cohort Group and use it only as the matrix column display label: Below Average displays as Foundation, and Average and Above displays as Curriculum.
- Update the matrix title and explanatory copy from Term Group to Cohort Group while retaining the existing header colours, values, trends, and ordering.
- Replace the chart's compact dot legend with a dedicated horizontal performance key beneath the selected chart. Group model-visible terms under Foundation and Curriculum headings, render assessment-specific colours and ranges from the selected chart rows, and retain responsive stacking on narrow screens.
- For PNSA and future ADLOF selections, show only the Foundation and Curriculum headings because those assessments do not expose detailed performance bands. Other assessment selections show only their returned, applicable descriptive terms beneath the corresponding Cohort Group.
- Local verification passed: Fabric confirmed the exact Cohort Group mappings, the React production bundle succeeds, all 23 API tests pass, and no references to the former compact dot legend remain.
- Add matrix-to-chart focus: selecting a School / School Year / Grade row issues an overview request through the existing governed endpoint with that exact row context while leaving the matrix, global filters, Executive Signals, and RLS unchanged. The selected row is highlighted and the chart shows a clear focus banner with a reset action; clicking the selected row again also clears the focus.

### Locked Leadership PoC release revalidation — 2026-08-27T14:14:11-06:00

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd auth login --check-status`, `az account show`, and `azd env list` | Passed; interactive ScottM identity, existing `fvsd-insights-dev` environment, Pay-As-You-Go subscription `64b2bfe8-fb82-4105-991c-95a36ad469c5`, Canada Central |
| Existing target | Resource-group state and `azd-service-name=web` inventory | Passed; resource group is Succeeded and exactly one App Service target exists |
| React build and dependency audit | `npm run build` and `npm audit --audit-level=high` | Passed; locked production bundle generated and zero vulnerabilities reported |
| ASP.NET Core tests and dependency audit | `dotnet test FVSDNexus.sln --configuration Release` and `dotnet list ... --vulnerable --include-transitive` | Passed; 23 tests, zero failures, and no vulnerable packages reported |
| Bicep compile/lint | `az bicep build --file infra/main.bicep --stdout` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Static RBAC review | `infra/resources.bicep` role-assignment inspection | Passed; App Service system identity retains only Key Vault Secrets User on the application vault with `ServicePrincipal` principal type |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; only the existing Microsoft Defender for Cloud default assignment is present |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no resource creation or deletion; only reconciliation of existing App Service and monitoring properties |
| Package validation | `azd package --no-prompt` | Passed; Cohort Group labels, horizontal performance key, and matrix-to-chart focus compiled into the Azure package |

### Locked Leadership PoC deployment — 2026-08-27T14:17:36-06:00

> **Release designation:** This deployed state is the locked PoC baseline for Leadership discussion. Further application changes require a new explicitly approved release cycle.

| Check | Command | Result |
|-------|---------|--------|
| Infrastructure reconciliation | `azd provision --no-prompt` | Passed; existing resources required no changes |
| Application deployment | `azd deploy --no-prompt` | Passed; locked PoC package deployed successfully |
| Endpoint inventory | `azd show` | Passed; `web` resolves to `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/` |
| Production health | `GET /health` | HTTP 200 with `{"status":"healthy","service":"FVSD Insights"}` |
| Exact frontend release | Production HTML asset inspection and HTTP request | Passed; production serves `assets/index-CPlMhe-R.js`, exactly matching the validated local bundle, with HTTP 200 |
| Release fingerprints | Local SHA-256 | JavaScript `6717FD05177D0E13BED5ADEE9145C85A3BEAC18821438E1768EE4C2E346E91CD`; CSS `D44D0D8C20D1237C37E99915F465A7D548760F7948B41A1076F14C540434CE97` |
| Entra sign-in challenge | `GET /api/auth/signin` without following redirects | HTTP 302 to the FVSD tenant using client `b9a8631e-8e03-4204-8d7e-a487bfe33b2f`, the production callback, and delegated `Dataset.Read.All` scope |
| Key Vault reference | App Service configuration-reference API | `AzureAd__ClientSecret` reports `Resolved` through the system-assigned identity |
| Live RBAC | App Service identity and vault-scoped role query | `Key Vault Secrets User` remains assigned to the App Service system identity at the application vault only |

### End-to-End Governed TOSREC Lifecycle Revalidation - 2026-09-02T14:01:16-06:00

> **Release boundary:** This release completes the TOSREC operational proof with delegated Dataverse create, complete record view, current-period edit, role-restricted delete, exempt-record handling, and immediate history refresh. Other assessment-specific adapters and the historical correction-request workflow remain outside this release.

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd version`, `azd auth login --check-status`, `azd env list`, and filtered environment/account checks | Passed; signed-in FVSD identity, existing `fvsd-insights-dev` environment, Pay-As-You-Go subscription, and Canada Central |
| Project schema and specialization | `azure.yaml` inspection plus Aspire and Dockerfile scan | Passed; the existing App Service service definition remains valid, and the solution is neither Aspire nor container based |
| React build and dependency audit | `npm audit --audit-level=high` and `npm run build` | Passed; production bundle generated and zero vulnerabilities reported |
| ASP.NET Core tests and dependency audit | `dotnet test FVSDNexus.sln --configuration Release --no-restore` and `dotnet list ... --vulnerable --include-transitive` | Passed; 65 tests, zero failures, and no vulnerable packages reported |
| Bicep compile/lint | `az bicep build --file infra/main.bicep --stdout` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Static RBAC review | `infra/resources.bicep` role-assignment inspection | Passed; the App Service system identity retains only Key Vault Secrets User on the application vault with `ServicePrincipal` principal type |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; only the existing Microsoft Defender for Cloud default assignment is present |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no resource creation or deletion; preview contains only existing App Service and monitoring property reconciliation |
| Package validation | `azd package --no-prompt` | Passed after closing the local Vite preview that held a Windows native-module file lock |
| Release fingerprints | Local SHA-256 | JavaScript `A7843193942719867A7B35A99ED7A50CCEC0F542C4FC39E7511F4D246682D727`; CSS `6A2E88D70F51FECB3C76C9C7BE61E3A7F21824C092DE1494B86BEE073760649D` |

### End-to-End Governed TOSREC Lifecycle Deployment - 2026-09-02T14:08:55-06:00

> **Release designation:** This deployed state is the locked PoC baseline for the complete TOSREC assessment lifecycle and the reusable master-detail operational pattern.

| Check | Command | Result |
|-------|---------|--------|
| GitHub release | `git push origin main` | Passed; application release commit `3afb8d1` is published on `main` |
| Infrastructure reconciliation | `azd provision --no-prompt` | Passed; the existing Canada Central resources required no changes |
| Application deployment | `azd deploy --no-prompt` | Passed; the validated App Service package deployed successfully |
| Endpoint inventory | `azd show` | Passed; `web` resolves to `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/` |
| Production health | `GET /health` | HTTP 200 with `{"status":"healthy","service":"FVSD Nexus"}` |
| Exact frontend release | Production HTML asset inspection and SHA-256 comparison | Passed; production serves `assets/index-DulN5HUe.js` and `assets/index-BLQ7B_wz.css`, exactly matching the validated local bundle |
| Release fingerprints | Production SHA-256 | JavaScript `A7843193942719867A7B35A99ED7A50CCEC0F542C4FC39E7511F4D246682D727`; CSS `6A2E88D70F51FECB3C76C9C7BE61E3A7F21824C092DE1494B86BEE073760649D` |
| Entra sign-in challenge | `GET /api/auth/signin` without following redirects | HTTP 302 to `login.microsoftonline.com` |
| Key Vault reference | App Service configuration-reference API | `AzureAd__ClientSecret` reports `Resolved` through the system-assigned identity |
| Live RBAC | App Service identity and vault-scoped role query | `Key Vault Secrets User` remains assigned to the App Service system identity at the application vault only |

### Foundations 1 IPP Preview and FVSD Nexus Branding Revalidation - 2026-09-02T08:17:34-06:00

> **Release boundary:** This release adds a static, clearly labelled Foundations 1 IPP discussion preview and replaces the former analytics-agent mark with the supplied FVSD Nexus logo pack. It does not add live IPP data capture, Dataverse writes, workflow, approval, or export behaviour.

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd version`, `azd auth login --check-status`, `azd env list`, `az account show` | Passed; interactive FVSD identity, existing `fvsd-insights-dev` environment, Pay-As-You-Go subscription `64b2bfe8-fb82-4105-991c-95a36ad469c5`, Canada Central |
| Existing target | `az resource list --tag azd-service-name=web` | Passed; exactly one App Service target exists in Canada Central |
| Project and package schema | `azure.yaml` inspection and `azd package --no-prompt` | Passed; the existing App Service service definition was accepted and packaged successfully |
| Specialized/runtime checks | Aspire marker and Dockerfile scan | Passed; not Aspire and no Docker build context |
| React build and dependency audit | `npm ci`, `npm audit --audit-level=high`, and `npm run build` | Passed; production bundle generated and zero vulnerabilities reported |
| ASP.NET Core tests and dependency audit | `dotnet test FVSDNexus.sln --configuration Release` and `dotnet list ... --vulnerable --include-transitive` | Passed; 45 tests, zero failures, and no vulnerable packages reported |
| Bicep compile/lint | `az bicep build --file infra/main.bicep --stdout` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Static RBAC review | `infra/resources.bicep` role-assignment inspection | Passed; App Service system identity retains only Key Vault Secrets User on the application vault with `ServicePrincipal` principal type |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; only the existing Microsoft Defender for Cloud default assignment is present |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no resource creation or deletion; preview contains only existing App Service and monitoring property reconciliation |
| Package validation | `azd package --no-prompt` | Passed; the IPP preview, Nexus branding assets, favicons, and updated documentation compiled into the Azure package |
| Release fingerprints | Local SHA-256 | JavaScript `55818532EBB835A7E72891563A4D4DAF418665F86068DE30892B42D18E0A3545`; CSS `4AC109B1D32976F8D3EB82FCDAE6ECF483C1AF3B7414BE6A244C8BB02B01458E` |

### Developer Student Identifier Display Revalidation - 2026-09-02T08:35:19-06:00

> **Release boundary:** This developer-only UX control switches student names and ASNs between real and synchronized obfuscated display values. It changes presentation only: record IDs, authorization, Dataverse queries, assessment-history requests, and stored records remain unchanged.

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd version`, `azd auth login --check-status`, `azd env list`, `az account show` | Passed; interactive FVSD identity, existing `fvsd-insights-dev` environment, Pay-As-You-Go subscription `64b2bfe8-fb82-4105-991c-95a36ad469c5`, Canada Central |
| Project and package schema | `azure.yaml` inspection and `azd package --no-prompt` | Passed; the existing App Service service definition was accepted and packaged successfully |
| Specialized/runtime checks | Aspire marker and Dockerfile scan | Passed; not Aspire and no Docker build context |
| React build and dependency audit | `npm audit --audit-level=high` and `npm run build` | Passed; production bundle generated and zero vulnerabilities reported |
| ASP.NET Core tests and dependency audit | `dotnet test FVSDNexus.sln --configuration Release` and `dotnet list ... --vulnerable --include-transitive` | Passed; 45 tests, zero failures, and no vulnerable packages reported; student projection assertions include real and obfuscated names and ASNs |
| Bicep compile/lint | `az bicep build --file infra/main.bicep --stdout` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Static RBAC review | `infra/resources.bicep` role-assignment inspection | Passed; App Service system identity retains only Key Vault Secrets User on the application vault with `ServicePrincipal` principal type |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; only the existing Microsoft Defender for Cloud default assignment is present |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no resource creation or deletion; preview contains only existing App Service and monitoring property reconciliation |
| Package validation | `azd package --no-prompt` | Passed; the developer display toggle and documentation compiled into the existing App Service package |
| Release fingerprints | Local SHA-256 | JavaScript `20B6503B40D9B1394C8ECD2BD312270FA5D6CB9DDDCC88DFC0D0FD366B39C49C`; CSS `0ABAAE7136449DB190E0C7909B30DF93A731322780AA83A0D20E7E72E2CF71E1` |

### IPP Preview, Nexus Branding, and Student Identifier Display Deployment - 2026-09-02T08:44:07-06:00

| Check | Command | Result |
|-------|---------|--------|
| GitHub release | `git push origin main` | Passed; application release commit `6444aa1` is published on `main` |
| Infrastructure reconciliation | `azd provision --no-prompt` | Passed; existing Canada Central resources required no changes |
| Application deployment | `azd deploy --no-prompt` | Passed; the validated App Service package deployed successfully |
| Endpoint inventory | `azd show` | Passed; `web` resolves to `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/` |
| Production health | `GET /health` | HTTP 200 with `{"status":"healthy","service":"FVSD Nexus"}` |
| Exact frontend release | Production HTML asset inspection and SHA-256 comparison | Passed; production serves `assets/index-e2FLpO-d.js` and `assets/index-rkCssgqh.css`, exactly matching the validated local bundle |
| Release fingerprints | Production SHA-256 | JavaScript `20B6503B40D9B1394C8ECD2BD312270FA5D6CB9DDDCC88DFC0D0FD366B39C49C`; CSS `0ABAAE7136449DB190E0C7909B30DF93A731322780AA83A0D20E7E72E2CF71E1` |
| Student display control | Production JavaScript inspection | Passed; the obfuscated-mode label and no-real-identifier fallback are present in the deployed bundle |
| Nexus browser branding | `GET /favicon-32.png` | HTTP 200 with `image/png` content type |
| Entra sign-in challenge | `GET /api/auth/signin` without following redirects | HTTP 302 to the FVSD tenant at `login.microsoftonline.com` |
| Key Vault reference | App Service configuration-reference API | `AzureAd__ClientSecret` reports `Resolved` through the system-assigned identity |
| Live RBAC | App Service identity and vault-scoped role query | `Key Vault Secrets User` remains assigned to the App Service system identity at the application vault only |

### Class Assignment and TOSREC History PoC Revalidation - 2026-09-01T11:10:08-06:00

> **Release boundary:** This release locks the role-scoped Class Assignment, student-roster, authenticated school-year, and read-only TOSREC history slice. Assessment forms, scoring previews, Dataverse writes, and additional assessment-history adapters remain outside this deployment.

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd version`, `azd auth login --check-status`, `azd env list`, `az account show` | Passed; interactive FVSD identity, existing `fvsd-insights-dev` environment, Pay-As-You-Go subscription `64b2bfe8-fb82-4105-991c-95a36ad469c5`, Canada Central |
| Existing target | Resource-group state and `azd-service-name=web` inventory | Passed; resource group is Succeeded and exactly one App Service target exists |
| Specialized/runtime checks | Aspire marker and Dockerfile scan | Passed; not Aspire and no Docker build context |
| React build and dependency audit | `npm ci`, `npm audit --audit-level=high`, and `npm run build` | Passed; production bundle generated and zero vulnerabilities reported |
| ASP.NET Core tests and dependency audit | `dotnet test FVSDNexus.sln --configuration Release` and `dotnet list ... --vulnerable --include-transitive` | Passed; 45 tests, zero failures, and no vulnerable packages reported |
| Bicep compile/lint | `az bicep build --file infra/main.bicep --stdout` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Static RBAC review | `infra/resources.bicep` role-assignment inspection | Passed; App Service system identity retains only Key Vault Secrets User on the application vault with `ServicePrincipal` principal type |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; only the existing Microsoft Defender for Cloud default assignment is present |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no resource creation or deletion; preview contains only FVSD Nexus tag reconciliation and existing App Service/monitoring property normalization |
| Package validation | `azd package --no-prompt` | Passed; the Class Assignment workspace, authenticated school-year context, role-scoped Dataverse queries, student roster, and TOSREC history compiled into the Azure package |
| Release fingerprints | Local SHA-256 | JavaScript `F4F26779B18121D1AB33A760329ECC13AFEE4A223831FA59005F6E23D23F6094`; CSS `7BFBD3D579FBE078DD5EFC23083E263471F062759568BB5309DB7F2A39229136` |

### Class Assignment and TOSREC History PoC Deployment - 2026-09-01

> **Release designation:** This deployed state is the locked PoC baseline for the Class Assignment and read-only TOSREC history experience. Further changes to this capability require a new explicitly approved release cycle.

| Check | Command | Result |
|-------|---------|--------|
| Infrastructure reconciliation | `azd provision --no-prompt` | Passed; the six existing Canada Central resources were reconciled successfully with no resource creation or deletion |
| Application deployment | `azd deploy --no-prompt` | Passed; validated package deployed successfully to the existing App Service |
| Endpoint inventory | `azd show` | Passed; `web` resolves to `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/` |
| Production health | `GET /health` | HTTP 200 with `{"status":"healthy","service":"FVSD Nexus"}` |
| Exact frontend release | Production HTML asset inspection and HTTP request | Passed; production serves `assets/index-BZSSeVlR.js`, exactly matching the validated local bundle |
| Release fingerprint | Production SHA-256 | JavaScript `F4F26779B18121D1AB33A760329ECC13AFEE4A223831FA59005F6E23D23F6094` |
| Entra sign-in challenge | `GET /api/auth/signin` without following redirects | HTTP 302 to `login.microsoftonline.com` |
| Key Vault reference | App Service configuration-reference API | `AzureAd__ClientSecret` reports `Resolved` through the system-assigned identity |
| Live RBAC | App Service identity and vault-scoped role query | `Key Vault Secrets User` remains assigned to the App Service system identity at the application vault only |

### Executive Overview UX Release Revalidation — 2026-08-27T10:00:48-06:00

| Check | Command | Result |
|-------|---------|--------|
| Azure context | `azd version`, `azd auth login --check-status`, `azd env list`, `az account show` | Passed; interactive ScottM identity, existing `fvsd-insights-dev` environment, Pay-As-You-Go subscription `64b2bfe8-fb82-4105-991c-95a36ad469c5`, Canada Central |
| Existing target | Resource-group state and `azd-service-name=web` inventory | Passed; resource group is Succeeded and exactly one App Service target exists |
| Specialized/runtime checks | Aspire marker and Dockerfile scan | Passed; not Aspire and no Docker build context |
| React build and dependency audit | `npm run build` and `npm audit --audit-level=high` | Passed; production bundle generated and zero vulnerabilities reported |
| ASP.NET Core tests and dependency audit | `dotnet test FVSDNexus.sln --configuration Release` and `dotnet list ... --vulnerable --include-transitive` | Passed; 23 tests, zero failures, and no vulnerable packages reported |
| Bicep compile/lint | `az bicep build --file infra/main.bicep --stdout` and `az bicep lint --file infra/main.bicep` | Passed without errors or warnings |
| Static RBAC review | `infra/resources.bicep` role-assignment inspection | Passed; App Service system identity retains only Key Vault Secrets User on the application vault with `ServicePrincipal` principal type |
| Azure policy review | `az policy assignment list` at subscription scope | Passed; only the existing Microsoft Defender for Cloud default assignment is present |
| Provisioning preview | `azd provision --preview --no-prompt` | Passed; no resource creation or deletion; only reconciliation of existing App Service and monitoring properties |
| Package validation | `azd package --no-prompt` | Passed after stopping the local Vite process that held a Windows native-module file lock; application published and compressed successfully |

### Executive Overview UX Release Deployment — 2026-08-27T10:08:14-06:00

| Check | Command | Result |
|-------|---------|--------|
| Infrastructure reconciliation | `azd provision --no-prompt` | Passed; existing resources required no changes |
| Application deployment | `azd deploy --no-prompt` | Passed; App Service package deployed successfully |
| Endpoint inventory | `azd show` | Passed; `web` resolves to `https://app-fvsd-insights-iwmpkez4.azurewebsites.net/` |
| Production health | `GET /health` | HTTP 200 with `{"status":"healthy","service":"FVSD Insights"}` |
| Release asset | Production HTML asset inspection and HTTP request | Passed; production serves `assets/index-C0DTansa.js`, exactly matching the validated local bundle, with HTTP 200 |
| Entra sign-in challenge | `GET /api/auth/signin` without following redirects | HTTP 302 to the FVSD tenant using client `b9a8631e-8e03-4204-8d7e-a487bfe33b2f`, the production callback, and delegated `Dataset.Read.All` scope |
| Key Vault reference | App Service configuration-reference API | `AzureAd__ClientSecret` reports `Resolved` through the system-assigned identity |
| Live RBAC | App Service identity and vault-scoped role query | `Key Vault Secrets User` remains assigned to the App Service system identity at the application vault only |
