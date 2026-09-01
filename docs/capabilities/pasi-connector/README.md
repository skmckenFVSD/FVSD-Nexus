# PASI provincial connector

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Capabilities](../README.md) / PASI provincial connector

**Status:** Proposed strategic capability; public technical feasibility established, FVSD onboarding and submission scope remain open

An FVSD-owned Provincial Approach to Student Information (PASI) connector could become one of the strongest reasons to move Nexus from proof of concept to funded development. It would allow FVSD to govern operational student workflows in Nexus and Dataverse while exchanging authorized provincial records directly with Alberta Education.

This is not the next application build. The next direct slice remains one complete assessment-entry journey. PASI is documented now so Leadership can see that it is a credible, staged extension rather than an undefined aspiration.

## Executive value

A successful connector could provide:

- Greater FVSD control over provincial integration timing, support, diagnostics, and change management.
- A single governed workflow spanning Nexus, Dataverse, PowerSchool-synchronized context, and provincial reporting.
- Less dependency on third-party interfaces when replacing existing IPP and related student-support tooling.
- Visible submission, warning, failure, retry, and reconciliation status for authorized staff.
- Reuse of the same operational records for user workflows, provincial integration, and governed Fabric analytics.
- A foundation that can expand one approved PASI domain at a time instead of requiring a high-risk all-at-once replacement.

The business case must include lifetime support, provincial contract changes, certificate operations, testing, and reconciliation. Avoided vendor dependency is valuable, but it is not free integration.

## Feasibility finding

The publicly available Alberta Education technical material supports the feasibility of a custom district connector:

- PASI Core is exposed through versioned web-service contracts.
- PASI clients authenticate with a registered client certificate.
- Every request includes caller information identifying the organization represented by the client.
- Authorization is constrained by the registered client, represented organization, service permission, and the organization's association with the student.
- PASI uses optimistic concurrency through `PASICoreVersion`; updates using a stale version are rejected rather than silently overwriting newer provincial data.
- Synchronization uses client-initiated `IsDataAvailable` long polling followed by entity or status retrieval.
- Service faults, validation rules, warnings, advice, acknowledgements, and other Core Alerts are defined operational concepts.
- Alberta Education publishes WSDL packages and downloadable .NET reference-client source covering connectivity, student retrieval, student updates, enrolment submission, and entity/status synchronization.

These assets demonstrate technical viability. They do not by themselves confirm FVSD registration, approved operations, the production contract version, delivery effort, or authorization to replace an incumbent connector.

## Proposed capability boundary

The connector should be a separate integration service. It should not be embedded in React and should not make an ordinary Nexus save depend synchronously on provincial service availability.

```text
Authorized Nexus user
  -> validated operational action
  -> Dataverse transaction and audit
  -> durable PASI submission request
  -> FVSD PASI connector
  -> certificate-authenticated PASI operation
  -> response, version, fault, or Core Alert
  -> Dataverse integration status and reconciliation
```

Dataverse remains the operational truth store for Nexus. PASI remains authoritative for the provincial information and version returned by PASI. The connector must preserve both sides of that boundary rather than pretending one database owns every fact.

## Proposed connector capabilities

### Submission

- Map an approved Dataverse record to an explicit PASI contract version.
- Populate required caller and organization context.
- Validate required values and code sets before transmission.
- Submit with a correlation identifier and idempotency strategy appropriate to the PASI operation.
- Preserve the PASI request type, business key, source record, initiating Nexus user, represented organization, and timestamps without logging the full student payload.

### Concurrency and correction

- Store the last accepted `PASICoreVersion` for records that participate in provincial updates.
- Reject or queue a conflict when the locally held version is stale.
- Retrieve the current provincial record and present a controlled reconciliation path.
- Keep corrections auditable; do not silently overwrite either the Dataverse or PASI value.

### Synchronization

- Maintain durable synchronization checkpoints.
- Use the documented availability and retrieval pattern rather than repeatedly scanning all provincial records.
- Process entity and status changes independently where the contract distinguishes them.
- Make synchronization resumable after connector or network interruption.

### Errors and Core Alerts

- Distinguish transport/authentication faults, contract exceptions, validation failures, warnings, advice, and asynchronous status changes.
- Retry only transient failures.
- Route business-data problems to an authorized work queue.
- Support acknowledgement operations where the applicable PASI contract requires or permits them.
- Provide reconciliation evidence suitable for operational support and audit.

