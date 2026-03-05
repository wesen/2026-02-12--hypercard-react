---
Title: 'Phase 1 Implementation Plan: Bug Fixes'
Ticket: OS-09-PHASE1-BUG-FIXES
Status: active
Topics:
    - frontend
    - widgets
    - debugging
    - cleanup
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/kanban/KanbanBoard.tsx:Module-level let nextId at line 9
    - packages/rich-widgets/src/calendar/types.ts:Module-level let nextId at line 53
    - packages/rich-widgets/src/system-modeler/SystemModeler.tsx:Module-level let idCounter at line 18
    - packages/rich-widgets/src/youtube-retro/YouTubeRetro.tsx:useMemo with Math.random() at line 217
    - packages/rich-widgets/src/repl/MacRepl.tsx:startTime in useState should be useRef
    - packages/rich-widgets/src/deep-research/DeepResearch.tsx:Dead state webSearch and academicOnly at lines 70-71
    - packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx:No devicePixelRatio handling on canvas
    - packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx:No devicePixelRatio handling on canvas
    - packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx:Force simulation never stops
ExternalSources: []
Summary: "Detailed implementation plan for fixing all identified bugs in rich widgets: module-level state, incorrect hooks, dead code, and performance issues."
LastUpdated: 2026-03-02T17:00:00-05:00
WhatFor: "Guide task-by-task execution of Phase 1 bug fixes"
WhenToUse: "When implementing Phase 1 of the rich widgets cleanup"
---

# Phase 1 Implementation Plan: Bug Fixes

## Executive Summary

Phase 1 addresses 7 concrete bugs across 9 widget files. These are low-risk, high-value fixes — each is isolated to a single file, requires no API changes, and preserves existing behavior. The fixes are ordered from highest severity (module-level state causing cross-instance corruption) to lowest (performance improvements).

**Parent ticket:** OS-08-CLEANUP-RICH-WIDGETS
**Estimated scope:** ~80 line changes across 9 files
**Risk level:** Low — all changes are internal to individual widgets

---

## Problem Statement

During the OS-08 analysis, 7 bugs were identified across the 20 rich widgets. These range from security concerns to performance issues, all introduced during the rapid OS-07 porting process.

---

## Task-by-Task Implementation

### Task 1: Fix module-level mutable state in KanbanBoard

**File:** `packages/rich-widgets/src/kanban/KanbanBoard.tsx`
**Line:** 9
**Bug:** `let nextId = 20` is module-level — shared across all KanbanBoard instances, causing ID collisions.

**Fix:** Move to `useRef` inside the component.

```tsx
// BEFORE (line 9, module scope):
let nextId = 20;
const mkId = () => `task-${nextId++}`;

// AFTER (inside component):
const nextIdRef = useRef(20);
const mkId = useCallback(() => `task-${nextIdRef.current++}`, []);
```

**Verification:** Mount two KanbanBoard stories side-by-side — adding tasks in one should not affect the other's IDs.

---

### Task 2: Fix module-level mutable state in MacCalendar types

**File:** `packages/rich-widgets/src/calendar/types.ts`
**Line:** 53
**Bug:** `let nextId = 100` is module-level — shared across instances.

**Fix:** Use a collision-resistant ID generator instead of a shared counter.

```tsx
// BEFORE (types.ts line 53):
let nextId = 100;
export function mkEventId() { return `evt-${nextId++}`; }

// AFTER (types.ts):
export function mkEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
```

**Verification:** Create events in two MacCalendar instances — IDs should not collide.

---

### Task 3: Fix module-level mutable state in SystemModeler

**File:** `packages/rich-widgets/src/system-modeler/SystemModeler.tsx`
**Line:** 18
**Bug:** `let idCounter = 1` is module-level — shared across instances.

**Fix:** Move to `useRef` inside the component.

```tsx
// BEFORE (line 18, module scope):
let idCounter = 1;
const uid = () => `blk_${idCounter++}`;

// AFTER (inside component):
const idCounterRef = useRef(1);
const uid = useCallback(() => `blk_${idCounterRef.current++}`, []);
```

**Verification:** Open two SystemModeler stories — adding blocks in one should not affect the other's IDs.

---

### Task 4: Fix YouTubeRetro useMemo with Math.random()

**File:** `packages/rich-widgets/src/youtube-retro/YouTubeRetro.tsx`
**Line:** 217
**Bug:** `useMemo` contains `.sort(() => 0.5 - Math.random())` which defeats memoization — the sort comparator is non-deterministic.

**Fix:** Use a deterministic shuffle keyed on the video ID.

