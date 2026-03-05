---
Title: 'Phase 3 Implementation Plan: Specialized Primitives'
Ticket: OS-11-PHASE3-SPECIALIZED-PRIMITIVES
Status: active
Topics:
    - frontend
    - widgets
    - refactoring
    - design-system
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/oscilloscope/Oscilloscope.tsx:OscSlider at lines 33-68, CRT bezel, animation loop
    - packages/rich-widgets/src/logic-analyzer/LogicAnalyzer.tsx:LaSlider at lines 43-78, CRT bezel, animation loop
    - packages/rich-widgets/src/graph-navigator/GraphNavigator.tsx:requestAnimationFrame loop
    - packages/rich-widgets/src/calculator/MacCalc.tsx:Command palette overlay
    - packages/rich-widgets/src/calendar/MacCalendar.tsx:Command palette overlay
ExternalSources: []
Summary: "Extract 5 specialized primitives: CrtDisplay, LabeledSlider, useAnimationLoop hook, CommandPalette, and ButtonGroup."
LastUpdated: 2026-03-02T17:00:00-05:00
WhatFor: "Guide extraction of domain-specific shared components"
WhenToUse: "When implementing Phase 3 of the rich widgets cleanup"
---

# Phase 3 Implementation Plan: Specialized Primitives

## Executive Summary

Extract 5 domain-specific primitives from structural twin patterns. The highest-value extraction is `CrtDisplay` + `LabeledSlider` + `useAnimationLoop` which deduplicates the Oscilloscope/LogicAnalyzer twin pair. CommandPalette deduplicates MacCalc/MacCalendar. ButtonGroup deduplicates 3 widgets.

**Parent ticket:** OS-08-CLEANUP-RICH-WIDGETS
**Depends on:** OS-10-PHASE2-SHARED-PRIMITIVES
**Estimated scope:** ~400 lines new primitives, ~300 lines removed
**Risk level:** Medium — domain-specific logic needs careful extraction

---

## Proposed Primitives

### 1. CrtDisplay

CRT bezel chrome + canvas + animation frame management. Oscilloscope and LogicAnalyzer both wrap a `<canvas>` in an identical bezel with the same animation loop pattern.

```tsx
interface CrtDisplayProps {
  drawFrame: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => void;
  bezelColor?: string;
  className?: string;
}
```

### 2. LabeledSlider

Merge OscSlider (Oscilloscope.tsx:33-68) and LaSlider (LogicAnalyzer.tsx:43-78) — identical components with different data-part prefixes.

```tsx
interface LabeledSliderProps {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit?: string;
}
```

### 3. useAnimationLoop

Hook wrapping requestAnimationFrame with automatic cleanup. Used by Oscilloscope, LogicAnalyzer, GraphNavigator.

```tsx
function useAnimationLoop(callback: (time: number) => void, active: boolean): void
```

### 4. CommandPalette

Overlay with search input and filtered action list. Used by MacCalc and MacCalendar (near-identical implementations).

```tsx
interface CommandPaletteProps {
  items: { id: string; label: string; shortcut?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
}
```

### 5. ButtonGroup

Horizontal button set with active state. Used by GraphNavigator, LogicAnalyzer, Oscilloscope.

```tsx
interface ButtonGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}
```

---

## Implementation Plan

### Step 1: Create useAnimationLoop hook
Create `primitives/useAnimationLoop.ts`. Test with a simple canvas story.

### Step 2: Create LabeledSlider
Create `primitives/LabeledSlider.tsx`. Add story.

### Step 3: Create CrtDisplay
Create `primitives/CrtDisplay.tsx` using useAnimationLoop internally. Add story with a sine wave demo.

### Step 4: Migrate Oscilloscope and LogicAnalyzer
Replace their internal bezel/canvas/slider/animation code with the new primitives. These widgets become thin wrappers that provide `drawFrame` callbacks and control knobs.

### Step 5: Create CommandPalette
Create `primitives/CommandPalette.tsx`. Add story.

### Step 6: Migrate MacCalc and MacCalendar
Replace inline command palette code with shared CommandPalette.

### Step 7: Create ButtonGroup
Create `primitives/ButtonGroup.tsx`. Add story. Migrate 3 widgets.

---

## Workflow Instructions

### Committing
```
feat(rich-widgets): add CrtDisplay + LabeledSlider + useAnimationLoop primitives (OS-11 Phase 3)
refactor(rich-widgets): migrate Oscilloscope/LogicAnalyzer to CrtDisplay (OS-11 Phase 3)
```

### Diary maintenance
Update `reference/01-implementation-diary.md` after each task. Use the `diary` skill format:
1. Chronological step numbers
2. Record what changed, what worked, what didn't, what was tricky
3. Include commands/errors exactly as they occurred

### Docmgr bookkeeping
```bash
docmgr doc relate --doc <diary-path> --file-note "/abs/path:description"
docmgr changelog update --ticket OS-11-PHASE3-SPECIALIZED-PRIMITIVES --entry "..." --file-note "/abs/path:reason"
docmgr doctor --ticket OS-11-PHASE3-SPECIALIZED-PRIMITIVES --stale-after 30
```

---

## Testing Strategy

1. Each primitive: own Storybook story demonstrating standalone usage
2. Oscilloscope/LogicAnalyzer: visual comparison before/after (waveforms should look identical)
3. CommandPalette: keyboard navigation should work (arrow keys, enter, escape)
4. TypeScript check after all migrations

---

## Open Questions

1. Should CrtDisplay handle devicePixelRatio internally (yes, assuming Phase 1 fix lands first)?
2. Should useAnimationLoop return a `restart()` function for GraphNavigator's drag-to-restart?
