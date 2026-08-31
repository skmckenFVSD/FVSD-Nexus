# ADR-0002: Fabric remains the governed analytical layer

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

The `FVSDAnalytics` semantic model already contains governed measures and calculations that cannot be replaced correctly with simple client-side aggregations.

## Decision

Nexus will query the existing Fabric semantic model for governed analytical results. The backend will expose purpose-built endpoints backed by predefined DAX rather than a general-purpose query surface.

## Consequences

- Existing semantic-model measures remain authoritative.
- Fabric permissions and RLS continue to apply.
- The React experience can evolve independently from Power BI report layouts.
- Query additions require explicit server-side implementation and testing.

## Alternatives considered

- Embed Power BI reports: rejected for the primary Nexus experience because it retains the interaction problems Nexus is intended to solve.
- Reimplement measures in React or the API: rejected because it would duplicate and potentially diverge from governed calculations.
