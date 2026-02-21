---
title: "macOS Widget Mapping and Integration Plan"
doc_type: analysis
status: active
intent: long-term
topics:
  - frontend
  - widgets
  - macos
  - react
ticket: HC-52-ADD-MACOS-WIDGETS
created: 2026-02-18
updated: 2026-02-18
related_files:
  - "ttmp/2026/02/18/HC-52-ADD-MACOS-WIDGETS--add-macos-widgets-to-hypercard-react-framework/sources/local/macos1-widgets.jsx:Source file with 20 macOS System 1 widgets"
  - "packages/engine/src/components/widgets/index.ts:Existing widget barrel export"
  - "packages/engine/src/parts.ts:Part name registry for data-part attributes"
  - "packages/engine/src/theme/desktop/tokens.css:CSS custom property token system"
  - "packages/engine/src/theme/desktop/primitives.css:Widget CSS rules"
  - "packages/engine/src/theme/desktop/shell.css:Shell/windowing CSS rules"
  - "packages/engine/src/theme/desktop/theme/macos1.css:macOS1 theme token overrides"
---

# macOS Widget Mapping and Integration Plan

## 1. Executive Summary

The imported `macos1-widgets.jsx` file contains **20 components** that render a complete Mac System 1 desktop UI. After cross-referencing with our existing HyperCard engine, **12 are genuinely new widgets** that would broaden our component library, **5 overlap with existing components** (and should not be duplicated), and **3 are utility/pattern generators** that should become shared CSS assets.

This document maps every imported component to a disposition (import, skip, or adapt), describes the CSS/architecture conversion strategy, and lays out Storybook story plans.

---

## 2. Disposition Matrix

| # | Source Component    | Disposition     | Reason                                                                 | Target Name               |
|---|---------------------|-----------------|------------------------------------------------------------------------|---------------------------|
| 1 | `MacWindow`         | **SKIP**        | Our `WindowSurface` + `WindowTitleBar` + `WindowResizeHandle` ensemble already covers this completely | — |
| 2 | `ScrollBar`         | **IMPORT NEW**  | No equivalent exists; our scrollbars are browser-native `::-webkit-scrollbar`. A decorative classic scrollbar widget is new. | `ClassicScrollBar` |
| 3 | `PushButton`        | **SKIP/EXTEND** | Our `Btn` covers this. The "default button" outer ring and pressed-inverts-colors behavior are macOS1-specific _states_ we can add via CSS tokens + `data-state`. | Extend `Btn` with `data-state="default"` |
| 4 | `Checkbox`          | **IMPORT NEW**  | No checkbox widget exists in the framework. | `Checkbox` |
| 5 | `RadioButton`       | **IMPORT NEW**  | No radio button widget exists in the framework. | `RadioButton` |
| 6 | `TextField`         | **SKIP/EXTEND** | `FieldRow` + `field-input` CSS already handles text fields. The macOS1 file's `TextField` is just a styled `<input>`. We can add tokens for the single-line variant. | Tokens only |
| 7 | `ListBox`           | **IMPORT NEW**  | Different from `ListView`/`DataTable` — a compact single-column selection list (classic Mac list box). | `ListBox` |
| 8 | `DropdownSelector`  | **IMPORT NEW**  | No dropdown/pop-up menu widget exists. `FilterBar` has a `<select>` but not a custom dropdown. | `DropdownMenu` |
| 9 | `ContextMenu`       | **IMPORT NEW**  | No right-click context menu exists in the widget library. | `ContextMenu` |
| 10| `AlertDialog`       | **IMPORT NEW**  | No alert/dialog widget exists. The windowing stack has `isDialog` on windows but no self-contained alert component. | `AlertDialog` |
| 11| `MenuBar`           | **SKIP**        | Our `DesktopMenuBar` already handles this with richer accessibility (roles, keyboard nav). | — |
| 12| `ToolPalette`       | **IMPORT NEW**  | No tool palette exists. Unique grid-of-icons selection widget. | `ToolPalette` |
| 13| `ProgressBar`       | **IMPORT NEW**  | No progress bar exists anywhere in the framework. | `ProgressBar` |
| 14| `TabControl`        | **SKIP/EXTEND** | `tab-bar` / `tab` CSS + `data-part` already exist in primitives.css. But there's no _component_ that wraps them. Import as a convenience component using existing CSS. | `TabControl` (reuse existing CSS) |
| 15| `DesktopIcon`       | **SKIP**        | Our `DesktopIconLayer` + `windowing-icon` already covers this. | — |
| 16| `DisclosureTriangle`| **IMPORT NEW**  | No tree/disclosure widget exists. | `DisclosureTriangle` |
| 17| `HaloTarget`        | **IMPORT NEW**  | No morphic halo/inspection widget exists. Unique Smalltalk-inspired feature. | `HaloTarget` |
| 18| `stripePattern`     | **ADAPT → CSS** | Convert from runtime canvas to a CSS custom property or embedded SVG data URI. | `--hc-pattern-stripe` token |
| 19| `desktopPattern`    | **ADAPT → CSS** | Already exists as an SVG data URI in `shell.css` (`windowing-icon-layer` background). Consolidate. | `--hc-pattern-desktop` token |
| 20| `titleBarPattern`   | **ADAPT → CSS** | The framework already uses `repeating-linear-gradient` for title bar stripes. Skip. | — |

