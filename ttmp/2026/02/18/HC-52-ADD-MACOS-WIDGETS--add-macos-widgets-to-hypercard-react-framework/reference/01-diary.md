---
title: "Diary"
doc_type: reference
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
---

# Diary

## Goal

Capture the full journey of HC-52: analyzing, mapping, and building macOS System 1-style widgets from an external JSX file into the HyperCard React framework.

---

## Step 1: Source Audit and Framework Inventory

I imported `macos1-widgets.jsx` via docmgr and read all 679 lines. In parallel I inventoried the existing HyperCard engine: widget components, CSS token system, the `parts.ts` registry, shell/windowing components, and multiple Storybook stories. The goal was to build a complete cross-reference between what the imported file offers and what the framework already has — before writing any code.

### Prompt Context

**User prompt (verbatim):** "Use docmgr to create a ticket HC-52-ADD-MACOS-WIDGETS and import ~/Downloads/macos1-widgets.jsx using `docmgr import file --file ... --ticket HC-52-ADD-MACOS-WIDGETS` and read it. Then make a map of the widgets that you can import into our react framework (and adapt the style to our current CSS as much as possible) to provide a wider selectino of widgets. Describe how to map them and hwo you will lay things out, including storybook stories. Store the result in a document in the ticket and upload to remarkable when done. Keep a diary as you analyze and work."

**Assistant interpretation:** Create the ticket, import the source file, exhaustively analyze both sides, produce a detailed mapping document with CSS conversion strategy and Storybook plans. No code in this step.

**Inferred user intent:** Get a clear, actionable blueprint before implementation begins.

**Commit (code):** N/A — analysis only

### What I did

1. Created ticket HC-52-ADD-MACOS-WIDGETS
2. Imported `macos1-widgets.jsx` (20 components + 1 demo)
3. Read every widget file in `packages/engine/src/components/widgets/` and `shell/windowing/`
4. Read all CSS (`tokens.css`, `primitives.css`, `shell.css`, `macos1.css`)
5. Read `parts.ts` and `types.ts`
6. Produced the analysis document with disposition matrix, CSS tokens, parts.ts entries, per-widget details, Storybook plan, and 5-phase implementation order

### Why

Need full picture of both codebases to plan zero-duplication import.

### What worked

- Framework has extremely clean architecture (data-part + CSS tokens) making it straightforward to plan new widget additions
- Source file components are well-isolated with clear props

### What I learned

- Pattern: every widget uses `data-part` attribute → CSS attribute selector → CSS custom property tokens
- `parts.ts` is the single source of truth for all part name strings
- macOS1.css is a thin token-override layer, not a full stylesheet
- Source uses runtime canvas for patterns (brittle), framework already uses SVG data URIs

### What was tricky to build

N/A — analysis only.

### What warrants a second pair of eyes

Overlap between source `MacWindow` and existing `WindowSurface` ensemble — decided to skip importing it.

### What should be done in the future

Implementation (handled in Step 2).

### Code review instructions

Review the analysis document: `ttmp/.../analysis/01-macos-widget-mapping-and-integration-plan.md`

### Technical details

See the analysis document for the full disposition matrix and per-widget mapping.

---

## Step 2: Build All Widgets (Phases 1–5)

With the analysis plan approved, I implemented all 11 new widgets plus the Btn extension across 5 phases, committing at each phase boundary. Skipped ClassicScrollBar and TextField per user instruction.

### Prompt Context

**User prompt (verbatim):** "build , skip scrollbar, textfield. Add tasks for each, then work through tasks by tasks. Commit and opportune intervals, keep a diary."

**Assistant interpretation:** Implement the widgets from the mapping plan, creating docmgr tasks for tracking, skipping ClassicScrollBar and TextField, committing at phase boundaries.

**Inferred user intent:** Get working code quickly with proper tracking and clean commit history.

**Commits:**
- `ea92da3` — "HC-52: Phase 1-2 — Foundation (tokens, parts, CSS) + Checkbox, RadioButton, ProgressBar, DisclosureTriangle, Btn isDefault"
- `c93cd84` — "HC-52: Phase 3 — ListBox, DropdownMenu, ContextMenu, AlertDialog + stories"
- `911a852` — "HC-52: Phase 4 — ToolPalette, TabControl, HaloTarget + stories"
- `9bafdaa` — "HC-52: Phase 5 — macOS1 Showcase story + barrel exports for all new widgets"

