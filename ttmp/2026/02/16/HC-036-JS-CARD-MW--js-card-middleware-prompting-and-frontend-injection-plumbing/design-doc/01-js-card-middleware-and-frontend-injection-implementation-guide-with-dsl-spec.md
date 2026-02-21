---
Title: JS Card Middleware and Frontend Injection Implementation Guide with DSL Spec
Ticket: HC-036-JS-CARD-MW
Status: active
Topics:
    - backend
    - frontend
    - dsl
    - chat
    - storybook
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_middleware.go
      Note: Prompt policy text and middleware behavior for structured hypercard tags.
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_extractors.go
      Note: YAML payload schemas and card extraction pipeline.
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: SEM and timeline projection mappings for card events.
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactRuntime.ts
      Note: Frontend parse and transformation of card payloads.
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Artifact open flow and runtime injection entrypoint.
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx
      Note: Runtime session lifecycle and QuickJS runtime ownership.
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Canonical runtime host contract (`defineStackBundle`, `defineCard`, handler context).
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.authoring.d.ts
      Note: Authoring-time type contract for bundle/card DSL.
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx
      Note: Existing storybook runtime card injection example.
ExternalSources: []
Summary: "Hard-cutover implementation guide: replace template-based card proposals with full JS runtime cards, wire live frontend injection, and remove deprecated compatibility paths."
LastUpdated: 2026-02-16T18:10:00-05:00
WhatFor: "Provide exact file-level instructions for a no-compatibility cutover to runtime JS card generation and injection."
WhenToUse: "Use when implementing the HC-036 hard cutover and removing deprecated card proposal/template pathways."
---

# JS Card Middleware and Frontend Injection Implementation Guide with DSL Spec (Hard Cutover)

## Executive Summary

This is a hard cutover plan. No migration path and no compatibility layer.

Target state:

1. Card generation output is full runtime JS card code.
2. Frontend injects generated cards into live QuickJS sessions before opening card windows.
3. Deprecated template proposal flow is removed.
4. Deprecated parser/projection branches for `hypercard.card_proposal.v1` are removed.

## Non-Goals

1. No dual-format support window.
2. No fallback mapping from `template` to static card IDs.
3. No temporary alias events for legacy consumers.
4. No keep-alive for deprecated test fixtures that validate old format.

## Problem Statement

Current card middleware emits proposal metadata (`template`, `title`, `artifact`) instead of executable card code. Frontend consumes that by mapping templates to static card IDs. Runtime mutation APIs already exist and work, but production flow does not use them.

This causes an architecture split:

1. Runtime system can define cards dynamically.
2. Chat pipeline never provides runtime card definitions as the main contract.

The cutover resolves that split by making runtime JS card definitions the only supported card output contract.

## Hard Cutover Contract

### New card payload contract

Card payloads must carry runtime card source:

1. `card.id` (string)
2. `card.code` (string, JS expression defining card)

`template` is removed from contract for runtime cards and should not be used to route to static card IDs.

### New event contract

Use a single runtime-card event type for ready-state output:

1. `hypercard.card.v2`

Remove `hypercard.card_proposal.v1` card-ready handling from backend and frontend.

### New UI behavior

Open-card behavior is now:

1. parse runtime card payload
2. inject into active sessions via runtime registry
3. persist/record patch op for future sessions
4. open card window by `card.id`

No static template mapping.

## Backend Implementation Instructions

### Files

1. `go-inventory-chat/internal/pinoweb/hypercard_middleware.go`
2. `go-inventory-chat/internal/pinoweb/hypercard_extractors.go`
3. `go-inventory-chat/internal/pinoweb/hypercard_events.go`
4. `go-inventory-chat/internal/pinoweb/hypercard_extractors_test.go`
5. `go-inventory-chat/internal/pinoweb/runtime_composer.go`

### 1) Replace prompt policy block

In `defaultArtifactPolicyInstructions()` in `hypercard_middleware.go`, remove template-based card proposal instructions and replace with runtime card instructions only.

Prompt text baseline:

```text
For card outputs, emit exactly one <hypercard:card:v2> block with YAML.

Required shape:

<hypercard:card:v2>
```yaml
id: unique item id
title: short title
artifact:
  id: artifact id
  data: {}
card:
  id: lowerCamelCase card id
  code: |-
    ({ ui }) => ({
      render({ cardState, sessionState, globalState }) {
        return ui.panel([ui.text("...")]);
      },
      handlers: {
        onAction(ctx, args) {
          ctx.dispatchSystemCommand("notify", { message: "..." });
        }
      }
    })
```
</hypercard:card:v2>

Rules:
- `card.code` must be a JS expression that returns a card object with `render`.
- Optional `handlers` must be an object.
- No import/export/require.
- No eval/Function.
- No browser globals (`window`, `document`, `fetch`, `XMLHttpRequest`).
- Must be deterministic and bounded.
```

### 2) Replace extractor schema

In `hypercard_extractors.go`:

