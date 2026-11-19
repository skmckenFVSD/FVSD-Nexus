---
title: Assessments
description: Reading assessment history, recording TOSREC assessments, editing and deleting records, and monitoring completion.
type: guide-chapter
status: draft
icon: 📋
area: user-guide
audience: [teachers, school-administration]
owner: Scott McKenzie
tags: [nexus, nexus/user-guide, nexus/assessments]
updated: 2026-11-17
related: ["[[capabilities/assessments/README]]", "[[user-guide/03-class-assignments]]"]
chapter: Recording assessments
order: 4
---

# 📋 Assessments

[🏠 Home](../README.md) › [🧑‍🏫 Staff user guide](README.md) › Assessments

## 📋 Read a student's assessment history

Assessment history lists every saved screener result for the selected student, with the governed descriptive term and its colour.

1. Open the student from [Class Assignments](03-class-assignments.md#-open-a-student) in a Literacy, Numeracy or Foundations section.
2. Under **Assessment history**, **Current Year** opens first. Select **Previous Years** for earlier school years.
3. Each row shows the **School year**, **Period**, **Standard score** and **Descriptive term**.
4. Select **View** on a row to open the full record.

> [!NOTE]
> TOSREC is the first assessment connected in Nexus. Other assessments will be added in turn; until then their history is not shown here.

## ✅ Add a TOSREC assessment

New assessments are recorded from the student's history. Nothing is saved until you select **Save Assessment**.

1. Under **Assessment history**, select **Add assessment**. **Add Student Assessment** opens.
2. Choose the **Assessment Type**. The list is filtered by the student's curriculum and grade.
3. Under **Assessment Detail**, enter the **Assessment Date**.
4. Choose the **Period**. Only the period that matches the date is offered:

   | Period | Assessment dates |
   |---|---|
   | Fall | September 1 to December 31 |
   | Winter | January 1 to March 30 |
   | Spring | April 1 to June 30 |

5. Set **Exempt**. If the student is exempt, enter the **Exempt Reason** and go to step 7.
6. Under **Assessment Scoring**, choose **Total Correct** and **Total Error**. Nexus looks up and shows the **Raw Score**, **Standard Score**, **Percentile Rank** and **Descriptive Term** from the governed reference tables.
7. Select **Save Assessment**. The form closes and the history refreshes with the new record.

![The Add Student Assessment form with Assessment Detail and Assessment Scoring.](assets/assessment-add.png "Complete Assessment Detail first, then Assessment Scoring.")

> [!IMPORTANT]
> March 31, July and August do not belong to an assessment period. If **No assessment period is available for this date** appears, check the date.

> [!TIP]
> You never type a standard score or descriptive term. They are calculated from the governed reference tables and checked again when you save, so every school scores the same way.

## 🔄 Edit an assessment

You can correct a record while its period is still open.

1. Select **View** on the record in **Assessment history**.
2. Select **Edit**. Edit is only offered for records in the current school year and the current period.
3. Make the change and select **Save Assessment**.

Records from a closed period stay read-only. If an older record is wrong, ask your school administrator; a controlled correction process is planned.

If you close the form with unsaved changes, Nexus asks **Discard unsaved changes?** Select **Discard changes** to leave without saving.

## ⚠️ Delete an assessment

Deleting is limited to School Administration and Data Administrator roles, and it cannot be undone.

1. Select **View** on the record.
2. Select **Delete Assessment**.
3. Read **Confirm Deletion of Record** and confirm. The record is permanently removed from Dataverse and the history refreshes.

> [!WARNING]
> Deletion is permanent. If you are unsure, edit the record instead or ask your school administrator.

## 📊 Check assessment completion

The **Assessments** page shows which students still need an assessment in each period.

1. In the navigation, open **School Administration** and select **Assessments**.
2. Choose the **School**, **Section Group**, **Course Name**, **Teacher** and **Assessment Type**.
3. Choose the period to review. Completion counts appear for the roster.

Which students count towards completion:

| Course | TOSREC required |
|---|---|
| Grades 2 to 10 | Every period |
| ELALIT1 | Winter and Spring only |
| ELA | Not required |

Exempt records count as complete.

![The Assessments completion view showing counts for a class roster by period.](assets/assessment-completion.png "Completion counts for the selected class and period.")

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Staff user guide*
