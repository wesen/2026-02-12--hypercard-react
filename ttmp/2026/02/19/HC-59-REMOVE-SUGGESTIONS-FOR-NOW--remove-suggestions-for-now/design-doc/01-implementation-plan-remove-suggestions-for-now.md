---
Title: Implementation Plan - Remove Suggestions For Now
Ticket: HC-59-REMOVE-SUGGESTIONS-FOR-NOW
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - inventory
    - cleanup
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: Suggestions state/actions currently live here and must be removed
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts
      Note: Suggestions selector removal and runtime-selector migration impact
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts
      Note: Hypercard suggestions event handling currently implemented here
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Suggestions prop wiring and send-path behavior currently present here
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx
      Note: Runtime wrapper currently forwards suggestions props
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx
      Note: Timeline wrapper currently forwards suggestions props
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Chat UI currently renders suggestion chips
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatView.tsx
      Note: Legacy/alternate chat view suggestions surface
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/StreamingChatView.tsx
      Note: Streaming chat suggestions surface
    - Path: 2026-02-12--hypercard-react/packages/engine/src/theme/desktop/chat.css
      Note: Styling for chat suggestions chips to remove
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/event-viewer/eventBus.ts
      Note: Suggestions event categorization behavior
ExternalSources: []
Summary: Temporary hard removal plan for suggestion UX/state/events across inventory and engine chat layers to reduce complexity during runtime refactor.
LastUpdated: 2026-02-19T17:48:28.176090456-05:00
WhatFor: Remove suggestion-specific surface area so HC-58 runtime cutover can proceed with fewer parallel concerns.
WhenToUse: Use when implementing or reviewing suggestion-removal changes across engine and inventory.
---

# Implementation Plan - Remove Suggestions For Now

## Executive Summary
HC-59 temporarily removes suggestions end-to-end from the chat stack so runtime refactor work can focus on conversation correctness and timeline-native rendering.

This is a hard removal with no fallback and no compatibility layer. Suggestion chips, suggestion state, suggestion events, and suggestion-related props are removed from the active runtime path and from inventory integration points. Suggestions can be reintroduced later as a clean runtime feature after HC-58 stabilizes.

## Problem Statement
Suggestions are currently spread across multiple layers:
- inventory state (`chatSlice`) and selectors,
- projection adapters (`hypercard.suggestions.*` event handling),
- runtime wrapper props (`TimelineChatRuntimeWindow`, `TimelineChatWindow`),
- UI components (`ChatWindow`, `ChatView`, `StreamingChatView`),
- styles/stories/docs.

This creates avoidable coupling while core runtime ownership is being reorganized. Keeping suggestions active during HC-58 increases migration risk and obscures whether regressions come from runtime refactor or suggestion behavior.

## Scope
In scope:
- Remove suggestion APIs and rendering from engine chat components and runtime wrappers.
- Remove suggestion state/actions/selectors from inventory `chatSlice`.
- Remove suggestion event handling from inventory projection adapters.
- Remove/update stories/docs/styles that model or advertise suggestion behavior.

Out of scope:
- Designing the future replacement suggestion system.
- Introducing compatibility shims or toggles.
- Backend protocol redesign beyond ignoring/removing suggestion handling on client side.

## Proposed Solution
1. Remove suggestion data contract from component props.
2. Remove suggestion state and reducers from inventory.
3. Remove client-side handling of `hypercard.suggestions.*`.
4. Clean docs/stories/styles to match the new behavior.
5. Keep event ingest robust by treating suggestion envelopes as unhandled/no-op in the runtime path.

