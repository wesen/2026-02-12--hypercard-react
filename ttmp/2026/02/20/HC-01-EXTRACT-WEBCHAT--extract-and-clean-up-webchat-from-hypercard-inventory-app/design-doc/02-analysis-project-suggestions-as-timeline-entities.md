---
Title: 'Analysis: project suggestions as timeline entities'
Ticket: HC-01-EXTRACT-WEBCHAT
Status: active
Topics: []
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Legacy baseline behavior for suggestion special-casing
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Current consumer of suggestions prop to be switched to timeline projection
    - Path: packages/engine/src/chat/state/chatSessionSlice.ts
      Note: Current suggestions state/actions under discussion for de-specialization
    - Path: packages/engine/src/chat/state/selectors.ts
      Note: Selector layer where timeline-derived suggestions projection should live
    - Path: packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts
      Note: Current special-case suggestion SEM handler path this analysis proposes to replace
ExternalSources: []
Summary: Analysis of replacing special-case suggestion session state with timeline entity projection and renderer-driven suggestions in ChatConversationWindow.
LastUpdated: 2026-02-20T11:07:20.242007989-05:00
WhatFor: Resolve Step 4 second-pair-of-eyes concern by designing a non-special-case suggestions flow aligned with timeline entity projection.
WhenToUse: Use when implementing or reviewing suggestion handling refactors in SEM handlers, selectors, and ChatConversationWindow.
---


# Analysis: project suggestions as timeline entities

## Executive Summary

Current suggestion handling is still a special case: `hypercard.suggestions.*` events directly mutate `chatSession.suggestions` in `registerHypercardTimelineModule.ts`. This bypasses the timeline entity model introduced in Phase 1-4 and creates a second projection path.

Recommendation: model suggestions as first-class timeline entities (`kind: 'suggestions'`) and project UI suggestions from timeline state, not from a dedicated session reducer path. This makes SEM projection uniform:

1. SEM event -> timeline entity upsert
2. renderer/selector projection -> UI
3. no ad-hoc direct state branch mutation for suggestions

This preserves the user-facing suggestion chips while removing the architectural special case.

Secondary viable option: if we intentionally keep suggestions outside timeline, use a single projector action with reducer options encoded in action `meta` (`mode`, `seq`, `source`) rather than multiple ad-hoc reducers. This still improves determinism and replay semantics.

## Problem Statement

### Current behavior

`packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts` currently handles:

1. `hypercard.suggestions.start` -> `chatSessionSlice.actions.mergeSuggestions`
2. `hypercard.suggestions.update` -> `chatSessionSlice.actions.mergeSuggestions`
3. `hypercard.suggestions.v1` -> `chatSessionSlice.actions.replaceSuggestions`

This is a legacy carry-over from `InventoryChatWindow.tsx`, where suggestions were also treated specially.

### Why this is a problem

1. Breaks entity-first architecture from Phase 3/4.
2. Adds another write path outside timeline projection rules.
3. Makes replay/version ordering semantics less explicit.
4. Couples suggestion UX to `chatSessionSlice` implementation details.
5. Creates inconsistency: most chat artifacts are entities, suggestions are not.

### Step 4 concern alignment

In diary Step 4, one second-pair-of-eyes concern was whether `chatSessionSlice` should retain multiple suggestion actions long-term. This analysis resolves that concern by moving suggestion truth to timeline entities and minimizing session-slice responsibility.

## Proposed Solution

### Option 1 (preferred): Timeline entity projection

#### 1) Introduce suggestion timeline entity kind

Define entity contract:

```ts
kind: "suggestions"
id: `suggestions:${convId}` // stable per conversation
props: {
  suggestions: string[]
  mode: "merge" | "replace" // semantic from SEM event
  sourceType: "hypercard.suggestions.start" | "hypercard.suggestions.update" | "hypercard.suggestions.v1"
}
version?: number // from event.seq when available
```

#### 2) Project SEM suggestion events into timeline

In `registerHypercardTimelineModule`, replace direct `chatSessionSlice` dispatches with:

1. normalize suggestion list
2. upsert `timelineSlice` entity in conversation scope
3. use `event.seq` as entity version if finite to preserve monotonic update semantics

#### 3) Derive active suggestion list from timeline entities

Add selector(s) that compute current suggestions for a conversation from timeline state, e.g.:

1. find latest `kind === 'suggestions'` entity (or stable id `suggestions:${convId}`)
2. return normalized `props.suggestions`
3. fallback to `DEFAULT_CHAT_SUGGESTIONS` when absent

