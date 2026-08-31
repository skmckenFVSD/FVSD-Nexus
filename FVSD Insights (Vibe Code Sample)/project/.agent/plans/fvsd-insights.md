# FVSD Insights plan

## What will be built
- A single React analytics portal named **FVSD Insights** for school principals and leadership staff.
- A Power BI/Tableau/Microsoft Fabric-style executive analytics experience focused on insight discovery, meeting-ready performance review, and decision support.
- A professional public-sector education interface with Microsoft Fluent-inspired styling, responsive desktop/tablet layouts, and a persistent left navigation menu.
- The product will feel like a modern dashboard workspace, not a traditional data-entry business application.

## Navigation and pages
- **Home dashboard** — executive summary workspace with KPI cards, trend indicators, interactive charts, prominent Analytics Assistant, and action-oriented insight panels.
- **School profile** — school-level demographics, enrollment mix, program participation, and summary performance context.
- **Student success** — achievement, risk, grade-band, cohort, and progress views with charts, KPIs, and drill-down tables.
- **Attendance** — attendance trends, chronic absence indicators, grade comparisons, and cross-filtered detail tables.
- **Literacy** — literacy success rate, benchmark progress, intervention tiers, and student group comparisons.
- **Intervention tracking** — active support plans, intervention status, caseload summaries, and follow-up priorities.
- **Analytics assistant** — primary insight-discovery feature with executive prompts, narrative findings, recommended actions, and sample natural-language analysis.
- **Settings** — school year, comparison period, dashboard preferences, and display configuration.

## Executive dashboard experience
- KPI cards for total students, attendance rate, literacy success rate, students requiring intervention, active support plans, and trend indicators.
- Interactive trend charts, bar charts, donut charts, and executive scorecards arranged for high-density review during leadership meetings.
- Action-oriented insight panels highlighting risks, opportunities, watchlists, and recommended next steps.
- Analytics Assistant featured prominently on the home page as a primary decision-support entry point, not a secondary utility.
- Visual density optimized for principals and leadership teams who need rapid scanning, comparison, and meeting discussion support.

## Analytics interaction patterns
- Cross-filtering across KPIs, charts, tables, and insight panels on every analytics page.
- Filter panel for school year, school, grade band, student group, program, reporting period, and intervention tier.
- Drill-down interactions that reveal filtered tables, contextual detail panels, cohort views, and focused chart states.
- Selection states that make it clear which chart segment, KPI, or table row is driving the current page context.
- Sample interaction patterns will demonstrate how leadership staff move from an executive signal to supporting evidence.

## Data approach
- Use realistic sample data owned by the app for schools, students, attendance summaries, literacy benchmarks, interventions, support plans, KPI snapshots, trend series, and assistant insights.
- No live M365 or external district system integration is planned unless requested later.
- Data will be modeled for analytics-style browsing, filtering, cross-filtering, and drill-downs rather than CRUD workflows.

## Design direction
- Microsoft Fluent-inspired visual language with clean surfaces, restrained elevation, clear hierarchy, blue-forward civic palette, accessible contrast, and analytics-grade density.
- Dashboard aesthetic inspired by Power BI, Tableau, Sigma, and Microsoft Fabric: compact cards, chart grids, filters, insight callouts, and evidence-first navigation.
- Professional education/public-sector appearance: trustworthy, calm, data-rich, and suitable for executive leadership meetings.
- Responsive layout optimized for desktop and tablet, with the left navigation remaining the primary navigation pattern.

## Phase 2+ future scope
- **Authentication and identity** — Microsoft Entra ID authentication, user profiles, preferences, login/logout, and session management are deferred.
- **Security and governance** — role-based access control, school-level security filtering, row-level security, and audit/activity logging are deferred.
- **Data integration** — Canadian Dataverse, Microsoft Fabric, semantic models, real-time retrieval, and refresh orchestration are deferred.
- **Analytics and AI** — production Analytics Assistant, Copilot Studio, natural-language queries, AI-generated insights, recommended actions, and intervention guidance are deferred.
- **Assessment and student analytics** — real assessment, literacy, attendance, intervention, support plan, and student success integrations are deferred.
- **Reporting and distribution** — executive reports, scheduled reporting, Excel/PDF export, and presentation-ready summary views are deferred.
- **Operationalisation** — ALM, environment strategy, monitoring, telemetry, support, and maintenance processes are deferred.

## What stays out of scope
- Multi-app architecture; this solution remains one unified analytics experience.
- Full student information system functionality, operational data entry processes, and case management workflows.
- Replacement of Power BI or Microsoft Fabric; FVSD Insights complements existing analytics platforms and supports occasional dashboard consumers.
- Login/logout, account menus, role administration, real student records, live SIS connections, and production AI assistant integration for Phase 1.