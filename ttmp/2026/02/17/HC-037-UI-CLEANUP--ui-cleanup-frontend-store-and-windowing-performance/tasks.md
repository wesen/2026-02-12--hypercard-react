# Tasks

## TODO

- [ ] Add tasks here

- [x] W-D: Implement window render isolation and memoization pass (remove duplicate sorting, memoize WindowSurface/WindowBody, O(1) body lookup, and single focus dispatch on interaction start).

- [ ] W-C.0: Confirm baseline for drag smoothness and dispatch/action rate before overlay-lane changes
- [ ] W-C.1: Add drag overlay state module (ephemeral, keyed by windowId, with begin/update/commit/cancel operations)
- [ ] W-C.2: Define interaction lifecycle contract: pointerup=commit, pointercancel/blur/unmount=cancel, close-window-during-drag=cancel
- [ ] W-C.3: Add `effectiveBounds = overlay ?? reduxBounds` composition in DesktopShell rendering path
- [ ] W-C.4: Ensure overlay clears on all termination paths (pointercancel, escape, close, clearDesktopTransient, route/reset)
- [ ] W-C.5: Keep Redux canonical for settled state; dispatch durable move/resize commit only on commit path
- [ ] W-C.6: Optional checkpoint mode: add configurable periodic commit for long drags (feature flag)
- [ ] W-C.7: Add focused-window behavior guard so drag start does not produce redundant focus churn
- [ ] W-C.8: Add tests for commit path, cancel path, and close-while-dragging path
- [ ] W-C.9: Add Storybook scenario with overlay visualization and interruption test controls
- [ ] W-C.10: Measure regression/baseline delta (drag FPS feel, action counts, rerender counts)
- [ ] W-C.11: Document rollout/rollback switches and note any known edge behavior

- [ ] W-E.0: Confirm baseline for selector invalidation and render fan-out under high-frequency dragging
- [ ] W-E.1: Extend windowing slice with `interaction` substate (activeId/mode/draftsById/start geometry)
- [ ] W-E.2: Add actions/reducers for `beginInteraction`, `updateInteractionDraft`, `commitInteraction`, `cancelInteraction`, `clearInteraction`
- [ ] W-E.3: Keep durable `windows` map untouched on move events; update only `interaction.draftsById` during pointermove
- [ ] W-E.4: Add selectors for narrow subscriptions (`selectInteractionDraftById`, `selectEffectiveWindowBoundsById`, `selectActiveInteractionId`)
- [ ] W-E.5: Refactor window rendering to subscribe per-window to effective bounds to reduce whole-tree rerenders
- [ ] W-E.6: Update interaction controller to dispatch interaction actions instead of direct move/resize on every move
- [ ] W-E.7: Commit final bounds from draft on pointerup and clear interaction state atomically
- [ ] W-E.8: Add dev-only diagnostics counters for draft action rate, commit count, cancel count, and stale draft detection
- [ ] W-E.9: Add tests for reducer transitions and selector memoization guarantees
- [ ] W-E.10: Add integration tests for mixed workloads (multiple windows, rapid focus changes, resize + close)
- [ ] W-E.11: Validate compatibility with W-A throttling and W-D memoization pass
- [ ] W-E.12: Record measured render/action improvements and residual costs (Redux middleware/devtools overhead)
