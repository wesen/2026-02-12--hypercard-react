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
      Note: Stable part-name map (PARTS constant)
    - Path: packages/engine/src/theme/HyperCardTheme.tsx
      Note: Theme scope wrapper component
    - Path: packages/engine/src/theme/desktop/tokens.css
      Note: Base token definitions (CSS custom properties)
    - Path: packages/engine/src/theme/index.ts
      Note: Modular CSS pack import entrypoint
ExternalSources: []
Summary: Guide to the CSS theming system — how to import styles, override tokens, use theme layers, and target specific shell elements with data-part selectors.
LastUpdated: 2026-02-17T17:30:00.000000000-05:00
WhatFor: Provide a stable theming contract for desktop framework consumers.
WhenToUse: Use when skinning desktop shell/widgets or writing custom CSS against HyperCard parts.
---

# Theming and Parts Contract

The desktop shell uses CSS custom properties (variables) for all visual decisions — colors, fonts, spacing, shadows, border radii. This means you can retheme the entire shell by overriding a handful of variables, without touching any component code. The `data-part` attributes give you stable CSS hooks for targeting specific shell elements.

## Theme Layers: How Styling Stacks Up

Styles are applied in layers, with higher layers overriding lower ones:

```
┌─────────────────────────────────────────────┐
│  Your overrides                             │  ← Highest priority
│  (themeVars prop or custom CSS)             │
├─────────────────────────────────────────────┤
│  Theme layer (optional)                     │
│  desktop-theme-macos1, classic.css, etc.    │
├─────────────────────────────────────────────┤
│  Base tokens                                │  ← Always loaded
│  @hypercard/engine/theme                    │
└─────────────────────────────────────────────┘
```

The base layer is **always required** — it defines every CSS variable the shell and widgets use. Theme layers selectively override variables to create a different look. Your app-level overrides go on top.

## What Gets Loaded

When you write `import '@hypercard/engine/theme'`, six CSS files are loaded:

```
@hypercard/engine/theme
├── tokens.css       → Color, font, spacing, shadow, radius variables
├── shell.css        → Menu bar, icon layer, window chrome styles
├── primitives.css   → Buttons, chips, toasts, data tables, forms
├── chat.css         → Chat timeline, composer, messages, streaming cursor
├── syntax.css       → Code highlighting (for code display widgets)
└── animations.css   → Transitions, cursor blink, toast entrance/exit
```

These are **scoped** — all styles live under `[data-widget="hypercard"]`, so they won't leak into the rest of your page. The `HyperCardTheme` wrapper (or `DesktopShell` itself) provides this scope root.

## Quick Start: Import and Go

For most apps, this is all you need in `main.tsx`:

```ts
import '@hypercard/engine/theme';
```

Want the macOS-inspired look?

```ts
import '@hypercard/engine/theme';
import '@hypercard/engine/desktop-theme-macos1';
```

Other available theme layers:

```ts
import '@hypercard/engine/theme/classic.css';   // Retro HyperCard look
import '@hypercard/engine/theme/modern.css';     // Clean, contemporary
```

## Overriding Theme Variables

### Option A: Via the `HyperCardTheme` Wrapper

The `themeVars` prop lets you override any CSS variable inline:

```tsx
import { HyperCardTheme } from '@hypercard/engine';

<HyperCardTheme
  theme="theme-macos1"
  themeVars={{
    '--hc-color-desktop-bg': '#d4dde9',
    '--hc-window-shadow': '2px 2px 0 #000',
    '--hc-font-family': '"Geneva", "Helvetica Neue", sans-serif',
  }}
>
  <App />
</HyperCardTheme>
```

### Option B: Via Custom CSS

Target the scope root in your own stylesheet:

```css
[data-widget="hypercard"] {
  --hc-color-desktop-bg: #1a1a2e;
  --hc-color-fg: #e0e8f0;
  --hc-color-accent: #00bcd4;
  --hc-font-family: 'Inter', sans-serif;
}
```

### Quick Retheme: The 5 Most Impactful Variables

If you want to change the entire feel quickly, start with these:

| Variable | What It Controls | Example |
|----------|-----------------|---------|
| `--hc-color-desktop-bg` | Desktop background color | `#2d3436` |
| `--hc-color-bg` | Window/widget background | `#ffffff` |
| `--hc-color-fg` | Primary text color | `#2d3436` |
| `--hc-color-accent` | Buttons, links, highlights | `#0984e3` |
| `--hc-font-family` | Global font stack | `'Inter', sans-serif` |

Overriding just these five will transform the look of the entire shell.

## The Parts Map: Targeting Specific Elements

Every significant UI element has a `data-part` attribute — a stable CSS hook that won't change between refactors. These are defined in `packages/engine/src/parts.ts` and exported as the `PARTS` constant.

Here's how the parts map to the visual shell:

