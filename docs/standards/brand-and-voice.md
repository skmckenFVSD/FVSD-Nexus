---
title: Brand and voice
description: The FVSD Nexus brand palette, naming, terminology, spelling and tone used across documentation, the staff guide and presentations.
type: standard
status: confirmed
icon: 🎨
area: standards
audience: [maintainers, designers, presenters]
owner: Scott McKenzie
tags: [nexus, nexus/standards, brand]
aliases: [Brand guide, Voice and tone, Terminology]
updated: 2026-11-17
related: ["[[design-system/foundations]]", "[[standards/iconography]]", "[[reference/glossary]]"]
---

# 🎨 Brand and voice

[🏠 Home](../README.md) › [📐 Standards](README.md) › Brand and voice

**Status:** 🔵 Confirmed — applies to every documentation surface.

FVSD Nexus should look, sound and name things the same way whether someone meets it in the repository, in Obsidian, in the staff guide on SharePoint or on a conference screen. The application's own visual rules live in the [design system](../design-system/README.md); this page applies them to documentation.

## 🎯 Identity

| Element | Use |
|---|---|
| Product name | **FVSD Nexus** on first use; **Nexus** afterwards. Never "the Nexus app" or "NEXUS". |
| Organization | **Fort Vermilion School Division** in full on title pages and footers; **FVSD** elsewhere. |
| Tagline | **From Evidence to Action** (presentations and the guide hero). The application shell uses **From Insights To Action**; do not mix them in one artifact. |
| Logo | `assets/brand/fvsd-nexus/` — use the PNG sizes provided; never recolour or crop. |
| Footer | `*🏫 FVSD Nexus · Fort Vermilion School Division · <Area>*` on every markdown page. |

## 🎨 Palette

The structural palette is shared with the application ([Foundations](../design-system/foundations.md)). Generated HTML reads these values from `tools/docs/brand/tokens.css`; change them here and in the design system first.

| Role | Value | Where it is used |
|---|---|---|
| Structural navy | `#071940` | Headings, the guide top bar, diagram source nodes |
| Deep navy | `#04102B` | Presentation background, top-bar gradient |
| Structural blue | `#1F4E79` | Links, record nodes, focus basis |
| Cyan | `#4A90E2` | Accents, active navigation, diagram strokes |
| Sky | `#6FB1F5` | Eyebrows and highlights on dark surfaces |
| Mint | `#B8E986` | 🟢 current / live, the calculation source, positive accents |
| Amber | `#F5A623` | 🟠 proposed / caution, the identity source |
| Ink on dark | `#F4F7FC` / `#B9C6DC` / `#7B92AA` | Presentation text: strong, soft, faint |

**Rule:** governed descriptive-term and screener colours are data. They never become documentation accents, buttons or callouts.

The three sources of truth always keep their colours, in every diagram and slide:

| Source | Colour | Icon |
|---|---|---|
| Record (Dataverse) | Blue / cyan | 🗄️ |
| Calculation (semantic model) | Mint | 🧮 |
| Identity (Entra) | Amber | 🪪 |
| Catalogue (Purview, not a source of truth) | Dashed grey | 🏷️ |

## 🗣️ Voice

- **Plain and direct.** Say what something does and who it is for. Prefer "Nexus checks your permissions again when you save" to "authorization is enforced server-side".
- **Honest about status.** Say *current*, *confirmed*, *proposed* or *open*. Never describe planned work as available.
- **Calm about limits.** State a boundary and its reason once: "Records from a closed period stay read-only."
- **Evidence over adjectives.** Avoid "seamless", "powerful", "robust". Show the behaviour instead.
- **Staff-guide register.** Second person, imperative steps, one action per step, interface labels in **bold** exactly as they appear on screen.
- **Architecture register.** Precise, third person, decision-oriented; name the governed source for every fact.
- **Presentation register.** Short declarative headlines; one idea per slide; the argument carried by the words, not by bullets alone.

## 📚 Terminology

Use these terms exactly. Add new terms to the [glossary](../reference/glossary.md).

| Use | Not |
|---|---|
| annual plan, **IEP / IPP** | plan document, IPP form |
| plan module | section page, tab |
| Section Group | class type, group |
| descriptive term | band, category |
| semantic model (`FVSDAnalytics`) | dataset, Power BI file |
| Dataverse, the operational record | the database |
| governed | approved (when you mean governed by a model or catalogue) |
| named user, delegated access | service account, impersonation |
| Reconnect Microsoft services | log in again |

## 🔤 Spelling and style

- **Canadian English:** colour, behaviour, centre, licence (noun), license (verb), program, enrol / enrolment, organization, synchronize.
- **Sentence-case headings:** "Set the analysis context", not "Set The Analysis Context".
- **Dates:** November 17, 2026 in prose; `2026-11-17` in front matter and file data.
- **Numbers:** spell out one to nine in prose; numerals for scores, grades, percentages and measurements.
- **Lists:** a full stop at the end of full-sentence items; none for fragments.
- **No student data:** use "a student", "Sample Student", or obfuscated values. Never a real name or ASN.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Documentation standards*
