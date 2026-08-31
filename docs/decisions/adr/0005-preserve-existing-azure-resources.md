# ADR-0005: Preserve existing Azure resource identifiers during the Nexus rename

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Decision register](../decision-register.md) / [Architecture decision records](README.md) / ADR-0005

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

The Leadership PoC was deployed as FVSD Insights using working Azure resources and an existing Entra registration. The broader product is now named FVSD Nexus.

## Decision

Rename the active source solution and user-facing product to FVSD Nexus while retaining the existing `fvsd-insights` Azure resource and environment identifiers unless a later infrastructure decision requires replacement.

## Consequences

- The repository can adopt the broader product identity immediately.
- The locked deployed PoC is not disrupted by cosmetic infrastructure replacement.
- Documentation must explain why some operational identifiers retain the earlier name.

## Alternatives considered

- Recreate or rename all deployed resources immediately: rejected because it introduces risk without delivering user value.
