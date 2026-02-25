---
Title: Investigation diary
Ticket: OS-09-JS-ENGINE-API-DESIGN
Status: active
Topics:
    - go-go-os
    - javascript
    - api-design
    - middleware
    - profiles
    - engine
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go
      Note: |-
        Backend runtime composition evidence source
        Evidence source for backend runtime composition behavior
    - Path: go-go-os/packages/engine/src/chat/runtime/profileApi.ts
      Note: |-
        Frontend profile API evidence source
        Evidence source for profile API and schema endpoints
    - Path: go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/design-doc/01-comprehensive-js-api-design-for-engine-factories-profile-registry-and-schema-first-middleware.md
      Note: |-
        Primary design and research deliverable
        Primary OS-09 design deliverable produced by this investigation
ExternalSources: []
Summary: Chronological investigation log for OS-09 JS engine/profile/middleware API design research.
LastUpdated: 2026-02-24T21:15:49-05:00
WhatFor: Preserve exact commands, findings, and decisions used to produce the OS-09 design document.
WhenToUse: Use for audit, continuation, or onboarding into OS-09 research decisions.
---


# Investigation diary

## Goal

Produce a detailed, evidence-backed design document for an elegant JS API that covers:

1. Engine instantiation using profile registries.
2. Safe middleware/settings overrides.
3. JS middleware declaration with schemas.
4. Alignment with existing frontend/backend architecture.

## Phase 1: Ticket workspace setup

Commands run:

```bash
docmgr status --summary-only
docmgr ticket create-ticket --ticket OS-09-JS-ENGINE-API-DESIGN --title "js engine factory profile-registry and middleware-schema api design" --topics go-go-os,javascript,api-design,middleware,profiles,engine
docmgr doc add --ticket OS-09-JS-ENGINE-API-DESIGN --doc-type design-doc --title "Comprehensive JS API design for engine factories profile registry and schema-first middleware"
docmgr doc add --ticket OS-09-JS-ENGINE-API-DESIGN --doc-type reference --title "Investigation diary"
```

Observed results:

1. Ticket workspace created under `ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--...`.
2. Base files created: `index.md`, `tasks.md`, `changelog.md`.
3. Primary design doc and diary skeleton created.

Decision:

1. Use new `OS-09` ticket instead of overloading `OS-08` because the user asked for broad API research/design deliverable, not a narrow bugfix.

## Phase 2: Evidence discovery (frontend and backend)

Primary discovery commands:

```bash
rg -n "profile|middleware|runtime|registry" go-go-os/packages go-go-os/apps go-go-os/go-inventory-chat -S
rg --files go-go-os/packages/engine/src | rg 'profile|chat|runtime|middleware'
wc -l <key files>
nl -ba <key file> | sed -n '<range>'
```

Key findings captured:

1. Frontend already has a robust profile API client (`profileApi.ts`) including middleware schema catalog fetchers.
2. Frontend selection state is fully wired through Redux (`profileSlice.ts`) and conversation send/connect paths (`useConversation.ts`, `http.ts`, `wsManager.ts`).
3. Inventory launcher chat window passes profile selector + registry (`renderInventoryApp.tsx`).
4. Backend has runtime composition with schema-validated middleware resolution (`runtime_composer.go`, `middleware_definitions.go`).
5. Backend request resolver enforces safety constraints (e.g., rejects runtime overrides).
6. Integration tests verify profile selection, runtime key/version behavior, and middleware propagation.
7. No existing first-class JS API exists for `createEngineFactory`, `createProfileRegistry`, or `defineMiddleware`.

## Phase 3: Detailed source extraction

Commands run (representative):

