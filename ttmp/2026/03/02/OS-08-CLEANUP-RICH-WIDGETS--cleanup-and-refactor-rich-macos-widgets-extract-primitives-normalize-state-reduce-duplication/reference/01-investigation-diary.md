---
Title: Investigation diary
Ticket: OS-08-CLEANUP-RICH-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/index.ts:Main barrel export for all widgets
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/parts.ts:Data-part constants registry
    - /home/manuel/workspaces/2026-03-01/add-macos-rich-widgets/go-go-os-frontend/packages/rich-widgets/src/theme/index.ts:CSS theme barrel import
ExternalSources: []
Summary: "Chronological record of the cleanup analysis investigation for OS-08"
LastUpdated: 2026-03-02T23:30:00-05:00
WhatFor: ""
WhenToUse: ""
---

# Investigation Diary — OS-08-CLEANUP-RICH-WIDGETS

## Step 1: Scope and approach (2026-03-02)

### Goal

Analyze all 20 rich widgets in `packages/rich-widgets/src/` for cleanup opportunities:
- Extractable primitives that appear across multiple widgets
- State management patterns (useState vs Redux vs useReducer)
- Code duplication (toolbar/statusbar/modal/search patterns)
- Canvas usage patterns
- Engine component integration gaps
- CSS naming consistency

### Approach

Launched 5 parallel research agents:
1. Group 1: LogViewer, ChartView, MacWrite, KanbanBoard, MacRepl
2. Group 2: NodeEditor, Oscilloscope, LogicAnalyzer, Calendar, GraphNavigator
3. Group 3: MacCalc, DeepResearch, GameFinder, RetroMusicPlayer, StreamLauncher
4. Group 4: SteamLauncher, YouTubeRetro, ChatBrowser, SystemModeler, ControlRoom
5. Cross-cutting: Pattern analysis, useState audit, engine usage, duplication detection

### Widget inventory

20 widgets total across these directories:
- `log-viewer/`, `chart-view/`, `mac-write/`, `kanban/`, `repl/`
- `node-editor/`, `oscilloscope/`, `logic-analyzer/`, `calendar/`, `graph-navigator/`
- `calculator/`, `deep-research/`, `game-finder/`, `music-player/`, `stream-launcher/`
- `steam-launcher/`, `youtube-retro/`, `chat-browser/`, `system-modeler/`, `control-room/`
- Plus `primitives/` (Sparkline only)

Awaiting agent results before writing conclusions.

## Step 2: Agent results and synthesis (2026-03-02)

### What happened

All 5 research agents completed successfully. Collected detailed analysis for all 20 widgets plus cross-cutting patterns.

### Key findings

**Duplication scale:**
- 12 widgets share near-identical toolbar CSS (flex row, gap, border-bottom, background)
- 14 widgets share near-identical status bar CSS
- 10 widgets share sidebar layout CSS
- 6 widgets hand-roll progress bars
- 7 widgets hand-roll empty states
- 3 widgets hand-roll radio buttons instead of using engine RadioButton
- 9 widgets have search/filter inputs

**Structural twins identified:**
- Oscilloscope ↔ LogicAnalyzer: identical animation loop, identical slider component (OscSlider at lines 33-68 = LaSlider at lines 43-78), same CRT bezel, same CSS structure
- GameFinder ↔ StreamLauncher: same sidebar+list+detail layout, same canvas pixel art utilities, same hand-rolled radio buttons

**Bugs found:**
- `new Function()` in MacRepl.tsx:202,248 and formula.ts:146,178
- Module-level mutable state in KanbanBoard.tsx:9, calendar/types.ts:53, SystemModeler.tsx:18
- `useMemo` with `Math.random()` in YouTubeRetro.tsx:217
- Dead state in DeepResearch.tsx:70-71 (webSearch, academicOnly never consumed by logic)
- GraphNavigator force simulation never stops (no velocity threshold)
- No devicePixelRatio in Oscilloscope and LogicAnalyzer canvas

**State management:** All 20 widgets use React useState exclusively. Zero Redux. Total 213 useState calls.

### What worked

- Parallel agent strategy was very effective — 5 agents analyzing 4 widgets each completed in ~5 minutes
- Cross-cutting agent provided excellent summary tables with exact line references
- Verification agent confirmed line numbers and caught corrections (MacCalendar nextId is in types.ts not the main file)

### What didn't work

- Initial assumption that MacCalc used `new Function()` directly — it's in the imported formula.ts module
- Initial assumption that MacCalendar had module-level state in the main file — it's in types.ts

### Report written

Synthesized all agent results into the design doc at:
`design-doc/01-rich-widgets-cleanup-report-widget-by-widget-analysis.md`

Report contains:
1. Executive summary
2. Problem statement with widget inventory table
3. Current architecture (package structure, state management, engine usage, CSS theming)
4. Widget-by-widget analysis (all 20 widgets with issues, extractable patterns, cleanup priority)
5. Cross-cutting analysis (extractable primitives, state audit, engine gaps, CSS naming, structural twins)
6. Bug inventory with file:line references
7. 6-phase implementation plan (bug fixes → primitives → specialized primitives → engine adoption → naming → state)
8. Testing and validation strategy
9. Risks and alternatives
10. Open questions
11. References with priority-ordered file list

