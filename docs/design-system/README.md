# FVSD Nexus design system

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / Design system

**Status:** Confirmed documentation foundation; individual visual values and concept assets remain Current, Proposed, or Open as labelled

This section is the canonical product record for the visual language and reusable user-experience patterns of FVSD Nexus. It exists before the screen-by-screen styling work so that each capability is built from agreed foundations rather than adding another local variant.

The exploratory UX audits and artboards informed this section, but they are reference material rather than implementation instructions. Nexus retains its current functionality, full role-aware navigation, and governed data behaviour unless a separately recorded decision changes them.

## Confirmed direction

- IEP/IPP workspaces need materially more body space than the current page-header and horizontal-module layout provides.
- High-density workspaces should use a simplified heading and compact context presentation.
- Shared assets, colours, typography, spacing, controls, statuses, and interaction states will be agreed here before broad implementation.
- School Administration is the first screen family to adopt the agreed system.
- Analytics will reuse the same foundations and core controls, while allowing chart- and matrix-specific layouts.
- Interactive module views and compiled documents will use the same structured records, terminology, module descriptions, value formatting, and semantic presentation rules. Print-specific layout remains a separate renderer concern.
- Existing navigation destinations remain available. Exploratory concepts that show fewer destinations do not authorize their removal.

## Source-of-truth hierarchy

```text
Design-system documentation (decisions and status)
                    ↓
Semantic design tokens (one code definition)
                    ↓
Shared React components and layout primitives
                    ↓
School Administration, Analytics, Settings and future capabilities
                    ↓
Visual regression and accessibility verification
```

Documentation defines intent and approval status. Once values are agreed, code should implement them through one token layer rather than copying literal colours, radii, shadows, or spacing into feature styles.

The intended code structure is:

```text
src/FVSDNexus.Web/src/styles/
  tokens.css              semantic colour, type, spacing, radius and elevation
  document-tokens.css     print/PDF-only extensions that reference shared semantics

src/FVSDNexus.Web/src/components/ui/
  Button, Field, Dialog, Notice, Badge, Tabs, Table, EmptyState, LoadingState

src/FVSDNexus.Web/src/components/layout/
  AppShell, PageHeader, WorkspaceHeader, ContextDrawer, SectionNavigation
```

These target locations are **Proposed** until the first implementation slice is approved. The current production stylesheet remains authoritative for the running application.

## Library map

| Area | Canonical document |
|---|---|
| Colour, typography, spacing, shape, elevation, focus and breakpoints | [Foundations](foundations.md) |
| Logos, application marks, favicons and icon rules | [Assets](assets.md) |
| Buttons, fields, dialogs, notices, tables and other shared controls | [Components](components.md) |
| Markup examples beside rendered visual references | [Component gallery](component-gallery.md) |
| Standard pages, compact workspaces, navigation rail and context drawer | [Layouts](layouts.md) |
| Migration sequence and review gates | [Adoption plan](adoption-plan.md) |

## Status and change control

The documentation-wide status model applies:

| Status | Design-system meaning |
|---|---|
| Current | Used by the active production build. |
| Confirmed | Agreed direction or constraint; implementation may still be pending. |
| Proposed | Candidate value or pattern requiring visual review. |
| Open | A material choice has not been made. |

No Proposed asset or colour becomes the application default merely because it is stored in this library. A design-system change should identify affected components and screens, include visual and accessibility evidence, and be reviewed before broad migration.
