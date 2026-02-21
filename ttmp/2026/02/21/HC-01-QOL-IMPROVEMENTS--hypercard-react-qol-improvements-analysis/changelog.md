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

