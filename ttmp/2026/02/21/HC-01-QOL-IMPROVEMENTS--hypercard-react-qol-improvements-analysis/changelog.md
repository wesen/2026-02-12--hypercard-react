# Changelog

## 2026-02-21

- Created ticket workspace `HC-01-QOL-IMPROVEMENTS` with design-doc + diary artifacts.
- Completed cross-subsystem evidence gathering for event viewer, chat stats, and desktop windowing behavior.
- Authored `design-doc/01-qol-improvements-implementation-analysis.md` with implementation recommendations, file references, testing plan, and phased roadmap.
- Added ongoing investigation notes to `reference/01-diary.md` with prompt context, commands, failures, and review instructions.

## 2026-02-21

Completed full implementation analysis for seven QOL issues (event viewer scroll/copy/replay, cached tokens footer, multi-window dedupe policy, emoji title cleanup, conversation-id clipboard) with file-level evidence and phased implementation plan.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/design-doc/01-qol-improvements-implementation-analysis.md — Primary analysis deliverable
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Chronological investigation diary


## 2026-02-21

Related key files to design-doc/diary, uploaded bundled analysis+diary PDF to reMarkable at /ai/2026/02/21/HC-01-QOL-IMPROVEMENTS, and validated ticket health with docmgr doctor (all checks passed).

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/changelog.md — Delivery and validation record
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/tasks.md — Task completion state


## 2026-02-21

Updated analysis per feedback: header token totals now explicitly include cached totals, footer remains last-message cache stats, and issue #6 now documents existing diagnostics ring buffer vs chat event bus/no-replay behavior.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/design-doc/01-qol-improvements-implementation-analysis.md — Updated token semantics and buffering clarification
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Recorded follow-up diary step for feedback incorporation


## 2026-02-21

Execution started: expanded per-issue task checklist and completed Issue 1 (event viewer scroll-follow fix) with commit 85d46d7 and targeted tests passing.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.test.ts — Threshold behavior tests
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.tsx — Auto-follow disable-on-scroll behavior
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Detailed execution diary for Issue 1
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/tasks.md — Per-issue exhaustive checklist and Issue 1 progress


## 2026-02-21

Completed Issue 2 code slice: added event payload copy action with clipboard fallback and feedback states (commit 2a292b9); targeted debug tests pass.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.tsx — Event payload copy action and feedback state
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/clipboard.test.ts — Clipboard helper tests
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/clipboard.ts — Clipboard helper with fallback
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Issue 2 implementation diary


## 2026-02-21

Completed Issue 3 code slice: header token totals now include cached totals and footer now includes CacheRead when available (commit 90e0041); selector and SEM-adjacent tests pass.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/components/StatsFooter.tsx — Footer cache-read token display
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/state/selectors.test.ts — Selector semantics tests updated
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/state/selectors.ts — Token selector semantics updated
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Issue 3 implementation diary


## 2026-02-21

Completed Issue 4 code slice: top-level card opens now default to open-new via explicit dedupe policy option (commit 60de021); windowing command and reducer tests pass.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/desktopCommandRouter.test.ts — Routing assertions for dedupe:false
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/desktopCommandRouter.ts — Built-in commands request dedupe:false
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Open policy implementation (dedupe optional)
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Issue 4 implementation diary


## 2026-02-21

Completed Issue 5 code slice: removed duplicate emoji title prefixes via app-title normalization plus defensive WindowTitleBar guard (commit 7c32a61); titlebar tests pass.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — Window title text normalization
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowTitleBar.test.ts — Titlebar dedupe tests
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowTitleBar.tsx — Defensive icon prefix guard
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Issue 5 implementation diary


## 2026-02-21

Completed Issue 6 code slice: event bus now retains bounded per-conversation history, viewer initializes from retained history, and clear semantics are implemented (commit 871e084); debug event tests pass.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.tsx — Viewer initialization from history and clear wiring
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/eventBus.test.ts — History retention/clear/cap tests
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/eventBus.ts — Retained history + replay/clear APIs
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Issue 6 implementation diary


## 2026-02-21

Completed Issue 7 code slice: added chat header conversation-id clipboard action with transient success/error feedback (commit cda2632); validated with file-scoped biome checks due existing workspace type/build baseline failures.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — Header copy action and clipboard wiring
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Step 11 execution diary for issue 7


## 2026-02-21

Implementation run complete for Issues 1-7 with focused commits, updated checklists/diary, final doctor pass, and refreshed reMarkable upload (new file: HC-01-QOL-IMPROVEMENTS Analysis Update).

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Final implementation diary status
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/tasks.md — Execution checklist completion state


## 2026-02-21

Fixed Storybook startup regression: root shared .storybook config now has matching root Storybook dependencies, resolving addon lookup warnings and the Vite preview import error (storybook/internal/preview/runtime).

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/package.json — Root Storybook dependency alignment
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Step 13 troubleshooting diary


## 2026-02-21

Event viewer controls clarified: replaced ambiguous pinned/free toggle with explicit Hold and Follow Stream actions so live tailing can be resumed intentionally (commit 3c64b69).

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.tsx — Follow stream and hold controls
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/reference/01-diary.md — Step 14 diary entry


## 2026-02-21

Suggestion-click UX fix completed: clicking a suggestion now hides suggestion chips until a new suggestions block arrives (commit 27b9ee5).

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — Consume starter+assistant suggestions on suggestion send
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.ts — Clear consumed flag when new suggestions are upserted
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.test.ts — Reducer test for consumed-state reset


## 2026-02-21

Event viewer follow-up implemented: added toggles to hide `llm.delta` and `llm.thinking.delta` events, plus `Export YAML` download for currently visible events (commit 34dad4c).

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.tsx — Event-type visibility toggles and YAML export action
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.test.ts — Added helper-level tests for delta filtering and export payload generation

## 2026-02-22

Ticket status set to `complete` per user directive; follow-up bugfix work moved to HC-56-LITTLE-BUGS.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/index.md — Ticket closure status updated
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/22/HC-56-LITTLE-BUGS--little-bugs-follow-up-widget-error-timeline-handling/index.md — Follow-up ticket created
