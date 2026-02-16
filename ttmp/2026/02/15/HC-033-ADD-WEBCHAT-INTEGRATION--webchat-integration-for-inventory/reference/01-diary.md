---
Title: Diary
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - sqlite
    - go
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: Existing inventory stack and plugin capabilities validated against imported assumptions.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/vite-env.d.ts
      Note: Fix for import.meta.env compile error captured in diary
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/README.md
      Note: Backend runbook documented during implementation
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/cmd/inventory-chat/main.go
      Note: CLI serve/seed implementation captured in diary
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Confirmed app-window integration point used by implementation plan.
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory/design-doc/01-validated-architecture-and-implementation-plan.md
      Note: Written validated architecture and plan document.
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory/sources/local/webchat-hyper-integration.md
      Note: Imported source design document analyzed in Step 1.
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory/tasks.md
      Note: Detailed checklist maintained while executing steps
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Confirmed structured extraction/tag handling assumptions.
    - Path: pinocchio/pkg/webchat/conversation.go
      Note: Confirmed conversation lifecycle and topic model from imported document.
ExternalSources: []
Summary: Running implementation diary for HC-033 with full context, command trail, failures, and review notes.
LastUpdated: 2026-02-16T10:22:00-05:00
WhatFor: Preserve exact implementation narrative and validation details for review and continuation.
WhenToUse: Read before continuing work or reviewing architecture/implementation decisions.
---


# Diary

## Goal

Capture the full implementation journey for HC-033: ticket setup, source import, design validation against real code, planning decisions, code changes, tests, failures, and follow-up actions.

## Step 1: Ticket Creation, Source Import, and Ground-Truth Architecture Validation

I started by executing the exact ticket bootstrapping workflow requested by the user and then validated the imported document against the actual code in all relevant worktrees (`2026-02-12--hypercard-react`, `pinocchio`, `geppetto`). The main output of this step is a corrected architecture/implementation plan that keeps the imported design intent but grounds it in what is concretely implemented today.

The validation result is that the imported document is strong, but it overreaches for immediate implementation scope in this worktree. The current `hypercard-react` project has no Go backend yet, and the inventory assistant is currently VM-local only. The plan therefore pivots to a staged implementation: first deliver a working Go+SQLite chat backend and app-window integration here, while keeping protocol and architecture compatible with future Pinocchio/Geppetto structured event integration.

### Prompt Context

**User prompt (verbatim):** "Create a new ticket HC-033-ADD-WEBCHAT-INTEGRATION with docmgr and use docmgr import file --file /tmp/webchat-hyper-integration.md --ticket HC-033-ADD-WEBCHAT-INTEGRATION. Read it in detail and do your own analysis, since you have the code as well. Store that analysis and implementation plan (making sure things laid out in the imported document are correct) in the ticket and upload it to remarkable. Make a detailed breakdown of tasks and add them to the ticket as well. Keep a frequent detailed diary as you work.

