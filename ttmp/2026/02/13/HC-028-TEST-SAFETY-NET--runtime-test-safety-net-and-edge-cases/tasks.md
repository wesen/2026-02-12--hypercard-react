# Tasks

## TODO

- [ ] Decide test runner placement and scope (engine package, app package, or dedicated workspace)
- [ ] Add baseline test infrastructure for runtime-focused tests
- [ ] Add tests for `executeActionDescriptor` behavior:
  - [ ] builtin navigation and toast actions
  - [ ] local action handler precedence
  - [ ] shared action handler fallback
  - [ ] unhandled action signaling path
- [ ] Add tests for selector resolution order (`card` -> `cardType` -> `background` -> `stack` -> `global` -> `shared`)
- [ ] Add tests for scoped state mutation commands:
  - [ ] `state.set`
  - [ ] `state.setField`
  - [ ] `state.patch`
  - [ ] `state.reset`
- [ ] Add navigation reducer tests for initialization/reset semantics including non-`home` `homeCard`
- [ ] Add `ListView` footer tests for empty and non-empty datasets (`sum`, `count`, `avg`, `min`, `max`)
- [ ] Add at least one end-to-end-like integration test around card action execution with selectors + params + event payload
- [ ] Ensure tests are deterministic and not coupled to Storybook runtime
- [ ] Add root/package scripts for running tests in CI
- [ ] Run full validation matrix and capture command outputs
- [ ] Document test suite structure and how to extend it in ticket docs
