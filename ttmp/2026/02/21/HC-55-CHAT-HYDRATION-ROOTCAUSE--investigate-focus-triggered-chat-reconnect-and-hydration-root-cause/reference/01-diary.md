---
Title: Diary
Ticket: HC-55-CHAT-HYDRATION-ROOTCAUSE
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Confirmed SEM mapping coverage vs timeline projection coverage
    - Path: packages/engine/src/chat/sem/semRegistry.ts
      Note: Diary captures direct timeline.upsert and SEM handler overlap findings
    - Path: packages/engine/src/chat/ws/wsManager.ts
      Note: Verified hydration and buffered replay behavior on frontend
    - Path: ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md
      Note: Primary analysis artifact updated in this step
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go
      Note: Verified snapshot ordering and per-entity version semantics
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/webchat/timeline_projector.go
      Note: Verified server projection path and handler dispatch
ExternalSources: []
Summary: Step-by-step diary for HC-55 root-cause investigation and documentation updates.
LastUpdated: 2026-02-22T00:00:00Z
WhatFor: Preserve implementation and investigation context for future contributors.
WhenToUse: Use when continuing HC-55 work or reviewing why specific investigation paths were chosen.
---


# Diary

## Goal

Capture exact investigation steps and conclusions while expanding HC-55 with backend/frontend timeline-path details, so a new intern can continue without re-discovering context.

## Step 1: Map Both Timeline Paths and Document Ordering Mismatch

This step focused on proving whether timeline reorder originates in frontend-only logic or in backend projection semantics. The main output was a substantial rewrite of the HC-55 bug report with line-level evidence for both live stream and hydration paths.

The work also clarified the ring-buffer question: buffering exists and stores all SEM frames up to capacity, but hydration does not currently read from that buffer.

### Prompt Context

**User prompt (verbatim):** "Ok research also how the timeline is handled and the SEM events projected in the 2026-02-12--hypercard-react/go-inventory-chat application, which is what populates the timeline. I suspect that it's using a different projection. ... Analyze the go side of things. suggestions are fine, those were first injected by the frontend and disappear. Focus on the go / frontend discrepancies and update the document significantly, by adding all the detailed information on the two paths to a timeline and how hydration reloads it from where. Idfeally we want both sides to mostly line up."

**Assistant interpretation:** Investigate end-to-end Go and frontend timeline pipelines, identify discrepancies causing reorder on focus/hydrate, and significantly expand HC-55 with intern-ready technical detail.

**Inferred user intent:** Establish a complete root-cause quality handoff that enables a clean implementation fix instead of patch-level mitigations.

**Commit (code):** N/A (documentation-only step)

### What I did

- Traced route wiring in inventory app for websocket and timeline hydration endpoints.
- Traced backend fan-out callback that broadcasts SEM, buffers SEM, and projects timeline.
- Traced timeline projector persistence semantics and snapshot ordering from both SQLite and in-memory stores.
- Traced frontend websocket hydration flow, buffered replay, and reducer merge/version guards.
- Traced frontend direct SEM projection handlers and compared against backend `timeline.upsert` projection to identify dual-projection behavior.
- Verified hypercard suggestions are mapped to SEM events but not persisted by inventory timeline handlers.
- Rewrote `analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md` with a full discrepancy map and fix strategy.
- Updated `tasks.md` with concrete follow-up implementation tasks.
- Updated `changelog.md` to record this investigation update.

### Why

- Prior HC-55 document covered lifecycle hypotheses but not enough backend projection detail to explain the observed before/after ordering shift.
- The user specifically asked to compare Go and frontend paths and explain hydration source of truth.

### What worked

- The provided before/after YAML aligned with backend `ORDER BY version ASC` snapshot behavior.
- Frontend hydration mapping explained equalized version values after hydration.
- Coverage comparison showed an actionable suggestions persistence gap.

### What didn't work

- Initial attempt to read shared `pinocchio` files under `2026-02-12--hypercard-react/pinocchio/...` failed because the module is a sibling repo in this workspace.
- Exact error: `No such file or directory` from `nl` commands targeting wrong path root.
- Resolved by locating correct paths via `rg --files` and reading from `pinocchio/...`.

### What I learned

- Reorder is not just frontend sorting; backend snapshot ordering by last-write version is a major contributor.
- Current architecture intentionally supports both raw SEM and projected `timeline.upsert` on frontend, which increases reconciliation complexity.
- Ring buffer presence does not imply hydration usage.

### What was tricky to build

