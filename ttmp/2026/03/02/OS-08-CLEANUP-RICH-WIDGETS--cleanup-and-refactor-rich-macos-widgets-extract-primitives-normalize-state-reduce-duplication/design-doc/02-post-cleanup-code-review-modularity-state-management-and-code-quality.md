---
Title: 'Post-cleanup code review: modularity, state management, and code quality'
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
    - Path: packages/rich-widgets/src/calculator/MacCalc.tsx
      Note: Largest widget at 1098 lines
    - Path: packages/rich-widgets/src/calculator/MacCalc.tsx:Largest widget at 1098 lines
    - Path: packages/rich-widgets/src/calendar/MacCalendar.tsx
      Note: 694 lines
    - Path: packages/rich-widgets/src/calendar/MacCalendar.tsx:694 lines, 35 inline styles
    - Path: packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx
      Note: 717 lines monolithic
    - Path: packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx:717 lines, 9 useRef, raw rAF
    - Path: packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx:15 useState, 4 TS errors
    - Path: packages/rich-widgets/src/parts.ts
      Note: 677 data-part constants
    - Path: packages/rich-widgets/src/parts.ts:677 data-part constants, 72 unused
    - Path: packages/rich-widgets/src/primitives/ButtonGroup.tsx
      Note: 0/20 adoption across widgets
    - Path: packages/rich-widgets/src/primitives/ButtonGroup.tsx:Created but zero adoption
    - Path: packages/rich-widgets/src/primitives/SearchBar.tsx:Only 1 of 6 eligible widgets adopted
    - Path: packages/rich-widgets/src/theme/control-room.css:Migrated to CSS vars (2 decorative hex remain)
    - Path: packages/rich-widgets/src/theme/system-modeler.css
      Note: 14 standalone hex violations
    - Path: packages/rich-widgets/src/theme/system-modeler.css:14 standalone hex colors
    - Path: packages/rich-widgets/src/theme/youtube-retro.css
      Note: 8 standalone hex violations
    - Path: packages/rich-widgets/src/youtube-retro/YouTubeRetro.tsx:13 useState, 8 standalone hex colors
ExternalSources: []
Summary: 'Post-Phase-6 code review: widget modularity, useReducer adoption, primitive coverage, CSS theming, and code quality audit across all 20 rich widgets'
LastUpdated: 2026-03-02T23:30:00-05:00
WhatFor: Identify remaining cleanup work after the 6-phase refactoring
WhenToUse: When planning further widget cleanup or reviewing current codebase health
---


# Post-Cleanup Code Review: Modularity, State Management, and Code Quality

## 1. Executive Summary

After completing 6 phases of cleanup (OS-09 through OS-14), the rich-widgets package is substantially improved: 11 shared primitives extracted, 3 widgets converted to useReducer, naming standardized, and engine components adopted. However, a fresh audit of all 20 widgets reveals significant remaining work:

- **State management**: 7 widgets with 10+ useState calls still lack useReducer. Oscilloscope (15 useState), YouTubeRetro (13), and MacRepl (11) are the highest-priority candidates.
- **Widget size**: MacCalc (1098 lines), GraphNavigator (717), and MacCalendar (694) need sub-component extraction.
- **Primitive adoption gaps**: ButtonGroup has zero consumers despite 4+ textbook candidates. SearchBar has only 1 consumer out of 6 eligible widgets.
- **CSS theming**: system-modeler.css (14) and youtube-retro.css (8) have standalone hardcoded hex colors. CSS variable fallback values are inconsistent across files.
- **Dead code**: 72 of 677 data-part constants (10.6%) are defined but never used.
- **Type safety**: 4 TypeScript errors in Oscilloscope (Checkbox onChange signature mismatch).
- **Performance**: Zero React.memo usage across the entire package. No error boundaries.

The codebase is in solid shape for a widget library at this stage. The issues identified are maintenance-level cleanups, not architectural problems.

---

## 2. Widget Size and Modularity

### 2.1. File Size Rankings

Every widget TSX file, sorted by line count. Files over 500 lines are flagged for sub-component extraction.

