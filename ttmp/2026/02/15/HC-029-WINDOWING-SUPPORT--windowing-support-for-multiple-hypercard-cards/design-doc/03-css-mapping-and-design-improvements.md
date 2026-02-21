---
Title: CSS Mapping and Design Improvements
Ticket: HC-029-WINDOWING-SUPPORT
Status: active
Topics:
    - frontend
    - ux
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/WindowChrome.tsx
      Note: Legacy single-window chrome being replaced
    - Path: packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx
      Note: |-
        Current desktop icon layer component
        Icon layer missing inverted selection treatment
    - Path: packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx
      Note: |-
        Current menu bar component
        Menu bar missing inverted hover/open states
    - Path: packages/engine/src/components/shell/windowing/WindowResizeHandle.tsx
      Note: Current resize handle component
    - Path: packages/engine/src/components/shell/windowing/WindowSurface.tsx
      Note: Current windowing window frame component
    - Path: packages/engine/src/components/shell/windowing/WindowTitleBar.tsx
      Note: |-
        Current title bar component missing mac1 stripe/pattern treatment
        Title bar missing stripe treatment — CSS-only fix proposed
    - Path: packages/engine/src/parts.ts
      Note: |-
        Part constant registry for data-part attribute selectors
        Part constants registry — needs windowing-desktop-shell addition
    - Path: packages/engine/src/theme/base.css
      Note: |-
        Existing tokenized CSS where windowing styles must land
        Primary CSS target for all windowing style changes
    - Path: ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx
      Note: |-
        Inspiration source with inline styles being mapped to tokenized CSS
        Source of mac1 inline styles being mapped
ExternalSources: []
Summary: Detailed mapping from mac1-windowing.jsx inline styles to the HyperCard engine tokenized CSS system, plus proposed design improvements for the windowing architecture.
LastUpdated: 2026-02-15T09:59:00-05:00
WhatFor: Guide the CSS implementation of the windowing shell to recapture the mac1 visual character while staying within the engine's tokenized data-part styling system.
WhenToUse: Use when implementing or reviewing windowing CSS, or when deciding which mac1 visual elements to adopt vs. redesign.
---



# CSS Mapping and Design Improvements

## Executive Summary

The mac1-windowing.jsx inspiration source uses 600+ lines of inline `style` objects to create a convincing classic Macintosh desktop feel. During the initial ticket port (Steps 9-11), we built correct structural windowing primitives with proper `data-part` attribute selectors and CSS custom properties, but we **lost much of the mac1 visual character** — particularly:

1. **Title bar stripe patterns** (the horizontal line fill on active windows)
2. **Desktop dither/checker background pattern**
3. **Scrollbar chrome** (vertical/horizontal scrollbar regions with arrow buttons and pattern fills)
4. **Info bar** in file windows
5. **Window shadow and border weight** differences
6. **Icon selection treatment** (inverted background + white text)
7. **Menu highlight behavior** (black background, white text on hover)
8. **Close box styling** (square border box, not just an outline)

This document provides a **concrete, property-by-property mapping** from mac1 inline styles to our `data-part` + CSS custom property system, identifies **what's already captured, what's missing, and what to add**, and then proposes **design improvements** to the overall windowing architecture.

---

## Part 1: CSS Mapping — mac1 Inline Styles → Engine Tokenized CSS

### 1.1 Screen / Root Container

**mac1 inline style** (`st.screen`):
```js
{
  width: "100vw", height: "100vh",
  background: "#c0c0c0",
  fontFamily: "'VT323', monospace",
  fontSize: 12,
  color: "#000",
  overflow: "hidden",
  cursor: "default",
  userSelect: "none",
  display: "flex",
  flexDirection: "column"
}
```

**Engine mapping**: The `[data-widget="hypercard"]` root already handles most of this. What's different:

| mac1 property | Engine current state | Gap? |
|---|---|---|
| `background: #c0c0c0` | `--hc-color-bg: #fff` | ✅ Already different — engine uses white bg for the widget root; the desktop bg is `--hc-color-desktop-bg: #bfc8d8` on the icon layer |
| `fontFamily: VT323, monospace` | `--hc-font-family: Geneva, Chicago, Monaco, monospace` | ✅ Engine uses its own retro font stack — good |
| `userSelect: none` | Not applied globally | ⚠️ **Add** `user-select: none` on desktop shell root |
| `cursor: default` | Not applied globally | ⚠️ **Add** `cursor: default` on desktop shell root |
| `overflow: hidden` | Already on root | ✅ Present |

**Recommendation**: Add a `[data-part="windowing-desktop-shell"]` root part with:
```css
[data-part="windowing-desktop-shell"] {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: default;
  user-select: none;
  background: var(--hc-color-bg);
}
```

### 1.2 Menu Bar

**mac1 inline style** (`st.menuBar`):
```js
{
  height: 22,
  background: "#fff",
  borderBottom: "2px solid #000",
  display: "flex",
  alignItems: "stretch",
  paddingLeft: 4,
  zIndex: 9999,
  flexShrink: 0
}
```

**Engine current** (`[data-part="windowing-menu-bar"]`):
```css
height: var(--hc-desktop-menubar-height); /* 28px */
background: linear-gradient(180deg, #f9fbff 0%, #dbe2ef 100%);
border: 2px solid var(--hc-color-border);
border-bottom-width: 1px;
```