### Summary Count

| Disposition       | Count | Components |
|-------------------|-------|------------|
| **IMPORT NEW**    | 10    | ClassicScrollBar, Checkbox, RadioButton, ListBox, DropdownMenu, ContextMenu, AlertDialog, ToolPalette, ProgressBar, DisclosureTriangle |
| **IMPORT NEW (unique)** | 1 | HaloTarget |
| **SKIP (overlap)**| 4     | MacWindow, MenuBar, DesktopIcon, titleBarPattern |
| **EXTEND existing**| 2    | Btn (default ring state), TabControl (new component wrapping existing CSS) |
| **CSS asset only** | 2    | stripePattern → token, desktopPattern → consolidate |

---

## 3. Architecture Conversion Strategy

### 3.1 The Pattern: Inline Styles → data-part + CSS Tokens

Every imported component uses React inline `style={{...}}` objects. Our framework uses:

```
Component → data-part="widget-name" → CSS rule [data-part="widget-name"] { ... }
                                    → CSS tokens var(--hc-xxx) for all visual values
```

**Conversion steps for each widget:**

1. **Strip all inline styles** from the JSX
2. **Add a `data-part` attribute** (registered in `parts.ts`)
3. **Add `data-state` attributes** for interactive states (pressed, selected, open, disabled)
4. **Add `data-variant` attributes** for visual variants where applicable
5. **Write CSS rules** in `primitives.css` using token variables
6. **Add new tokens** to `tokens.css` where the widget introduces new visual values
7. **Export TypeScript interface** alongside the component

### 3.2 New CSS Tokens Required

```css
/* ── Checkbox / RadioButton ── */
--hc-check-size: 14px;
--hc-check-border: 2px solid var(--hc-color-border);
--hc-check-bg: var(--hc-color-bg);
--hc-check-mark-color: var(--hc-color-fg);

/* ── ListBox ── */
--hc-listbox-width: 160px;
--hc-listbox-height: 90px;
--hc-listbox-selected-bg: var(--hc-color-fg);
--hc-listbox-selected-fg: var(--hc-color-bg);

/* ── DropdownMenu ── */
--hc-dropdown-shadow: 1px 1px 0 var(--hc-color-border);
--hc-dropdown-panel-shadow: 2px 2px 0 var(--hc-color-border);

/* ── ContextMenu ── */
--hc-context-menu-shadow: 2px 2px 0 var(--hc-color-border);
--hc-context-menu-min-width: 170px;

/* ── AlertDialog ── */
--hc-alert-shadow: 3px 3px 0 var(--hc-color-border);
--hc-alert-border: 3px solid var(--hc-color-border);
--hc-alert-max-width: 300px;

/* ── ProgressBar ── */
--hc-progress-height: 16px;
--hc-progress-border: 2px solid var(--hc-color-border);
--hc-progress-fill-pattern: var(--hc-pattern-stripe);

/* ── ToolPalette ── */
--hc-tool-size: 27px;
--hc-tool-selected-bg: var(--hc-color-fg);
--hc-tool-selected-filter: invert(1);

/* ── DisclosureTriangle ── */
--hc-disclosure-arrow-size: 10px;

/* ── HaloTarget ── */
--hc-halo-handle-size: 20px;
--hc-halo-border: 2px dashed #555;
--hc-halo-label-bg: #ff0;

/* ── Pattern tokens (shared) ── */
--hc-pattern-stripe: url("data:image/svg+xml,...");  /* 2×2 checkerboard */
```