`ChatConversationWindow` should use this timeline-derived selector instead of `selectSuggestions` from `chatSessionSlice`.

#### 4) Render suggestion updates as timeline content (optional but recommended)

Add `SuggestionsRenderer` and register it in timeline registry:

1. shows contextual "Suggestions updated" row
2. optionally shows chips inline for audit/debug

This keeps suggestions visible in history and debuggable from timeline/event traces.

#### 5) Reduce chatSession special casing

After migration:

1. stop writing suggestions via `chatSessionSlice.mergeSuggestions/replaceSuggestions`
2. keep `chatSession.suggestions` only as temporary fallback or remove it in follow-up cleanup

End-state target: suggestions are timeline-projected data, not session-side mutable list.

### Option 2 (fallback): Keep suggestions outside timeline, but formalize projector semantics

If we choose to keep suggestions in `chatSessionSlice`, the key is to avoid multiple bespoke reducer paths and make projection options explicit.

#### 1) Use one suggestion action with metadata options

Redux `dispatch` does not support `dispatch(action, options)`.  
Use action `meta` (or thunk args) to carry projector options:

```ts
type SuggestionMeta = {
  mode: 'merge' | 'replace';
  source: string; // SEM event type
  seq?: number;   // ordering/version hint
};
```

```ts
applySemSuggestions: {
  reducer(
    state,
    action: PayloadAction<{ convId: string; suggestions: string[] }, string, SuggestionMeta>
  ) {
    const session = getSession(state, action.payload.convId);

    // Stale drop guard for replay/reorder safety
    if (
      typeof action.meta.seq === 'number' &&
      typeof session.suggestionsSeq === 'number' &&
      action.meta.seq < session.suggestionsSeq
    ) {
      return;
    }

    if (action.meta.mode === 'replace') {
      session.suggestions = normalizeSuggestionList(action.payload.suggestions);
    } else {
      session.suggestions = normalizeSuggestionList([
        ...session.suggestions,
        ...action.payload.suggestions,
      ]);
    }

    if (typeof action.meta.seq === 'number') {
      session.suggestionsSeq = action.meta.seq;
    }
  },
  prepare(payload: { convId: string; suggestions: string[] }, meta: SuggestionMeta) {
    return { payload, meta };
  },
}
```

#### 2) Projector hook / SEM handler usage

```ts
registerSem('hypercard.suggestions.update', (ev, ctx) => {
  const suggestions = stringArray((ev.data as any)?.suggestions);
  if (suggestions.length === 0) return;

  ctx.dispatch(
    chatSessionSlice.actions.applySemSuggestions(
      { convId: ctx.convId, suggestions },
      { mode: 'merge', source: ev.type, seq: ev.seq }
    )
  );
});

registerSem('hypercard.suggestions.v1', (ev, ctx) => {
  const suggestions = stringArray((ev.data as any)?.suggestions);
  if (suggestions.length === 0) return;

  ctx.dispatch(
    chatSessionSlice.actions.applySemSuggestions(
      { convId: ctx.convId, suggestions },
      { mode: 'replace', source: ev.type, seq: ev.seq }
    )
  );
});
```

#### 3) Why this fallback is materially better than current state

1. single reducer entrypoint for SEM suggestions
2. explicit mode semantics (`merge` vs `replace`) in one place
3. optional stale-drop ordering guard using `seq`
4. simpler tests than multiple action/reducer combinations
5. still compatible with existing `ChatWindow` suggestion prop

## Design Decisions

### Decision 1: Stable per-conversation suggestion entity id

Use `id = suggestions:${convId}` rather than event-id fanout.

Rationale:

1. keeps one canonical "current suggestions" entity
2. simplifies selector logic
3. avoids timeline clutter when suggestions update frequently

### Decision 2: Use timeline versioning when sequence exists

If SEM envelope carries `event.seq`, map it to `entity.version`.

Rationale:

1. aligns with existing reducer version-gating semantics
2. drops stale reordered frames safely
3. keeps behavior deterministic across replay/hydration boundaries

### Decision 3: Keep ChatWindow API unchanged

No immediate `ChatWindow` API change needed.

Rationale:

1. `ChatWindow` already accepts `suggestions` prop
2. source of suggestions changes (timeline selector), not shell contract
3. minimizes migration blast radius

### Decision 4: Preserve normalization behavior

Reuse suggestion normalization constraints:

1. trim/empty filtering
2. case-insensitive dedupe
3. max length cap

Rationale:

Prevents UX regressions while moving storage/projection model.

### Decision 5: If session-backed suggestions remain, encode projector options in action meta