| Lines | Widget | Components | useState | useReducer | Assessment |
|-------|--------|-----------|----------|------------|------------|
| **1098** | MacCalc | 2 | 2 (FindBar) | Yes | Extract grid renderer, cell editor, toolbar |
| **717** | GraphNavigator | 2 | 10 | No | Extract inspector panel, console, node list |
| **694** | MacCalendar | 4 | 12 | No | Extract week view, month view as sub-components |
| **596** | SystemModeler | 7 | 11 | No | Already modular (7 components); consider useReducer |
| **540** | RetroMusicPlayer | 3 | 1 (EqViz) | Yes | Reasonable size for its complexity |
| **539** | LogViewer | 1 | 10 | No | Single monolithic component; extract sidebar, detail panel |
| **514** | LogicAnalyzer | 1 | 12 | No | Single monolithic component; extract controls panel |
| 501 | KanbanBoard | 3 | 5 (TaskModal) | Yes | Good structure after refactoring |
| 498 | NodeEditor | 3 | 9 | No | Moderate; interaction state is a state-machine candidate |
| 492 | MacRepl | 1 | 11 | No | Terminal state machine; strong useReducer candidate |
| 480 | YouTubeRetro | 4 | 13 | No | openVideo() fires 6 setters atomically |
| 478 | GameFinder | 6 | 10 | No | Already modular (6 components) |
| 473 | MacWrite | 1 | 8 | No | 8 useCallback; extract toolbar, find bar |
| 430 | instruments.tsx | 9 | 0 | No | Excellent modularity (9 instrument components) |
| 426 | Oscilloscope | 1 | 15 | No | 15 independent slider/toggle states |
| 398 | SteamLauncher | 9 | 8 | No | Excellent modularity (9 sub-components) |
| 339 | StreamLauncher | 4 | 9 | No | Moderate |
| 330 | ChatBrowser | 4 | 6 | No | Good structure |
| 292 | ChartView | 3 | 4 | No | Clean, small |
| 290 | DeepResearch | 3 | 9 | No | Moderate |
| 199 | ControlRoom | — | 7 | No | Thin orchestrator; logic in instruments.tsx |

### 2.2. Monolithic Components (single component, 400+ lines)

These widgets define only 1 exported component with no internal sub-component extraction:

| Widget | Lines | Issue |
|--------|-------|-------|
| LogViewer | 539 | Sidebar, detail panel, and table are all inline JSX |
| LogicAnalyzer | 514 | Controls panel and display area are one function |
| MacRepl | 492 | Terminal output, input, and completion popup are inline |
| MacWrite | 473 | Editor, preview, toolbar, find bar are all inline |
| Oscilloscope | 426 | All controls and display in one function |

**Recommendation**: Extract 2-3 sub-components per widget to bring each under 300 lines. The split points are natural: controls panel vs display area, sidebar vs main content, toolbar vs body.

### 2.3. Well-Structured Widgets (good modularity models)

| Widget | Components | Pattern |
|--------|-----------|---------|
| SteamLauncher | 9 | Library, Store, Community, Friends, Downloads as separate components |
| instruments.tsx | 9 | Each instrument (Gauge, Knob, LED, etc.) is its own component |
| SystemModeler | 7 | SvgBlock, SvgWire, ParamDialog, etc. extracted |
| GameFinder | 6 | GameProgress, StarRating, achievement renderer extracted |

---

## 3. State Management

### 3.1. Current useReducer Adoption

Three widgets were converted in Phase 6:

| Widget | Actions | State Groups |
|--------|---------|--------------|
| KanbanBoard | 12 | data, filters, UI |
| RetroMusicPlayer | 14 | playback, UI, settings |
| MacCalc | 19 | data, selection, editing, UI |

All three reducers are well-structured: typed state, discriminated union actions, defined above the component. Sub-component local state (TaskModal, EqViz, FindBar) is correctly kept as useState.

### 3.2. Remaining High-useState Widgets

Priority ranking for useReducer migration, based on atomic multi-setter patterns:

