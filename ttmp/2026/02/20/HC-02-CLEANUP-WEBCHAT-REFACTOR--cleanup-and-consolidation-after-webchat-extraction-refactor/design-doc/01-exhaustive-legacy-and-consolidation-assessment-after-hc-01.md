---
Title: Exhaustive legacy and consolidation assessment after HC-01
Ticket: HC-02-CLEANUP-WEBCHAT-REFACTOR
Status: active
Topics:
    - cleanup
    - architecture
    - frontend
    - chat
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/App.tsx
      Note: Inventory shell routing and command surface reviewed for leftover event-viewer path
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Renderer registration lifecycle behavior reviewed
    - Path: packages/engine/src/chat/state/chatSessionSlice.ts
      Note: Compatibility leftovers and suggestion-path analysis
    - Path: packages/engine/src/hypercard/timeline/hypercardCard.tsx
      Note: Evidence for orphan artifact action custom event emission
    - Path: packages/engine/src/hypercard/timeline/hypercardWidget.tsx
      Note: Evidence for orphan artifact action custom event emission
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/01-diary.md
      Note: Primary source of HC-01 commit chronology and implementation context
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T16:24:03.931171022-05:00
WhatFor: Exhaustive assessment of legacy leftovers and consolidation opportunities after HC-01 extraction, with prioritized cleanup plan.
WhenToUse: Use when executing cleanup/refactor follow-ups and validating remaining technical debt from HC-01.
---


# Exhaustive legacy and consolidation assessment after HC-01

## Executive Summary

This investigation reviewed HC-01 end to end by enumerating all code commits and all touched paths, then auditing surviving files for leftover legacy behavior, dead paths, and consolidation gaps.

Coverage result:

1. HC-01 code commits reviewed: 10
2. Unique touched paths reviewed: 111
3. Current surviving touched files: 76
4. Removed legacy files confirmed deleted: 35

Main conclusion: the extraction was successful structurally, but a cleanup tranche is warranted. The most important issue is functional: hypercard renderer `Open/Edit` actions currently emit custom events with no listeners, so artifact action buttons are effectively orphaned.

Beyond that, several medium-high cleanup items remain:

1. dead event-viewer route path in inventory shell (no launch command)
2. async `send` contract mismatch (`Promise` producer to `void` consumer prop)
3. suggestions still special-cased in session state
4. renderer registration lifecycle still mounted from component side-effect
5. compatibility leftovers from structured error migration
6. dead or under-integrated utility/mocks and broad API surface exports

This ticket defines a concrete cleanup queue (see `tasks.md`) and provides evidence-backed findings below.

## Problem Statement

HC-01 intentionally prioritized a hard cutover and architecture extraction velocity. That achieved reuse and removed inventory-local chat duplication, but left a set of cleanup opportunities that now affect correctness clarity, public API hygiene, and maintainability.

The goal of this assessment is to answer: "After the refactor, what legacy or leftover paths should we clean up or consolidate next?"

Method used:

1. Enumerated HC-01 code commits from ticket diary/changelog:
   - `a813f39`, `a788974`, `27758b7`, `6e07ad1`, `fd931ff`, `e8fbc61`, `d0e758d`, `df8ef49`, `e9d8031`, `bdb614d`
2. Built exact touched-path inventory from those commits.
3. Split inventory into current vs removed files.
4. Audited current files for:
   - functional regressions
   - stale compatibility APIs
   - dead routes/files/utilities
   - lifecycle inconsistencies
   - consolidation opportunities.

Path inventories are stored in this ticket:

1. `various/01-hc01-touched-files-existing.txt`
2. `various/02-hc01-touched-files-removed.txt`

## Proposed Solution

Execute cleanup as a focused follow-up ticket with severity-first ordering:

1. fix broken/orphan user-visible flows first
2. remove stale compatibility pathways second
3. tighten module bootstrap/API boundaries third
4. clean dead files and test organization fourth
5. close remaining manual verification gate last.

### Findings (ordered by severity)

#### F1 (Critical): Hypercard artifact action buttons are orphaned

Evidence:

1. Renderers emit `window.dispatchEvent(new CustomEvent('hypercard:artifact', ...))`:
   - `packages/engine/src/hypercard/timeline/hypercardWidget.tsx:82`
   - `packages/engine/src/hypercard/timeline/hypercardCard.tsx:104`