### Operations

- Monitor certificate expiry, connectivity, queue age, processing latency, failure rate, and unresolved reconciliation items.
- Alert before certificate or contract-version expiry becomes an outage.
- Provide replay controls that cannot create duplicate provincial submissions.
- Keep production student payloads and certificate material out of telemetry.

## Identity and security model

PASI system authentication is distinct from Nexus interactive-user licensing and identity:

- The FVSD user remains individually authenticated, licensed where required, authorized, and recorded as the initiator of the Dataverse operation.
- The connector calls PASI using the registered FVSD client certificate and the permitted organization context.
- The private key belongs in Azure Key Vault or an equivalently governed certificate store and must never be delivered to the browser, committed to Git, or stored in Dataverse.
- The connector's Azure managed identity should receive only the Key Vault and operational-resource permissions it requires.
- Student payloads, ASNs, names, dates of birth, tokens, and certificate details must not appear in application telemetry.

The exact certificate issuance, registration, renewal, production endpoint, and organizational authorization process must be confirmed directly with Alberta Education.

## Relationship to IPP and third-party replacement

The proposed [IPP capability](../ipp/README.md) and PASI connector reinforce one another but are not the same project:

- The IPP experience owns plan creation, goals, progress, review, approval, and parent-facing output.
- The PASI connector owns only the provincial data exchanges that Alberta Education supports and FVSD is authorized to perform.
- Discovery must establish which Intellimedia or Jigsaw functions are PASI integration responsibilities, which are PowerSchool responsibilities, and which are purely local IPP/intervention workflows.
- No assumption should be made that an entire IPP document or every supporting field is submitted to PASI.

## Staged delivery

| Stage | Outcome | Exit evidence |
|---|---|---|
| 0. Discovery and onboarding | Confirm supported operations, environments, client registration, certificate process, ownership, and non-production access. | Written scope, contacts, access path, security design, supported contract version. |
| 1. Connectivity spike | Build a minimal isolated connector and call the documented connectivity operation. | Registered non-production certificate, successful call, correlation and safe telemetry. |
| 2. Read and synchronization proof | Retrieve one approved entity/status domain and implement checkpointed availability processing. | Repeatable sync, restart recovery, no duplicate processing, reconciliation output. |
| 3. Narrow write proof | Submit one low-volume, explicitly approved operation using PASI version/concurrency rules. | Accepted write, stale-version test, validation-failure test, audit trail. |
| 4. Operational hardening | Add queues, retries, alerts, certificate lifecycle, runbooks, and support dashboards. | Failure/recovery exercise and operational acceptance. |
| 5. Domain expansion | Add further PASI domains one at a time and retire overlapping incumbent functions only after parallel reconciliation. | Domain-specific acceptance and migration approval. |

## Executive demonstration

A compelling development-stage demonstration would show:

1. A named FVSD user completes an authorized Nexus action.
2. Dataverse records the operation and its initiator.
3. The connector creates a traceable provincial submission without exposing the student payload in logs.
4. PASI accepts the operation and returns its version/status.
5. Nexus displays the accepted state.
6. A stale-version case is safely rejected and reconciled.
7. A PASI warning or advice is routed to an authorized staff work queue.
8. A temporary outage is retried without duplicate submission.

That evidence would prove more than a successful API call: it would demonstrate that FVSD can own the integration operationally.

## Open decisions

- Which PASI business domains are currently handled by Intellimedia, Jigsaw, PowerSchool, or another connector?
- Which PASI operations would create the greatest executive and operational value for the first proof?
- What client registration and non-production environments are available to FVSD?
- Which contract version and endpoints are currently supported for new district clients?
- Who owns certificate issuance, renewal, emergency rotation, and revocation?
- Which warnings, advice, and reconciliation items require a Nexus administrative workflow?
- What service availability, recovery, retention, privacy, and audit obligations apply?
- Which incumbent functions can be retired only after parallel-run reconciliation?

## Related documentation

- [PASI connector architecture](../../architecture/pasi-connector.md)
- [Official PASI reference index](../../reference/pasi-resources.md)
- [Data and integrations](../../architecture/data-and-integrations.md)
- [Identity, licensing, and security](../../architecture/identity-licensing-security.md)
- [IPP capability](../ipp/README.md)
- [Full PoC definition](../../delivery/full-poc-definition.md)
- [Decision register](../../decisions/decision-register.md)