| Priority | Widget | useState | Key Atomicity Issue |
|----------|--------|----------|---------------------|
| **1** | YouTubeRetro | 13 | `openVideo()` fires 6 setters; `goHome()` fires 2 |
| **2** | MacRepl | 11 | `handleSubmit` fires 6 setters; history nav fires 2; tab-complete fires 3 |
| **3** | SystemModeler | 11 | `deleteSelected` updates 3 states; `startSim` updates 2 |
| **4** | Oscilloscope | 15 | 14 vars in one useCallback dep array; natural CH1/CH2/display groups |
| **5** | LogicAnalyzer | 12 | "Defaults" resets 4 vars; 10-dep draw callback |
| **6** | NodeEditor | 9 | Interaction state (drag/pan/draw) forms implicit state machine |
| Lower | LogViewer | 10 | Mostly independent toggles |
| Lower | MacCalendar | 12 | Only 5 main-component vars (6 are in EventModal form) |
| Skip | MacWrite | 8 | Independent toggles and callbacks |
| Skip | ChatBrowser | 6 | Low coupling |
| Skip | SteamLauncher | 8 | Independent toggles |

**YouTubeRetro** is the highest-priority candidate: its `openVideo()` function sets `currentVideo`, `view`, `playing=true`, `elapsed=0`, `userComments=[]`, `commentText=''` in 6 separate setState calls. A single `OPEN_VIDEO` action would replace all of them.

**MacRepl** is the second-highest: terminal state is inherently a state machine. `handleSubmit` modifies `historyStack`, `lines`, `input`, `historyIndex`, `suggestion`, `showCompletion` in sequence. Tab-completion and history navigation each modify 2-3 variables atomically.

### 3.3. Context and Prop Drilling

No `useContext` or `createContext` usage exists in any widget. All state sharing is via props and callbacks. No prop drilling was detected — sub-components receive semantic callbacks (e.g., `onEdit`, `onDragStart`) rather than raw dispatch or setState functions.

---

## 4. Primitive Adoption

### 4.1. Adoption Summary

| Primitive | Adopted | Eligible | Gap |
|-----------|---------|----------|-----|
| WidgetToolbar | 12/20 | 15 | ChartView, GraphNavigator, GameFinder |
| WidgetStatusBar | 14/20 | 14 | Fully adopted where applicable |
| ModalOverlay | 5/20 | 5 | Fully adopted |
| EmptyState | 7/20 | 8 | GraphNavigator (`gnEmptyInspector`) |
| LabeledSlider | 2/20 | 3 | RetroMusicPlayer (bare `type="range"`) |
| **SearchBar** | **1/20** | **6** | **GameFinder, KanbanBoard, RetroMusicPlayer, ChatBrowser, YouTubeRetro** |
| Separator | 7/20 | 7 | Fully adopted |
| ProgressBar | 3/20 | 4 | DeepResearch (local shadow copy) |
| CommandPalette | 2/20 | 2 | Fully adopted |
| useAnimationLoop | 2/20 | 3 | GraphNavigator (3 raw rAF calls) |
| **ButtonGroup** | **0/20** | **4+** | **MacCalendar, MacCalc, GameFinder, KanbanBoard** |

### 4.2. Critical Gaps

**ButtonGroup** (zero adoption): Created in Phase 3 but never migrated. Direct textbook candidates:
- MacCalendar: month/week view toggle (2 options, mutually exclusive)
- MacCalc: plain/number format toggle (2 options, mutually exclusive)
- GameFinder: filter buttons
- KanbanBoard: priority filter buttons

**SearchBar** (1 of 6 eligible): Only StreamLauncher adopted it. Five other widgets have bare `<input placeholder="Search...">` patterns that match the SearchBar API:
- `GameFinder.tsx` — custom `data-part={P.gfSearchBar}` wrapper
- `KanbanBoard.tsx` — bare input
- `RetroMusicPlayer.tsx` — bare input
- `ChatBrowser.tsx` — bare input
- `YouTubeRetro.tsx` — bare input

**DeepResearch ProgressBar shadow**: `DeepResearch.tsx` defines a local `function ProgressBar` (line 38) with its own `data-part` namespace instead of importing the shared primitive.

