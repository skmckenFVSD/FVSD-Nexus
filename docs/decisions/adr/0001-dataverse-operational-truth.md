---
title: "ADR-0001: Dataverse is the operational truth store"
description: Dataverse remains the authoritative source for assessment, IPP, intervention, and related operational records. Nexus will access those records through named-user, delegated operations.
type: adr
status: accepted
icon: ⚖️
area: decisions
audience: [architects, leadership]
owner: Scott McKenzie
tags: [nexus, nexus/decisions]
aliases: [ADR-0001, ADR 1]
updated: 2026-08-31
related: ["[[decisions/adr/README]]"]
---

# ⚖️ ADR-0001: Dataverse is the operational truth store

[🏠 Home](../../README.md) › [⚖️ Decisions](../decision-register.md) › [⚖️ ADRs](README.md) › ADR-0001

- **Status:** 🟢 Accepted
- **Date:** 2026-08-31

## 🧭 Context

FVSD already has stable assessment structures, reference tables, PowerSchool-synchronized data, and much of the anticipated IPP structure in Dataverse.

## ⚖️ Decision

Dataverse remains the authoritative source for assessment, IPP, intervention, and related operational records. Nexus will access those records through named-user, delegated operations.

## 🔄 Consequences

- Existing structures and business knowledge are reused.
- Operational confirmation comes directly from Dataverse.
- Dataverse permissions and auditing remain authoritative.
- Fabric receives operational changes through the existing OneLake integration.
- Nexus must not create a competing transactional store for the same records.

## ⚖️ Alternatives considered

- Writing operational records to Fabric or the semantic model: rejected because those are analytical layers.
- Creating a new independent application database: rejected because it would duplicate established Dataverse truth and integration.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Decisions*