1. Replace `inventoryCardProposalPayload` with runtime contract payload struct.
2. Add nested `card` struct fields:
- `ID string`
- `Code string`
3. Rename extractor tag type/version to match cutover tag/event naming.

Recommended struct:

```go
type inventoryRuntimeCardPayload struct {
    ID       string                   `yaml:"id" json:"id"`
    Title    string                   `yaml:"title" json:"title"`
    Artifact inventoryArtifactPayload `yaml:"artifact" json:"artifact"`
    Card     struct {
        ID   string `yaml:"id" json:"id"`
        Code string `yaml:"code" json:"code"`
    } `yaml:"card" json:"card"`
}
```

### 3) Replace validations

In card session completion path:

1. fail if `title` is empty
2. fail if `artifact.id` is empty
3. fail if `card.id` is empty
4. fail if `card.code` is empty

Emit only runtime card error/ready events in this pathway.

### 4) Replace event constants and SEM mappings

In `hypercard_events.go`:

1. remove `eventTypeHypercardCardProposalV1`
2. add `eventTypeHypercardCardV2`
3. update register factory, SEM mappings, and timeline handlers to use new event type

Set `customKind` in tool result projection to `hypercard.card.v2`.

### 5) Remove deprecated middleware checks

If generator middleware validates presence of `<hypercard:cardproposal:v1>`, change it to `<hypercard:card:v2>` only.

### 6) Backend tests (hard cutover)

In `hypercard_extractors_test.go`:

1. delete legacy v1 card proposal ready tests
2. add v2 runtime card tests:
- valid payload with multiline `card.code`
- missing `card.id` -> error
- missing `card.code` -> error
- malformed block -> error

## Frontend Injection Plumbing Instructions

### Files

1. `apps/inventory/src/features/chat/artifactsSlice.ts`
2. `apps/inventory/src/features/chat/artifactRuntime.ts`
3. `apps/inventory/src/features/chat/timelineProjection.ts`
4. `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
5. `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
6. `packages/engine/src/plugin-runtime/runtimeService.ts`
7. New: `packages/engine/src/plugin-runtime/runtimeSessionRegistry.ts`

### 1) Replace artifact state model

In `artifactsSlice.ts`, runtime cards become first-class fields.

Add:

1. `runtimeCardId?: string`
2. `runtimeCardCode?: string`
3. `injectionStatus?: 'pending' | 'injected' | 'failed'`
4. `injectionError?: string`

Remove reliance on `template` as routing key for card open behavior.

### 2) Replace parser branches

In `artifactRuntime.ts`:

1. remove `hypercard.card_proposal.v1` handling
2. add `hypercard.card.v2` handling
3. parse and validate:
- `card.id`
- `card.code`

Update projected timeline parsing from `customKind === 'hypercard.card.v2'` only.

### 3) Remove template mapping and static routing

In `artifactRuntime.ts` remove deprecated APIs:

1. `templateToCardId(...)`
2. template-driven `buildArtifactOpenWindowPayload(...)` branch logic

Replace with runtime-card-oriented payload builder:

```ts
buildRuntimeCardOpenWindowPayload({ artifactId, title, stackId, cardId })
```

### 4) Add runtime session registry in engine

Create `runtimeSessionRegistry.ts` with API like:

```ts
registerRuntimeSession({ sessionId, stackId, runtimeService })
unregisterRuntimeSession(sessionId)
injectDefineCard({ stackId, cardId, code }): InjectionResult
```

`InjectionResult` should include:

1. `appliedSessionIds: string[]`
2. `failed: Array<{ sessionId: string; error: string }>`

### 5) Register runtimes from host

In `PluginCardSessionHost.tsx`:

1. register runtime service when session becomes ready
2. unregister on cleanup

This exposes active runtimes to chat flow without passing references through window components.

### 6) Wire chat flow to inject before open

In `InventoryChatWindow.tsx` `openArtifact` flow:

1. lookup artifact runtime card fields
2. call `injectDefineCard(...)`
3. update artifact injection status
4. open window using `cardId = runtimeCardId`

No fallback to template mapping.

### 7) Persist injection patch op for future sessions

During open/inject flow, record runtime patch operation (app/local or backend endpoint depending on scope). This ensures new sessions get the generated card as well.

## Storybook and Runtime References

Existing injection examples (use as implementation references only):

1. `packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx`
2. `packages/engine/src/plugin-runtime/RuntimeMutation.stories.tsx`
3. `packages/engine/src/plugin-runtime/runtimeService.integration.test.ts`

These prove runtime API semantics; they are not production plumbing.

## DSL Spec (Canonical for HC-036)

There is no single pre-existing canonical runtime DSL spec doc for this exact pathway. For HC-036 hard cutover, this section is the operating spec.

### 1. Stack entrypoint

```js
defineStackBundle(({ ui }) => ({
  id: "inventory",
  title: "Shop Inventory",
  cards: {
    home: {
      render({ cardState, sessionState, globalState }) {
        return ui.panel([ui.text("Home")]);
      },
      handlers: {}
    }
  }
}));
```

