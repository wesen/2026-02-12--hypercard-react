---
Title: Implementation diary
Ticket: OS-14-PHASE6-STATE-RESTRUCTURING
Status: active
Topics:
    - frontend
    - widgets
    - state-management
    - refactoring
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/kanban/KanbanBoard.tsx:Restructured to useReducer (8 useState → 12 actions)
    - packages/rich-widgets/src/music-player/RetroMusicPlayer.tsx:Restructured to useReducer (13 useState → 14 actions)
    - packages/rich-widgets/src/calculator/MacCalc.tsx:Restructured to useReducer (12 useState → 19 actions)
ExternalSources: []
Summary: "Implementation diary for Phase 6: restructuring state management with useReducer"
LastUpdated: 2026-03-02T23:00:00-05:00
WhatFor: "Track what changed during Phase 6 state restructuring"
WhenToUse: "When reviewing Phase 6 changes or debugging state management issues"
---

# Implementation Diary — OS-14-PHASE6-STATE-RESTRUCTURING

## Step 1: Restructure 3 widgets to useReducer

### What changed

Converted 3 widgets from multiple `useState` calls to `useReducer` with typed state and discriminated union actions:

| Widget | useState | Actions | State Groups |
|--------|----------|---------|--------------|
| KanbanBoard | 8 → 1 | 12 | data, filters, UI |
| RetroMusicPlayer | 13 → 1 | 14 | playback, UI, settings |
| MacCalc | 12 → 1 | 19 | data, selection, editing, UI |

Each widget now has:
- A `XxxState` interface for the combined state
- A `XxxAction` discriminated union for all actions
- A `xxxReducer` pure function above the component
- Single `useReducer(reducer, initialState)` call
- Destructured state for backward-compatible reads

### Design decisions

1. **Compound actions for correlated updates**: `PLAY_TRACK` (MusicPlayer) atomically sets `currentTrack`, `trackIdx`, `playing`, `elapsed` — eliminating 4 separate setState calls and potential intermediate renders.

2. **CLEAR_FILTERS action (KanbanBoard)**: Replaces 3 separate setter calls with a single dispatch, ensuring all filters reset atomically.

3. **NAVIGATE action (MacCalc)**: Atomically commits any active edit AND moves the selection cursor. Previously required calling `commitEdit()` then `setSel()` then `setSelRange(null)` — three separate updates.

4. **TICK action (MusicPlayer)**: Replaces `setElapsed(e => e+1)` functional update. The reducer increments `elapsed` by 1 without needing to capture previous state in a closure.

5. **UPDATE_CELLS updater pattern (MacCalc)**: The `UPDATE_CELLS` action accepts an updater function `(prev) => next` to handle the complex cell computation logic that was previously in `setCells(prev => ...)`.

### What was skipped

- **Oscilloscope (14 useState)**: All states are independent slider/toggle values (frequency, amplitude, timebase, etc.). Each is set by a single slider's `onChange`. useReducer would add 14 trivial `SET_XXX` actions without meaningful grouping benefit.

- **MacCalendar (5 main useState + 6 in EventModal)**: The main component only has 5 states (`view`, `currentDate`, `events`, `editEvent`, `showPalette`). EventModal has 6 local form states. Neither crosses the complexity threshold for useReducer.

### Commit

`2d92c61 refactor(rich-widgets): restructure KanbanBoard, RetroMusicPlayer, MacCalc to useReducer`

---

## Verification

- TypeScript check: no new errors (all remaining are pre-existing)
- All subcomponents (TaskModal, EqViz, FindBar) retain their own local useState — unchanged

## Code review instructions

1. **KanbanBoard MOVE_TASK vs SET_TASKS**: The reducer handles task column reassignment internally — verify the task matching logic uses the correct id field.
2. **MusicPlayer TICK**: Used in a `setInterval` inside useEffect. Verify the interval cleanup still works correctly with dispatch.
3. **MacCalc COMMIT_EDIT**: The reducer computes the new cell value from `state.editVal` and `state.sel`. Verify the `evaluateCell` formula logic is correctly called inside the reducer.
4. **MacCalc NAVIGATE**: Verify that the reducer's commit-then-move logic matches the original `commitEdit()` → `setSel()` → `setSelRange(null)` sequence.