**GraphNavigator rAF**: Uses raw `requestAnimationFrame` at 3 call sites (lines 108, 114, 145) instead of `useAnimationLoop`.

### 4.3. Intentional Non-Adoptions

These are not gaps — the primitives don't fit:
- RetroMusicPlayer/YouTubeRetro/StreamLauncher progress bars are interactive seek bars (clickable to seek). The shared ProgressBar is read-only.
- MacRepl has no toolbar concept — it's a pure terminal.
- ControlRoom's title bar is structurally different from WidgetToolbar.

---

## 5. CSS Theming

### 5.1. Standalone Hardcoded Hex Colors (not in var() fallbacks)

| File | Count | Colors | Intent |
|------|-------|--------|--------|
| system-modeler.css | **14** | `#fff`, `#000`, `#ccc`, `#ddd` | Canvas grid, drag handles |
| youtube-retro.css | **8** | `#1a1a1a`, `#000`, `#fff`, `#aaa` | CRT dark backgrounds |
| logic-analyzer.css | **3** | `#0a0a12`, `#404040`, `#e0e0e0` | Bezel inset bevel |
| stream-launcher.css | **2** | `#111`, `#fff` | Player dark background |
| control-room.css | **2** | `#33ff33` (x2) | Seven-seg phosphor (decorative) |
| oscilloscope.css | **1** | `#1a1a1a` | CRT background |
| primitives.css | **1** | `#fff` | Stray value |

**15 other CSS files have zero standalone hex colors** — they are fully compliant.

`system-modeler.css` (14 violations) and `youtube-retro.css` (8 violations) are the clear targets. Most values map directly to `--hc-color-bg`, `--hc-color-fg`, or `--hc-color-border`.

### 5.2. Inconsistent CSS Variable Fallbacks

The same variable has different fallback hex values across different widget CSS files:

| Variable | Unique Fallbacks | Range |
|----------|-----------------|-------|
| `--hc-color-row-odd` | **11** | `#ccc` to `#f9f9f9` |
| `--hc-color-alt` | **10** | `#c0c0c0` to `#f8f8f5` |
| `--hc-color-row-hover` | **4** | `#b8b8ff` (blue-tinted) to `#e8e8e8` (grey) |

When the host app does not provide tokens, each widget renders a different shade for alternating rows, backgrounds, and hover states. A canonical fallback palette defined once (e.g., in `primitives.css` as `:root` defaults) would eliminate this inconsistency.

### 5.3. Inline Styles (potential CSS extraction)

Top offenders:

| Widget | `style={` count | Typical patterns |
|--------|----------------|------------------|
| LogViewer | **46** | fontSize, fontWeight, flex, overflow |
| MacCalendar | **35** | Modal sizing, flex layout, opacity |
| MacCalc | **29** | Toolbar button padding (5 identical blocks) |
| GraphNavigator | **22** | Panel sizing, flex layout |
| MacWrite | **19** | Editor/preview dimensions |

MacCalc has 5 toolbar buttons with identical `style={{ fontSize: 12, padding: '2px 7px' }}` — a single CSS rule on the data-part selector would replace all of them.

### 5.4. Dead Data-Part Constants

72 of 677 defined parts (10.6%) are never referenced in any TSX file:

| Category | Count | Examples |
|----------|-------|---------|
| Toolbar/StatusBar slots | 26 | `kbToolbar`, `lvToolbar`, `oscToolbar` — these widgets now use shared `WidgetToolbar` which uses `widgetToolbar` part |
| Separator slots | 8 | `kbSeparator`, `mwSeparator`, `oscSeparator` — migrated to shared `Separator` |
| EmptyState slots | 7 | `gfEmptyState`, `mpEmptyState` — migrated to shared `EmptyState` |
| Slider duplicates | 6 | `oscSlider`, `oscSliderLabel`, `laSlider` — migrated to shared `LabeledSlider` |
| Palette duplicates | 12 | `calcPalette*`, `calPalette*` — migrated to shared `CommandPalette` |
| Misc | 13 | Various unused feature-specific parts |

These should be removed from `parts.ts` and their corresponding CSS rules (if any) deleted.

