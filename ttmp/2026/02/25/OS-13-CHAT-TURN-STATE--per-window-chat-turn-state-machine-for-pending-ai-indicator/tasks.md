# Tasks

## TODO

- [x] T1: Author per-window turn-state machine design contract (phases, transitions, clear rules).
- [x] T2: Implement `usePendingAiTurn` state machine hook and wire `ChatConversationWindow` to it.
- [x] T3: Remove legacy pending-spinner heuristics and debug-only decision branches superseded by the state machine.
- [x] T4: Add or update tests to cover: (a) spinner appears only after user message append, (b) clears on AI-side timeline activity, (c) survives user-echo and streaming-without-assistant-message cases.
- [x] T5: Run typecheck/tests, then update diary/changelog/index related-file links with results.
- [x] T6: Replace local pending-turn runtime machine with a per-window Redux slice keyed by `windowId`.
- [x] T7: Thread `windowId` from launcher render params into `ChatConversationWindow` and bind lifecycle cleanup to window unmount.
- [x] T8: Remove legacy `pendingAiTurnMachine` files/tests and replace coverage with slice + selector tests.
- [x] T9: Publish a window-local Redux wiring playbook in project docs.
