---
Title: 'Research and Design: Minimal JS API for LLM-Generated Interactive Cards'
Ticket: HC-009-LLM-CARD-AUTHORING-API
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/CardRenderer.tsx
      Note: Engine requires external renderer registration per card type, key driver of authoring overhead
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/dispatchDSLAction.ts
      Note: Current action dispatch split point between engine and domain handlers
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/overrides/ListCardOverride.tsx
      Note: Inventory list adapter illustrating current card wiring verbosity
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/overrides/ListCardOverride.tsx
      Note: Todo list adapter showing cross-app duplication pattern
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/app/domainActionHandler.ts
      Note: Domain action switch pattern that LLM currently must reproduce
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/app/domainActionHandler.ts
      Note: Second independent domain action switch with same structural shape
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: Current declarative card definitions used by inventory app
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/domain/stack.ts
      Note: Current declarative card definitions used by todo app
Summary: "Deep analysis of how to let an LLM author full interactive cards with minimal JavaScript, plus proposed custom card authoring API and implementation roadmap."
LastUpdated: 2026-02-12T15:40:00-05:00
WhatFor: "Define a practical path to reduce card authoring code footprint and make LLM-generated card implementation reliable."
WhenToUse: "Use when designing or implementing concise LLM-authored card definitions and domain wiring in HyperCard React."
---

# Research and Design: Minimal JS API for LLM-Generated Interactive Cards

## 1. Problem Statement

The colleague implementation is complete and functional. The system is modular, reusable, and supports multiple apps (`inventory`, `todo`) on top of a shared engine. The next problem is not "can we build cards?" It is "can an LLM add a full interactive card with very little JavaScript, reliably, without touching many files or reimplementing glue code?"

The user request for this ticket is therefore a design/research problem:

- Study the current implementation deeply.
- Identify where card authoring currently requires repetitive handwritten adapters.
- Determine whether a custom JS API is needed for concise LLM generation.
- Propose a concrete, implementation-ready API and architecture.

This document answers that in depth.

## 2. Executive Summary

Short answer: yes, a custom authoring API is warranted.

Current architecture is robust but has a high "glue tax" for adding interactive cards. Even with reusable widgets, each domain app still writes repetitive per-card-type adapters, action switches, and selector plumbing. This is acceptable for hand-coded teams; it is suboptimal for LLM-driven authoring where consistency and low token complexity matter.

The recommended direction is to add a new layer: a **Card Authoring API** (working name: `CardKit`). It should let developers (or LLMs) define a card in a compact declarative JS object with explicit selectors, action intents, and UI semantics, then compile/bind that definition to existing engine widgets and dispatch.

Key outcomes of this proposal:

- LLM can add a full card mostly in one file.
- Repetitive adapters move to framework internals.
- Domain actions/selectors become registered capabilities, not ad hoc switches.
- Existing engine/widgets are reused, not replaced.

## 3. Current Implementation: What Exists and What It Costs

### 3.1 Engine/App split is present and works

Engine exposes generic shell, widgets, DSL types, and navigation/notification slices.

