# Tasks

## TODO

- [ ] Build API truth inventory from code exports:
- [x] `packages/engine/src/index.ts`
- [x] `packages/engine/src/app/index.ts`
- [x] `packages/engine/src/cards/index.ts`
- [x] Mark all stale/misleading sections in `README.md`
- [x] Mark all stale/misleading sections in `docs/js-api-user-guide-reference.md`
- [x] Remove references to non-current symbols from docs:
- [x] `dispatchDSLAction`
- [x] `defineActionRegistry`
- [x] `selectDomainData`
- [x] legacy `customRenderers`/`domainData` paths not present in current shell API
- [x] Rewrite architecture section in `README.md` from current folder/API reality
- [x] Rewrite extension-points section in `README.md` to current contracts:
- [x] stack definitions
- [x] shared selectors/actions
  - [ ] app/store/story helpers
- [ ] Rewrite `docs/js-api-user-guide-reference.md` quickstart to runnable current API
- [ ] Add a "Current API" section and a "Legacy notes" section in JS API docs
- [ ] Add concrete examples from real app code paths:
  - [ ] `apps/inventory/src/App.tsx`
  - [ ] `apps/todo/src/App.tsx`
  - [ ] `apps/crm/src/App.tsx`
- [ ] Add symbol-level verification checklist at bottom of docs
- [ ] Add CI check or script to detect documented symbols missing from engine exports
- [ ] Validate docs snippets compile conceptually against current API (manual compile pass or strict review)
- [ ] Update ticket changelog with rewritten sections and validation notes
