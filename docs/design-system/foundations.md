# Foundations and design tokens

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / [Design system](README.md) / Foundations

This document records semantic visual foundations. It deliberately distinguishes current production values from proposed consolidation targets.

![Current and candidate FVSD Nexus colour foundations](assets/previews/foundation-swatches.svg)

## Colour

### Current brand and governed data colours

| Role | Value | Status | Notes |
|---|---:|---|---|
| Structural navy | `#071940` | Current | Primary FVSD Nexus structural colour. |
| Structural blue | `#1F4E79` | Current | Current active navigation and primary application action colour. |
| Structural tertiary | `#666666` | Current | Legacy secondary text token; semantic text tokens will replace direct use. |
| Data 1–7 | `#FF0000`, `#ED7D31`, `#FFC000`, `#92D050`, `#00B050`, `#5B7BD6`, `#071940` | Current | Governed visualization sequence; not a general UI palette. |
| Divergent minimum/maximum | `#9DB0E6`, `#F4B183` | Current | Analytics-specific scale. |
| Concept action blue | `#2D6BE7` | Open | Used in exploratory artboards; requires branding and contrast review before adoption. |

### Proposed semantic roles

Implementation should use role names rather than raw colour literals:

- `brand-strong`, `brand`, `action`, `action-hover`, `focus`
- `text-strong`, `text`, `text-muted`, `text-on-dark`
- `surface`, `surface-alt`, `surface-sunken`, `surface-overlay`
- `border`, `border-strong`
- `info`, `success`, `warning`, `danger`, each with foreground, background and border roles
- `data-*`, `sentiment-*`, and `descriptive-term-*` as governed palettes separate from application chrome

**Rule:** descriptive-term and chart colours must not be repurposed for buttons, notices, or navigation.

## Typography

| Foundation | Proposed target | Status |
|---|---|---|
| Font family | `"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif` | Proposed |
| Weights | 400, 600, 700 | Proposed |
| Body text | 14 px | Proposed |
| Secondary text | 13 px | Proposed |
| Compact metadata and labels | 12 px minimum | Proposed |
| Form controls | 14 px desktop; 16 px on touch layouts | Proposed |
| Headings | 16, 20, 24 and 32 px semantic levels | Proposed |

Seven-to-ten-pixel text is not an accepted target for required content. Uppercase labels should be used sparingly and remain readable without excessive letter spacing.

## Spacing

**Proposed scale:** `4, 8, 12, 16, 20, 24, 32, 48` px.

Components should use this scale for gaps, padding, and section rhythm. Optical exceptions must be documented in the component contract rather than introduced as arbitrary one-off values.

## Shape

| Token | Value | Intended use |
|---|---:|---|
| Radius small | 6 px | Compact controls and small inline actions. |
| Radius control | 8 px | Buttons, fields, tabs and navigation items. |
| Radius panel | 12 px | Cards, panels, drawers and dialogs. |
| Radius pill | 999 px | Status chips only. |

These are Proposed consolidation targets. Circular avatars and indicators may use `50%`.

## Elevation

The target system has four semantic levels using a single navy-derived shadow base:

| Level | Use |
|---|---|
| None | Most cards; border provides structure. |
| Small | Raised interactive card or active control. |
| Medium | Menus and pinned panels. |
| Large | Drawers, dialogs and modal overlays. |

Exact shadow values remain **Open** until browser review. Glossy or decorative inset effects should not become general-purpose elevation.

## Controls and focus

- Desktop control target: 36–40 px depending on density.
- Touch control target: at least 44 px.
- Phone primary action: at least 48 px.
- One visible `:focus-visible` treatment must cover every interactive element.
- Disabled controls must be visually distinct and retain readable labels.
- Status may never be communicated by colour alone.

The exact focus colour remains linked to the open action/accent-colour decision.

## Responsive foundations

The current application has page-specific breakpoints. The proposed starting set is:

| Width | Intended layout |
|---|---|
| 1280 px and above | Full desktop workspace. |
| 1024–1279 px | Compact desktop/iPad landscape. |
| 768–1023 px | iPad portrait and reduced navigation. |
| Below 768 px | Phone layout where supported. |

These are coordination points, not a ban on component-level container queries. Analytics charts and wide goal matrices may need component-specific adaptation without introducing a second application-wide breakpoint system.

## Screen and document relationship

Screen and compiled-document renderers share semantic content rules, not necessarily identical geometry. Shared rules include:

- section title and description;
- labels, date formats and missing-value conventions;
- value and descriptive-term formatting;
- table and record-card hierarchy;
- banner and status meaning;
- module order and inclusion state.

The document renderer owns page size, page breaks, running headers and footers, table continuation, contents pages, appendices, and signature placement. Interactive controls are never rendered into the compiled document.
