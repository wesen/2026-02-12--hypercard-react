# Tasks

## TODO

- [x] T1: Author per-window turn-state machine design contract (phases, transitions, clear rules).
- [x] T2: Implement `usePendingAiTurn` state machine hook and wire `ChatConversationWindow` to it.
- [x] T3: Remove legacy pending-spinner heuristics and debug-only decision branches superseded by the state machine.
- [x] T4: Add or update tests to cover: (a) spinner appears only after user message append, (b) clears on AI-side timeline activity, (c) survives user-echo and streaming-without-assistant-message cases.
- [x] T5: Run typecheck/tests, then update diary/changelog/index related-file links with results.
