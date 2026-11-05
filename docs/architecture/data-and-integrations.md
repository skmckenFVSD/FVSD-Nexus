# Data and integrations

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Architecture](README.md) / Data and integrations

## Ownership model

| Information | Authoritative source | Nexus usage |
|---|---|---|
| Assessment and IPP operational records | Dataverse | Create, read, update, workflow, and audit through delegated access. |
| Student demographic and enrolment context | PowerSchool, synchronized to Dataverse | Read the synchronized Dataverse tables during interactive workflows. |
| Assessment scoring references | Dataverse reference tables | Query using derived assessment keys; do not duplicate reference data in React. |
| Governed measures and analytical classifications | `FVSDAnalytics` semantic model | Query through predefined DAX endpoints. |
| Application identity and user membership | Microsoft Entra ID | Authentication, group context, and licence lookup where required. |
| Provincial student information | Alberta Education PASI | Phase 4 read, update, status, and synchronization operations through a dedicated FVSD connector; exact approved domains remain open. |
| Fabric discovery and governance metadata | Fabric OneLake catalog and Fabric metadata | Discover Fabric items, ownership, endorsement, definitions, and lineage without granting access to source data. |
| Information protection and compliance | Microsoft Purview | Apply sensitivity, DLP, audit, risk, and compliance controls. Any FVSD use of Purview Unified Catalog is an enterprise-governance decision, separate from Fabric source authorization. |
| Data-product workflow and documentation orchestration | Existing FVSD Data Product Agent and Fabric Documentation Agent | Phase 3 integration through bounded contracts; these assets retain their own governance and authorization boundaries. |

## Dataverse

Dataverse is the de facto truth store for Nexus operational capabilities.

Existing assets include:

- Stable assessment tables and relationships.
- Working Canvas forms that demonstrate field and form visibility behaviour.
- Assessment reference tables.
- PowerSchool-synchronized demographic tables.
- Existing annual-plan, module-definition, goal, progress-level, activity, condition, assessment, attachment, and export structures used by the working Educational Framework Canvas app.

IEP/IPP composition is modular. `fvsd_ippsection` is the governed module-definition catalogue, while `fvsd_studentipp.fvsd_ippsections` stores the selected definition GUIDs as a canonical pipe-delimited membership list. Module content remains in structured related records; Nexus does not create another per-module HTML column. Additional module-specific tables will be introduced only where Dossier migration identifies a genuinely distinct structured-data requirement.

## PowerSchool

Nexus should not repeatedly call the PowerSchool Web API to render ordinary forms. The existing synchronization provides the required data locally in Dataverse, improving responsiveness and reducing external runtime dependencies.

The interface should make data freshness understandable where a synchronized attribute materially affects a workflow.

## OneLake and Fabric

The Dataverse-to-OneLake connection is established and uses the newer low-latency model. FVSD currently observes approximately 15 minutes for operational changes to appear in the analytical layer.

Consequences:

- Confirm a successful save directly from Dataverse.
- Do not wait for Fabric to confirm an operational transaction.
- Clearly distinguish immediate operational values from asynchronously refreshed analytics.
- Test analytics refresh expectations independently from transaction correctness.

## Semantic model

- Workspace: `Assessment Screening`
- Semantic model: `FVSDAnalytics`
- Access pattern: predefined DAX through the ASP.NET Core backend.
- Calculations: existing model measures remain authoritative.
- Security: signed-in Fabric identity and RLS remain effective.

## Examples by layer

The layers answer different questions. Nexus should show the connection between them without presenting them as one undifferentiated store.

| Layer | FVSD examples | Question it answers |
|---|---|---|
| Experience | Class Assignment, Assessments, IEP/IPP, Leadership Analytics, and future Copilot skills | What is this person trying to do? |
| Operational data | Dataverse student assessment records, `fvsd_studentipp`, `fvsd_ippsection`, intervention records, scoring references, enrolment context, and audit state | What was entered, changed, approved, or completed? |
| Integration and analytical data | PowerSchool synchronization, Dataverse-to-OneLake link, Fabric lakehouse objects, and documented transformations | How did operational information reach the analytical environment? |
| Semantic | `FVSDAnalytics` measures such as `Submissions`, assessment-school and assessment-teacher context, current ASN selection, trends, and RLS | What governed calculation or comparison should staff use? |
| Understanding | Business definitions, technical descriptions, lineage, ownership, freshness, certification, and support contacts | What does this information mean and can it be trusted for this purpose? |
| Protection and compliance | Sensitivity labels, DLP decisions, audit, retention, risk, and approved processing boundaries | How must this information be handled? |

### How the agents connect the layers

The Fabric Documentation Agent retrieves authoritative technical descriptions and lineage from the analytical environment. The Data Product Agent then coordinates the governed lifecycle around that evidence: it can find an existing data product, validate required ownership and metadata, compile a deterministic payload, route review, perform an approved upsert or publication action, notify the responsible people, and preserve audit correlation.

This separation is deliberate. The Documentation Agent explains technical truth; the Data Product Agent coordinates a controlled process. Neither agent becomes the source of student records, semantic calculations, permissions, or policy.

## Assessment scoring

Scoring is intentionally reference-driven:

```text
Validate inputs
  -> Derive age, period, raw, or composite keys
  -> Query the applicable Dataverse reference table
  -> Return the governed SS, percentile, and classification
  -> Save inputs, outputs, and scoring context
```

This keeps scoring visible and maintainable as governed data rather than distributing assessment mathematics through client code.

## Historical integrity

Operational records must preserve sufficient scoring and context values to explain the historical result even if:

- A student changes grade or school.
- PowerSchool synchronization updates demographic context.
- Assessment reference tables are revised.
- Analytical classifications evolve.

## Documentation to complete

This page should eventually link to a Dataverse table catalogue, relationship diagram, synchronization inventory, and semantic-model query catalogue. Those artifacts must not contain student records or credentials.

## Phase 4 PASI integration

An FVSD-owned PASI connector is Phase 4. The connector will commit the Nexus operation to Dataverse first, process provincial exchange asynchronously through a durable outbox/queue, and return acceptance, version, validation, alert, retry, or reconciliation status to Dataverse.

The Phase 4 design keeps the registered PASI client certificate in a server-side governed store, isolates generated provincial contracts behind an adapter, applies PASI optimistic-concurrency rules, and prevents student payloads from entering telemetry. See the [PASI capability](../capabilities/pasi-connector/README.md), [connector architecture](pasi-connector.md), and [official reference index](../reference/pasi-resources.md).

## Phase 3 Purview and governance-agent integration

The Data Analyst workspace can compose the existing FVSD Data Product Agent and Fabric Documentation Agent with Microsoft Purview. Fabric's OneLake catalog is the primary discovery and governance surface inside Fabric. Purview adds information protection and compliance capabilities across the estate. If FVSD adopts Purview Unified Catalog for enterprise data products and glossary, that catalogue remains a separate metadata plane; Microsoft Graph Purview APIs may also evaluate approved Nexus text or file activities for a known signed-in user.

Nexus must not treat its Data Analyst experience role as permission to administer Purview, read source data, or publish catalog changes. Entra, Fabric, Dataverse, Purview, and the external agent contracts remain authoritative. See the [Purview capability](../capabilities/purview-governance/README.md), [agent architecture](purview-governance.md), and [reference index](../reference/purview-resources.md).
