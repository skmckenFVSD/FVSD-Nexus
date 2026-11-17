---
title: Iconography
description: The FVSD Nexus icon registry — one emoji per concept in markdown, the matching Lucide icon in generated HTML, and the status markers.
type: standard
status: confirmed
icon: 🧩
area: standards
audience: [maintainers, designers]
owner: Scott McKenzie
tags: [nexus, nexus/standards, brand]
aliases: [Icon registry, Icons]
updated: 2026-11-17
related: ["[[standards/brand-and-voice]]", "[[design-system/assets]]"]
---

# 🧩 Iconography

[🏠 Home](../README.md) › [📐 Standards](README.md) › Iconography

**Status:** 🔵 Confirmed — the registry is enforced by `npm run docs:check`.

Every concept in FVSD Nexus documentation has **one** icon. In markdown it is an emoji, because emoji render on GitHub and in Obsidian with no plugins. In generated HTML (the staff guide and presentations) the build replaces the emoji with the matching [Lucide](https://lucide.dev) icon, the same icon set the Nexus application uses. A reader therefore sees the same symbol for "Dataverse" or "annual plans" everywhere.

## 💡 Rules

1. **Every H1 and H2 starts with a registered emoji.** H3 and below may use one when it helps scanning.
2. **One meaning per icon.** Use 🗄️ only for the record (Dataverse), 🧮 only for the calculation (semantic model), 🪪 only for identity and profiles.
3. **Register before you use.** Add a concept to [`icon-registry.yml`](icon-registry.yml) with its emoji, Lucide name and meaning, then regenerate the table below.
4. **Diagrams may use any emoji** inside Mermaid labels; prefer registered ones.
5. **Never use colour alone.** A status marker always carries its label: `🟢 **Current**`, never 🟢 by itself.

## 📌 Status markers

Write a status marker as the emoji followed by a bold label. The HTML builds render it as a coloured status pill.

| Marker | Meaning | Example labels | Pill |
|---|---|---|---|
| 🟢 | Implemented and available now | Current, Live, Partial, Complete, Accepted | Mint |
| 🔵 | Agreed and scheduled, or actively being built | Confirmed, Planned, Active build, Phase 3 | Blue |
| 🟠 | Intended direction needing approval, or a candid caveat | Proposed, To define, Caveat, Boundary | Amber |
| ⚪ | Unresolved, superseded or retired | Open, Superseded, Retired | Neutral |

## 🗺️ Registry

The table between the markers is generated from [`icon-registry.yml`](icon-registry.yml) by `npm run docs:icons`. Edit the YAML, not the table.

<!-- icon-table:start -->
| Emoji | Concept | Lucide icon (HTML) | Use for |
|---|---|---|---|
| 🏠 | `home` | [`house`](https://lucide.dev/icons/house) | Documentation home and breadcrumb root |
| 🧭 | `overview` | [`compass`](https://lucide.dev/icons/compass) | Overview, orientation, context, where to start |
| 👥 | `audience` | [`users`](https://lucide.dev/icons/users) | Who a page or capability is for; roles |
| 👤 | `user` | [`user`](https://lucide.dev/icons/user) | A single person, signed-in user, student context |
| 🗺️ | `map` | [`map`](https://lucide.dev/icons/map) | Maps, registries, journeys, repository structure |
| 🔗 | `related` | [`link`](https://lucide.dev/icons/link) | Related documentation and quick navigation |
| 🔹 | `section` | [`diamond`](https://lucide.dev/icons/diamond) | General section with no more specific concept |
| 🏗️ | `architecture` | [`layers`](https://lucide.dev/icons/layers) | Architecture, system design, platform structure |
| 🧩 | `capability` | [`puzzle`](https://lucide.dev/icons/puzzle) | Product capabilities and plan modules |
| 📊 | `analytics` | [`chart-no-axes-combined`](https://lucide.dev/icons/chart-no-axes-combined) | Leadership analytics, measures, charts |
| 📋 | `assessments` | [`file-check-2`](https://lucide.dev/icons/file-check-2) | Assessment entry, screeners, completion |
| 🏫 | `classes` | [`school`](https://lucide.dev/icons/school) | School Administration, Class Assignments, schools |
| 🎓 | `plans` | [`graduation-cap`](https://lucide.dev/icons/graduation-cap) | IEP / IPP annual plans |
| 🩺 | `interventions` | [`activity`](https://lucide.dev/icons/activity) | Intervention tracking and Intervention Focus |
| 🪪 | `profiles` | [`id-card`](https://lucide.dev/icons/id-card) | School and student profiles; identity (Entra) |
| 🏛️ | `province` | [`landmark`](https://lucide.dev/icons/landmark) | PASI and provincial exchange |
| 🤖 | `agents` | [`bot`](https://lucide.dev/icons/bot) | Copilot, Foundry, agents, MCP |
| 📄 | `documents` | [`file-text`](https://lucide.dev/icons/file-text) | Generated documents, PDFs, exports |
| ⚙️ | `admin` | [`settings`](https://lucide.dev/icons/settings) | Settings and platform administration |
| 🗄️ | `record` | [`database`](https://lucide.dev/icons/database) | Dataverse — where the record lives |
| 🧮 | `calculation` | [`calculator`](https://lucide.dev/icons/calculator) | Semantic model — how a number is calculated |
| 🏷️ | `catalogue` | [`tag`](https://lucide.dev/icons/tag) | OneLake catalog — meaning, ownership, endorsement and lineage |
| 🛡️ | `governance` | [`shield-check`](https://lucide.dev/icons/shield-check) | Governance framework and controls |
| 🔐 | `security` | [`lock-keyhole`](https://lucide.dev/icons/lock-keyhole) | Security, authorization, privacy, secrets |
| 🍁 | `residency` | [`map-pinned`](https://lucide.dev/icons/map-pinned) | Canadian data residency |
| 📝 | `audit` | [`notebook-pen`](https://lucide.dev/icons/notebook-pen) | Audit, history, records of change, contributing |
| 🔌 | `integration` | [`plug`](https://lucide.dev/icons/plug) | Integrations, connectors, data flow |
| 📖 | `philosophy` | [`book-open`](https://lucide.dev/icons/book-open) | Philosophy and design rationale |
| 💡 | `principle` | [`lightbulb`](https://lucide.dev/icons/lightbulb) | Principles, insights, tips |
| 🎯 | `purpose` | [`target`](https://lucide.dev/icons/target) | Purpose, objectives, intent, value |
| ⚖️ | `decision` | [`scale`](https://lucide.dev/icons/scale) | Decisions, ADRs, alternatives |
| 🚀 | `delivery` | [`rocket`](https://lucide.dev/icons/rocket) | Delivery, roadmap, phases, releases |
| 🔄 | `lifecycle` | [`refresh-cw`](https://lucide.dev/icons/refresh-cw) | Lifecycles, workflows, consequences, change |
| 🧪 | `testing` | [`flask-conical`](https://lucide.dev/icons/flask-conical) | Testing, verification, acceptance |
| 🤝 | `adoption` | [`handshake`](https://lucide.dev/icons/handshake) | Adoption, engagement, training |
| ⚠️ | `risk` | [`triangle-alert`](https://lucide.dev/icons/triangle-alert) | Risks, cautions, warnings, exclusions |
| ❓ | `open` | [`circle-help`](https://lucide.dev/icons/circle-help) | Open questions and unresolved decisions |
| ✅ | `done` | [`circle-check`](https://lucide.dev/icons/circle-check) | Completed work, acceptance, implemented scope |
| 📌 | `status` | [`pin`](https://lucide.dev/icons/pin) | Status, current position, change control |
| 🎨 | `design` | [`palette`](https://lucide.dev/icons/palette) | Design system, colour, visual language |
| 📐 | `layout` | [`ruler`](https://lucide.dev/icons/ruler) | Layouts, spacing, responsive behaviour, standards |
| 📚 | `reference` | [`library`](https://lucide.dev/icons/library) | Reference material and glossary |
| 🖼️ | `screenshot` | [`image`](https://lucide.dev/icons/image) | Screenshots, images and visual evidence |
| ✍️ | `signature` | [`signature`](https://lucide.dev/icons/signature) | Signatures and sign-off |
| 🗣️ | `voice` | [`speech`](https://lucide.dev/icons/speech) | Voice, tone and wording |
| 🔤 | `language` | [`spell-check`](https://lucide.dev/icons/spell-check) | Spelling, terminology style and language |
| 🗃️ | `vault` | [`archive`](https://lucide.dev/icons/archive) | Obsidian vault and file organization |
| 🧑‍🏫 | `guide` | [`book-open-check`](https://lucide.dev/icons/book-open-check) | Staff user guide |
| 🎤 | `presentation` | [`presentation`](https://lucide.dev/icons/presentation) | Presentation layer and decks |
<!-- icon-table:end -->

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Documentation standards*