| mac1 property | Engine current | Gap / Action |
|---|---|---|
| `height: 22` | `28px` | ⚠️ Engine is taller — **keep engine value** (28px better for touch targets) |
| `background: #fff` | gradient `#f9fbff → #dbe2ef` | ✅ Engine gradient is more refined — **keep** |
| `borderBottom: 2px solid #000` | `border: 2px solid; border-bottom-width: 1px` | ⚠️ mac1 has thicker bottom border. **Consider**: `border-bottom-width: 2px` for stronger divider |
| `zIndex: 9999` | `z-index: 10` | ⚠️ **Increase** to `z-index: 1000` — menu must overlay all windows |
| `flexShrink: 0` | Not set | ⚠️ **Add** `flex-shrink: 0` |
| `alignItems: stretch` | `align-items: center` | Minor — center is fine for button vertical centering |

**Menu button** (`st.menuItem` / `st.menuItemActive`):
```js
menuItem: { padding: "2px 12px", fontSize: 13, lineHeight: "18px", cursor: "default", fontWeight: "bold" }
menuItemActive: { background: "#000", color: "#fff" }
```

Engine current (`[data-part="windowing-menu-button"]`):
```css
font-size: 11px;
border: 1px solid transparent;
background: transparent;
padding: 2px 8px;
```

| Gap | Action |
|---|---|
| mac1 uses `fontWeight: bold` | **Add** `font-weight: bold` to menu buttons |
| mac1 active = solid black bg + white text | Engine uses `border-color + #fff bg` for open state — **Change** `[data-state="open"]` to `background: var(--hc-color-fg); color: var(--hc-color-bg)` for the classic inverted look |
| `fontSize: 13` vs `11px` | Keep `11px` — matches engine font scale |

**Dropdown panel** (`st.dropdown`):
```js
{
  position: "absolute", top: "100%", left: 0,
  background: "#fff",
  border: "2px solid #000",
  minWidth: 200,
  zIndex: 10000,
  boxShadow: "3px 3px 0 rgba(0,0,0,0.3)"
}
```

Engine current (`[data-part="windowing-menu-panel"]`):
```css
position: absolute;
top: calc(100% + 2px);
min-width: 180px;
border: 2px solid var(--hc-color-border);
box-shadow: 2px 2px 0 var(--hc-color-border);
background: #fff;
```

| Gap | Action |
|---|---|
| mac1 shadow uses `rgba(0,0,0,0.3)` | Engine uses solid black shadow — **keep engine** (stronger retro feel) |
| min-width: 200 vs 180 | Minor — 180 is fine |
| mac1 `top: 100%` vs engine `top: calc(100% + 2px)` | Engine gap is intentional for visual separation — **keep** |

**Menu item hover** (`st.ddItem` mouse handlers):
```js
onMouseEnter: { background: "#000", color: "#fff" }
onMouseLeave: { background: "#fff", color: "#000" }
```

Engine current (`[data-part="windowing-menu-item"]:hover`):
```css
border-color: var(--hc-color-border);
background: var(--hc-color-highlight); /* #ffffcc */
```

| Gap | Action |
|---|---|
| mac1 uses **solid black inversion** on hover | Engine uses yellow highlight — this is the **biggest visual character loss**. **Change** hover to `background: var(--hc-color-fg); color: var(--hc-color-bg)` |

### 1.3 Desktop Background / Icon Layer

**mac1 inline** (`st.desktop` + SVG pattern):
```js
desktop: { flex: 1, position: "relative", overflow: "hidden" }
// Plus SVG rect fill with "url(#dp)" pattern:
// pattern id="dp": 4x4 grid, #a8a8a8 base, 1x1 white pixels at (0,0) and (2,2) — classic dithered gray
```

**Engine current** (`[data-part="windowing-icon-layer"]`):
```css
background:
  linear-gradient(var(--hc-color-desktop-grid) 1px, transparent 1px),
  linear-gradient(90deg, var(--hc-color-desktop-grid) 1px, transparent 1px),
  var(--hc-color-desktop-bg);
background-size: 22px 22px, 22px 22px, auto;
```

| Gap | Action |
|---|---|
| mac1 uses a **pixel-dithered checkerboard pattern** (classic Mac desktop) | Engine uses a subtle grid overlay — **different aesthetic choice** |
| mac1 pattern gives strong retro feel | Engine pattern is more modern/subtle |

**Recommendation**: Add a CSS custom property `--hc-desktop-pattern` that can optionally replace the grid with a dithered look. Default to the current grid, but provide a mac1-style variant:

```css
/* Optional mac1-style dither pattern — set via theme override */
--hc-desktop-pattern-dither: url("data:image/svg+xml,..."); /* 4x4 dither SVG */
```

This keeps the current look as default but allows theme authors to opt into the classic dither.

**Icon column** (`st.iconCol`):
```js
{ position: "absolute", right: 16, top: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 1, alignItems: "center" }
```

Engine current: Icons use absolute positioning per-icon (via `left`/`top` from `DesktopIconDef`).

