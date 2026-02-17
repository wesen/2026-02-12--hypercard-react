# Tasks

## TODO

### Phase 0: Baseline and acceptance criteria
- [ ] Confirm target apps for initial rollout (inventory first, others opt-in later).
- [ ] Confirm exact metrics contract (`actions/sec`, `stateChanges/sec`, `avg/p95 reducer ms`, `fps`, `longFrames/sec`).
- [ ] Confirm dev-only policy and production behavior (disabled by default).
- [ ] Capture baseline manual profile notes before implementation (chat stream + drag).

### Phase 1: Engine diagnostics core
- [x] Create `packages/engine/src/diagnostics/types.ts` for perf event/snapshot types.
- [x] Create bounded ring-buffer helper for diagnostics events.
- [x] Implement `packages/engine/src/diagnostics/reduxPerfMiddleware.ts` to time each dispatch.
- [x] Include state-change detection (`prevState !== nextState`) per action sample.
- [x] Aggregate rolling metrics over configurable window.
- [x] Track top action rates by type in rolling window.
- [x] Implement `packages/engine/src/diagnostics/frameMonitor.ts` using `requestAnimationFrame`.
- [x] Track fps and long-frame rates in frame monitor.
- [x] Implement `packages/engine/src/diagnostics/reduxPerfSlice.ts` for diagnostics state.
- [x] Add reset/pause actions in diagnostics slice.
- [x] Implement diagnostics selectors in `packages/engine/src/diagnostics/selectors.ts`.
- [x] Export module from `packages/engine/src/diagnostics/index.ts`.
- [x] Export diagnostics APIs from engine barrel (`packages/engine/src/index.ts`).

### Phase 2: Store factory integration
- [x] Extend `createAppStore` signature to accept options (`enableReduxDiagnostics`, `diagnosticsWindowMs`).
- [x] Conditionally register `reduxPerf` reducer when diagnostics are enabled.
- [x] Conditionally append diagnostics middleware when enabled.
- [x] Ensure backward compatibility for all existing `createAppStore` callers.
- [x] Verify Storybook `createStore` paths still work without diagnostics enabled.

### Phase 3: Inventory integration and HyperCard window
- [x] Enable diagnostics in `apps/inventory/src/app/store.ts` with `import.meta.env.DEV`.
- [x] Create `apps/inventory/src/features/debug/ReduxPerfWindow.tsx`.
- [x] Add diagnostics appKey route to `renderAppWindow` in `apps/inventory/src/App.tsx`.
- [x] Add startup open-window behavior in `App.tsx` when `import.meta.env.DEV`.
- [x] Add dedupe key for diagnostics window to avoid duplicate windows.
- [x] Add menu command and/or desktop icon to reopen diagnostics window after close.
- [x] Keep diagnostics window sizing/placement sane on default desktop layout.

### Phase 4: UX and observability hardening
- [x] Add controls in window: reset metrics, pause updates, rolling-window size selector.
- [x] Add table/list for top action types by throughput.
- [x] Add reducer-latency warnings/highlights for slow action types.
- [x] Add brief legend in window explaining metric semantics.
- [x] Ensure diagnostics UI does not create runaway render overhead.

### Phase 5: Testing
- [ ] Unit test: rolling throughput math.
- [ ] Unit test: p95 calculation.
- [ ] Unit test: long-frame aggregation.
- [ ] Unit test: diagnostics middleware state-change detection.
- [ ] Unit test: diagnostics disabled path in store factory.
- [ ] Unit test: diagnostics enabled path in store factory.
- [ ] Integration test: inventory dev startup opens diagnostics window (guarded).
- [ ] Integration test: diagnostics window reopen behavior via menu/icon command.

### Phase 6: Documentation and handoff
- [ ] Update HC-041 changelog with implementation outcome.
- [ ] Update HC-041 design doc with final implementation notes and deviations.
- [ ] Update HC-041 reference doc with final file paths and API signatures.
- [ ] Add quick “how to enable in another app” section.
- [ ] Record manual verification runbook and expected metric ranges.

### Stretch follow-ups (not required for first merge)
- [ ] Add optional sampling mode for very high action rates.
- [ ] Add export/download snapshot button for diagnostics report sharing.
- [ ] Add compact widget mode for always-on low-footprint diagnostics.
- [ ] Add cross-app toggle in engine so non-inventory apps can enable via env flag.
- [ ] Refactor: remove reduxPerfSlice.ts — move all diagnostics state out of Redux into module-level plain ring buffers.
- [ ] Refactor: remove recordPerfEvent/recordFrameEvent actions — middleware writes directly to external ring buffer, no dispatch.
- [ ] Refactor: frameMonitor writes to plain module-level ring buffer instead of dispatching recordFrameEvent.
- [ ] Refactor: reduxPerfMiddleware writes to plain module-level ring buffer instead of dispatching recordPerfEvent.
- [ ] Refactor: remove reduxPerf reducer registration from createAppStore (no diagnostics reducer in store).
- [ ] Refactor: create useDiagnosticsSnapshot hook — polls plain buffers on setInterval (~2Hz), computes snapshot, returns local state.
- [ ] Refactor: convert pause/reset/setWindowMs from Redux actions to plain module-level function calls on external storage.
- [ ] Refactor: update ReduxPerfWindow to use useDiagnosticsSnapshot hook instead of useSelector.
- [ ] Refactor: filter diagnostics-internal action types (reduxPerf/*) from top-action-rates table.
- [ ] Refactor: update diagnostics barrel exports (index.ts) — remove slice/action exports, add hook and plain-buffer API.
- [ ] Refactor: verify all apps still compile after removing reduxPerf reducer from store.
- [ ] Refactor: update unit tests for new non-Redux storage model.
