---
title: Architecture decision records
description: Architecture decision records explain why durable technical and product-architecture choices were made.
type: hub
status: current
icon: ⚖️
area: decisions
audience: [architects, leadership]
owner: Scott McKenzie
tags: [nexus, nexus/decisions]
updated: 2026-11-05
---

# ⚖️ Architecture decision records

[🏠 Home](../../README.md) › [⚖️ Decisions](../decision-register.md) › Architecture decision records

Architecture decision records explain why durable technical and product-architecture choices were made.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-dataverse-operational-truth.md) | Dataverse is the operational truth store | Accepted |
| [0002](0002-fabric-governed-analytics.md) | Fabric semantic model remains the governed analytical layer | Accepted |
| [0003](0003-named-user-delegated-access.md) | Interactive access uses named-user delegated identity | Accepted |
| [0004](0004-canadian-data-residency.md) | Production student information remains in the approved Canadian geography | Accepted |
| [0005](0005-preserve-existing-azure-resources.md) | Preserve existing Azure resource identifiers during the Nexus rename | Accepted |
| [0006](0006-modular-annual-student-plans.md) | Compose one annual student plan from governed module allocations | Accepted |
| [0007](0007-azure-app-and-microsoft-foundry.md) | Use an Azure App with Microsoft Foundry as the intelligence service plane | Accepted |

## 📝 ADR template

Each ADR should contain:

- Status and date.
- Context.
- Decision.
- Consequences.
- Alternatives considered.
- Related documentation.

Accepted ADRs are not silently rewritten when a decision changes. Add a new ADR that supersedes the old record.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Decisions*
