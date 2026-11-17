---
title: User guide review notes
description: Private review list for the staff guide — what this draft could not confirm from the code. Not published to staff.
type: guide-review
status: open
icon: ❓
area: user-guide
audience: [maintainers]
owner: Scott McKenzie
tags: [nexus, nexus/user-guide, review]
updated: 2026-11-17
related: ["[[user-guide/README]]"]
publish: false
---

# ❓ User guide review notes

[🏠 Home](../README.md) › [🧑‍🏫 Staff user guide](README.md) › Review notes

This page is for preparation and review. It is **not** part of the staff guide and the guide build never publishes it.

## 📌 How this draft was written

The November 2026 draft was written from the `main` branch code (commit `3a955e7`) and the capability documentation, not from live screenshots. Labels in **bold** are copied from the application source. Behaviour that could not be confirmed from the code is listed below rather than invented.

## ❓ Confirm before publishing

1. **Support contact.** [Settings and support](06-settings-and-support.md) has a placeholder. Add the Helpdesk URL or contact.
2. **Role descriptions.** The role table in [Getting started](01-getting-started.md) is inferred from access rules in the API (`AssessmentAccessPolicy`). Confirm wording for Student Support and Specialist Support, and whether Teachers may choose among several schools.
3. **Small-group suppression in analytics.** [Leadership analytics](02-leadership-analytics.md) says small groups may be suppressed. This is a governance principle elsewhere in FVSD analytics; confirm that the `FVSDAnalytics` measures used by Nexus apply it.
4. **Chart description.** The chart topic describes bars of descriptive-term submissions and a median line. Confirm against the current chart before adding the screenshot.
5. **Signal wording.** The Performance, Participation and Focus signals are described generally because the current signals are prototype rules.
6. **Completion rules.** The TOSREC completion table copies the rule text shown on the Assessments page. Confirm it is current for 2026–27.
7. **Removing a plan module.** The guide says selecting an included module in **Manage modules** removes it. Confirm the exact interaction.
8. **Module table.** Mathematics and FMCS Foundations are described together. Confirm the actions and whether SHES or RLNS Foundations modules should be listed.
9. **Recipient types.** The Signatures topic does not list recipient types. Add them (the Education Framework guide listed Needs to Sign, In Person Signer, Receives a Copy and Needs to View) if they are unchanged.
10. **Compiled documents.** **Request document** is disabled in the current build. Update the topic when document compilation is connected.

## 🖼️ Screenshots to capture

Screenshots are listed with their captions, alternative text and marker positions in [`assets/screenshots.yml`](assets/screenshots.yml). Until a file exists, the guide build shows a clearly labelled placeholder. Capture with obfuscated student names (the developer **O** display mode) and check every image for identifiable information before committing it.

`npm run docs:check` lists every screenshot that is still missing.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Staff user guide*
