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
- [ ] P2.1a Add `hypercard.card.v2` parser branch extracting card.id, card.code, name
- [ ] P2.1b Remove `hypercard.card_proposal.v1` parser branch
- [ ] P2.1c Remove `templateToCardId()` and template-based routing
- [ ] P2.1d Add `buildRuntimeCardOpenWindowPayload()` using card.id directly

### P2.2 Replace timeline projection (timelineProjection.ts)
- [ ] P2.2a Update `customKind` match from `hypercard.card_proposal.v1` → `hypercard.card.v2`
- [ ] P2.2b Update lifecycle formatters for card start/update to show Name

### P2.3 Update artifact state (artifactsSlice.ts)
- [ ] P2.3a Add `runtimeCardId`, `runtimeCardCode`, `injectionStatus` fields

### P2.4 Frontend tests
- [ ] P2.4a Remove `templateToCardId` tests from artifactRuntime.test.ts
- [ ] P2.4b Add v2 card payload parsing tests
- [ ] P2.4c Update timeline projection tests for v2 customKind

## Phase 3: Injection plumbing

- [ ] P3.1 Create `runtimeSessionRegistry.ts` with register/unregister/injectDefineCard
- [ ] P3.2 Register runtime sessions from `PluginCardSessionHost.tsx`
- [ ] P3.3 Wire inject-before-open in `InventoryChatWindow.tsx` openArtifact flow
- [ ] P3.4 Update injection status in artifact state after inject
- [ ] P3.5 Add storybook stories for runtime card injection flow

## Phase 4: Cleanup
- [ ] P4.1 Delete dead code paths and unused types
- [ ] P4.2 Run full test suite and verify storybook
