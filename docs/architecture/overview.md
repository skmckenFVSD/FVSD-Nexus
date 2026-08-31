# Architecture overview

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Architecture](README.md) / Overview

## Context

FVSD Nexus combines operational workflows and governed analytics without turning the browser into a direct, general-purpose client for Dataverse or Fabric.

```text
FVSD user
  |
  v
FVSD Nexus - React / TypeScript
  |
  v
ASP.NET Core backend-for-frontend
  |-- Delegated Dataverse access
  |     Assessments, IPPs, reference tables, workflow, and auditing
  |
  `-- Delegated Fabric access
        Governed DAX measures, trends, comparisons, and signals

PowerSchool -- existing synchronization --> Dataverse
Dataverse  -- low-latency OneLake link --> Fabric --> FVSDAnalytics
```

## Responsibilities

| Component | Responsibility |
|---|---|
| React application | Task-oriented UX, context, form presentation, responsive visualization, and accessible feedback. |
| ASP.NET Core API | Authentication session, delegated token acquisition, server-side authorization, validation, orchestration, and predefined service queries. |
| Dataverse | Operational records, relationships, reference tables, security roles, and auditing. |
| PowerSchool synchronization | Makes required demographic and enrolment context available in Dataverse. |
| OneLake link | Reflects Dataverse operational changes into the analytical platform. |
| Fabric semantic model | Governed measures, calculations, terminology, and analytical RLS. |
| Azure | Canadian hosting, Key Vault, telemetry, and deployment infrastructure. |

## Browser boundary

The browser calls same-origin, purpose-built endpoints. It must not receive reusable service tokens or arbitrary DAX capability.

## Query boundary

- Analytics endpoints map defined user questions to predefined DAX.
- Operational endpoints map defined workflows to Dataverse reads and writes.
- The API validates context and permissions before calling the destination service.
- The destination service remains the final authority.

## Current and future scope

The current implementation includes the Leadership Analytics vertical slice. Dataverse write services, assessment forms, IPP workflows, and licensing verification are future operational capabilities.

## Compatibility

The source solution is named `FVSDNexus`, while existing deployed Azure resources retain `fvsd-insights` identifiers. This avoids unnecessary infrastructure replacement during the product transition.