- The hardest part was separating three different "orders" that look similar in UI output:
  - websocket arrival order,
  - backend projection version order,
  - frontend first-seen insertion order.
- These orders can align temporarily and then diverge during reconnect/hydrate, making symptoms appear intermittent.
- I resolved this by anchoring every conclusion to specific code locations and explicitly labeling which path each behavior belongs to.

### What warrants a second pair of eyes

- Whether to keep dual projection on frontend or collapse to backend canonical projection for persisted entities.
- Proto contract decision for per-entity version in snapshots (cross-language impact).
- Suggestions persistence policy choice (ephemeral vs persisted) because it changes debug/export expectations.

### What should be done in the future

- Implement instrumentation-driven proof for focus-triggered reconnect trigger.
- Decide canonical ordering contract and enforce it end-to-end.
- Add regression tests for focus/reconnect/hydrate ordering stability.

### Code review instructions

- Start with the updated report:
  - `ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md`
- Validate source evidence in:
  - `go-inventory-chat/cmd/hypercard-inventory-server/main.go`
  - `go-inventory-chat/internal/pinoweb/hypercard_events.go`
  - `../pinocchio/pkg/webchat/conversation.go`
  - `../pinocchio/pkg/webchat/timeline_projector.go`
  - `../pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go`
  - `packages/engine/src/chat/ws/wsManager.ts`
  - `packages/engine/src/chat/sem/semRegistry.ts`
- Validation command examples:
  - `rg -n "timeline.upsert|GetSnapshot|ORDER BY version" pinocchio/pkg/webchat pinocchio/pkg/persistence/chatstore`
  - `rg -n "mergeSnapshot|hydrate|buffered.sort" 2026-02-12--hypercard-react/packages/engine/src/chat`

### Technical details

- Backend snapshot ordering query:
  - `timeline_store_sqlite.go` full snapshot: `ORDER BY version ASC, entity_id ASC`.
- Frontend hydrated mapping behavior:
  - `timelineEntityFromProto(entity, snapshot.version)` applies same version to each entity in one snapshot.
- Suggestions discrepancy:
  - frontend starter suggestions come from `ChatConversationWindow` local dispatch, while Go inventory timeline handlers do not register `hypercard.suggestions.*` projection.

## Step 2: Refresh reMarkable Handoff Bundle

After the documentation expansion was committed, this step refreshed the reMarkable handoff so onboarding material on-device matches the latest ticket analysis. This avoids intern confusion from stale PDFs.

The step was intentionally narrow: upload updated docs, record it in changelog, and preserve continuity in the diary.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Continue the HC-55 workflow from the prior completed state, including remaining operational handoff steps.

**Inferred user intent:** Keep momentum and complete any obvious missing deliverables after the analysis/doc commit.

**Commit (code):** N/A (documentation/ops-only step)

### What I did

- Checked `remarquee` command help and current auth status.
- Uploaded a bundled PDF containing updated analysis + diary:
  - `remarquee upload bundle ... --name HC-55-CHAT-HYDRATION-ROOTCAUSE-update --remote-dir /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE`
- Appended changelog entry documenting refreshed upload.
- Appended this diary step for traceability.

### Why

- The previous reMarkable upload predated the expanded Go/frontend discrepancy analysis.
- Intern handoff quality requires device copy and repo copy to stay aligned.

### What worked

- Upload succeeded on first try with result:
  - `OK: uploaded HC-55-CHAT-HYDRATION-ROOTCAUSE-update.pdf -> /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE`

### What didn't work

- N/A

### What I learned

- Keeping device handoff artifacts synchronized with ticket docs is low effort and prevents avoidable onboarding churn.

### What was tricky to build

- No implementation complexity; main risk was forgetting to update changelog/diary after successful upload.

### What warrants a second pair of eyes

- Verify the uploaded PDF opens correctly on device and includes both analysis and diary pages.

### What should be done in the future

- Continue uploading refreshed bundles whenever major ticket docs materially change.

### Code review instructions

- Confirm changelog includes refreshed upload entry:
  - `ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/changelog.md`
- Confirm diary includes Step 2 and command/result details:
  - `ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/reference/01-diary.md`

### Technical details

- Command used:
  - `remarquee upload bundle 2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md 2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/reference/01-diary.md --name HC-55-CHAT-HYDRATION-ROOTCAUSE-update --remote-dir /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE`
- Output:
  - `OK: uploaded HC-55-CHAT-HYDRATION-ROOTCAUSE-update.pdf -> /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE`
