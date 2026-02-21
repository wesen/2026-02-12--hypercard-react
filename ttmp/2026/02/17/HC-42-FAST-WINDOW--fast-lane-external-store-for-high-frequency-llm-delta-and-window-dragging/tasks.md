# Tasks

## TODO

- [x] Confirm baseline and acceptance metrics
- [x] Capture current Redux action rate for `llm.delta`, `moveWindow`, and `resizeWindow` in dev sessions
- [x] Capture baseline UI smoothness signals (frame drops/jank notes) for chat streaming and drag interactions
- [x] Define measurable success thresholds (dispatch reduction + parity checks) in ticket notes
- [ ] Implement shared fast-store primitive
- [ ] Add `createFastStore` abstraction with immutable snapshot updates and `subscribe/getSnapshot`
- [ ] Add optional requestAnimationFrame notification coalescing utility
- [ ] Add unit tests for subscribe/unsubscribe, update propagation, and coalesced notification behavior
- [ ] Integrate chat fast lane (`llm.delta`)
- [ ] Add `fastDeltaStore.ts` under inventory chat feature
- [ ] Reroute `llm.delta` handling in `InventoryChatWindow.tsx` from per-event Redux dispatch to fast-store updates
- [ ] Keep durable Redux transitions for `llm.start`, `llm.final`, and error/reset events
- [ ] Implement chat overlay merge selector/hook to combine Redux messages + transient fast deltas for rendering
- [ ] Ensure debug/event viewer keeps visibility into stream events (either mirrored diagnostics lane or dedicated debug feed)
- [x] Integrate window drag/resize fast lane
- [x] Add `dragFastStore.ts` under windowing shell
- [x] Update `useWindowInteractionController.ts` pointermove logic to write transient draft bounds into fast store
- [x] Update `DesktopShell.tsx` to overlay draft bounds at render time while drag/resize is active
- [x] Commit final bounds to Redux only on pointerup/pointercancel (with optional periodic checkpoints if configured)
- [x] Maintain focus/z-index behavior and close/remove cleanup semantics during active drags
- [x] Add hard-cutover safety guards (no feature flags)
- [x] Hard-cutover decision recorded: no fast-lane feature flags and no migration toggle path
- [ ] Add dev-only invariant checks for stuck drafts/stale delta overlays
- [x] Ensure fast-store cleanup on conversation reset, stream end, pointercancel, and unmount
- [ ] Verification and regression testing
- [x] Add/update tests that assert durable Redux state parity before/after fast-lane integration
- [ ] Add integration checks for long stream sessions, rapid drag interactions, and mixed workloads
- [ ] Re-capture dispatch/jank metrics and compare against baseline
- [ ] Update docs and handoff assets
- [ ] Update design-doc references with final file paths and deviations from pseudocode
- [ ] Add changelog entry summarizing implementation decisions and tradeoffs
- [ ] Produce short implementation handoff note for follow-on ticket(s) and QA verification steps

## W-C Track (Active Runtime Lane)

- [x] W-C.0 Confirm selected implementation style: **option 2 small dedicated store**
- [x] W-C.1 Add dedicated drag overlay store module (`dragOverlayStore.ts`) with `begin/update/clear/clearAll/subscribe/getSnapshot`
- [x] W-C.2 Add `useSyncExternalStore` hook wrapper for drag overlay snapshots
- [x] W-C.3 Extend interaction controller with commit/cancel lifecycle callbacks (pointerup commit, pointercancel cancel)
- [x] W-C.4 Route pointermove geometry into overlay store (no durable Redux geometry dispatch on move)
- [x] W-C.5 Commit final bounds to Redux once on pointerup (move or resize)
- [x] W-C.6 Cancel path clears overlay and performs no durable commit
- [x] W-C.7 Apply `effectiveBounds = overlay ?? reduxBounds` in DesktopShell window definitions
- [x] W-C.8 Add cleanup on window close and shell unmount to avoid stale drafts
- [x] W-C.9 Add focused-window guard so interaction start does not churn duplicate focus actions
- [x] W-C.10 Add targeted unit tests for drag overlay store semantics
- [x] W-C.11 Verify engine `typecheck` and `test` pass with W-C enabled
- [x] W-C.12 Record metrics/observations and decisions in diary

## W-E Cleanup (Completed)

- [x] Remove `windowing.interaction` state branch from Redux slice and types
- [x] Remove W-E reducers/actions and selector exports from windowing domain API
- [x] Remove W-E reducer/selector tests and update baseline counts
- [x] Confirm runtime remains W-C-only with W-D memoization/isolation behavior
