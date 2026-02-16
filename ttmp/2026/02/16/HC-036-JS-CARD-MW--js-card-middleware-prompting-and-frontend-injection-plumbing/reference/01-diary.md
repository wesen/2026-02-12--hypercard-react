---
Title: Diary
Ticket: HC-036-JS-CARD-MW
Status: active
Topics:
  - backend
  - frontend
  - dsl
  - chat
DocType: reference
Intent: long-term
Summary: >
  Step-by-step diary for HC-036 implementation. Documents what was read, decisions
  made, and implementation progress.
LastUpdated: 2026-02-16T18:30:00-05:00
---

# Diary

## Session 1 — Analysis and Planning (2026-02-16 ~18:00)

### What I read

1. **Design doc** (`design-doc/01-...md`) — full hard-cutover plan, DSL spec, backend/frontend instructions
2. **hypercard_middleware.go** — current prompt policy (`defaultArtifactPolicyInstructions`), generator middleware that checks for `<hypercard:cardproposal:v1>` tags
3. **hypercard_extractors.go** — full extractor pipeline: `inventoryWidgetExtractor`, `inventoryCardProposalExtractor`, `inventorySuggestionsExtractor`. YAML payload structs. Debounced YAML parsing with `parsehelpers.NewDebouncedYAML`. Session lifecycle (OnStart/OnRaw/OnCompleted).
4. **hypercard_events.go** — all event types, SEM frame mappings, timeline handler registrations. Card events: start/update/proposal_v1/error.
5. **hypercard_extractors_test.go** — 6 existing tests covering widget, card proposal, suggestions, and generator middleware.
6. **stack-bootstrap.vm.js** — full runtime host contract: `defineStackBundle`, `defineCard`, `normalizeCardDefinition`, `__ui` helpers, `__stackHost` methods (getMeta, render, event, defineCard).
7. **pluginBundle.authoring.d.ts** — TypeScript type contract for the DSL (PluginUiFactory, PluginCardDef, PluginHandlerContext, etc.)
8. **artifactRuntime.ts** — current frontend parser for `hypercard.card_proposal.v1` and `hypercard.widget.v1`

### Key findings

**Name field needed in payload:** The current card proposal payload has `title` at the top level. For runtime cards, we need the card's display `name` to be streamable BEFORE `card.code` arrives (since code can be large). The YAML field ordering means `name` should come early in the payload.

**Prompt quality matters:** The `card.code` field contains a JS expression. The LLM needs precise examples of:
- The `ui.*` API (all 8 methods with signatures and return types)
- The `render()` context shape (cardState, sessionState, globalState)
- The handler context shape (dispatch* methods)
- System commands available (nav.go, nav.back, notify, window.close)
- State action types (patch, set, reset)
- Safety constraints (no imports, no eval, no browser globals)
- Multiple realistic examples showing different UI patterns

**Extractor streaming:** The debounced YAML parser will parse `name` (and `title`) from early bytes before `card.code` is complete. This means the frontend sees `hypercard.card.start` with a title/name before the final `hypercard.card.v2` event carries the code.

### Decisions

- **Payload field `name`:** Add `name` as a top-level YAML field (distinct from `title`). `name` is the human-friendly display name shown in the timeline while streaming. `title` remains for the artifact/window title.
- **Implementation order:** Start with P1.1a (the LLM prompt) since it defines the contract everything else depends on.

### Created

- Granular task list (tasks.md) with ~30 tasks across 4 phases
- This diary

---

## Phase 1 Implementation (~18:00–18:20)

### P1.1: LLM Prompt (card_prompt.go)

Created `card_prompt.go` with `runtimeCardPromptInstructions()` — a 12KB prompt that serves as both the LLM system message and the canonical DSL reference. Structure:

1. **Payload shape** — YAML template with field rules (name, title, artifact.id, card.id, card.code)
2. **DSL Reference** — complete `card.code` contract:
   - Two accepted forms (factory with `ui` helper, raw object)
   - Full UI Helper API catalog (8 methods with signatures and return types)
   - Render context shape (cardState, sessionState, globalState with domain details)
   - Handler context shape (4 dispatch methods with examples)
   - Button → handler wiring pattern
3. **Three realistic examples:**
   - Read-only table card (low stock drilldown with filtering)
   - Interactive filter card with card state (category browser)
   - Summary stats card (computed metrics from global state)
4. **Safety rules** — explicit MUST/MUST NOT lists
5. **General rules** — YAML formatting, graceful defaults, code indentation

Key design choice: `name` field comes BEFORE `card.code` in the YAML so the streaming YAML parser emits `card.start` with a display name before the (potentially large) code block arrives.

Updated `defaultArtifactPolicyInstructions()` to compose widget prompt + runtime card prompt. Updated generator middleware to check for `<hypercard:card:v2>` tag.

### P1.2: Extractor (hypercard_extractors.go)

- New `inventoryRuntimeCardPayload` struct with `Name`, `Title`, `Artifact`, `Card.ID`, `Card.Code`
- New `inventoryRuntimeCardExtractor` (tag=hypercard, type=card, version=v2, 128KB max)
- New `inventoryRuntimeCardSession`:
  - `OnRaw`: emits card.start on first name/title parse, card.update on subsequent
  - `OnCompleted`: validates name, card.id, card.code presence → emits card.v2 or card.error
  - Uses `displayName = name || title` fallback for streaming events
- Removed old `inventoryCardProposalExtractor`, `inventoryCardSession` and all methods
- Wired new extractor in `NewInventoryEventSinkWrapper`

### P1.3: Events (hypercard_events.go)

- Replaced `eventTypeHypercardCardProposalV1` → `eventTypeHypercardCardV2`
- New `HypercardCardV2ReadyEvent` struct (replaces `HypercardCardProposalReadyEvent`)
- Added `Name` field to `HypercardCardStartEvent` and `HypercardCardUpdateEvent`
- Updated all event factories, SEM frame mappings, and timeline handler registrations
- SEM frames now carry `name` instead of `template`

### P1.4: Tests

- Deleted `TestCardExtractor_StartAndReady` (v1 proposal)
- Added 4 new tests:
  - `TestRuntimeCardExtractor_ValidPayload` — full payload with multiline code
  - `TestRuntimeCardExtractor_MissingCardCode` → error
  - `TestRuntimeCardExtractor_MissingCardId` → error
  - `TestRuntimeCardExtractor_StreamingName` — name available before code completes
- Updated `TestArtifactGeneratorMiddleware_NoMissingErrorsWhenTagsPresent` for new tag
- All 9 Go tests pass
