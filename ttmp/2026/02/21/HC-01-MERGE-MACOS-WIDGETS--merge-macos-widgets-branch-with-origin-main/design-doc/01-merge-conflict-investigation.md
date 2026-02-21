---
Title: Merge conflict investigation
Ticket: HC-01-MERGE-MACOS-WIDGETS
Status: active
Topics:
    - frontend
    - debugging
    - cleanup
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/App.tsx
      Note: Inventory app wiring conflict hotspot
    - Path: packages/engine/src/index.ts
      Note: One of seven manual UU merge files
    - Path: ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/scripts/capture_merge_state.sh
      Note: Generates reproducible merge/conflict snapshot artifacts
    - Path: ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/various/merge_state.sqlite
      Note: Queryable conflict inventory used for clustering
    - Path: ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/various/unmerged_status.tsv
      Note: Raw unmerged status codes and paths
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-21T13:22:52.711634969-05:00
WhatFor: ""
WhenToUse: ""
---


# Merge conflict investigation

## Executive Summary

- Current branch `task/add-more-macos-widgets` is **10 commits ahead** of merge base `b1e64e25`, while `origin/main` is **75 commits ahead** (`various/merge_summary.txt`).
- Working tree is in an unresolved conflict state with **44 unmerged paths** and no `MERGE_HEAD` present; reflog shows a rebase attempt on 2026-02-21 followed by abort and reset (`various/reflog_recent.txt`).
- Conflict surface is concentrated in chat/hypercard migration code, not in the newly added macOS widget components:
  - `apps/inventory` unmerged paths: 17
  - `packages/engine` unmerged paths: 27
  - conflict code mix: `UD 15`, `AU 7`, `UA 7`, `DD 7`, `UU 7`, `DU 1`
- Net result: merge is still tractable, but should be handled as a **migration reconciliation** (chat extraction + path moves), not a widget-only merge.

## Problem Statement

- The branch adds macOS-style widget work and related stories/docs, while `origin/main` contains a large chat/hypercard extraction and restructuring.
- The repository currently contains unresolved index entries (`git ls-files -u`) but lacks active merge metadata (`.git/MERGE_HEAD` absent), which makes current conflict state hard to reason about and easy to corrupt with ad-hoc edits.
- We need a reproducible conflict inventory and a deterministic resolution order before touching conflict files.

## Proposed Solution

1. Keep a reproducible snapshot workflow in-ticket:
   - Script: `scripts/capture_merge_state.sh`
   - Artifacts: `various/merge_state.sqlite`, `various/unmerged_status.tsv`, `various/unmerged_blobs.tsv`, `various/conflict_counts.tsv`, `various/conflict_matrix.tsv`, `various/merge_summary.txt`
2. Resolve conflicts in phases:
   - Phase A (mechanical): close `DD`, `UD`, `UA`, `AU`, `DU` paths using default policy per cluster.
   - Phase B (manual): resolve the 7 `UU` files with targeted merges.
   - Phase C (verification): run targeted tests/stories and confirm no regressions in chat runtime + widget exports.
3. Prefer `origin/main` behavior for chat/hypercard architecture unless macOS widget work explicitly changed it.

## Design Decisions

- Decision: use SQLite-backed snapshot artifacts.
  - Rationale: conflict output was already long and noisy; SQL grouping makes repeatable analysis quick.
- Decision: classify conflicts by architectural cluster.
  - Rationale: file-level triage missed the key pattern that most conflicts map to chat extraction paths.
- Decision: treat missing `MERGE_HEAD` as a process smell and recommend clean restart for actual resolution execution.
  - Rationale: unresolved index without live merge metadata is fragile and easy to accidentally invalidate.

### Conflict clusters (from `merge_state.sqlite`)

| Cluster | Count | Notes |
| --- | ---: | --- |
| inventory-legacy-chat | 15 | Mostly deleted upstream during extraction |
| engine-hypercard-chat-legacy | 11 | Legacy paths added/modified in branch, removed upstream |
| engine-hypercard-new | 6 | New upstream first-class hypercard module |
| engine-chat-debug | 5 | Upstream moved debug/event bus utilities |
| engine-widget-stories | 4 | Storybook files tied to chat window cleanup |
| inventory-app-wiring | 2 | `apps/inventory/src/App.tsx`, `apps/inventory/src/app/store.ts` |
| engine-root-exports | 1 | `packages/engine/src/index.ts` export surface merge |

### `UU` files requiring manual merge

1. `apps/inventory/src/App.tsx`
2. `apps/inventory/src/app/store.ts`
3. `packages/engine/src/chat/debug/eventBus.test.ts`
4. `packages/engine/src/components/widgets/CodeEditorWindow.stories.tsx`
5. `packages/engine/src/hypercard/artifacts/artifactsSlice.test.ts`
6. `packages/engine/src/hypercard/debug/RuntimeCardDebugWindow.tsx`
7. `packages/engine/src/index.ts`

## Alternatives Considered

1. Resolve conflicts directly from current state.
   - Rejected for now: no `MERGE_HEAD`; current state likely from aborted rebase/reset sequence.
2. Ignore structured inventory and resolve by IDE only.
   - Rejected: high chance of silently dropping upstream chat architecture updates.
3. Re-run merge immediately without documenting.
   - Rejected: hard to audit decisions later and hard to hand off.

## Implementation Plan

1. Preserve this ticket’s script/artifacts and commit them.
2. Start from a clean index state before resolution execution (recommended in a separate step/branch).
3. Re-run merge/rebase against `origin/main`.
4. Apply resolution policy:
   - `DD`: accept deletions.
   - `UD`: default to upstream deletions unless file is still used by new widget wiring.
   - `UA`: generally keep upstream additions.
   - `AU`: keep only when not superseded by upstream relocated equivalent.
   - `DU`: keep upstream `packages/engine/src/hypercard/editor/editorLaunch.ts` variant.
   - `UU`: manual merge with tests.
5. Validate:
   - inventory app window wiring (`App.tsx`, `store.ts`)
   - hypercard/chat tests around `eventBus` and `artifactsSlice`
   - storybook for `CodeEditorWindow` and widget export surface.

## Open Questions

1. Should final integration be a merge commit or a rebase before merge?
2. Is any behavior from branch-local `hypercard-chat/*` intentionally preferred over upstream `chat/debug/*` and `hypercard/*` paths?
3. Should old `apps/inventory/src/features/chat/*` stories be preserved in archive form, or removed entirely with upstream?

## References

- `../reference/01-diary.md`
- `../various/merge_summary.txt`
- `../various/conflict_counts.tsv`
- `../various/unmerged_status.tsv`
- `../various/conflict_matrix.tsv`
- `../various/reflog_recent.txt`
- `../scripts/capture_merge_state.sh`
