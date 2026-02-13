# Tasks

## TODO

- [x] Create ticket and import new DSL source
- [x] Analyze current DSL architecture and migration surface
- [x] Run and store experiments in ticket scripts folder
- [x] Write detailed migration design and implementation guide
- [x] Upload final docs bundle to reMarkable
- [x] Author CardDefinition scoped state architecture analysis
- [x] Run scoped state simulation experiment and capture output
- [x] Upload new CardDefinition state architecture document to reMarkable
- [x] Implement engine CardDefinition DSL core (types/helpers for UINode, Sel/Ev/Param/Act, scoped selectors/actions API)
- [ ] Implement scoped runtime state in Redux (card/cardType/background/stack/global) with set/patch/reset reducers and selectors
- [ ] Rewrite HyperCardShell/CardRenderer runtime to execute new DSL commands and expressions using shared selector/action registries
- [ ] Remove old DSL runtime files and exports (dsl/types.ts, dsl/resolver.ts, app/dispatchDSLAction.ts, obsolete registry APIs)
- [ ] Port inventory app to new DSL/JS API card stack and shared selectors/actions; remove old overrides/domain registries
- [ ] Port todo app to new DSL/JS API card stack and shared selectors/actions; remove old overrides/domain registries
- [ ] Port BookTracker and app story examples to new DSL/JS API
- [ ] Run typecheck/build validation, fix fallout, finalize docs/diary/changelog, and upload refreshed migration bundle