### 3.3 New parts.ts Entries

```typescript
// Add to PARTS object:
checkbox: 'checkbox',
checkboxMark: 'checkbox-mark',
radioButton: 'radio-button',
radioButtonDot: 'radio-button-dot',
listBox: 'list-box',
listBoxItem: 'list-box-item',
dropdownMenu: 'dropdown-menu',
dropdownMenuTrigger: 'dropdown-menu-trigger',
dropdownMenuPanel: 'dropdown-menu-panel',
dropdownMenuItem: 'dropdown-menu-item',
contextMenu: 'context-menu',
contextMenuItem: 'context-menu-item',
contextMenuSeparator: 'context-menu-separator',
alertDialog: 'alert-dialog',
alertDialogIcon: 'alert-dialog-icon',
alertDialogMessage: 'alert-dialog-message',
toolPalette: 'tool-palette',
toolPaletteItem: 'tool-palette-item',
progressBar: 'progress-bar',
progressBarFill: 'progress-bar-fill',
tabControl: 'tab-control',
disclosureTriangle: 'disclosure-triangle',
disclosureTriangleArrow: 'disclosure-triangle-arrow',
disclosureTriangleContent: 'disclosure-triangle-content',
classicScrollBar: 'classic-scroll-bar',
classicScrollBarThumb: 'classic-scroll-bar-thumb',
classicScrollBarArrow: 'classic-scroll-bar-arrow',
haloTarget: 'halo-target',
haloHandle: 'halo-handle',
haloLabel: 'halo-label',
haloBorder: 'halo-border',
```

---

## 4. Per-Widget Integration Details

### 4.1 Checkbox

**Source:** 15 lines, uses inline `<div>` with ✕ character for check mark.

**Conversion:**
- Component: `Checkbox.tsx` with `CheckboxProps { label: string; checked: boolean; onChange: () => void; disabled?: boolean }`
- Outer div: `data-part="checkbox"`, `data-state="checked"` / `data-state="disabled"`
- Mark div: `data-part="checkbox-mark"`
- All sizing/colors from tokens; ✕ character stays as text content
- No inline styles

**CSS in primitives.css:**
```css
[data-part="checkbox"] {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer; font-family: var(--hc-font-family); font-size: 12px;
}
[data-part="checkbox"][data-state="disabled"] { opacity: 0.5; cursor: default; }
[data-part="checkbox-mark"] {
  width: var(--hc-check-size); height: var(--hc-check-size);
  border: var(--hc-check-border); background: var(--hc-check-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: bold; line-height: 1;
  color: var(--hc-check-mark-color);
}
```

### 4.2 RadioButton

**Source:** Same structure as Checkbox but with `border-radius: 50%` and filled dot.

**Conversion:**
- Component: `RadioButton.tsx` with `RadioButtonProps { label: string; selected: boolean; onChange: () => void; disabled?: boolean }`
- Outer div: `data-part="radio-button"`, `data-state="selected"` / `data-state="disabled"`
- Dot div: `data-part="radio-button-dot"`
- CSS mirrors Checkbox but with `border-radius: 50%` and inner dot sizing

### 4.3 ListBox

**Source:** Scrollable div with click-to-select items, selected item inverts colors.

**Conversion:**
- Component: `ListBox.tsx` with `ListBoxProps { items: string[]; selected: number; onSelect: (index: number) => void; height?: number; width?: number }`
- Container: `data-part="list-box"`
- Items: `data-part="list-box-item"`, `data-state="selected"`
- Uses `--hc-listbox-*` tokens for selected colors

### 4.4 DropdownMenu

**Source:** Custom dropdown with click-outside-to-close, checkmark on selected, hover highlighting.

**Conversion:**
- Component: `DropdownMenu.tsx` with `DropdownMenuProps { options: string[]; selected: number; onSelect: (index: number) => void; width?: number }`
- Trigger: `data-part="dropdown-menu-trigger"` with `data-state="open"`
- Panel: `data-part="dropdown-menu-panel"` (absolutely positioned)
- Items: `data-part="dropdown-menu-item"`, `data-state="selected"`
- **Behavior retained:** `useRef` + `useEffect` click-outside pattern (identical to source)
- Hover → `[data-part="dropdown-menu-item"]:hover` CSS (replaces `onMouseEnter`/`onMouseLeave` inline handlers)

