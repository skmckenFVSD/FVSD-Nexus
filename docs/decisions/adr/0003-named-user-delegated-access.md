# ADR-0003: Use named-user delegated access

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

Nexus will handle student assessment and IPP information. FVSD requires each interactive user to be authenticated, licensed where required, authorized, and auditable.

## Decision

Interactive Dataverse and Fabric operations use the signed-in user's delegated identity. A shared system identity will not be used to pool normal user access.

## Consequences

- Destination-service permissions remain effective.
- Writes are attributable to the individual user.
- Licensing must be resolved per user.
- The backend must acquire and protect delegated tokens.
- Background maintenance processes may still use explicitly governed application identities where appropriate, but they do not replace named-user access.

## Alternatives considered

- Shared service account or system token for all users: rejected because it weakens authorization, licensing clarity, and audit attribution.