### What I did

**Phase 1 — Foundation:**
- Added 28 new entries to `parts.ts` for all new widget data-part attributes
- Added ~35 new CSS custom properties to `tokens.css` (pattern tokens, checkbox, listbox, dropdown, context menu, alert, progress, tool palette, disclosure, halo)
- Added ~250 lines of CSS rules to `primitives.css` for all new widgets
- Converted runtime canvas dither patterns to SVG data URI tokens (`--hc-pattern-stripe`, `--hc-pattern-desktop`)

**Phase 2 — Simple form controls (4 widgets):**
- `Checkbox.tsx` + stories — checkbox with ✕ mark, `role="checkbox"`, `aria-checked`
- `RadioButton.tsx` + stories — radio with CSS pseudo-element dot, `role="radio"`, `aria-checked`
- `ProgressBar.tsx` + stories — striped fill bar, `role="progressbar"`, `aria-valuenow`
- `DisclosureTriangle.tsx` + stories — expandable tree node, `aria-expanded`, CSS-driven show/hide
- `Btn.tsx` extended — added `isDefault` prop → `data-state="default"` → CSS outline ring

**Phase 3 — Interactive widgets (4 widgets):**
- `ListBox.tsx` + stories — selection list, `role="listbox"`, `role="option"`, `aria-selected`
- `DropdownMenu.tsx` + stories — custom popup with click-outside, `role="combobox"`, `role="listbox"`
- `ContextMenu.tsx` + stories — fixed-position right-click menu, `role="menu"`, `role="menuitem"`
- `AlertDialog.tsx` + stories — modal alert with configurable actions, `role="alertdialog"`, `aria-modal`

**Phase 4 — Specialty widgets (3 widgets):**
- `ToolPalette.tsx` + stories — CSS grid of tools, `role="toolbar"`, configurable columns
- `TabControl.tsx` + stories — wraps existing tab-bar/tab CSS, `role="tablist"`/`"tab"`/`"tabpanel"`
- `HaloTarget.tsx` + stories — Smalltalk-style morphic halos with 8 configurable handles

**Phase 5 — Showcase & exports:**
- `MacOS1Showcase.stories.tsx` — composite story showing all widgets together with interactivity
- Updated `index.ts` barrel — 11 new exports (AlertDialog, Checkbox, ContextMenu, DisclosureTriangle, DropdownMenu, HaloTarget, ListBox, ProgressBar, RadioButton, TabControl, ToolPalette)

### Why

Phased approach keeps commits reviewable and ensures each widget is self-contained before building on it.

### What worked

- CSS-first approach: writing all CSS rules in Phase 1 meant components could be written quickly without style debugging
- Reusing existing CSS: TabControl reuses `[data-part="tab-bar"]` and `[data-part="tab"]` rules already in primitives.css
- Pattern tokens: SVG data URIs for `--hc-pattern-stripe` work perfectly in ProgressBar fill and ToolPalette
- AlertDialog reuses `Btn` component rather than duplicating button rendering

### What didn't work

- Pre-existing TypeScript errors in `ChatWindow.interaction.stories.tsx` (3 errors about missing `args`) — not from our changes, verified by filtering

### What I learned

- `data-state` can carry multiple meanings per widget (e.g., "checked", "disabled", "selected", "open") — need to be consistent per component
- RadioButton dot is best done with CSS `::after` pseudo-element rather than a conditional child element — cleaner DOM
- DisclosureTriangle content show/hide can be pure CSS (`display: none` → `display: block` on `[data-state="open"]`) — no need for conditional rendering
- Click-outside pattern (DropdownMenu, ContextMenu) requires `useRef` + `useEffect` with mousedown listener; same pattern used in both
- HaloTarget positions are best encoded as a lookup table of CSS calc() expressions

### What was tricky to build

