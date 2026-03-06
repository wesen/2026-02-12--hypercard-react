---
Title: Redux rollout backlog and sequencing
Ticket: OS-17-RICH-WIDGET-REDUX-ROLLOUT
Status: active
Topics:
    - frontend
    - widgets
    - state-management
    - storybook
    - planning
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - ttmp/2026/03/05/OS-16-RICH-WIDGET-REDUX-SLICE-STUDY--rich-widget-redux-slice-study-migration-design-and-intern-guide/design-doc/01-rich-widget-redux-slice-analysis-and-migration-design.md
    - packages/rich-widgets/src/log-viewer/LogViewer.tsx
    - packages/rich-widgets/src/calculator/MacCalc.tsx
    - packages/rich-widgets/src/calendar/MacCalendar.tsx
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-06T14:05:00-05:00
WhatFor: ""
WhenToUse: ""
---

# Redux rollout backlog and sequencing

This ticket executes the OS-16 migration plan. The rule for this rollout is:

- each widget is handled in a discrete task;
- each task includes the slice, story seeding, validation, and diary updates;
- each task should end in a commit before moving on.

## Status board

### Phase 1 — Durable widgets (`Redux now`)

- [x] `LogViewer`
- [x] `MacCalc`
- [x] `MacCalendar`
- [x] `KanbanBoard`
- [x] `DeepResearch`
- [x] `ChatBrowser`
- [x] `GameFinder`
- [x] `RetroMusicPlayer`
- [x] `StreamLauncher`
- [x] `SteamLauncher`
- [x] `YouTubeRetro`
- [x] `NodeEditor`
- [x] `SystemModeler`

### Phase 2 — Partial slices later

- [x] `GraphNavigator`
- [x] `MacRepl`
- [x] `LogicAnalyzer`
- [x] `ControlRoom`

### Phase 3 — Reassessed after partial slices

- [x] `ChartView`
- [x] `MacWrite`
- [x] `Oscilloscope`

## Execution notes

`LogViewer` is the first completed migration and establishes the execution pattern:

1. add a per-widget `app_rw_<widget>` state key;
2. create a serializable slice;
3. keep transient DOM-only behavior local;
4. seed deterministic Storybook states via Redux;
5. preserve non-Redux standalone usage when the widget is rendered outside launcher/store context.

The partial-slice phase is complete. `GraphNavigator`, `MacRepl`, `LogicAnalyzer`, and `ControlRoom` all use launcher-visible Redux state for durable controls and seeded Storybook scenarios, while keeping transient layout, timing, or DOM-interaction state local.

The post-review phase also changed direction: `ChartView`, `MacWrite`, and `Oscilloscope` were originally listed as local-only candidates, but the reassessment showed enough story-seedable durable UI state to justify slices. They are now migrated as well.

There is no remaining widget backlog in OS-17.
