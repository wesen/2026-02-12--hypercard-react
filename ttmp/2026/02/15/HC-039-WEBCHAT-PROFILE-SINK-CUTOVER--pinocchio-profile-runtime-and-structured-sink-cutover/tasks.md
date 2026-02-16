# Tasks

## Setup and Documentation Baseline

- [x] Create ticket workspace `HC-039-WEBCHAT-PROFILE-SINK-CUTOVER`.
- [x] Import HC-033 source document into local ticket sources.
- [x] Write source-anchored implementation design doc.
- [x] Create source-derived profile prompt pack.
- [x] Create validation runbook.
- [x] Start implementation diary.

## Phase 1: Profile Runtime Foundation

- [ ] Add profile registry data model in inventory backend.
- [ ] Define `default` and `card-generator` profiles.
- [ ] Implement profile-aware request resolver modeled on `pinocchio/cmd/web-chat/profile_policy.go`.
- [ ] Add `GET /api/chat/profiles` endpoint.
- [ ] Add `GET /api/chat/profile` endpoint.
- [ ] Add `POST /api/chat/profile` endpoint.
- [ ] Implement profile cookie/state handling semantics.
- [ ] Enforce profile override policy (`AllowOverrides` equivalent).
- [ ] Ensure profile-derived overrides set runtime middlewares and tools.
- [ ] Add tests for profile selection precedence (query, path, cookie, default).
- [ ] Add tests for override rejection when profile disallows engine overrides.

## Phase 2: Runtime Composer and Middleware Assembly

- [ ] Replace custom composer logic with profile-compatible runtime composition flow.
- [ ] Add middleware factory registry on app server.
- [ ] Register middleware factories needed by inventory app.
- [ ] Ensure system prompt middleware receives profile prompt.
- [ ] Ensure tool list comes from profile policy.
- [ ] Keep tool result reorder middleware in chain.
- [ ] Preserve runtime fingerprinting with profile + overrides.
- [ ] Add tests for runtime fingerprint stability.
- [ ] Add tests for runtime rebuild on fingerprint change.

## Phase 3: FilteringSink Structured Extraction

- [ ] Add `webchat.WithEventSinkWrapper` integration in server wiring.
- [ ] Wrap sink with `structuredsink.NewFilteringSink(...)`.
- [ ] Implement `HypercardWidgetExtractor` (`<hypercard:widget:1>`).
- [ ] Implement `HypercardCardExtractor` (`<hypercard:card:1>`).
- [ ] Implement `HypercardPatchExtractor` (`<hypercard:patch:1>`).
- [ ] Implement extractor YAML parser and schema checks.
- [ ] Enforce max capture bytes for artifact blocks.
- [ ] Implement malformed block policy and error emission.
- [ ] Ensure extracted payload text is removed from user-visible stream.
- [ ] Add unit tests for split tags across streaming deltas.
- [ ] Add unit tests for malformed/unclosed tags.
- [ ] Add unit tests for nested-block rejection behavior.

## Phase 4: Typed Events, SEM Mapping, and Timeline Projection

- [ ] Define typed events for widget/card/patch proposals.
- [ ] Define typed event for artifact extraction/validation errors.
- [ ] Register SEM translators for each new event type.
- [ ] Add deterministic event IDs for idempotent projection.
- [ ] Register timeline handlers for `hypercard.widget` SEM events.
- [ ] Register timeline handlers for `hypercard.card` SEM events.
- [ ] Register timeline handlers for `hypercard.patch` SEM events.
- [ ] Register timeline handlers for `hypercard.artifact.error` SEM events.
- [ ] Store proposed widgets as dedicated timeline entities.
- [ ] Store proposed cards as dedicated timeline entities.
- [ ] Store artifact errors as dedicated timeline entities.
- [ ] Add tests verifying replay/hydration preserves projected artifacts.
- [ ] Add tests for duplicate event delivery upsert behavior.

## Phase 5: Frontend Typed Entity Cutover

- [ ] Extend `protocol.ts` to decode new hypercard timeline entity kinds.
- [ ] Render widget proposals from typed entity snapshots.
- [ ] Render card proposals from typed entity snapshots.
- [ ] Render artifact error entities as system feedback.
- [ ] Remove regex-based `<hypercard:widget|card|actions>` parsing from assistant text.
- [ ] Remove metadata JSON artifact fallback parsing from message snapshots.
- [ ] Ensure timeline hydration reconstructs proposal state deterministically.
- [ ] Ensure websocket upsert handling updates proposal entities by ID.
- [ ] Add tests for typed entity to `ChatWindowMessage` projection.
- [ ] Add tests confirming no tag parser dependency remains.

## Phase 6: Two-Phase Card Generation Flow

- [ ] Implement `hypercard.card.intent` lightweight proposal event shape.
- [ ] Emit intent event from initial report/widget response path.
- [ ] On `Create Saved Card`, issue follow-up generation request via `card-generator` profile.
- [ ] Bind follow-up request to originating widget/proposal context.
- [ ] Accept only `<hypercard:card:1>` response for second phase.
- [ ] Reject multi-card payloads in second-phase response.
- [ ] Add UX state for create-card pending/progress/error.
- [ ] Add tests for happy path two-phase generation.
- [ ] Add tests for malformed second-phase payload rejection.

## Phase 7: Card Validation and Injection Hardening

- [ ] Keep existing injection gate and connect it to typed card proposal entities.
- [ ] Add strict `cardId`/`dedupeKey`/`version` validation.
- [ ] Add dry-run runtime validation before apply.
- [ ] Validate UI schema output in dry-run render.
- [ ] Validate allowed system commands and forbid disallowed tokens.
- [ ] Enforce duplicate checks by `cardId` and proposal signature.
- [ ] Add deterministic error reason mapping for UI feedback.
- [ ] Add tests for duplicate proposal rejection.
- [ ] Add tests for forbidden command/token rejection.

## Phase 8: Planner/Compatibility Path Removal

- [ ] Remove planner middleware text extraction path from production runtime.
- [ ] Remove planner-based artifact serialization as primary output transport.
- [ ] Remove unused planner-only artifact helper code.
- [ ] Keep deterministic planner only behind explicit test/dev-only path if retained.
- [ ] Remove dead frontend code tied to legacy text-embedded artifacts.
- [ ] Verify no legacy tag parsing code remains in frontend/backend.

## Phase 9: Prompt Wiring and Policy Verification

- [ ] Wire default profile seed prompt from `reference/02-prompt-pack.md`.
- [ ] Wire card-generator profile prompt from `reference/02-prompt-pack.md`.
- [ ] Add prompt conformance integration test for widget emission.
- [ ] Add prompt conformance integration test for card emission.
- [ ] Validate model outputs satisfy no-code-fence and required-field rules.

## Phase 10: Validation, E2E, and Documentation Closure

- [ ] Run `GOWORK=off go test ./...` for backend.
- [ ] Run `npm exec -w apps/inventory tsc -b`.
- [ ] Run `npm run -w apps/inventory build`.
- [ ] Execute tmux-based E2E runbook for report->widget->create-card flow.
- [ ] Validate timeline hydration after backend restart.
- [ ] Validate multi-client subscription idempotency.
- [ ] Update diary with failures and fixes.
- [ ] Update changelog with commit SHAs and validation outputs.
- [ ] Upload updated HC-039 docs to reMarkable.
- [ ] Close HC-039 only after all implementation tasks are complete.
