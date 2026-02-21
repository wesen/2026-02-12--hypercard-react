# Changelog

## 2026-02-17

- Initial workspace created


## 2026-02-17

Added full implementation blueprint for fast external-store architecture covering chat llm.delta and window drag/resize hot paths, including dual-lane design rationale, pseudocode, Mermaid timeline diagrams, phased rollout plan, risk mitigations, and a detailed new-developer task checklist for execution and validation.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/design-doc/01-implementation-blueprint-external-fast-store-for-llm-delta-and-window-dragging.md — Core design and handoff artifact
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/tasks.md — Execution checklist for implementation and verification


## 2026-02-17

Expanded HC-42 execution planning with dedicated W-C and W-E task tracks, explicitly selected W-C option 2 (small dedicated store), and initialized a running implementation diary to record incremental commits and validation.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/tasks.md — Added detailed W-C and W-E task checklists


## 2026-02-17

Implemented W-C using option 2 dedicated drag overlay store (external store + useSyncExternalStore + commit/cancel interaction lifecycle) and added W-E groundwork in Redux (interaction substate, reducers, selectors, and tests) while keeping W-C as active runtime path.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — Runtime integration for overlay effective bounds
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/dragOverlayStore.ts — New W-C drag overlay store
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts — Commit/cancel lifecycle callbacks for W-C
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/selectors.ts — W-E fine-grained selectors
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts — W-E interaction channel actions/reducers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/reference/01-diary.md — Implementation log updated with milestones and validation
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/tasks.md — Task state updated for completed W-C and partial W-E work


## 2026-02-17

Switched from W-C runtime to W-E hardcutover: DesktopShell now uses Redux interaction channel for drag draft begin/update/commit/cancel; durable bounds stay untouched during move bursts and commit on interaction end. Completed remaining W-E implementation tasks including render fan-out stabilization and compatibility evaluation with W-A/W-D.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — W-E runtime wiring and hardcutover integration
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts — Stable interaction callbacks and commit/cancel lifecycle behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts — Redux interaction channel reducers used as runtime path
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/reference/01-diary.md — Diary entries added for W-E runtime switch and validation
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/tasks.md — W-E remaining tasks checked and hardcutover decision updated


## 2026-02-17

Adjusted runtime direction to use both channels concurrently: W-C drag overlay was restored and DesktopShell now mirrors interaction begin/update/commit/cancel into W-E Redux interaction state while rendering with overlay-first effective bounds. This keeps fast-lane overlay behavior and preserves Redux interaction visibility.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — Dual-lane runtime wiring (overlay + interaction channel)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/dragOverlayStore.ts — Restored W-C external overlay store
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/dragOverlayStore.test.ts — Overlay store behavior tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/tasks.md — W-C/W-E task wording updated to reflect coexistence


## 2026-02-17

Switched runtime back to W-C only after confirming W-C+W-E dual writing adds redundant high-frequency update work and overlapping draft sources. DesktopShell now uses overlay draft geometry as the sole active interaction lane and commits durable bounds once on interaction end.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — Runtime cutover to W-C-only pointer interaction lane
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/tasks.md — Decision wording updated to reflect W-C runtime selection


## 2026-02-17

Removed W-E entirely from the windowing codebase to enforce a single runtime model. Deleted interaction-channel state/reducers/selectors/exports and corresponding tests, keeping W-C drag overlay + W-D memoization/isolation as the active performance path.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/types.ts — Removed `WindowInteraction*` types and `WindowingState.interaction`
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts — Removed W-E reducers and interaction state handling
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/selectors.ts — Removed W-E selectors
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/index.ts — Removed W-E exports
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/windowing.test.ts — Removed W-E test coverage blocks
