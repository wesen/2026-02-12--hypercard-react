# HyperCard JS API User Guide and Reference

## 1. Purpose and Scope

This document is a complete guide and API reference for using the HyperCard JavaScript/TypeScript API exposed by `@hypercard/engine` in this repository.

It is written for engineers who want to:

1. build a new HyperCard app (stack + renderers + state wiring)
2. extend an existing app safely
3. understand runtime behavior end-to-end
4. reference API contracts quickly without reading all engine source files

This guide covers:

- DSL model (`Stack`, card definitions, actions, filters)
- runtime shell (`HyperCardShell`, `CardRenderer`, navigation/toasts)
- domain integration APIs (action registry + selector registry)
- practical integration patterns from `apps/todo` and `apps/inventory`
- exhaustive API reference tables and examples

This guide does not assume backend APIs. It focuses on current client-side architecture.

## 2. Architecture in One Screen

HyperCard runtime has four layers:

1. **DSL layer**
- declarative app structure (`stack`, cards, actions, data tables, settings)

2. **Shell layer**
- navigation stack, layout, toast handling, current card resolution (`HyperCardShell`)

3. **Renderer layer (app-owned)**
- card type renderers (`menu`, `list`, `detail`, `form`, `report`, `chat`) that map DSL definitions to React widgets

4. **Domain layer (app-owned)**
- Redux slices/selectors
- domain action handling and domain data binding

Important current behavior:

- Engine does **not** include built-in card type renderers.
- `CardRenderer` delegates to app `customRenderers` map.
- Built-in DSL actions are only: `navigate`, `back`, `toast`.
- Any other action type is domain-specific and must be handled by your domain action pipeline.

## 2.1 Core Concepts (Must Know)

These concepts are the minimum mental model for building working cards.

1. `Stack.data` is a table map.
- Example: `data: { tasks: [...], salesLog: [...] }`

2. `domainData` is merged into `stack.data` inside shell.
- Current merge is shallow object spread:
`{ ...stack.data, ...domainData }`
- If both contain the same key, `domainData` wins.

3. `dataSource` on cards points to a table key in merged data.
- If a card says `dataSource: 'tasks'`, renderer reads `ctx.data['tasks']`.

4. `DSLField.id` is the binding key.
- In detail cards, it maps field UI to record property key.
- In form cards, it becomes the key inside submitted `values`.

5. list-to-detail navigation depends on `rowAction.param -> paramValue`.
- `rowAction.param` tells renderer which row field to forward.
- renderer dispatches `navigate` with `paramValue`.
- detail renderer reads `ctx.paramValue` and matches by `keyField`.

6. detail/form button actions are usually enriched before dispatch.
- Renderers often append context (`id`, `sku`, `edits`, `values`) so domain handlers can act on a specific record.

## 3. Installation and Imports

From this monorepo, apps use the workspace package directly:

```ts
import {
  HyperCardShell,
  dispatchDSLAction,
  defineActionRegistry,
  createDomainActionHandler,
  defineSelectorRegistry,
  selectDomainData,
  navigationReducer,
  notificationsReducer,
} from '@hypercard/engine';
```

Optional theme CSS imports (from engine comment header):

```ts
import '@hypercard/engine/src/theme/base.css';
import '@hypercard/engine/src/theme/modern.css';
```

## 4. Quickstart: Minimal App Skeleton

### 4.1 Define a Stack

Create `domain/stack.ts`:

```ts
import type { Stack } from '@hypercard/engine';

export const STACK: Stack = {
  name: 'Sample',
  icon: '[compass]',
  homeCard: 'home',
  settings: {},
  data: {
    items: [{ id: '1', name: 'First' }],
  },
  cards: {
    home: {
      type: 'menu',
      title: 'Home',
      icon: '[home]',
      buttons: [
        { label: 'Browse', action: { type: 'navigate', card: 'browse' } },
      ],
    },
    browse: {
      type: 'list',
      title: 'Browse',
      icon: '[list]',
      dataSource: 'items',
      columns: ['id', 'name'],
    },
  },
};
```

### 4.2 Provide Renderers

Create a renderer map (required):

```ts
import type { CardTypeRenderer } from '@hypercard/engine';
import { renderMenuCard } from './MenuCardOverride';
import { renderListCard } from './ListCardOverride';

export const renderers: Record<string, CardTypeRenderer> = {
  menu: renderMenuCard,
  list: renderListCard,
};
```

If a card type is missing, shell fallback renders a warning card:

- `Card type "<type>" - no renderer registered`

### 4.3 Configure Store

```ts
import { configureStore } from '@reduxjs/toolkit';
import { navigationReducer, notificationsReducer } from '@hypercard/engine';

export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    notifications: notificationsReducer,
    // plus domain reducers
  },
});
```

### 4.4 Mount HyperCardShell

