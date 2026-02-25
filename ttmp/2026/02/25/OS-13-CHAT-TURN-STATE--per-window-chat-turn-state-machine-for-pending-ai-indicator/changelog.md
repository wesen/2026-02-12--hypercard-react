# Changelog

## 2026-02-25

- Initial workspace created

## 2026-02-25

Added short implementation plan, explicit T1-T5 task list, and initial diary entry for OS-13 execution.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/design/01-implementation-plan-per-window-turn-state-machine.md — Defines desired behavior and state-machine transition contract.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/tasks.md — Task checklist for sequential implementation.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/reference/01-diary.md — Detailed diary step for setup and planning.

## 2026-02-25

Implemented per-window pending AI turn state machine, removed prior awaiting heuristics from chat window wiring, and added dedicated runtime unit tests.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/pendingAiTurnMachine.ts — New pure state machine module for pending indicator transitions.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/pendingAiTurnMachine.test.ts — Coverage for user-append gate, AI-signal transition, and error handling.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx — Replaced legacy awaiting logic with machine-driven integration.

## 2026-02-25

Validated OS-13 behavior changes and synchronized ticket docs (index/tasks/diary/changelog).

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/index.md — Updated RelatedFiles and summary metadata.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/tasks.md — Marked T5 complete after validation.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/reference/01-diary.md — Added implementation/validation details and commit references.

## 2026-02-25

Removed legacy local pending-turn runtime machine and replaced it with per-window Redux state keyed by `windowId`, then added a reusable frontend playbook for window-local state wiring.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/state/chatWindowSlice.ts — New per-window chat state slice for pending-turn lifecycle.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/state/selectors.ts — Added pending-indicator selector driven by window + timeline state.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx — Replaced local `useState` pending machine integration with Redux actions/selectors.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/pendingAiTurnMachine.ts — Deleted legacy runtime machine.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/pendingAiTurnMachine.test.ts — Deleted superseded tests.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/module.tsx — Wired launcher `windowId` into inventory window props.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx — Threaded `windowId` into `ChatConversationWindow`.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/docs/frontend/window-local-redux-state-playbook.md — New project playbook for window-local Redux state management.