```tsx
// BEFORE (line ~215-222):
const relatedVideos = useMemo(
  () => currentVideo
    ? videos.filter(v => v.id !== currentVideo.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6)
    : [],
  [currentVideo, videos],
);

// AFTER:
const relatedVideos = useMemo(() => {
  if (!currentVideo) return [];
  const others = videos.filter(v => v.id !== currentVideo.id);
  const seed = currentVideo.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return others
    .map((v, i) => ({ v, sort: Math.sin(seed + i) }))
    .sort((a, b) => a.sort - b.sort)
    .map(x => x.v)
    .slice(0, 6);
}, [currentVideo, videos]);
```

**Verification:** Re-render the same video — related videos should be stable (no flicker).

---

### Task 5: Fix MacRepl startTime useState to useRef

**File:** `packages/rich-widgets/src/repl/MacRepl.tsx`
**Bug:** `startTime` is stored in `useState` but never triggers re-renders — it's only read to compute elapsed time.

**Fix:**

```tsx
// BEFORE:
const [startTime] = useState(() => Date.now());

// AFTER:
const startTime = useRef(Date.now());
// Update all reads from `startTime` to `startTime.current`
```

**Verification:** MacRepl should render identically. Status bar should still show elapsed time.

---

### Task 6: Remove dead state from DeepResearch

**File:** `packages/rich-widgets/src/deep-research/DeepResearch.tsx`
**Lines:** 70-71
**Bug:** `webSearch` and `academicOnly` state variables are toggled by checkboxes but never consumed by research logic.

**Fix:** Wire the state into visible behavior — adjust source filtering based on these toggles so the UI controls actually do something.

**Verification:** Toggle checkboxes and observe that the research output changes accordingly.

---

### Task 7: Add devicePixelRatio to Oscilloscope and LogicAnalyzer

**Files:**
- `packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx`
- `packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx`

**Bug:** Canvas rendering does not account for `window.devicePixelRatio`.

**Fix:** Scale the canvas backing store in the draw function:

```tsx
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```

**Verification:** Open in Storybook — traces should be sharp on HiDPI displays.

---

### Task 8: Add velocity threshold to GraphNavigator

**File:** `packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx`
**Bug:** Force-directed layout runs `requestAnimationFrame` continuously, even after settling.

**Fix:** Track total kinetic energy and stop when below threshold:

```tsx
let totalVelocity = 0;
for (let i = 0; i < nodes.length; i++) {
  totalVelocity += Math.abs(vel[i].x) + Math.abs(vel[i].y);
}
if (totalVelocity > 0.1) {
  frameRef.current = requestAnimationFrame(tick);
} else {
  frameRef.current = null;
}
```

Restart animation on user drag or layout change.

**Verification:** Open GraphNavigator, wait — animation should stop. Dragging restarts it.

---

## Workflow Instructions

### Committing

Commit after each logically complete unit — typically 2-3 related fixes, or one complex fix. Use:

```
fix(rich-widgets): <description> (OS-09 Phase 1)
```

### Diary maintenance

Update the diary at `reference/01-implementation-diary.md` after each task or group of tasks. Use the `diary` skill format:

1. Keep entries chronological with step numbers.
2. For each step, record:
   - **What changed:** files modified, lines changed
   - **What worked:** the fix applied cleanly
   - **What didn't work:** any unexpected complications
   - **What was tricky:** non-obvious aspects of the fix
3. Include exact commands/errors if any occur.
4. End each session with verification evidence.

### Docmgr bookkeeping

After completing fixes, update the ticket:

```bash
docmgr doc relate --doc <diary-path> --file-note "/abs/path/to/file:what was fixed"
docmgr changelog update --ticket OS-09-PHASE1-BUG-FIXES --entry "Fixed <description>" --file-note "/abs/path:reason"
docmgr doctor --ticket OS-09-PHASE1-BUG-FIXES --stale-after 30
```

### Storybook verification

After each fix, verify the affected widget renders correctly in Storybook. Check for console errors.

---

## Testing Strategy

1. **TypeScript check:** `npx tsc --noEmit` after all fixes
2. **Storybook visual:** Each affected widget's stories should render without errors
3. **Console check:** No new warnings or errors in browser console
4. **Desktop integration:** The RichWidgetsDesktop story should still launch all 20 widgets

---

## Open Questions

1. **DeepResearch dead state (Task 6):** Wire into visible behavior or remove checkboxes entirely?
2. **GraphNavigator restart trigger (Task 8):** Restart for all nodes or just the dragged one?