```
┌─ windowing-desktop-shell ────────────────────────────────┐
│                                                          │
│  ┌─ windowing-menu-bar ───────────────────────────────┐  │
│  │  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │ menu-button  │  │ menu-button  │  ...           │  │
│  │  └──────┬───────┘  └──────────────┘               │  │
│  │         │                                          │  │
│  │    ┌────┴────────────────┐                         │  │
│  │    │ windowing-menu-panel│                         │  │
│  │    │  ┌─ menu-item ────┐ │                         │  │
│  │    │  │ Label   Ctrl+N │ │                         │  │
│  │    │  └────────────────┘ │                         │  │
│  │    │  ┌─ menu-separator┐ │                         │  │
│  │    │  └────────────────┘ │                         │  │
│  │    └─────────────────────┘                         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ windowing-icon-layer ─────────────────────────────┐  │
│  │  ┌─ windowing-icon ─┐  ┌─ windowing-icon ─┐       │  │
│  │  │ icon-glyph  📦   │  │ icon-glyph  💬   │  ...  │  │
│  │  │ icon-label Home  │  │ icon-label Chat  │       │  │
│  │  └──────────────────┘  └──────────────────┘       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ windowing-window-layer ───────────────────────────┐  │
│  │                                                    │  │
│  │  ┌─ windowing-window ──────────────────────┐       │  │
│  │  │                                         │       │  │
│  │  │  ┌─ windowing-window-title-bar ──────┐  │       │  │
│  │  │  │ [close-button]  [window-title]    │  │       │  │
│  │  │  └───────────────────────────────────┘  │       │  │
│  │  │                                         │       │  │
│  │  │  ┌─ windowing-window-body ───────────┐  │       │  │
│  │  │  │                                   │  │       │  │
│  │  │  │  (adapter-rendered content)       │  │       │  │
│  │  │  │                                   │  │       │  │
│  │  │  └───────────────────────────────────┘  │       │  │
│  │  │                                         │       │  │
│  │  │                      [resize-handle] ◢  │       │  │
│  │  └─────────────────────────────────────────┘       │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Widget and Primitive Parts

Inside window bodies, widgets use their own parts:

| Part Group | Part Names |
|-----------|------------|
| **Buttons** | `btn`, `button-group` |
| **Tags** | `chip` |
| **Notifications** | `toast` |
| **Tables** | `data-table`, `table-header`, `table-row`, `table-cell`, `table-empty`, `table-footer` |
| **Cards** | `card`, `card-title`, `card-body`, `card-toolbar` |
| **Menus** | `menu-grid` |
| **Fields** | `field-grid`, `field-label`, `field-value`, `field-input` |
| **Forms** | `form-view`, `detail-view`, `report-view`, `report-row` |
| **Filter** | `filter-bar` |
| **Chat** | `chat-view`, `chat-timeline`, `chat-message`, `chat-composer`, `chat-input`, `chat-suggestions` |
| **Status** | `status-bar` |
| **Navigation** | `nav-bar`, `tab-bar`, `tab` |

## CSS Selector Cookbook

Here are copy-paste selectors for common styling tasks:

### Style all window title bars

```css
[data-widget='hypercard'] [data-part='windowing-window-title-bar'] {
  background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
  letter-spacing: 0.2px;
}
```

### Style only the focused window

```css
[data-widget='hypercard'] [data-part='windowing-window'][data-focused='true'] {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

[data-widget='hypercard'] [data-part='windowing-window'][data-focused='true']
  [data-part='windowing-window-title-bar'] {
  background: linear-gradient(to bottom, #4a90d9, #357abd);
  color: white;
}
```

### Override button accent color

```css
[data-widget='hypercard'] [data-part='btn'] {
  --hc-color-accent: #e74c3c;
}
```

### Style the desktop background

```css
[data-widget='hypercard'] [data-part='windowing-desktop-shell'] {
  background: url('/wallpaper.jpg') center/cover;
}
```

### Style chat messages differently by role

```css
[data-widget='hypercard'] [data-part='chat-message'][data-role='user'] {
  background: var(--hc-color-accent);
  color: white;
}

[data-widget='hypercard'] [data-part='chat-message'][data-role='assistant'] {
  background: var(--hc-color-bg);
}
```

### Make a specific menu item bold

```css
[data-widget='hypercard'] [data-part='windowing-menu-item'][data-command='chat.new'] {
  font-weight: 600;
}
```

## Using `HyperCardTheme` for Component-Level Theming

If you need different themes in different parts of your app (e.g., a light theme for the main shell and a dark theme for a preview panel), wrap the inner section with `HyperCardTheme`:

```tsx
import { HyperCardTheme } from '@hypercard/engine';

function ThemedPreview() {
  return (
    <HyperCardTheme theme="theme-modern">
      <MyWidget />
    </HyperCardTheme>
  );
}
```

The `theme` prop adds a CSS class (`theme-modern`) that theme layers can target. The `unstyled` prop removes the scope root wrapper if you want to provide your own.

## Scope Root Contract

All default styles are scoped under:

```html
<div data-widget="hypercard">...</div>
```

This means:
- HyperCard styles won't leak into your page
- Your page styles won't accidentally affect HyperCard components
- CSS selectors must include `[data-widget='hypercard']` to target shell elements

`DesktopShell` and `HyperCardTheme` both provide this wrapper automatically.

## Related Docs

| Topic | Link |
|-------|------|
| Getting started with the shell | [Quickstart](./02-desktop-framework-quickstart.md) |
| Overall architecture | [Architecture Overview](./07-desktop-framework-architecture-overview.md) |
| Copy-paste recipes | [Common Recipes](./08-common-recipes.md) |