```tsx
<HyperCardShell
  stack={STACK}
  customRenderers={renderers}
  domainActionHandler={myDomainActionHandler}
  domainData={myDomainData}
/>
```

That is the minimum functional shape.

### 4.5 Complete Build Walkthrough (From Scratch)

Use this sequence for a clean app bootstrap:

1. Define domain types and seed tables in `domain/stack.ts`.
2. Add Redux slices/selectors for mutable domain data.
3. Build `app/domainActionHandler.ts` with action registry entries for every domain action type used in cards.
4. Build `app/domainDataRegistry.ts` with selector registry keys matching card `dataSource` names.
5. Implement per-card renderers in `overrides/*CardOverride.tsx`.
6. Register renderers in `overrides/cardRenderers.ts`.
7. Configure store with `navigationReducer`, `notificationsReducer`, and domain reducers.
8. Mount `HyperCardShell` in `App.tsx` with `stack`, `customRenderers`, `domainActionHandler`, and `domainData`.
9. Run typecheck/build and click through list->detail->form flows.

If any of these layers is missing, the app may compile but key runtime flows (dispatch, navigation params, or data binding) will fail.

## 5. DSL Authoring Guide

All DSL types are in `packages/engine/src/dsl/types.ts`.

### 5.1 Stack

```ts
interface Stack<TData = StackData, TSettings = StackSettings> {
  name: string;
  icon: string;
  homeCard: string;
  settings: TSettings;
  data: TData;
  cards: Record<string, CardDefinition>;
  ai?: { intents: AIIntent[]; fallback: AIFallback };
}
```

Notes:

1. `cards` key is the canonical card id for navigation.
2. `data` is table-oriented: `{ [tableName]: Record<string, unknown>[] }`.
3. `homeCard` is present on `Stack`, but current runtime navigation initialization is hard-coded to `{ card: 'home' }` in `navigationSlice`.
- That means `homeCard` is not used by runtime navigation today.
- Keep a real `home` card id unless you intentionally change navigation initialization logic.

### 5.2 DSL Actions

Built-in actions:

```ts
{ type: 'navigate'; card: string; paramValue?: string; param?: string }
{ type: 'back' }
{ type: 'toast'; message: string }
```

Domain actions:

```ts
{ type: string; [key: string]: unknown }
```

Guideline:

- keep domain payload shallow and explicit (`id`, `sku`, `values`, `edits`, `status`)

### 5.3 Card Types

Supported `CardType` values:

- `menu`
- `list`
- `detail`
- `form`
- `chat`
- `report`

Do not invent new card type ids unless you also extend the engine DSL and renderer contracts intentionally.

### 5.4 Field and Button Primitives

`DSLField` supports:

- `type`: `label | readonly | text | number | select | tags`
- optional label, placeholder, required, default, step, options, style, highlight

`DSLField.id` semantics:

1. Detail cards: `id` is the record property key.
2. Form cards: `id` is the output key in submit `values`.
3. Menu label fields: `id` is still required, but value typically comes from `field.value`.

`DSLField.value`:

- Primarily used for display-only fields (`label` and `readonly` patterns in menu/detail contexts).
- In menu cards, label rows often use `value` directly.

`DSLField.highlight`:

- This is a DSL hint only.
- Engine does not apply highlight behavior directly.
- Your renderer decides how to interpret highlight keys (for example `lowStock`).

`DSLButton` supports:

- `label`
- `action`
- optional `style`: `primary | danger`

Type note:

- `DSLButton.action` is typed as `DSLAction` at the DSL layer.
- After mapping to widget layer, `ActionConfig.action` is `unknown`.
- Renderers are responsible for preserving action shape and casting safely when dispatching.

### 5.5 Menu Cards

`MenuCardDef`:

- `type: 'menu'`
- optional `fields?: DSLField[]`
- optional `buttons?: DSLButton[]`

Typical usage:

- `fields` for title/subtitle label rows
- `buttons` for navigation and quick actions
- renderer maps DSL buttons to widget `ActionConfig` and dispatches on click

### 5.6 List Cards

`ListCardDef`:

- `dataSource`: table name in `data` / merged domain data
- `columns`: string[]
- optional `filters`
- optional static `dataFilter`
- optional `rowAction`
- optional `toolbar`
- optional `footer` with `{ type: 'sum', field, label }`
- optional `emptyMessage`
- optional `sortable` (currently a DSL flag; renderer decides whether/how to implement sorting UI)

Footer clarification:

- DSL `ListCardDef.footer` currently accepts only `type: 'sum'`.
- Widget `ListView` accepts a broader `FooterConfig` with `sum|count|avg|min|max`.
- If you want non-`sum` footer aggregates today, renderer must supply widget-level footer config directly.

Filters clarification:

