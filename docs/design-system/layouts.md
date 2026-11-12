# Application and workspace layouts

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Design system](README.md) / Layouts

## Standard capability page

**Status:** Current concept, consolidation Proposed

Used for Home, Settings, Class Assignment before a student is opened, Assessments, and similar pages:

- complete role-aware navigation;
- page title and concise description;
- page-specific filters or toolbar;
- normal document flow with page scrolling;
- shared panel and component primitives.

## High-density workspace

**Status:** Confirmed direction for IEP/IPP; detailed interaction Proposed

IEP/IPP requires more usable body area than the standard page. The target pattern is:

```text
compact navigation | workspace header and context
                   | student strip and primary actions
                   | section navigation | active module content
```

The simplified header removes repeated student, plan and context blocks. Essential student identity remains visible, while detailed context is available from the context drawer.

### Scroll ownership

- The outer workspace is contained to the viewport on supported desktop/tablet layouts.
- The module list may scroll independently.
- The active module body may scroll independently with sticky table headers where helpful.
- Drawers own their roster scroll.
- Avoid additional nested scroll containers inside module content.

### IEP/IPP section navigation

- Use a vertical, grouped list rather than an increasingly long horizontal tab strip.
- Support at least 20 modules without enlarging the page header.
- Show required/locked state and a text-supported progress state.
- Allow the section list to collapse for wide goals and matrices.
- On narrow layouts, replace the persistent list with an accessible section selector and previous/next actions.

## Navigation states

**Status:** Proposed

| State | Intended use |
|---|---|
| Expanded navigation | Home, Settings, discovery and first visit; retains all current role-authorized destinations. |
| Compact workspace rail | IEP/IPP and other focused workspaces where body width is important. |
| Context drawer | Filters, selected class context and roster where applicable. |
| Phone navigation | Open; bottom navigation is a concept, not yet an approved application pattern. |

The compact rail must not make destinations unreachable. It may use grouping, a More action, scrolling, or a route back to the expanded navigation.

## Context drawer

**Status:** Proposed for prototype

- Opened from a clearly labelled filter/context control and from the context chip.
- Content is supplied by the active workspace; it is not one fixed global filter form.
- Desktop can offer a pinned mode after overlay behaviour is validated.
- Opening moves focus into the drawer; closing restores focus to the trigger.
- Escape and the close action dismiss an unpinned drawer.
- Only one major side panel should claim the same edge at a time.

For IEP/IPP, the drawer can combine class filters and the class roster so a teacher can switch students without returning to Class Assignment.

## Analytics layouts

Analytics uses the same navigation, controls, typography, notices and surfaces. It may use distinct chart grids, legends, matrices, sticky headers, and container-query behaviour. The design system standardizes the frame and interaction language without forcing charts into School Administration's record-oriented layout.

## Compiled documents

The document preview and compiled PDF are not standard capability pages. They use shared semantic content but retain print-specific page geometry, headers, footers, contents, pagination and appendix handling. The preview should be available beside or over the workspace without permanently reducing module-editing space.