| Gap | Action |
|---|---|
| mac1 pins icons to right column | Engine uses free-form absolute positioning | ✅ Engine approach is more flexible — **keep** |
| mac1 `gap: 8` between icons | Engine doesn't enforce grid spacing | ⚠️ **Consider** adding optional grid-snap behavior in the future |

**Icon styling** (`st.deskIcon` / `st.iconEmoji` / `st.iconSel` / `st.iconLabel` / `st.iconLabelSel`):
```js
iconEmoji: { fontSize: 32, lineHeight: 1, padding: 2 }
iconSel: { background: "#000", borderRadius: 4, filter: "invert(1)" }
iconLabel: { fontSize: 11, textAlign: "center", marginTop: 2, padding: "1px 4px", lineHeight: 1.2, maxWidth: 72 }
iconLabelSel: { background: "#000", color: "#fff" }
```

Engine current (`[data-part="windowing-icon"]`):
```css
width: 84px;
display: flex;
flex-direction: column;
align-items: center;
gap: 4px;
background: transparent;
border: 1px solid transparent;
padding: 4px;
cursor: pointer;
```

Engine selected state:
```css
[data-part="windowing-icon"][data-state="selected"] {
  border-color: var(--hc-color-border);
  background: rgba(255, 255, 255, 0.65);
}
```

| Gap | Action |
|---|---|
| mac1 selected icon uses `filter: invert(1)` on emoji | Engine uses subtle border + translucent bg — **much less dramatic** |
| mac1 selected label uses solid black bg + white text | Engine doesn't differentiate label styling on selection |
| mac1 icon glyph is 32px | Engine `[data-part="windowing-icon-glyph"]` is 24px |

**Recommendation**: The mac1 inversion treatment is iconic but `filter: invert(1)` is harsh on modern emoji. Better approach:

```css
[data-part="windowing-icon"][data-state="selected"] {
  background: var(--hc-color-fg);
  border-color: var(--hc-color-fg);
}
[data-part="windowing-icon"][data-state="selected"] [data-part="windowing-icon-glyph"] {
  filter: brightness(0) invert(1); /* classic icon inversion */
}
[data-part="windowing-icon"][data-state="selected"] [data-part="windowing-icon-label"] {
  background: var(--hc-color-fg);
  color: var(--hc-color-bg);
}
```

And increase glyph size:
```css
[data-part="windowing-icon-glyph"] {
  font-size: 28px; /* closer to mac1's 32px, but slightly refined */
}
```

### 1.4 Window Frame

**mac1 inline** (`st.window`):
```js
{
  position: "absolute",
  background: "#fff",
  border: "2px solid #000",
  display: "flex",
  flexDirection: "column",
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: "2px 2px 0 rgba(0,0,0,0.2)"
}
```

**Engine current** (`[data-part="windowing-window"]`):
```css
position: absolute;
display: flex;
flex-direction: column;
border: 2px solid var(--hc-color-border);
background: var(--hc-window-body-bg);
box-shadow: var(--hc-window-shadow); /* 3px 3px 0 #000 */
min-width: 180px;
min-height: 120px;
pointer-events: auto;
```

| Gap | Action |
|---|---|
| mac1 `borderRadius: 3` | Engine has no border-radius — **Add** `border-radius: 3px` or token `--hc-window-border-radius: 3px` |
| mac1 `overflow: hidden` | Engine doesn't set overflow on frame — **Add** `overflow: hidden` |
| mac1 shadow is soft (`rgba(0,0,0,0.2)`) | Engine shadow is solid black 3px — mac1 is softer. **Keep engine** (stronger visual) but make this the token so themes can adjust |
| Focused shadow | Engine: `4px 4px 0 #000` | ✅ Good — stronger active shadow |

### 1.5 Title Bar (BIGGEST VISUAL GAP)

**mac1 inline** (`st.titleBar`):
```js
{
  height: 20,
  background: "#fff",
  borderBottom: "2px solid #000",
  display: "flex",
  alignItems: "center",
  padding: "0 4px",
  gap: 4,
  cursor: "grab",
  flexShrink: 0
}
```

Plus the **stripe pattern** treatment:
```jsx
<div style={st.titleStripes}>
  {isActive && !win.isDialog && (
    <svg width="100%" height="100%" style={{ display: "block" }}>
      <rect width="100%" height="100%" fill="url(#tp)" />
    </svg>
  )}
</div>
```

Where pattern `#tp` is:
```html
<pattern id="tp" width="2" height="2" patternUnits="userSpaceOnUse">
  <rect width="2" height="2" fill="#fff" />
  <rect width="1" height="1" x="0" y="0" fill="#000" />
  <rect width="1" height="1" x="1" y="1" fill="#000" />
</pattern>
```

This gives the **classic Mac horizontal stripe pattern flanking the title text** on active windows.

**Engine current** (`[data-part="windowing-window-title-bar"]`):
```css
display: flex;
align-items: center;
gap: 8px;
padding: 3px 6px;
border-bottom: 2px solid var(--hc-color-border);
background: var(--hc-window-title-bg); /* #fff */
cursor: move;
user-select: none;
```

Focused state:
```css
[data-part="windowing-window-title-bar"][data-state="focused"] {
  background: var(--hc-window-title-focused-bg); /* #e6ebf3 */
}
```