- `filters` are declarative controls only.
- Actual filter behavior is implemented in renderer/widget layer.
- Convention: `_search` filter field is typically used as free-text search input.
- `_search` works only when renderer provides `searchFields` to `ListView`.

### 5.7 Detail Cards

`DetailCardDef`:

- `dataSource`
- `keyField`
- `fields`
- optional `computed` (`expr` string)
- optional button list

Detail renderers typically:

1. resolve record by `ctx.paramValue`
2. track local `edits`
3. enrich button actions with record id/sku + edits

Important:

- `computed.expr` is a DSL-level string hint.
- Engine core does not evaluate `expr`.
- Your renderer decides how to evaluate/translate computed fields (or ignore them).
- In current inventory app, computed display is implemented with explicit `compute` functions in renderer/domain code.

Action enrichment is usually required:

- raw DSL button action often lacks record identity.
- renderer should append needed context before dispatch:
`{ ...button.action, id: record.id, edits }` or `{ ...button.action, sku: record.sku, edits }`.

### 5.8 Form Cards

`FormCardDef`:

- `fields`
- `submitAction`
- `submitLabel`

Common pattern:

- renderer dispatches `{ ...submitAction, values }`.

### 5.9 Report Cards

`ReportCardDef`:

- `sections: Array<{ label: string; compute: string }>`

`compute` keys are interpreted by your report renderer/domain compute function.

### 5.10 Chat Cards and AI Intents

`ChatCardDef`:

- `welcome`
- optional `suggestions`

`IntentQuery` fields:

- `source`: table key to query
- optional `filter`: `DataFilter`
- optional `limit`: result cap
- optional `aggregate`: app-defined aggregate key (engine does not enforce semantics)

`ai.intents` allow pattern-driven responses and optional query/compute metadata.
Current behavior is implemented in app chat override code, not engine core.

## 6. DSL Runtime Helpers (`resolver.ts`)

Exports:

1. `resolveValue(val, ctx)`
2. `matchFilter(item, filter, ctx)`
3. `interpolateTemplate(template, record)`

### 6.1 `resolveValue`

Supports dynamic values:

- `$settings.<key>`
- `$input`
- `$match`

Used in list/chat filtering and query-like flows.

### 6.2 `matchFilter`

Operators:

- numeric/comparison: `<= >= == != < >`
- string: `contains`, `iequals`

### 6.3 `interpolateTemplate`

Replaces `{{field}}` placeholders from a record.

## 7. Shell API: `HyperCardShell`

`HyperCardShellProps`:

```ts
interface HyperCardShellProps {
  stack: Stack;
  domainActionHandler?: DomainActionHandler;
  customRenderers?: Record<string, CardTypeRenderer>;
  domainData?: Record<string, unknown[]>;
  navShortcuts?: Array<{ card: string; icon: string }>;
  renderAIPanel?: (dispatch: (action: DSLAction) => void) => React.ReactNode;
  themeClass?: string;
}
```

### 7.1 What Shell Does

1. reads navigation + notification state via selectors
2. builds DSL dispatch callback
3. merges `stack.data` and `domainData`
4. resolves current card from nav stack
5. calls `CardRenderer`
6. renders toast when notification exists

Merge semantics detail:

- Shell uses shallow spread merge:
`data = domainData ? { ...stack.data, ...domainData } : stack.data`
- If the same table key exists in both objects, `domainData` overrides `stack.data`.
- Nested row objects are not deep-merged.

### 7.2 Layout Behavior

Built-in layout modes from navigation slice:

- `split`
- `drawer`
- `cardChat`

`setLayout` also resets nav stack to `home`.

### 7.3 Naming Clarification: `param` vs `paramValue`

- `navigate` action uses `paramValue`.
- navigation slice stores that value on stack entry as `param`.
- renderer context exposes it again as `paramValue` (`ctx.paramValue`).

Flow:

1. dispatch `{ type: 'navigate', card: 'detail', paramValue: 'abc' }`
2. nav stack stores `{ card: 'detail', param: 'abc' }`
3. shell passes `current.param` into renderer context as `paramValue`

## 8. Card Renderer Contract

`CardRendererContext`:

```ts
interface CardRendererContext {
  data: StackData;
  settings: StackSettings;
  dispatch: (action: DSLAction) => void;
  paramValue?: string;
}
```

`CardTypeRenderer`:

```ts
(cardDef: CardDefinition, context: CardRendererContext) => ReactNode | null
```

Important:

- return `null` to allow fallback (if any)
- return non-null to render custom output

Current engine fallback card appears when no renderer is registered.

## 9. Dispatch Pipeline Reference

`dispatchDSLAction(dispatch, action, domainHandler?)`

Behavior:

1. `navigate` -> `navigate({ card, paramValue })`
2. `back` -> `goBack()`
3. `toast` -> `showToast(message)`
4. default -> `domainHandler(action, dispatch)` if provided