2. No listener exists in current codebase for `hypercard:artifact` (`rg` found emitters only).
3. Legacy inventory behavior previously performed concrete `openWindow` / editor launch handling in old chat component (pre-delete evidence from `InventoryChatWindow.tsx`).

Impact:

1. `Open` / `Edit` controls displayed by renderer are likely non-functional in app runtime.

Recommendation:

1. replace event-bus-like window event with explicit app-dispatch action contract, or
2. add and document a required listener in integration shell.

#### F2 (High): Event viewer route path exists but has no launch entrypoint

Evidence:

1. `renderAppWindow` handles `event-viewer:*`:
   - `apps/inventory/src/App.tsx:52`
2. No menu/icon/command creates `event-viewer:*` windows in current contributions/commands.

Impact:

1. Dead route branch and invisible feature surface.

Recommendation:

1. re-add launch affordance (menu/command/header action), or
2. remove route branch and related imports if intentionally dropped.

#### F3 (High): Async send contract mismatch may hide unhandled rejections

Evidence:

1. `useConversation.send` is async and rethrows on failure:
   - `packages/engine/src/chat/runtime/useConversation.ts:60`
2. `ChatWindowProps.onSend` is typed as sync `void`:
   - `packages/engine/src/components/widgets/ChatWindow.tsx:9`
3. `ChatWindow.send` does not await/catch:
   - `packages/engine/src/components/widgets/ChatWindow.tsx:59`

Impact:

1. request failures can become unhandled promise rejections from UI interaction code paths.

Recommendation:

1. make `onSend` async-aware and handle promise lifecycle in component, or
2. adapt container wrapper to fire-and-catch before passing into shell.

#### F4 (High): Suggestions remain a special-case session mutation path

Evidence:

1. SEM suggestion events dispatch directly to `chatSessionSlice.mergeSuggestions/replaceSuggestions`:
   - `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts:8`
2. `ChatConversationWindow` reads suggestions from session selector:
   - `packages/engine/src/chat/components/ChatConversationWindow.tsx:59`

Impact:

1. inconsistent projection model versus entity-first timeline design.

Recommendation:

1. pick and implement one of the already documented options:
   - timeline entity projection (preferred)
   - formalized session projector action with seq/meta gating.

#### F5 (Medium-High): Renderer registration lifecycle is component-side effect

Evidence:

1. `ChatConversationWindow` calls `registerDefaultTimelineRenderers()` in `useMemo`:
   - `packages/engine/src/chat/components/ChatConversationWindow.tsx:75`
2. Registry is global mutable map:
   - `packages/engine/src/chat/renderers/rendererRegistry.ts:35`

Impact:

1. lifecycle semantics differ from formal SEM bootstrap.
2. late module registrations after first mount are not reflected unless resolved mapping is rebuilt.

Recommendation:

1. move default renderer registration into explicit bootstrap lifecycle, and
2. define update semantics for dynamically added renderers.

#### F6 (Medium-High): Chat runtime bootstrap is still hypercard-coupled by default

Evidence:

1. Default bootstrap includes both:
   - `chat.default-sem`
   - `chat.hypercard-timeline`
   from `packages/engine/src/chat/runtime/registerChatModules.ts:8`

Impact:

1. generic chat consumer always gets hypercard module registration unless it explicitly bypasses this layer.

Recommendation:

1. split default bootstrap profiles or expose chat-only bootstrap baseline.

#### F7 (Medium): Structured error migration still keeps compatibility-only fields/actions

Evidence:

1. `lastError` remains in state:
   - `packages/engine/src/chat/state/chatSessionSlice.ts:67`
2. compatibility reducer `setStreamError` remains:
   - `packages/engine/src/chat/state/chatSessionSlice.ts:255`
3. selector fallback still reads `lastError`:
   - `packages/engine/src/chat/state/selectors.ts:59`
4. no runtime callsites still use `setStreamError` (only tests).

Impact:

1. lingering dual-path semantics increase complexity and testing surface.

Recommendation:

1. remove compatibility branch once all consumers are on structured selectors/actions.

#### F8 (Medium): Dead or under-integrated utility surface remains

Evidence:

1. `buildArtifactOpenWindowPayload` is only referenced in tests:
   - `packages/engine/src/hypercard/artifacts/artifactRuntime.ts:117`
2. no runtime path currently invokes this utility for renderer artifact actions.

Impact:

1. useful utility exists but is not connected to user flow; increases ambiguity.

Recommendation:

1. either wire artifact renderer actions to this utility + dispatch flow, or remove utility if not desired.