| Gap | Action |
|---|---|
| **Title bar stripes are completely missing** | This is the single biggest visual character loss from mac1 |
| mac1 title text sits between two striped regions | Engine title just has a tinted background |
| mac1 stripes only show on active window | Engine uses background color change only |
| mac1 title text has explicit white bg padding | Engine title is inline in the colored bar |

**Recommendation — Add title bar stripes via CSS only (no SVG in JSX)**:

Add two new parts: `windowing-title-stripes-left` and `windowing-title-stripes-right` (or a single `windowing-title-stripes` that gets used on both sides via flexbox).

Better yet, use CSS pseudo-elements to avoid DOM changes:

```css
/* Title stripe pattern via repeating-linear-gradient */
[data-part="windowing-window-title-bar"][data-state="focused"]::before,
[data-part="windowing-window-title-bar"][data-state="focused"]::after {
  content: '';
  flex: 1;
  height: 12px;
  background: repeating-linear-gradient(
    to bottom,
    var(--hc-color-fg) 0px,
    var(--hc-color-fg) 1px,
    var(--hc-color-bg) 1px,
    var(--hc-color-bg) 2px
  );
}

/* Title text gets its own white bg pill to cut through the stripes */
[data-part="windowing-window-title"] {
  flex: 0 0 auto; /* don't stretch */
  text-align: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0 6px;
  background: var(--hc-window-title-bg);
  position: relative; /* stay above pseudo stripes */
}
```

This achieves the classic mac1 look entirely via CSS, no SVG elements needed.

### 1.6 Close Box

**mac1 inline** (`st.closeBox`):
```js
{ width: 12, height: 12, border: "2px solid #000", flexShrink: 0, cursor: "pointer", background: "#fff" }
```

**Engine current** (`[data-part="windowing-close-button"]`):
```css
width: 12px; height: 12px;
border: 2px solid var(--hc-color-border);
background: #fff;
padding: 0;
cursor: pointer;
```

✅ **Already correct.** The close box mapping is faithful.

### 1.7 Window Content / Body

**mac1 inline** (`st.content`):
```js
{ flex: 1, overflow: "auto", background: "#fff", marginRight: 16, marginBottom: 16 }
```

The `marginRight: 16` and `marginBottom: 16` create space for the scrollbar regions.

**Engine current** (`[data-part="windowing-window-body"]`):
```css
flex: 1;
overflow: auto;
padding: 10px;
background: var(--hc-window-body-bg);
font-size: 11px;
```

| Gap | Action |
|---|---|
| mac1 uses margin to make room for scrollbar chrome | Engine uses padding on the content itself |
| mac1 has no padding on content (apps manage own padding) | Engine has 10px padding — may conflict with some card renderers |

**Recommendation**: Remove default padding from window body; let card content manage its own padding:
```css
[data-part="windowing-window-body"] {
  flex: 1;
  overflow: auto;
  background: var(--hc-window-body-bg);
  font-size: 11px;
  padding: 0; /* cards manage their own padding */
}
```

### 1.8 Scrollbar Chrome (MISSING ENTIRELY)

**mac1 has explicit scrollbar regions**:
```js
scrollV: { position: "absolute", right: 0, top: 20, bottom: 16, width: 16, borderLeft: "2px solid #000", background: "#fff", display: "flex", flexDirection: "column" }
scrollH: { position: "absolute", bottom: 0, left: 0, right: 16, height: 16, borderTop: "2px solid #000", background: "#fff", display: "flex", alignItems: "center" }
scrollArr: { width: "100%", height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, borderBottom: "1px solid #000", cursor: "pointer", background: "#fff", flexShrink: 0 }
scrollTrk: { flex: 1, overflow: "hidden" } // filled with dither pattern
```

**Engine current**: No scrollbar chrome at all. Uses browser-native scroll on the body.

| Gap | Action |
|---|---|
| **Entire scrollbar system is missing** | This is a significant visual element in the mac1 look |

**Recommendation**: **Do NOT implement custom scrollbar DOM elements** for V1. Instead, use CSS scrollbar styling to approximate the look:

```css
[data-part="windowing-window-body"]::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}
[data-part="windowing-window-body"]::-webkit-scrollbar-track {
  background: var(--hc-color-bg);
  border-left: 2px solid var(--hc-color-border);
}
[data-part="windowing-window-body"]::-webkit-scrollbar-thumb {
  background: var(--hc-color-bg);
  border: 2px solid var(--hc-color-border);
}
[data-part="windowing-window-body"]::-webkit-scrollbar-button {
  height: 16px;
  background: var(--hc-color-bg);
  border: 1px solid var(--hc-color-border);
}
```

This gives an approximation of the classic scrollbar look without the complexity of a custom scrollbar DOM tree. Firefox support via `scrollbar-color` and `scrollbar-width` can provide a simpler fallback.

### 1.9 Resize Handle

**mac1 inline** (`st.resizeHandle`):
```js
{
  position: "absolute", bottom: 0, right: 0,
  width: 16, height: 16,
  cursor: "nwse-resize",
  borderLeft: "2px solid #000",
  borderTop: "2px solid #000",
  background: "#fff"
}
```

**Engine current** (`[data-part="windowing-resize-handle"]`):
```css
position: absolute;
right: 0; bottom: 0;
width: 14px; height: 14px;
border: 0;
border-top: 2px solid var(--hc-color-border);
border-left: 2px solid var(--hc-color-border);
background: linear-gradient(135deg, transparent 50%, #ddd 50%);
cursor: nwse-resize;
```

