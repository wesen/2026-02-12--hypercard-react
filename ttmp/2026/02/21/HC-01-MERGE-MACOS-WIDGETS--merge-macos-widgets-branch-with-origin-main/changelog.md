# Changelog

## 2026-02-21

- Initial workspace created


## 2026-02-21

Investigated current merge state, captured conflict inventory in SQLite/TSV artifacts, and documented a phased resolution plan for chat/hypercard migration conflicts.

### Related Files

- /home/manuel/workspaces/2026-02-18/add-more-macos-widgets/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/design-doc/01-merge-conflict-investigation.md — Conflict taxonomy and phased merge strategy
- /home/manuel/workspaces/2026-02-18/add-more-macos-widgets/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/reference/01-diary.md — Detailed investigation diary
- /home/manuel/workspaces/2026-02-18/add-more-macos-widgets/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/scripts/capture_merge_state.sh — Reproducible merge snapshot script


## 2026-02-21

Re-ran merge against origin/main, resolved all conflicts, removed residual legacy hypercard-chat files, and validated targeted engine tests for event bus + artifacts slice.

### Related Files

- /home/manuel/workspaces/2026-02-18/add-more-macos-widgets/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — Resolved inventory app wiring conflict by aligning with origin/main chat module wiring
- /home/manuel/workspaces/2026-02-18/add-more-macos-widgets/2026-02-12--hypercard-react/packages/engine/src/chat/debug/eventBus.ts — Removed hidden conflict markers and aligned with upstream event bus implementation
- /home/manuel/workspaces/2026-02-18/add-more-macos-widgets/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/index.ts — Deleted residual legacy hypercard-chat entrypoint to match upstream structure
- /home/manuel/workspaces/2026-02-18/add-more-macos-widgets/2026-02-12--hypercard-react/packages/engine/src/index.ts — Resolved root exports conflict and retained upstream module surface

