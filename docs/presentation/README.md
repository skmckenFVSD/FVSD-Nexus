---
title: Presentation layer
description: How FVSD Nexus decks are written as markdown and built into the self-contained HTML presentation used on the repository site and at conferences.
type: presentation
status: current
icon: 🎤
area: presentation
audience: [presenters, maintainers]
owner: Scott McKenzie
tags: [nexus, nexus/presentation]
aliases: [Decks, Conference presentation, Repo site]
updated: 2026-11-17
related: ["[[presentation/decks/from-evidence-to-action]]", "[[standards/brand-and-voice]]", "[[standards/iconography]]"]
---

# 🎤 Presentation layer

[🏠 Home](../README.md) › Presentation layer

**Status:** 🟢 Current — the conference deck is generated from markdown and matches the published deck slide for slide.

The presentation layer turns markdown decks into a single, self-contained HTML presentation: keyboard and touch navigation, a grouped contents sidebar, an overview grid, deep links to each slide, a print-to-PDF layout and social-preview metadata. The same file works as the **repository site** (GitHub Pages) and as a **standalone conference deck** opened from a laptop with no network.

## 🗺️ Decks

| Deck | Audience | Source | Output |
|---|---|---|---|
| From Evidence to Action | CDAO Canada, Power Platform and Fabric community events | [decks/from-evidence-to-action.md](decks/from-evidence-to-action.md) | `publish/presentation/from-evidence-to-action/index.html` |

## 🔄 Build and publish

```text
cd tools/docs
npm ci                     # first time only
npm run docs:deck          # every deck → publish/presentation/<deck>/
npm run docs:site          # also copy the primary deck to the repository root index.html for GitHub Pages
```

- **Conference use:** copy the deck's output folder (`index.html`, `favicon.png`, `social-card.png`) to the presenting laptop and open `index.html`. Press **F** for full screen, **N** to hide the contents, **Esc** for the overview.
- **Repository site:** `npm run docs:site` replaces the root `index.html` that GitHub Pages serves. Review the change before merging it.
- **PDF handout:** open the deck in a browser and print to PDF; the print stylesheet lays out one slide per landscape page.

## 📝 Writing a slide

A deck is ordinary markdown, so it reads as a script on GitHub and in Obsidian. Slides are separated by a horizontal rule (`---`). An HTML comment at the top of each slide tells the build how to lay it out; comments are invisible when the markdown is read.

```markdown
---

<!-- slide: group="The Architecture" nav="Measure discipline" lead -->

#### The non-negotiable

## The app asks. It never answers.

Our applications send only predefined, reviewed queries.

<!-- cards -->
- **Measures** — Stay defined in the semantic model.
- **Security** — Row-level security follows the individual.
- **Surface** — No general-purpose query endpoint is exposed. Ever.
```

| Markdown | Becomes |
|---|---|
| `<!-- slide: … -->` | A slide. `layout=title` or `layout=statement` for those layouts; `group` sets the sidebar section; `nav` the sidebar label; `lead` makes the first paragraph the large lead line. |
| `#### Text` | The eyebrow above the headline |
| `# Text` / `## Text` | The title-slide headline / the slide headline. `<br>` forces a line break. |
| A paragraph | Body text |
| `> Quote` then `*attribution*` | The statement slide's pull quote and attribution |
| `🟢 **Live**`, `🔵 **Planned**`, `🟠 **Caveat**` | Status pills (see [iconography](../standards/iconography.md#-status-markers)) |
| A table | The capability table |
| A plain list | The clean bullet list; `<!-- list mint -->` for mint bullets |

## 🧩 Components

Place a component comment directly above the list it styles.

| Comment | Item format | Renders |
|---|---|---|
| `<!-- cards edge=cyan -->` | `- **Label** — body` | Card grid with small-caps labels. `edge` = `cyan`, `mint` or `amber`. |
| `<!-- cards cols=two title=h3 -->` | `- 🟢 **Live** **Title** — body` | Two-column cards with headings and optional pills. Add `number` to number the cards 01, 02… |
| `<!-- truth -->` | `- 🗄️ **Record** — *Question?* **Answer** description` | The three-sources-of-truth cards. The icon picks the badge colour (🗄️ record, 🧮 calculation, 🪪 identity). |
| `<!-- catalog tag="Purview · the catalogue" -->` | A paragraph | The dashed catalogue strip |
| `<!-- stats -->` | `- **$70** label` | Large statistics row |
| `<!-- flow -->` | `- **Stage 0 · Discovery** — body` | Numbered stage flow |
| `<!-- timeline -->` | `- [x] **When** — what` | Timeline; `[x]` marks completed steps |
| `<!-- byline -->` | `**Name**\` then lines ending in `\` | Title-slide byline; `*italic*` items become accent links |

## 🎨 Look and feel

The slide styling, navigation script and print rules live in [`tools/docs/templates/deck.html`](../../tools/docs/templates/deck.html), taken unchanged from the published deck, with brand colours from `tools/docs/brand/tokens.css`. Change the words in markdown; change the look in the template, once, for every deck.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Presentation layer*