| Gap | Action |
|---|---|
| mac1 is 16×16, engine is 14×14 | ⚠️ Increase to 16×16 for better hit target |
| mac1 has plain white bg | Engine has diagonal gradient — actually **nicer** visual cue, **keep** |

### 1.10 Info Bar (MISSING)

**mac1 inline** (`st.infoBar`):
```js
{
  height: 18,
  borderBottom: "1px solid #000",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 8px",
  fontSize: 11,
  background: "#fff",
  flexShrink: 0
}
```

This shows "N items · NNK in disk · NNK available" for file windows.

**Engine current**: No info bar concept.

**Recommendation**: **Defer to app-level card content** rather than building an info bar into the window chrome. HyperCard cards already render their own status/summary bars via `[data-part="status-bar"]`. No gap to fill here.

---

## Part 2: Missing Parts / Tokens to Add

### 2.1 New CSS Custom Properties

```css
[data-widget="hypercard"] {
  /* Add these to existing token block */
  --hc-window-border-radius: 3px;
  --hc-desktop-menubar-z: 1000;
  --hc-window-title-stripe-fg: var(--hc-color-fg);
  --hc-window-title-stripe-bg: var(--hc-color-bg);
  --hc-icon-selected-bg: var(--hc-color-fg);
  --hc-icon-selected-fg: var(--hc-color-bg);
  --hc-menu-hover-bg: var(--hc-color-fg);
  --hc-menu-hover-fg: var(--hc-color-bg);
}
```

### 2.2 New Part Constants

Add to `parts.ts`:
```ts
// Add to existing desktop windowing shell section:
windowingDesktopShell: 'windowing-desktop-shell',
```

This is the only missing part constant. The existing parts already cover the rest of the component tree well.

### 2.3 CSS Rules to Add / Modify

Summary of all CSS changes needed in `base.css`:

| Selector | Change | Reason |
|---|---|---|
| New `[data-part="windowing-desktop-shell"]` | Add root container styles | Missing shell root |
| `[data-part="windowing-menu-bar"]` | Add `z-index: var(--hc-desktop-menubar-z)`, `flex-shrink: 0` | Menu must layer above windows |
| `[data-part="windowing-menu-button"]` | Add `font-weight: bold` | Retro character |
| `[data-part="windowing-menu-button"][data-state="open"]` | Change to inverted bg/fg | mac1 character |
| `[data-part="windowing-menu-item"]:hover` | Change to inverted bg/fg | **Biggest visual loss** — restore black highlight |
| `[data-part="windowing-icon"][data-state="selected"]` | Inverted bg + glyph filter + label inversion | mac1 icon selection treatment |
| `[data-part="windowing-icon-glyph"]` | Increase to 28px | Closer to mac1 proportions |
| `[data-part="windowing-window"]` | Add `border-radius`, `overflow: hidden` | mac1 rounded corners |
| Title bar `[data-state="focused"]::before/::after` | Add stripe pseudo-elements | **Title stripes — key missing feature** |
| `[data-part="windowing-window-title"]` | Add `padding: 0 6px; background: var(--hc-window-title-bg)` to cut through stripes | Stripe support |
| `[data-part="windowing-window-body"]` | Remove `padding: 10px`, set to 0 | Cards manage own padding |
| `[data-part="windowing-window-body"]` scrollbar | Add webkit scrollbar styling | Approximate classic scrollbar |
| `[data-part="windowing-resize-handle"]` | Increase to 16×16 | Better hit target |

---

## Part 3: Design Improvements

### 3.1 Improvement: Add a `DesktopShell` Root Component

**Problem**: The current implementation jumps straight from story harness to individual primitives. There's no `DesktopShell` component that composes menu bar + icon layer + window layer into a single shell root.

**Proposal**: Add `DesktopShell.tsx` as the top-level orchestrating component:

```tsx
function DesktopShell({ children, menus, icons, ... }) {
  return (
    <div data-part="windowing-desktop-shell">
      <DesktopMenuBar ... />
      <div style={{ position: 'relative', flex: 1 }}>
        <DesktopIconLayer ... />
        <WindowLayer ... />
      </div>
    </div>
  );
}
```

This component owns:
- Click-away behavior (clear icon selection, close menus)
- Desktop-level keyboard shortcuts
- Shell-level focus management

Without this, every consumer must re-implement the composition and event coordination. This is identified in the original design docs but should be **prioritized as the first implementation step after CSS fixes**.

### 3.2 Improvement: Title Bar Should Support Stripes Without DOM Changes

**Problem**: The original mac1 JSX uses two `<div style={st.titleStripes}>` regions flanking the title text, each containing an SVG pattern fill. This requires DOM changes to `WindowTitleBar.tsx`.

**Proposal**: Use CSS `::before` and `::after` pseudo-elements on the title bar instead. This means **no JSX changes needed** — only CSS additions:

```css
[data-part="windowing-window-title-bar"][data-state="focused"] {
  display: flex;
  /* existing styles */
}

[data-part="windowing-window-title-bar"][data-state="focused"]::before,
[data-part="windowing-window-title-bar"][data-state="focused"]::after {
  content: '';
  flex: 1;
  height: 10px;
  align-self: center;
  background: repeating-linear-gradient(
    to bottom,
    var(--hc-window-title-stripe-fg) 0px,
    var(--hc-window-title-stripe-fg) 1px,
    var(--hc-window-title-stripe-bg) 1px,
    var(--hc-window-title-stripe-bg) 2px
  );
}
```

This is a pure CSS-only solution. Themes can customize stripe appearance by overriding `--hc-window-title-stripe-fg` and `--hc-window-title-stripe-bg`.

**Tradeoff**: Pseudo-elements can't participate in the title bar's `gap` layout in the same way as real DOM nodes — but since we use `flex: 1`, they'll fill remaining space naturally with the close box and title text between them.

**Potential issue**: The close button is the first child, then title text. With `::before` inserting before the close button, the order may be wrong. Solution: use `order` properties:

```css
[data-part="windowing-close-button"] { order: 0; }
[data-part="windowing-window-title-bar"]::before { order: 1; } /* left stripes */
[data-part="windowing-window-title"] { order: 2; }
[data-part="windowing-window-title-bar"]::after { order: 3; } /* right stripes */
```

### 3.3 Improvement: Theme Variants (mac1 Classic vs. Modern)

**Problem**: The engine CSS currently uses a modernized look (gradients, subtle borders, highlight yellow). The mac1 look uses stark black-and-white inversions, dithered patterns, and pixel borders. These are two legitimate visual directions.

**Proposal**: Support both via CSS theme classes:

```css
/* Default: engine modern theme (current) */
[data-widget="hypercard"] {
  --hc-menu-hover-bg: var(--hc-color-highlight);
  --hc-menu-hover-fg: var(--hc-color-fg);
  /* ...etc */
}

/* Optional: mac1 classic theme */
[data-widget="hypercard"].hc-theme-classic {
  --hc-menu-hover-bg: var(--hc-color-fg);
  --hc-menu-hover-fg: var(--hc-color-bg);
  --hc-window-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
  --hc-window-title-focused-bg: #fff;
  /* title stripes via token changes */
}
```

This avoids a hard choice between the two aesthetics. The default would use the **mac1-inspired inverted highlights** (which are the more characterful choice and what was requested), and a softer theme variant could be provided for apps that prefer a lighter touch.

### 3.4 Improvement: Menu Separator Support

**Problem**: The mac1 menu model uses `"---"` strings as separator markers between menu items. The current engine `DesktopMenuItem` type has no separator concept.

**Proposal**: Extend `DesktopMenuSection` items array to support a union type:

```ts
export type DesktopMenuEntry =
  | DesktopMenuItem
  | { separator: true };

export interface DesktopMenuSection {
  id: string;
  label: string;
  items: DesktopMenuEntry[];
}
```

And render separators as:
```css
[data-part="windowing-menu-separator"] {
  height: 1px;
  background: var(--hc-color-muted);
  margin: 2px 8px;
}
```

This is a small but important UX element that groups related menu commands visually.

### 3.5 Improvement: Pointer Capture for Drag/Resize

**Problem**: The mac1 source uses `window.addEventListener("mousemove/mouseup")` with manual cleanup. The current engine hook `useWindowInteractionController` does similar. Both approaches risk listener leaks on edge cases.

**Proposal**: Use `Element.setPointerCapture()` instead. This is already mentioned in the design study but not yet implemented. Benefits:

- Pointer events stay bound to the capturing element even if pointer leaves window
- Automatic cleanup when pointer is released
- Simpler code than global listener attach/detach

The interaction controller should use `onPointerDown` → `setPointerCapture(pointerId)` → `onPointerMove` / `onPointerUp` on the same element, not on `window`.

### 3.6 Improvement: Window Open Animation

**Problem**: Neither mac1 nor the current engine animate window opening. Windows just appear. This feels abrupt in a multi-window desktop.

**Proposal**: Add a simple CSS scale-up animation on window creation:

```css
[data-part="windowing-window"] {
  animation: hc-window-open 0.12s ease-out;
}

@keyframes hc-window-open {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

This is subtle but adds polish. The animation is short enough (120ms) to not feel slow.

### 3.7 Improvement: Missing DesktopShell Root Part Means No Scoped Click-Away

**Problem**: Without a `windowing-desktop-shell` root, there's no natural place to handle:
- Click on empty desktop area → deselect icons, close menus
- Keyboard shortcuts at the desktop level

**Proposal**: The `DesktopShell` component (3.1 above) handles this. Its click handler on the root `div` would:
```ts
onClick={(e) => {
  if (e.target === e.currentTarget || isDesktopBackground(e.target)) {
    onDeselectIcon?.();
    onCloseMenu?.();
  }
}}
```

### 3.8 Improvement: Dialog Window Variant

**Problem**: mac1 has a dialog window variant (`win.isDialog`) that lacks a close box, doesn't allow drag, and shows an OK button. The current engine types have no dialog concept for windows.

**Proposal**: Add an `isDialog` field to `DesktopWindowDef`:

```ts
export interface DesktopWindowDef {
  // ...existing fields...
  isDialog?: boolean;
  isResizable?: boolean;
}
```

And handle in CSS:
```css
[data-part="windowing-window"][data-variant="dialog"] [data-part="windowing-close-button"] {
  display: none;
}
[data-part="windowing-window"][data-variant="dialog"] [data-part="windowing-window-title-bar"] {
  cursor: default; /* no drag */
}
[data-part="windowing-window"][data-variant="dialog"] [data-part="windowing-resize-handle"] {
  display: none;
}
```

### 3.9 Improvement: Keyboard Focus Ring for Windows

**Problem**: Neither mac1 nor the current engine provide visible keyboard focus indicators for windows. With multiple windows, keyboard users need to see which window has focus.

**Proposal**: Use `box-shadow` doubling on keyboard focus (not mouse focus):

```css
[data-part="windowing-window"]:focus-visible {
  box-shadow: var(--hc-window-shadow), 0 0 0 2px var(--hc-color-accent);
}
```

This adds an outer ring on `:focus-visible` only, so mouse users see the existing shadow treatment while keyboard users get an extra affordance.

---

## Part 4: Implementation Priority

### Tier 1 — Visual Fidelity (Do First)

These are CSS-only changes that restore mac1 character without touching component JSX:

1. **Title bar stripes** via `::before`/`::after` pseudo-elements
2. **Menu item hover** inverted to black bg / white text
3. **Menu button open state** inverted to black bg / white text
4. **Icon selection** inverted treatment (black bg, label inversion)
5. **Window border-radius** and `overflow: hidden`
6. **Window body padding** removed (set to 0)
7. **New CSS tokens** for stripe, menu hover, icon selection colors

### Tier 2 — Structural Additions (Do Second)

These require small JSX/TS changes:

8. **`DesktopShell` root component** (new file)
9. **`windowing-desktop-shell` part** in parts.ts
10. **Menu separator type** and rendering
11. **Dialog window variant** (`isDialog`, `isResizable` fields)
12. **Resize handle** size increase to 16×16

### Tier 3 — Polish (Do Third)

13. **Window open animation** keyframe
14. **Scrollbar CSS styling** approximation
15. **Keyboard focus ring** on windows
16. **Desktop dither pattern** as optional theme variant
17. **Pointer capture** migration in interaction controller

---

## Part 5: Concrete CSS Patch Preview

Here is the complete set of CSS additions/modifications needed for `base.css`, organized by visual element:

```css
/* ── NEW: Desktop shell root ── */
[data-part="windowing-desktop-shell"] {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: default;
  user-select: none;
}

/* ── MODIFY: Menu bar z-index + flex-shrink ── */
[data-part="windowing-menu-bar"] {
  /* add to existing rule: */
  z-index: var(--hc-desktop-menubar-z, 1000);
  flex-shrink: 0;
}

/* ── MODIFY: Menu button weight + open state inversion ── */
[data-part="windowing-menu-button"] {
  /* add to existing rule: */
  font-weight: bold;
}
[data-part="windowing-menu-button"][data-state="open"] {
  /* replace existing rule body: */
  background: var(--hc-menu-hover-bg, var(--hc-color-fg));
  color: var(--hc-menu-hover-fg, var(--hc-color-bg));
  border-color: transparent;
}

/* ── MODIFY: Menu item hover inversion ── */
[data-part="windowing-menu-item"]:hover {
  background: var(--hc-menu-hover-bg, var(--hc-color-fg));
  color: var(--hc-menu-hover-fg, var(--hc-color-bg));
  border-color: transparent;
}

/* ── NEW: Menu separator ── */
[data-part="windowing-menu-separator"] {
  height: 1px;
  background: var(--hc-color-muted);
  margin: 2px 8px;
}

/* ── MODIFY: Icon glyph size ── */
[data-part="windowing-icon-glyph"] {
  font-size: 28px;
}

/* ── MODIFY: Icon selected state — full inversion ── */
[data-part="windowing-icon"][data-state="selected"] {
  background: var(--hc-icon-selected-bg, var(--hc-color-fg));
  border-color: var(--hc-icon-selected-bg, var(--hc-color-fg));
  border-radius: 4px;
}
[data-part="windowing-icon"][data-state="selected"] [data-part="windowing-icon-glyph"] {
  filter: brightness(0) invert(1);
}
[data-part="windowing-icon"][data-state="selected"] [data-part="windowing-icon-label"] {
  color: var(--hc-icon-selected-fg, var(--hc-color-bg));
}

/* ── MODIFY: Window frame — border radius + overflow ── */
[data-part="windowing-window"] {
  /* add to existing rule: */
  border-radius: var(--hc-window-border-radius, 3px);
  overflow: hidden;
}

/* ── MODIFY: Title bar — stripe pseudo-elements ── */
[data-part="windowing-close-button"] { order: 0; }
[data-part="windowing-window-title-bar"]::before { order: 1; }
[data-part="windowing-window-title"] { order: 2; flex: 0 0 auto; }
[data-part="windowing-window-title-bar"]::after { order: 3; }

[data-part="windowing-window-title-bar"][data-state="focused"]::before,
[data-part="windowing-window-title-bar"][data-state="focused"]::after {
  content: '';
  flex: 1;
  height: 10px;
  align-self: center;
  background: repeating-linear-gradient(
    to bottom,
    var(--hc-window-title-stripe-fg, var(--hc-color-fg)) 0px,
    var(--hc-window-title-stripe-fg, var(--hc-color-fg)) 1px,
    var(--hc-window-title-stripe-bg, var(--hc-color-bg)) 1px,
    var(--hc-window-title-stripe-bg, var(--hc-color-bg)) 2px
  );
}