### 4.5 ContextMenu

**Source:** Fixed-position popup with items and dashed separators, click-outside-to-close.

**Conversion:**
- Component: `ContextMenu.tsx` with `ContextMenuProps { x: number; y: number; items: Array<string | { separator: true }>; onSelect: (item: string) => void; onClose: () => void }`
- Container: `data-part="context-menu"` (position: fixed)
- Items: `data-part="context-menu-item"` with hover CSS
- Separators: `data-part="context-menu-separator"` (dashed border)
- Note: Reuses the same hover pattern as our existing `windowing-menu-item`

### 4.6 AlertDialog

**Source:** Centered overlay with icon + message + OK button.

**Conversion:**
- Component: `AlertDialog.tsx` with `AlertDialogProps { type: 'stop' | 'caution' | 'note'; message: string; onOK: () => void; actions?: Array<{ label: string; onClick: () => void }> }`
- Overlay: `data-part="alert-dialog"` with `data-variant="stop"` / `"caution"` / `"note"`
- Icon area: `data-part="alert-dialog-icon"`
- Message: `data-part="alert-dialog-message"`
- Buttons: Reuses existing `Btn` component
- **Enhancement over source:** Allow custom action buttons, not just OK

### 4.7 ToolPalette

**Source:** 2-column grid of emoji tool icons with selected state (inverted).

**Conversion:**
- Component: `ToolPalette.tsx` with `ToolPaletteProps { tools: Array<{ icon: string; label: string }>; selected: number; onSelect: (index: number) => void; columns?: number }`
- Container: `data-part="tool-palette"` (CSS grid)
- Items: `data-part="tool-palette-item"`, `data-state="selected"`
- **Enhancement:** Configurable column count (default 2)

### 4.8 ProgressBar

**Source:** Border box with striped fill that animates width via inline transition.

**Conversion:**
- Component: `ProgressBar.tsx` with `ProgressBarProps { value: number; width?: number | string; label?: string }`
- Container: `data-part="progress-bar"`
- Fill: `data-part="progress-bar-fill"` with `width` set via `style={{ width: \`${value}%\` }}`
  - This is the **one case** where an inline style is justified (dynamic percentage)
- Background pattern: `--hc-pattern-stripe` CSS token (SVG data URI, not runtime canvas)
- CSS transition on width for smooth animation

### 4.9 TabControl

**Source:** Tab row + content panel, active tab has white background and no bottom border.

**Conversion:**
- Component: `TabControl.tsx` with `TabControlProps { tabs: string[]; activeTab: number; onTabChange: (index: number) => void; children: ReactNode }`
- **Reuses existing CSS:** `data-part="tab-bar"` and `data-part="tab"` with `data-state="active"` already exist
- New: `data-part="tab-control"` wrapper for the combined tab-bar + content-area
- Wraps existing `content-area` CSS for the panel below

### 4.10 DisclosureTriangle

**Source:** Clickable arrow (▶ rotates 90°) with nested children.

**Conversion:**
- Component: `DisclosureTriangle.tsx` with `DisclosureTriangleProps { label: string; defaultOpen?: boolean; children: ReactNode }`
- Container: `data-part="disclosure-triangle"`, `data-state="open"`
- Arrow: `data-part="disclosure-triangle-arrow"` (CSS transform: rotate on `[data-state="open"]`)
- Content: `data-part="disclosure-triangle-content"` (hidden by default, shown when open)
- Manages own open/closed state via `useState`

### 4.11 ClassicScrollBar

**Source:** Vertical/horizontal scrollbar with arrow buttons, striped track, draggable thumb.

**Conversion:**
- Component: `ClassicScrollBar.tsx` with `ClassicScrollBarProps { vertical?: boolean; value: number; onChange?: (value: number) => void }`
- Track: `data-part="classic-scroll-bar"`, `data-variant="vertical"` / `"horizontal"`
- Arrows: `data-part="classic-scroll-bar-arrow"` (up/down or left/right)
- Thumb: `data-part="classic-scroll-bar-thumb"`
- Striped background from `--hc-pattern-stripe`
- **Note:** This is decorative/presentational. Real scrolling in the framework still uses native scrollbars styled via `::-webkit-scrollbar`. This widget is for visual authenticity in tool palettes, list boxes, etc.

