---
Title: 'Phase 2 Implementation Plan: Shared Primitives'
Ticket: OS-10-PHASE2-SHARED-PRIMITIVES
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
    - packages/rich-widgets/src/primitives/Sparkline.tsx:Existing primitive (only one currently)
    - packages/rich-widgets/src/parts.ts:Data-part constants registry
    - packages/rich-widgets/src/theme/index.ts:CSS barrel import
ExternalSources: []
Summary: "Extract 7 shared UI primitives (Toolbar, StatusBar, ModalOverlay, ProgressBar, EmptyState, SearchBar, Separator) to reduce duplication across 14+ widgets."
LastUpdated: 2026-03-02T17:00:00-05:00
WhatFor: "Guide extraction of shared primitives from rich widgets"
WhenToUse: "When implementing Phase 2 of the rich widgets cleanup"
---

# Phase 2 Implementation Plan: Shared Primitives

## Executive Summary

Extract 7 shared UI primitives from duplicated patterns found across 10-14 widgets. Each primitive is a thin, themeable component with `data-part` attributes, accepting children for composition. This eliminates ~200 lines of duplicated CSS and ~100 lines of duplicated JSX.

**Parent ticket:** OS-08-CLEANUP-RICH-WIDGETS
**Depends on:** OS-09-PHASE1-BUG-FIXES (bug fixes should land first)
**Estimated scope:** ~300 lines new primitives, ~400 lines removed from widgets
**Risk level:** Medium — affects 14+ widgets, requires visual regression checks

---

## Problem Statement

12 widgets duplicate toolbar CSS, 14 duplicate status bar CSS, 10 duplicate sidebar CSS. Each uses near-identical flex layouts with only prefix differences. Adding a new widget requires copying these patterns yet again.

---

## Proposed Primitives

### 1. WidgetToolbar

Flex row with gap, border-bottom, background. Used by 12 widgets.

```tsx
interface WidgetToolbarProps { children: ReactNode; className?: string; }
function WidgetToolbar({ children, className }: WidgetToolbarProps) {
  return <div data-part="widget-toolbar" className={className}>{children}</div>;
}
```

CSS: Single `[data-part='widget-toolbar']` rule replacing 12 per-widget rules.

**Widgets to migrate:** LogViewer, MacWrite, KanbanBoard, NodeEditor, Oscilloscope, LogicAnalyzer, MacCalendar, MacCalc, MusicPlayer, SteamLauncher, ChatBrowser, SystemModeler

### 2. WidgetStatusBar

Bottom bar with metadata. Used by 14 widgets.

```tsx
interface WidgetStatusBarProps { children: ReactNode; }
function WidgetStatusBar({ children }: WidgetStatusBarProps) {
  return <div data-part="widget-status-bar">{children}</div>;
}
```

### 3. ModalOverlay

Backdrop + centered card with close handler. Used by 9 widgets.

```tsx
interface ModalOverlayProps { children: ReactNode; onClose: () => void; }
```

### 4. ProgressBar

Track + fill with value/max. Used by 6 widgets.

```tsx
interface ProgressBarProps { value: number; max?: number; label?: string; }
```

### 5. EmptyState

Centered placeholder. Used by 7 widgets.

```tsx
interface EmptyStateProps { icon?: string; message: string; }
```

### 6. SearchBar

Text input with optional count badge. Used by 9 widgets.

```tsx
interface SearchBarProps { value: string; onChange: (v: string) => void; placeholder?: string; count?: number; }
```

### 7. Separator

Vertical/horizontal divider. Used by 7 widgets.

```tsx
interface SeparatorProps { orientation?: 'vertical' | 'horizontal'; }
```

---

## Implementation Plan

### Step 1: Create primitive components

Create each primitive in `primitives/` with its own file:
- `primitives/WidgetToolbar.tsx`
- `primitives/WidgetStatusBar.tsx`
- `primitives/ModalOverlay.tsx`
- `primitives/ProgressBar.tsx`
- `primitives/EmptyState.tsx`
- `primitives/SearchBar.tsx`
- `primitives/Separator.tsx`

Register data-parts in `parts.ts`. Add shared CSS to `theme/primitives.css`.

### Step 2: Add Storybook stories for each primitive

Create `primitives/Primitives.stories.tsx` showing each primitive in isolation.

### Step 3: Migrate widgets one by one

For each widget, replace inline toolbar/statusbar/modal/etc. with the shared primitive. Verify visual parity in Storybook.

### Step 4: Remove orphaned CSS rules

Delete per-widget toolbar/statusbar CSS rules that are now handled by the shared primitive CSS.

---

## Workflow Instructions

### Committing

Commit after each primitive is created and after each batch of widget migrations:
```
feat(rich-widgets): add WidgetToolbar primitive (OS-10 Phase 2)
refactor(rich-widgets): migrate LogViewer/ChartView/MacWrite to shared toolbar (OS-10 Phase 2)
```

### Diary maintenance

Update `reference/01-implementation-diary.md` after each task. Use the `diary` skill format:
1. Chronological step numbers
2. Record what changed, what worked, what didn't, what was tricky
3. Include commands/errors exactly as they occurred

### Docmgr bookkeeping

```bash
docmgr doc relate --doc <diary-path> --file-note "/abs/path:description"
docmgr changelog update --ticket OS-10-PHASE2-SHARED-PRIMITIVES --entry "..." --file-note "/abs/path:reason"
docmgr doctor --ticket OS-10-PHASE2-SHARED-PRIMITIVES --stale-after 30
```

---

## Testing Strategy

1. Each primitive: own Storybook story
2. Each migrated widget: visual comparison before/after
3. TypeScript check after all migrations
4. Desktop integration story: all 20 widgets still launch

---

## Open Questions

1. Should primitives accept a `data-part` override for widget-specific styling?
2. Should WidgetSidebar be included (10 widgets) or deferred to Phase 3?
