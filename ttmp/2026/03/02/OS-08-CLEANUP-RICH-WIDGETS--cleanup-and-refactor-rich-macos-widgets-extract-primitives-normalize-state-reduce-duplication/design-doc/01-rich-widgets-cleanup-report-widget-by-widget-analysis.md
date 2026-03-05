---
Title: 'Rich Widgets Cleanup Report: Widget-by-Widget Analysis'
Ticket: OS-08-CLEANUP-RICH-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/rich-widgets/src/calculator/formula.ts
      Note: new Function() at lines 146 and 178
    - Path: packages/rich-widgets/src/calendar/types.ts
      Note: Module-level let nextId at line 53
    - Path: packages/rich-widgets/src/index.ts:Barrel export for all 20 widgets
    - Path: packages/rich-widgets/src/kanban/KanbanBoard.tsx
      Note: Module-level let nextId at line 9
    - Path: packages/rich-widgets/src/launcher/modules.tsx:LaunchableAppModule definitions
    - Path: packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx
      Note: Structural twin - LaSlider lines 43-78
    - Path: packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx
      Note: Structural twin - OscSlider lines 33-68
    - Path: packages/rich-widgets/src/parts.ts:Data-part constants registry
    - Path: packages/rich-widgets/src/primitives/Sparkline.tsx:Only existing primitive
    - Path: packages/rich-widgets/src/repl/MacRepl.tsx
      Note: new Function() at lines 202 and 248
    - Path: packages/rich-widgets/src/system-modeler/SystemModeler.tsx
      Note: Module-level let idCounter at line 18
    - Path: packages/rich-widgets/src/theme/index.ts:CSS theme barrel import
ExternalSources: []
Summary: 'Comprehensive cleanup analysis of 20 rich widgets: extractable primitives, state management audit, duplication detection, bug inventory, CSS consistency, and phased implementation plan.'
LastUpdated: 2026-03-02T16:00:00-05:00
WhatFor: Guide cleanup and refactoring of the rich-widgets package
WhenToUse: When planning or executing widget cleanup work
---


# Rich Widgets Cleanup Report: Widget-by-Widget Analysis

## 1. Executive Summary

This report analyzes 20 rich macOS-style widgets in `packages/rich-widgets/src/` for cleanup and refactoring opportunities. The widgets were ported from standalone JSX imports during OS-07 and share no primitives beyond a single Sparkline component used by one widget.

**Key findings:**

