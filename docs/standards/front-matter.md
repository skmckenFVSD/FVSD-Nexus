---
title: Front matter
description: The YAML properties every FVSD Nexus documentation page carries, so the docs work as an Obsidian vault and feed the guide and deck builds.
type: standard
status: confirmed
icon: 🏷️
area: standards
audience: [maintainers]
owner: Scott McKenzie
tags: [nexus, nexus/standards, obsidian]
aliases: [YAML front matter, Obsidian properties, Page properties]
updated: 2026-11-17
related: ["[[standards/README]]", "[[CONTRIBUTING]]"]
---

# 🏷️ Front matter

[🏠 Home](../README.md) › [📐 Standards](README.md) › Front matter

**Status:** 🔵 Confirmed — validated by `npm run docs:check`.

Every markdown page in `docs/` starts with YAML front matter. Obsidian shows it as **Properties** and can query it with Bases or Dataview; GitHub shows it as a small table at the top of the page; the builds read it to decide titles, order and output.

## 🗃️ Opening the vault

Open the **`docs/`** folder as an Obsidian vault. Its `.obsidian/` settings are committed so links stay as relative markdown links (which GitHub understands) rather than wikilinks, and new attachments go beside the note that uses them. Personal workspace files are ignored by git.

Wikilinks are used only **inside front matter** (`related`), written as paths from the vault root, for example `"[[architecture/overview]]"`. They give Obsidian a link graph without changing how pages read on GitHub.

## 🧩 Properties

| Property | Required | Type | Values and notes |
|---|---|---|---|
| `title` | Yes | text | Sentence case. Matches the H1 without its icon. |
| `description` | Yes | text | One sentence, under about 200 characters. Used in Obsidian search and HTML meta descriptions. |
| `type` | Yes | text | `hub`, `overview`, `capability`, `architecture`, `adr`, `decision-register`, `delivery`, `design-system`, `governance`, `philosophy`, `reference`, `standard`, `template`, `guide`, `guide-chapter`, `guide-review`, `deck`, `presentation`, `contributing` |
| `status` | Yes | text | `current`, `confirmed`, `proposed`, `open`, `accepted`, `superseded`, `draft` |
| `icon` | Yes | text | The page's registered emoji, also used in its H1. |
| `area` | Yes | text | The top-level folder: `architecture`, `capabilities`, `decisions`, `delivery`, `design-system`, `governance`, `philosophy`, `presentation`, `reference`, `standards`, `user-guide`, or `docs` for root pages. |
| `audience` | Yes | list | Who the page is written for, e.g. `leadership`, `architects`, `developers`, `staff`, `maintainers`. |
| `owner` | Yes | text | Accountable person. |
| `tags` | Yes | list | Always `nexus`, plus nested area tags such as `nexus/architecture`. |
| `updated` | Yes | date | `YYYY-MM-DD` of the last meaningful content change. |
| `related` | No | list | Wikilinks to closely related pages. |
| `aliases` | No | list | Other names people use, e.g. `ADR-0003`. Obsidian matches links and search on these. |
| `chapter`, `order` | Guide chapters | text, number | Navigation group label and position in the staff guide. |
| `guide` | Guide README | object | Guide title, launch URL and chapter order. |
| `deck` | Decks | object | Output folder, presenter and social-preview metadata. |
| `publish` | No | boolean | `false` keeps a page out of every generated output. |

## 📝 Example

```yaml
---
title: Assessment entry and scoring
description: Class Assignment, TOSREC lifecycle and the shared assessment adapter pattern.
type: capability
status: current
icon: 📋
area: capabilities
audience: [leadership, product, architects]
owner: Scott McKenzie
tags: [nexus, nexus/capabilities, nexus/assessments]
aliases: [Assessments, TOSREC]
updated: 2026-11-12
related: ["[[architecture/data-and-integrations]]", "[[user-guide/04-assessments]]"]
---
```

## 🔄 Status in front matter and body

`status` is the page's overall position for filtering. The body still opens with a `**Status:**` line that explains it in words, because a reader on GitHub or SharePoint should not need to read properties to know whether something is real.

| `status` | Body marker | Meaning |
|---|---|---|
| `current` | 🟢 | Implemented and available in the active build. |
| `confirmed` | 🔵 | Agreed premise, constraint or scheduled work. |
| `accepted` | 🟢 | An ADR that is in force. |
| `proposed` | 🟠 | Intended direction that still needs approval or design. |
| `open` | ⚪ | Unresolved decision, dependency or requirement. |
| `draft` | 🟠 | Content written but not yet reviewed for publication. |
| `superseded` | ⚪ | Replaced; link to the replacement. |

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Documentation standards*
