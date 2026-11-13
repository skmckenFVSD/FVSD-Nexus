# Screen-by-screen adoption plan

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Design system](README.md) / Adoption plan

**Status:** Active sequence — Stage 1 completed November 13, 2026

This is a controlled migration, not a single stylesheet rewrite. Working functionality and Dataverse behaviour remain unchanged unless separately scoped.

## Stage 1 — Agree foundations — Complete

Completed November 13, 2026:

- [x] Reviewed current and candidate brand assets; approved the new Nexus logo and favicon.
- [x] Retained structural blue as the default action/focus basis; the concept action blue is not an application default.
- [x] Approved typography, spacing, radius, elevation and focus targets.
- [x] Approved the `600 / 900 / 1200 / 1400` viewport bands and component container-query thresholds.
- [x] Approved the fluid-sizing contract: full available page/workspace regions, fractional Grid/Flex layout, bounded chrome and controls, and fixed geometry only for print output.
- [x] Approved the viewport-shell contract: no browser-document scrolling, persistent shell controls remain visible, and only explicitly assigned navigation, content, drawer and dialog bodies scroll.
- [x] Approved how labels, descriptions, actions, tables and navigation treatments change in each responsive state.
- [x] Approved terminology, date and missing-value conventions represented by the design-system contracts.
- [x] Separated Screener Term Value colours from semantic application-state colours.

Changes to an approved foundation now follow design-system change control. Stage 2 may tune implementation mechanics and browser rendering without silently changing the confirmed contract.

## Stage 2 — Establish the code foundation

**Status:** Complete — approved for Stage 3 progression November 13, 2026

- [x] Introduce the semantic token stylesheet without changing feature behaviour; retain temporary aliases for current feature CSS.
- [x] Add shared breakpoint definitions, responsive helpers and named container roots.
- [x] Add shared viewport-shell and scroll-region primitives; move the current shell to explicit internal scroll ownership.
- [x] Add shared Button, Field, Dialog, Notice, Badge, Panel, Table and empty/loading/error state components.
- [x] Define the screen/document module-presentation contract.
- [x] Add a data-free accessibility and visual-regression example surface at `/?design-system` in local development.
- [x] Carried the visual review forward into the reversible Stage 3 shell prototype, where the approved boundaries can be assessed with the actual navigation states.

## Stage 3 — Prototype the high-density shell

**Status:** In progress — development-only shell available at `/?shell-preview`

Build a reversible prototype using current production data and behaviour:

1. [x] Expanded navigation with every current destination.
2. [x] Compact workspace rail.
3. [x] Scrollable navigation destinations with branding and footer/account controls retained inside the shell.
4. [x] Responsive transition across compact, small, medium, large and wide viewport bands.
5. [ ] Context chip and drawer using existing Class Assignment filters and roster.
6. [ ] Workspace container-query changes with the drawer open, closed and pinned.
7. [ ] Simplified IEP/IPP header and student strip.
8. [ ] Vertical grouped module navigation representing at least 20 modules.
9. [ ] ORF as a straightforward record table.
10. [ ] Mathematics or FMCS Foundations as a wide, complex goals module.
11. [ ] Existing Compiled Documents and Manage Modules experiences.

The first preview deliberately contains no feature records or Dataverse calls. The component and its stylesheet are lazy-loaded only in the local development build and are excluded from the production bundle.

Review at `599/600`, `899/900`, `1199/1200`, and `1399/1400` px as well as representative phone, iPad, desktop and wide-desktop sizes before replacing the current shell.

## Stage 4 — School Administration migration

Suggested order:

1. Shared application shell and headers.
2. Class Assignment filters, section listing, student cards and history panels.
3. Assessments completion filters, period cards and missing-student list.
4. Assessment entry dialogs.
5. IEP/IPP workspace shell and module navigation.
6. IEP/IPP dialogs and shared module records.
7. Compiled Documents, signatures, module management and export controls.

Each screen receives keyboard, 200% zoom, responsive boundary, open-panel/container-width, and visual-regression review before moving to the next.

## Stage 5 — Analytics and remaining capabilities

- Apply the same shell, typography, fields, buttons, notices and status language.
- Define analytics-specific chart and matrix primitives separately.
- Migrate Settings, authentication, governance and future capabilities after the shared patterns stabilize.

## Stage 6 — Document presentation alignment

- Apply approved semantic module presentation to PDF generation.
- Verify page breaks, repeated table headers, contents, appendices, signatures, headers and footers.
- Confirm that screen-only controls never appear in compiled output.
- Preserve historical output requirements and Canvas migration comparisons where required.

## Review gate

A screen is complete only when:

- functionality and authorization are unchanged or explicitly approved;
- design-system primitives replace feature-local variants;
- desktop and supported touch layouts are reviewed;
- every supported viewport band and relevant component container state is verified;
- the root document does not scroll and persistent controls remain visible while assigned regions handle overflow;
- keyboard and assistive-technology behaviour is verified;
- the relevant documentation status is updated;
- document-aligned module content is checked against its compiled form where applicable.
