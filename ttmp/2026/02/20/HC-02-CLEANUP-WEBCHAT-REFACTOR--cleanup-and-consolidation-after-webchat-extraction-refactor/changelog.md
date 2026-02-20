# Changelog

## 2026-02-20

- Initial workspace created


## 2026-02-20

Completed exhaustive post-HC-01 cleanup assessment: enumerated touched-file inventory from HC-01 commits (111 paths), identified legacy leftovers/consolidation targets, and produced prioritized cleanup backlog.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/design-doc/01-exhaustive-legacy-and-consolidation-assessment-after-hc-01.md — Primary assessment report
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Detailed investigation diary
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/tasks.md — Derived cleanup backlog tasks


## 2026-02-20

Executed F4: moved suggestions to timeline artifacts, added starter-suggestion consume-on-first-send lifecycle, updated selectors/tests, and checked task #6 (commits ab5b5b7, 634fd16).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — F4 starter suggestion lifecycle + send wrapper
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.ts — F4 reducers for suggestion entity upsert and consumption
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts — F4 SEM suggestion projection to timeline artifacts
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/design-doc/02-f4-suggestions-as-timeline-entities-and-starter-consumption.md — F4 design rationale and implementation plan


## 2026-02-20

Follow-up fix after F4: prevent starter suggestions from reappearing after chat starts by upserting and consuming starter suggestions atomically at first send (commit 43f31aa).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — Fix starter suggestion lifecycle race on first send
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Step 8 diary entry for post-F4 suggestion persistence fix

