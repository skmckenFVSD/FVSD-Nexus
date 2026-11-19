---
title: Leadership analytics
description: Reading the Analytics Overview — analysis context, focus area, signals, school comparison matrix and focused charts.
type: guide-chapter
status: draft
icon: 📊
area: user-guide
audience: [executive, school-leaders]
owner: Scott McKenzie
tags: [nexus, nexus/user-guide, nexus/analytics]
updated: 2026-11-17
related: ["[[capabilities/leadership-analytics/README]]", "[[user-guide/README]]"]
chapter: Leadership analytics
order: 2
---

# 📊 Leadership analytics

[🏠 Home](../README.md) › [🧑‍🏫 Staff user guide](README.md) › Leadership analytics

## 📊 Open the Overview

The Overview turns governed assessment measures into a guided picture: where results stand, where participation is low, and which school, grade and period needs attention. You do not need to know Power BI to use it.

1. In the navigation, open **Analytics** and select **Overview**. Nexus opens here after you sign in.
2. Set the **Analysis context** at the top of the page (see the next topic).
3. Work down the page: choose a focus area, read the signals, compare schools, then focus a chart.

> [!NOTE]
> Every value comes from the `FVSDAnalytics` semantic model through predefined, reviewed queries. Your own analytics permissions still apply, so two people can see different schools on the same page.

## 🧭 Set the analysis context

The analysis context decides which school years, periods, schools and grades every part of the page uses.

1. Open **School year** and tick one or more years. **Select all** and **Clear** sit at the top of each list.
2. Open **Period** and choose one or more periods.
3. If your role allows it, open **School** and choose the schools to include. If you do not see School, the page already uses your own school.
4. Under **Executive Dashboard filters**, open **Grade** and choose one or more grades.
5. Check the **Live selection** line under the filters. It summarizes exactly what the page is showing.

![The Analysis context panel with School year, Period, School and Grade filters and the Live selection line.](assets/analytics-context.png "Set school year, period, school and grade, then check Live selection.")

> [!TIP]
> Choosing several school years lets you compare the same period across years. In the charts, school year becomes the grouping beneath period.

## 🎯 Choose the focus area and assessment group

The focus area and assessment group decide which measures the signals, matrix and chart use.

1. Under **Main area of focus**, select **Literacy** or **Numeracy**. **Wellbeing** is marked **Later** and is not available yet.
2. Open **Assessment group** and choose the screener you want to review, for example TOSREC or TOWRE. Only assessments that apply to your selection are listed.

The page heading changes to match, for example **Literacy overview**.

## 💡 Read “What needs our attention?”

Three short signals summarize the current selection before you look at any detail.

| Signal | What it tells you |
|---|---|
| **Performance** | How median scores are moving across the selected periods. |
| **Participation** | How many assessments have been submitted, and where submissions are low. |
| **Focus** | Where to look first: the school, grade or period standing out from the rest. |

> [!NOTE]
> The signal wording is generated from the governed measures for your current selection. Treat the signals as a starting point for a conversation, then confirm the detail in the matrix and chart.

## 🏫 Compare schools in the matrix

The **School comparison** matrix shows the median score by period and cohort group for each school, school year and grade in your selection.

1. Read across a row to see how one school, year and grade moved through the periods.
2. Cohort groups (**Foundation** and **Curriculum**) stay in fixed columns so rows can be compared directly.
3. **Select a row** to focus the chart beneath it on that school, year and grade.
4. Select **Clear focus** above the chart, or select the same row again, to return to the full selection.

![The School comparison matrix with one row selected and the chart focused beneath it.](assets/analytics-matrix.png "Select a row to focus the chart on that school, year and grade.")

If no school matches the selected year, grade, period and assessment group, the matrix tells you so instead of showing an empty table.

## 📊 Read the charts

The chart shows descriptive-term submissions and the governed median score for the selected assessment group.

- Bars show how many submitted assessments fall into each descriptive term. The terms and their colours are the governed screener colours used everywhere in Nexus.
- The median score line shows performance across periods.
- Charts with no submitted assessments for your selection are not drawn.

> [!IMPORTANT]
> Small groups are protected. Where very few students sit behind a figure, analytics may suppress it to protect privacy. A missing value is not an error.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Staff user guide*
