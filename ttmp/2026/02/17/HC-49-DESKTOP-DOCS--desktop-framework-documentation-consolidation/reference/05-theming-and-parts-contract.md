---
Title: Theming and Parts Contract
Ticket: HC-49-DESKTOP-DOCS
Status: active
Topics:
    - frontend
    - architecture
    - windowing
    - design-system
    - cleanup
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/parts.ts
      Note: Stable part-name map
    - Path: packages/engine/src/theme/HyperCardTheme.tsx
      Note: Theme scope wrapper contract
    - Path: packages/engine/src/theme/desktop/tokens.css
      Note: Base token definitions
    - Path: packages/engine/src/theme/index.ts
      Note: Modular CSS pack import contract
ExternalSources: []
Summary: Contract for CSS pack imports, theme scoping root, and stable part names.
LastUpdated: 2026-02-17T17:14:21.358583528-05:00
WhatFor: Provide a stable theming contract for desktop framework consumers.
WhenToUse: Use when skinning desktop shell/widgets or writing custom CSS against HyperCard parts.
---


# Theming and Parts Contract

## Goal
Describe the stable styling contract: what to import, how scope works, and which `data-part` names are intended for consumer CSS.

## Context
The legacy monolithic stylesheet was removed. Desktop and widget styles are now loaded via modular CSS packs through `@hypercard/engine/theme`.

## Quick Reference
## Required scope root
All default styles are scoped under:

```html
<div data-widget="hypercard">...</div>
```

`HyperCardTheme` provides this wrapper automatically unless `unstyled` is set.

## Import contract
Base packs:

```ts
import '@hypercard/engine/theme';
```

Optional theme layers:

```ts
import '@hypercard/engine/theme/classic.css';
import '@hypercard/engine/theme/modern.css';
import '@hypercard/engine/desktop-theme-macos1';
```

`@hypercard/engine/theme` currently pulls:

- `desktop/tokens.css`
- `desktop/shell.css`
- `desktop/primitives.css`
- `desktop/chat.css`
- `desktop/syntax.css`
- `desktop/animations.css`

## Theme variable override contract
Use `HyperCardTheme` `themeVars` for inline token overrides:

```tsx
<HyperCardTheme
  theme="theme-macos1"
  themeVars={{
    '--hc-color-desktop-bg': '#d4dde9',
    '--hc-window-shadow': '2px 2px 0 #000',
  }}
>
  <App />
</HyperCardTheme>
```

## Parts contract (`PARTS`)
`PARTS` is the stable source for part names used in `data-part="..."` attributes.

Representative groups:

- Shell/windowing:
  - `windowing-desktop-shell`
  - `windowing-menu-bar`
  - `windowing-icon-layer`
  - `windowing-window`
  - `windowing-window-title-bar`
  - `windowing-window-body`
  - `windowing-resize-handle`
- Widgets/primitives:
  - `btn`, `chip`, `toast`
  - `data-table`, `table-row`, `table-cell`
  - `form-view`, `detail-view`, `report-view`
- Chat:
  - `chat-view`, `chat-timeline`, `chat-message`, `chat-composer`

Use CSS selectors like:

```css
[data-widget='hypercard'] [data-part='windowing-window-title-bar'] {
  letter-spacing: 0.2px;
}
```

## Usage Examples
## App-level theme import

```ts
// src/main.tsx
import '@hypercard/engine/theme';
import '@hypercard/engine/desktop-theme-macos1';
```

## Component-level wrapper

```tsx
import { HyperCardTheme } from '@hypercard/engine';

export function ThemedPreview() {
  return (
    <HyperCardTheme theme="theme-modern">
      <MyWidget />
    </HyperCardTheme>
  );
}
```

## Related
- `packages/engine/src/theme/index.ts`
- `packages/engine/src/theme/HyperCardTheme.tsx`
- `packages/engine/src/theme/desktop/tokens.css`
- `packages/engine/src/theme/desktop/theme/macos1.css`
- `packages/engine/src/parts.ts`
