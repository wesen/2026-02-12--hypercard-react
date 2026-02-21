# Changelog

## 2026-02-13

- Initial workspace created


## 2026-02-13

Created HC-018 ticket package with detailed debug-pane/introspection design guide, added runnable event-pipeline prototype evidence, and uploaded the guide to reMarkable at /ai/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/design/01-debug-pane-and-introspection-system-implementation-guide.md — Primary implementation guide for debug pane and DSL runtime introspection.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/reference/01-diary.md — Step-by-step execution log for setup
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/01-debug-event-pipeline-simulation.out.txt — Simulation output proving retention/redaction/filtering behavior.


## 2026-02-13

Step 3: implemented RuntimeDebugHooks plumbing across runtime/shell/renderer boundaries (commit 3a0976a).

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/cards/runtime.ts — Core debug event model and instrumentation emit points
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/CardRenderer.tsx — UI emit/inline action debug event hooks
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx — Shell-level dispatch debug emission and hook threading


## 2026-02-13

Step 4: built new DSL-driven Book Tracker debug app with collapsible debug pane and Storybook coverage (commit fa65b66).

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/book-tracker-debug/src/debug/DebugPane.tsx — New debug timeline/detail/state inspector UI
- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/book-tracker-debug/src/domain/stack.ts — Full CardDefinition book app for debug workflow
- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/.storybook/main.ts — Storybook now loads new app stories


## 2026-02-13

Step 6: added executable Task 4 validation script for hook emission/ring-buffer/redaction/filter behavior (commit d51172d).

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/book-tracker-debug/src/debug/useRuntimeDebugHooks.ts — Exported sanitizer utility used by validation
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/02-runtime-debug-hooks-and-debug-slice-tests.mjs — Executable assertions for runtime/debug pipeline


## 2026-02-13

Step 5: introduced shell debug-pane layout mode replacing legacy tabs for the debug profile (commit e5c0d48).

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/book-tracker-debug/src/App.tsx — Switched profile to layoutMode=debugPane
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx — Added layoutMode and renderDebugPane support


## 2026-02-13

Step 8: authored detailed postmortem and beginner DSL tutorial documents and uploaded both to reMarkable ticket folder.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/design/02-engineering-postmortem-dsl-debug-app-build.md — Comprehensive engineering recap
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/design/03-how-to-create-an-app-using-card-stacks-dsl.md — Full onboarding tutorial


## 2026-02-13

Step 7: split book-tracker-debug cards into per-card modules and extracted reusable RuntimeDebugPane into engine (commit 8c99abf).

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/book-tracker-debug/src/domain/cards — CardDefinition modules split by screen/card
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/RuntimeDebugPane.stories.tsx — Storybook coverage for reusable debug pane
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/RuntimeDebugPane.tsx — Reusable debug pane component added


## 2026-02-17

Bulk close through HC-034 per cleanup reset

