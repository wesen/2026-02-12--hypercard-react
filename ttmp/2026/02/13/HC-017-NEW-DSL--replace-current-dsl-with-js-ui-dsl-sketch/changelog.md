# Changelog

## 2026-02-13

- Initial workspace created


## 2026-02-13

Completed DSL replacement analysis package: imported source spec, mapped current architecture, authored migration guide, and added runnable experiments for resolver/runtime semantics.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/01-current-dsl-deep-dive-and-migration-guide-to-new-screen-dsl.md — Primary implementation guide deliverable.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/reference/01-diary.md — Detailed execution diary with failures and commands.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/01-resolve-redux-selectors.mjs — Experiment proving selector access to Redux-shaped state.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/02-runtime-update-semantics.mjs — Experiment proving updateBindings/updateActions behavior.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/03-current-dsl-gap-audit.sh — Audit script for migration surface and DSL usage.


## 2026-02-13

Uploaded bundled migration guide + diary to reMarkable as 'HC-017 New DSL Migration Guide' in /ai/2026/02/13/HC-017-NEW-DSL and verified remote listing.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/01-current-dsl-deep-dive-and-migration-guide-to-new-screen-dsl.md — Guide included in uploaded bundle.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/reference/01-diary.md — Diary included in uploaded bundle.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/tasks.md — Marked upload task complete after successful bundle publish.


## 2026-02-13

Published final refreshed reMarkable bundle after diary/index updates as 'HC-017 New DSL Migration Guide FINAL'.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/index.md — Updated ticket overview links before final publish.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/reference/01-diary.md — Updated diary then republished bundled PDF.


## 2026-02-13

Added follow-up architecture analysis replacing ScreenDefinition with CardDefinition and defining scoped local/shared state management (card/cardType/background/stack/global + shared Redux bridge), with simulation evidence and single-document reMarkable upload.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md — New detailed implementation guide for scoped state model.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/reference/01-diary.md — Added Step 6 documenting follow-up request work and decisions.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/04-carddefinition-state-scope-simulation.out.txt — Simulation output validating precedence and scoped action routing.


## 2026-02-13

Simplified CardDefinition scoped-state architecture by removing capability policy concepts; model now relies on scoped local state plus namespaced shared selector/action registries. Republished updated single-card-state document to reMarkable.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md — Removed capabilities fields and guard logic from types
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/reference/01-diary.md — Added Step 7 documenting capability removal request and applied simplification.


## 2026-02-13

Executed implementation tasks 9-16: added CardDefinition DSL core + scoped runtime state, rewrote shell runtime, removed legacy DSL modules, ported inventory/todo apps and BookTracker stories to new DSL/JS API, validated via typecheck + app builds, and uploaded refreshed implementation-progress bundle to reMarkable.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts — Inventory examples ported to CardDefinition DSL/JS API.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/domain/stack.ts — Todo examples ported to CardDefinition DSL/JS API.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/cards/runtimeStateSlice.ts — Scoped runtime Redux state reducers/selectors for card/cardType/background/stack/global.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/cards/types.ts — New CardDefinition DSL core contracts and scoped registry types.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx — Shell runtime rewritten to execute new expression/action pipeline.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/widgets/BookTracker.stories.tsx — BookTracker stories ported to CardDefinition stack and shared registries.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/reference/01-diary.md — Diary steps 8-14 documenting task-by-task execution and validation.


## 2026-02-13

Fixed Storybook Detail Cards regression 'cf.compute is not a function' by preserving function-valued and non-plain values in resolveValueExpr; added regression experiment artifact and revalidated typecheck + app builds.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/cards/runtime.ts — Core runtime resolver fix for compute function pass-through.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/reference/01-diary.md — Step 15 diary narrative for debugging and validation details.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/05-resolve-valueexpr-function-pass-through.mjs — Experiment that reproduces and validates the regression fix.

