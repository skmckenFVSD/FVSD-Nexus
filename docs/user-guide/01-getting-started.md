---
title: Getting started
description: Signing in to FVSD Nexus, finding your way around, and how your role shapes what you see.
type: guide-chapter
status: draft
icon: 🧭
area: user-guide
audience: [staff]
owner: Scott McKenzie
tags: [nexus, nexus/user-guide]
updated: 2026-11-17
related: ["[[user-guide/README]]", "[[architecture/identity-licensing-security]]"]
chapter: Getting started
order: 1
---

# 🧭 Getting started

[🏠 Home](../README.md) › [🧑‍🏫 Staff user guide](README.md) › Getting started

## 🧭 Start here

FVSD Nexus is the division's application for moving from governed evidence to action. It brings leadership analytics, class assignments, assessment entry and annual plans into one place, and it shows you only what your role allows.

Nexus does not keep its own copy of the truth. Every number and record you see comes from a governed source:

| What you see | Where it comes from |
|---|---|
| Student records, assessments, annual plans | Microsoft Dataverse, the division's operational record |
| Measures, medians and trends in analytics | The `FVSDAnalytics` semantic model in Microsoft Fabric |
| Your name, role and school | Your FVSD Microsoft account and your Nexus role record |
| Student demographics and enrolment | PowerSchool, synchronized into Dataverse |

> [!TIP]
> If a number in Nexus looks different from a report you know, the governed source is the answer. Note what you were looking at and raise it with support (see [If something does not look right](06-settings-and-support.md#-if-something-does-not-look-right)).

## 🔐 Sign in

Nexus uses your FVSD Microsoft account. There is no separate Nexus password.

1. Open FVSD Nexus with the **Open FVSD Nexus** button at the top of this guide.
2. If you are not already signed in, Nexus shows **Use your FVSD account to continue**. Select the sign-in button and sign in with your FVSD account.
3. Nexus opens on the **Overview** page under **Analytics**.

![The FVSD Nexus sign-in screen asking you to use your FVSD account.](assets/sign-in.png "Sign in with your FVSD account.")

> [!NOTE]
> Nexus acts **as you**. Every record you open, save or delete is attributed to your account, and you only ever see students, schools and measures that your own permissions allow.

## 🗺️ Find your way around

The navigation down the left side groups everything by area. Select a group to open it, then select a page.

![The FVSD Nexus navigation with the Analytics and School Administration groups expanded.](assets/navigation.png "The navigation groups pages by area.")

| Group | Pages | Who sees it |
|---|---|---|
| **Analytics** | **Overview** is available now. Literacy, Numeracy, Wellness, Interventions and Attendance are marked **Soon**. | Everyone |
| **School Administration** | **Class Assignments** and **Assessments** | Everyone with Class Assignment access |
| **Governance** | Data Quality, Data Catalog and Data Administration, all marked **Soon** | Data Administrators only |

- Pages marked **Soon** are planned and cannot be opened yet.
- Use the arrow beside the FVSD Nexus name to **collapse the navigation** and give the page more room. Select it again to expand it.
- **Settings** sits at the bottom of the navigation, with your current role and a reminder that Nexus is secured by FVSD Entra ID.

## 👥 Your role and what you see

Your role and school assignment come from your Nexus role record. They decide which schools, classes and actions are available to you.

| Role in Nexus | What it usually means for you |
|---|---|
| **Executive** | Division-wide analytics across all schools; can choose any school in filters. |
| **School Administrator** | Your assigned school or schools; can delete assessment records where required. |
| **Teacher** | The schools and sections you teach; class rosters and student records for your sections. |
| **Student Support** / **Specialist Support** | Student records and history for the students you support. |
| **Data Administrator** | Division-wide data access and the Governance area as it is released. |

Your current role is shown at the bottom of the navigation and on the [Settings](06-settings-and-support.md) page. If it is wrong, do not work around it: ask for it to be corrected.

> [!IMPORTANT]
> What you can **see** is enforced by the governed sources, not just by the screen. Hiding a button is a convenience; the data services check your permissions again every time.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Staff user guide*
