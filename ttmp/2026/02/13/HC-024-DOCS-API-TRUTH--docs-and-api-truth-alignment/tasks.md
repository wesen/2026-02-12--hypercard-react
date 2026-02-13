# Tasks

## TODO

- [ ] Build API truth inventory from code exports:
  - [ ] `packages/engine/src/index.ts`
  - [ ] `packages/engine/src/app/index.ts`
  - [ ] `packages/engine/src/cards/index.ts`
- [ ] Mark all stale/misleading sections in `README.md`
- [ ] Mark all stale/misleading sections in `docs/js-api-user-guide-reference.md`
- [ ] Remove references to non-current symbols from docs:
  - [ ] `dispatchDSLAction`
  - [ ] `defineActionRegistry`
  - [ ] `selectDomainData`
  - [ ] legacy `customRenderers`/`domainData` paths not present in current shell API
- [ ] Rewrite architecture section in `README.md` from current folder/API reality
- [ ] Rewrite extension-points section in `README.md` to current contracts:
  - [ ] stack definitions
  - [ ] shared selectors/actions
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