`DomainActionHandler` contract:

- signature: `(action, dispatch) => boolean`
- return `true` when action is handled
- return `false` when action is not recognized/handled

If default branch is unhandled, console warning:

- `Unhandled DSL action type: <type>`

Note:

- `createDomainActionHandler` from registry API already returns correct `boolean` semantics.

## 10. Domain Action Registry API (Recommended)

Exports:

1. `defineActionRegistry`
2. `createDomainActionHandler`

`ActionRegistryEntry<TPayload>`:

- `actionCreator(payload)`
- optional `mapPayload(action)`
- optional `toast` string or function
- optional `effect({ dispatch, action, payload })`

### 10.1 Why Use It

Replaces switch-based handlers with declarative map entries.

Benefits:

- one place per action type
- payload normalization colocated with action mapping
- side effects and toast behavior explicit

### 10.2 Todo-style Example

```ts
const todoActionRegistry = defineActionRegistry({
  deleteTask: {
    actionCreator: deleteTask,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return { id: String(a.id ?? '') };
    },
    effect: ({ dispatch }) => {
      dispatch(goBack());
    },
    toast: 'Task deleted',
  },
});

export const todoActionHandler = createDomainActionHandler(todoActionRegistry);
```

### 10.3 Inventory-style Conditional Toast

```ts
receiveStock: {
  actionCreator: receiveStock,
  mapPayload: (action) => {
    const a = action as Record<string, unknown>;
    const values = (a.values ?? {}) as { sku?: unknown; qty?: unknown };
    return { sku: String(values.sku ?? ''), qty: Number(values.qty ?? 0) };
  },
  toast: (payload) => payload.sku && payload.qty
    ? `Received +${payload.qty} for ${payload.sku}`
    : undefined,
}
```

## 11. Selector Registry API (Recommended)

Exports:

1. `defineSelectorRegistry`
2. `selectDomainData`

Purpose:

- centralize domain data selectors
- reduce app-root `useSelector` boilerplate

### 11.1 Example

```ts
export const inventoryDomainDataRegistry = defineSelectorRegistry({
  items: selectItems,
  salesLog: selectSalesLog,
});

export const selectInventoryDomainData = (state: InventoryDomainDataState) =>
  selectDomainData(state, inventoryDomainDataRegistry);
```

In `App.tsx`:

```ts
const domainData = useSelector((s: InventoryDomainDataState) =>
  selectInventoryDomainData(s));
```

## 12. State APIs Reference

### 12.1 Navigation Slice

Exports:

- `navigationReducer`
- `navigate({ card, paramValue? })`
- `goBack()`
- `setLayout(layoutMode)`
- `LayoutMode` (`split|drawer|cardChat`)
- `NavEntry`

Selectors:

- `selectCurrentNav`
- `selectCurrentCardId`
- `selectCurrentParam`
- `selectNavDepth`
- `selectLayout`

### 12.2 Notifications Slice

Exports:

- `notificationsReducer`
- `showToast(message)`
- `clearToast()`

Selector:

- `selectToast`

## 13. Core Generic Types (`types.ts`)

Useful engine-wide interfaces:

1. `ColumnConfig`
2. `FieldConfig`
3. `ComputedFieldConfig`
4. `FilterConfig`
5. `ActionConfig`
6. `FooterConfig`
7. `ChatMessage`
8. `ReportSection`

These are especially relevant when writing custom renderers and widget wrappers.

## 14. Widgets Reference (`components/widgets`)

Exported widget components:

- `Btn`
- `Chip`
- `Toast`
- `FieldRow`
- `FilterBar`
- `DataTable`
- `MenuGrid`
- `ListView`
- `DetailView`
- `FormView`
- `ReportView`
- `ChatView`

Recommendation:

- use these as renderer building blocks
- keep DSL-to-widget mapping logic in override files

## 15. Parts/Theming Reference (`parts.ts`)

`PARTS` exports stable part-name tokens for styling hooks, including:

- primitives: `btn`, `chip`, `toast`
- shell: `window-frame`, `title-bar`, `tab-bar`, `nav-bar`
- cards: `card`, `card-title`, `card-body`, `card-toolbar`
- data table parts: `data-table`, `table-row`, `table-cell`, etc.
- form/detail/report/chat specific part tokens

Use these with CSS `[data-part="..."]` or class/part strategies depending on your style layer.

## 16. End-to-End Example: Action Flow

Example user action: click `Sell 1` on inventory detail card.

1. DSL button action declares `{ type: 'updateQty', delta: -1 }`.
2. detail renderer enriches action with current `sku`.
3. renderer calls `ctx.dispatch(action)`.
4. `dispatchDSLAction` routes to domain handler (not built-in).
5. action registry entry maps payload and dispatches `updateQty` reducer action.
6. optional `toast` function emits message.
7. selectors recalculate; UI re-renders with updated quantity.

