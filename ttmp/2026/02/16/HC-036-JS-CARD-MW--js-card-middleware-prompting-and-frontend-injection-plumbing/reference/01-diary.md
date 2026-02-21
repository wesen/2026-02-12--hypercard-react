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

### Phase 2: Frontend parser switch (~18:15–18:20)

#### InventoryChatWindow.tsx lifecycle formatters
- `hypercard.card.start` and `hypercard.card.update`: now extract `data.name` as display title (falls back to `title`)
- Replaced `hypercard.card_proposal.v1` handler with `hypercard.card.v2`: extracts `data.data.card.id` and `data.data.artifact.id`, uses `name` for display title

#### artifactRuntime.ts
- Added `hypercard.card.v2` branch in `extractArtifactUpsertFromSem`: parses `card.id` and `card.code` from payload, stores as `runtimeCardId`/`runtimeCardCode` on the ArtifactUpsert
- Also updated timeline.upsert projected path to accept `customKind === 'hypercard.card.v2'`
- Added `runtimeCardId`/`runtimeCardCode` to `ArtifactUpsert` interface

#### artifactsSlice.ts
- Added `runtimeCardId`, `runtimeCardCode`, `injectionStatus`, `injectionError` to `ArtifactRecord`
- `upsertArtifact` merges runtime card fields, sets `injectionStatus: 'pending'` when code is first received

#### timelineProjection.ts
- Updated `customKind` match to accept both `hypercard.card_proposal.v1` and `hypercard.card.v2` (backward compat during transition)

#### Tests
- Removed `templateToCardId` test (function still exists but will be removed in Phase 4)
- Added `hypercard.card.v2` direct extraction test with runtimeCardId/runtimeCardCode assertions
- Updated timeline projected test to use v2 customKind
- 141 tests pass, TypeScript clean

### Phase 3: Injection plumbing (~18:20–18:26)

#### runtimeCardRegistry.ts (new file in packages/engine/src/plugin-runtime/)

Simple global singleton registry — `Map<string, RuntimeCardDefinition>` with change listeners:

- `registerRuntimeCard(cardId, code)` — stores card definition, notifies listeners
- `unregisterRuntimeCard(cardId)` — removes, notifies
- `getPendingRuntimeCards()` — returns all definitions
- `hasRuntimeCard(cardId)` — check existence
- `onRegistryChange(fn)` → returns unsubscribe
- `injectPendingCards(service, sessionId)` — iterates registry, calls `service.defineCard()` for each, continues on error, returns list of successfully injected card IDs

Design: intentionally not in Redux — these are ephemeral runtime definitions that need to reach the QuickJS VM layer, which lives in refs. A simple pub/sub avoids coupling raw JS code strings to serializable state.

#### PluginCardSessionHost.tsx changes

Two injection points:
1. **After bundle load**: calls `injectPendingCards(runtimeService, sessionId)` right after `setRuntimeSessionStatus('ready')`
2. **Live subscription**: `useEffect` subscribes to `onRegistryChange()` when session is `'ready'`, injects on each change

This covers both scenarios:
- Cards registered before session loads (pre-populated)
- Cards arriving after session is running (streaming during conversation)

#### InventoryChatWindow.tsx changes

- Added `useStore()` for inline artifact record lookup
- In `onSemEnvelope`: after `upsertArtifact`, if the artifact has `runtimeCardId` + `runtimeCardCode`, calls `registerRuntimeCard()`
- In `openArtifact`: looks up `storeState.artifacts.byId[artifactId]` to get `runtimeCardId`, passes it to `buildArtifactOpenWindowPayload`

#### artifactRuntime.ts changes

- `buildArtifactOpenWindowPayload` accepts optional `runtimeCardId`
- When present, uses it directly as `cardId` (skips `templateToCardId`)
- Icon changes to 🃏 for runtime cards

#### Tests

6 new tests in `runtimeCardRegistry.test.ts`:
- register/retrieve, overwrite, unregister, listener notification + unsub, inject into mock service, error recovery (one fails, others still inject)

153 tests pass total

### Phase 5: Debug window + fix runtime card display (~18:30–18:38)

#### Root cause of "shows home screen instead of runtime card"

`PluginCardSessionHost` line:
```ts
const currentCardId = currentNav?.card && stack.cards[currentNav.card]
  ? currentNav.card : stack.homeCard;
```

The window opens with `cardId: 'lowStockInventory'` (the runtime card ID), and the windowing system stores this in the session nav. But `PluginCardSessionHost` validates the card ID against `stack.cards` — the static stack definition. Since `lowStockInventory` isn't in the predefined stack, it falls back to `stack.homeCard` = `'home'`.

**Fix**: Also check `hasRuntimeCard(currentNav.card)` from the registry:
```ts
const currentCardId = currentNav?.card &&
  (stack.cards[currentNav.card] || hasRuntimeCard(currentNav.card))
  ? currentNav.card : stack.homeCard;
```

#### RuntimeCardDebugWindow.tsx (new file)

4-section diagnostic window:
1. **Stack definition** — table of all predefined cards (id, icon, title, type), homeCard
2. **Runtime Card Registry** — live-updating list from `onRegistryChange()`, shows cardId, registration time, code preview with expand/collapse, line count
3. **Artifacts with Runtime Cards** — table filtered to artifacts with `runtimeCardId`, shows injection status badges (pending/injected/failed)
4. **Plugin Sessions** — all active runtime sessions with status and card states

Opened via 🔧 desktop icon or `debug.stacks` command. Deduped window.

#### Diagnostic logging added
- `onSemEnvelope`: logs `registerRuntimeCard` call with cardId + code length, warns if card.v2 artifact missing runtime fields
- `openArtifact`: logs artifact lookup with runtimeCardId, all artifact IDs, and final window cardId
