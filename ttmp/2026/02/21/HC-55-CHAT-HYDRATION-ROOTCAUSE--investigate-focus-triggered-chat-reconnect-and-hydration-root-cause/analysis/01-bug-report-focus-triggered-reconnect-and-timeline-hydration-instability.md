---
Title: 'Bug report: focus-triggered reconnect and timeline hydration instability'
Ticket: HC-55-CHAT-HYDRATION-ROOTCAUSE
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - ux
    - architecture
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/App.tsx
      Note: App window routing and chat appKey->convId composition path
    - Path: apps/inventory/src/main.tsx
      Note: StrictMode context for dev remount interpretation
    - Path: packages/engine/src/chat/runtime/conversationManager.ts
      Note: Session refcount behavior and websocket teardown boundary
    - Path: packages/engine/src/chat/runtime/useConversation.ts
      Note: Effect lifecycle responsible for connect/disconnect
    - Path: packages/engine/src/chat/state/timelineSlice.ts
      Note: Snapshot merge/replace semantics and timeline order behavior
    - Path: packages/engine/src/chat/ws/wsManager.ts
      Note: Hydration semantics and reconnect entry points
    - Path: packages/engine/src/components/shell/windowing/WindowSurface.tsx
      Note: Focus dispatch path showing no direct chat disconnect call
ExternalSources: []
Summary: Deep bug report and handoff for focus-triggered chat reconnect/hydration instability, including known evidence, mitigation already shipped, unresolved root-cause hypotheses, and a concrete investigation/test plan.
LastUpdated: 2026-02-22T00:00:00Z
WhatFor: Root-cause and permanently fix unintended reconnect/hydrate behavior and timeline instability when focusing chat windows.
WhenToUse: Use when onboarding to this bug, validating reconnect lifecycle behavior, or replacing mitigation with a root-cause fix.
---


# Bug Report: Focus-Triggered Reconnect and Timeline Hydration Instability

## 1. Executive Summary

The user reported that simply focusing the chat window can cause the conversation timeline to reorder and drop entities. In one concrete reproduction, a `suggestions:starter` entity disappeared and hypercard widget/status events moved earlier in order, causing visible "bouncing" in the chat timeline.

A mitigation has already been shipped (commit `1f63ce0679738d05e7c88074e4c1dd07caceb8c5`) that changed hydration from destructive replacement to merge semantics. This prevents visible reorder/loss in known cases, but it does not explain why focus appears to trigger reconnect/hydration in the first place. This ticket exists to root-cause that trigger and establish the correct long-term lifecycle/hydration contract.

## 2. User-Facing Symptom

Observed by user on **2026-02-22**:

- Before focus: timeline order included starter suggestions and stable chat progression.
- After focus: timeline order changed; `suggestions:starter` was gone.
- User-visible result: hypercard region appeared to jump upward in chat history.

Important detail from user export: after focus, several entities had aligned snapshot-like version values, consistent with a hydrate path applying a shared snapshot version.

## 3. Why This Matters

- Breaks trust in debug tools: exported timelines are no longer stable across simple UI focus changes.
- Breaks UX continuity: message/widget/status grouping appears to shuffle.
- Creates architectural ambiguity: reconnect/hydrate policy is not explicit (initial load vs reconnect semantics).
- Risks hidden correctness problems: merge mitigation may retain stale entities if backend intended omission to mean deletion.

## 4. What We Confirmed So Far

### 4.1 Connect/Disconnect Triggers in Code

- Chat networking is started/stopped by `useConversation` effect lifecycle:
  - connect on mount: `packages/engine/src/chat/runtime/useConversation.ts`
  - disconnect on cleanup/unmount: `packages/engine/src/chat/runtime/useConversation.ts`
- Conversation manager closes websocket when refcount reaches zero:
  - `packages/engine/src/chat/runtime/conversationManager.ts`
- Window focus handler itself does not call chat disconnect:
  - focus dispatch happens in `packages/engine/src/components/shell/windowing/WindowSurface.tsx`