This is the canonical interaction pipeline.

### 16.1 End-to-End List-to-Detail Param Flow

This is the exact flow that powers clickable rows opening detail cards.

1. DSL list card declares:

```ts
rowAction: { type: 'navigate', card: 'taskDetail', param: 'id' }
```

2. List renderer click handler reads `rowAction.param` and dispatches:

```ts
const ra = def.rowAction as Record<string, unknown>;
const action = {
  ...ra,
  paramValue: String(row[String(ra.param ?? 'id')] ?? ''),
} as DSLAction;
ctx.dispatch(action);
```

3. `dispatchDSLAction` handles built-in `navigate` and dispatches navigation reducer action.
4. Navigation slice pushes `{ card: 'taskDetail', param: '<row-id>' }`.
5. Shell reads current nav and passes `param` as `ctx.paramValue`.
6. Detail renderer resolves selected record using `keyField` and `ctx.paramValue`.

If `rowAction.param`, row shape, and `keyField` do not align, detail lookup fails.

### 16.2 End-to-End Detail Save Enrichment Flow

Detail button DSL action is often intentionally minimal:

```ts
{ label: 'Save', action: { type: 'saveTask' }, style: 'primary' }
```

Renderer must enrich it with identity and edits:

```ts
const actions: ActionConfig[] = (def.buttons ?? []).map((b) => ({
  label: b.label,
  variant: b.style === 'primary' ? 'primary' : b.style === 'danger' ? 'danger' : 'default',
  action: { ...b.action, id: record.id, edits },
}));
```

Then:

1. `ctx.dispatch` forwards domain action.
2. action registry `mapPayload` normalizes `{ id, edits }`.
3. slice reducer updates correct record.

## 17. Cookbook: Card Override Patterns

This section is conceptual. For copy-ready code snippets for each pattern, see Section 31.

### 17.1 Menu Override Pattern

- map `fields` to label display
- map button variants from DSL style
- dispatch selected button action via `ctx.dispatch`

### 17.2 List Override Pattern

- read source table from `ctx.data[def.dataSource]`
- apply optional static filter with `matchFilter/resolveValue`
- map toolbar actions
- map `rowAction.param` into `paramValue`

### 17.3 Detail Override Pattern

- lookup selected record using `keyField` + `ctx.paramValue`
- maintain `edits` local state
- append `{ id/sku, edits }` into outgoing button actions

### 17.4 Form Override Pattern

- initialize local values from field defaults
- submit as `{ ...submitAction, values }`
- optionally reset fields after successful local dispatch

### 17.5 Report Override Pattern

- compute section values through domain function
- map to `ReportView`
- dispatch report actions (print/email/mock) via DSL toasts/navigation

### 17.6 Chat Override Pattern

- use `ChatView`
- keep chat state in domain slice
- convert intent actions to DSL actions, dispatch through context

## 18. Common Pitfalls and Fixes

### Pitfall 1: Missing renderer registration

Symptom:

- fallback card says no renderer registered

Fix:

- add renderer to app `cardRenderers.ts` map

### Pitfall 2: Unhandled domain action warnings

Symptom:

- console: `Unhandled DSL action type`

Fix:

- add action registry entry or correct action type name

### Pitfall 3: Broken row navigation

Symptom:

- detail card opens with missing record / wrong id

Fix:

- ensure `rowAction.param` matches real row field
- ensure renderer sets `paramValue` from that field

### Pitfall 4: domainData mismatch

Symptom:

- list shows empty source despite data existing in store

Fix:

- verify selector registry keys match `dataSource` names expected by cards

### Pitfall 5: expecting `homeCard` to drive initial nav

Symptom:

- app starts at `home` regardless of `homeCard` value

Fix:

- keep id as `home` or adapt navigation reducer initialization

## 19. Testing Recommendations

### 19.1 Static

- `npm run typecheck`
- app builds (`npm run build -w apps/inventory`, `npm run build -w apps/todo`)

### 19.2 Unit

1. `dispatchDSLAction` route behavior
2. `createDomainActionHandler` mapping/effect/toast behavior
3. `selectDomainData` selector mapping

### 19.3 Integration

- click-through flows for each major card type
- verify domain actions mutate state and navigate/toast as expected

## 20. API Reference Appendix

### 20.1 `@hypercard/engine` top-level exports (grouped)

1. Types and parts
- `./types` exports
- `PARTS`, `PartName`

2. DSL
- all `dsl/types` symbols
- `resolveValue`
- `matchFilter`
- `interpolateTemplate`
- `ResolveContext`

3. Shell
- `WindowChrome`
- `TabBar`
- `NavBar`
- `LayoutSplit`
- `LayoutDrawer`
- `LayoutCardChat`
- `CardRenderer`
- `HyperCardShell`

