# Residency and platform options

## Confirmed boundary

Identifiable student data, assessment records, IPP information, and student-identifiable AI context must remain inside the approved Canadian geography.

FVSD will not create a US-hosted production copy of student information solely to gain access to preview development tools.

## Current hosting

- Azure region: `canadacentral`
- Operational truth store: existing Canadian Dataverse environment
- Analytical platform: existing Canadian Fabric capacity and workspace

## Platform options as of August 31, 2026

### Azure-hosted React and ASP.NET Core

Current approach and suitable for the PoC. It provides full control over UX, API boundaries, hosting region, and deployment timing.

### Power Apps Vibe

[Power Apps Vibe](https://learn.microsoft.com/en-us/power-apps/vibe/overview) is a preview and is not currently available in the Canadian Power Platform region.

It remains a future option for rapid application development when production support and Canadian availability meet FVSD requirements.

### Fabric Apps and Rayfin

[Fabric regional availability](https://learn.microsoft.com/en-us/fabric/admin/region-availability) currently lists Fabric Apps as unavailable in Canada Central and Canada East.

Fabric Apps/Rayfin is strategically relevant because it uses a TypeScript-oriented web application model and direct Fabric integration. The current React architecture preserves a practical migration path if it becomes appropriate.

## Evaluation gate

A future platform change should require evidence for:

- Canadian data storage and processing.
- Production support status and SLA.
- Named-user Dataverse and Fabric access.
- Licensing and metering behaviour.
- Source ownership and export.
- Environment promotion and ALM.
- Security, auditing, accessibility, and telemetry controls.
- Migration cost from the current React and ASP.NET Core implementation.

Synthetic data may be used to evaluate tools outside Canada, but the evaluation must not connect to production student data or production student-identifiable semantic-model results.
