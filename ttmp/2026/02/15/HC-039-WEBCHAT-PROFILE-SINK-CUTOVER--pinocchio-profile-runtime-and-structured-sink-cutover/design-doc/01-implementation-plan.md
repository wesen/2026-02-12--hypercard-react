---
Title: Implementation Plan - Profile Runtime and Structured Sink Cutover
Ticket: HC-039-WEBCHAT-PROFILE-SINK-CUTOVER
Status: active
Topics:
    - chat
    - backend
    - frontend
    - architecture
    - go
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/app/server.go
      Note: Runtime composer, request resolver, server wiring, and sink wrapper integration.
    - Path: go-inventory-chat/internal/chat/planner.go
      Note: Deterministic planner code that will no longer be primary chat artifact producer.
    - Path: go-inventory-chat/internal/app/planner_middleware.go
      Note: Local text extraction path to deprecate/remove.
    - Path: apps/inventory/src/chat/protocol.ts
      Note: Typed timeline entity decoding.
    - Path: apps/inventory/src/chat/InventoryChatAssistantWindow.tsx
      Note: Remove tag parsing and consume typed entities only.
ExternalSources:
    - local:Source - webchat-hyper-integration.md.md
Summary: Detailed implementation plan to align inventory chat with Pinocchio profile runtime and Geppetto structured sink architecture from source design.
LastUpdated: 2026-02-16T03:44:00-05:00
WhatFor: Provide an executable, source-anchored plan to remove local planner/tag shortcuts and deliver proper structured artifact middleware/event flow.
WhenToUse: Read before coding HC-039; use as sequencing and validation contract.
---

# Implementation Plan

## 1. Gap Statement

Current inventory chat has these mismatches against the source architecture:

1. No profile registry/resolver endpoints (`/api/chat/profiles`, `/api/chat/profile`) in app backend.
2. No Geppetto `structuredsink.FilteringSink` attached via `webchat.WithEventSinkWrapper`.
3. No custom SEM event mapping for hypercard artifact proposals.
4. No timeline handler that projects hypercard artifacts as first-class timeline entities.
5. Frontend still performs fallback parsing of `<hypercard:widget:1>`, `<hypercard:card:1>`, and `<hypercard:actions:1>` from assistant text.
6. Deterministic `Planner` currently carries artifact generation responsibilities that should instead come from LLM+tool outputs processed by structured sink extraction.

## 2. Source-Driven Requirements

Derived directly from source document:

1. Use FilteringSink extractor sessions for `<hypercard:widget:1>`, `<hypercard:card:1>`, `<hypercard:patch:1>` (sections 3.3, 4.3, 4.5).
2. Keep user-visible narrative separate from machine-consumed artifact payloads (section 3.3).
3. Support profile-driven runtime policies via runtime key + overrides (sections 2 and 4.4).
4. Introduce typed events and SEM mappings for artifact proposals and errors (sections 4.5 and Appendix E).
5. Implement two-phase card generation option using lightweight intent first, full card code on explicit user action (Appendix E.3).
6. Enforce validation gate before card application (section 4.6, Appendix D.1-D.3).
7. Align prompts with Appendix B seed prompt constraints (section B.1).

## 3. Target Architecture

## 3.1 Backend Runtime Composition

1. Replace custom inventory request resolver with profile-aware resolver modeled after `pinocchio/cmd/web-chat/profile_policy.go`.
2. Add profile registry with at least:
   1. `default` profile (inventory assistant narrative + widget proposal behavior).
   2. `card-generator` profile (strict full-card generation behavior for second phase).
3. Support profile APIs:
   1. `GET /api/chat/profiles`
   2. `GET|POST /api/chat/profile`
4. Keep `POST /chat` + `GET /ws` + `GET /api/timeline` contract unchanged for frontend transport.

## 3.2 Event Sink and Extractors

1. Wrap runtime sink with `structuredsink.NewFilteringSink(...)` via `webchat.WithEventSinkWrapper`.
2. Implement extractors:
   1. `HypercardWidgetExtractor` for `<hypercard:widget:1>`.
   2. `HypercardCardExtractor` for `<hypercard:card:1>`.
   3. `HypercardPatchExtractor` for `<hypercard:patch:1>`.