The goal is to have a working inventory chat (with the tools querying a sqlite db with mock data, make scripts to populate, but that's towards the end).

As you work things out and encounter problems, feel free to write little experiments in the ticket's scripts/ folder. Implement the go application in the 2026-02-12--hypercard-react/ folder. The projects are worktrees.

Be exhaustive and detailed in your planning."

**Assistant interpretation:** Create and populate HC-033 in docmgr, deeply verify the imported architecture against repository reality, produce an exhaustive implementation plan and task breakdown in ticket docs, then implement a working inventory chat with a Go backend using SQLite-backed tools and keep a detailed work diary.

**Inferred user intent:** Deliver a practical, working vertical slice (backend + frontend integration) while preserving long-term architectural direction (webchat + structured artifacts + dynamic card injection), with robust documentation for review and continuation.

**Commit (code):** N/A in this step (documentation and analysis setup only; implementation starts in next steps).

### What I did

1. Loaded required skills: `docmgr`, `diary`, and `remarkable-upload`.
2. Verified docmgr workspace status and available ticket/topic vocabulary.
3. Created ticket:
   - `docmgr ticket create-ticket --ticket HC-033-ADD-WEBCHAT-INTEGRATION --title "Webchat Integration for Inventory" --topics chat,backend,sqlite,go`
4. Imported provided document:
   - `docmgr import file --file /tmp/webchat-hyper-integration.md --ticket HC-033-ADD-WEBCHAT-INTEGRATION`
5. Inspected imported source in full, section-by-section.
6. Audited current code in:
   - `2026-02-12--hypercard-react` (inventory app + engine runtime/windowing/chat widgets)
   - `pinocchio/pkg/webchat` (transport, conversation lifecycle, stream coordinator, SEM)
   - `geppetto/pkg/events/structuredsink` (tag extraction model)
7. Created ticket docs:
   - `design-doc/01-validated-architecture-and-implementation-plan.md`
   - `reference/01-diary.md`
   - `reference/02-execution-notes-and-experiments.md`
8. Wrote validated architecture/plan doc with:
   - imported-assumption verification table
   - corrections where needed
   - phased implementation plan.

### Why

1. The imported document needed factual verification against live code to avoid planning from stale or idealized assumptions.
2. The user explicitly asked for exhaustive planning before and during implementation.
3. Early documentation structure is required to keep diary/task/changelog discipline while coding.

### What worked

1. `docmgr` workflow executed cleanly for ticket creation and import.
2. Imported source path and metadata were registered into ticket index automatically.
3. Cross-worktree validation confirmed most architectural assumptions and identified precise scope corrections.
4. Design doc now captures actionable implementation phases aligned with current repository state.

### What didn't work

1. Command mismatch while querying ticket path:
   - Attempted: `docmgr ticket tickets --ticket HC-033-ADD-WEBCHAT-INTEGRATION --plain`
   - Error: `Error: unknown flag: --plain`
2. Resolution:
   - Switched to: `docmgr list tickets --with-glaze-output --output csv --with-headers=false --fields ticket,path`
   - Filtered row for `HC-033-ADD-WEBCHAT-INTEGRATION`.

### What I learned

1. This docmgr version does not support `--plain` on `ticket tickets`; scriptable listing is via `docmgr list tickets --with-glaze-output`.
2. Imported architecture is largely accurate, but the concrete inventory app today is still VM-assistant-only and requires host-level chat integration to meet backend/sqlite goals.
3. `DesktopShell` app-window path is the cleanest integration seam for this ticket.

### What was tricky to build

The tricky part in this step was not coding but boundary-setting: keeping the implementation faithful to the imported system design while constraining scope to a deliverable in the current worktree. The imported document naturally points to full Pinocchio/Geppetto runtime composition, but this repository currently lacks a Go backend. I resolved this by documenting a compatibility-first staged plan: build a local Go+SQLite backend now with event/artifact contracts shaped for later Pinocchio/Geppetto alignment.

### What warrants a second pair of eyes

1. Whether to keep legacy plugin `assistant` card visible once app-window chat is active.
2. Whether created cards should persist in backend storage in MVP or stay runtime-only initially.
3. Final protocol shape for artifact events if the team wants immediate parity with Pinocchio SEM naming.

### What should be done in the future

1. Migrate the local backend protocol to full Pinocchio/Geppetto structured sink + SEM translation once MVP is stable.
2. Add per-card capability policies to tighten safety for injected read-only report cards.
3. Add durable card proposal persistence and reload hooks.

### Code review instructions

1. Read `design-doc/01-validated-architecture-and-implementation-plan.md` end-to-end first.
2. Cross-check referenced source files in HyperCard/Pinocchio/Geppetto for claim validation.
3. Verify the implementation phases align with user-stated goals (Go backend in this worktree + SQLite tooling + chat window integration).

### Technical details

Key commands executed:

```bash
docmgr status --summary-only
docmgr ticket create-ticket --ticket HC-033-ADD-WEBCHAT-INTEGRATION --title "Webchat Integration for Inventory" --topics chat,backend,sqlite,go
docmgr import file --file /tmp/webchat-hyper-integration.md --ticket HC-033-ADD-WEBCHAT-INTEGRATION
docmgr list tickets --with-glaze-output --output csv --with-headers=false --fields ticket,path
docmgr doc add --ticket HC-033-ADD-WEBCHAT-INTEGRATION --doc-type design-doc --title "Validated Architecture and Implementation Plan"
docmgr doc add --ticket HC-033-ADD-WEBCHAT-INTEGRATION --doc-type reference --title "Diary"
docmgr doc add --ticket HC-033-ADD-WEBCHAT-INTEGRATION --doc-type reference --title "Execution Notes and Experiments"
```

## Step 2: Go Backend + SQLite Tooling in `go-inventory-chat`

I implemented the new Go backend inside `2026-02-12--hypercard-react/go-inventory-chat` and made it runnable independently from Pinocchio so we can ship a working inventory chat slice quickly. The backend now supports schema setup, deterministic mock seeding, a tool-backed response planner, and streamed chat frames over WebSocket.

This step establishes the backend contracts the frontend can consume immediately, while keeping the architecture compatible with the future Pinocchio-style SEM/timeline phase.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Build the required Go application in this worktree, wire it to SQLite-backed tools, and expose a working chat transport usable by the inventory frontend.

**Inferred user intent:** A functional backend-first foundation is required before frontend chat integration can be meaningful.

**Commit (code):** N/A (working tree changes in progress).

### What I did

1. Created module scaffold:
   - `go-inventory-chat/go.mod`
   - `cmd/inventory-chat/main.go`
   - `internal/store/*`
   - `internal/chat/*`
   - `internal/app/server.go`
2. Implemented SQLite store layer:
   - schema creation for `items` and `sales_log`
   - seed/reset support from deterministic mock data
   - query functions for low stock, valuation, sales summary, SKU lookup, item search
3. Implemented chat planner:
   - prompt pattern routing (low stock, sales, value, item lookup/search, help)
   - backend artifacts for `report-view`, `data-table`, and `card-proposal`
   - generated plugin card code for low-stock saved reports
4. Implemented HTTP/WS transport:
   - `POST /api/chat/completions`
   - `GET /ws?conversation_id=...&message_id=...`
   - token/artifact/done stream framing
   - basic CORS config and `/healthz`
5. Added backend runtime utilities:
   - `go-inventory-chat/scripts/seed.sh`
   - `go-inventory-chat/README.md`
6. Verified backend behavior:
   - `GOWORK=off go test ./...`
   - `GOWORK=off go run ./cmd/inventory-chat seed --db ./data/inventory.db --force`
   - manual POST+WS smoke test showing token stream, widget artifacts, card proposal, and done actions.

### Why

1. The worktree had no Go backend at all; this was a hard blocker.
2. SQLite tool queries are required for grounded inventory chat responses.
3. A deterministic planner allows testing and integration without external model dependencies.

### What worked

1. Store schema/seed/query layers behaved correctly against mock data.
2. Stream flow produced expected sequence: token frames, artifacts, done with actions.
3. Card proposal artifact carried executable plugin code suitable for frontend injection.
4. Backend build/test completed with `GOWORK=off`.

### What didn't work

1. Initial backend test command failed due parent `go.work` version constraints:
   - Command: `go test ./...`
   - Error:
     - `module ../../geppetto listed in go.work file requires go >= 1.25.7, but go.work lists go 1.23`
2. Resolution:
   - Re-ran with isolated module mode:
     - `GOWORK=off go test ./...`

### What I learned

1. This workspace-level `go.work` influences nested modules unless explicitly disabled.
2. The deterministic planner+artifact approach is enough to unlock frontend integration now.
3. Generated plugin code payloads are easiest to keep safe by constraining to read-only/report card templates.

### What was tricky to build

Balancing flexibility and stability in the planner was the sharp edge. It needed to feel tool-driven and chat-like while remaining deterministic and debuggable. I addressed this by using strict intent buckets (low stock/sales/value/item lookup) and emitting fixed artifact shapes with strong IDs, instead of free-form response generation.

### What warrants a second pair of eyes

1. Prompt classification heuristics for ambiguous user text.
2. Memory strategy for pending stream responses under load (currently in-memory map).
3. Long-term migration path from current stream frame contract to full SEM envelopes.

### What should be done in the future

1. Add richer planner intents (filters, date ranges, category-specific reports).
2. Add durable chat/timeline persistence backend-side.
3. Add structured sink extraction path once Pinocchio runtime composer is integrated.

### Code review instructions

1. Start with `go-inventory-chat/cmd/inventory-chat/main.go`.
2. Review storage contract in `go-inventory-chat/internal/store/sqlite.go`.
3. Review planner behavior in `go-inventory-chat/internal/chat/planner.go`.
4. Review transport and stream framing in `go-inventory-chat/internal/app/server.go`.
5. Validate with:
   - `GOWORK=off go test ./...`
   - `GOWORK=off go run ./cmd/inventory-chat seed --db ./data/inventory.db --force`

### Technical details

Smoke request/stream sequence used:

```bash
GOWORK=off go run ./cmd/inventory-chat serve --db ./data/inventory.db --addr :18081 --allow-origin '*'
curl -sS -X POST http://127.0.0.1:18081/api/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"conversationId":"conv-smoke","messages":[{"role":"user","text":"show low stock below 3"}]}'
```

Observed stream payload classes:
1. `{\"type\":\"token\",...}`
2. `{\"type\":\"artifact\",\"artifact\":{\"kind\":\"widget\",...}}`
3. `{\"type\":\"artifact\",\"artifact\":{\"kind\":\"card-proposal\",...}}`
4. `{\"type\":\"done\",\"actions\":[...]}`.

## Step 3: Inventory Frontend Chat Window Integration + Card Injection

I integrated the inventory app with an app-owned chat window that consumes the new backend stream contract and can create runtime plugin cards from backend proposals. This converts chat from a VM-local toy assistant into a host-level assistant with backend data access and actionable outputs.

I also incorporated the user's follow-up about SEM/timeline by explicitly queuing those capabilities as Phase-2 tasks in both tasks and design docs (without blocking this working slice).

### Prompt Context

**User prompt (verbatim):** (see Step 1)

Additional prompt (verbatim): "what about SEM  projection and timeline hydration and the like?"

Additional prompt (verbatim): "jsut do it when you think is good. jsut add it to the tasks"

Additional prompt (verbatim): "also add it to the design document if you haven't already. then continue and build the whole thing going forward. Use the web-chat in pinocchio as reference when needed"

**Assistant interpretation:** Complete the end-to-end app integration now, but queue SEM/timeline hydration as explicit upcoming work and ensure documentation reflects that plan.

**Inferred user intent:** Keep momentum on a working deliverable while preserving architectural completeness by explicitly tracking deferred capabilities.

**Commit (code):** N/A (working tree changes in progress).

### What I did

1. Added frontend chat integration files:
   - `apps/inventory/src/chat/protocol.ts`
   - `apps/inventory/src/chat/cardInjector.ts`
   - `apps/inventory/src/chat/InventoryChatAssistantWindow.tsx`
2. Updated `apps/inventory/src/App.tsx`:
   - pre-opens app window `Inventory Chat`
   - uses `DesktopShell.renderAppWindow` to host `InventoryChatAssistantWindow`
   - uses mutable stack clone for runtime card injection path
3. Implemented stream handling in chat window:
   - submit completion request
   - open websocket and stream tokens
   - process widget and card-proposal artifacts
   - finalize with chat actions
4. Implemented widget rendering:
   - `data-table` -> `DataTable`
   - `report-view` -> `ReportView`
5. Implemented action routing:
   - `open-card`
   - `prefill`
   - `create-card` (proposal apply + card window open)
6. Implemented `CardInjector` utility:
   - add host card metadata
   - append `defineCard(...)` patch code to plugin bundle
   - dedupe guard for duplicate card IDs/injection signatures
7. Added `apps/inventory/src/vite-env.d.ts` for `import.meta.env` typing.
8. Updated docs/tasks to include deferred Phase-2 SEM/timeline work explicitly.

### Why

1. `DesktopShell` app-window path is the correct host-level integration seam.
2. Inline widget support and action chips are already provided by existing `ChatWindow`.
3. Card injection path fulfills the “inventory chat can create cards” requirement.

### What worked

1. Frontend typecheck succeeds:
   - `npm exec -w apps/inventory tsc -b`
2. Backend + frontend contracts align for streamed token/artifact/done flow.
3. Proposal-to-card creation path is wired with dedupe and immediate open-window behavior.
4. Requested SEM/timeline follow-up is captured in task and design artifacts.

### What didn't work

1. Initial frontend compile failed due missing Vite typing:
   - Error: `Property 'env' does not exist on type 'ImportMeta'`
   - Resolution: created `apps/inventory/src/vite-env.d.ts`.
2. Inventory production build still fails on pre-existing worker-format issue:
   - Command: `npm run -w apps/inventory build`
   - Error:
     - `Invalid value "iife" for option "worker.format" ...`
     - file in stack trace: `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
   - This is outside newly added chat integration files and should be treated as existing build-system issue.

### What I learned

1. `ChatWindow` is a strong integration surface for mixed text + structured widget content.
2. Runtime card injection remains simple if host metadata and VM patching stay in lockstep.
3. Capturing deferred architecture tasks early prevents drift during iterative delivery.

### What was tricky to build

Synchronizing streaming text and out-of-band artifacts into a single assistant message required careful ordering. Tokens arrive incrementally, while artifacts can arrive later; the message needed to remain readable during stream and become structured at completion. I handled this by buffering artifact blocks during stream and materializing `content` when done fires.

### What warrants a second pair of eyes

1. Action payload validation and hardening for malformed backend actions.
2. Stack mutation strategy for long-running sessions with many injected cards.
3. UX around proposal lifecycle (e.g., duplicates, stale proposal IDs).

### What should be done in the future

1. Implement queued Phase-2 SEM/timeline hydration tasks.
2. Add backend persistence for accepted cards.
3. Resolve engine worker build issue affecting production `vite build`.

### Code review instructions

1. Review entry integration in `apps/inventory/src/App.tsx`.
2. Review chat protocol contract in `apps/inventory/src/chat/protocol.ts`.
3. Review UI/controller logic in `apps/inventory/src/chat/InventoryChatAssistantWindow.tsx`.
4. Review injection utility in `apps/inventory/src/chat/cardInjector.ts`.
5. Verify with:
   - `npm exec -w apps/inventory tsc -b`
   - `GOWORK=off go test ./...` in `go-inventory-chat`.

### Technical details

Frontend compile command that passed:

```bash
npm exec -w apps/inventory tsc -b
```

Frontend build command that failed (existing issue):

```bash
npm run -w apps/inventory build
```

Failure excerpt:

```text
Invalid value "iife" for option "worker.format" - UMD and IIFE output formats are not supported for code-splitting builds.
file: .../packages/engine/src/plugin-runtime/worker/sandboxClient.ts
```

## Step 4: Real tmux E2E Chat Test

After backend/frontend integration landed, I ran a real end-to-end test using `tmux` for long-running processes and browser automation for user-level validation. This confirms the system works beyond unit/build checks and exercises the actual interactive flow.

The test validated the critical path requested by the user: streaming chat response, inline inventory widgets, and runtime card creation from a proposal.

### Prompt Context

**User prompt (verbatim):** "you can run things in tmux, including vite, to do a real test of the chat functionality."

**Assistant interpretation:** Stand up backend and frontend in persistent tmux sessions, then run a real browser-level interaction test to verify functional chat behavior.

**Inferred user intent:** Confirm the implementation actually works in a realistic running environment, not just static code checks.

**Commit (code):** N/A (verification step).

### What I did

1. Launched backend in tmux session `hc033-backend`:
   - `GOWORK=off go run ./cmd/inventory-chat serve --db ./data/inventory.db --addr :18081 --allow-origin http://127.0.0.1:15173`
2. Launched inventory Vite app in tmux session `hc033-frontend`:
   - `VITE_INVENTORY_CHAT_BASE_URL=http://127.0.0.1:18081 npm run -w apps/inventory dev -- --host 127.0.0.1 --port 15173`
3. Verified backend health endpoint returns OK.
4. Drove browser interaction:
   - opened app,
   - clicked `Show low stock below 3`,
   - observed streamed AI response with `report-view` and `data-table`,
   - clicked `Create Saved Card`,
   - verified system message and opened injected card window `Saved Low Stock <= 3`.

### Why

1. This validates real runtime behavior and integration seams.
2. It catches issues missed by static compilation checks.
3. It proves the requested product behavior is operational.

### What worked

1. Chat app window auto-opens as expected.
2. Streaming token flow from backend is visible in UI.
3. Widget artifacts render correctly.
4. Card proposal apply flow injects and opens a new plugin card successfully.

### What didn't work

No new functional runtime failures were observed in this E2E pass.

### What I learned

1. The host-level chat integration pattern is viable and stable for iterative extension.
2. Proposal buffering + action-driven apply flow gives clear user control for runtime mutations.

### What was tricky to build

Process orchestration was the trickiest aspect in this step. Running backend/frontend in tmux while also driving browser checks required explicit session startup order, host/port consistency, and environment wiring (`VITE_INVENTORY_CHAT_BASE_URL`). Once aligned, the scenario was stable and repeatable.

### What warrants a second pair of eyes

1. Additional E2E scenarios beyond low-stock flow (sales summary, SKU lookup, repeated card creation).
2. Error-path UX when backend is unavailable or stream disconnects mid-response.

### What should be done in the future

1. Add automated Playwright scenario(s) for chat flows.
2. Add CI-friendly smoke profile for backend + frontend startup checks.

### Code review instructions

1. Review tmux runbook commands in `reference/02-execution-notes-and-experiments.md`.
2. Re-run manual scenario:
   - low-stock suggestion,
   - verify widgets,
   - create saved card and verify opened window content.

### Technical details

Validated chat UI outcomes:
1. `You: Show low stock below 3` message logged.
2. AI message included summary text + widget blocks.
3. Action chips rendered (`Open Low Stock`, `Open Browse`, `Create Saved Card`).
4. `Create Saved Card` produced:
   - system message `Card 'saved_low_stock_3' injected.`
   - new window with card title `Saved Low Stock <= 3` and table rows.

## Step 5: SEM-Only Contract Cutover + Phase 2-6 Completion Hardening

After confirming the integrated behavior, I executed a strict protocol cleanup pass requested by the user: remove all backward-compatibility handling for legacy WS frames and keep this project SEM-only. I then closed remaining execution gaps by fixing the inventory production build issue and rewriting tasks into detailed, interleaved Phase 2-6 execution checklists.

### Prompt Context

**User prompt (verbatim):** "What's legacy frames?"

**User prompt (verbatim):** "ok, no backwards compatibility, just rip things out. This is a new project.

then, after you're done with it and what you were doing:

  add tasks for phase 2-6 (if you haven't done already). actually, move stuff from phase 6 forward and interleave it with when things are built to test them as early as possible. Be really detailed and exhaustive in your
  tasks, so that the entire thing is laid out .
 
  ok now finish all the phases, I'm gonna go swimming and I want it to be finished when I come back"

**Assistant interpretation:** Remove legacy stream compatibility fully (backend + frontend), verify SEM-only runtime behavior, finish pending phase work, and produce exhaustive Phase 2-6 tasks with early/interleaved validation steps.

**Inferred user intent:** Treat the implementation as greenfield and final for this ticket: no compatibility ballast, no deferred execution ambiguity, and clear operational closure.

**Commit (code):** N/A (working tree changes in progress).

### What I did

1. Removed backend legacy-frame fallbacks in `go-inventory-chat/internal/app/server.go`:
   - eliminated `semMode` conditional branch,
   - removed `writeStreamFrame` fallback helper,
   - removed `wantsSEM` query switch,
   - made WS stream SEM-only (`conn.WriteJSON(envelope)`),
   - simplified stream URL to omit `sem=1` toggle query.
2. Removed legacy frame type/paths in frontend `apps/inventory/src/chat/protocol.ts`:
   - deleted `BackendStreamFrame` union,
   - deleted legacy parser/dispatcher,
   - enforced SEM-only WS payload handling.
3. Removed now-unused backend legacy type (`StreamFrame`) in `go-inventory-chat/internal/chat/types.go`.
4. Updated backend README to reflect SEM-only contract and endpoint query shape.
5. Re-ran checks:
   - `gofmt -w ...`
   - `GOWORK=off go test ./...`
   - `npm exec -w apps/inventory tsc -b`
6. Re-ran SEM smoke from ticket script:
   - `scripts/smoke-sem-timeline.sh hc033-sem-only-fresh`
   - verified stream URL without `sem=1`,
   - verified SEM event counts and timeline projection summary.
7. Re-ran real frontend validation:
   - tmux backend + tmux Vite startup,
   - browser interaction using suggestion flow (`Show low stock below 3`) to verify SEM-only stream still renders and actions still work.
8. Closed the inventory build blocker in this worktree:
   - added `worker.format = 'es'` in `apps/inventory/vite.config.ts`,
   - re-ran `npm run -w apps/inventory build` successfully.
9. Rewrote `tasks.md` into a full Phase 2-6 execution map with interleaved validation checkpoints (and current completion state).

### Why

1. User explicitly asked for no backward compatibility.
2. SEM-only transport reduces branching and failure modes.
3. A detailed phase plan with validation integrated early prevents late-stage surprises and makes ticket completion auditable.
4. Finishing the production build path removes a known practical blocker and strengthens “phase complete” status.

### What worked

1. SEM-only stream contract works end-to-end (backend -> frontend -> UI rendering).
2. Timeline hydration and projected transcript remain correct after protocol simplification.
3. Real browser flow still works for low-stock query, widgets, and action chips.
4. Inventory app production build now succeeds in this worktree after `worker.format` change.
5. Phase 2-6 tasks are now detailed and execution-ordered with testing embedded.

### What didn't work

1. One smoke run initially raced backend startup due parallel execution and failed timeline fetch (`curl: (7) Failed to connect ...`).
2. Resolution:
   - switched to sequential startup/health-check/smoke ordering,
   - re-ran and confirmed stable output.

### What I learned

1. Removing compatibility logic simplified both server and client stream code significantly.
2. Sequential orchestration for tmux+smoke scripts is more reliable than parallel startup for this local stack.
3. The inventory build issue was resolvable at app-level config (`worker.format = 'es'`) without touching the chat implementation.

### What was tricky to build

The subtle part was ensuring protocol simplification did not regress hydration or UI behavior: removing legacy parsing can silently break streams if any message type assumption is off. I mitigated this by combining CLI smoke (`websocat` + `/api/timeline`) with browser-level validation in the same pass.

### What warrants a second pair of eyes

1. `apps/inventory/vite.config.ts` worker-format change impact on other runtime/worker scenarios outside this ticket.
2. Whether SEM event names should now be moved even closer to Pinocchio semregistry naming before multi-repo convergence.

### What should be done in the future

1. Optional: add automated integration tests asserting SEM-only WS payload shapes.
2. Optional: persist timeline projection beyond memory for restart-safe hydration.
3. Optional: align SEM schema with formal shared types between backend and frontend.

### Code review instructions

1. Review protocol cutover:
   - `go-inventory-chat/internal/app/server.go`
   - `go-inventory-chat/internal/chat/types.go`
   - `apps/inventory/src/chat/protocol.ts`
2. Review build fix:
   - `apps/inventory/vite.config.ts`
3. Re-run validations:
   - `GOWORK=off go test ./...` (backend)
   - `npm exec -w apps/inventory tsc -b`
   - `npm run -w apps/inventory build`
   - `scripts/smoke-sem-timeline.sh <conversation-id>`

### Technical details

SEM smoke output after cutover (key points):
1. Completion stream URL no longer includes `sem=1`.
2. WS frames observed are SEM envelopes only.
3. Event counts include token/artifact/done classes.
4. Timeline summary confirms projected messages/events and monotonic `lastSeq`.
