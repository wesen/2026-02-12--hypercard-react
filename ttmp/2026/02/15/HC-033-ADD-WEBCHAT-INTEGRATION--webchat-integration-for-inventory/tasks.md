# Tasks

## Execution Strategy

- [x] Reordered Phase 6 validation items to run continuously during implementation (not only at the end).
- [x] Captured Phase 2-6 in detailed, implementation-level tasks.
- [x] Kept each phase independently testable before moving to next phase.

## Phase 2: Backend Streaming Contract, SEM, and Timeline Foundation

- [x] Create `go-inventory-chat` module skeleton under `2026-02-12--hypercard-react`.
- [x] Implement `POST /api/chat/completions` request decoding and response contract.
- [x] Implement `GET /ws` stream endpoint for completion output.
- [x] Add deterministic pending-stream registry keyed by `message_id`.
- [x] Add per-conversation timeline projection model in memory (`messages`, `events`, `lastSeq`).
- [x] Add monotonic sequence allocation per conversation.
- [x] Add typed SEM event model (`chat.message.user`, `chat.message.token`, `chat.message.artifact`, `chat.message.done`, `chat.message.error`).
- [x] Emit user-message SEM event when completion turn starts.
- [x] Emit token SEM events as assistant text streams.
- [x] Emit artifact SEM events for widget/card-proposal outputs.
- [x] Emit done SEM event carrying normalized action payloads.
- [x] Add projection updates for assistant streaming status transitions (`streaming` -> `complete`/`error`).
- [x] Add bounded retention policies for pending streams and timeline buffers.
- [x] Add hydration endpoint `GET /api/timeline?conversation_id=...`.
- [x] Keep CORS headers aligned with `POST /api/chat/completions`, `GET /ws`, and `GET /api/timeline`.
- [x] Remove backward-compatibility fallback path: WS now emits SEM envelopes only.

### Phase 2 Interleaved Validation

- [x] Run `gofmt` on all modified backend files after each contract change cluster.
- [x] Run `GOWORK=off go test ./...` after SEM event model changes.
- [x] Run manual completion + websocket smoke to verify SEM frames (token/artifact/done).
- [x] Run timeline hydration smoke and verify message/event projection correctness.
- [x] Verify stream URL contract no longer depends on legacy compatibility query toggles.

## Phase 3: SQLite Tooling and Response Planner

- [x] Implement SQLite schema bootstrap for `items` and `sales_log`.
- [x] Add idempotent schema ensure path.
- [x] Add deterministic mock seed data and force-reset mode.
- [x] Implement query tools: low-stock report, inventory valuation, sales summary, SKU lookup, item search.
- [x] Add planner intent routing from user prompts to tool operations.
- [x] Emit widget artifacts (`report-view`, `data-table`) from planner output.
- [x] Emit card-proposal artifacts with generated plugin `defineCard` code payload.
- [x] Emit actionable chips (`open-card`, `prefill`, `create-card`) from planner.
- [x] Keep planner deterministic and model-free for local reproducibility.

### Phase 3 Interleaved Validation

- [x] Run seed command and verify db reset/seed behavior.
- [x] Run planner-driven smoke prompts for each major intent path.
- [x] Verify artifact payload shape remains parseable by frontend protocol layer.
- [x] Re-run `GOWORK=off go test ./...` after planner/tool iterations.

## Phase 4: Frontend Chat Window, Stream Client, and Hydration

- [x] Add app-owned chat integration entrypoint in `apps/inventory/src/App.tsx`.
- [x] Pre-open dedicated desktop window `Inventory Chat` via `renderAppWindow`.
- [x] Add frontend protocol module for completions, websocket SEM parsing, and timeline hydration.
- [x] Implement startup hydration from `GET /api/timeline`.
- [x] Persist/reuse conversation ID in local storage.
- [x] Convert hydrated timeline records into `ChatWindowMessage` state.
- [x] Stream token events into in-progress assistant message.
- [x] Stream artifact events into message content blocks.
- [x] Finalize message actions on done event.
- [x] Add error handling for malformed/unknown WS payloads.
- [x] Remove legacy-frame parsing in frontend; protocol is SEM-only.
- [x] Fix StrictMode hydration race so hydrated transcript is not dropped during dev remount.
- [x] Add `vite-env.d.ts` typing for `import.meta.env`.

### Phase 4 Interleaved Validation

- [x] Run `npm exec -w apps/inventory tsc -b` after protocol and component changes.
- [x] Use browser automation to verify hydrated transcript appears for existing conversation.
- [x] Verify a new query after hydration streams and completes correctly.
- [x] Verify widget rendering and action chips still work under SEM-only stream contract.

## Phase 5: Runtime Card Injection and Action Safety

- [x] Implement `CardInjector` utility for host metadata + plugin bundle patching.
- [x] Add card ID and bundle-signature dedupe protections.
- [x] Handle `open-card` action to open existing inventory cards.
- [x] Handle `prefill` action to execute suggested follow-up prompt.
- [x] Handle `create-card` action to apply card proposal from current cache.
- [x] Rebuild proposal cache from hydrated artifact history on startup.
- [x] Emit system feedback messages for apply success/failure outcomes.
- [x] Open injected card window after successful creation.

### Phase 5 Interleaved Validation

- [x] Verify create-card action from streamed proposal inserts and opens new card.
- [x] Verify duplicate create-card requests are blocked with deterministic message.
- [x] Verify invalid/missing proposal ID paths produce safe system feedback.

## Phase 6: Continuous Validation, Build, Tooling, and Documentation

- [x] Add backend seed/runbook documentation in `go-inventory-chat/README.md`.
- [x] Add ticket-level smoke scripts in `scripts/` (`smoke-chat-backend.sh`, `smoke-sem-timeline.sh`).
- [x] Execute tmux-based backend run for real transport validation.
- [x] Execute tmux-based Vite run for real UI validation.
- [x] Perform browser-level E2E smoke (streaming response, widgets, create-card flow).
- [x] Fix inventory production build blocker by setting `worker.format = 'es'` in `apps/inventory/vite.config.ts`.
- [x] Re-run `npm run -w apps/inventory build` successfully after worker-format fix.
- [x] Re-run `npm exec -w apps/inventory tsc -b` and backend tests after latest protocol changes.
- [x] Record command trails, failures, and fixes in ticket diary/execution notes.
- [x] Update design doc to reflect implemented SEM/timeline scope.
- [x] Update changelog with post-SEM completion and validation results.
- [x] Refresh reMarkable upload with latest docs bundle.

## Completion Gate

- [x] All Phase 2-5 implementation tasks complete.
- [x] Phase 6 validation tasks complete.
- [x] Inventory chat works end-to-end with SQLite tooling, SEM streaming, timeline hydration, widgets, and runtime card creation.