### 4.12 HaloTarget

**Source:** Hover-activated Smalltalk-style morphic halos with 8 colored handles around a child element.

**Conversion:**
- Component: `HaloTarget.tsx` with `HaloTargetProps { label: string; children: ReactNode; handles?: HaloHandle[]; onHandle?: (handleId: string) => void }`
- Where `HaloHandle = { id: string; position: HaloPosition; color: string; icon: string; label: string }`
- Container: `data-part="halo-target"`
- Dashed border: `data-part="halo-border"` (shown on hover)
- Handles: `data-part="halo-handle"` with hover scale via CSS transition
- Label badge: `data-part="halo-label"`
- **Enhancement:** Configurable handles (not hardcoded 8), plus `onHandle` callback so consumers can react to handle clicks

---

## 5. Btn Extension (PushButton → Btn)

Rather than importing PushButton as a separate widget, extend the existing `Btn`:

**New `data-state="default"`** — draws the outer ring that macOS used for the "default" button:
```css
[data-part="btn"][data-state="default"] {
  outline: 3px solid var(--hc-color-border);
  outline-offset: 2px;
  border-radius: 10px;
}
```

**New `data-state="pressed"`** — inverts colors (currently handled by `:active` but could be explicit):
```css
[data-part="btn"]:active,
[data-part="btn"][data-state="pressed"] {
  background: var(--hc-btn-active-bg);
  color: var(--hc-btn-active-fg);
}
```

**BtnProps update:** Add `isDefault?: boolean` to `BtnProps` interface.

---

## 6. CSS Pattern Tokens (replacing runtime canvas generation)

The source file generates three dither patterns at runtime using `<canvas>` + `toDataURL()`. This is brittle and doesn't work in SSR. Replace with SVG data URIs as CSS custom properties:

```css
/* Stripe pattern (2×2 checkerboard, used by ProgressBar, ClassicScrollBar) */
--hc-pattern-stripe: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='2' fill='%23fff'/%3E%3Crect width='1' height='1' fill='%23000'/%3E%3Crect x='1' y='1' width='1' height='1' fill='%23000'/%3E%3C/svg%3E");

/* Desktop pattern (4×4 sparse dot, already in shell.css — consolidate) */
--hc-pattern-desktop: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23fff'/%3E%3Crect width='1' height='1' fill='%23000'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23000'/%3E%3C/svg%3E");
```

Both go into `tokens.css`. The existing `shell.css` icon-layer background should be updated to reference `var(--hc-pattern-desktop)`.

---

## 7. File Layout Plan

```
packages/engine/src/
├── parts.ts                                    # ADD ~28 new entries
├── theme/
│   ├── desktop/
│   │   ├── tokens.css                          # ADD new tokens + pattern tokens
│   │   ├── primitives.css                      # ADD CSS for all 12 new widgets
│   │   └── theme/macos1.css                    # ADD macOS1-specific overrides if needed
│   └── index.ts                                # No change (CSS auto-imported)
├── components/
│   ├── widgets/
│   │   ├── index.ts                            # ADD exports for all new widgets
│   │   ├── Btn.tsx                             # ADD isDefault prop
│   │   ├── Btn.stories.tsx                     # ADD DefaultRing story
│   │   ├── Checkbox.tsx                        # NEW
│   │   ├── Checkbox.stories.tsx                # NEW
│   │   ├── RadioButton.tsx                     # NEW
│   │   ├── RadioButton.stories.tsx             # NEW
│   │   ├── ListBox.tsx                         # NEW
│   │   ├── ListBox.stories.tsx                 # NEW
│   │   ├── DropdownMenu.tsx                    # NEW
│   │   ├── DropdownMenu.stories.tsx            # NEW
│   │   ├── ContextMenu.tsx                     # NEW
│   │   ├── ContextMenu.stories.tsx             # NEW
│   │   ├── AlertDialog.tsx                     # NEW
│   │   ├── AlertDialog.stories.tsx             # NEW
│   │   ├── ToolPalette.tsx                     # NEW
│   │   ├── ToolPalette.stories.tsx             # NEW
│   │   ├── ProgressBar.tsx                     # NEW
│   │   ├── ProgressBar.stories.tsx             # NEW
│   │   ├── TabControl.tsx                      # NEW (wraps existing tab CSS)
│   │   ├── TabControl.stories.tsx              # NEW
│   │   ├── DisclosureTriangle.tsx              # NEW
│   │   ├── DisclosureTriangle.stories.tsx      # NEW
│   │   ├── ClassicScrollBar.tsx                # NEW
│   │   ├── ClassicScrollBar.stories.tsx        # NEW
│   │   ├── HaloTarget.tsx                      # NEW
│   │   └── HaloTarget.stories.tsx              # NEW
```