4. Widgets
- all components from `components/widgets/index.ts`

5. State
- navigation reducer/actions/types + selectors
- notifications reducer/actions + selectors

6. App dispatch
- `dispatchDSLAction`
- `DomainActionHandler`

7. Registry APIs
- `defineActionRegistry`
- `createDomainActionHandler`
- `defineSelectorRegistry`
- `selectDomainData`

### 20.2 Signature Reference (selected)

```ts
dispatchDSLAction(dispatch, action, domainHandler?) => void
```

```ts
defineActionRegistry(registry) => registry
createDomainActionHandler(registry) => DomainActionHandler
```

```ts
defineSelectorRegistry(registry) => registry
selectDomainData(state, registry) => mappedDomainData
```

```ts
HyperCardShell(props: HyperCardShellProps) => JSX.Element
```

```ts
type CardTypeRenderer = (cardDef, context) => ReactNode | null
```

## 21. Recommended Project Conventions

1. Keep one `domain/stack.ts` per app.
2. Keep one `app/domainActionHandler.ts` built via action registry.
3. Keep one `app/domainDataRegistry.ts` built via selector registry.
4. Keep renderer overrides in `overrides/*CardOverride.tsx` plus single `cardRenderers.ts` map.
5. Keep compute-heavy report/chat logic in domain modules, not inline JSX.
6. Keep DSL action naming stable and verb-oriented.

## 22. Final Checklist for New Cards

Before considering a new card flow complete:

- [ ] card id added to `stack.cards`
- [ ] card type supported by registered renderer
- [ ] all `navigate.card` targets exist
- [ ] domain actions mapped in registry
- [ ] selectors provide all required `dataSource` tables
- [ ] typecheck/build pass
- [ ] manual click-through pass

With this workflow, HyperCard remains predictable, modular, and easy to extend safely.

## 23. Detailed Shell Component Reference

This section documents shell components exported by `@hypercard/engine` beyond `HyperCardShell`.

### 23.1 `WindowChrome`

Props:

- `title: string`
- `icon?: string`
- `children: ReactNode`
- `className?: string`

Behavior:

- wraps app content in a chrome frame
- renders title row with close-box visual element
- applies optional `className` at root

### 23.2 `TabBar`

Props:

- `tabs: TabDef[]` where `TabDef = { key: string; label: string }`
- `active: string`
- `onSelect: (key: string) => void`

Behavior:

- simple clickable tab strip
- sets `data-state="active"` when tab key matches `active`

### 23.3 `NavBar`

Props:

- `currentCard: string`
- `cardDef?: CardDefinition`
- `navDepth: number`
- `onAction: (action: DSLAction) => void`
- `shortcuts?: Array<{ card: string; icon: string }>`

Behavior:

- shows back button when `navDepth > 1`
- shortcut buttons dispatch `navigate` actions
- shows current card title/icon summary on right

### 23.4 `LayoutSplit`

Props:

- `main: ReactNode`
- `side: ReactNode`

Behavior:

- grid split layout
- right panel uses `data-part="ai-panel"`

### 23.5 `LayoutDrawer`

Props:

- `main: ReactNode`
- `drawer: ReactNode`

Behavior:

- collapsible bottom drawer
- local open/closed state
- useful for mobile-like AI panel style

### 23.6 `LayoutCardChat`

Props:

- `main: ReactNode`

Behavior:

- no side/drawer panel
- renders main content full-height

### 23.7 `CardRenderer`

Props:

- `cardId: string`
- `cardDef: CardDefinition`
- `context: CardRendererContext`
- `customRenderers?: Record<string, CardTypeRenderer>`

Behavior:

- dispatches by `cardDef.type` lookup
- fallback warning UI if no renderer registered

## 24. Detailed Widget Component Reference

### 24.1 `Btn`

Props:

- extends `ButtonHTMLAttributes<HTMLButtonElement>`
- `children: ReactNode`
- `active?: boolean`
- `variant?: 'default' | 'primary' | 'danger'`

Data attributes:

- `data-part="btn"`
- `data-state="active"` when active
- `data-variant` for non-default variants

### 24.2 `Chip`

Props:

- extends button HTML attributes
- `children: ReactNode`

Data attributes:

- `data-part="chip"`

### 24.3 `Toast`

Props:

- `message: string`
- `onDone: () => void`
- `duration?: number` (default `1800`ms)

Behavior:

- auto-clears after duration

### 24.4 `FieldRow`

Props:

- `field: FieldConfig`
- `value: unknown`
- `onChange: (value: unknown) => void`
- `style?: CSSProperties`

Behavior by `field.type`:

1. `readonly | label`: display only
2. `tags`: displays comma-joined view
3. `select`: `<select>` control
4. `text | number`: `<input>` control

### 24.5 `FilterBar`

