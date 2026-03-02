# Tasks — OS-10-PHASE2-SHARED-PRIMITIVES

## Create Primitives

- [ ] Create WidgetToolbar component + CSS + data-part + story
- [ ] Create WidgetStatusBar component + CSS + data-part + story
- [ ] Create ModalOverlay component + CSS + data-part + story
- [ ] Create ProgressBar component + CSS + data-part + story
- [ ] Create EmptyState component + CSS + data-part + story
- [ ] Create SearchBar component + CSS + data-part + story
- [ ] Create Separator component + CSS + data-part + story
- [ ] Register all new primitives in parts.ts and index.ts
- [ ] Add theme/primitives.css and import in theme/index.ts

## Migrate Widgets

- [ ] Migrate toolbars (12 widgets) to WidgetToolbar
- [ ] Migrate status bars (14 widgets) to WidgetStatusBar
- [ ] Migrate modals (9 widgets) to ModalOverlay
- [ ] Migrate progress bars (6 widgets) to ProgressBar
- [ ] Migrate empty states (7 widgets) to EmptyState
- [ ] Migrate search bars (9 widgets) to SearchBar
- [ ] Migrate separators (7 widgets) to Separator
- [ ] Remove orphaned per-widget CSS rules

## Verification

- [ ] TypeScript check passes
- [ ] All primitive stories render correctly
- [ ] All migrated widget stories visually match before/after
- [ ] Desktop integration story launches all 20 widgets
- [ ] Diary updated, changelog updated, docmgr doctor passes
