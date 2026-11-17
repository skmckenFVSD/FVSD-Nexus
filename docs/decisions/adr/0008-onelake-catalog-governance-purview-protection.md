---
title: "ADR-0008: The OneLake catalog is the governance catalogue; Purview is protection and compliance"
description: FVSD governs data meaning, ownership, endorsement and lineage in the Fabric OneLake catalog, and uses Microsoft Purview only for information protection and compliance, following Microsoft's retirement of Purview Data Governance.
type: adr
status: accepted
icon: ⚖️
area: decisions
audience: [architects, leadership]
owner: Scott McKenzie
tags: [nexus, nexus/decisions, nexus/governance]
aliases: [ADR-0008, ADR 8, OneLake catalog decision]
updated: 2026-11-17
related: ["[[decisions/adr/README]]", "[[decisions/decision-register]]", "[[architecture/purview-governance]]", "[[capabilities/purview-governance/README]]", "[[governance/README]]"]
---

# ⚖️ ADR-0008: The OneLake catalog is the governance catalogue; Purview is protection and compliance

[🏠 Home](../../README.md) › [⚖️ Decisions](../decision-register.md) › [⚖️ ADRs](README.md) › ADR-0008

- **Status:** 🟢 Accepted
- **Date:** 2026-11-17
- **Trigger:** Microsoft, [*A next step in the evolution of the Microsoft data governance strategy*](https://techcommunity.microsoft.com/blog/microsoft-security-blog/a-next-step-in-the-evolution-of-the-microsoft-data-governance-strategy/4572227), November 12, 2026

## 🧭 Context

Nexus documentation described the governance catalogue as Microsoft Purview: Purview "publishes what the record, calculation and identity mean, who owns them and how sensitive they are", and the Phase 3 Data Analyst workspace planned enterprise-catalog publication to Purview Unified Catalog and Data Map, alongside Purview's protection and compliance controls.

On November 12, 2026 Microsoft announced that:

- data governance moves into Microsoft Fabric, with the **OneLake catalog** as the single foundation for discovery, governance, security and protection across the estate (Fabric, Azure and third-party sources through shortcuts, mirroring and connectors), embedded in Teams, Excel and Foundry;
- **Purview Data Governance will be retired**, with support ending **November 12, 2027** and transition support from November 12, 2026;
- **Purview remains** Microsoft's data security and compliance solution: classifying, labelling and protecting sensitive data, data-loss prevention across the estate and AI, and compliance;
- organizations needing more than Fabric provides can integrate third-party governance tools (Atlan, Alation, Collibra, Informatica).

The announcement does not name Purview Unified Catalog explicitly; its exact scope must be confirmed with the Microsoft account team.

## ⚖️ Decision

1. **The Fabric OneLake catalog is FVSD's governance catalogue.** Meaning, ownership, endorsement, domains and lineage for governed data products are published and discovered there.
2. **Microsoft Purview is the protection and compliance layer only:** sensitivity labels, DLP, audit, retention, insider risk, and the Microsoft Graph policy APIs for policy-aware applications.
3. **FVSD will not adopt Purview Unified Catalog or Data Map** for new work. Planned enterprise-catalog publication is re-targeted to the OneLake catalog.
4. **The catalogue is still not a fourth source of truth.** Dataverse remains the record, the semantic model the calculation and Entra the identity ([ADR-0001](0001-dataverse-operational-truth.md), [ADR-0002](0002-fabric-governed-analytics.md), [ADR-0003](0003-named-user-delegated-access.md)). The OneLake catalog describes them; catalog access never grants access to source data.
5. **The FVSD Data Product Agent** re-points its Enterprise Catalog Agent and its "Deployed" lifecycle step from a Purview catalog entry to OneLake catalog publication or endorsement, before November 12, 2027.

## 🔄 Consequences

- Governance metadata now lives in the same platform as the semantic model it describes, which strengthens "extract documentation, don't write it": meaning, lineage and endorsement sit beside the calculation.
- Governance included in Fabric capacity is not billed through separate meters, removing a separate Purview governance cost line.
- Phase 3 pages, the governance framework, the philosophy, the icon registry, the diagrams, the illustration and the conference deck are updated to say *OneLake catalog* for the catalogue and *Purview* for protection.
- File paths `capabilities/purview-governance/` and `architecture/purview-governance.md` are kept so existing links continue to work; their titles change to *data governance*.
- Purview remains in scope for Nexus exports, generated documents, prompts and file activity through the Graph policy APIs.
- If a requirement exceeds the OneLake catalog, a third-party governance tool is evaluated through the same platform gate, not Purview Data Governance.

## ⚖️ Alternatives considered

| Alternative | Why not |
|---|---|
| Continue planning on Purview Unified Catalog and Data Map | Retirement announced; support ends November 12, 2027, before Phase 3 would be in steady state. |
| Adopt a third-party catalogue now | No current requirement exceeds the OneLake catalog; adds cost and another platform to govern. Remains an option. |
| Keep the catalogue implicit in Dataverse `fvsd_dataproduct` only | Dataverse remains the lifecycle record, but discovery, endorsement and lineage belong where users and agents already look: the OneLake catalog. |

## ❓ Open items

- Confirm with the Microsoft account team whether Purview Unified Catalog is covered by the retirement and what FVSD currently has enabled.
- Confirm OneLake catalog capabilities FVSD needs: domains, endorsement, glossary or definitions, data-product publication and lineage beyond Fabric.
- Confirm the supported API or tool for programmatic OneLake catalog publication by the Data Product Agent.

## 🔗 Related documentation

- [Data governance and agent architecture](../../architecture/purview-governance.md)
- [Data governance and Data Analyst workspace](../../capabilities/purview-governance/README.md)
- [Governance framework](../../governance/README.md)

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Decisions*
