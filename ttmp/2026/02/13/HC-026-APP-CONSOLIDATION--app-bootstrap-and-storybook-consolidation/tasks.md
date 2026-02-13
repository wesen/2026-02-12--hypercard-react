# Tasks

## TODO

- [ ] Inventory app store wiring differences across all apps
- [ ] Migrate `apps/inventory/src/app/store.ts` from manual reducer wiring to `createAppStore`
- [ ] Migrate `apps/todo/src/app/store.ts` from manual reducer wiring to `createAppStore`
- [ ] Verify `apps/crm/src/app/store.ts` and `apps/book-tracker-debug/src/app/store.ts` remain aligned with shared helper expectations
- [ ] Add or improve typing support in `createAppStore` if needed for migrated apps
- [ ] Inventory story wiring differences across apps
- [ ] Migrate Todo story setup (`apps/todo/src/stories/TodoApp.stories.tsx`) to `createStoryHelpers`
- [ ] Migrate Inventory story setup (including `apps/inventory/src/stories/decorators.tsx`) to `createStoryHelpers`
- [ ] Keep app-specific story behavior only where domain-specific and documented
- [ ] Extract repeated binding patterns into reusable helper utilities:
  - [ ] `state.setField` change handlers
  - [ ] scoped edits reset (`patchScopedState('card', { edits: {} })`) patterns
- [ ] Apply extracted helpers in at least two app domains to prove reuse
- [ ] Verify no behavioral regressions in card flows:
  - [ ] list to detail navigation
  - [ ] detail edit flows
  - [ ] form submit/update flows
- [ ] Run validation matrix:
  - [ ] per-app build commands
  - [ ] storybook smoke for migrated stories
  - [ ] root typecheck (after HC-023 merge)
- [ ] Update docs/examples to reflect consolidated helper usage
- [ ] Record migration deltas and validation in changelog