```bash
nl -ba go-go-os/packages/engine/src/chat/runtime/profileApi.ts | sed -n '1,280p'
nl -ba go-go-os/packages/engine/src/chat/runtime/profileApi.ts | sed -n '280,520p'
nl -ba go-go-os/packages/engine/src/chat/runtime/useProfiles.ts | sed -n '1,260p'
nl -ba go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx | sed -n '80,320p'
nl -ba go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go | sed -n '1,280p'
nl -ba go-go-os/go-inventory-chat/internal/pinoweb/middleware_definitions.go | sed -n '1,280p'
nl -ba go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go | sed -n '1,320p'
nl -ba go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go | sed -n '430,520p'
nl -ba go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go | sed -n '620,780p'
nl -ba go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go | sed -n '900,1035p'
```

Important interpretation discipline used:

1. Only assert behavior that is visible in code/tests.
2. Separate observed behavior from design recommendation.
3. Use explicit file+line references for major claims.

## Phase 4: Design synthesis decisions

Major decisions made while drafting the doc:

1. Keep API profile-first to match existing product behavior (`selectedProfile`/`selectedRegistry` model).
2. Introduce a fluent middleware patch builder to avoid ad hoc object merge logic.
3. Keep schema-first middleware declaration (`defineMiddleware`) to align with backend `ConfigJSONSchema` style.
4. Define deterministic merge precedence model to avoid runtime ambiguity.
5. Mirror backend safety defaults by making runtime override behavior explicit and opt-in.
6. Keep transport API bridging optional but recommended via `createProfileClient` facade.

Rejected approaches:

1. Transport-only API with no engine factory.
2. Single monolithic compose function with weak typing.
3. Backend-only middleware declarations with no JS authoring API.

## Phase 5: Deliverable authoring

Action taken:

1. Replaced scaffold design doc with full long-form architecture and API proposal.
2. Added extensive examples (quick start, override patterns, middleware declaration, migration path, policy-safe usage).
3. Added phased implementation plan and risk/alternative analysis.

Verification command:

```bash
wc -l -w ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/design-doc/01-comprehensive-js-api-design-for-engine-factories-profile-registry-and-schema-first-middleware.md
```

Result:

1. 1026 lines / 3672 words, comfortably above the requested 7+ page target for typical PDF rendering.

## Phase 6: Bookkeeping and publication workflow

Planned/required completion steps:

1. Update `tasks.md` with explicit completed checklist.
2. Update `changelog.md` with design-research entry.
3. Relate key files to docs via `docmgr doc relate`.
4. Run `docmgr doctor --ticket OS-09-JS-ENGINE-API-DESIGN --stale-after 30`.
5. Upload design+diary bundle to reMarkable with dry-run first.

## Phase 7: Bookkeeping + upload execution (completed)

Commands run:

```bash
docmgr doc relate --doc /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/design-doc/01-comprehensive-js-api-design-for-engine-factories-profile-registry-and-schema-first-middleware.md \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/profileApi.ts:Current frontend profile and schema catalog API" \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useConversation.ts:Profile selection propagated into conversation transport" \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/ws/wsManager.ts:Profile+registry websocket query serialization" \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:Backend runtime composition and middleware validation" \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go:Resolver safety rules and profile selection chain" \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go:Integration coverage for profile/runtime behavior"

docmgr doc relate --doc /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/reference/01-investigation-diary.md \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/design-doc/01-comprehensive-js-api-design-for-engine-factories-profile-registry-and-schema-first-middleware.md:Primary OS-09 design deliverable produced by this investigation" \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/profileApi.ts:Evidence source for profile API and schema endpoints" \
  --file-note "/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:Evidence source for backend runtime composition behavior"

docmgr doctor --ticket OS-09-JS-ENGINE-API-DESIGN --stale-after 30
docmgr vocab add --category topics --slug api-design --description "API design and contract modeling work"
docmgr vocab add --category topics --slug engine --description "Runtime engine architecture and APIs"
docmgr vocab add --category topics --slug javascript --description "JavaScript and TypeScript implementation concerns"
docmgr vocab add --category topics --slug middleware --description "Middleware declaration, composition, and policy"
docmgr vocab add --category topics --slug profiles --description "Profile registries and profile-based runtime selection"
docmgr doctor --ticket OS-09-JS-ENGINE-API-DESIGN --stale-after 30

remarquee status
remarquee cloud account --non-interactive
remarquee upload bundle --dry-run \
  /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/design-doc/01-comprehensive-js-api-design-for-engine-factories-profile-registry-and-schema-first-middleware.md \
  /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/reference/01-investigation-diary.md \
  --name "OS-09 JS Engine API Design" \
  --remote-dir "/ai/2026/02/25/OS-09-JS-ENGINE-API-DESIGN" \
  --toc-depth 2

remarquee upload bundle \
  /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/design-doc/01-comprehensive-js-api-design-for-engine-factories-profile-registry-and-schema-first-middleware.md \
  /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/reference/01-investigation-diary.md \
  --name "OS-09 JS Engine API Design" \
  --remote-dir "/ai/2026/02/25/OS-09-JS-ENGINE-API-DESIGN" \
  --toc-depth 2

remarquee cloud ls /ai/2026/02/25 --long --non-interactive
remarquee cloud ls /ai/2026/02/25/OS-09-JS-ENGINE-API-DESIGN --long --non-interactive
```

