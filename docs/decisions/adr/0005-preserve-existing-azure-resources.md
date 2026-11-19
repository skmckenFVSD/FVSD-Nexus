---
title: "ADR-0005: Preserve existing Azure resource identifiers during the Nexus rename"
description: Rename the active source solution and user-facing product to FVSD Nexus while retaining the existing fvsd-insights Azure resource and environment identifiers unless a later infrastructure decision requires replacement.
type: adr
status: accepted
icon: ⚖️
area: decisions
audience: [architects, leadership]
owner: Scott McKenzie
tags: [nexus, nexus/decisions]
aliases: [ADR-0005, ADR 5]
updated: 2026-11-05
related: ["[[decisions/adr/README]]"]
---

# ⚖️ ADR-0005: Preserve existing Azure resource identifiers during the Nexus rename

[🏠 Home](../../README.md) › [⚖️ Decisions](../decision-register.md) › [⚖️ ADRs](README.md) › ADR-0005

- **Status:** 🟢 Accepted
- **Date:** 2026-08-31

## 🧭 Context

The initial Leadership Analytics release was deployed as FVSD Insights using working Azure resources and an existing Entra registration. The broader product is now named FVSD Nexus.

## ⚖️ Decision

Rename the active source solution and user-facing product to FVSD Nexus while retaining the existing `fvsd-insights` Azure resource and environment identifiers unless a later infrastructure decision requires replacement.

## 🔄 Consequences

- The repository can adopt the broader product identity immediately.
- The deployed capability is not disrupted by cosmetic infrastructure replacement.
- Documentation must explain why some operational identifiers retain the earlier name.

## ⚖️ Alternatives considered

- Recreate or rename all deployed resources immediately: rejected because it introduces risk without delivering user value.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Decisions*