Props:

- `filters: FilterConfig[]`
- `values: Record<string, string>`
- `onChange: (field: string, value: string) => void`

Behavior:

- `select` filters render dropdown
- `text` filters render input

### 24.6 `DataTable`

Props:

- `items: T[]`
- `columns: ColumnConfig<T>[]`
- `rowKey?: string | RowKeyFn<T>`
- `onRowClick?: (row: T) => void`
- `emptyMessage?: string`

Behavior:

- supports column width templates (`number` -> px, string literal allowed)
- supports custom format/cell rendering hooks from `ColumnConfig`

### 24.7 `MenuGrid`

Props:

- `icon?: string`
- `labels?: Array<{ value: string; style?: string }>`
- `buttons: ActionConfig[]`
- `onAction: (action: unknown) => void`

Behavior:

- centered menu card layout
- label style `muted` applied by inline styles

### 24.8 `ListView`

Props:

- `items`, `columns`
- `rowKey?: string | RowKeyFn<T>`
- `filters?: FilterConfig[]`
- `searchFields?: string[]`
- `toolbar?: ActionConfig[]`
- `footer?: FooterConfig`
- `emptyMessage?: string`
- `onRowClick?: (row: T) => void`
- `onAction?: (action: unknown) => void`
- `preFilter?: (items: T[]) => T[]`

Behavior:

- applies `preFilter` first
- applies user-selected filters and search
- supports `sum|count|avg|min|max` aggregation in view layer footer

### 24.9 `DetailView`

Props:

- `record: T`
- `fields: FieldConfig[]`
- `computed?: ComputedFieldConfig<T>[]`
- `edits: Record<string, unknown>`
- `onEdit: (id: string, value: unknown) => void`
- `actions?: ActionConfig[]`
- `onAction?: (action: unknown) => void`
- `fieldHighlight?: (fieldId, value, record) => CSSProperties | undefined`

Behavior:

- `current = { ...record, ...edits }`
- computed fields rendered after basic fields

### 24.10 `FormView`

Props:

- `fields: FieldConfig[]`
- `values: Record<string, unknown>`
- `onChange: (id, value) => void`
- `onSubmit: (values) => void`
- `submitResult?: string | null`
- `submitLabel?: string`
- `submitVariant?: 'default' | 'primary' | 'danger'`

Behavior:

- minimal required-check gate before calling `onSubmit`

### 24.11 `ReportView`

Props:

- `sections: ReportSection[]`
- `actions?: ActionConfig[]`
- `onAction?: (action: unknown) => void`

Behavior:

- simple key/value report rows + optional action buttons

### 24.12 `ChatView`

Props:

- `messages: ChatMessage[]`
- `suggestions?: string[]`
- `onSend: (text: string) => void`
- `onAction: (action: unknown) => void`
- `renderResults?: (results: unknown[]) => ReactNode`
- `placeholder?: string`

Behavior:

- auto-scrolls on message updates
- shows suggestion chips when conversation is short
- supports per-message actions and optional result renderer

## 25. Full Integration Blueprint (Repository Pattern)

Recommended app file layout:

1. `src/domain/stack.ts`
2. `src/domain/types.ts`
3. `src/domain/columnConfigs.ts` / `reportCompute.ts` as needed
4. `src/features/*` Redux slices/selectors
5. `src/app/domainActionHandler.ts` (action registry)
6. `src/app/domainDataRegistry.ts` (selector registry)
7. `src/overrides/*CardOverride.tsx`
8. `src/overrides/cardRenderers.ts`
9. `src/App.tsx`

### 25.1 App.tsx canonical shape

```tsx
import { useSelector } from 'react-redux';
import { HyperCardShell } from '@hypercard/engine';
import { STACK } from './domain/stack';
import { myActionHandler } from './app/domainActionHandler';
import { myRenderers } from './overrides/cardRenderers';
import { selectMyDomainData, type MyDomainState } from './app/domainDataRegistry';

export function App() {
  const domainData = useSelector((s: MyDomainState) => selectMyDomainData(s));

  return (
    <HyperCardShell
      stack={STACK as any}
      domainActionHandler={myActionHandler}
      customRenderers={myRenderers}
      domainData={domainData}
    />
  );
}
```

## 26. Generated/LLM Code Acceptance Checklist

Use this before accepting generated code changes:

1. only valid card types used
2. every new domain action mapped in action registry
3. every `navigate.card` target exists in stack
4. every `dataSource` exists in merged data tables
5. no unknown imports/packages
6. no renderer map omissions for used card types
7. no fallback warning card in runtime for targeted flows
8. typecheck/build pass

## 27. Performance Notes

1. Keep heavy computations out of render functions when possible.
2. Use domain selectors for derived data when complexity grows.
3. Keep chat/report compute operations memoized or moved to domain helpers if they become expensive.
4. Avoid recreating massive inline arrays/objects in renderers on every render when not needed.

