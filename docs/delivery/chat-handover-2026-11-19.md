# FVSD Nexus chat handover — 2026-11-19

Use this document to continue the current build in a new chat without replaying the full conversation.

## Immediate instruction to the next chat

Continue from the existing dirty working tree. Do **not** reset, discard, regenerate, or broadly rewrite the current changes. Some changes were produced in the previous Codex chat and some by Claude; they are all intentional pending work unless a specific defect is identified.

The user has explicitly requested:

- local development and GitHub changes only;
- no Azure deployment until the new shell is fully functional;
- no repeated build, test, authentication, licensing, or API-check loops;
- run a focused check only when a reported feature is not working or before a release explicitly requested by the user;
- do not commit or push unless explicitly requested.

## Repository state

- Repository: `FVSD-Nexus`
- Working directory: `C:\Users\ScottM\OneDrive - Fort Vermilion School Division\Documents\GitHub\FVSD-Nexus`
- Branch: `documentation`
- HEAD at handover: `96daf31`
- Remote tracking branch: `origin/documentation`
- Working tree is intentionally dirty with the new shell, security, Student Screeners, Foundry Copilot, Work IQ, and history-grid work.

Important pending areas include:

- `src/FVSDNexus.Web/src/AssessmentWorkspace.tsx`
- `src/FVSDNexus.Web/src/ClassAssignmentWorkspaceV2.tsx`
- `src/FVSDNexus.Web/src/StudentScreenersDashboard.tsx`
- `src/FVSDNexus.Web/src/design-system/HighDensityShellPreview.tsx`
- `src/FVSDNexus.Web/src/index.css`
- `src/FVSDNexus.Web/src/styles/high-density-shell.css`
- `src/FVSDNexus.Web/src/main.tsx`
- `src/FVSDNexus.Api/Dataverse/*`
- `src/FVSDNexus.Api/FoundryCopilot/`
- `src/FVSDNexus.Api/CopilotAccess/`
- `src/FVSDNexus.Api/WorkIq/`
- authentication/Entra configuration, tests, `azure.yaml`, and application settings.

There are also untracked `.artifacts` and `evals` directories from the recent Copilot integration work. Preserve them until deliberately reviewed; do not delete them as cleanup.

## Local development

Prerequisites are .NET 10 and Node.js 20+.

Run in separate terminals:

```powershell
dotnet run --project .\src\FVSDNexus.Api
```

```powershell
npm run dev --prefix .\src\FVSDNexus.Web
```

The Vite frontend is `http://localhost:5173` and proxies API traffic to `http://localhost:5029`.

Open the new shell with:

```text
http://localhost:5173/?shell-preview
```

The `/shell-preview` path was previously problematic after authentication; the query-string form above is the established local-preview route.

## Current product direction

The application is moving from the old shell to the high-density shell. The new shell is the target; the existing deployed Azure application remains the comparison/reference implementation until the migration is complete.

Primary navigation:

- Administration
  - Class Assignments
  - Student Screeners
  - Student Program Plans
- Analytics
- Security & Access

Terminology:

- use **Student Screeners**, not Assessments, for the dashboard/navigation area;
- use **Student Program Plan**, not IEP / IPP, in user-facing headings;
- exported documents, not compiled documents;
- underlying Dataverse schema names can retain IPP terminology.

## Security and development simulation

Supported/planned roles:

- Executive — all schools, sections, and students;
- School Administrator — schools in `fvsd_userrole.fvsd_assignmentone` and `fvsd_assignmenttwo`;
- Teacher — teacher sections where the teacher system-user UPN matches the signed-in UPN;
- Student Support — planned scope via Support Staff Sections;
- Specialist Support — planned per-student specialist assignment table;
- Data Administrator — full operational/Fabric visibility; renamed from Data Analyst.

Scott McKenzie is currently the only hard-coded Data Administrator for development controls, even though the Dataverse user-role row may still say Executive.

The Development Controls rail supports:

- previewing a role;
- previewing a user by email/UPN without changing the actual signed-in identity;
- clearing the simulated user when the panel closes;
- real/obfuscated student data.

The preview-user scope was fixed so clearing and reapplying a simulated teacher correctly restores that teacher's permitted school and sections. Do not replace this with a real sign-in/account switch; it is a data-visibility simulation using the signed-in administrator's connection.

## Class Assignments and history grids

The Class Assignments filters and teacher-section security boundaries are connected in the new shell. Course groups correctly expand to teacher cards after the recent layout fix.

History visibility rules:

- Literacy: Assessment History only;
- Numeracy: Assessment History only;
- Foundations: Assessment History and Student Program Plan History together;
- Homeroom: Student Program Plan History only.

