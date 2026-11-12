# Screen-by-screen adoption plan

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Design system](README.md) / Adoption plan

**Status:** Proposed sequence

This is a controlled migration, not a single stylesheet rewrite. Working functionality and Dataverse behaviour remain unchanged unless separately scoped.

## Stage 1 — Agree foundations

- Review current and candidate brand assets.
- Decide whether the current structural blue or the concept action blue is the default action/focus colour.
- Approve typography, spacing, radius, elevation and focus targets.
- Approve terminology, date and missing-value conventions.
- Mark agreed items Confirmed in this documentation.

## Stage 2 — Establish the code foundation

- Introduce the semantic token stylesheet without changing appearance unnecessarily.
- Add shared Button, Field, Dialog, Notice, Badge, Panel, Table and state components.
- Define the screen/document module-rendering contract.
- Add visual regression and accessibility examples.

## Stage 3 — Prototype the high-density shell

Build a reversible prototype using current production data and behaviour:

1. Expanded navigation with every current destination.
2. Compact workspace rail.
3. Context chip and drawer using existing Class Assignment filters and roster.
4. Simplified IEP/IPP header and student strip.
5. Vertical grouped module navigation representing at least 20 modules.
6. ORF as a straightforward record table.
7. Mathematics or FMCS Foundations as a wide, complex goals module.
8. Existing Compiled Documents and Manage Modules experiences.

Review desktop, iPad landscape and iPad portrait before replacing the current shell.

## Stage 4 — School Administration migration

Suggested order:

1. Shared application shell and headers.
2. Class Assignment filters, section listing, student cards and history panels.
3. Assessments completion filters, period cards and missing-student list.
4. Assessment entry dialogs.
5. IEP/IPP workspace shell and module navigation.
6. IEP/IPP dialogs and shared module records.
7. Compiled Documents, signatures, module management and export controls.

Each screen receives keyboard, zoom, responsive and visual-regression review before moving to the next.

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
- keyboard and assistive-technology behaviour is verified;
- the relevant documentation status is updated;
- document-aligned module content is checked against its compiled form where applicable.