#### F9 (Medium): Mock streaming files are dead in current graph

Evidence:

1. `fakeStreamService.ts` has no callsites:
   - `packages/engine/src/chat/mocks/fakeStreamService.ts:30`
2. `chatApi.ts` exists primarily to support that service.

Impact:

1. dead code paths and maintenance overhead.

Recommendation:

1. delete dead mocks, or
2. re-integrate through stories/dev tooling and export clearly.

#### F10 (Low-Medium): Unused singleton export in ws layer

Evidence:

1. singleton exported:
   - `packages/engine/src/chat/ws/wsManager.ts:337`
2. runtime uses per-session `new WsManager()` in `ConversationManager`.

Impact:

1. two competing usage models; unclear public contract.

Recommendation:

1. standardize around one model and remove the other export path.

#### F11 (Low-Medium): Registry cleanup APIs exist but are not used in production path

Evidence:

1. `unregister` / `clear` APIs in renderer/props registries are present.
2. production callsites only register/resolve.

Impact:

1. extra public API without clear lifecycle contract.

Recommendation:

1. either keep and document as supported extension hooks (with tests), or
2. prune from public surface.

#### F12 (Low-Medium): Remaining HC-01 manual runtime verification task still open

Evidence:

1. `7.5` is still unchecked:
   - `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/tasks.md:73`

Impact:

1. no final runtime evidence bundle confirming all interactive behaviors after hard cutover.

Recommendation:

1. execute and record checklist under this cleanup ticket.

## Design Decisions

1. Treat this as cleanup/consolidation, not architecture rewrite.
2. Prioritize user-visible regressions (artifact actions/event viewer) before API polishing.
3. Keep recommendation set implementation-oriented and measurable via ticket tasks.
4. Base assessment on concrete touched-file inventory to avoid hand-wavy “maybe legacy” claims.

## Alternatives Considered

1. "No cleanup ticket, just fold into future feature tickets."
   - Rejected: leaves regressions and dead paths unowned.

2. "Do only lint/static cleanup and ignore behavioral leftovers."
   - Rejected: misses runtime issues (artifact action flow).

3. "Full re-architecture immediately (engine factory/module injection redesign)."
   - Rejected for now: too broad for post-cutover stabilization; should be incremental.

## Implementation Plan

Execution order for HC-02:

1. Functional restoration
   - artifact open/edit action wiring
   - event viewer launch path decision and implementation
   - async send contract alignment

2. Projection/model cleanup
   - suggestions architecture finalization
   - renderer registration lifecycle cleanup
   - bootstrap decoupling for hypercard module

3. API/debt pruning
   - remove compatibility error leftovers
   - remove dead mocks/utilities or wire intentionally
   - wsManager API shape consolidation
   - registry API surface clarification

4. Validation closure
   - execute manual runtime checklist formerly `7.5`
   - append evidence in ticket changelog/diary.

## Open Questions

1. Should artifact action handling be generic engine-level behavior or app-owned integration callback?
2. Should hypercard module remain default in chat bootstrap for convenience, or become opt-in for boundary purity?
3. Should suggestions migration be done now (in HC-02) or split into dedicated follow-up ticket to reduce scope risk?
4. Do we want to preserve any compatibility aliases (`setStreamError`, `lastError`) for downstream consumers, and for how long?

## Appendix: Touched File Inventory Summary

Computed from HC-01 code commits:

1. Total unique touched files: 111
2. Existing files (current tree): 76
3. Removed files (legacy deleted): 35

Full lists are stored in:

1. `ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/various/01-hc01-touched-files-existing.txt`
2. `ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/various/02-hc01-touched-files-removed.txt`

## References

1. `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/01-diary.md`
2. `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/changelog.md`
3. `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/tasks.md`
4. `apps/inventory/src/App.tsx`
5. `packages/engine/src/chat/components/ChatConversationWindow.tsx`
6. `packages/engine/src/chat/runtime/registerChatModules.ts`
7. `packages/engine/src/chat/state/chatSessionSlice.ts`
8. `packages/engine/src/chat/state/selectors.ts`
9. `packages/engine/src/chat/runtime/useConversation.ts`
10. `packages/engine/src/components/widgets/ChatWindow.tsx`
11. `packages/engine/src/hypercard/timeline/hypercardWidget.tsx`
12. `packages/engine/src/hypercard/timeline/hypercardCard.tsx`
13. `packages/engine/src/hypercard/artifacts/artifactRuntime.ts`