Results:

1. `docmgr doc relate` updated existing related file notes for both docs.
2. First `docmgr doctor` run reported unknown topic slugs.
3. Added five topic vocabulary entries and reran doctor; second doctor run passed cleanly.
4. `remarquee upload bundle --dry-run` succeeded.
5. Real upload succeeded: `OK: uploaded OS-09 JS Engine API Design.pdf -> /ai/2026/02/25/OS-09-JS-ENGINE-API-DESIGN`.
6. Remote verification showed final file entry: `[f] OS-09 JS Engine API Design`.

Issue encountered and resolution:

1. Initial `remarquee cloud ls /ai/2026/02/25/OS-09-JS-ENGINE-API-DESIGN --long --non-interactive` returned `no matches`.
2. Listed parent path (`/ai/2026/02/25`) to confirm directory existed.
3. Reran target listing successfully, confirming upload was present.

## Tricky points and resolutions

1. Potential ambiguity around ticket target (`OS-08` vs new ticket).
   - Resolution: created `OS-09` to avoid mixing implementation bugfix history with API research.
2. Need to avoid speculative claims.
   - Resolution: all major architecture claims anchored to source files/line ranges.
3. Need to keep “runtime middleware” distinct from Redux middleware.
   - Resolution: explicitly documented naming boundary and package namespace recommendation.

## Quick reference commands

```bash
# Validate ticket docs
docmgr doctor --ticket OS-09-JS-ENGINE-API-DESIGN --stale-after 30

# Upload bundle to reMarkable (dry-run first)
remarquee status
remarquee cloud account --non-interactive
remarquee upload bundle --dry-run \
  /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/design-doc/01-comprehensive-js-api-design-for-engine-factories-profile-registry-and-schema-first-middleware.md \
  /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/reference/01-investigation-diary.md \
  --name "OS-09 JS Engine API Design" \
  --remote-dir "/ai/2026/02/25/OS-09-JS-ENGINE-API-DESIGN" \
  --toc-depth 2

remarquee upload bundle \
  /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/design-doc/01-comprehensive-js-api-design-for-engine-factories-profile-registry-and-schema-first-middleware.md \
  /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-09-JS-ENGINE-API-DESIGN--js-engine-factory-profile-registry-and-middleware-schema-api-design/reference/01-investigation-diary.md \
  --name "OS-09 JS Engine API Design" \
  --remote-dir "/ai/2026/02/25/OS-09-JS-ENGINE-API-DESIGN" \
  --toc-depth 2

remarquee cloud ls /ai/2026/02/25/OS-09-JS-ENGINE-API-DESIGN --long --non-interactive
```
