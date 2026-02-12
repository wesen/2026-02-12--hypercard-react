---
title: "Layer Separation – Generic CRUD Widgets vs HyperCard Engine vs Inventory App"
doc_type: design
status: active
intent: long-term
topics:
  - react
  - storybook
  - theming
  - rtk-toolkit
  - vite
ticket: HC-001-IMPORT-JSX
related_files:
  - path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md
    note: "Original design doc – this addendum revises its module boundaries"
  - path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/sources/local/hypercard(4).jsx
    note: "Monolithic source – contamination points traced here"
  - path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/sources/local/hypercard-dev-guide.md
    note: "Dev guide describing the DSL architecture"
---

# Layer Separation

## HyperCard Engine (with generic CRUD widgets) · Inventory App

> Superseded for implementation by V3:
> `design/04-v3-unified-modularization-design-and-implementation-plan.md`
> Keep this document as historical reference only.

**Addendum to the original modularization guide (design/01-…).** This document identifies what the original design gets wrong, defines two clean layers, maps every contamination point, and provides the revised architecture.

---

## Table of Contents

1. [What the Original Design Gets Wrong](#1-what-the-original-design-gets-wrong)
2. [The Two-Layer Architecture](#2-the-two-layer-architecture)
3. [Contamination Audit](#3-contamination-audit)
4. [Layer 1: `@hypercard/engine`](#4-layer-1-hypercardengine)
5. [Layer 2: `apps/inventory`](#5-layer-2-appsinventory)
6. [How the Layers Compose](#6-how-the-layers-compose)
7. [What Changes in the Original Design Doc](#7-what-changes-in-the-original-design-doc)
8. [Revised File Structure](#8-revised-file-structure)
9. [Revised Migration Checklist](#9-revised-migration-checklist)

---

## 1. What the Original Design Gets Wrong

The original design (doc 01) treats the system as one application being split into modules. It puts everything under a single `src/` tree with a flat `features/` directory and a shared `components/` directory. The result is that **every layer can import from every other layer**. Specifically:

### 1.1 The DSL types are inventory-specific

`src/dsl/types.ts` defines `Item` (with `sku`, `qty`, `price`, `cost`, `tags`), `SaleEntry`, and `StackSettings` (with `lowStockThreshold`). These are not generic CRUD types — they're the inventory domain. The `Stack` interface hardcodes `StackData` with `items: Item[]` and `salesLog: SaleEntry[]`.

**Result:** No one can use these types for a different domain (e.g. a CRM, a project tracker, a recipe manager).

### 1.2 DataTable has baked-in inventory knowledge

In the monolith (line 373–374):
```jsx
if (c === "price" || c === "total" || c === "cost") v = "$" + Number(v).toFixed(2);
if (c === "qty" && typeof item.qty === "number") {
  st.color = item.qty === 0 ? T.err : item.qty <= STACK.settings.lowStockThreshold ? T.wrn : "#000";
}
```

The design doc preserves this: the DataTable story includes "QuantityColors" and the CSS has `data-state="out-of-stock"` / `data-state="low-stock"`. But the DataTable itself shouldn't know what "stock" means. It should render cells through a generic formatter/renderer, and the *inventory app* should supply the stock-coloring logic.

### 1.3 RTK slices mix engine and domain

The original puts `inventorySlice`, `salesSlice`, and `chatSlice` alongside `navigationSlice` and `notificationsSlice` in a flat `features/` directory. Navigation and notifications are engine concerns (any card-based app needs them). Inventory, sales, and the AI chat engine are domain concerns (only this inventory app needs them).

### 1.4 The action bridge knows about inventory verbs

`dispatchDSLAction` handles `updateQty`, `saveItem`, `deleteItem`, `createItem`, `receiveStock` — all inventory-specific. The generic engine only needs `navigate`, `back`, and `toast`. Domain actions should be plugged in by the app.

### 1.5 Card renderers contain domain logic

- `FormCard` has a `priceCheck` special case (line 511–513)
- `DetailCard` hardcodes `highlight: "lowStock"` check against `STACK.settings` (line 477–478)
- `DetailCard` computed fields use `new Function("price", "cost", "qty", ...)` — hardcoded variable names
- `ReportCard` has 9 inventory-specific compute functions in a `computeMap`
- `ChatCard` embeds the entire AI intent engine with 6 inventory-specific compute handlers

### 1.6 Token names are HyperCard-specific

All tokens use the `--hc-` prefix. Generic CRUD widgets shouldn't require a HyperCard theme. They should have neutral tokens (or no prefix), and the HyperCard engine should *map* its tokens onto the widgets.

---

## 2. The Two-Layer Architecture

```
┌──────────────────────────────────────────────────────┐
│  Layer 2: apps/inventory                             │
│  ── Domain logic, STACK definition, AI engine ──     │
│  Depends on: Layer 1                                 │
├──────────────────────────────────────────────────────┤
│  Layer 1: @hypercard/engine                          │
│  ── Generic CRUD widgets + card system + DSL +       │
│     layouts + nav + retro shell + theming ──         │
│  Depends on: nothing (pure React + RTK)              │
└──────────────────────────────────────────────────────┘
```

**Rule:** Dependencies only flow downward. The engine never imports from the app.

### Why two layers, not three

An earlier draft split generic CRUD widgets into their own package separate from the engine. That adds a `--cw-` token prefix that the engine must map onto via `--hc-` → `--cw-`, a second `parts.ts`, a second `package.json`, and import indirection — all for a boundary nobody actually needs to cross independently. The widgets and the card engine are always used together; the real reuse boundary is **engine vs. domain app**.

### What each layer IS and ISN'T

| Layer | IS | ISN'T |
|-------|-----|-------|
| **engine** | DataTable with column configs + cell renderers, FormView/DetailView/ListView/ReportView/ChatView/MenuGrid with generic typed props, Btn/Chip/Toast/FilterBar, card type → widget dispatcher, generic `Stack<TData, TSettings>` DSL type, navigation slice, notification slice, WindowChrome, layouts (Split/Drawer/CardChat), NavBar, `data-widget="hypercard"` + Mac System 7 theme via `--hc-` tokens, generic action bridge (navigate/back/toast) with extension points | Not aware of inventory, SKU, sales, AI intents, compute handlers |
| **inventory** | STACK constant, Item/SaleEntry types, inventory slice, sales slice, chat slice, intent engine, compute handlers, cell formatters (qty coloring, $ formatting), domain action handlers, report compute map | Not reusable — this is one specific application |

---

## 3. Contamination Audit

Every line in the monolith that crosses a layer boundary:

### 3.1 DataTable → Inventory (engine widget contaminated by app domain)

| Line | Code | Problem | Fix |
|------|------|---------|-----|
| 357 | `ws = { sku: 65, qty: 35, price: 55, ... }` | Hardcoded column widths for inventory fields | Accept `columns: ColumnConfig[]` with widths |
| 369 | `key={item.sku \|\| item.id \|\| i}` | Assumes `sku` as primary key | Accept `rowKey: string \| ((item) => string)` |
| 373 | `if (c === "price" \|\| c === "total" \|\| c === "cost") v = "$" + ...` | Hardcoded currency formatting | Use `column.format` function |
| 374 | `if (c === "qty" && ...) ... STACK.settings.lowStockThreshold` | Inventory-specific coloring + STACK global | Use `column.cellProps` / `renderCell` callback |

### 3.2 ListCard → STACK global (engine contaminated by app domain)

| Line | Code | Problem | Fix |
|------|------|---------|-----|
| 408 | `resolveValue(v, { stack: STACK })` | Direct STACK reference in filter resolution | Pass settings via props/context |
| 413 | `i.name ... i.sku` | `_search` hardcoded to search `name` and `sku` | Accept `searchFields: string[]` in filter config |

### 3.3 DetailCard → Inventory (engine contaminated by app domain)

| Line | Code | Problem | Fix |
|------|------|---------|-----|
| 477–478 | `f.highlight === "lowStock" && ... STACK.settings.lowStockThreshold` | Inventory-specific highlight + STACK global | Generic `highlight` as `(value, record, settings) => CSSProperties` |
| 487 | `new Function("price", "cost", "qty", ...)` | Hardcoded variable names | Accept a `computeField: (record) => string` function |

### 3.4 FormCard → Inventory (engine contaminated by app domain)

| Line | Code | Problem | Fix |
|------|------|---------|-----|
| 511–513 | `if (card.submitAction.type === "priceCheck")` | Inventory-specific action handled inline | Use a generic `onSubmit` callback; domain provides the handler |

### 3.5 ReportCard → Inventory (engine contaminated by app domain)

| Line | Code | Problem | Fix |
|------|------|---------|-----|
| 548–559 | `computeMap = { totalSkus, retailValue, ... }` | All compute functions are inventory-specific | Accept `computeMap` as a prop from the app |

### 3.6 ChatCard → Everything (engine contaminated by app domain)

| Line | Code | Problem | Fix |
|------|------|---------|-----|
| 591–630 | `processInput` with 6 inventory compute handlers | Entire AI engine inline | Extract to app layer; ChatCard accepts a `processMessage` function prop |
| 593 | `STACK.ai.intents` | Direct STACK access | Intent config passed via props/context |

### 3.7 HyperCardEngine dispatch → Inventory (engine contaminated by app domain)

| Line | Code | Problem | Fix |
|------|------|---------|-----|
| 699–740 | `case "updateQty"`, `"saveItem"`, `"deleteItem"`, etc. | Inventory verbs in the engine dispatch | Engine handles navigate/back/toast; domain actions via a plugin/middleware pattern |

---

## 4. Layer 1: `@hypercard/engine`

### 4.1 Design Principles

- **Zero domain knowledge.** No field is "special" — `sku`, `qty`, `price` are just strings to these widgets.
- **Configuration-driven.** All behavior comes from typed config objects passed as props.
- **Callback-based.** CRUD widgets fire callbacks (`onRowClick`, `onSubmit`, `onAction`), never dispatch to a domain-specific store.
- **Theming via `--hc-` tokens.** One token prefix for the whole engine, scoped to `[data-widget="hypercard"]`.
- **`data-part` selectors** — single flat registry covering both widgets and shell chrome.
- **Generic card system** — the DSL card types, navigation slice, notification slice, layouts, and action bridge live alongside the widgets in one package.

### 4.2 Generic Types (`packages/engine/src/types.ts`)

```typescript
// ── Column definition (replaces hardcoded DataTable) ──
export interface ColumnConfig<T = Record<string, unknown>> {
  /** Field key to read from the row object */
  key: string;
  /** Display header label (defaults to key) */
  label?: string;
  /** Column width: number (px) or CSS value ('1fr', '80px') */
  width?: number | string;
  /** Format the raw value for display */
  format?: (value: unknown, row: T) => string;
  /** Return data-state for conditional styling, e.g. "error", "warning" */
  cellState?: (value: unknown, row: T) => string | undefined;
  /** Return inline style overrides for the cell */
  cellStyle?: (value: unknown, row: T) => React.CSSProperties | undefined;
  /** Custom cell renderer (overrides format) */
  renderCell?: (value: unknown, row: T) => React.ReactNode;
  /** Text alignment */
  align?: 'left' | 'right' | 'center';
}

// ── Field definition (replaces CardField for forms/details) ──
export type FieldType = 'readonly' | 'text' | 'number' | 'select' | 'tags' | 'label';

export interface FieldConfig {
  id: string;
  label?: string;
  type: FieldType;
  value?: unknown;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  step?: number;
  options?: string[];
  style?: string; // 'muted' for labels
}

// ── Computed field (replaces new Function()) ──
export interface ComputedFieldConfig<T = Record<string, unknown>> {
  id: string;
  label: string;
  /** Pure function that computes the display value from the record */
  compute: (record: T) => string;
}

// ── Filter definition ──
export interface FilterConfig {
  field: string;
  type: 'select' | 'text';
  options?: string[];
  placeholder?: string;
}

// ── Action definition (generic) ──
export interface ActionConfig {
  label: string;
  variant?: 'default' | 'primary' | 'danger';
  /** Opaque action payload — the consumer decides what this means */
  action: unknown;
}

// ── Footer aggregation ──
export type AggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max';

export interface FooterConfig {
  type: AggregationType;
  field: string;
  label: string;
  format?: (value: number) => string;
}

// ── Row key extractor ──
export type RowKeyFn<T = Record<string, unknown>> = (row: T, index: number) => string;
```

### 4.3 DataTable (generic)

```typescript
// packages/engine/src/components/widgets/DataTable.tsx
import type { ColumnConfig, RowKeyFn } from '../types';

export interface DataTableProps<T = Record<string, unknown>> {
  items: T[];
  columns: ColumnConfig<T>[];
  rowKey?: string | RowKeyFn<T>;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  items, columns, rowKey, onRowClick, emptyMessage,
}: DataTableProps<T>) {
  const getKey = (item: T, i: number) =>
    typeof rowKey === 'function' ? rowKey(item, i)
    : typeof rowKey === 'string' ? String(item[rowKey])
    : String(item['id'] ?? i);

  const tpl = columns.map(c =>
    typeof c.width === 'number' ? `${c.width}px` : c.width ?? '1fr'
  ).join(' ');

  return (
    <div data-part="data-table">
      <div data-part="table-header" style={{ display: 'grid', gridTemplateColumns: tpl }}>
        {columns.map(c => (
          <span key={c.key} style={{ textAlign: c.align }}>{c.label ?? c.key}</span>
        ))}
      </div>
      {items.length === 0 && (
        <div data-part="table-empty">{emptyMessage ?? 'No items'}</div>
      )}
      {items.map((item, i) => (
        <div
          key={getKey(item, i)}
          data-part="table-row"
          onClick={() => onRowClick?.(item)}
          style={{ display: 'grid', gridTemplateColumns: tpl, cursor: onRowClick ? 'pointer' : 'default' }}
        >
          {columns.map(c => {
            const raw = item[c.key];
            const display = c.renderCell
              ? c.renderCell(raw, item)
              : c.format
                ? c.format(raw, item)
                : String(raw ?? '');
            const state = c.cellState?.(raw, item);
            const style = c.cellStyle?.(raw, item);

            return (
              <span
                key={c.key}
                data-part="table-cell"
                data-state={state}
                style={{ textAlign: c.align, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...style }}
              >
                {display}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

**What changed vs. the original design:**
- No hardcoded column widths for `sku`, `qty`, `price`, etc.
- No `$` formatting — that's a `format` function the app provides
- No qty coloring — that's a `cellState` function the app provides
- No `STACK.settings.lowStockThreshold` reference
- No `item.sku || item.id` key assumption — generic `rowKey` prop

### 4.4 FormView (generic)

```typescript
// packages/engine/src/components/widgets/FormView.tsx
import type { FieldConfig, ActionConfig } from '../types';

export interface FormViewProps {
  fields: FieldConfig[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
  onSubmit: (values: Record<string, unknown>) => void;
  /** Result message shown after submit (e.g. "✅ Done!" or "SKU not found") */
  submitResult?: string | null;
  submitLabel?: string;
  submitVariant?: 'default' | 'primary' | 'danger';
}

export function FormView({
  fields, values, onChange, onSubmit, submitResult, submitLabel, submitVariant,
}: FormViewProps) {
  function handleSubmit() {
    if (fields.some(f => f.required && !values[f.id])) return;
    onSubmit(values);
  }

  return (
    <div data-part="form-view">
      <div data-part="field-grid">
        {fields.map(f => (
          <FieldRow key={f.id} field={f} value={values[f.id]} onChange={v => onChange(f.id, v)} />
        ))}
      </div>
      <div data-part="button-group">
        <button data-part="btn" data-variant={submitVariant ?? 'primary'} onClick={handleSubmit}>
          {submitLabel ?? 'Submit'}
        </button>
        {submitResult && <span data-part="field-value">{submitResult}</span>}
      </div>
    </div>
  );
}
```

**What changed:** No `priceCheck` special case. The app handles that in `onSubmit` and passes back `submitResult`.

### 4.5 DetailView (generic)

```typescript
// packages/engine/src/components/widgets/DetailView.tsx
import type { FieldConfig, ComputedFieldConfig, ActionConfig } from '../types';

export interface DetailViewProps<T = Record<string, unknown>> {
  record: T;
  fields: FieldConfig[];
  computed?: ComputedFieldConfig<T>[];
  edits: Record<string, unknown>;
  onEdit: (id: string, value: unknown) => void;
  actions?: ActionConfig[];
  onAction?: (action: unknown) => void;
  /** Per-field highlight function (replaces hardcoded lowStock check) */
  fieldHighlight?: (fieldId: string, value: unknown, record: T) => React.CSSProperties | undefined;
}

export function DetailView<T extends Record<string, unknown>>({
  record, fields, computed, edits, onEdit, actions, onAction, fieldHighlight,
}: DetailViewProps<T>) {
  const current = { ...record, ...edits } as T;

  return (
    <div data-part="detail-view">
      <div data-part="field-grid">
        {fields.map(f => {
          const val = current[f.id as keyof T];
          const highlight = fieldHighlight?.(f.id, val, current);
          return (
            <FieldRow
              key={f.id}
              field={f}
              value={val}
              onChange={v => onEdit(f.id, v)}
              style={highlight}
            />
          );
        })}
        {computed?.map(cf => (
          <Fragment key={cf.id}>
            <span data-part="field-label">{cf.label}:</span>
            <span data-part="field-value">{cf.compute(current)}</span>
          </Fragment>
        ))}
      </div>
      {actions && (
        <div data-part="button-group">
          {actions.map(a => (
            <button
              key={a.label}
              data-part="btn"
              data-variant={a.variant}
              onClick={() => onAction?.(a.action)}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**What changed:**
- Computed fields use `compute: (record) => string` — a pure function, not `new Function("price", "cost", "qty", ...)`
- Highlight is a generic `fieldHighlight` callback, not hardcoded `"lowStock"` check
- No `STACK.settings` reference
- Actions are opaque — the consumer maps them to RTK dispatches

### 4.6 ListView (generic)

Wraps DataTable with filter bar, toolbar, footer, status bar:

```typescript
// packages/engine/src/components/widgets/ListView.tsx
import type { ColumnConfig, FilterConfig, FooterConfig, ActionConfig, RowKeyFn } from '../types';

export interface ListViewProps<T = Record<string, unknown>> {
  items: T[];
  columns: ColumnConfig<T>[];
  rowKey?: string | RowKeyFn<T>;
  filters?: FilterConfig[];
  /** Fields to include in text search (replaces hardcoded name+sku) */
  searchFields?: string[];
  toolbar?: ActionConfig[];
  footer?: FooterConfig;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  onAction?: (action: unknown) => void;
  /** External pre-filter applied before user filters */
  preFilter?: (items: T[]) => T[];
}
```

**What changed:** No `dataFilter` with `$settings.lowStockThreshold` resolution. The `preFilter` is a plain function the app provides. `searchFields` replaces the hardcoded `name + sku` search.

### 4.7 ReportView (generic)

```typescript
// packages/engine/src/components/widgets/ReportView.tsx
export interface ReportSection {
  label: string;
  value: string; // pre-computed by the app
}

export interface ReportViewProps {
  sections: ReportSection[];
  actions?: ActionConfig[];
  onAction?: (action: unknown) => void;
}
```

**What changed:** No `computeMap` inside the component. The app computes all values and passes `{ label, value }` pairs. The widget just renders them.

### 4.8 ChatView (generic)

```typescript
// packages/engine/src/components/widgets/ChatView.tsx
export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  /** Arbitrary structured results to render (via renderResults slot) */
  results?: unknown[];
  /** Action chips */
  actions?: Array<{ label: string; action: unknown }>;
  /** Arbitrary metadata */
  meta?: Record<string, unknown>;
}

export interface ChatViewProps {
  messages: ChatMessage[];
  suggestions?: string[];
  onSend: (text: string) => void;
  onAction: (action: unknown) => void;
  /** Custom renderer for structured results in messages */
  renderResults?: (results: unknown[]) => React.ReactNode;
  placeholder?: string;
  welcome?: string;
}
```

**What changed:** No intent engine. No `processInput`. No compute handlers. The app calls `onSend`, processes the message externally (via the intent engine or an LLM), and adds the response to the message list via Redux.

### 4.9 Unified Token Prefix

Everything uses `--hc-` tokens, scoped to `[data-widget="hypercard"]`. Since widgets and shell are one package, there's no mapping layer — widgets reference `--hc-` tokens directly in their CSS.

```css
/* packages/engine/src/styles/hypercard.css (excerpt — widgets use the same tokens) */
:where([data-widget="hypercard"]) [data-part="data-table"] {
  font-size: var(--hc-font-size-md);
}
:where([data-widget="hypercard"]) [data-part="btn"] {
  font-family: var(--hc-font-family);
  border: var(--hc-border-width) solid var(--hc-color-border);
  border-radius: var(--hc-border-radius);
  box-shadow: var(--hc-shadow-btn);
}
```

The `theme-default.css` sets all `--hc-` values (Mac System 7 look). Alternative themes override them. No second token prefix, no mapping indirection.

---

### 4.10 Card System, DSL, and Shell

The engine package also owns the card rendering system, DSL types, navigation, layouts, and theming — all alongside the CRUD widgets in one package.

#### What the engine owns (in addition to widgets)

- **Generic card type system** — menu, list, detail, form, report, chat as abstract card types
- **DSL types** — generic: `Stack<TData, TSettings>`
- **DSL resolver** — `matchFilter`, `resolveValue`, receiving settings via parameter, never referencing a global
- **Navigation** — navStack, goBack, setLayout (RTK slice)
- **Notifications** — toast (RTK slice)
- **Layouts** — WindowChrome, LayoutSplit, LayoutDrawer, LayoutCardChat
- **NavBar**
- **CardRenderer** — maps card type to widget, extensible via `customRenderers`
- **Action bridge** — handles navigate/back/toast, delegates unknown types to a consumer-provided handler
- **Theming** — the `--hc-` tokens + Mac System 7 CSS

#### Generic Stack Type

```typescript
// packages/engine/src/dsl/types.ts

export interface StackSettings {
  [key: string]: unknown;
}

export interface StackData {
  [tableName: string]: Record<string, unknown>[];
}

export interface Stack<
  TData extends StackData = StackData,
  TSettings extends StackSettings = StackSettings,
> {
  name: string;
  icon: string;
  homeCard: string;
  settings: TSettings;
  data: TData;
  cards: Record<string, CardDefinition>;
  ai?: {
    intents: AIIntent[];
    fallback: AIFallback;
  };
}
```

`ai` is now **optional** — not every card-based app needs AI. And there's no `Item` or `SaleEntry` anywhere.

#### Generic Action Bridge

```typescript
// packages/engine/src/app/dispatchDSLAction.ts

export type DomainActionHandler = (action: DSLAction, dispatch: AppDispatch) => boolean;

/**
 * Generic action bridge.
 * Handles engine-level actions (navigate, back, toast).
 * Delegates everything else to the domainHandler.
 */
export function dispatchDSLAction(
  dispatch: AppDispatch,
  action: DSLAction,
  domainHandler?: DomainActionHandler,
) {
  switch (action.type) {
    case 'navigate':
      dispatch(navigate({ card: action.card!, paramValue: action.paramValue }));
      return;
    case 'back':
      dispatch(goBack());
      return;
    case 'toast':
      dispatch(showToast(action.message!));
      return;
    default:
      // Delegate to domain-specific handler
      if (domainHandler) {
        const handled = domainHandler(action, dispatch);
        if (!handled) {
          console.warn(`Unhandled action type: ${action.type}`);
        }
      }
  }
}
```

#### CardRenderer with Extension Point

```typescript
// packages/engine/src/components/CardRenderer.tsx

export type CardTypeRenderer = (
  cardDef: CardDefinition,
  props: CardRendererContext,
) => React.ReactNode | null;

export interface CardRendererContext {
  data: StackData;
  settings: StackSettings;
  dispatch: (action: DSLAction) => void;
  paramValue?: string;
}

export interface CardRendererProps {
  cardId: string;
  cardDef: CardDefinition;
  context: CardRendererContext;
  /** Register custom card type renderers or override built-in ones */
  customRenderers?: Record<string, CardTypeRenderer>;
}

export function CardRenderer({ cardId, cardDef, context, customRenderers }: CardRendererProps) {
  // Check custom renderers first (app can override any card type)
  const custom = customRenderers?.[cardDef.type];
  if (custom) {
    const result = custom(cardDef, context);
    if (result !== null) return result;
  }

  // Built-in generic renderers
  switch (cardDef.type) {
    case 'menu':   return <MenuCardView card={cardDef} onAction={context.dispatch} />;
    case 'list':   return <ListCardView card={cardDef} data={context.data} settings={context.settings} onAction={context.dispatch} />;
    case 'form':   return <FormCardView card={cardDef} onSubmit={...} />;
    // ... etc.
    default:       return <div>Unknown card type: {cardDef.type}</div>;
  }
}
```

The key insight: the engine provides **generic card-type wrappers** around its own CRUD widgets. But the app can supply `customRenderers` to override any of them (e.g., to inject the inventory-specific `priceCheck` behavior into FormCard).

#### Engine RTK Slices (only generic ones)

```
packages/engine/src/features/
├── navigation/
│   ├── navigationSlice.ts    # navStack, layout
│   └── selectors.ts
└── notifications/
    └── notificationsSlice.ts # toast
```

That's it. No inventory. No sales. No chat messages. Those are in the app.

---

## 5. Layer 2: `apps/inventory`

### 5.1 What Lives Here

Everything domain-specific:

```
apps/inventory/src/
├── domain/
│   ├── types.ts              # Item, SaleEntry, InventorySettings
│   ├── stack.ts              # The STACK constant (typed)
│   ├── formatters.ts         # Currency formatter, qty coloring
│   ├── computeFields.ts     # Margin calc, inventory value calc
│   └── columnConfigs.ts     # ColumnConfig[] for items, salesLog
│
├── features/
│   ├── inventory/
│   │   ├── inventorySlice.ts
│   │   └── selectors.ts
│   ├── sales/
│   │   ├── salesSlice.ts
│   │   └── selectors.ts
│   └── chat/
│       ├── chatSlice.ts
│       ├── intentEngine.ts
│       └── computeHandlers.ts
│
├── app/
│   ├── store.ts              # Assembles engine + domain slices
│   ├── hooks.ts
│   ├── domainActionHandler.ts  # Handles updateQty, saveItem, etc.
│   └── App.tsx
│
├── overrides/
│   ├── InventoryDetailCard.tsx  # Overrides DetailCard with inventory-specific highlight + computed
│   ├── InventoryFormCard.tsx    # Adds priceCheck behavior
│   ├── InventoryReportCard.tsx  # Provides computeMap
│   ├── InventoryChatCard.tsx    # Wires intent engine
│   └── cardRenderers.ts        # Registers overrides as customRenderers
│
└── main.tsx
```

### 5.2 Domain Formatters (`domain/formatters.ts`)

```typescript
import type { ColumnConfig } from '@hypercard/engine';

/** Currency formatter for DataTable cells */
export function formatCurrency(value: unknown): string {
  return '$' + Number(value).toFixed(2);
}

/** Qty cell state based on stock threshold */
export function qtyState(threshold: number) {
  return (value: unknown): string | undefined => {
    const qty = Number(value);
    if (qty === 0) return 'error';
    if (qty <= threshold) return 'warning';
    return undefined;
  };
}

/** Standard inventory columns */
export function itemColumns(threshold: number): ColumnConfig[] {
  return [
    { key: 'sku', label: 'SKU', width: 65 },
    { key: 'qty', label: 'QTY', width: 35, cellState: qtyState(threshold) },
    { key: 'price', label: 'PRICE', width: 55, format: formatCurrency, align: 'right' },
    { key: 'name', label: 'NAME', width: '1fr' },
    { key: 'category', label: 'CATEGORY', width: 80 },
  ];
}
```

### 5.3 Domain Computed Fields (`domain/computeFields.ts`)

```typescript
import type { ComputedFieldConfig } from '@hypercard/engine';
import type { Item } from './types';

export const inventoryComputedFields: ComputedFieldConfig<Item>[] = [
  {
    id: 'margin',
    label: 'Margin',
    compute: (item) => ((item.price - item.cost) / item.price * 100).toFixed(1) + '%',
  },
  {
    id: 'value',
    label: 'Inventory Value',
    compute: (item) => '$' + (item.price * item.qty).toFixed(2),
  },
];
```

No `new Function()`. Pure typed functions.

### 5.4 Domain Action Handler (`app/domainActionHandler.ts`)

```typescript
import type { DomainActionHandler } from '@hypercard/engine';
import { updateQty, saveItem, deleteItem, createItem, receiveStock } from '../features/inventory/inventorySlice';
import { showToast } from '@hypercard/engine';
import { goBack } from '@hypercard/engine';

export const inventoryActionHandler: DomainActionHandler = (action, dispatch) => {
  switch (action.type) {
    case 'updateQty':
      dispatch(updateQty({ sku: action.sku!, delta: action.delta! }));
      dispatch(showToast(`${action.delta! > 0 ? '+' : ''}${action.delta} qty for ${action.sku}`));
      return true;
    case 'saveItem':
      dispatch(saveItem({ sku: action.sku!, edits: action.edits as any }));
      dispatch(showToast(`Saved ${action.sku}`));
      return true;
    case 'deleteItem':
      dispatch(deleteItem({ sku: action.sku! }));
      dispatch(goBack());
      dispatch(showToast(`Deleted ${action.sku}`));
      return true;
    case 'createItem':
      dispatch(createItem(action.values as any));
      dispatch(showToast(`Created ${action.values?.sku}`));
      return true;
    case 'receiveStock':
      dispatch(receiveStock({ sku: action.values?.sku as string, qty: Number(action.values?.qty) }));
      dispatch(showToast(`Received +${action.values?.qty} for ${action.values?.sku}`));
      return true;
    default:
      return false; // not handled
  }
};
```

### 5.5 Store Assembly

```typescript
// apps/inventory/src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { navigationReducer, notificationsReducer } from '@hypercard/engine';
import { inventoryReducer } from '../features/inventory/inventorySlice';
import { salesReducer } from '../features/sales/salesSlice';
import { chatReducer } from '../features/chat/chatSlice';

export const store = configureStore({
  reducer: {
    // Engine slices (generic)
    navigation: navigationReducer,
    notifications: notificationsReducer,
    // Domain slices (inventory-specific)
    inventory: inventoryReducer,
    sales: salesReducer,
    chat: chatReducer,
  },
});
```

### 5.6 App Assembly

```tsx
// apps/inventory/src/app/App.tsx
import { HyperCardShell } from '@hypercard/engine';
import { STACK } from '../domain/stack';
import { inventoryActionHandler } from './domainActionHandler';
import { inventoryCardRenderers } from '../overrides/cardRenderers';

export function App() {
  return (
    <HyperCardShell
      stack={STACK}
      domainActionHandler={inventoryActionHandler}
      customRenderers={inventoryCardRenderers}
    />
  );
}
```

---

## 6. How the Layers Compose

### 6.1 A Different App on the Same Engine

To prove the architecture works, imagine a **Recipe Manager** built on the same layers:

```
apps/recipes/src/
├── domain/
│   ├── types.ts          # Recipe, Ingredient
│   ├── stack.ts          # STACK with cards: browse, recipeDetail, newRecipe
│   ├── formatters.ts     # Calorie formatting, serving size
│   └── columnConfigs.ts  # ColumnConfig[] for recipes, ingredients
├── features/
│   ├── recipes/recipesSlice.ts
│   └── ingredients/ingredientsSlice.ts
├── app/
│   ├── store.ts          # navigation + notifications + recipes + ingredients
│   ├── domainActionHandler.ts  # addRecipe, deleteRecipe, etc.
│   └── App.tsx
└── main.tsx
```

Same engine, same HyperCard retro theme, completely different domain.

### 6.2 Composition Diagram

```
┌─────────────────────────────────────────────────────┐
│  apps/inventory/App.tsx                              │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ @hypercard/engine                                │ │
│  │                                                   │ │
│  │  Shell:  WindowChrome · NavBar · Layouts          │ │
│  │  State:  navigationSlice · notificationsSlice     │ │
│  │  DSL:    Stack<T> · CardRenderer · resolver       │ │
│  │  Theme:  --hc- tokens · Mac System 7 CSS          │ │
│  │                                                   │ │
│  │  Widgets (generic CRUD):                          │ │
│  │    DataTable · FormView · DetailView              │ │
│  │    ListView · ReportView · ChatView               │ │
│  │    MenuGrid · Btn · Chip · Toast · FilterBar      │ │
│  │                                                   │ │
│  │  Extension:  customRenderers · domainHandler      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  Domain (inventory-specific):                        │
│    inventorySlice · salesSlice · chatSlice            │
│    intentEngine · computeHandlers                    │
│    formatters · columnConfigs · computeFields        │
│    domainActionHandler · card overrides              │
└─────────────────────────────────────────────────────┘
```

---

## 7. What Changes in the Original Design Doc

Summary of what each section of doc 01 needs revised:

| Section | What changes |
|---------|-------------|
| **3.1 Module Map** | Split `src/` into `packages/engine/` and `apps/inventory/`. No more flat `features/` and `components/` mixing domain and generic. |
| **5.1 DSL Types** | `Item`, `SaleEntry`, `StackSettings` move to `apps/inventory/domain/types.ts`. `Stack` becomes generic `Stack<TData, TSettings>`. |
| **5.4 Primitives** | Move to `packages/engine/src/components/widgets/`. Keep `--hc-` token prefix. |
| **5.5 Parts Registry** | Single flat `parts.ts` in the engine package covering both widgets and shell. |
| **6.1 Store** | Store assembly moves to `apps/inventory/`. Engine only exports slice reducers. |
| **6.3 Nav Slice** | Stays in engine. No change. |
| **6.4 Inventory Slice** | Moves to `apps/inventory/features/`. |
| **6.5 Sales Slice** | Moves to `apps/inventory/features/`. |
| **6.6 Notifications** | Stays in engine. No change. |
| **6.7 Chat Slice** | Moves to `apps/inventory/features/`. |
| **6.8–6.9 Intent Engine** | Moves to `apps/inventory/features/chat/`. |
| **6.10 Action Bridge** | Split: engine handles navigate/back/toast. Domain handler for inventory verbs is in `apps/inventory/`. |
| **7.1 Tokens** | Single `--hc-` prefix for everything. No mapping layer. |
| **7.3 Base CSS** | One CSS file scoped to `[data-widget="hypercard"]` covering both widget and shell parts. |
| **8.2 Card Stories** | Generic widget stories don't need an RTK store — they use plain props. Shell/app stories need Provider. |
| **9.1 Slots** | `CardSlots.renderCell` type changes from `Item` to generic `T`. |
| **DataTable** | Complete rewrite: accepts `ColumnConfig[]` with format/cellState/renderCell. No hardcoded widths, currencies, or stock coloring. |
| **DetailCard** | Computed fields use `(record) => string` function, not `new Function()`. Highlight is a generic callback. |
| **FormCard** | No `priceCheck` special case. Generic `onSubmit` + `submitResult`. |
| **ReportCard** | No `computeMap`. Accepts pre-computed `{ label, value }[]`. |
| **ChatCard** | No intent engine. Accepts `onSend` callback. App processes messages externally. |

---

## 8. Revised File Structure

```
packages/
  engine/                          # Layer 1 — npm-publishable
    package.json
    src/
      types.ts                     # ColumnConfig, FieldConfig, ComputedFieldConfig, + DSL types
      components/
        widgets/                   # Generic CRUD widgets (no domain knowledge)
          DataTable.tsx            # Generic table with column configs
          FormView.tsx             # Generic form
          DetailView.tsx           # Generic record detail
          ListView.tsx             # DataTable + filters + toolbar + footer
          ReportView.tsx           # Pre-computed label/value sections
          ChatView.tsx             # Messages + send + action chips
          MenuGrid.tsx             # Button grid
          FieldRow.tsx             # Single field (text/number/select/readonly/tags)
          Btn.tsx
          Chip.tsx
          Toast.tsx
          FilterBar.tsx
          index.ts
        shell/                     # Card system + layouts + chrome
          CardRenderer.tsx         # Card type → widget dispatcher (extensible)
          WindowChrome.tsx         # Title bar + close box
          TabBar.tsx
          NavBar.tsx
          LayoutSplit.tsx
          LayoutDrawer.tsx
          LayoutCardChat.tsx
          HyperCardShell.tsx       # Top-level assembly component
          index.ts
        index.ts                   # Re-exports everything
      dsl/
        types.ts                   # Generic Stack<TData, TSettings>, CardDefinition, etc.
        resolver.ts                # matchFilter, resolveValue, interpolateTemplate
      features/
        navigation/
          navigationSlice.ts
          selectors.ts
        notifications/
          notificationsSlice.ts
      app/
        dispatchDSLAction.ts       # Generic bridge with domainHandler extension
        createEngineStore.ts       # Helper to create store with engine slices
      parts.ts                     # Single flat registry: widgets + shell
      styles/
        hypercard.css              # All layout CSS with --hc- tokens (widgets + shell)
        theme-default.css          # Mac System 7 --hc- token values
        theme-dark.css             # CRT terminal variant
        tokens.ts                  # Token name constants
      stories/
        widgets/                   # Widget stories (no store needed, plain props)
          DataTable.stories.tsx
          FormView.stories.tsx
          DetailView.stories.tsx
          ListView.stories.tsx
          Btn.stories.tsx
        shell/                     # Shell stories (need minimal store)
          WindowChrome.stories.tsx
          NavBar.stories.tsx
          LayoutSplit.stories.tsx
        ThemePlayground.stories.tsx

apps/
  inventory/                       # Layer 2 — the specific application
    package.json                   # depends on @hypercard/engine
    src/
      domain/
        types.ts                   # Item, SaleEntry, InventorySettings
        stack.ts                   # The STACK constant
        formatters.ts              # formatCurrency, qtyState, qtyStyle
        columnConfigs.ts           # itemColumns(), salesColumns()
        computeFields.ts           # margin, inventoryValue
        reportCompute.ts           # totalSkus, retailValue, etc.
      features/
        inventory/
          inventorySlice.ts
          selectors.ts
        sales/
          salesSlice.ts
          selectors.ts
        chat/
          chatSlice.ts
          intentEngine.ts
          computeHandlers.ts
      overrides/
        InventoryDetailCard.tsx    # Wires fieldHighlight + inventoryComputedFields
        InventoryFormCard.tsx      # Adds priceCheck submit handler
        InventoryReportCard.tsx    # Provides pre-computed sections
        InventoryChatCard.tsx      # Wires intentEngine to ChatView
        cardRenderers.ts           # Exports customRenderers map
      app/
        store.ts                   # Assembles engine + domain reducers
        hooks.ts
        domainActionHandler.ts     # updateQty, saveItem, etc.
        App.tsx
      main.tsx
    index.html
    vite.config.ts
```

---

## 9. Revised Migration Checklist

### Phase 0: Monorepo Setup (Day 1)
- [ ] Set up Vite monorepo (or Turborepo / npm workspaces)
- [ ] Create `packages/engine/` and `apps/inventory/`
- [ ] Configure shared tsconfig, eslint
- [ ] Verify app can import from engine

### Phase 1: Extract engine (Day 1–3)
- [ ] Define generic types: `ColumnConfig`, `FieldConfig`, `ComputedFieldConfig`, etc.
- [ ] Define generic `Stack<TData, TSettings>` and card types (no `Item`, no `SaleEntry`)
- [ ] Extract DSL resolver (matchFilter, resolveValue) — settings via parameter, no globals
- [ ] Extract DataTable as generic (column configs, rowKey, no hardcoded widths/formatters)
- [ ] Extract FormView as generic (no priceCheck)
- [ ] Extract DetailView as generic (function-based computed fields, generic highlight)
- [ ] Extract ListView, ReportView, ChatView, MenuGrid
- [ ] Extract Btn, Chip, Toast, FilterBar, FieldRow
- [ ] Create navigation slice + notifications slice
- [ ] Create generic `dispatchDSLAction` with `domainHandler` extension
- [ ] Create CardRenderer with `customRenderers` extension
- [ ] Extract WindowChrome, TabBar, NavBar, Layout shells
- [ ] Create HyperCardShell assembly component
- [ ] Create `--hc-` token CSS + theme-default.css + theme-dark.css
- [ ] Single `parts.ts` covering widgets + shell
- [ ] Write widget Storybook stories (no store, plain props)
- [ ] Write shell Storybook stories (minimal store)
- [ ] Verify: engine renders a minimal 2-card stack with no inventory data

### Phase 2: Wire inventory app (Day 3–4)
- [ ] Move STACK constant to `apps/inventory/domain/stack.ts`
- [ ] Create `Item`, `SaleEntry`, `InventorySettings` types
- [ ] Create formatters: `formatCurrency`, `qtyState`, `itemColumns()`
- [ ] Create `inventoryComputedFields` (margin, value)
- [ ] Create `reportCompute` functions (totalSkus, retailValue, etc.)
- [ ] Create inventory, sales, chat RTK slices
- [ ] Create `inventoryActionHandler`
- [ ] Create override components (Detail, Form, Report, Chat)
- [ ] Register overrides as `customRenderers`
- [ ] Assemble store with engine + domain slices
- [ ] Wire App.tsx with HyperCardShell
- [ ] Verify: all 10 original card types render and function identically

### Phase 3: Theme + Storybook Polish (Day 4–5)
- [ ] Verify `theme-default.css` pixel-matches original
- [ ] Verify `theme-dark.css` applies cleanly
- [ ] Verify unstyled mode renders all `data-part` without styles
- [ ] Write inventory-specific stories (with store + mock data)
- [ ] Create ThemePlayground story
- [ ] TypeScript strict, ESLint clean
- [ ] Storybook build passes

### Phase 4: Proof-of-Generality (Day 5)
- [ ] Create a minimal second app (e.g. `apps/todo/`) using only the engine
- [ ] Define a simple Stack with 3 cards (list, detail, form)
- [ ] Verify it works with zero inventory code
- [ ] Document the "build a new app" template

---

*Addendum to HC-001-IMPORT-JSX, produced 2026-02-12.*