### Code review instructions

When reviewing the design doc, verify:
- Bug line numbers match current source (confirmed via verification agent)
- useState counts match (confirmed via cross-cutting agent grep)
- CSS duplication claims can be verified by diffing any two toolbar/statusbar CSS rules
- Structural twin claims can be verified by comparing OscSlider and LaSlider source

## Step 3: Post-cleanup code review (2026-03-02)

### Goal

After completing all 6 implementation phases (OS-09 through OS-14), perform a fresh review to assess:
1. useReducer adoption completeness across all widgets
2. Widget modularity — are any too large or monolithic?
3. General code quality — CSS theming, primitive adoption, dead code, TypeScript errors

### What happened

Launched 5 parallel audit agents:

1. **Widget sizes/modularity** — Ranked all widgets by line count and component count
2. **State management** — Audited useReducer adoption, identified remaining candidates
3. **CSS theming** — Scanned for standalone hex colors, inline styles, inconsistent fallbacks
4. **Code quality** — Checked TS errors, `any` types, bare timeouts, React.memo usage
5. **Primitive adoption** — Measured how many widgets actually use the shared primitives

### Key findings

**Widget size (top 5 by line count):**

| Widget | Lines | Components | Issue |
|--------|-------|------------|-------|
| MacCalc | 1098 | 2 | Only FindBar extracted |
| GraphNavigator | 717 | 1 | Monolithic, 9 useRef |
| MacCalendar | 694 | 2 | 35 inline styles |
| KanbanBoard | 637 | 2 | Reasonable after useReducer |
| LogViewer | 539 | 1 | Monolithic |

5 monolithic widgets (single component, 400+ lines): LogViewer, LogicAnalyzer, MacRepl, MacWrite, Oscilloscope.

Best-structured widgets: SteamLauncher (9 components), instruments.tsx (9), SystemModeler (7), GameFinder (6).

**State management gaps:**

3 widgets now use useReducer (KanbanBoard, RetroMusicPlayer, MacCalc). 6 remaining candidates prioritized:
1. YouTubeRetro (13 useState, `openVideo()` fires 6 setters)
2. MacRepl (11 useState, `handleSubmit` fires 6 setters)
3. SystemModeler (11 useState, `deleteSelected` updates 3 states)
4. Oscilloscope (15 useState — but all independent, low benefit)
5. LogicAnalyzer (12 useState, "Defaults" resets 4)
6. NodeEditor (9 useState, implicit state machine)

**Primitive adoption gaps:**
- ButtonGroup: 0/20 adoption despite 4+ candidates (MacCalendar, MacCalc, GameFinder, KanbanBoard)
- SearchBar: 1/6 eligible (only StreamLauncher uses it)
- DeepResearch defines a local shadow ProgressBar instead of importing the shared one
- GraphNavigator uses raw rAF instead of useAnimationLoop
- RetroMusicPlayer has bare `type="range"` instead of LabeledSlider

**CSS theming violations:**
- system-modeler.css: 14 standalone hex values
- youtube-retro.css: 8 standalone hex values
- logic-analyzer.css: 3 standalone hex values
- `--hc-color-row-odd` has 11 different fallback values across files
- 72 of 677 data-part constants (10.6%) are defined in parts.ts but never used

**Code quality:**
- 9 TypeScript errors (4 Oscilloscope Checkbox onChange, 3 launcher path alias, 2 ButtonGroup rootDir)
- Zero `any` types, zero TODO/FIXME, zero console.log — clean
- Zero React.memo usage (performance gap for complex widgets)
- 6 bare setTimeout calls without cleanup (SteamLauncher 2, MacWrite 4)
- Zero error boundaries

### What worked

- Parallel audit agents covered different dimensions efficiently
- Evidence-anchored approach (exact file:line citations) made the report actionable
- Categorizing findings by severity (must-fix vs nice-to-have) keeps the report practical

### What didn't work

- Initial assumption that "use redux everywhere" meant literal Redux — the user meant useReducer pattern, which was already the approach taken in Phase 6

### Report written

Synthesized all audit results into the second design doc at:
`design-doc/02-post-cleanup-code-review-modularity-state-management-and-code-quality.md`

Report contains:
1. Executive summary
2. Widget size/modularity analysis with rankings
3. State management audit with useReducer priority candidates
4. Primitive adoption gap analysis
5. CSS theming issues (hex colors, fallback inconsistency, inline styles, dead parts)
6. Code quality findings (TS errors, performance, hygiene)
7. Recommended next steps in 6 phases (A through F)
8. Complete reference tables

### Code review instructions

When reviewing the post-cleanup design doc, verify:
- Widget line counts match current source (after all Phase 1-6 changes)
- useReducer adoption counts are accurate (3 converted, 2 skipped, 6 remaining candidates)
- Standalone hex color counts can be verified with `rg '#[0-9a-fA-F]{3,6}' <css-file>`
- Dead data-part count can be verified by diffing parts.ts exports against grep results in TSX files