- **213 useState calls across 20 widgets**, zero Redux usage. All widgets are fully self-contained local-state components.
- **12 widgets duplicate a toolbar pattern**, 14 duplicate a status bar, 10 duplicate a sidebar layout — nearly verbatim CSS each time.
- **6 widgets hand-roll progress bars**, 7 hand-roll empty states, 3 hand-roll radio buttons (ignoring the engine's RadioButton).
- **Oscilloscope and LogicAnalyzer are structural twins** sharing an identical animation loop, slider component, CRT bezel, and canvas rendering pipeline.
- **3 widgets contain `new Function()` calls** (MacCalc, MacRepl) — a security concern.
- **3 widgets use module-level mutable counters** (KanbanBoard, MacCalendar, SystemModeler) — shared state across instances.
- **CSS variable conventions are split**: older widgets use full-word prefixes (`log-viewer-*`), newer ones use 2-3 char abbreviations (`gf-*`, `cr-*`). ControlRoom uses hardcoded hex colors with no CSS variables at all.

**Recommended action:** Extract 8-10 shared primitives, fix the identified bugs, standardize naming conventions, and consolidate the animation/canvas patterns into reusable hooks. The proposed phased plan addresses these in order of impact.

---

## 2. Problem Statement and Scope

### Problem

The 20 rich widgets were ported rapidly from standalone JSX files. Each widget is self-contained — which is good for isolation but has led to:

1. **Massive CSS duplication**: toolbar, status bar, sidebar, modal overlay, and separator styles are copy-pasted across 10-14 files with only prefix differences.
2. **No shared primitives**: The `primitives/` directory contains only Sparkline (used by 1 widget). Progress bars, empty states, search inputs, and radio groups are re-implemented from scratch in each widget.
3. **Inconsistent engine integration**: 17 widgets use `Btn`, but only 1 uses `RadioButton` while 3 others hand-roll their own.
4. **Bugs from rapid porting**: module-level mutable state, missing cleanup in effects, `new Function()` security holes, and dead state variables.
5. **Naming drift**: two different data-part prefix conventions coexist, and the `RICH_PARTS` import aliasing (`as P` vs full name) is inconsistent.

### Scope

This analysis covers all 20 widgets:

| # | Widget | Directory | Lines (TSX) | useState |
|---|--------|-----------|-------------|----------|
| 1 | LogViewer | `log-viewer/` | ~380 | 10 |
| 2 | ChartView | `chart-view/` | ~350 | 4 |
| 3 | MacWrite | `mac-write/` | ~360 | 8 |
| 4 | KanbanBoard | `kanban/` | ~460 | 14 |
| 5 | MacRepl | `repl/` | ~350 | 12 |
| 6 | NodeEditor | `node-editor/` | ~450 | 9 |
| 7 | Oscilloscope | `oscilloscope/` | ~440 | 15 |
| 8 | LogicAnalyzer | `logic-analyzer/` | ~380 | 12 |
| 9 | MacCalendar | `calendar/` | ~520 | 14 |
| 10 | GraphNavigator | `graph-navigator/` | ~480 | 10 |
| 11 | MacCalc | `calculator/` | ~580 | 17 |
| 12 | DeepResearch | `deep-research/` | ~420 | 9 |
| 13 | GameFinder | `game-finder/` | ~480 | 10 |
| 14 | RetroMusicPlayer | `music-player/` | ~500 | 15 |
| 15 | StreamLauncher | `stream-launcher/` | ~450 | 9 |
| 16 | SteamLauncher | `steam-launcher/` | ~470 | 8 |
| 17 | YouTubeRetro | `youtube-retro/` | ~500 | 13 |
| 18 | ChatBrowser | `chat-browser/` | ~400 | 6 |
| 19 | SystemModeler | `system-modeler/` | ~595 | 11 |
| 20 | ControlRoom | `control-room/` | ~630 | 7 |

Plus the supporting files: `primitives/Sparkline.tsx`, `parts.ts`, `index.ts`, `theme/index.ts`, and 20 CSS files in `theme/`.

---

## 3. Current Architecture

### Package structure

```
packages/rich-widgets/src/
├── primitives/
│   └── Sparkline.tsx          # Only shared primitive (used by LogViewer only)
├── log-viewer/
│   ├── LogViewer.tsx
│   └── LogViewer.stories.tsx
├── chart-view/
│   ├── ChartView.tsx
│   └── ChartView.stories.tsx
├── mac-write/
│   ├── MacWrite.tsx
│   └── MacWrite.stories.tsx
├── kanban/
│   ├── KanbanBoard.tsx
│   └── KanbanBoard.stories.tsx
├── repl/
│   ├── MacRepl.tsx
│   └── MacRepl.stories.tsx
├── node-editor/
│   ├── NodeEditor.tsx
│   └── NodeEditor.stories.tsx
├── oscilloscope/
│   ├── Oscilloscope.tsx
│   └── Oscilloscope.stories.tsx
├── logic-analyzer/
│   ├── LogicAnalyzer.tsx
│   └── LogicAnalyzer.stories.tsx
├── calendar/
│   ├── MacCalendar.tsx
│   └── MacCalendar.stories.tsx
├── graph-navigator/
│   ├── GraphNavigator.tsx
│   └── GraphNavigator.stories.tsx
├── calculator/
│   ├── MacCalc.tsx
│   ├── formula.ts
│   └── MacCalc.stories.tsx
├── deep-research/
│   ├── DeepResearch.tsx
│   └── DeepResearch.stories.tsx
├── game-finder/
│   ├── GameFinder.tsx
│   ├── gameArt.ts
│   └── GameFinder.stories.tsx
├── music-player/
│   ├── RetroMusicPlayer.tsx
│   └── RetroMusicPlayer.stories.tsx
├── stream-launcher/
│   ├── StreamLauncher.tsx
│   ├── streamArt.ts
│   └── StreamLauncher.stories.tsx
├── steam-launcher/
│   ├── SteamLauncher.tsx
│   └── SteamLauncher.stories.tsx
├── youtube-retro/
│   ├── YouTubeRetro.tsx
│   └── YouTubeRetro.stories.tsx
├── chat-browser/
│   ├── ChatBrowser.tsx
│   └── ChatBrowser.stories.tsx
├── system-modeler/
│   ├── types.ts
│   ├── sampleData.ts
│   ├── SystemModeler.tsx
│   └── SystemModeler.stories.tsx
├── control-room/
│   ├── types.ts
│   ├── instruments.tsx
│   ├── ControlRoom.tsx
│   └── ControlRoom.stories.tsx
├── launcher/
│   ├── modules.tsx
│   └── RichWidgetsDesktop.stories.tsx
├── parts.ts                    # ~300+ data-part constants
├── index.ts                    # Barrel exports
└── theme/
    ├── index.ts                # CSS barrel import
    ├── log-viewer.css
    ├── chart-view.css
    ├── mac-write.css
    ├── kanban.css
    ├── repl.css
    ├── node-editor.css
    ├── oscilloscope.css
    ├── logic-analyzer.css
    ├── calendar.css
    ├── graph-navigator.css
    ├── calculator.css
    ├── deep-research.css
    ├── game-finder.css
    ├── music-player.css
    ├── stream-launcher.css
    ├── steam-launcher.css
    ├── youtube-retro.css
    ├── chat-browser.css
    ├── system-modeler.css
    └── control-room.css
```

### State management

All 20 widgets use **React useState exclusively**. None use Redux, useReducer, Zustand, Jotai, or any external state library. The widgets are designed as self-contained demo components with simulated data.

### Engine component usage

| Engine Component | Count | Widgets |
|---|---|---|
| `Btn` | 17 | All except ControlRoom, MacRepl, ChartView |
| `Checkbox` | 5 | LogViewer, Oscilloscope, LogicAnalyzer, DeepResearch, ChatBrowser |
| `RadioButton` | 1 | ChartView only |

Two widgets (ControlRoom, MacRepl) use zero engine components.

### CSS theming

All widgets use `data-part` attributes for CSS styling, with selectors like `[data-part='xxx-toolbar']`. CSS variables from the engine theme are referenced as `var(--hc-color-*)` in most widgets. ControlRoom is the exception, using hardcoded hex colors.

---

## 4. Widget-by-Widget Analysis

### 4.1 LogViewer

**Location:** `log-viewer/LogViewer.tsx`
**State:** 10 useState calls
**Engine usage:** Btn, Checkbox

**Extractable patterns:**
- Toolbar with buttons and search input
- Status bar with item count
- Sidebar with category list
- Search/filter input with count badge

**Issues:**
- "Export", "Bookmark", and "Settings" toolbar buttons are non-functional (no-op onClick handlers)
- Streaming log simulation uses `setInterval` — cleanup is present but the effect has a complex dependency on `streaming` state
- Only widget using the Sparkline primitive

**Cleanup priority:** Low — well-structured, mostly clean.

---

### 4.2 ChartView

**Location:** `chart-view/ChartView.tsx`
**State:** 4 useState calls (lowest)
**Engine usage:** RadioButton (only widget using it)

**Extractable patterns:**
- Status bar

**Issues:**
- Props type is `Partial<ChartViewProps>` with all fields already optional — double-optionality is confusing
- Default sample data generation runs on every mount even when `data` prop is provided (useEffect runs unconditionally)
- Canvas rendering could benefit from devicePixelRatio handling

**Cleanup priority:** Low — smallest widget, minimal duplication.

---

### 4.3 MacWrite

**Location:** `mac-write/MacWrite.tsx`
**State:** 8 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Toolbar with formatting buttons and separator
- Status bar with word/char count
- Find bar (search pattern)

**Issues:**
- Toolbar separator is hand-rolled (`<span data-part="mac-write-sep" />`) — duplicated in 7+ widgets
- Preview mode uses `dangerouslySetInnerHTML` to render markdown — appropriate for a contained demo but worth noting

**Cleanup priority:** Low-medium — toolbar and status bar are extraction candidates.

---

### 4.4 KanbanBoard

**Location:** `kanban/KanbanBoard.tsx`
**State:** 14 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Toolbar with search
- Status bar with task count
- Modal overlay for task editing
- Separator dividers

**Issues:**
- **Module-level `let nextId = 20`** — shared across all KanbanBoard instances, IDs will collide if multiple boards are mounted
- Modal overlay pattern (backdrop + centered card) is duplicated in MacCalendar, SystemModeler, GameFinder, SteamLauncher
- Drag-and-drop between columns is fully custom (no library)

**Cleanup priority:** Medium — fix the module-level state, extract modal primitive.

---

### 4.5 MacRepl

**Location:** `repl/MacRepl.tsx`
**State:** 12 useState calls
**Engine usage:** None (0 engine components)

**Extractable patterns:**
- Status bar with session info

**Issues:**
- **`new Function()` for code evaluation** — security risk, allows arbitrary code execution. Should use a sandboxed evaluator or at minimum document the risk prominently.
- `startTime` is stored in `useState` but never triggers re-renders — should be `useRef`
- Does not use `Btn` from engine despite having clear button candidates (clear, export)
- No toolbar pattern (terminal-style widget)

**Cleanup priority:** Medium — fix `new Function()`, convert startTime to useRef, adopt Btn.

---

### 4.6 NodeEditor

**Location:** `node-editor/NodeEditor.tsx`
**State:** 9 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Toolbar
- Status bar with node/connection count
- Canvas with pan/drag (shared pattern with GraphNavigator)

**Issues:**
- SVG-based canvas — different rendering approach from the Canvas2D widgets
- Pan offset state is stored as two separate useState calls (panX, panY) — could be a single `{x, y}` state
- No keyboard shortcuts for common operations

**Cleanup priority:** Low — reasonably clean, SVG approach is unique.

---

### 4.7 Oscilloscope

**Location:** `oscilloscope/Oscilloscope.tsx`
**State:** 15 useState calls
**Engine usage:** Btn, Checkbox

**Extractable patterns:**
- Toolbar with mode buttons
- CRT bezel with canvas display
- `OscSlider` labeled slider component
- `useAnimationLoop` pattern (requestAnimationFrame with canvasRef + animRef + timeRef)
- Button group selector
- Separator dividers

**Issues:**
- **OscSlider is nearly identical to LogicAnalyzer's LaSlider** — exact same props/structure, only the data-part prefix differs
- No `devicePixelRatio` handling — canvas will look blurry on HiDPI displays
- 15 useState calls is high — the channel config (freq, amp, phase, color, visible for 2 channels) could be a single reducer or structured state
- Animation frame is not cancelled on rapid re-mounts

**Cleanup priority:** High — structural twin with LogicAnalyzer, major extraction opportunity.

---

### 4.8 LogicAnalyzer

**Location:** `logic-analyzer/LogicAnalyzer.tsx`
**State:** 12 useState calls
**Engine usage:** Btn, Checkbox

**Extractable patterns:**
- Toolbar
- CRT bezel with canvas display (identical to Oscilloscope)
- `LaSlider` labeled slider (identical to OscSlider)
- Animation loop (identical to Oscilloscope)
- Button group selector
- Separator dividers

**Issues:**
- **Structural twin of Oscilloscope** — same animation loop, same bezel, same slider, same toolbar layout, same CSS structure
- No `devicePixelRatio` handling
- Both widgets could share a `CrtDisplay` primitive that handles the bezel, canvas, and animation loop

**Cleanup priority:** High — merge shared code with Oscilloscope into CrtDisplay primitive.

---

### 4.9 MacCalendar

**Location:** `calendar/MacCalendar.tsx`
**State:** 14 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Toolbar with navigation arrows
- Status bar
- Modal overlay for event editing (same pattern as KanbanBoard)
- Command palette overlay (same pattern as MacCalc)

**Issues:**
- **Module-level `let nextId = 100`** — shared across instances
- Command palette implementation is nearly identical to MacCalc's — same overlay, same search input, same filtered list
- Two view modes (month/week) add complexity but are well-separated

**Cleanup priority:** Medium — fix module-level state, extract command palette and modal primitives.

---

### 4.10 GraphNavigator

**Location:** `graph-navigator/GraphNavigator.tsx`
**State:** 10 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Sidebar with node browser
- Button group for layout selection
- Canvas with pan/drag (shared with NodeEditor)
- Animation loop (requestAnimationFrame for force-directed layout)

**Issues:**
- Force-directed simulation never stops — `requestAnimationFrame` runs continuously even when the graph has settled. Should add a velocity threshold check.
- Complex ref usage (7 useRef calls: posRef, velRef, frameRef, dragRef, canvasRef, panStart, graphRef)
- Query console could use a shared search/filter input primitive

**Cleanup priority:** Medium — fix the runaway animation, extract button group.

---

### 4.11 MacCalc

**Location:** `calculator/MacCalc.tsx`, `calculator/formula.ts`
**State:** 17 useState calls (highest)
**Engine usage:** Btn

**Extractable patterns:**
- Toolbar
- Status bar with cell reference display
- Command palette overlay (shared with MacCalendar)
- Find/replace bar (search pattern)
- Separator dividers

**Issues:**
- **`new Function()` in formula.ts for formula evaluation** — same security concern as MacRepl
- 17 useState calls — the spreadsheet cell data, selection, formatting state could benefit from useReducer or a structured state object
- Command palette pattern is identical to MacCalendar's implementation
- Complex grid rendering with formatPaint, find/replace, cell editing — highest complexity widget

**Cleanup priority:** High — most complex widget, state needs restructuring, `new Function()` risk.

---

### 4.12 DeepResearch

**Location:** `deep-research/DeepResearch.tsx`
**State:** 9 useState calls
**Engine usage:** Btn, Checkbox

**Extractable patterns:**
- Sidebar with query list
- Progress bar with percentage
- Status bar (implicit)
- Empty state placeholder

**Issues:**
- **Dead state variables**: `webSearch` and `academicOnly` are stored in state and rendered as checkboxes but their values are never consumed by any logic — the research simulation ignores them entirely
- Radio button group for depth selection is hand-rolled (could use engine RadioButton)
- Research simulation is entirely fake (timers only) but the UX is convincing

**Cleanup priority:** Low — remove dead state, adopt RadioButton.

---

### 4.13 GameFinder

**Location:** `game-finder/GameFinder.tsx`, `game-finder/gameArt.ts`
**State:** 10 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Sidebar with category filters
- Search bar with result count
- Status bar
- Progress bar for install simulation
- Hand-rolled radio buttons for sort options
- Empty state for no results
- Launch overlay with progress
- Canvas pixel art thumbnails (shared pattern with StreamLauncher)

**Issues:**
- Hand-rolled radio buttons (`gf-radio`, `gf-radio-dot`) — should use engine RadioButton
- `gameArt.ts` canvas pixel art drawing is similar in structure to `streamArt.ts` — could share a pixel art utility
- Launch overlay pattern is shared with SteamLauncher

**Cleanup priority:** Medium — many extraction candidates, adopt RadioButton.

---

### 4.14 RetroMusicPlayer

**Location:** `music-player/RetroMusicPlayer.tsx`
**State:** 15 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Sidebar with playlists
- Search input
- Status bar with now-playing info
- Progress bar (playback)
- Empty state for no results
- Toolbar (transport controls)

**Issues:**
- 15 useState calls — playback state (currentTrack, playing, elapsed, volume, shuffle, repeat, queue) could be a single reducer
- Two separate `setInterval` effects for EQ animation and elapsed time — could be combined
- Volume slider range is 0-100 but some calculations assume 0-1
- Marquee ticker animation uses CSS — one of the few widgets with CSS animation

**Cleanup priority:** Medium — state restructuring, extract progress bar.

---

### 4.15 StreamLauncher

**Location:** `stream-launcher/StreamLauncher.tsx`, `stream-launcher/streamArt.ts`
**State:** 9 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Sidebar with categories
- Search bar with result count
- Status bar
- Progress bar
- Hand-rolled radio buttons for sort
- Empty state
- Canvas pixel art thumbnails
- Separator dividers

**Issues:**
- **Near-twin of GameFinder** in layout structure — sidebar + search + list + detail
- Hand-rolled radio buttons (sl-radio, sl-radio-dot) — should use engine RadioButton
- `streamArt.ts` pixel art drawing parallels `gameArt.ts`

**Cleanup priority:** Medium — structural similarity with GameFinder suggests shared layout.

---

### 4.16 SteamLauncher

**Location:** `steam-launcher/SteamLauncher.tsx`
**State:** 8 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Tab bar navigation
- Search bar
- Status bar
- Progress bar for download simulation
- Launch overlay with animation
- Empty state

**Issues:**
- Tab navigation pattern (Library/Store/Community/Downloads) could be a shared TabBar component
- Launch overlay animation is similar to GameFinder's
- Friends list sidebar is unique to this widget

**Cleanup priority:** Low-medium — extract tab bar and launch overlay.

---

### 4.17 YouTubeRetro

**Location:** `youtube-retro/YouTubeRetro.tsx`
**State:** 13 useState calls
**Engine usage:** Btn

**Extractable patterns:**
- Tab/nav bar
- Search bar
- Status bar
- Progress bar (video playback)
- Sidebar (subscriptions)
- Empty state

**Issues:**
- **`useMemo` with `Math.random()` for related videos** — defeats memoization since random values change on each render, causing unnecessary recalculations
- CRT scanline effect is CSS-only (different from Oscilloscope/LogicAnalyzer's canvas CRT)
- 13 useState calls — video playback state could be consolidated

**Cleanup priority:** Medium — fix useMemo bug, extract shared patterns.

---

### 4.18 ChatBrowser

**Location:** `chat-browser/ChatBrowser.tsx`
**State:** 6 useState calls
**Engine usage:** Btn, Checkbox

**Extractable patterns:**
- Sidebar with conversation list
- Toolbar with search
- Status bar
- Search panel with advanced filters
- Empty state

**Issues:**
- Cleanest widget architecturally — low state count, clear separation of concerns
- Search panel with multiple filter types (text, model, tags, date) is unique and well-implemented
- Quick filter radio buttons at top of conversation list are inline

**Cleanup priority:** Low — well-structured, minimal issues.

---

### 4.19 SystemModeler

**Location:** `system-modeler/SystemModeler.tsx`, `system-modeler/types.ts`, `system-modeler/sampleData.ts`
**State:** 11 useState calls (across SystemModeler.tsx)
**Engine usage:** Btn

**Extractable patterns:**
- Toolbar with simulation controls
- Status bar
- Modal dialog for block parameters
- Progress bar for simulation
- Sidebar palette with categories
- Separator dividers

**Issues:**
- **Module-level `let idCounter = 1`** — shared across instances, IDs will collide
- `useEffect` for keyboard handler has incomplete dependency array
- SVG rendering for block diagram (similar approach to NodeEditor)
- Parameter dialog pattern is shared with KanbanBoard/MacCalendar modal

**Cleanup priority:** Medium — fix module-level state, extract modal/dialog.

---

### 4.20 ControlRoom

**Location:** `control-room/ControlRoom.tsx`, `control-room/instruments.tsx`, `control-room/types.ts`
**State:** 7 useState calls (ControlRoom.tsx) + refs in instruments
**Engine usage:** None (0 engine components)

**Extractable patterns:**
- Panel/section wrapper (titled card)
- Instruments are already well-extracted into instruments.tsx

**Issues:**
- **Uses zero engine components** — no Btn, Checkbox, or RadioButton
- **Hardcoded CSS colors** — uses `#c0c0c0`, `#808080`, `#000`, `#333` etc. instead of CSS variables. Only widget with no `var(--hc-*)` references.
- 3 separate `setInterval` effects (tick, logs, scope) — could be a single animation loop
- instruments.tsx is actually well-architected as reusable sub-components — could be promoted to primitives
- Knob component uses manual mouse event tracking via refs — works but is complex

**Cleanup priority:** Medium — needs CSS variable adoption and engine component integration. Instruments are a model of good extraction.

---

## 5. Cross-Cutting Analysis

### 5.1 Extractable Primitives (ordered by impact)

| Primitive | Widgets Affected | Description |
|-----------|-----------------|-------------|
| **WidgetToolbar** | 12 | Flex row with gap, border-bottom, background. Accepts children. |
| **WidgetStatusBar** | 14 | Flex row at bottom with border-top, small font. Accepts children. |
| **WidgetSidebar** | 10 | Fixed-width column with border-right, overflow-y. Width prop. |
| **ModalOverlay** | 9 | Backdrop + centered card. onClose callback. |
| **ProgressBar** | 6 | Track + fill with percentage. Value/max props. |
| **EmptyState** | 7 | Centered placeholder text/icon. Message prop. |
| **SearchBar** | 9 | Text input + optional count badge. onChange, count props. |
| **CommandPalette** | 3 | Overlay with search + filtered action list. Items, onSelect props. |
| **CrtDisplay** | 2 | CRT bezel + canvas + animation loop. drawFrame callback. |
| **LabeledSlider** | 2 | Label + range input. min/max/value/onChange props. |
| **useAnimationLoop** | 3 | Hook: requestAnimationFrame with canvasRef. Returns timeRef. |
| **ButtonGroup** | 3 | Horizontal button set with active state. Options, value, onChange. |
| **Separator** | 7 | Vertical or horizontal divider line. |

**Estimated duplication savings:** Extracting the top 5 primitives (Toolbar, StatusBar, Sidebar, ModalOverlay, ProgressBar) would eliminate ~200 lines of duplicated CSS and ~100 lines of duplicated JSX across the codebase.

### 5.2 State Management Audit

**useState counts by widget (descending):**

| Widget | useState | Recommendation |
|--------|----------|----------------|
| MacCalc | 17 | Extract to useReducer with CellState + UIState |
| Oscilloscope | 15 | Group channel config into useReducer |
| RetroMusicPlayer | 15 | Group playback state into useReducer |
| KanbanBoard | 14 | Group board state into useReducer |
| MacCalendar | 14 | Group calendar state into useReducer |
| YouTubeRetro | 13 | Group video state into useReducer |
| MacRepl | 12 | Group REPL state into useReducer |
| LogicAnalyzer | 12 | Group channel config (parallel to Oscilloscope) |
| SystemModeler | 11 | Group canvas state into useReducer |
| LogViewer | 10 | Acceptable — distinct concerns |
| GraphNavigator | 10 | Acceptable — mostly ref-based |
| GameFinder | 10 | Acceptable — distinct concerns |
| NodeEditor | 9 | Acceptable |
| StreamLauncher | 9 | Acceptable |
| DeepResearch | 9 | Acceptable |
| SteamLauncher | 8 | Acceptable |
| MacWrite | 8 | Acceptable |
| ControlRoom | 7 | Acceptable |
| ChatBrowser | 6 | Acceptable |
| ChartView | 4 | Acceptable |

**Recommendation:** Widgets with 12+ useState calls should consider useReducer to group related state. This is not a correctness issue but improves readability and reduces the chance of inconsistent state updates.

**Redux adoption:** None of these widgets need Redux. They are self-contained UI components with no cross-widget communication. useState/useReducer is the correct approach. If widgets later need to share state (e.g., a music player controlling audio across the desktop), Redux integration would be appropriate at that point.

### 5.3 Engine Component Gaps

**Widgets not using `Btn`:** ControlRoom (uses custom toggles/knobs), MacRepl (terminal — no visible buttons), ChartView (uses RadioButton instead)

**Widgets with hand-rolled radio buttons that should use `RadioButton`:**
- GameFinder (`gf-radio` / `gf-radio-dot`)
- DeepResearch (`dr-radio` / `dr-radio-dot`)
- StreamLauncher (`sl-radio` / `sl-radio-dot`)

**Widgets not using any engine component that could:**
- ControlRoom — toggle switches could potentially wrap engine Checkbox with custom styling, but the instrument aesthetic may warrant keeping custom components
- MacRepl — "Clear" and "Export" actions could be Btn components

### 5.4 CSS Naming Conventions

**Two conventions coexist:**

| Convention | Widgets | Example |
|------------|---------|---------|
| Full-word prefix | LogViewer, ChartView, MacWrite, KanbanBoard, NodeEditor (5) | `log-viewer-toolbar` |
| 2-3 char abbreviation | All other 15 widgets | `gf-toolbar`, `cr-dashboard` |

**Import alias inconsistency:**
- 5 widgets use `import { RICH_PARTS as P }` — GameFinder, MusicPlayer, SteamLauncher, YouTubeRetro, StreamLauncher
- 15 widgets use `import { RICH_PARTS }` directly

**Recommendation:** Standardize on 2-3 char abbreviations (the majority convention) and the `as P` alias (more concise in JSX). Rename the 5 full-word-prefix widgets in a single migration.

### 5.5 CSS Variable Usage

Most widgets reference engine CSS variables:
```css
var(--hc-color-bg, #fff)
var(--hc-color-alt, #f0f0f0)
var(--hc-color-border, #999)
var(--hc-color-text, #222)
var(--hc-color-accent, ...)
```

**Exceptions:**
- **ControlRoom**: Uses hardcoded hex colors (`#c0c0c0`, `#808080`, `#000`, `#333`, `#00ff00`, `#ff4444`) — needs full migration to CSS variables
- Some widgets mix `--hc-*` with one-off hardcoded colors for accent tones

### 5.6 Structural Twin Pairs

**Oscilloscope ↔ LogicAnalyzer:**
- Same animation loop pattern (canvasRef + animRef + timeRef + requestAnimationFrame)
- Same slider component (OscSlider vs LaSlider — identical props and structure)
- Same CRT bezel + canvas layout
- Same toolbar + controls layout
- Same CSS structure with different prefixes
- **Recommendation:** Extract `CrtDisplay` primitive + `LabeledSlider` primitive + `useAnimationLoop` hook. Both widgets become thin wrappers around shared code.

**GameFinder ↔ StreamLauncher:**
- Same layout: sidebar with category filters + sort radio + search bar + list + detail view + status bar
- Same canvas pixel art pattern (gameArt.ts ↔ streamArt.ts)
- Same hand-rolled radio buttons
- **Recommendation:** Extract `AppBrowserLayout` primitive with sidebar/main slots. Extract `PixelArtCanvas` utility. Adopt engine RadioButton.

**GameFinder ↔ SteamLauncher:**
- Same launch overlay with progress bar pattern
- Same install/download simulation
- Similar detail view layout
- **Recommendation:** Extract `LaunchOverlay` primitive.

---

## 6. Bug Inventory

### 6.1 Security Issues

| Widget | File | Lines | Issue | Severity |
|--------|------|-------|-------|----------|
| MacRepl | `repl/MacRepl.tsx` | 202, 248 | `new Function()` for REPL evaluation | High |
| MacCalc | `calculator/formula.ts` | 146, 178 | `new Function()` for formula evaluation | High |

**Recommendation:** Replace with a safe expression parser (e.g., `math.js` or a custom recursive-descent parser) or add prominent warning comments and Content Security Policy headers.

### 6.2 Module-Level Mutable State

| Widget | File | Line | Variable | Risk |
|--------|------|------|----------|------|
| KanbanBoard | `kanban/KanbanBoard.tsx` | 9 | `let nextId = 20` | ID collision across instances |
| MacCalendar | `calendar/types.ts` | 53 | `let nextId = 100` | ID collision across instances |
| SystemModeler | `system-modeler/SystemModeler.tsx` | 18 | `let idCounter = 1` | ID collision across instances |

**Recommendation:** Move to `useRef` inside the component, or use a UUID/nanoid generator.

### 6.3 Incorrect Hook Usage

| Widget | File | Issue |
|--------|------|-------|
| MacRepl | `repl/MacRepl.tsx` | `startTime` in useState should be useRef (never triggers re-render) |
| YouTubeRetro | `youtube-retro/YouTubeRetro.tsx` | `useMemo` with `Math.random()` — defeats memoization |
| SystemModeler | `system-modeler/SystemModeler.tsx` | `useEffect` for keyboard handler missing dependency array entries |

### 6.4 Dead Code / Dead State

| Widget | File | Issue |
|--------|------|-------|
| DeepResearch | `deep-research/DeepResearch.tsx` | `webSearch` and `academicOnly` state values are never consumed |
| LogViewer | `log-viewer/LogViewer.tsx` | "Export", "Bookmark", "Settings" buttons are no-ops |

### 6.5 Performance Issues

| Widget | File | Issue |
|--------|------|-------|
| GraphNavigator | `graph-navigator/GraphNavigator.tsx` | Force simulation never stops — continuous requestAnimationFrame with no velocity threshold |
| Oscilloscope | `oscilloscope/Oscilloscope.tsx` | No devicePixelRatio handling — blurry on HiDPI |
| LogicAnalyzer | `logic-analyzer/LogicAnalyzer.tsx` | No devicePixelRatio handling — blurry on HiDPI |
| ControlRoom | `control-room/ControlRoom.tsx` | 3 separate setInterval effects — could be 1 |

---

## 7. Proposed Solution: Phased Implementation Plan

### Phase 1: Bug Fixes (Low risk, high value)

**Files touched:** 7 widget files
**Estimated scope:** ~50 line changes

1. **Fix module-level mutable state** in KanbanBoard, MacCalendar, SystemModeler — move `nextId`/`idCounter` to `useRef` inside component
2. **Fix YouTubeRetro useMemo** — remove `Math.random()` from useMemo dependency or move randomization outside
3. **Fix MacRepl startTime** — change from `useState` to `useRef`
4. **Fix SystemModeler useEffect** — add missing dependencies to keyboard handler effect
5. **Remove dead state** from DeepResearch (`webSearch`, `academicOnly`)
6. **Add devicePixelRatio** handling to Oscilloscope and LogicAnalyzer canvas rendering
7. **Add velocity threshold** to GraphNavigator force simulation

### Phase 2: Extract Shared Primitives (Medium risk, high value)

**New files:** `primitives/` directory additions
**Estimated scope:** ~300 lines of new primitives, ~400 lines removed from widgets

1. **WidgetToolbar** — shared toolbar component with slot for children
   - Used by: 12 widgets
   - CSS: single `[data-part='widget-toolbar']` rule replacing 12 per-widget rules

2. **WidgetStatusBar** — shared status bar component
   - Used by: 14 widgets
   - CSS: single rule replacing 14 per-widget rules

3. **ModalOverlay** — backdrop + centered card with close callback
   - Used by: KanbanBoard, MacCalendar, SystemModeler, GameFinder, SteamLauncher

4. **ProgressBar** — track + fill with value/max props
   - Used by: GameFinder, SteamLauncher, StreamLauncher, DeepResearch, SystemModeler, YouTubeRetro

5. **EmptyState** — centered placeholder with icon + message
   - Used by: GameFinder, SteamLauncher, StreamLauncher, MusicPlayer, YouTubeRetro, ChatBrowser, DeepResearch

6. **SearchBar** — text input with optional count badge
   - Used by: 9 widgets

7. **Separator** — vertical/horizontal divider
   - Used by: 7 widgets

### Phase 3: Extract Specialized Primitives (Medium risk, medium value)

1. **CrtDisplay** — CRT bezel + canvas + animation loop wrapper
   - Extract from Oscilloscope and LogicAnalyzer
   - Provides: bezel chrome, canvas ref, animation frame management
   - Widget provides: `drawFrame(ctx, width, height, time)` callback

2. **LabeledSlider** — merge OscSlider and LaSlider into one component
   - Extract from Oscilloscope and LogicAnalyzer

3. **useAnimationLoop** hook — requestAnimationFrame with cleanup
   - Extract from Oscilloscope, LogicAnalyzer, GraphNavigator

4. **CommandPalette** — overlay search with filtered action list
   - Extract from MacCalc and MacCalendar

5. **ButtonGroup** — horizontal button set with active state
   - Extract from GraphNavigator, LogicAnalyzer, Oscilloscope

### Phase 4: Adopt Engine Components (Low risk, low-medium value)

1. **Replace hand-rolled radio buttons** with engine RadioButton in:
   - GameFinder, DeepResearch, StreamLauncher

2. **Add Btn usage** to MacRepl (Clear, Export actions) and consider for ControlRoom toggles

### Phase 5: Naming Standardization (Low risk, low value)

1. **Standardize data-part prefixes** — rename the 5 full-word-prefix widgets to 2-3 char abbreviations:
   - `log-viewer-*` → `lv-*`
   - `chart-view-*` → `cv-*`
   - `mac-write-*` → `mw-*`
   - `kanban-*` → `kb-*`
   - `node-editor-*` → `ne-*`

2. **Standardize RICH_PARTS import** — adopt `as P` alias in all widgets

3. **Migrate ControlRoom CSS** — replace hardcoded hex colors with `var(--hc-color-*)` variables

### Phase 6: State Restructuring (Higher risk, medium value)

For widgets with 12+ useState calls, consider grouping related state with useReducer:

1. **MacCalc** (17 → ~4 state groups): grid data, UI mode, selection, find/replace
2. **Oscilloscope** (15 → ~3 state groups): channel A config, channel B config, display settings
3. **RetroMusicPlayer** (15 → ~3 state groups): playback state, library state, UI state
4. **KanbanBoard** (14 → ~3 state groups): board data, drag state, modal state
5. **MacCalendar** (14 → ~3 state groups): calendar data, view state, modal state

---

## 8. Testing and Validation Strategy

### Per-phase validation

1. **After Phase 1 (bug fixes):** Run TypeScript check, run Storybook, verify each fixed widget renders correctly
2. **After Phase 2-3 (primitives):** Each primitive needs its own Storybook story. Each widget migration needs before/after visual comparison.
3. **After Phase 4 (engine adoption):** Visual diff — radio buttons and buttons should look identical
4. **After Phase 5 (naming):** Grep for old prefixes to ensure no orphaned CSS rules
5. **After Phase 6 (state):** Each refactored widget needs interactive testing in Storybook

### Regression checks

- All 20 widget stories must render without errors
- Desktop integration story must show all 20 widgets launching
- No TypeScript errors introduced
- No orphaned CSS rules (grep for data-part values not referenced in TSX)
- No orphaned parts.ts entries (grep for part constants not used in TSX)

---

## 9. Risks and Alternatives

### Risks

| Risk | Mitigation |
|------|------------|
| Primitive extraction changes visual appearance | Visual regression testing with Storybook screenshots |
| Shared CSS primitives are too rigid for widget-specific needs | Use slot/children pattern, allow CSS variable overrides |
| State restructuring introduces subtle bugs | Phase 6 is last and optional; each widget can be migrated independently |
| Naming migration breaks external consumers | Rich-widgets has no external consumers yet — data-parts are internal |

### Alternatives considered

1. **Leave as-is**: The widgets work. Duplication is cosmetic. However, adding more widgets will compound the duplication, and the bugs are real.

2. **Full state library adoption (Redux/Zustand)**: Overkill for self-contained demo widgets. useState/useReducer is appropriate. Only adopt Redux if widgets need to share state.

3. **CSS-in-JS instead of data-part CSS**: Would solve the duplication but conflicts with the existing engine theming system built around data-part selectors.

4. **Merge structural twins completely**: Oscilloscope and LogicAnalyzer could theoretically be one component with a mode prop. But they have genuinely different domain logic (analog waveforms vs digital signals) and keeping them separate is correct — they should just share primitives.

---

## 10. Open Questions

1. **Should `new Function()` be replaced or documented?** MacCalc's formula engine and MacRepl's REPL evaluation use `new Function()`. A safe parser would be more work but eliminates the security surface. For demo widgets, documenting the risk may be sufficient.

2. **Should ControlRoom instruments be promoted to top-level primitives?** The 9 instrument components in `instruments.tsx` are well-extracted and could be reusable beyond ControlRoom (e.g., in a dashboard builder). However, they're currently styled with hardcoded colors and Win95 aesthetic.

3. **Data-part prefix migration scope?** Renaming 5 widgets' prefixes means updating parts.ts, TSX files, and CSS files. Should this be done all at once or widget-by-widget?

4. **Priority of phases?** Phase 1 (bug fixes) and Phase 2 (top primitives) have the highest value-to-risk ratio. Phases 5-6 could be deferred indefinitely without harm.

---

## 11. References

### Key Files

| File | Purpose |
|------|---------|
| `packages/rich-widgets/src/index.ts` | Barrel export for all widgets |
| `packages/rich-widgets/src/parts.ts` | Data-part constant registry (~300 entries) |
| `packages/rich-widgets/src/theme/index.ts` | CSS barrel import (20 CSS files) |
| `packages/rich-widgets/src/primitives/Sparkline.tsx` | Only existing shared primitive |
| `packages/rich-widgets/src/launcher/modules.tsx` | LaunchableAppModule definitions |
| `packages/rich-widgets/src/launcher/RichWidgetsDesktop.stories.tsx` | Desktop integration story |

### Widget Files (by cleanup priority)

**High priority:**
- `oscilloscope/Oscilloscope.tsx` — structural twin, major extraction
- `logic-analyzer/LogicAnalyzer.tsx` — structural twin, major extraction
- `calculator/MacCalc.tsx` + `calculator/formula.ts` — highest state count, `new Function()`

**Medium priority:**
- `kanban/KanbanBoard.tsx` — module-level state, modal extraction
- `calendar/MacCalendar.tsx` — module-level state, modal + command palette extraction
- `system-modeler/SystemModeler.tsx` — module-level state, dialog extraction
- `repl/MacRepl.tsx` — `new Function()`, no engine components
- `game-finder/GameFinder.tsx` — many extractable patterns, structural twin
- `stream-launcher/StreamLauncher.tsx` — many extractable patterns, structural twin
- `music-player/RetroMusicPlayer.tsx` — high state count
- `youtube-retro/YouTubeRetro.tsx` — useMemo bug, high state count
- `deep-research/DeepResearch.tsx` — dead state
- `graph-navigator/GraphNavigator.tsx` — runaway animation
- `control-room/ControlRoom.tsx` — no CSS variables, no engine components
- `steam-launcher/SteamLauncher.tsx` — tab bar extraction

**Low priority:**
- `log-viewer/LogViewer.tsx` — well-structured
- `chart-view/ChartView.tsx` — minimal, smallest widget
- `mac-write/MacWrite.tsx` — mostly clean
- `node-editor/NodeEditor.tsx` — reasonably clean
- `chat-browser/ChatBrowser.tsx` — best-structured widget
