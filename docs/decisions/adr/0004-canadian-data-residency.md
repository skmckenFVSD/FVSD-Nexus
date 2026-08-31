# ADR-0004: Keep production student information in Canada

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

Power Apps Vibe and Fabric Apps/Rayfin are not currently available for Canadian production environments. Using those previews would require an unacceptable geographic compromise for identifiable student information.

## Decision

Production student data, assessment records, IPP information, and student-identifiable AI context remain inside the approved Canadian geography.

## Consequences

- The current Azure-hosted application remains the appropriate bridge.
- Preview tools outside Canada may be evaluated only with synthetic data.
- Platform options can be reconsidered when Canadian availability and processing terms meet FVSD requirements.

## Alternatives considered

- Copy production data into a US environment for preview access: rejected.