Interpretation: if focus causes reconnect, chat subtree is likely being remounted (or connect flow otherwise re-entered), not directly disconnected by focus handler.

### 4.2 StrictMode Context

- App runs under React StrictMode in dev:
  - `apps/inventory/src/main.tsx`

StrictMode causes extra mount/unmount cycle checks in development, which can produce connect/disconnect/connect patterns during mount phases. This can confuse logs but is not, by itself, proof of focus-driven remount.

### 4.3 Hydration Behavior (Before Mitigation)

Previously, `WsManager.hydrate` did:

1. `clearConversation(convId)`
2. fetch `/api/timeline`
3. `applySnapshot(convId, entities)` (replace full `byId` + `order`)

Location before/after edits:
- `packages/engine/src/chat/ws/wsManager.ts`
- `packages/engine/src/chat/state/timelineSlice.ts`

This explains why local-only entities (ex: starter suggestions) were dropped and ordering reset.

## 5. Mitigation Already Shipped (HC-54)

### 5.1 Code Change

Commit: `1f63ce0679738d05e7c88074e4c1dd07caceb8c5` (`fix(chat): preserve timeline order across hydrate reconnect`)

Changes:

- Added shared version-aware upsert helper in timeline reducer.
- Added `mergeSnapshot` reducer (additive update; preserves existing order for existing entities).
- Switched websocket hydrate snapshot application from `applySnapshot` to `mergeSnapshot`.
- Removed hydrate-time `clearConversation` call.
- Added reducer + wsManager regression tests.

Primary files:

- `packages/engine/src/chat/state/timelineSlice.ts`
- `packages/engine/src/chat/ws/wsManager.ts`
- `packages/engine/src/chat/state/timelineSlice.test.ts`
- `packages/engine/src/chat/ws/wsManager.test.ts`

### 5.2 Validation Completed

Command run:

```bash
pnpm vitest packages/engine/src/chat/state/timelineSlice.test.ts packages/engine/src/chat/ws/wsManager.test.ts
```

Result at implementation time:

- 2 test files passed
- 9 tests passed

## 6. Why This Is Likely a Mitigation, Not Root-Cause Fix

The mitigation solves timeline damage when hydrate runs, but the unresolved question is: **why is hydrate being re-entered on focus in the first place?**

If focus is causing unexpected remount or reconnect, we still have a lifecycle bug. The current merge behavior masks the impact, but the trigger may still exist and could surface elsewhere (flicker, duplicate fetches, transient connection status changes, race windows).

## 7. Known Unknowns

1. Is chat component truly remounting on focus in this repro, or just re-rendering?
2. If remounting, what is changing identity of the rendered chat subtree?
3. Is this only dev (StrictMode) behavior, or reproducible in non-StrictMode build?
4. Are reconnect/hydrate events tied to window z-index/focus updates, or to app-window renderer cache invalidation?
5. Does backend snapshot order intentionally differ from client live order, and if so, what is canonical ordering contract?
6. Should omission from snapshot imply deletion, or should client preserve unknown/local entities?

## 8. Technical Context Map (For New Intern)

### 8.1 Rendering/Lifecycle Path

- Root app + StrictMode: `apps/inventory/src/main.tsx`
- App window route to chat component (`inventory-chat:<convId>`): `apps/inventory/src/App.tsx`
- Chat widget component: `packages/engine/src/chat/components/ChatConversationWindow.tsx`
- Connect/disconnect lifecycle hook: `packages/engine/src/chat/runtime/useConversation.ts`
- Session/refcount manager: `packages/engine/src/chat/runtime/conversationManager.ts`
- Websocket + hydrate path: `packages/engine/src/chat/ws/wsManager.ts`
- Timeline reducers/snapshot semantics: `packages/engine/src/chat/state/timelineSlice.ts`
- Window focus pointer handler: `packages/engine/src/components/shell/windowing/WindowSurface.tsx`

