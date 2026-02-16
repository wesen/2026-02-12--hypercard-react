# Tasks

## TODO

### 0. Planning and decisions

- [ ] D0.1 Confirm default model/runtime provider for this ticket (OpenAI-compatible vs Ollama vs other).
- [ ] D0.2 Confirm whether plugin `assistant` card remains or is removed after chat app-window cutover.
- [ ] D0.3 Confirm timeline persistence default policy (always-on local sqlite vs opt-in flag).
- [ ] D0.4 Confirm window opening behavior for "Create card" (dedupe per artifact vs always new window).
- [ ] D0.5 Freeze `hypercard.widget.v1` payload schema (required keys and optional keys).

### 1. Backend module scaffolding (`go-inventory-chat`)

- [ ] B1.1 Create Go module under `2026-02-12--hypercard-react/go-inventory-chat`.
- [ ] B1.2 Add command entrypoint (`cmd/hypercard-inventory-server/main.go`) with structured flags.
- [ ] B1.3 Add runtime composer package for inventory runtime key.
- [ ] B1.4 Add strict request resolver for `/chat` and `/ws`.
- [ ] B1.5 Wire app-owned mux routes: `/chat`, `/ws`, `/api/timeline`, `/api/*`.
- [ ] B1.6 Add startup/shutdown lifecycle and logging.
- [ ] B1.7 Add README run instructions for backend dev/test.

### 2. SQLite inventory domain

- [ ] B2.1 Create store package with `Open`, `Migrate`, and repository helpers.
- [ ] B2.2 Implement `items` schema with stable field mapping.
- [ ] B2.3 Implement `sales` schema with stable field mapping.
- [ ] B2.4 Add seed loader matching frontend seed semantics.
- [ ] B2.5 Add seed script/command for repeatable local reset.
- [ ] B2.6 Add repository methods used by tool layer.
- [ ] B2.7 Add unit tests for migrations, seed idempotency, and query correctness.

### 3. Geppetto tools

- [ ] B3.1 Implement `inventory_search_items` tool.
- [ ] B3.2 Implement `inventory_get_item` tool.
- [ ] B3.3 Implement `inventory_low_stock` tool.
- [ ] B3.4 Implement `inventory_report` tool.
- [ ] B3.5 Implement `inventory_update_qty` tool.
- [ ] B3.6 Implement `inventory_record_sale` tool.
- [ ] B3.7 Register tools on server bootstrap.
- [ ] B3.8 Restrict runtime allowed-tools list in composer.
- [ ] B3.9 Add tool contract tests (input validation + output shape).

### 4. Structured widget extraction and SEM mapping

- [ ] B4.1 Create `hypercard_sem_widgets` package for widget event definitions.
- [ ] B4.2 Register custom geppetto event factory for widget event type.
- [ ] B4.3 Implement structuredsink extractor for `<hypercard:Widget:v1>`.
- [ ] B4.4 Parse YAML payload and normalize required fields.
- [ ] B4.5 Wrap event sink with `WithEventSinkWrapper` + `FilteringSink`.
- [ ] B4.6 Register custom SEM mapping (`hypercard.widget.v1`) via sem registry.
- [ ] B4.7 Add extractor tests for split-tag, malformed, and fenced YAML payloads.
- [ ] B4.8 Add integration test validating websocket emission of `hypercard.widget.v1`.

### 5. Backend endpoint/integration validation

- [ ] B5.1 Add resolver tests (conv id rules, prompt parsing, override rejection).
- [ ] B5.2 Add ws integration test (`ws.hello`, ping/pong, attach behavior).
- [ ] B5.3 Add `/chat` integration test for `llm.start/delta/final` progression.
- [ ] B5.4 Add `/api/timeline` hydration test for message entity snapshots.
- [ ] B5.5 Validate local dev flow with real provider credentials.

### 6. Frontend transport hard cutover

- [ ] F6.1 Add Vite proxy for `/chat`, `/ws`, `/api` in inventory app.
- [ ] F6.2 Implement `pinocchioTransport.ts` (conv id, ws attach, prompt send).
- [ ] F6.3 Add SEM envelope parser utilities and type guards.
- [ ] F6.4 Replace inventory chat state shape with streaming SEM model.
- [ ] F6.5 Implement reducers for `llm.start/delta/final` and widget events.
- [ ] F6.6 Ensure user message insertion aligns with backend chat submission flow.
- [ ] F6.7 Add selectors for message stream + pending state + error state.
- [ ] F6.8 Add reducer tests for streaming and widget attachment order.

### 7. Chat window integration in DesktopShell

- [ ] F7.1 Add `InventoryChatWindow.tsx` using engine `ChatWindow`.
- [ ] F7.2 Render chat as app-window using `DesktopShell.renderAppWindow`.
- [ ] F7.3 Auto-open inventory chat window at app start (dedupe key stable).
- [ ] F7.4 Wire send/cancel/actions to transport and slice actions.
- [ ] F7.5 Add smoke story/test for chat app-window rendering.

### 8. Artifact-to-card flow

- [ ] F8.1 Add `artifactsSlice` domain state keyed by artifact id.
- [ ] F8.2 On `hypercard.widget.v1`, persist artifact + attach widget block to message.
- [ ] F8.3 Add plugin template cards (`reportViewer`, `itemViewer`) in bundle.
- [ ] F8.4 Register template cards in stack metadata for openability.
- [ ] F8.5 Implement "Create card" action dispatch to `openWindow` with `param=artifactId`.
- [ ] F8.6 Add tests for action wiring and correct card/window payload.

### 9. Timeline hydration (post-cutover stabilization)

- [ ] F9.1 Add frontend hydration request (`/api/timeline`).
- [ ] F9.2 Map timeline message entities back into chat message state.
- [ ] F9.3 Define merge policy for hydrated entities vs live ws frames.
- [ ] F9.4 Add refresh persistence test scenario.

### 10. Cleanup and hard-cut verification

- [ ] C10.1 Remove inventory reliance on fake stream code paths.
- [ ] C10.2 Audit inventory app imports for old mock chat dependencies.
- [ ] C10.3 Confirm no duplicate assistant surfaces unless explicitly kept.
- [ ] C10.4 Document final runbook for backend + frontend startup.
- [ ] C10.5 Run full validation suite and capture known limitations.

### 11. Deferred advanced phase (not part of immediate MVP)

- [ ] A11.1 Design `hypercard.plugin_card.v1` structured proposal schema.
- [ ] A11.2 Add extractor + SEM mapping for plugin card proposals.
- [ ] A11.3 Build accept/reject/preview UI.
- [ ] A11.4 Add runtime injection flow with safety validation.
- [ ] A11.5 Revisit engine dynamic-card registry behavior for unknown card ids.
