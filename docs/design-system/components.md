# Shared component contracts

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Design system](README.md) / Components

**Status:** Proposed consolidation contracts; current production components remain unchanged

See the [component gallery](component-gallery.md) for markup examples shown beside their rendered target appearance.

The contracts below describe responsibilities and states, not final implementation names. A shared component is successful when feature code supplies content and behaviour without redefining its typography, spacing, focus, disabled, or status treatment.

## Core controls

| Component | Required variants and states |
|---|---|
| Button | Primary, secondary, ghost, danger, danger-soft; small and medium sizes; hover, focus, busy and disabled. |
| Icon button | Standard and compact; accessible name; tooltip; selected/pressed where applicable. |
| Field | Text, number, date, email, select and text area; label, required, helper, error and disabled. |
| Checkbox/toggle | Labelled binary state; neutral styling unless the state is genuinely success/danger. |
| Tabs/segmented control | Keyboard navigation, selected state and overflow behaviour. |
| Dialog | One header/body/footer shell; focus trap, return focus, unsaved-change confirmation and responsive sizing. |
| Confirm dialog | Styled replacement for browser-native confirms; destructive and non-destructive variants. |

## Content and status

| Component | Contract |
|---|---|
| Notice | Info, success, warning and error from one structure; optional action. |
| Status badge | Text plus semantic colour; never colour-only. |
| Panel/card | Standard border, radius and spacing; selectable and static variants. |
| Section header | Title, optional description, optional eyebrow and aligned actions. |
| Data table | Consistent header, row, empty state, responsive alternative and accessible actions heading. |
| Record card | Document-aligned record hierarchy for narrow screens and non-tabular module records. |
| Empty state | Title, explanation and optional primary action. |
| Loading state | Consistent spinner/skeleton choice based on whether layout is known. |

## Application layout primitives

| Component | Purpose |
|---|---|
| App shell | Expanded navigation, compact workspace navigation and responsive content boundary. |
| Page header | Standard capability page title, description and actions. |
| Workspace header | Compact breadcrumb/context/action row for high-density tasks. |
| Context chip | Shows the active school, section/course and other essential context. |
| Context drawer | Workspace-specific filters and, where relevant, student roster. |
| Section navigation | Grouped, scrollable IEP/IPP module list with required and progress states. |

## Document-aligned module rendering

IEP/IPP module components should be driven by a canonical view model and expose explicit render modes:

```text
Module data + module definition
             ↓
      canonical view model
       ↙             ↘
screen mode       document mode
```

Screen mode may add Edit, Add, Delete, loading and validation controls. Document mode excludes interactive chrome and applies pagination rules. Both modes share:

- record order;
- headings and descriptions;
- semantic labels and formatting;
- tables/cards and status meaning;
- governed module metadata.

Generated HTML is an output, not the operational source of truth. Where descriptions or guidance come from Dataverse, the API must provide a safe, explicit presentation model rather than allowing arbitrary stored HTML to define application behaviour.

## Acceptance criteria for every shared component

- Keyboard operable with a visible focus state.
- Screen-reader name, role and state are correct.
- Works at 200% browser zoom.
- Has defined loading, error, empty, busy and disabled behaviour where applicable.
- Uses semantic tokens instead of feature-local colour or spacing literals.
- Has desktop and touch sizing rules.
- Has a visual regression example before broad adoption.
