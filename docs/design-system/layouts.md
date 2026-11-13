# Application and workspace layouts

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Design system](README.md) / Layouts

## Standard capability page

**Status:** Current concept, consolidation Proposed

Used for Home, Settings, Class Assignment before a student is opened, Assessments, and similar pages:

- complete role-aware navigation;
- page title and concise description;
- page-specific filters or toolbar;
- viewport-contained shell with the main content region owning page scrolling;
- shared panel and component primitives.

## Viewport-shell contract

**Status:** Proposed core constraint

Every application screen fits inside the visible Nexus shell. The browser document and the shell do not grow beyond the viewport to accommodate feature content.

- The application shell is `100dvh` high and clips external overflow.
- The navigation, header, main content and optional panels are Grid/Flex regions with `min-height: 0`.
- Only named content regions receive `overflow: auto`.
- Branding, global controls and persistent navigation footer/account controls remain visible.
- The navigation destination list scrolls inside the remaining navigation height.
- A page header or workspace toolbar remains visible while its assigned content body scrolls.
- Drawers and dialogs never exceed the shell. Their header and actions remain visible while their body scrolls.
- Opening a side panel divides or overlays space inside the shell; it never increases the document width or height.
- Avoid placing a second vertical scroll container inside an already scrollable content body unless the component contract explicitly requires it.

This provides stable controls and prevents menus, form actions or document controls from scrolling beyond the visible application frame.

## High-density workspace

**Status:** Confirmed direction for IEP/IPP; detailed interaction Proposed

The separate Stage 3 shell can be reviewed locally at `http://localhost:5173/?shell-preview`. It contains navigation and shell geometry only; it does not call Dataverse or replace the current application shell.

IEP/IPP requires more usable body area than the standard page. The target pattern is:

```text
compact navigation | workspace header and context
                   | student strip and primary actions
                   | section navigation | active module content
```

The simplified header removes repeated student, plan and context blocks. Essential student identity remains visible, while detailed context is available from the context drawer.

Viewport bands determine the outer shell. The workspace then responds to its own remaining width through container queries, including when the context drawer or Compiled Documents panel is open. See [Responsive behaviour](responsive.md).

Main regions are fluid: the shell and active content use the full available width and Grid/Flex distributes the remaining space. Bounded widths are reserved for navigation, drawers and readable controls. Workspace height comes from `100dvh` plus flexible rows; arbitrary percentage heights are avoided because they fail when a parent has no definite height.

### Scroll ownership

- The outer workspace and browser document do not scroll; the shell is contained to the visible viewport.
- The navigation destination list owns navigation scrolling; its branding and footer controls remain fixed within the rail/menu.
- The module list may scroll independently.
- The active module body may scroll independently with sticky table headers where helpful.
- Drawers own their roster scroll.
- Dialog bodies scroll between a fixed dialog header and action footer.
- Avoid additional nested scroll containers inside module content.
- Every flexible or scrollable Grid/Flex child sets `min-width: 0` and/or `min-height: 0` so content cannot force the shell beyond the viewport.

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

The exact navigation state at each viewport band is defined in the [responsive matrix](responsive.md). Orientation is a secondary constraint; width and available component space remain the primary drivers.

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