3. Extractor payload format:
   1. YAML parsing with strict required field checks.
   2. Capture raw payload for diagnostics.
4. Malformed block policy:
   1. emit `hypercard.artifact.error` typed event,
   2. preserve user narrative text,
   3. never emit partial invalid proposal entities.

## 3.3 Typed Event + SEM + Timeline Projection

1. Define typed Geppetto events for widget/card/patch/error proposals in inventory chat backend package.
2. Register SEM translators for those events in Pinocchio sem registry path used by app server.
3. Register timeline handlers to persist projection entities with stable IDs:
   1. `kind=hypercard_widget`
   2. `kind=hypercard_card_proposal`
   3. `kind=hypercard_patch_proposal`
   4. `kind=hypercard_artifact_error`
4. Preserve idempotency and replay safety with deterministic IDs + monotonic `seq`.

## 3.4 Frontend Consumption

1. Update timeline protocol decoder for new hypercard entity kinds.
2. Remove tag parsing regex and metadata JSON fallback for proposal artifacts.
3. Render widgets and card proposal actions only from typed entities.
4. Keep tool result rendering path for non-hypercard tool content.

## 3.5 Card Validation and Application Gate

1. Use existing `injectPluginCard` path but enforce stronger preflight:
   1. syntax/shape checks,
   2. dry-run validation in isolated runtime session,
   3. capability policy checks,
   4. dedupe checks (`cardId` + signature).
2. Implement two-phase flow:
   1. Phase A: chat may emit widget + `create-card` intent (template + params),
   2. Phase B: on click, issue second prompt using `card-generator` profile to get full `<hypercard:card:1>`.

## 4. Prompt Strategy (Appendix B Aligned)

1. Seed prompt in default profile must include:
   1. machine-consumed tag semantics,
   2. no markdown fence rule,
   3. required widget/card fields,
   4. allowed UI primitives,
   5. allowed system commands,
   6. read-only guidance for report cards.
2. Card-generator profile prompt must enforce:
   1. single JavaScript expression factory,
   2. ES5-compatible syntax,
   3. self-contained code,
   4. stable `cardId` and `dedupeKey`.

Full prompt text lives in `reference/02-prompt-pack.md`.

## 5. Explicit Removals

During cutover, remove the following compatibility paths:

1. Local structured extraction path in `go-inventory-chat/internal/app/planner_middleware.go`.
2. Assistant text serialization as primary artifact transport in `serializePlannedResponse`.
3. Frontend regex parsing of `<hypercard:...>` tags.
4. Planner-based artifact generation as default runtime output mechanism.

Note: planner may remain for deterministic test fixtures behind explicit test-only paths, but not as production structured artifact source.

## 6. Validation Gates

1. Backend unit tests:
   1. extractor success/failure,
   2. event mapping,
   3. timeline projection,
   4. profile policy and override restrictions.
2. Frontend tests/typecheck:
   1. typed entity decoding,
   2. widget/card proposal rendering,
   3. two-phase create-card flow.
3. E2E smoke in tmux:
   1. run backend + Vite,
   2. submit report prompt,
   3. observe widget proposal from typed entities,
   4. click create-card,
   5. verify follow-up prompt + card injection + window open.

## 7. Risks and Mitigations

1. YAML parse fragility in streaming extraction.
Mitigation: extractor-level strict parser + robust malformed policy.
2. Timeline bloat from repeated proposal events.
Mitigation: deterministic IDs + upsert semantics.
3. Prompt regressions reduce structured output reliability.
Mitigation: profile-specific prompts + integration tests asserting tag yields.
4. Capability escape through generated handlers.
Mitigation: validation gate + existing plugin capability enforcement.

## 8. Deliverables

1. Backend profile runtime and sink wrapper cutover merged.
2. Hypercard artifact typed event/SEM/timeline pipeline merged.
3. Frontend tag parser removed, typed-entity-only rendering merged.
4. Prompt pack stored and linked in ticket.
5. Diary + task checklist + changelog updated with each commit.
