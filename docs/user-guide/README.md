---
title: FVSD Nexus staff user guide
description: Source of the staff user guide. Each chapter is markdown; the guide build exports a SharePoint-ready HTML guide.
type: guide
status: draft
icon: 🧑‍🏫
area: user-guide
audience: [staff, school-leaders, executive, support]
owner: Scott McKenzie
tags: [nexus, nexus/user-guide, guide]
aliases: [Nexus user guide, Staff guide, User guidance]
updated: 2026-11-17
related: ["[[user-guide/review-notes]]", "[[capabilities/README]]", "[[standards/brand-and-voice]]"]
guide:
  output: user-guide
  title: FVSD Nexus
  subtitle: Clear steps for finding your students, reading governed analytics, recording assessments and building annual plans.
  eyebrow: FVSD · Staff user guide
  wordmark_sub: Fort Vermilion School Division · Staff user guide
  launch_url: https://app-fvsd-insights-iwmpkez4.azurewebsites.net/
  launch_label: Open FVSD Nexus
  status_note: Working draft · Written from the November 2026 build · Screenshots being added
  draft: true
  search_placeholder: Try TOSREC or signatures
  chapters:
    - 01-getting-started.md
    - 02-leadership-analytics.md
    - 03-class-assignments.md
    - 04-assessments.md
    - 05-iep-ipp.md
    - 06-settings-and-support.md
---

# 🧑‍🏫 FVSD Nexus staff user guide

[🏠 Home](../README.md) › Staff user guide

This folder is the **single source** of the FVSD Nexus staff guide. Staff never read these files directly: the guide build turns them into one self-contained HTML guide that you upload to SharePoint, exactly like the Education Framework Application guide.

> [!IMPORTANT]
> Update the guide **in the same change** that alters a screen, label or rule in the app. The markdown is reviewed with the code; the HTML is rebuilt from it.

## 🗺️ Chapters

| # | Chapter | Covers | Who it is for |
|---|---|---|---|
| 1 | [Getting started](01-getting-started.md) | Signing in, navigation, roles and what is coming | Everyone |
| 2 | [Leadership analytics](02-leadership-analytics.md) | Analysis context, focus area, signals, school comparison, charts | Executive, school leaders |
| 3 | [Class Assignments](03-class-assignments.md) | Finding a class and student, section groups, the student record | Teachers, school administration, support staff |
| 4 | [Assessments](04-assessments.md) | Assessment history, adding, editing and deleting TOSREC, completion monitoring | Teachers, school administration |
| 5 | [IEP / IPP annual plans](05-iep-ipp.md) | Plan history, creating a plan, modules, plan sections, documents | Foundations and homeroom teachers, school administration |
| 6 | [Settings and support](06-settings-and-support.md) | Your role and assignment, connections, reconnecting, getting help | Everyone |

Before publishing, work through the [review notes](review-notes.md). They list everything this draft could not confirm from the code alone.

## 🔄 How the guide is built

```mermaid
flowchart LR
    SRC["📝 Chapter markdown<br>docs/user-guide/*.md"]
    MAP["🗺️ Screenshot map<br>assets/screenshots.yml"]
    IMG["🖼️ Screenshots<br>assets/*.png"]
    BUILD["⚙️ Guide build<br>npm run docs:guide"]
    OUT["📦 SharePoint package<br>publish/user-guide/"]
    SP["🏫 SharePoint<br>staff site"]

    SRC --> BUILD
    MAP --> BUILD
    IMG --> BUILD
    BUILD --> OUT
    OUT -->|upload index.html + assets| SP

    classDef source fill:#EAF3FF,stroke:#4A90E2,color:#071940
    classDef build fill:#071940,stroke:#4A90E2,color:#F4F7FC
    classDef out fill:#EFFAF3,stroke:#17633A,color:#17633A
    class SRC,MAP,IMG source
    class BUILD build
    class OUT,SP out
```

1. Edit a chapter. Each `##` heading becomes one guide topic; its first paragraph becomes the topic introduction.
2. Add or replace screenshots in [`assets/`](assets/) and describe them, with any numbered markers, in [`assets/screenshots.yml`](assets/screenshots.yml).
3. Run `npm run docs:guide` from `tools/docs/`. The guide is written to `publish/user-guide/index.html` with its `assets/` folder.
4. Upload `index.html` and `assets/` together to the SharePoint location, keeping the folder name.

The writing conventions (steps, callouts, screenshots and markers) are in [Writing guide topics](../standards/writing-guide-topics.md).

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Staff user guide*
