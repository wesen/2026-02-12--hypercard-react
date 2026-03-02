# Tasks — OS-13-PHASE5-NAMING-STANDARDIZATION

## Prefix Rename (5 widgets)

- [ ] Rename LogViewer: log-viewer-* → lv-* (parts.ts, LogViewer.tsx, log-viewer.css)
- [ ] Rename ChartView: chart-view-* → cv-* (parts.ts, ChartView.tsx, chart-view.css)
- [ ] Rename MacWrite: mac-write-* → mw-* (parts.ts, MacWrite.tsx, mac-write.css)
- [ ] Rename KanbanBoard: kanban-* → kb-* (parts.ts, KanbanBoard.tsx, kanban.css)
- [ ] Rename NodeEditor: node-editor-* → ne-* (parts.ts, NodeEditor.tsx, node-editor.css)

## Import Standardization

- [ ] Change all 15 `import { RICH_PARTS }` to `import { RICH_PARTS as P }`

## CSS Variable Migration

- [ ] Migrate ControlRoom hardcoded hex colors to var(--hc-color-*) in control-room.css

## Verification

- [ ] Grep for old prefixes — zero matches
- [ ] Grep for hardcoded hex in control-room.css — zero matches (except fallback values)
- [ ] TypeScript check passes
- [ ] All widget stories render identically
- [ ] Diary updated, changelog updated, docmgr doctor passes
