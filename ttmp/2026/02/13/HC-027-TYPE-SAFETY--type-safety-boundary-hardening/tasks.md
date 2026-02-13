# Tasks

## TODO

- [ ] Review and align with deep-dive plan in `HC-022` finding-14 document
- [x] Replace `HyperCardShellProps` generic collapse:
- [x] use `CardStackDefinition<TRootState>`
- [x] use `SharedSelectorRegistry<TRootState>`
- [x] use `SharedActionRegistry<TRootState>`
- [x] Remove shell boundary `any` casts where feasible:
- [x] runtime slice selector cast
- [x] dispatch cast usage
- [x] layout key cast usage
- [x] Harden `createDSLApp` boundary types:
- [x] `snapshotSelector` typed with root state generic
- [x] Harden `createStoryHelpers` boundary types:
  - [ ] `createStore` return type no longer `any`
  - [ ] `snapshotSelector` typed with root state generic
- [ ] Propagate runtime generics:
  - [ ] generic `RuntimeLookup`
  - [ ] typed runtime helper signatures where lookup/context are passed
- [ ] Replace boundary `any` usage with either generics or `unknown` + narrow guards
- [ ] Add compile-time contract checks (fixtures or strict typecheck assertions)
- [ ] Update call sites in apps and stories to satisfy stricter type contracts
- [ ] Validate with root `typecheck` and app/story smoke passes
- [ ] Update docs for new typed helper signatures if public API changed
- [ ] Record residual `any` usages (if any) with explicit justification comments