## 28. Backward-Compatible Extension Strategy

When extending DSL/API:

1. add optional fields first
2. keep default behavior unchanged
3. migrate one app path (todo or inventory) as reference
4. add tests
5. then broaden adoption

This reduces regressions and helps keep docs accurate.

## 29. Troubleshooting Matrix

### "No renderer registered"

- cause: missing key in renderer map
- fix: add card type function to `cardRenderers.ts`

### "Unhandled DSL action type"

- cause: action missing in registry/domain handler
- fix: add action registry entry and action creator import

### wrong detail record

- cause: row action param mismatch
- fix: align `rowAction.param`, row schema, and `paramValue` mapping

### toast never clears

- cause: toast component not mounted / `clearToast` not called
- fix: ensure `HyperCardShell` includes toast and notifications reducer is wired

### layout tabs not switching

- cause: navigation reducer missing or overridden
- fix: ensure `navigation` slice in store and `setLayout` not shadowed

## 30. Final Notes

The current HyperCard API is intentionally split between declarative DSL and app-owned renderer/domain logic.

That split is the core design strength:

1. engine remains generic and stable
2. app behavior remains flexible and domain-specific
3. migration to new patterns (like registry APIs) can happen incrementally

If you preserve this boundary, your app stays maintainable even as card count and workflow complexity grow.

## 31. Example Gallery (Copy-Adapt Patterns)

### 31.1 List card with static threshold filter

```ts
lowStock: {
  type: 'list',
  title: 'Low Stock',
  icon: '[warning]',
  dataSource: 'items',
  columns: ['sku', 'qty', 'price', 'name', 'category'],
  dataFilter: { field: 'qty', op: '<=', value: '$settings.lowStockThreshold' },
  emptyMessage: 'All stocked up! [success]',
  toolbar: [
    { label: 'Email Supplier', action: { type: 'toast', message: 'Drafted reorder email' } },
  ],
}
```

Renderer-side helper:

```ts
const preFilter = def.dataFilter
  ? (items: Record<string, unknown>[]) =>
      items.filter((i) =>
        matchFilter(
          i,
          {
            ...def.dataFilter!,
            value: resolveValue(def.dataFilter!.value, { settings: ctx.settings }),
          },
          { settings: ctx.settings },
        ),
      )
  : undefined;
```

### 31.2 Detail card with computed fields + action enrichment

```ts
detailCard: {
  type: 'detail',
  title: 'Item: {{name}}',
  icon: '[box]',
  dataSource: 'items',
  keyField: 'sku',
  fields: [
    { id: 'sku', label: 'SKU', type: 'readonly' },
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'qty', label: 'Qty', type: 'number' },
  ],
  computed: [
    { id: 'value', label: 'Inventory Value', expr: "'$' + (price * qty).toFixed(2)" },
  ],
  buttons: [
    { label: 'Save', action: { type: 'saveItem' }, style: 'primary' },
    { label: 'Delete', action: { type: 'deleteItem' }, style: 'danger' },
  ],
}
```

Renderer enrichment pattern:

```ts
const actions: ActionConfig[] = (def.buttons ?? []).map((b) => ({
  label: b.label,
  variant: b.style === 'primary' ? 'primary' : b.style === 'danger' ? 'danger' : 'default',
  action: { ...b.action, sku: record.sku, edits },
}));
```

### 31.3 Form card + registry create action

```ts
newTask: {
  type: 'form',
  title: 'New Task',
  icon: '[add]',
  fields: [
    { id: 'title', label: 'Title', type: 'text', required: true },
    { id: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
  ],
  submitAction: { type: 'createTask' },
  submitLabel: 'Create Task',
}
```

Registry entry:

```ts
createTask: {
  actionCreator: createTask,
  mapPayload: (action) => {
    const a = action as Record<string, unknown>;
    return (a.values ?? {}) as { title: string; priority?: string; due?: string };
  },
  toast: 'Task created! [ok]',
}
```

### 31.4 Selector registry pattern for multi-table domainData

```ts
type AppState = InventoryStateSlice & SalesStateSlice;

export const domainDataRegistry = defineSelectorRegistry({
  items: selectItems,
  salesLog: selectSalesLog,
});

export const selectAppDomainData = (state: AppState) =>
  selectDomainData(state, domainDataRegistry);
```

### 31.5 Chat action bridge pattern

When chat suggestions/actions include domain commands, route all actions through DSL dispatch so navigation, domain handlers, and toasts stay consistent.

```ts
onAction={(action) => {
  const a = action as DSLAction;
  if (a.type === 'aiSend') {
    handleSend(String((a as any).text ?? ''));
  } else {
    ctx.dispatch(a);
  }
}}
```

This avoids bypassing the central action pipeline.
