# Tasks

## TODO

- [ ] Review and align with deep-dive plan in `HC-022` finding-14 document
- [ ] Replace `HyperCardShellProps` generic collapse:
  - [ ] use `CardStackDefinition<TRootState>`
  - [ ] use `SharedSelectorRegistry<TRootState>`
  - [ ] use `SharedActionRegistry<TRootState>`
- [ ] Remove shell boundary `any` casts where feasible:
  - [ ] runtime slice selector cast
  - [ ] dispatch cast usage
  - [ ] layout key cast usage
- [ ] Harden `createDSLApp` boundary types:
  - [ ] `snapshotSelector` typed with root state generic
- [ ] Harden `createStoryHelpers` boundary types:
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
