---
title: Writing guide topics
description: How to write staff user guide chapters — topics, steps, callouts, screenshots and numbered markers — so they read well on GitHub and build into the SharePoint guide.
type: standard
status: confirmed
icon: 🧑‍🏫
area: standards
audience: [maintainers, writers]
owner: Scott McKenzie
tags: [nexus, nexus/standards, nexus/user-guide]
aliases: [Guide authoring, User guide conventions]
updated: 2026-11-17
related: ["[[user-guide/README]]", "[[standards/brand-and-voice]]"]
---

# 🧑‍🏫 Writing guide topics

[🏠 Home](../README.md) › [📐 Standards](README.md) › Writing guide topics

**Status:** 🔵 Confirmed — the guide build relies on these conventions.

The [staff user guide](../user-guide/README.md) is written as ordinary markdown. The guide build turns it into the SharePoint HTML guide, so a few conventions carry meaning.

## 🗺️ Structure

| Markdown | Becomes in the HTML guide |
|---|---|
| A chapter file listed in the guide README's `guide.chapters` | One group in the guide navigation, labelled by the chapter's `chapter` property |
| `## 📋 Topic title` | One topic card, with the icon, a chapter kicker and a navigation link |
| The first paragraph under the topic heading | The topic introduction |
| `### Subheading` | A subheading inside the topic |
| A numbered list | Numbered steps with large step badges |
| A bulleted list, table or paragraph | The same, styled |
| `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]` | A coloured callout with its icon |
| A paragraph containing only an image | A screenshot figure with caption, enlargement and markers |
| A link to another chapter, e.g. `03-class-assignments.md#-open-a-student` | An in-page link to that topic |

The H1, breadcrumb and footer of each chapter appear on GitHub only. Links to pages outside the guide are not allowed in chapters; the build stops with an error so staff never meet a link they cannot open.

## ✅ Writing steps

- One action per step, starting with a verb: **Select**, **Choose**, **Enter**, **Open**, **Check**.
- Interface labels in **bold**, exactly as they appear on screen, including capitals.
- Say where before what: "Under **Assessment history**, select **Add assessment**."
- Put the result in the same step when it helps: "…**Add Student Assessment** opens."
- Use a table inside a step for rules a person must check, such as date ranges.

## 💡 Callouts

| Callout | Use for |
|---|---|
| `[!NOTE]` | Context that explains behaviour |
| `[!TIP]` | A faster or easier way |
| `[!IMPORTANT]` | Something that changes the outcome if missed |
| `[!WARNING]` | An action that is hard to undo |
| `[!CAUTION]` | Data loss, privacy or safety risk |

At most two callouts per topic. If everything is important, nothing is.

## 🖼️ Screenshots

1. Capture at 1440 × 900 or larger, using obfuscated student names (developer **O** display mode). Check every pixel for names, ASNs, birth dates and email addresses before saving.
2. Save to `docs/user-guide/assets/` with a descriptive, lowercase, hyphenated name and no dates, e.g. `assessment-add.png`.
3. Reference it on its own line: `![Alternative text describing the screen.](assets/assessment-add.png "Caption shown under the image.")`
4. To number parts of the screen, add markers in [`assets/screenshots.yml`](../user-guide/assets/screenshots.yml): `- [1, 62, 17, "Select Add assessment."]`. The numbers are drawn over the image as HTML, so the screenshot itself stays unedited. Positions are percentages of the image width and height.
5. If the file does not exist yet, the build shows a labelled placeholder and `docs:check` lists it as missing.

Record any edited or redacted image with `redacted: true` in the screenshot map.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Documentation standards*
