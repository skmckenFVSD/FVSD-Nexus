# Asset library and iconography

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Design system](README.md) / Assets

This register identifies canonical production assets and exploratory candidates. The linked source file remains the single asset; documentation should not create duplicate production copies.

## Current production assets

| Asset | Canonical path | Format / dimensions | Status | Use |
|---|---|---|---|---|
| FVSD Nexus application logo | [`src/FVSDNexus.Web/src/assets/fvsd-nexus-logo.png`](../../src/FVSDNexus.Web/src/assets/fvsd-nexus-logo.png) | PNG, 256 × 256 | Current | Sidebar and application identity. |
| Browser favicon | [`src/FVSDNexus.Web/public/favicon.svg`](../../src/FVSDNexus.Web/public/favicon.svg) | SVG | Current | Preferred scalable browser icon. |
| Browser favicon 32 | [`src/FVSDNexus.Web/public/favicon-32.png`](../../src/FVSDNexus.Web/public/favicon-32.png) | PNG, 32 × 32 | Current | Browser fallback. |
| Browser favicon 48 | [`src/FVSDNexus.Web/public/favicon-48.png`](../../src/FVSDNexus.Web/public/favicon-48.png) | PNG, 48 × 48 | Current | Browser fallback. |
| Apple touch icon | [`src/FVSDNexus.Web/public/apple-touch-icon.png`](../../src/FVSDNexus.Web/public/apple-touch-icon.png) | PNG, 256 × 256 | Current | Installed/mobile shortcut. |
| SVG symbol sheet | [`src/FVSDNexus.Web/public/icons.svg`](../../src/FVSDNexus.Web/public/icons.svg) | SVG sprite | Current | Existing application symbols. |

## Confirmed replacement assets

| Asset | Path | Status | Decision required |
|---|---|---|---|
| New scalable FVSD Nexus menu logo supplied November 12, 2026 | [`assets/approved/fvsd-nexus.svg`](assets/approved/fvsd-nexus.svg) | Confirmed; production implementation pending | Replace the current raster menu mark during the shell implementation and verify compact-rail sizing. |
| New FVSD Nexus favicon supplied November 12, 2026 | [`assets/approved/fvsd-nexus-favicon.png`](assets/approved/fvsd-nexus-favicon.png) | Confirmed; production implementation pending | Replace the current favicon set and generate required derivative sizes during implementation. |

The supplied logo confirms the asset, not the use of its bright blue as the general application action colour. That remains a separate design-token decision.

## Interface icons

`lucide-react` is the current interface-icon dependency and should be the default icon source.

Proposed icon rules:

- Use outline icons from one family rather than mixing visual styles.
- Default stroke follows the Lucide component default unless an approved component contract overrides it.
- Pair an icon with text for primary or unfamiliar actions.
- Every icon-only button requires an accessible name and a visible tooltip where the meaning is not otherwise present.
- Do not use a red icon for a neutral alternate state.
- File-type icons may use recognizable PDF, Word, Excel and image treatments, but must also include a text file type or filename.
- Navigation icons identify destinations; status dots and badges communicate attention separately.

## Asset acceptance checklist

Before an asset becomes Current:

1. Confirm ownership and permitted use.
2. Confirm intended light, dark, compact and print contexts.
3. Verify legibility at its smallest production size.
4. Provide accessible alternative text or mark it decorative.
5. Optimize file size and remove unnecessary metadata.
6. Record its canonical path and replacement impact here.
