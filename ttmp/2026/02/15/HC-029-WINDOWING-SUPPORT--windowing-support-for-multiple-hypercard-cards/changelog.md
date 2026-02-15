# Changelog

## 2026-02-15

- Initial workspace created


## 2026-02-15

Created ticket HC-029, imported mac1-windowing.jsx, authored a 4504-word windowing framework design study (with diagrams/pseudocode/UX wire sketches), and recorded a frequent multi-step research diary.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/01-windowing-container-framework-study.md — Main deliverable containing architecture and UX study
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/reference/01-diary.md — Frequent step-by-step research diary
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx — Imported inspiration source


## 2026-02-15

Added a detailed clean-cutover implementation plan (no backwards compatibility, no wrappers) and expanded ticket tasks into a 51-item phase-by-phase execution checklist.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/02-clean-cutover-implementation-plan.md — Detailed clean-cutover plan deliverable
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/tasks.md — Expanded detailed execution task list


## 2026-02-15

Unblocked Storybook preset loading by installing workspace dependencies and changing root storybook script to run via apps/inventory workspace (commit ae7237f).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/package.json — Storybook invocation now uses workspace binary
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/reference/01-diary.md — Step 8 captures triage details and verification commands


## 2026-02-15

Implemented first Storybook-visible Phase 2 slice: added desktop windowing primitives (menu bar, icon layer, window layer/surface/title/resize), styled new parts, exported the module, and added Idle/TwoWindowOverlap/DenseWindowSet stories (commit d41894c).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx — New HC-029 story suite for primitive desktop states
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/index.ts — New public windowing primitive exports
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/tasks.md — Phase 2 tasks 15


## 2026-02-15

Extracted reusable useWindowInteractionController hook for window drag/resize with pointer listener cleanup guarantees, rewired Storybook demo to use it, and checked Phase 2 Task 19 complete (commit 8dacf1e).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts — New shared interaction controller for move/resize
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/tasks.md — Task 19 checked complete


## 2026-02-15

Expanded Storybook coverage with dedicated suites for windowing subcomponents (menu bar, icon layer, title bar, resize handle, window surface, window layer) plus shared fixtures for consistent demo data (commit 16b3955).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopMenuBar.stories.tsx — New subcomponent stories for menu states
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowLayer.stories.tsx — New subcomponent stories for z-order/focus behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/reference/01-diary.md — Step 11 logs subcomponent story expansion and validation


## 2026-02-15

Added CSS Mapping and Design Improvements design doc (03): comprehensive property-by-property mapping from mac1 inline styles to engine tokenized CSS, identified 6 major visual gaps (title bar stripes, menu hover inversion, icon selection inversion, window border-radius, body padding, scrollbar chrome), proposed 9 design improvements, and organized into 3 implementation tiers.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/03-css-mapping-and-design-improvements.md — New design doc with CSS mapping and improvements


## 2026-02-15

Implemented all 14 CSS improvement tasks (52-65): restored mac1 visual fidelity with title bar stripes, inverted menu/icon highlights, window border-radius, dialog variant, menu separators, window open animation, scrollbar styling, and focus ring. Two commits: f4fb991 (CSS+structural) and 841e1c0 (stories).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx — Separator rendering via hr element
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowSurface.tsx — Dialog variant support
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/types.ts — Added separator type
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/theme/base.css — All windowing CSS changes — tokens


## 2026-02-15

Phase 1 complete: implemented windowing state slice (windowingSlice.ts, selectors.ts, types.ts) with 11 reducers, 10 selectors, and 47 passing unit tests. Covers open/focus/close/move/resize windows, desktop UI state, per-session nav, dedupe, z-order, viewport clamp, and focus fallback. Commit 52b3284.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/windowing.test.ts — 47 unit tests for windowing slice
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/selectors.ts — Windowing state selectors
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts — Core windowing reducers


## 2026-02-15

Desktop stories now fill 100vw×100vh. Added 3 big-desktop stories (BigDesktopIdle with 11 icons, BigDesktopWorkspace with 5 windows, BigDesktopSixWindows with 6 tiled windows). Commit 8efd9e5.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx — Full-viewport stories with configurable icons


## 2026-02-15

Wired windowingReducer into createAppStore, exported windowing from engine barrel, rewrote all desktop stories to use real Redux store with dispatch instead of local useState. Fixed fullscreen sizing with position:absolute inset:0. All 95 tests pass. Commit 5de82bc.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts — Added windowingReducer to engine store
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx — Redux-backed stories with real windowing slice
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/index.ts — Exported windowing feature from barrel


## 2026-02-15

Phase 3+4 complete: DesktopShell replaces HyperCardShell for windowing mode. CardSessionHost renders cards per-window with session-isolated runtime keys. Inventory app migrated. Production build clean. Tasks 22-30, 32 done. Commit 676e5aa.

### Related Files

- apps/inventory/src/App.tsx — Migrated from HyperCardShell to DesktopShell
- packages/engine/src/components/shell/windowing/CardSessionHost.tsx — Per-window card rendering with session-aware runtime keying
- packages/engine/src/components/shell/windowing/DesktopShell.tsx — Multi-window shell orchestrating menus

