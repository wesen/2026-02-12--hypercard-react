---
Title: 'Phase 6 Implementation Plan: State Restructuring'
Ticket: OS-14-PHASE6-STATE-RESTRUCTURING
Status: active
Topics:
    - frontend
    - widgets
    - state-management
    - refactoring
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/calculator/MacCalc.tsx:17 useState calls
    - packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx:15 useState calls
    - packages/rich-widgets/src/music-player/RetroMusicPlayer.tsx:15 useState calls
    - packages/rich-widgets/src/kanban/KanbanBoard.tsx:14 useState calls
    - packages/rich-widgets/src/calendar/MacCalendar.tsx:14 useState calls
ExternalSources: []
Summary: "Restructure top-5 highest-state widgets from many useState calls to grouped useReducer patterns for improved readability."
LastUpdated: 2026-03-02T17:00:00-05:00
WhatFor: "Guide state management restructuring in complex widgets"
WhenToUse: "When implementing Phase 6 of the rich widgets cleanup"
---

# Phase 6 Implementation Plan: State Restructuring

## Executive Summary

Five widgets have 14-17 useState calls each. While functionally correct, this many independent state variables reduces readability and increases the risk of inconsistent state updates. This phase groups related state into useReducer patterns.

**Parent ticket:** OS-08-CLEANUP-RICH-WIDGETS
**Depends on:** All previous phases (this is the final, optional phase)
**Estimated scope:** ~200 lines changed per widget
**Risk level:** Higher — state restructuring can introduce subtle rendering bugs

---

## Problem Statement

Total useState count across 20 widgets is 213. The top 5 widgets account for 75 of those. Each widget has related state that changes together (e.g., a music player's currentTrack/playing/elapsed/volume).

---

## Proposed Restructuring

### MacCalc (17 → ~4 state groups)

```tsx
type CalcState = {
  grid: CellState;      // cells, selection, editing, formula bar
  ui: UIState;          // view mode, palette visibility, find/replace
  format: FormatState;  // bold, italic, align, formatPaint
  clipboard: ClipState; // copied cells, cut flag
};
```

### Oscilloscope (15 → ~3 state groups)

```tsx
type OscState = {
  channelA: ChannelConfig; // freq, amp, phase, color, visible
  channelB: ChannelConfig;
  display: DisplayConfig;  // mode, timebase, trigger, running
};
```

### RetroMusicPlayer (15 → ~3 state groups)

```tsx
type PlayerState = {
  playback: PlaybackState;  // currentTrack, playing, elapsed, volume, shuffle, repeat
  library: LibraryState;    // view, search, selectedPlaylist, queue
  ui: UIState;              // activePanel, showQueue
};
```

### KanbanBoard (14 → ~3 state groups)

```tsx
type KanbanState = {
  board: BoardData;    // columns, tasks
  drag: DragState;     // dragging, dragOver
  modal: ModalState;   // editingTask, newTaskColumn, search
};
```

### MacCalendar (14 → ~3 state groups)

```tsx
type CalendarState = {
  calendar: CalData;   // events, selectedDate, viewDate
  view: ViewState;     // mode (month/week), paletteOpen
  modal: ModalState;   // editingEvent, form fields
};
```

---

## Implementation Plan

### Per-widget approach

For each widget:
1. Define state type and action type
2. Write reducer function
3. Replace useState calls with useReducer
4. Update all state reads to use destructured state
5. Update all state writes to dispatch actions
6. Verify visual and functional parity

### Order

Start with the simplest restructuring (KanbanBoard — clearest state groups) and progress to the most complex (MacCalc — most intertwined state).

1. KanbanBoard (14 useState → 3 groups)
2. MacCalendar (14 useState → 3 groups)
3. RetroMusicPlayer (15 useState → 3 groups)
4. Oscilloscope (15 useState → 3 groups)
5. MacCalc (17 useState → 4 groups)

---

## Workflow Instructions

### Committing
```
refactor(rich-widgets): restructure KanbanBoard state to useReducer (OS-14 Phase 6)
```

### Diary maintenance
Update `reference/01-implementation-diary.md` after each widget. Use the `diary` skill format:
1. Chronological step numbers
2. Record what changed, what worked, what didn't, what was tricky

### Docmgr bookkeeping
```bash
docmgr doc relate --doc <diary-path> --file-note "/abs/path:description"
docmgr changelog update --ticket OS-14-PHASE6-STATE-RESTRUCTURING --entry "..." --file-note "/abs/path:reason"
docmgr doctor --ticket OS-14-PHASE6-STATE-RESTRUCTURING --stale-after 30
```

---

## Testing Strategy

1. **Per-widget:** Interactive Storybook testing of all features (drag, click, edit, etc.)
2. **State consistency:** Verify that combined state updates happen atomically (no intermediate renders with stale values)
3. **TypeScript:** Reducer action types should be exhaustively checked
4. **Desktop integration:** All 20 widgets still launch

---

## Risks

- **Highest risk phase.** State restructuring can introduce subtle bugs that only manifest in specific interaction sequences.
- Each widget should be migrated independently with thorough testing.
- Consider this phase optional — the widgets work correctly with useState.

---

## Open Questions

1. Should we create a generic `useWidgetReducer` helper or keep each reducer independent?
2. Should action types use string literals or a discriminated union pattern?
3. Is this phase worth the risk for demo widgets? (Answer: probably only for widgets that will see active development.)
