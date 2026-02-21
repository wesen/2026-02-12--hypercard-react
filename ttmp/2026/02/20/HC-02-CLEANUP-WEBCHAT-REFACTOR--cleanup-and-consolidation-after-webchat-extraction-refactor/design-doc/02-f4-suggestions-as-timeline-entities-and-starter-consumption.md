---
Title: F4 suggestions as timeline entities and starter consumption
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
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Starter suggestion seeding and consume-on-first-send behavior
    - Path: packages/engine/src/chat/state/selectors.ts
      Note: Timeline-derived suggestion selection and render filtering
    - Path: packages/engine/src/chat/state/suggestions.ts
      Note: Suggestion constants
    - Path: packages/engine/src/chat/state/timelineSlice.ts
      Note: Timeline suggestion entity reducers and version-aware upsert
    - Path: packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts
      Note: SEM projection of hypercard suggestions into timeline artifacts
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T17:59:26.001070096-05:00
WhatFor: Define F4 cutover from session-scoped suggestions to timeline entities, including starter suggestion behavior for empty chats.
WhenToUse: Use while implementing/reviewing F4 so suggestion behavior stays entity-first and predictable.
---


# F4 suggestions as timeline entities and starter consumption

## Executive Summary

F4 moves suggestions from `chatSessionSlice` into timeline entities so suggestion data follows the same projection model as other chat artifacts.  
This includes two suggestion sources:

1. `starter` suggestions shown only when conversation is empty.
2. `assistant` suggestions projected from `hypercard.suggestions.*` SEM events.

Starter suggestions are consumed on first user interaction (typed prompt or suggestion click), which hard-cuts the old session-special-case path.

## Problem Statement

Current behavior keeps suggestions in `chatSession.byConvId[convId].suggestions` while nearly everything else is timeline-driven.  
That creates a split state model:

1. SEM handlers for suggestions mutate session state directly.
2. Selectors/read paths are unlike all other artifacts.
3. Starter suggestion lifecycle is implicit and not represented in timeline state.

Result: suggestions are harder to reason about, and the architecture does not match the timeline-centric refactor target.

## Proposed Solution

Represent suggestions as timeline entities:

```ts
type SuggestionsEntityProps = {
  source: "starter" | "assistant";
  items: string[];
  consumedAt?: number;
}
```

Entity IDs:

1. `suggestions:starter`
2. `suggestions:assistant`

Behavior:

1. On chat window mount, ensure `suggestions:starter` exists (normalized defaults).
2. On first send attempt, mark `suggestions:starter` consumed (`consumedAt=Date.now()`).
3. On `hypercard.suggestions.start|update|v1`, upsert `suggestions:assistant`.
4. Selector returns active suggestions from timeline:
   - if assistant suggestions active: use them
   - else if starter active and no visible timeline entities: use starter
   - else none

UI rendering:

1. Suggestions remain chip UI in `ChatWindow`.
2. Suggestion entities are not rendered as timeline rows.
3. Timeline message count ignores suggestion entities.

Pseudocode (consume-on-first-send):

```ts
const sendWithSuggestionLifecycle = async (prompt: string) => {
  dispatch(consumeStarterSuggestions(convId));
  await send(prompt);
};
```

## Design Decisions

1. Use timeline entities, not session reducers.
Reason: keeps one projection model and consistent event semantics.

2. Keep suggestions UI separate from timeline row renderers.
Reason: preserves current UX while still storing state as timeline artifacts.

3. Consume starter suggestions on any first send path (typed or clicked chip).
Reason: deterministic behavior with no dependence on backend message timing.

4. Normalize/dedupe/cap suggestions at projection boundary.
Reason: stable UI output and parity with previous session normalization behavior.

## Alternatives Considered

1. Keep suggestions in session (`chatSessionSlice`) but formalize it.
Rejected: still splits state model and keeps special-cased read/write paths.

2. Render suggestions as a normal timeline message bubble.
Rejected: degrades current chip UX and pollutes message counts.

3. Ephemeral computed starter suggestions (no stored entity).
Rejected: starter lifecycle becomes implicit again and harder to debug.

## Implementation Plan

1. Add suggestion helpers/types in timeline state/selectors (normalize + IDs).
2. Update hypercard suggestion SEM handlers to upsert timeline entities.
3. Update selectors to derive suggestions from timeline entities.
4. Update `ChatConversationWindow` to:
   - filter suggestion entities from timeline render list
   - wrap `send` to consume starter suggestions before first send
5. Update tests for runtime registration and hypercard suggestion projection.
6. Mark F4 task complete and record diary/changelog.

## Open Questions

1. Should assistant suggestions also auto-consume after a click?
Current F4 scope keeps them available until replaced by new SEM payload.

2. Should starter suggestions be recreated after conversation reset?
Proposed behavior: yes, because reset is a new empty conversation state.

## References

1. `ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/design-doc/01-exhaustive-legacy-and-consolidation-assessment-after-hc-01.md`
2. `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts`
3. `packages/engine/src/chat/components/ChatConversationWindow.tsx`
4. `packages/engine/src/chat/state/selectors.ts`