The Add Assessment action is available for Literacy, Numeracy, and Foundations. Program Plans are available for Homeroom and Foundations. A new Program Plan action is visible only when the selected student has no current-year plan.

Assessment and Program Plan grids are being ported from the old shell and should remain visually consistent.

### Program Plan status column — latest completed change

The Program Plan history grid now has a Status column, sourced from Dataverse `statuscode`, with lifecycle chips matching the Student Program Plans overview pipeline:

| Status | Value |
| --- | ---: |
| Draft | `1` |
| Principal Review | `102370001` |
| Awaiting Signatures | `102370002` |
| Signed | `102370003` |
| Archived | `2` |

Files changed for this:

- `AssessmentWorkspace.tsx`
- `AssessmentWorkspaceModels.cs`
- `DataverseAssessmentWorkspaceClient.cs`
- `index.css`

Archived inactive plans are no longer excluded from plan history and can appear under Previous Years. No broad build/test cycle was run after this focused edit, by user request.

## Student Screeners dashboard

The new Student Screeners page is an actions dashboard, not merely a completion report.

Current connected behavior:

- Executive/Data Administrator must select a school before detailed completion data loads; this avoids a slow division-wide Dataverse fetch.
- School-level view shows eligible, completed, missing, completion rate, assessment windows, recommended actions, teacher accountability, and missing students.
- Role/security scope and filters are respected.
- The right-side Copilot rail opens from the header.

The dashboard's high-level data wiring is functional. Do not reintroduce the division-wide eager fetch.

## Copilot and Work IQ

The managed Foundry Copilot chat connection is working in the Student Screeners rail and can answer from the governed page context, including teacher and missing-student detail exposed by the backend.

Recent work also added:

- Microsoft 365 Copilot entitlement checks;
- Copilot/usage information in the initial connection gate;
- Security & Access scaffolding for Copilot and cost-based billing;
- Work IQ handoff scaffolding using user delegation.

Work IQ task execution is not yet considered production-ready. Licensing/Graph delegated-permission issues were corrected by Claude and the UI/chat experience is sufficient for demonstrations. Harden Copilot and Work IQ only after the core shell/functionality migration unless the user explicitly reprioritizes it.

Do not spend time re-running the earlier Copilot licensing/check loop.

## Student Program Plans

The overview page includes the lifecycle pipeline:

- Draft
- Principal Review
- Awaiting Signatures
- Signed
- Archived

Intended transitions:

- new plan → Draft;
- export generated → Principal Review;
- signature request → Awaiting Signatures;
- DocuSign return → Signed;
- end-of-year/manual close → Archived.

The detailed Program Plan workspace uses modular sections, a Module Builder rail, an Exported Documents rail, PDF-like section rendering, and a future Copilot rail. The major modules already exist in the old/new work, but the next substantial migration focus is the Program Plan workspace after the Class Assignment history grids are stable.

## Recommended next step

### Latest checkpoint — Class Overview and grid editing

The user authorized committing and pushing all pending source changes to GitHub on November 19. Azure deployment remains explicitly out of scope.

- Student Program Plans now uses permitted Dataverse data and independent school, section group, teacher, school-year, and status filters throughout the dashboard.
- Plans in Progress has a contained scrolling list. Class Overview appears when a single teacher is selected and opens the grid directly.
- The grid supports Empower Reading and Mathematics. Student grades in the selected, permitted class roster determine goal scope; section metadata is a fallback. Empower divisions are Grades 2–5 and Grades 6–9.
- Div and Level headings span the grid. Goal descriptions are visible, and columns wrap to avoid horizontal scrolling.
- Print supports the full grid in landscape; sample-data output was inspected. Export, Export Template, and Import Results remain disabled placeholders.
- Edit toggles per-cell level/date inputs with autosave through the existing governed plan-goal endpoints. Existing records use ETags; missing and historical plans remain read-only. New entries default to today's Edmonton date when no date is recorded. Failed/incomplete cells provide retry/reset controls.
- Mathematics rating choices now include In Progress, Met, and Not Met. The shared level-query helper also contains the supplied FMCS and RLNS rules for future grid sections.
- The user has reviewed the initial layout but has **not yet tested updates**. Do not describe live student-record writes as user-verified. Focused request, scope, level-option, and payload checks passed.
- Generated `.artifacts` directories and `/tmp` are ignored and preserved locally.

Next: follow the user's feedback on grid formatting and manually testing edits. Do not deploy to Azure or start broad test/authentication/licensing loops.

### Earlier recommendation

Start by manually viewing the newly added Program Plan Status column in the local preview. If it renders correctly, continue the remaining Assessment and Program Plan history-grid port without broad refactoring. Then begin the Student Program Plan workspace rework, preserving the established modular behavior and PDF-like render layout.

Do not begin with Azure deployment or another Copilot licensing investigation.