- **DisclosureTriangle CSS selector for arrow rotation:** The arrow is inside the disclosure-triangle container but may be nested in a wrapper div. Used both direct child and nested child selectors: `[data-part="disclosure-triangle"][data-state="open"] > [data-part="disclosure-triangle-arrow"]` plus `> * >` variant to cover both layouts.
- **ToolPalette configurable columns:** Used CSS custom property `--hc-tool-columns` set via inline style override when `columns` prop is provided, keeping the default in tokens.css. This avoids needing separate CSS classes per column count.
- **HaloTarget positioning:** 8 handle positions need precise CSS calc() expressions relative to the container. Encoded as a static `POSITION_STYLES` lookup keyed by position name, applied via inline style (acceptable since positions are structural, not visual).

### What warrants a second pair of eyes

1. **ContextMenu z-index (500):** May need adjustment if used inside the windowing shell where windows have dynamic z-indices
2. **DropdownMenu panel width:** Currently `width + 4` for the panel — this matches the source but may look wrong at non-default widths
3. **AlertDialog overlay:** Uses `position: absolute` + `inset: 0` — works inside a positioned container but may need portal for global usage
4. **HaloTarget accessibility:** Halos are hover-only; no keyboard equivalent yet

### What should be done in the future

- Add keyboard navigation to DropdownMenu (arrow keys, Enter, Escape)
- Add focus management to AlertDialog (trap focus, auto-focus OK button)
- Consider portal rendering for ContextMenu and AlertDialog to avoid clipping
- Add ClassicScrollBar if the visual authenticity is needed (skipped per user instruction)
- Consider extracting click-outside hook into a shared `useClickOutside` utility

### Code review instructions

**Where to start:**
1. `packages/engine/src/parts.ts` — check new part name entries at bottom
2. `packages/engine/src/theme/desktop/tokens.css` — check new token block
3. `packages/engine/src/theme/desktop/primitives.css` — check new CSS rules at bottom
4. Then review each component in `packages/engine/src/components/widgets/` alphabetically
5. Finally check `MacOS1Showcase.stories.tsx` for integration

**How to validate:**
```bash
npx tsc --noEmit --project packages/engine/tsconfig.json 2>&1 | grep -v ChatWindow.interaction
npx storybook dev -p 6006  # then browse Engine/Widgets/*
```

### Technical details

**Files changed/created:**

| File | Action | Lines |
|------|--------|-------|
| `parts.ts` | Modified | +28 entries |
| `tokens.css` | Modified | +35 tokens |
| `primitives.css` | Modified | +250 lines CSS |
| `Btn.tsx` | Modified | +isDefault prop |
| `Btn.stories.tsx` | Modified | +2 stories |
| `Checkbox.tsx` | New | 25 lines |
| `Checkbox.stories.tsx` | New | 41 lines |
| `RadioButton.tsx` | New | 25 lines |
| `RadioButton.stories.tsx` | New | 39 lines |
| `ProgressBar.tsx` | New | 30 lines |
| `ProgressBar.stories.tsx` | New | 40 lines |
| `DisclosureTriangle.tsx` | New | 30 lines |
| `DisclosureTriangle.stories.tsx` | New | 50 lines |
| `ListBox.tsx` | New | 33 lines |
| `ListBox.stories.tsx` | New | 40 lines |
| `DropdownMenu.tsx` | New | 63 lines |
| `DropdownMenu.stories.tsx` | New | 35 lines |
| `ContextMenu.tsx` | New | 50 lines |
| `ContextMenu.stories.tsx` | New | 55 lines |
| `AlertDialog.tsx` | New | 50 lines |
| `AlertDialog.stories.tsx` | New | 40 lines |
| `ToolPalette.tsx` | New | 37 lines |
| `ToolPalette.stories.tsx` | New | 45 lines |
| `TabControl.tsx` | New | 32 lines |
| `TabControl.stories.tsx` | New | 85 lines |
| `HaloTarget.tsx` | New | 85 lines |
| `HaloTarget.stories.tsx` | New | 60 lines |
| `MacOS1Showcase.stories.tsx` | New | 255 lines |
| `index.ts` | Modified | +16 exports |

**Total: 11 new widgets, 1 extended widget, 14 new story files (including showcase), ~1700 lines of new code.**