---

## 8. Storybook Story Plan

All stories go under `title: 'Engine/Widgets/<Name>'` to match existing conventions.

### 8.1 Individual Widget Stories

| Widget              | Stories                                                                      |
|---------------------|-----------------------------------------------------------------------------|
| **Checkbox**        | `Unchecked`, `Checked`, `Disabled`, `Group` (3 checkboxes together)          |
| **RadioButton**     | `Unselected`, `Selected`, `Disabled`, `Group` (3 radios, one selected)       |
| **ListBox**         | `Default`, `WithSelection`, `Empty`, `Tall` (more items than visible)        |
| **DropdownMenu**    | `Closed`, `Open`, `ManyOptions`                                              |
| **ContextMenu**     | `Default` (positioned), `WithSeparators`, `ManyItems`                        |
| **AlertDialog**     | `Note`, `Caution`, `Stop`, `CustomActions`                                   |
| **ToolPalette**     | `Default` (2 cols), `ThreeColumns`, `SingleSelection`                        |
| **ProgressBar**     | `Empty`, `Half`, `Full`, `Animated` (timer increments value)                 |
| **TabControl**      | `TwoTabs`, `ThreeTabs`, `ManyTabs`                                           |
| **DisclosureTriangle** | `Closed`, `Open`, `Nested` (tree with 2 levels)                          |
| **ClassicScrollBar** | `Vertical`, `Horizontal`, `InContainer`                                     |
| **HaloTarget**      | `Default` (standard 8 handles), `CustomHandles`, `AroundButton`             |
| **Btn (extended)**  | `DefaultRing` (new), `Pressed` (new)                                         |

### 8.2 Composite Showcase Story

One combined story at `title: 'Engine/Widgets/macOS1Showcase'`:
- Shows all new widgets arranged in a grid layout similar to the source file's `MacOS1Demo`
- Uses our windowing shell (`DesktopShell`) instead of the imported `MacWindow`
- Demonstrates that all widgets respect the token system