Evidence:
- `packages/engine/src/index.ts`
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/components/widgets/*`

Domain apps supply:
- `STACK` definition
- domain slices
- domain action handlers
- card renderers

Evidence:
- `apps/inventory/src/App.tsx:16`
- `apps/todo/src/App.tsx:12`

### 3.2 Engine does not provide built-in card type renderers

`CardRenderer` currently only checks `customRenderers` and otherwise renders a fallback message.

Evidence:
- `packages/engine/src/components/shell/CardRenderer.tsx:31`

This means every app must implement renderers for each card type it uses.

### 3.3 Action dispatch is split but loose

Engine dispatcher handles only `navigate/back/toast`, then delegates all other actions to domain handler.

Evidence:
- `packages/engine/src/app/dispatchDSLAction.ts:18`
- `packages/engine/src/app/dispatchDSLAction.ts:29`

This is a valid extension pattern, but authoring requires each app to maintain its own action switch manually.

### 3.4 Practical overhead in app code is substantial

Line count snapshot for domain-side glue:

- overrides + domain action handler across inventory and todo: **633 lines**
- domain stacks across two apps: **296 lines**
- domain slices across two apps: **139 lines**

For an LLM task like "add one interactive card," the model must reason across multiple files with implicit conventions, not just one card definition.

### 3.5 Duplication is real, especially in renderer adapters

`ListCardOverride` in inventory and todo are structurally very similar; only columns/search fields differ.

Evidence:
- `apps/inventory/src/overrides/ListCardOverride.tsx:9`
- `apps/todo/src/overrides/ListCardOverride.tsx:7`

Same pattern appears in menu/detail/form overrides and domain action handlers.

### 3.6 Authoring currently depends on unsafe/unstructured casts

The existing path frequently uses `as any`, `as unknown as`, and untyped record casting in app adapters.

Evidence:
- `apps/inventory/src/overrides/ListCardOverride.tsx:46`
- `apps/todo/src/overrides/FormCardOverride.tsx:31`
- `packages/engine/src/app/dispatchDSLAction.ts:20`

This makes LLM output less reliable because there are fewer type-level guardrails in the authoring workflow.

## 4. What "Full Interactive Card" Means in This System

For this analysis, a card is "full interactive" if it includes all of the following:

1. Binds to domain data via selectors or table source.
2. Supports user interactions (filters, row click, form submit, button actions, or chat actions).
3. Dispatches domain actions and generic actions.
4. Reads settings/state context where needed.
5. Renders with existing theme/parts contracts.

Under current architecture, implementing this often spans:

- stack card entry
- one renderer override function
- domain action handler additions
- sometimes slice/reducer changes
- possibly column config/compute helper updates
- optional nav shortcut update

This is not minimal from an LLM authoring perspective.

## 5. LLM Authoring Pain Points (Root-Cause View)

### 5.1 Too many moving files for one intent

The model has to synchronize a card definition with renderer behavior and action handling across multiple files. Small inconsistencies cause runtime no-op behavior or wrong payloads.

### 5.2 Semantic mapping is repeated per app

Each app re-implements "map DSL list card to ListView props" with local choices. LLM must learn app-specific mapping every time.

### 5.3 Action payload conventions are implicit

Examples:

- row action needs `paramValue` derived from `param` key
- detail actions inject `id` or `sku` + `edits`
- form actions wrap values under `values`

These conventions are not centralized in a stable authoring abstraction.

### 5.4 Selector binding is manual in app root

Domain data is pulled manually via `useSelector` and passed as `domainData` into shell.

Evidence:
- `apps/inventory/src/App.tsx:12`
- `apps/todo/src/App.tsx:9`

An LLM adding a card that depends on new domain tables/selectors often needs to edit app root, not just card code.

### 5.5 Boilerplate is high relative to business intent

A product intent like "add a Restock Planner card" should mostly be about columns, filters, and actions. Current path includes substantial structural scaffolding around that intent.

## 6. Should We Build a Custom JS API?

Decision: **Yes**.

Rationale:

- Existing architecture is already modular enough to host one more abstraction layer.
- Repeated mapping code is stable and codifiable.
- LLM generation quality improves when target API surface is constrained and declarative.
- We can preserve escape hatches for advanced custom behavior.

Non-rationale:

- Not because engine is broken. It is not.
- Not to remove React/Redux power users.
- Not to eliminate domain logic.

Goal is to make common card authoring concise, consistent, and machine-generatable.

## 7. Proposed Solution: Card Authoring API (CardKit)

### 7.1 Design goals

1. Minimal authoring footprint.
2. Explicit action and selector contracts.
3. Declarative by default, imperative escape hatch optional.
4. Works with current widgets/shell/state.
5. LLM-friendly JSON/JS shape with low ambiguity.

### 7.2 Core concept

Introduce a new API package surface (inside engine or companion package):

- `createCardKit(registry)`
- `defineCard(...)` helpers by card type
- action helpers (`act.navigate`, `act.domain`, `act.toast`)
- selector helpers (`sel.table`, `sel.fromSlice`, `sel.setting`)
- adapter compiler that turns concise specs into renderer functions + dispatch payload handling

### 7.3 API layers

#### Layer A: Declarative card specs

```ts
const restockCard = card.list('restockPlanner', {
  title: 'Restock Planner',
  icon: 'R',
  source: sel.table('items'),
  columns: [
    col.text('sku', { width: 70 }),
    col.number('qty', { width: 50, state: qtyState(sel.setting('lowStockThreshold')) }),
    col.money('price', { width: 80 }),
    col.text('name', { width: '1fr' }),
  ],
  filters: [
    filter.select('category', ['All', 'Accessories', 'Kitchen', 'Home', 'Merch']),
    filter.search(['name', 'sku']),
  ],
  row: row.open('itemDetail', 'sku'),
  toolbar: [
    button.action('Receive +5', act.domain('updateQty', ({ row }) => ({ sku: row.sku, delta: 5 }))),
    button.action('New Item', act.navigate('newItem')),
  ],
  empty: 'No items need restocking',
});
```

#### Layer B: Action registry

```ts
const domainActions = defineDomainActions({
  updateQty: {
    reducer: inventorySlice.actions.updateQty,
    toast: ({ delta, sku }) => `${delta > 0 ? '+' : ''}${delta} qty for ${sku}`,
  },
  createItem: {
    reducer: inventorySlice.actions.createItem,
    toast: ({ sku }) => `Created ${sku}`,
  },
});
```

#### Layer C: Selector registry

```ts
const selectors = defineSelectors({
  items: (s: RootState) => s.inventory.items,
  salesLog: (s: RootState) => s.sales.log,
  lowStockThreshold: (ctx) => Number(ctx.settings.lowStockThreshold ?? 3),
});
```

### 7.4 Runtime binding output

The runtime compiler returns:

- `renderers` map for `CardRenderer`
- domain action handler function for `dispatchDSLAction` delegation
- optional `domainDataBindings` map for automatic selector hydration

This means app root can shrink to a single `buildCardRuntime` integration instead of hand wiring each piece.

## 8. Proposed API Surface (Detailed)

### 8.1 Primary builder

```ts
interface CardKit {
  card: {
    menu(id: string, spec: MenuSpec): CardSpec;
    list(id: string, spec: ListSpec): CardSpec;
    detail(id: string, spec: DetailSpec): CardSpec;
    form(id: string, spec: FormSpec): CardSpec;
    report(id: string, spec: ReportSpec): CardSpec;
    chat(id: string, spec: ChatSpec): CardSpec;
  };
  compile(specs: CardSpec[]): CompiledCardRuntime;
}
```

### 8.2 Action helpers

```ts
act.navigate(cardId: string, param?: ValueRef): ActionExpr;
act.toast(message: string | MessageFn): ActionExpr;
act.domain(name: string, payload: PayloadFn | object): ActionExpr;
act.aiSend(text: string | ValueRef): ActionExpr;
```

### 8.3 Selector/value references

```ts
sel.table(name: string): TableRef;
sel.setting(name: string): SettingRef;
sel.field(name: string): FieldRef;
sel.const<T>(value: T): ConstRef<T>;
```

### 8.4 Column helpers

```ts
col.text(key: string, options?: ColOpts): ColumnSpec;
col.number(key: string, options?: ColOpts): ColumnSpec;
col.money(key: string, options?: ColOpts): ColumnSpec;
col.custom(key: string, renderer: CellRenderer, options?: ColOpts): ColumnSpec;
```

### 8.5 Hooks and escape hatches

Support controlled imperative customization when declarative helpers are insufficient:

```ts
hooks.beforeSubmit((ctx) => ...)
hooks.afterAction((ctx) => ...)
hooks.transformRows((rows, ctx) => ...)
```

LLM usage guidance should mark these as advanced.

## 9. What Becomes Minimal for LLM

### 9.1 Current likely output shape (today)

To add a new interactive list card with custom action, an LLM may need to touch:

- `domain/stack.ts`
- `overrides/ListCardOverride.tsx`
- `app/domainActionHandler.ts`
- `features/*Slice.ts` (if new action)
- optional `domain/columnConfigs.ts`
- optional app-level selector/data wiring

### 9.2 Target output shape (with CardKit)

For same feature, expected primary change:

- one card spec file or one stack extension file
- maybe one domain action registration entry

Optional advanced changes only if card introduces brand new reducer logic.

### 9.3 LLM-friendly contract

Define a strict "authorable surface":

- card specs
- action registrations
- selector registrations

Everything else generated by runtime compiler.

## 10. Integration with Existing Engine (No Rewrite Required)

### 10.1 Reuse existing widgets and shell

CardKit should produce renderer functions that call existing `ListView`, `DetailView`, `FormView`, etc. No need to rewrite widget internals.

### 10.2 Keep `HyperCardShell`

`HyperCardShell` remains central orchestration point. We add optional props for compiled runtime artifacts:

```ts
<HyperCardShell
  stack={stack}
  compiledRuntime={compiled}
/>
```

Or preserve existing props and feed compiled pieces into them.

### 10.3 Preserve backwards compatibility for manual renderers

Manual `customRenderers` should still work, but card specs should be preferred for new work.

## 11. Selector and State Binding Strategy

A critical part of "minimal code" is removing manual `domainData` plumbing in app root where feasible.

### 11.1 Current approach

App root selects data manually and passes `domainData` object.

Evidence:
- `apps/inventory/src/App.tsx:20`
- `apps/todo/src/App.tsx:16`

### 11.2 Proposed approach

Card runtime compiler declares data dependencies, e.g. tables/slices needed by active cards. A `useDomainDataBindings` hook resolves these via registered selectors.

Result:

- app root no longer edits per card addition in common cases.
- selectors remain testable and explicit.

### 11.3 Explicit selector registry

Require selectors to be named and centrally registered so LLM references stable tokens rather than raw state paths.

## 12. Action Binding Strategy

### 12.1 Current approach

`domainActionHandler` switch in each app converts dynamic action payloads to typed reducer calls.

Evidence:
- `apps/inventory/src/app/domainActionHandler.ts:5`
- `apps/todo/src/app/domainActionHandler.ts:5`

### 12.2 Proposed approach

Replace handwritten switch with map-based action registry generated from declarative definitions.

Benefits:

- less repetitive code
- easier for LLM to extend safely
- stronger validation opportunities

### 12.3 Toast policy in action definitions

Instead of manually calling `showToast` in switches, allow action registration to include toast formatter.

## 13. Card Type Coverage Plan

### 13.1 Phase-1 supported card types

Prioritize high-value card forms:

- `list`
- `detail`
- `form`

These cover most CRUD workflows and most current duplication.

### 13.2 Phase-2 support

- `menu`
- `report`

### 13.3 Phase-3 support

- `chat`

Chat is more open-ended and should remain partially manual initially (aligned with current product expectations).

## 14. LLM Generation Workflow

### 14.1 Two-stage generation

Stage 1: LLM produces constrained card JSON/spec object.

Stage 2: local compiler validates and emits runtime artifacts (or scaffold patches).

This is preferable to direct freeform TSX generation because it reduces error surface.

### 14.2 Validation contracts

Before accepting generated card spec:

- schema validation for card spec shape
- reference validation (`source`, selectors, action names)
- action payload shape checks against registry declarations

### 14.3 Deterministic auto-fix loop

If validation fails, produce machine-readable errors and feed back into prompt for one or two repair iterations.

### 14.4 Suggested prompt skeleton

```
You are generating a CardKit list card spec.
Rules:
1) Use only registered selectors/actions listed below.
2) Do not emit React components.
3) Output valid JSON object only.
...
```

### 14.5 Why this helps

LLM is better at filling constrained templates than reproducing multi-file architecture conventions from memory.

## 15. Detailed Example: Add an Interactive "Reorder Queue" Card

### 15.1 Desired behavior

- show only low-stock items
- allow receiving +5 directly from row
- allow opening item detail
- show current threshold in subtitle

### 15.2 Current implementation footprint (today)

Likely edits:

1. card entry in `stack.ts`
2. list renderer logic branch or column helper update
3. action handling in domain switch if new action semantics
4. maybe detail/list filters and formatting updates
5. optional story updates

### 15.3 Proposed CardKit spec (target)

```ts
export const reorderQueue = card.list('reorderQueue', {
  title: 'Reorder Queue',
  icon: 'R',
  source: sel.table('items'),
  preFilter: where.lte('qty', sel.setting('lowStockThreshold')),
  columns: [
    col.text('sku', { width: 70 }),
    col.number('qty', { width: 45, state: qtyState(sel.setting('lowStockThreshold')) }),
    col.money('price', { width: 70 }),
    col.text('name', { width: '1fr' }),
  ],
  row: row.open('itemDetail', 'sku'),
  toolbar: [button.action('Receive +5', act.domain('updateQty', ({ row }) => ({ sku: row.sku, delta: 5 })))],
  empty: 'No items need reorder',
});
```

This is concise, expressive, and directly LLM-authorable.

## 16. Implementation Roadmap

### Phase 0: Spec and constraints

Deliverables:

- CardKit spec schema
- selector/action registry interfaces
- LLM authoring contract document

### Phase 1: List/Form/Detail compiler

Deliverables:

- compile specs to renderer map
- compile domain action registrations
- compile domain data binding requirements

### Phase 2: Integration in one app (pilot)

Use `apps/todo` as pilot because it has smaller domain surface.

Deliverables:

- at least 2 cards authored with CardKit
- reduced override code footprint documented

### Phase 3: Inventory adoption

Deliverables:

- migrate selected inventory cards to CardKit specs
- retain manual chat/report where needed

### Phase 4: LLM generation loop

Deliverables:

- generation prompt templates
- validation-and-repair CLI command
- acceptance tests using generated specs

## 17. Success Metrics

Define concrete success measures so this does not stay conceptual.

1. Authoring footprint reduction
- target: at least 50 percent fewer lines touched to add a typical interactive list/form/detail card.

2. File-touch reduction
- target: add/modify card in <=2 files for common cases.

3. LLM reliability
- target: >=80 percent first-pass compile success for generated card specs in controlled prompts.

4. Runtime correctness
- target: generated cards produce expected actions and navigation without manual adapter edits.

## 18. Tradeoffs and Risks

### 18.1 New abstraction layer complexity

Risk:
- CardKit may hide too much and become hard to debug.

Mitigation:
- emit debuggable compiled artifacts
- provide `explainCompilation(spec)` diagnostics

### 18.2 Over-constraining advanced cards

Risk:
- power users may need behavior outside CardKit primitives.

Mitigation:
- keep manual renderer escape hatch
- allow advanced hooks per card

### 18.3 Registry drift

Risk:
- selector/action names diverge from actual reducers/selectors.

Mitigation:
- compile-time registry validation and typed helpers

### 18.4 Partial adoption confusion

Risk:
- mixed manual and generated patterns cause team inconsistency.

Mitigation:
- define policy: new CRUD cards default to CardKit; manual path only by exception.

## 19. Recommended Decision

Adopt CardKit in this order:

1. Build minimal CardKit for `list`, `detail`, `form` only.
2. Pilot in `apps/todo` to prove reduced authoring effort.
3. Add LLM generation schema and validator.
4. Expand to `menu` and `report`.
5. Keep `chat` flexible/manual until later.

This provides immediate value without large rewrites.

## 20. Concrete Next Steps

1. Create ticket `HC-010-CARDKIT-SPEC` for API/schema definition.
2. Create ticket `HC-011-CARDKIT-COMPILER-LIST-DETAIL-FORM` for runtime compiler MVP.
3. Create ticket `HC-012-CARDKIT-TODO-PILOT` for migration pilot.
4. Create ticket `HC-013-LLM-CARD-GENERATION-VALIDATOR` for generation pipeline.
5. Create ticket `HC-014-CARDKIT-INVENTORY-ADOPTION` for selected card migration.

## 21. Final Conclusion

The colleague implementation validates the architecture. It also reveals where authoring cost still lives: adapter glue, action switches, and selector plumbing.

If the goal is "LLM adds a full interactive card with minimal JS," the system needs one more abstraction: a concise card authoring API with action/selector registries and compilation to runtime adapters.

That is not speculative at this point. The duplication patterns across `inventory` and `todo` make it concrete, measurable, and implementable.

CardKit (or equivalent) is the right next move.

## Appendix A: Current Authoring Workflow Decomposed (Today)

This appendix explicitly lists what a developer (or LLM) must do today to add a new interactive card with non-trivial behavior.

### A.1 Add card declaration

Edit app stack file:

- `apps/inventory/src/domain/stack.ts`
- or `apps/todo/src/domain/stack.ts`

Add card metadata:

- `type`, `title`, `icon`
- `dataSource`, `columns`, `filters`, `rowAction`, `toolbar`, etc.

### A.2 Ensure renderer path supports card semantics

If semantics differ from existing adapter assumptions, edit one or more override files:

- `ListCardOverride.tsx`
- `DetailCardOverride.tsx`
- `FormCardOverride.tsx`
- `ReportCardOverride.tsx`
- `ChatCardOverride.tsx`

### A.3 Ensure renderer registration map covers type

Edit:

- `overrides/cardRenderers.ts`

### A.4 Ensure domain actions are handled

If card emits domain action types, update:

- `app/domainActionHandler.ts`

Add switch case, payload mapping, toasts.

### A.5 Ensure reducers exist for new actions

If new action semantics are introduced, update:

- domain slice reducer file(s)

### A.6 Ensure data sources/selectors are available

If card depends on new tables/slices, update:

- selectors
- app root `domainData` injection

### A.7 Optional but practical updates

- nav shortcuts in app root
- storybook pages
- domain column helpers

Conclusion of A:

Today, adding one interactive card can be an N-file operation with convention-sensitive glue in each file.

## Appendix B: Option Matrix for Solving Minimal-LM Card Authoring

### Option 1: Keep current architecture, improve prompts/templates only

Description:

- no runtime API changes
- provide LLM with rich templates and checklists

Pros:

- lowest implementation cost
- no runtime refactor risk

Cons:

- still multi-file edits
- still high risk of omission
- does not reduce core glue complexity

Verdict:
- useful as stopgap, insufficient as long-term strategy

### Option 2: Generate raw TSX adapters automatically from stack metadata

Description:

- add codegen that writes override files from stack entries

Pros:

- can reduce repetitive code

Cons:

- generated code still mirrors existing complexity
- debugging generated TSX can be noisy
- generation drift across apps likely

Verdict:
- better than templates, but still adapter-centric rather than authoring-centric

### Option 3 (Recommended): Introduce CardKit declarative authoring API and compile adapters internally

Description:

- declarative card specs + action/selector registries
- compile to runtime adapter functions

Pros:

- strong fit for LLM generation
- small authoring surface
- avoids repeated adapter hand-coding
- keeps engine widgets/shell investments

Cons:

- requires framework feature work
- requires disciplined schema and docs

Verdict:
- best balance of maintainability, LLM reliability, and implementation value

## Appendix C: Draft Schema for LLM-Generated Card Specs

A JSON schema-friendly shape (abridged):

```json
{
  "id": "reorderQueue",
  "kind": "list",
  "title": "Reorder Queue",
  "icon": "R",
  "source": { "table": "items" },
  "preFilter": {
    "op": "<=",
    "field": "qty",
    "value": { "setting": "lowStockThreshold" }
  },
  "columns": [
    { "kind": "text", "key": "sku", "width": 70 },
    { "kind": "number", "key": "qty", "width": 45, "state": { "fn": "qtyState", "args": [{ "setting": "lowStockThreshold" }] } },
    { "kind": "money", "key": "price", "width": 70 },
    { "kind": "text", "key": "name", "width": "1fr" }
  ],
  "filters": [
    { "kind": "select", "field": "category", "options": ["All", "Accessories", "Kitchen", "Home", "Merch"] },
    { "kind": "search", "fields": ["name", "sku"], "placeholder": "Search..." }
  ],
  "row": { "openCard": "itemDetail", "paramField": "sku" },
  "toolbar": [
    {
      "label": "Receive +5",
      "action": {
        "kind": "domain",
        "name": "updateQty",
        "payload": {
          "sku": { "row": "sku" },
          "delta": 5
        }
      }
    }
  ]
}
```

Schema benefits:

- deterministic structure for LLM output
- validator-friendly
- decouples generated content from React implementation details

## Appendix D: Compiler Internals (Conceptual)

### D.1 Inputs

- `CardSpec[]`
- `DomainActionRegistry`
- `SelectorRegistry`
- `Formatting/Behavior helper registry`

### D.2 Outputs

- `customRenderers` map
- `domainActionHandler`
- optional `requiredDataSelectors`
- diagnostic map for each card

### D.3 Compilation stages

1. Structural validation
- required fields by card kind
- unknown key detection

2. Semantic validation
- selector existence
- action existence
- payload expression resolution references

3. Lowering stage
- convert card spec into widget props factory
- generate row/submit callbacks

4. Action binding stage
- map `act.domain(name, payloadExpr)` to dispatcher call

5. Diagnostics stage
- compile warnings (unused filters, unsupported variants)

### D.4 Error format (LLM-repair friendly)

```json
{
  "cardId": "reorderQueue",
  "errors": [
    {
      "code": "UNKNOWN_ACTION",
      "path": "toolbar[0].action.name",
      "message": "Action 'updateStock' is not registered. Did you mean 'updateQty'?"
    }
  ]
}
```

This allows an automated fix loop with predictable messages.

## Appendix E: Minimal Runtime API Sketch

### E.1 High-level usage

```ts
const runtime = createCardRuntime({
  selectors,
  actions,
  helpers,
  cards: [
    cards.reorderQueue,
    cards.newItem,
    cards.itemDetail,
  ],
});

<HyperCardShell
  stack={runtime.stack}
  customRenderers={runtime.renderers}
  domainActionHandler={runtime.actionHandler}
  domainData={runtime.useDomainData()}
/>
```

### E.2 What this removes

- no manual per-type override files for common patterns
- no manual switch for every action in most cases
- less app-root selector plumbing

### E.3 Escape hatch remains

```ts
cards.custom('advancedCanvas', {
  render: (ctx) => <MyCustomCard ctx={ctx} />,
});
```

## Appendix F: Testing Strategy for CardKit

### F.1 Unit tests

- card spec validation
- payload expression resolver
- action binding mapping
- selector binding mapping

### F.2 Snapshot tests

- compiled renderer props for representative cards

### F.3 Integration tests

- render compiled list/detail/form cards and assert action dispatch calls

### F.4 Golden tests for LLM outputs

Maintain fixtures:

- valid generated specs
- invalid generated specs with expected diagnostics

### F.5 Regression tests across apps

- ensure existing manual overrides still operate when CardKit is introduced

## Appendix G: Prompt and Tooling Recommendations

### G.1 Prompt strategy

Use a strict scaffold prompt with:

- allowed card kinds
- allowed selectors/actions
- required JSON schema
- explicit ban on freeform React code

### G.2 Tooling

Add CLI commands:

- `cardkit validate spec.json`
- `cardkit compile spec.json --emit runtime`
- `cardkit explain spec.json`

### G.3 Editor integration

- JSON schema auto-complete
- quick fixes for unknown action/selector names

## Appendix H: Migration Approach for Adoption (Non-runtime Migration)

This is not runtime backward compatibility migration. It is an authoring migration path.

1. Keep current manual overrides intact.
2. Introduce CardKit as opt-in for new cards.
3. Migrate one card per app to prove confidence.
4. Prefer CardKit for all new CRUD cards after pilot success.

This allows gradual adoption without destabilizing shipped behavior.

## Appendix I: Practical Acceptance Checklist for This Ticket

A follow-up implementation ticket should be considered successful when:

- A developer can add a new interactive list card in <=2 files using CardKit.
- LLM can generate a valid card spec that compiles without manual edits for at least three sample prompts.
- Domain action and selector registration are explicit and discoverable.
- The generated card is rendered by existing engine shell and widgets without custom TSX adapter code.