### 2. Runtime card definition for `defineCard`

Accepted `card.code` forms:

1. factory form:
```js
({ ui }) => ({
  render({ cardState, sessionState, globalState }) {
    return ui.panel([ui.text("Runtime card")]);
  },
  handlers: {
    back(ctx) {
      ctx.dispatchSystemCommand("nav.back");
    }
  }
})
```

2. object form:
```js
({
  render({ cardState, sessionState, globalState }) {
    return { kind: "panel", children: [{ kind: "text", text: "Runtime card" }] };
  },
  handlers: {}
})
```

### 3. Handler context

Handler `ctx` supports:

1. `dispatchCardAction(actionType, payload)`
2. `dispatchSessionAction(actionType, payload)`
3. `dispatchDomainAction(domain, actionType, payload)`
4. `dispatchSystemCommand(command, payload)`
5. read access to `cardState`, `sessionState`, `globalState`

### 4. UI helpers available in runtime

From `stack-bootstrap.vm.js`:

1. `ui.text(content)`
2. `ui.button(label, props)`
3. `ui.input(value, props)`
4. `ui.row(children)`
5. `ui.column(children)`
6. `ui.panel(children)`
7. `ui.badge(text)`
8. `ui.table(rows, { headers })`

### 5. Intent semantics

1. System commands:
- `nav.go` with `{ cardId, param? }`
- `nav.back`
- `notify`
- `window.close`

2. Card/session state actions:
- `patch`
- `set`
- `reset`

3. Domain actions:
- dispatched as `${domain}/${actionType}` after capability checks.

### 6. Safety policy for generated code

1. No module imports/exports/requires.
2. No dynamic eval.
3. No browser/global APIs.
4. Deterministic and bounded logic.
5. Must provide `render` function.

### 7. Runtime card envelope example

````text
<hypercard:card:v2>
```yaml
id: card-001
title: Low Stock Drilldown
artifact:
  id: low-stock-drilldown
  data:
    threshold: 3
card:
  id: lowStockDrilldown
  code: |-
    ({ ui }) => ({
      render({ globalState }) {
        const items = (globalState?.domains?.inventory?.items ?? []).filter(
          (item) => Number(item?.qty ?? 0) <= 3
        );
        return ui.panel([
          ui.text("Low Stock Drilldown"),
          ui.table(
            items.map((item) => [String(item?.sku ?? ""), String(item?.name ?? ""), String(item?.qty ?? 0)]),
            { headers: ["SKU", "Name", "Qty"] }
          ),
          ui.button("Back", { onClick: { handler: "back" } })
        ]);
      },
      handlers: {
        back(ctx) {
          ctx.dispatchSystemCommand("nav.back");
        }
      }
    })
```
</hypercard:card:v2>
````

## Deprecated Surfaces to Remove

### Backend removals

1. `hypercard.card_proposal.v1` constants, factories, SEM mappings.
2. Prompt instructions referencing `template: reportViewer|itemViewer`.
3. Card extractor payload fields used only for template routing.

### Frontend removals

1. `templateToCardId(...)`.
2. Template-based card open payload construction.
3. `hypercard.card_proposal.v1` parser branch.
4. Timeline formatting branch keyed on `hypercard.card_proposal.v1`.

### Test removals

1. Legacy card proposal v1 fixtures.
2. Tests that assert template mapping behavior.

## Hard Cutover Implementation Plan

### Phase 1: Contract switch

1. Replace middleware prompt and extractor structs.
2. Replace event types to `hypercard.card.v2`.
3. Replace backend tests.

### Phase 2: Frontend parser switch

1. Replace parser/projection to v2 runtime card payload.
2. Remove template mapping helpers and tests.

### Phase 3: Injection plumbing

1. Add runtime session registry.
2. Register/unregister from `PluginCardSessionHost`.
3. Inject-before-open in chat flow.
4. Mark injection status in artifact state.

### Phase 4: Cleanup pass

1. Delete deprecated code paths and unused types.
2. Delete dead tests and stale fixtures.
3. Run full test suite and smoke storybook flows.

## Acceptance Criteria

1. Chat card output uses runtime card v2 envelope only.
2. Opening a generated artifact injects card code and opens that card ID.
3. Existing active sessions can navigate to injected card without restart.
4. No template mapping functions remain in inventory chat runtime flow.
5. No `hypercard.card_proposal.v1` card-ready handling remains.

## References

1. `go-inventory-chat/internal/pinoweb/hypercard_middleware.go`
2. `go-inventory-chat/internal/pinoweb/hypercard_extractors.go`
3. `go-inventory-chat/internal/pinoweb/hypercard_events.go`
4. `apps/inventory/src/features/chat/artifactRuntime.ts`
5. `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
6. `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
7. `packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx`
8. `packages/engine/src/plugin-runtime/RuntimeMutation.stories.tsx`
9. `packages/engine/src/plugin-runtime/stack-bootstrap.vm.js`
10. `apps/inventory/src/domain/pluginBundle.authoring.d.ts`