Layout sketch:
```
┌─────────────────────────────────────────────────┐
│ Menu Bar (existing DesktopMenuBar)              │
├──────────────────┬──────────────────────────────┤
│ ┌──────────────┐ │ ┌────────────────────┐       │
│ │ Form Controls│ │ │ Tool Palette       │       │
│ │ ☑ Checkbox   │ │ │ ✏🖌🪣🔲✂📏     │       │
│ │ ○ Radio      │ │ │ ⬜⭕🔤🧽💨🔍     │       │
│ │ ▾ Dropdown   │ │ └────────────────────┘       │
│ │ [Text Field] │ │ ┌────────────────────┐       │
│ └──────────────┘ │ │ Halo Demo          │       │
│ ┌──────────────┐ │ │ (hover widgets)    │       │
│ │ ListBox      │ │ └────────────────────┘       │
│ │ ▶ Disclosure │ │                              │
│ └──────────────┘ │                              │
├──────────────────┴──────────────────────────────┤
│ ┌─ Progress & Tabs ───────────────────────────┐ │
│ │ ▓▓▓▓▓▓░░░░░░ Copying files... 47%          │ │
│ │ [General] [Sound] [Mouse]                   │ │
│ │  Tab content area                           │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 9. Risk Notes and Open Questions

### 9.1 ContextMenu positioning
The source uses `position: fixed` with raw `clientX`/`clientY`. In our windowing shell, the container may be `position: relative` with `overflow: hidden`, which clips fixed-position children. We may need to portal the context menu to the root of the HyperCard container.

### 9.2 DropdownMenu z-index
The dropdown panel sits above other content. Need to ensure `z-index` tokens don't conflict with window z-indices in the windowing shell.

### 9.3 HaloTarget is experimental
The Smalltalk halos are visually striking but may not be needed by most apps. Consider putting them in a separate export path (e.g., `@hypercard/engine/experimental`) or gating behind a feature flag.

### 9.4 Pattern rendering
The source uses `image-rendering: pixelated` on the root. Our SVG data URI patterns should include `shape-rendering="crispEdges"` to match the pixel-perfect dithered look.

### 9.5 Accessibility
The source widgets have zero ARIA attributes. All imported widgets should add:
- Checkbox: `role="checkbox"`, `aria-checked`
- RadioButton: `role="radio"`, `aria-checked`
- ListBox: `role="listbox"`, items get `role="option"`, `aria-selected`
- DropdownMenu: `role="combobox"` / `role="listbox"` pattern
- ContextMenu: `role="menu"`, items get `role="menuitem"`
- AlertDialog: `role="alertdialog"`, `aria-modal="true"`, `aria-describedby`
- ProgressBar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- DisclosureTriangle: `aria-expanded`
- TabControl: `role="tablist"` / `role="tab"` / `role="tabpanel"` (already partially in existing CSS)

---

## 10. Implementation Order (Recommended)

Phase 1 — **Foundation** (unblocks everything else):
1. Add pattern tokens (`--hc-pattern-stripe`, `--hc-pattern-desktop`) to `tokens.css`
2. Add all new `parts.ts` entries
3. Add all new CSS token variables to `tokens.css`

Phase 2 — **Simple form controls** (most reusable, smallest scope):
4. Checkbox + stories
5. RadioButton + stories
6. ProgressBar + stories
7. DisclosureTriangle + stories
8. Btn extension (isDefault) + story

Phase 3 — **Interactive widgets** (need click-outside, portals):
9. ListBox + stories
10. DropdownMenu + stories
11. ContextMenu + stories
12. AlertDialog + stories

Phase 4 — **Specialty widgets**:
13. ToolPalette + stories
14. TabControl + stories
15. ClassicScrollBar + stories
16. HaloTarget + stories

Phase 5 — **Showcase**:
17. macOS1Showcase composite story
18. Update `index.ts` barrel exports
19. Update README widget catalog

---

## 11. What's NOT Being Imported (and Why)

| Component        | Reason                                                                 |
|------------------|------------------------------------------------------------------------|
| `MacWindow`      | Redundant with `WindowSurface` + `WindowTitleBar` + `WindowResizeHandle` |
| `MenuBar`        | Redundant with `DesktopMenuBar` (which has better a11y)                |
| `DesktopIcon`    | Redundant with `DesktopIconLayer`                                      |
| `MacOS1Demo`     | Demo app, not a widget — replaced by our Showcase story                |
| `titleBarPattern`| Already achieved via CSS `repeating-linear-gradient` in `shell.css`    |

---

## 12. Appendix: Source → Framework Quick Reference

For each new widget, the mapping from source file line ranges to target files:

| Source Lines | Source Function       | Target File                  |
|-------------|----------------------|-------------------------------|
| 69–82       | `ScrollBar`          | `ClassicScrollBar.tsx`        |
| 84–98       | `PushButton`         | `Btn.tsx` (extend)            |
| 100–112     | `Checkbox`           | `Checkbox.tsx`                |
| 114–126     | `RadioButton`        | `RadioButton.tsx`             |
| 128–136     | `TextField`          | tokens only (extend field-input) |
| 138–150     | `ListBox`            | `ListBox.tsx`                 |
| 152–196     | `DropdownSelector`   | `DropdownMenu.tsx`            |
| 198–224     | `ContextMenu`        | `ContextMenu.tsx`             |
| 226–243     | `AlertDialog`        | `AlertDialog.tsx`             |
| 245–276     | `MenuBar`            | SKIP                          |
| 278–298     | `ToolPalette`        | `ToolPalette.tsx`             |
| 300–310     | `ProgressBar`        | `ProgressBar.tsx`             |
| 312–333     | `TabControl`         | `TabControl.tsx`              |
| 335–353     | `DesktopIcon`        | SKIP                          |
| 355–366     | `DisclosureTriangle` | `DisclosureTriangle.tsx`      |
| 368–419     | `HaloTarget`         | `HaloTarget.tsx`              |