Rationale:

1. keeps semantics explicit and testable
2. avoids hidden coupling between handler type and reducer choice
3. allows ordering safety (`seq`) without timeline entity migration

## Alternatives Considered

### Alternative A: Keep current special-case session actions

Rejected because:

1. perpetuates dual projection model
2. makes suggestions semantics different from other timeline data
3. keeps second-pair-of-eyes concern unresolved

### Alternative B: Add a dedicated `suggestionsSlice`

Rejected because:

1. still special-case state shape
2. duplicates timeline-style sequencing and projection responsibilities
3. increases reducer surface area without architectural simplification

### Alternative C: Encode suggestions in message entities

Rejected because:

1. blurs semantic boundary (suggestions are not chat message text)
2. forces MessageRenderer awareness of suggestion payload conventions
3. reduces type clarity and renderer modularity

### Alternative D: Keep suggestions session-backed but formalize SEM projection contract

Status: viable fallback if timeline migration is postponed.

Tradeoff profile:

1. better than current special-case actions (deterministic, explicit, testable)
2. still not fully entity-first architecture
3. lower migration cost than Option 1
4. can serve as intermediate step before full timeline entity adoption

## Implementation Plan

### Phase A: Introduce entity model and projection

1. Add support for `suggestions` entity kind in timeline mapper/typing as needed:
   - `packages/engine/src/chat/sem/timelineMapper.ts`
   - `packages/engine/src/chat/renderers/types.ts` (if stricter typing introduced)
2. Update suggestion SEM handlers:
   - `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts`
   - Replace `chatSessionSlice` suggestion actions with timeline `upsertEntity`
3. Add selector for current suggestions from timeline:
   - `packages/engine/src/chat/state/selectors.ts`

### Phase B: UI integration

1. Switch `ChatConversationWindow` to timeline-derived suggestions selector:
   - `packages/engine/src/chat/components/ChatConversationWindow.tsx`
2. (Optional) Add and register `SuggestionsRenderer`:
   - `packages/engine/src/chat/renderers/builtin/SuggestionsRenderer.tsx`
   - `packages/engine/src/chat/renderers/rendererRegistry.ts`

### Phase C: cleanup

1. Remove or deprecate suggestion mutators in session slice:
   - `setSuggestions`, `replaceSuggestions`, `mergeSuggestions`
   - `packages/engine/src/chat/state/chatSessionSlice.ts`
2. Update tests and docs to confirm timeline-only projection.

### Alternative implementation track (if choosing Option 2)

1. Add `applySemSuggestions` reducer + `suggestionsSeq` field to `chatSessionSlice`
2. Replace existing `mergeSuggestions`/`replaceSuggestions` SEM dispatches with `applySemSuggestions(..., meta)`
3. Remove direct usage of `mergeSuggestions`/`replaceSuggestions` from SEM codepaths
4. Add tests for `seq` stale-drop behavior and mode-specific updates
5. Keep future migration path open to Option 1 by preserving normalized payload contract

### Testing/verification checklist

1. Suggestion SEM events create/update timeline entity with expected mode/source.
2. `event.seq`-backed version gating drops stale updates.
3. Suggestion chips in `ChatWindow` still behave identically (click-to-send).
4. Hydration/replay preserves final suggestion state.
5. No remaining direct suggestion writes to `chatSessionSlice` from SEM handlers.
6. (Option 2 path) projector metadata mode/seq produce deterministic updates under replay.

## Open Questions

1. Should suggestion entities appear visibly in timeline by default, or be hidden/internal with selector-only projection?
2. Should `merge` vs `replace` semantics stay explicit in props or be normalized away at handler time?
3. Do we keep `DEFAULT_CHAT_SUGGESTIONS` fallback in `chatSessionSlice`, move it to selector-layer fallback, or both during migration?
4. Should we eventually treat quick actions/buttons similarly as timeline entities for full symmetry?
5. Which path should we choose first: Option 1 (full entity projection) or Option 2 (session-backed but projector-contract-based)?

## References

1. Step 4 diary (Phase 1 + second-pair-of-eyes note): `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/01-diary.md`
2. Current suggestion special-case handlers: `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts`
3. Current session suggestion storage: `packages/engine/src/chat/state/chatSessionSlice.ts`
4. Current ChatConversationWindow suggestion plumbing: `packages/engine/src/chat/components/ChatConversationWindow.tsx`
5. Legacy inventory special-case behavior: `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
6. Version-gating semantics reference: `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/02-conversation-scoped-timeline-reducer-semantics-and-version-gating.md`