[data-part="windowing-window-title"] {
  /* add to existing: */
  padding: 0 6px;
  background: var(--hc-window-title-bg);
}

/* ── MODIFY: Window body — remove default padding ── */
[data-part="windowing-window-body"] {
  /* change padding from 10px to 0 */
  padding: 0;
}

/* ── NEW: Scrollbar approximation ── */
[data-part="windowing-window-body"]::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}
[data-part="windowing-window-body"]::-webkit-scrollbar-track {
  background: var(--hc-color-bg);
  border-left: 2px solid var(--hc-color-border);
}
[data-part="windowing-window-body"]::-webkit-scrollbar-thumb {
  background: var(--hc-color-bg);
  border: 2px solid var(--hc-color-border);
  min-height: 20px;
}

/* ── MODIFY: Resize handle — increase to 16×16 ── */
[data-part="windowing-resize-handle"] {
  width: 16px;
  height: 16px;
}

/* ── NEW: Window open animation ── */
@keyframes hc-window-open {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
[data-part="windowing-window"] {
  animation: hc-window-open 0.12s ease-out;
}

/* ── NEW: Keyboard focus ring ── */
[data-part="windowing-window"]:focus-visible {
  box-shadow: var(--hc-window-shadow), 0 0 0 2px var(--hc-color-accent);
}

/* ── NEW: Dialog variant ── */
[data-part="windowing-window"][data-variant="dialog"] [data-part="windowing-close-button"] {
  display: none;
}
[data-part="windowing-window"][data-variant="dialog"] [data-part="windowing-window-title-bar"] {
  cursor: default;
}
[data-part="windowing-window"][data-variant="dialog"] [data-part="windowing-resize-handle"] {
  display: none;
}
```

---

## Part 6: Summary Table — What Was Lost, What To Restore

| Visual Element | mac1 Status | Engine Current | Restore? | Method |
|---|---|---|---|---|
| Title bar stripes | ✅ Present | ❌ Missing | **YES — Tier 1** | CSS pseudo-elements |
| Menu hover inversion | ✅ Present | ❌ Yellow highlight | **YES — Tier 1** | CSS rule change |
| Menu button inversion | ✅ Present | ❌ White bg on open | **YES — Tier 1** | CSS rule change |
| Icon selection inversion | ✅ Present | ❌ Subtle border only | **YES — Tier 1** | CSS rule change |
| Window border-radius | ✅ 3px | ❌ 0px | **YES — Tier 1** | CSS token |
| Desktop dither pattern | ✅ Pixel dither | ⚠️ Grid lines | Optional — Tier 3 | CSS token/theme |
| Scrollbar chrome | ✅ Custom DOM | ❌ Browser default | Partial — Tier 3 | CSS scrollbar styling |
| Info bar | ✅ In file windows | ❌ Missing | NO — defer to card content | N/A |
| Window shadow | ✅ Soft rgba | ⚠️ Solid black | Keep engine | Already better |
| Close box | ✅ Correct | ✅ Correct | N/A | Already mapped |
| Font stack | ✅ VT323 | ✅ Geneva/Chicago | N/A | Already good |
| Resize handle | ✅ 16×16 | ⚠️ 14×14 | **YES — Tier 2** | CSS size change |
| Dialog variant | ✅ Present | ❌ Missing | **YES — Tier 2** | Type + CSS |
| Menu separators | ✅ Present | ❌ Missing | **YES — Tier 2** | Type + CSS |
| Boot animation | ✅ Present | ❌ Missing | NO — not needed | N/A |
| Window open animation | ❌ Missing | ❌ Missing | **YES — Tier 3** | CSS keyframe |

---

## Open Questions

1. **Should the title bar stripes use repeating-linear-gradient or an SVG pattern background?**
   - Gradient is simpler and pure CSS. SVG pattern gives pixel-perfect control but adds complexity.
   - Recommendation: Start with gradient; switch to SVG pattern only if gradient looks wrong at retina scaling.

2. **Should we implement a "classic" and "modern" theme, or just adopt the mac1 aesthetic as default?**
   - Recommendation: Adopt mac1-inspired aesthetics as default (inverted highlights, stripes). The whole point of HyperCard is the retro feel. Provide tokens so apps can soften it.

3. **Should window body padding be 0 or configurable?**
   - Recommendation: 0 default with a `--hc-window-body-padding` token for per-app override.

4. **Should the focused title bar background color remain `#e6ebf3` or become pure white (so stripes contrast better)?**
   - Recommendation: Pure white background, let stripes provide the focused affordance. The tinted bg competes visually with stripes.

---

## References

- `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx` — inline style objects at line 570+
- `packages/engine/src/theme/base.css` — existing tokenized CSS
- `packages/engine/src/parts.ts` — part constant registry
- `packages/engine/src/components/shell/windowing/WindowTitleBar.tsx` — title bar component
- `packages/engine/src/components/shell/windowing/WindowSurface.tsx` — window frame component
- `packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx` — menu bar component
- `packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx` — icon layer component
