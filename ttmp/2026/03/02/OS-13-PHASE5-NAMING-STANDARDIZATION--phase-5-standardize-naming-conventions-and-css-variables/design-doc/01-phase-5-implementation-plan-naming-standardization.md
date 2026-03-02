---
Title: 'Phase 5 Implementation Plan: Naming Standardization'
Ticket: OS-13-PHASE5-NAMING-STANDARDIZATION
Status: active
Topics:
    - frontend
    - widgets
    - css
    - cleanup
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - packages/rich-widgets/src/parts.ts:Data-part constants — 5 widgets use full-word prefixes
    - packages/rich-widgets/src/log-viewer/LogViewer.tsx:Uses log-viewer-* prefix
    - packages/rich-widgets/src/chart-view/ChartView.tsx:Uses chart-view-* prefix
    - packages/rich-widgets/src/mac-write/MacWrite.tsx:Uses mac-write-* prefix
    - packages/rich-widgets/src/kanban/KanbanBoard.tsx:Uses kanban-* prefix
    - packages/rich-widgets/src/node-editor/NodeEditor.tsx:Uses node-editor-* prefix
    - packages/rich-widgets/src/control-room/ControlRoom.tsx:Hardcoded hex colors, no CSS variables
ExternalSources: []
Summary: "Standardize data-part prefixes to 2-3 char abbreviations, normalize RICH_PARTS import aliasing, migrate ControlRoom to CSS variables."
LastUpdated: 2026-03-02T17:00:00-05:00
WhatFor: "Guide naming convention standardization"
WhenToUse: "When implementing Phase 5 of the rich widgets cleanup"
---

# Phase 5 Implementation Plan: Naming Standardization

## Executive Summary

Two naming conventions coexist: 5 older widgets use full-word prefixes (`log-viewer-toolbar`), 15 newer ones use 2-3 char abbreviations (`gf-toolbar`). The import alias is also inconsistent (5 use `as P`, 15 use `RICH_PARTS`). ControlRoom uses hardcoded hex colors with no CSS variables. This phase standardizes all three.

**Parent ticket:** OS-08-CLEANUP-RICH-WIDGETS
**Depends on:** OS-10-PHASE2-SHARED-PRIMITIVES (primitive migration may reduce the surface area)
**Estimated scope:** ~500 line changes (mostly mechanical rename)
**Risk level:** Low — no behavioral changes, purely cosmetic

---

## Implementation Plan

### Task 1: Define the standard prefix mapping

| Widget | Old Prefix | New Prefix |
|--------|-----------|------------|
| LogViewer | `log-viewer-` | `lv-` |
| ChartView | `chart-view-` | `cv-` |
| MacWrite | `mac-write-` | `mw-` |
| KanbanBoard | `kanban-` | `kb-` |
| NodeEditor | `node-editor-` | `ne-` |

### Task 2: Rename per widget

For each of the 5 widgets:
1. Update `parts.ts` — rename constant names and string values
2. Update the widget TSX — all `data-part={RICH_PARTS.xxx}` references
3. Update the CSS file — all `[data-part='xxx']` selectors
4. Update any story files referencing parts

### Task 3: Standardize RICH_PARTS import alias

Change all 15 files using `import { RICH_PARTS }` to `import { RICH_PARTS as P }`.

### Task 4: Migrate ControlRoom CSS to CSS variables

Replace all hardcoded hex colors in `theme/control-room.css` with `var(--hc-color-*)` references:
- `#c0c0c0` → `var(--hc-color-alt, #c0c0c0)`
- `#808080` → `var(--hc-color-border, #808080)`
- `#000` / `#333` → `var(--hc-color-text, #333)`
- Accent colors: `#00ff00`, `#ff4444` → `var(--hc-color-accent-*)`

---

## Workflow Instructions

### Committing
```
refactor(rich-widgets): rename log-viewer-* to lv-* prefix (OS-13 Phase 5)
refactor(rich-widgets): standardize RICH_PARTS as P import alias (OS-13 Phase 5)
refactor(rich-widgets): migrate ControlRoom CSS to CSS variables (OS-13 Phase 5)
```

### Diary maintenance
Update `reference/01-implementation-diary.md` after each task. Use the `diary` skill format.

### Docmgr bookkeeping
```bash
docmgr doc relate --doc <diary-path> --file-note "/abs/path:description"
docmgr changelog update --ticket OS-13-PHASE5-NAMING-STANDARDIZATION --entry "..." --file-note "/abs/path:reason"
docmgr doctor --ticket OS-13-PHASE5-NAMING-STANDARDIZATION --stale-after 30
```

---

## Testing Strategy

1. Grep for old prefixes to ensure zero orphaned CSS rules
2. TypeScript check after all renames
3. Visual comparison — widgets should look identical before/after
4. Desktop integration story still launches all widgets

---

## Open Questions

1. Should root-level part names also be shortened (e.g., `log-viewer` → `lv`)?
2. Should the rename be done all at once or one widget at a time?