### File-Level Change Plan
| Area | File(s) | Planned Change |
| --- | --- | --- |
| Inventory state | `apps/inventory/src/features/chat/chatSlice.ts` | Delete `suggestions` from `ConversationState`; delete `DEFAULT_CHAT_SUGGESTIONS`, `MAX_SUGGESTIONS`, normalization helpers, `replaceSuggestions`, `mergeSuggestions`; remove reset behavior tied to suggestions |
| Inventory selectors | `apps/inventory/src/features/chat/selectors.ts` | Delete `selectSuggestions` and empty-suggestions constants |
| Inventory adapters | `apps/inventory/src/features/chat/runtime/projectionAdapters.ts` | Remove `hypercard.suggestions.start/update/v1` branches; remove imports of suggestion actions |
| Inventory window | `apps/inventory/src/features/chat/InventoryChatWindow.tsx` | Remove suggestions selector usage, remove `suggestions`/`showSuggestionsAlways` props, remove send-time suggestion clearing |
| Runtime wrapper | `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx` | Remove suggestions-related props and forwarding |
| Timeline wrapper | `packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx` | Remove suggestions-related prop definitions and forwarding |
| Chat UI | `packages/engine/src/components/widgets/ChatWindow.tsx` | Remove suggestion chip section and props |
| Alternate views | `packages/engine/src/components/widgets/ChatView.tsx`, `packages/engine/src/components/widgets/StreamingChatView.tsx` | Remove suggestions prop and rendering blocks |
| Shell surfaces | `packages/engine/src/components/shell/ChatSidebar.tsx` | Remove pass-through suggestions prop if unused after removals |
| Styling | `packages/engine/src/theme/desktop/chat.css`, `packages/engine/src/parts.ts` | Remove `chat-suggestions` styles and part token where unused |
| Event viewer | `packages/engine/src/hypercard-chat/event-viewer/eventBus.ts` | Remove special suggestions category mapping or fold into generic event type |
| Tests/Stories | `apps/inventory/src/features/chat/chatSlice.test.ts`, `packages/engine/src/components/**/*.stories.tsx`, inventory stories | Remove/update suggestion assertions and fixtures |
| Docs | `packages/engine/docs/chat-window-timeline-first-guide.md`, `docs/js-api-user-guide-reference.md` | Remove suggestion references from active API docs |

## Design Decisions
1. Hard removal now.
- Rationale: avoids carrying temporary interfaces through HC-58 migration.

2. No fallback behavior and no feature flag.
- Rationale: strict removal keeps the diff unambiguous and minimizes dual-path bugs.

3. Suggestion events become no-op client behavior.
- Rationale: backend may still emit them temporarily; client should remain stable without reintroducing UI/state paths.

4. Keep domain-specific inventory behavior that is not suggestion-related.
- Rationale: artifact/open-window flows remain required for chat productivity and are independent from suggestions.

## Alternatives Considered
1. Hide suggestions in UI only, keep internal state/events.
- Rejected because it preserves complexity and migration coupling in runtime/state layers.

2. Keep suggestions behind a feature flag.
- Rejected because feature flags would keep old code paths alive and increase review/testing burden.

3. Delay removal until after full runtime refactor.
- Rejected because current request is to simplify first and reintroduce later with cleaner architecture.

## Implementation Plan
### Phase 1: Runtime/UI API surface cleanup
1. Remove suggestions props from `TimelineChatRuntimeWindow`, `TimelineChatWindow`, and chat widget components.
2. Remove suggestion rendering blocks and related UX copy in chat widgets.
3. Compile and update callers to new prop signatures.

### Phase 2: Inventory state and adapter cleanup
1. Delete suggestion state/actions from `chatSlice.ts`.
2. Remove suggestion selectors and update all consumers.
3. Remove suggestion branches from projection adapters.
4. Remove send-path logic that clears suggestions before prompt submission.

### Phase 3: Story, doc, and style cleanup
1. Update/remove story args and fixtures that pass suggestion arrays.
2. Remove suggestion styles and parts tokens no longer referenced.
3. Update docs so suggestion APIs are not documented as current behavior.

### Phase 4: Validation
1. Run unit tests for inventory chat slice/adapters and engine chat components.
2. Run typecheck/build for engine + inventory packages.
3. Manual smoke test:
- open inventory chat window,
- send prompts,
- verify no suggestion chips in idle/streaming/final states,
- verify no regressions in artifact opening/editing and stream status footer.

### Acceptance Criteria
1. No suggestion props remain in active runtime chat path APIs.
2. No suggestion state remains in inventory chat slice.
3. `hypercard.suggestions.*` client handling removed from inventory adapter path.
4. All impacted stories/tests/docs compile and reflect new behavior.
5. HC-58 runtime refactor can proceed without suggestion-specific branching.

## Open Questions
1. Should event viewer keep a legacy `suggestions` category label for historical logs, or collapse to generic classification immediately?
2. Do we want a temporary metric/log counter for ignored `hypercard.suggestions.*` events during the removal period?

## References
- `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
- `apps/inventory/src/features/chat/chatSlice.ts`
- `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
- `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
- `packages/engine/src/components/widgets/ChatWindow.tsx`