### 8.2 Why Focus Should Be Low-Risk (By Design)

Focus is expected to adjust z-order/focus state only, not remount window content. If remount is occurring, it likely comes from identity/key/cache boundary behavior above the chat component, not from the focus action itself.

## 9. Investigation Plan (Root-Cause)

### Phase A: Instrumentation and Evidence Capture

Add temporary debug logs/counters (or test-only hooks) at:

- `InventoryChatAssistantWindow` mount/unmount (`apps/inventory/src/App.tsx`)
- `useConversation` effect enter/cleanup (`packages/engine/src/chat/runtime/useConversation.ts`)
- `ConversationManager.connect` / `.disconnect` counts (`packages/engine/src/chat/runtime/conversationManager.ts`)
- `WsManager.connect` / `ensureHydrated` / `hydrate` entry points (`packages/engine/src/chat/ws/wsManager.ts`)

Goal: produce single timeline with timestamps proving whether focus causes remount or only re-render.

### Phase B: StrictMode Separation

Run same scenario in:

1. dev + StrictMode (current)
2. dev without StrictMode (temporary local check)
3. production build preview

Goal: determine whether reconnect-on-focus is StrictMode-only artifact or production-relevant bug.

### Phase C: Windowing/Identity Checks

Validate whether focus dispatch changes any identity inputs for chat app window rendering:

- window ids stable?
- appKey stable?
- any key props changed around chat subtree?
- any cache invalidation paths that rebuild body nodes on focus?

Files to inspect deeply:

- `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
- `packages/engine/src/components/shell/windowing/defaultWindowContentAdapters.tsx`
- `packages/engine/src/components/shell/windowing/WindowLayer.tsx`
- `packages/engine/src/components/shell/windowing/WindowSurface.tsx`

### Phase D: Hydration Contract Decision

Define and document authoritative policy:

- when hydrate is allowed (initial connect only? reconnect too?)
- whether reconnect should hydrate incrementally only
- semantics of missing entities in snapshot
- canonical ordering source (server projection vs client insertion order)

## 10. Test Plan to Add

1. Component lifecycle test: focusing window does not unmount/remount chat window content.
2. Conversation manager test: focus-only state transitions do not increase disconnect/connect counts.
3. WsManager test: reconnect (if it occurs) does not trigger destructive data semantics (already mitigated).
4. Optional e2e/dev harness: capture lifecycle events and assert no unexpected reconnect on focus.

## 11. Acceptance Criteria for Closing This Ticket

1. Root trigger for focus-associated reconnect identified and documented with evidence.
2. If trigger is real bug, fix merged with regression test.
3. If behavior is dev-only StrictMode artifact, explicitly documented with reproducible proof and guardrails for debugging.
4. Hydration semantics are documented as intended architecture (initial vs reconnect behavior).
5. Manual validation confirms stable timeline and no perceptible bounce under repeated focus changes.

## 12. Risks and Review Focus

- Overfitting to current repro: must test both dev and production-like paths.
- Masked bug due to mitigation: merge semantics may hide reconnect churn.
- State retention risk: if merge semantics remain default, confirm no stale zombie entities accumulate.

Code review should focus on lifecycle invariants first, then timeline data semantics.

## 13. Immediate Next Actions for Intern (Day 1 Checklist)

1. Reproduce with current branch and capture console traces for mount/connect/hydrate/disconnect.
2. Determine if reconnect occurs in production build.
3. If reconnect is real, isolate source of remount/identity churn.
4. Draft proposed final hydration policy and circulate before coding.
5. Only then implement final fix and add tests.

## 14. Related Prior Ticket

Mitigation ticket (already complete):

- `HC-54-CHAT-FOCUS-TIMELINE-ORDER`
- code commit: `1f63ce0679738d05e7c88074e4c1dd07caceb8c5`
- docs commit: `83a6df1e456a4ec22372250b83cc753854b76275`

This ticket (`HC-55`) supersedes that work for root-cause completeness.
