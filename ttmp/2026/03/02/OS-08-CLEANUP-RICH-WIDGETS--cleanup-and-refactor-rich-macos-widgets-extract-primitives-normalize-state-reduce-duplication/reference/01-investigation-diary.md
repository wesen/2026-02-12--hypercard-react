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
LastUpdated: 2026-03-02T14:28:16.887913457-05:00
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
