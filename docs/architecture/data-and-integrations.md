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
| Provincial student information | Alberta Education PASI | Proposed read, update, status, and synchronization operations through a dedicated FVSD connector; exact approved domains remain open. |

## Dataverse

Dataverse is the de facto truth store for Nexus operational capabilities.

Existing assets include:

- Stable assessment tables and relationships.
- Working Canvas forms that demonstrate field and form visibility behaviour.
- Assessment reference tables.
- PowerSchool-synchronized demographic tables.
- Structures covering an estimated 80% of the anticipated IPP requirement.

The remaining IPP extension is currently estimated at no more than approximately ten additional tables. That estimate must be confirmed during detailed discovery.

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

## Future documentation

This page should eventually link to a Dataverse table catalogue, relationship diagram, synchronization inventory, and semantic-model query catalogue. Those artifacts must not contain student records or credentials.

## Proposed PASI integration

An FVSD-owned PASI connector is documented as a strategic extension, not as part of the currently deployed PoC. The connector would commit the Nexus operation to Dataverse first, process provincial exchange asynchronously through a durable outbox/queue, and return acceptance, version, validation, alert, retry, or reconciliation status to Dataverse.

The proposed design keeps the registered PASI client certificate in a server-side governed store, isolates generated provincial contracts behind an adapter, applies PASI optimistic-concurrency rules, and prevents student payloads from entering telemetry. See the [PASI capability](../capabilities/pasi-connector/README.md), [connector architecture](pasi-connector.md), and [official reference index](../reference/pasi-resources.md).
