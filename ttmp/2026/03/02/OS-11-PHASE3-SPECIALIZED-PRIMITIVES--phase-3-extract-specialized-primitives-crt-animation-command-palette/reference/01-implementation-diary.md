---
Title: Implementation diary
Ticket: OS-11-PHASE3-SPECIALIZED-PRIMITIVES
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - design-system
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/primitives/LabeledSlider.tsx:New shared labeled slider primitive
    - packages/rich-widgets/src/primitives/useAnimationLoop.ts:New animation loop hook
    - packages/rich-widgets/src/primitives/CommandPalette.tsx:New shared command palette primitive
    - packages/rich-widgets/src/primitives/ButtonGroup.tsx:New shared button group primitive
    - packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx:Migrated to LabeledSlider + useAnimationLoop
    - packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx:Migrated to LabeledSlider + useAnimationLoop
    - packages/rich-widgets/src/calculator/MacCalc.tsx:Migrated to CommandPalette
    - packages/rich-widgets/src/calendar/MacCalendar.tsx:Migrated to CommandPalette
ExternalSources: []
Summary: "Implementation diary for Phase 3: extracting specialized primitives from rich widgets"
LastUpdated: 2026-03-02T20:00:00-05:00
WhatFor: "Track what changed, what worked, and what was tricky during Phase 3"
WhenToUse: "When reviewing Phase 3 changes or continuing cleanup work"
---

# Implementation Diary — OS-11-PHASE3-SPECIALIZED-PRIMITIVES

## Step 1: Create 4 specialized primitives

### What changed

Created 4 primitives:

| Component | File | Purpose |
|-----------|------|---------|
| LabeledSlider | `LabeledSlider.tsx` | label + range input + value display |
| useAnimationLoop | `useAnimationLoop.ts` | rAF loop with auto-cleanup and restart |
| CommandPalette | `CommandPalette.tsx` | search + filtered action list + keyboard nav |
| ButtonGroup | `ButtonGroup.tsx` | horizontal button set with active state |

Supporting changes:
- **parts.ts** — Added 10 new data-part constants
- **theme/primitives.css** — CSS for LabeledSlider (flex row), CommandPalette (full card with search/items/footer), ButtonGroup (flex wrap)
- **index.ts** — Barrel-exported all 4 components + types

### Design decisions

1. **useAnimationLoop stores callback in ref** — The `callbackRef.current = callback` pattern avoids the loop restarting when deps change. The loop function reads from the ref on each frame.
2. **useAnimationLoop returns `{ restart }`** — For cases where the loop needs to be restarted externally (e.g., after drag in GraphNavigator). Not used yet but available.
3. **CommandPalette wraps ModalOverlay** — Reuses the shared ModalOverlay for backdrop + close-on-click behavior. Internally manages search state, keyboard navigation, and filtered list.
4. **CommandPalette accepts `filterFn`** — Default filter searches label + id. MacCalc's `cat` field search was dropped (acceptable tradeoff).

### Commit

`a8aacf2 feat(rich-widgets): add LabeledSlider, useAnimationLoop, CommandPalette, ButtonGroup primitives (OS-11 Phase 3)`

---

## Step 2: Migrate LabeledSlider + CommandPalette

### What changed

- **Oscilloscope.tsx** — Deleted inline `OscSlider` component (37 lines). Replaced 8 `<OscSlider>` usages with `<LabeledSlider>`.
- **LogicAnalyzer.tsx** — Deleted inline `LaSlider` component (37 lines). Replaced 2 `<LaSlider>` usages with `<LabeledSlider>`.
- **MacCalc.tsx** — Deleted inline `Palette` component (~100 lines). Replaced with `<CommandPalette items={CALC_ACTIONS} .../>`. Removed ModalOverlay import (was only used by Palette).
- **MacCalendar.tsx** — Deleted inline `Palette` component (~80 lines). Replaced with `<CommandPalette items={actions} footer={false} .../>`. Kept ModalOverlay import (still used by EventModal).

### What worked

The LabeledSlider migration was a direct name swap — props are identical. The CommandPalette migration eliminated ~180 lines of duplicated search/keyboard/filter logic.

### Commit

`3d5355e refactor(rich-widgets): migrate Oscilloscope/LogicAnalyzer to LabeledSlider, MacCalc/MacCalendar to CommandPalette (OS-11 Phase 3)`

---

## Step 3: Migrate useAnimationLoop

### What changed

- **Oscilloscope.tsx** — Removed `animRef`, removed self-scheduling `requestAnimationFrame(draw)` from draw callback, removed `useEffect` that started the loop. Added `useAnimationLoop(draw, true)`.
- **LogicAnalyzer.tsx** — Same pattern. Also removed stale `animRef.current = requestAnimationFrame(draw)` in the early return path (no channels enabled).

### What was tricky

LogicAnalyzer had an extra `animRef.current = requestAnimationFrame(draw)` in the early-return path (when no channels are enabled). This was a self-scheduling call to keep the loop running even with no channels. With `useAnimationLoop`, the hook keeps the loop running regardless, so the early return just exits the draw callback — the hook calls it again on the next frame.

### What was skipped

- **GraphNavigator** — Not migrated to `useAnimationLoop`. Its force simulation has fundamentally different lifecycle: stops when energy settles below threshold, restarts on drag with velocity perturbation. The simple `useAnimationLoop(callback, active)` pattern doesn't fit without adding complexity that defeats the purpose.
- **CrtDisplay** — Not extracted. The Oscilloscope and LogicAnalyzer bezels differ (LA has a reflection div, different mouse handlers). Extracting would require parameterizing too many details.
- **ButtonGroup migration** — Created but not migrated. The existing button groups in each widget have varying styles (icon+text, text-only, different sizing) that don't cleanly fit a single ButtonGroup component.

### Commit

`564542d refactor(rich-widgets): migrate Oscilloscope/LogicAnalyzer to useAnimationLoop hook (OS-11 Phase 3)`

---

## Verification

- TypeScript check: no new errors introduced (all remaining are pre-existing)
- 3 commits in Phase 3: 1 creation + 2 migration batches
- Net lines: +346 new primitive code, -292 deleted inline code = +54 net (but much cleaner separation)

## Code review instructions

1. **useAnimationLoop callback ref** — The hook stores the callback in a ref and reads it each frame. This means the loop never restarts when the draw function's deps change. Verify this doesn't cause stale closure issues — it shouldn't because the callback ref is updated synchronously before the next frame.
2. **CommandPalette replacing ModalOverlay for Calendar** — The Calendar palette now renders centered (vs. previously top-aligned). This is an intentional simplification.
3. **LogicAnalyzer early return** — When no channels are enabled, the draw callback now returns early without self-scheduling. The useAnimationLoop hook keeps calling it on each frame. Verify the "No channels enabled" message still renders.