---

## 6. Code Quality

### 6.1. TypeScript Errors

9 pre-existing errors across 3 files:

| File | Errors | Root Cause |
|------|--------|------------|
| Oscilloscope.tsx | 4 | `Checkbox` onChange expects `() => void` but receives `Dispatch<SetStateAction<boolean>>`. Fix: wrap in lambda like LogicAnalyzer does. |
| launcher/modules.tsx | 3 | Missing `@hypercard/desktop-os` path alias in tsconfig. |
| ButtonGroup.tsx | 2 | `@hypercard/engine` path alias resolves outside rootDir. |

The Oscilloscope fix is trivial — change `onChange={setChannel2}` to `onChange={() => setChannel2(v => !v)}` at 4 locations.

### 6.2. Performance

**React.memo**: Zero usage across the entire package. Sub-components that render frequently (e.g., `StarRating` in GameFinder, `AnalogGauge` in ControlRoom) would benefit from memoization.

**Bare setTimeout without cleanup**: `SteamLauncher.tsx` (2 calls) and `MacWrite.tsx` (4 calls) use `setTimeout` without storing the timeout ID for cleanup. If the component unmounts during the timeout, the callback will attempt a state update on an unmounted component.

**No error boundaries**: Zero `ErrorBoundary` implementations. An error in any widget will crash the entire desktop shell tree.

### 6.3. Code Hygiene

- **`any` types**: Zero. Clean.
- **TODO/FIXME/HACK**: Zero. Clean.
- **console.log**: 1 live occurrence in `MacWrite.stories.tsx` (Storybook only).
- **Sample data in default props**: 3 widgets (`GameFinder`, `MacCalendar`, `MacWrite`) import sample data as default prop values, meaning it ships in production bundles even when not used.

---

## 7. Recommended Next Steps

Ordered by impact and effort:

### Phase A: Quick Wins (low effort, high impact)

1. **Remove 72 dead data-part constants** from `parts.ts` and their corresponding CSS rules. Effort: 1 hour.
2. **Fix 4 Oscilloscope TypeScript errors**: wrap Checkbox onChange in lambdas. Effort: 10 minutes.
3. **Remove stray `#fff` from primitives.css** line 201. Effort: 1 minute.
4. **Migrate DeepResearch** to shared `ProgressBar` primitive. Effort: 15 minutes.

### Phase B: Primitive Adoption (medium effort, high consistency)

5. **Migrate 5 widgets to SearchBar**: GameFinder, KanbanBoard, RetroMusicPlayer, ChatBrowser, YouTubeRetro. Effort: 1-2 hours.
6. **Migrate 2-4 widgets to ButtonGroup**: MacCalendar (view toggle), MacCalc (fmt toggle), GameFinder (filters), KanbanBoard (priority). Effort: 1-2 hours.
7. **Migrate GraphNavigator to useAnimationLoop**: replace 3 raw rAF calls. Effort: 30 minutes.
8. **Migrate RetroMusicPlayer to LabeledSlider**: replace bare `type="range"`. Effort: 15 minutes.

### Phase C: State Management (medium-high effort, correctness)

9. **Convert YouTubeRetro to useReducer**: 13 useState, `openVideo()` atomicity. Effort: 1-2 hours.
10. **Convert MacRepl to useReducer**: 11 useState, terminal state machine. Effort: 1-2 hours.
11. **Convert SystemModeler to useReducer**: 11 useState, atomic block/wire operations. Effort: 1-2 hours.
12. **Convert Oscilloscope to useReducer**: 15 useState in single draw deps array. Effort: 1 hour.
13. **Convert LogicAnalyzer to useReducer**: 12 useState, "Defaults" reset. Effort: 1 hour.
14. **Convert NodeEditor to useReducer**: 9 useState, drag/pan/wire state machine. Effort: 1-2 hours.

### Phase D: CSS Theming (medium effort, visual consistency)

