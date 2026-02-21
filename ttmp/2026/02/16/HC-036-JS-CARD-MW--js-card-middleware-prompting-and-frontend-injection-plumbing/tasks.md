---
Title: Tasks
Ticket: HC-036-JS-CARD-MW
---

# Tasks

## Phase 1: Backend contract switch

### P1.1 Replace prompt policy (hypercard_middleware.go)
- [x] P1.1a Write full LLM prompt spec for `<hypercard:card:v2>` with JS DSL reference, ui API catalog, examples
- [x] P1.1b Replace `defaultArtifactPolicyInstructions()` with new prompt
- [x] P1.1c Update generator middleware tag check from `<hypercard:cardproposal:v1>` → `<hypercard:card:v2>`

### P1.2 Replace extractor schema (hypercard_extractors.go)
- [x] P1.2a Define `inventoryRuntimeCardPayload` struct with `Name`, `Card.ID`, `Card.Code`
- [x] P1.2b Create `inventoryRuntimeCardExtractor` (tag `card`, version `v2`)
- [x] P1.2c Create `inventoryRuntimeCardSession` with streaming name/title events
- [x] P1.2d Wire new extractor into `NewInventoryEventSinkWrapper`, remove old card proposal extractor

### P1.3 Replace event types (hypercard_events.go)
- [x] P1.3a Add `eventTypeHypercardCardV2` constant and `HypercardCardV2ReadyEvent` struct (with Name field)
- [x] P1.3b Update card start/update events to carry Name (streamed from YAML before code arrives)
- [x] P1.3c Register event factories and SEM mappings for v2 events
- [x] P1.3d Replace timeline handler registration from card_proposal.v1 → card.v2
- [x] P1.3e Remove `eventTypeHypercardCardProposalV1` and `HypercardCardProposalReadyEvent`

### P1.4 Backend tests
- [x] P1.4a Delete `TestCardExtractor_StartAndReady` (v1 proposal test)
- [x] P1.4b Add `TestRuntimeCardExtractor_ValidPayload` — multiline card.code, name field
- [x] P1.4c Add `TestRuntimeCardExtractor_MissingCardCode` → error
- [x] P1.4d Add `TestRuntimeCardExtractor_MissingCardId` → error
- [x] P1.4e Add `TestRuntimeCardExtractor_StreamingName` — title available before code completes
- [x] P1.4f Update `TestArtifactGeneratorMiddleware_*` for new tag name

## Phase 2: Frontend parser switch

### P2.1 Replace artifact runtime (artifactRuntime.ts)
- [x] P2.1a Add `hypercard.card.v2` parser branch extracting card.id, card.code, name
- [x] P2.1b Remove `hypercard.card_proposal.v1` parser branch (hard cutover, no backward compat)
- [ ] P2.1c Remove `templateToCardId()` and template-based routing (deferred to Phase 4)
- [ ] P2.1d Add `buildRuntimeCardOpenWindowPayload()` using card.id directly (deferred to Phase 3)

### P2.2 Replace timeline projection (timelineProjection.ts)
- [x] P2.2a Update `customKind` match to accept both `hypercard.card_proposal.v1` and `hypercard.card.v2`
- [x] P2.2b Update lifecycle formatters for card start/update to show Name

### P2.3 Update artifact state (artifactsSlice.ts)
- [x] P2.3a Add `runtimeCardId`, `runtimeCardCode`, `injectionStatus`, `injectionError` fields

### P2.4 Frontend tests
- [x] P2.4a Remove `templateToCardId` tests from artifactRuntime.test.ts
- [x] P2.4b Add v2 card payload parsing tests (direct + timeline projected)
- [x] P2.4c Update timeline projection tests for v2 customKind

## Phase 3: Injection plumbing

- [x] P3.1 Create `runtimeCardRegistry.ts` with register/unregister/injectPendingCards/onRegistryChange
- [x] P3.2 Wire `PluginCardSessionHost.tsx` to inject pending cards after bundle load + subscribe to live changes
- [x] P3.3 Wire `InventoryChatWindow.tsx` to register runtime cards from card.v2 events + pass runtimeCardId to openArtifact
- [x] P3.4 Update `buildArtifactOpenWindowPayload` to use runtimeCardId directly when available
- [x] P3.5 Add 6 registry unit tests (register, overwrite, unregister, listener, inject, error recovery)
- [ ] P3.6 Add storybook stories for runtime card injection flow (deferred)

## Phase 4: Cleanup
- [x] P4.1 Delete dead code paths: inventoryCardProposalPayload struct, tombstone comments
- [x] P4.2 Run full test suite — 153 TS tests pass, 9 Go tests pass

## Phase 5: Runtime card debug window + fix injection

### P5.1 Debug window for stacks/cards
- [x] P5.1a Create `RuntimeCardDebugWindow.tsx` — shows all stacks, registered cards, injection status
- [x] P5.1b Add 🔧 icon to DesktopShell + App.tsx to open the debug window
- [x] P5.1c Show: stack definitions (cards list), runtime card registry entries, artifact records with injection status, plugin sessions
- [x] P5.1d Live-updating via registry subscription + Redux selectors

### P5.2 Debug runtime card injection flow
- [x] P5.2a Add console.log breadcrumbs to trace: extractArtifactUpsert → registerRuntimeCard → openArtifact lookup → buildPayload cardId → PluginCardSessionHost injection
- [ ] P5.2b Verify runtime card code is correctly extracted from SEM envelope (not truncated, no YAML parsing issues)
- [ ] P5.2c Verify runtimeCardId is stored on artifact record and read back in openArtifact
- [ ] P5.2d Verify PluginCardSessionHost.defineCard succeeds (check QuickJS eval errors)
- [x] P5.2e **ROOT CAUSE FOUND**: `PluginCardSessionHost` checked `stack.cards[currentNav.card]` for runtime cards → fallback to homeCard. Fixed: now also checks `hasRuntimeCard(currentNav.card)` from the registry.
- [x] P5.2f Fix applied — runtime card IDs accepted even when not in static stack definition
