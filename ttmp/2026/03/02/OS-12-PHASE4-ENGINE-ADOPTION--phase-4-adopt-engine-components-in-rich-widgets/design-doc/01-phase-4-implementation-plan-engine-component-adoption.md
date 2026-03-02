---
Title: 'Phase 4 Implementation Plan: Engine Component Adoption'
Ticket: OS-12-PHASE4-ENGINE-ADOPTION
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - engine
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/game-finder/GameFinder.tsx:Hand-rolled radio buttons (gf-radio/gf-radio-dot)
    - packages/rich-widgets/src/deep-research/DeepResearch.tsx:Hand-rolled radio buttons (dr-radio/dr-radio-dot)
    - packages/rich-widgets/src/stream-launcher/StreamLauncher.tsx:Hand-rolled radio buttons (sl-radio/sl-radio-dot)
    - packages/rich-widgets/src/repl/MacRepl.tsx:No engine components used
    - packages/rich-widgets/src/control-room/ControlRoom.tsx:No engine components used
ExternalSources: []
Summary: "Replace hand-rolled radio buttons with engine RadioButton in 3 widgets, add Btn to MacRepl."
LastUpdated: 2026-03-02T17:00:00-05:00
WhatFor: "Guide adoption of engine components in rich widgets"
WhenToUse: "When implementing Phase 4 of the rich widgets cleanup"
---

# Phase 4 Implementation Plan: Engine Component Adoption

## Executive Summary

Three widgets hand-roll radio button UI identical to what the engine's `RadioButton` component provides. Two widgets use zero engine components. This phase replaces hand-rolled implementations with engine components for consistency and reduced code.

**Parent ticket:** OS-08-CLEANUP-RICH-WIDGETS
**Depends on:** OS-09-PHASE1-BUG-FIXES
**Estimated scope:** ~60 lines changed across 4 widgets
**Risk level:** Low — drop-in replacements with visual parity

---

## Problem Statement

The engine provides `Btn`, `Checkbox`, and `RadioButton` components. Most widgets use `Btn` (17/20), some use `Checkbox` (5/20), but only ChartView uses `RadioButton`. Three widgets (GameFinder, DeepResearch, StreamLauncher) hand-roll identical radio button UI with `<span data-part="xx-radio">` + `<span data-part="xx-radio-dot">`.

---

## Implementation Plan

### Task 1: Replace GameFinder radio buttons

Replace `gf-radio`/`gf-radio-dot` with engine `RadioButton`.

**Current pattern:**
```tsx
<span data-part={P.gfRadio} onClick={() => setSort('name')}>
  <span data-part={P.gfRadioDot} style={{ opacity: sort === 'name' ? 1 : 0 }} />
  Name
</span>
```

**Target:**
```tsx
<RadioButton label="Name" checked={sort === 'name'} onChange={() => setSort('name')} />
```

### Task 2: Replace DeepResearch radio buttons

Same pattern — replace `dr-radio`/`dr-radio-dot` with `RadioButton`.

### Task 3: Replace StreamLauncher radio buttons

Same pattern — replace `sl-radio`/`sl-radio-dot` with `RadioButton`.

### Task 4: Add Btn to MacRepl

MacRepl has "Clear" and "Export" text actions that could be `Btn` components. Evaluate if this improves the terminal aesthetic or conflicts with it.

### Task 5: Remove orphaned CSS and data-parts

Remove the hand-rolled radio CSS rules and data-part constants that are no longer used.

---

## Workflow Instructions

### Committing
```
refactor(rich-widgets): adopt engine RadioButton in GameFinder/DeepResearch/StreamLauncher (OS-12 Phase 4)
```

### Diary maintenance
Update `reference/01-implementation-diary.md` after each task. Use the `diary` skill format:
1. Chronological step numbers
2. Record what changed, what worked, what didn't, what was tricky

### Docmgr bookkeeping
```bash
docmgr doc relate --doc <diary-path> --file-note "/abs/path:description"
docmgr changelog update --ticket OS-12-PHASE4-ENGINE-ADOPTION --entry "..." --file-note "/abs/path:reason"
docmgr doctor --ticket OS-12-PHASE4-ENGINE-ADOPTION --stale-after 30
```

---

## Testing Strategy

1. Visual comparison: radio buttons should look consistent with ChartView's RadioButton usage
2. Functional check: selecting radio options should work identically
3. TypeScript check after all changes
4. No orphaned CSS rules remain

---

## Open Questions

1. Should ControlRoom adopt engine Btn for toggle switches? The Win95 instrument aesthetic may conflict.
2. Should MacRepl adopt Btn? The terminal aesthetic may be better served by text-only actions.