15. **Migrate system-modeler.css** hex colors to CSS variables (14 values). Effort: 30 minutes.
16. **Migrate youtube-retro.css** hex colors to CSS variables (8 values). Effort: 20 minutes.
17. **Migrate logic-analyzer.css and stream-launcher.css** (3+2 values). Effort: 15 minutes.
18. **Standardize CSS variable fallbacks**: Define canonical fallback palette in `primitives.css` as `:root` defaults for `--hc-color-row-odd`, `--hc-color-alt`, `--hc-color-row-hover`. Effort: 30 minutes.

### Phase E: Modularity (high effort, maintainability)

19. **Extract MacCalc sub-components**: Grid renderer, cell editor, formula bar, toolbar. Target: main component under 400 lines. Effort: 2-3 hours.
20. **Extract LogViewer sub-components**: Sidebar, detail panel, table. Effort: 1-2 hours.
21. **Extract LogicAnalyzer sub-components**: Controls panel, display area. Effort: 1 hour.
22. **Extract MacRepl sub-components**: Output area, completion popup, input line. Effort: 1 hour.
23. **Extract MacWrite sub-components**: Toolbar, find bar, preview pane. Effort: 1 hour.
24. **Extract inline styles to CSS** for LogViewer (46), MacCalendar (35), MacCalc (29). Effort: 2-3 hours.

### Phase F: Reliability (low-medium effort, production readiness)

25. **Add error boundaries**: Wrap each widget in an `ErrorBoundary` that renders a fallback. Effort: 1 hour.
26. **Clean up bare setTimeout calls**: Add cleanup via `useEffect` return in SteamLauncher (2) and MacWrite (4). Effort: 30 minutes.
27. **Add React.memo** to pure sub-components: `StarRating`, `AnalogGauge`, `Scope`, `LED`, `TaskCard`, etc. Effort: 1 hour.
28. **Move sample data out of default props**: Lazy-load or keep in stories only for GameFinder, MacCalendar, MacWrite. Effort: 30 minutes.

---

## 8. References

### Widget Files (sorted by line count)

| Lines | Path |
|-------|------|
| 1098 | `packages/rich-widgets/src/calculator/MacCalc.tsx` |
| 717 | `packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx` |
| 694 | `packages/rich-widgets/src/calendar/MacCalendar.tsx` |
| 596 | `packages/rich-widgets/src/system-modeler/SystemModeler.tsx` |
| 540 | `packages/rich-widgets/src/music-player/RetroMusicPlayer.tsx` |
| 539 | `packages/rich-widgets/src/log-viewer/LogViewer.tsx` |
| 514 | `packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx` |
| 501 | `packages/rich-widgets/src/kanban/KanbanBoard.tsx` |
| 498 | `packages/rich-widgets/src/node-editor/NodeEditor.tsx` |
| 492 | `packages/rich-widgets/src/repl/MacRepl.tsx` |
| 480 | `packages/rich-widgets/src/youtube-retro/YouTubeRetro.tsx` |
| 478 | `packages/rich-widgets/src/game-finder/GameFinder.tsx` |
| 473 | `packages/rich-widgets/src/mac-write/MacWrite.tsx` |
| 430 | `packages/rich-widgets/src/control-room/instruments.tsx` |
| 426 | `packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx` |
| 398 | `packages/rich-widgets/src/steam-launcher/SteamLauncher.tsx` |
| 339 | `packages/rich-widgets/src/stream-launcher/StreamLauncher.tsx` |
| 330 | `packages/rich-widgets/src/chat-browser/ChatBrowser.tsx` |
| 292 | `packages/rich-widgets/src/chart-view/ChartView.tsx` |
| 290 | `packages/rich-widgets/src/deep-research/DeepResearch.tsx` |
| 199 | `packages/rich-widgets/src/control-room/ControlRoom.tsx` |

### Shared Infrastructure

| Path | Purpose |
|------|---------|
| `packages/rich-widgets/src/parts.ts` | 677 data-part constants (72 unused) |
| `packages/rich-widgets/src/index.ts` | Barrel exports (335 lines) |
| `packages/rich-widgets/src/theme/` | 23 CSS files, 6081 total lines |
| `packages/rich-widgets/src/primitives/` | 12 components + 1 hook, 477 lines |
