---
Title: V3 Unified Modularization Design and Implementation Plan
Ticket: HC-001-IMPORT-JSX
Status: active
Topics:
    - react
    - storybook
    - theming
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/01-hypercard-modularization-guide-rtk-toolkit-storybook-vite-theming.md
      Note: |-
        V1 source plan consolidated into this V3
        V1 merged into canonical V3
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/02-layer-separation-generic-crud-widgets-vs-hypercard-engine-vs-inventory-app.md
      Note: |-
        V2 layer-separation addendum consolidated into this V3
        V2 merged into canonical V3
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/design/03-osha-style-modularization-audit-report.md
      Note: |-
        Audit findings that informed this merged design
        Audit-informed scoping and deferrals used in V3
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/sources/local/hypercard(4).jsx
      Note: |-
        Baseline source implementation used to inform APIs and scope
        Baseline architecture and behavior reference for V3 planning
ExternalSources: []
Summary: Canonical V3 merged architecture and implementation plan replacing V1/V2, with explicit in-scope and deferred items.
LastUpdated: 2026-02-12T12:55:00-05:00
WhatFor: Implement a fresh modular HyperCard architecture as the new baseline (hard cutoff).
WhenToUse: Use as the only active implementation spec for HC-001.
---


# V3 Unified Modularization Design and Implementation Plan

## 1. Executive Directive

This document is the canonical V3 plan created by merging V1 and V2 into one implementable architecture. V1 and V2 are historical inputs; V3 is the source of truth for implementation.

This is a hard-cut implementation. We are not doing a migration or compatibility bridge from old to new runtime behavior. We are building the new architecture directly, shipping it as the only supported implementation, and retiring the monolith implementation path.

Primary outcomes for V3:

- Package-level separation between reusable engine and inventory app.
- RTK-based state architecture with explicit slices and typed hooks.
- Themeable UI using tokenized CSS and `data-part` contracts.
- Storybook coverage for widgets, shell, and app compositions.
- A concrete implementation workplan with acceptance criteria.

## 2. Scope and Explicit Deferrals

This section applies user-directed scope decisions. The following audit items are explicitly deferred from V3 implementation scope:

- `C1` (doc indexability cleanup of legacy docs) - deferred.
- `C2` (dynamic evaluation hardening) - deferred.
- `C6` (schema versioning/migration pipeline) - deferred.
- `H5` (performance budgets/virtualization/chat retention) - deferred.
- `M5` (migration/cutover/rollback runbook) - skipped by hard-cut strategy.
- `H7` (parity harness and migration-style testing) - deferred by hard-cut strategy.
- `H8` (chat intent rigor and disambiguation quality) - deferred; chat remains example-grade.
- `M4` (engine API governance/semver policy) - deferred.

Important interpretation:

- Deferred does not mean denied forever.
- Deferred means not required to complete V3 implementation.
- V3 should still avoid obvious self-inflicted issues where low effort applies, but no schedule is allocated for the deferred items above.

## 3. Architecture Decision Summary (Merged from V1 + V2)

V3 adopts the V2 separation boundary and V1 technical breadth, then removes overlap/contradictions.

### 3.1 Chosen Layer Model

Two layers only:

1. `@hypercard/engine`
- generic widgets
- generic card runtime
- shell/layout
- generic DSL helpers
- generic RTK slices (navigation, notifications)
- tokenized styling primitives

2. `apps/inventory`
- inventory domain types and stack definition
- inventory/sales/chat slices
- domain action handling
- domain formatter/computation logic
- app-level renderer overrides for domain-specific behavior

### 3.2 Why this model

- Keeps the real reuse seam at engine/app boundary.
- Avoids over-splitting widget package from engine package.
- Preserves the proven card-driven concept while preventing domain contamination in engine components.

### 3.3 Hard-Cut principle

- No dual runtime.
- No legacy branch in production architecture.
- New codebase is built as the single runtime target.

## 4. Canonical Repository Structure (V3)

```text
packages/
  engine/
    src/
      app/
        dispatchDSLAction.ts
      components/
        widgets/
          Btn.tsx
          Chip.tsx
          Toast.tsx
          DataTable.tsx
          FilterBar.tsx
          FieldRow.tsx
          MenuGrid.tsx
          ListView.tsx
          DetailView.tsx
          FormView.tsx
          ReportView.tsx
          ChatView.tsx
          index.ts
        shell/
          WindowChrome.tsx
          TabBar.tsx
          NavBar.tsx
          LayoutSplit.tsx
          LayoutDrawer.tsx
          LayoutCardChat.tsx
          CardRenderer.tsx
          HyperCardShell.tsx
          index.ts
      dsl/
        types.ts
        resolver.ts
      features/
        navigation/
          navigationSlice.ts
          selectors.ts
        notifications/
          notificationsSlice.ts
          selectors.ts
      styles/
        tokens.ts
        theme-default.css
        theme-dark.css
        hypercard.css
      parts.ts
      index.ts

apps/
  inventory/
    src/
      app/
        store.ts
        hooks.ts
        App.tsx
        domainActionHandler.ts
      domain/
        types.ts
        stack.ts
        columnConfigs.ts
        formatters.ts
        computeFields.ts
        reportCompute.ts
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
          selectors.ts
      overrides/
        InventoryDetailCard.tsx
        InventoryFormCard.tsx
        InventoryReportCard.tsx
        InventoryChatCard.tsx
        cardRenderers.ts
      stories/
        app/
        domain/
        overrides/
      main.tsx
```

## 5. DSL and Type System Design

V3 keeps the declarative stack-driven model but tightens typings where implementation value is high and effort is low.

### 5.1 Engine-side generic stack typing

```ts
export interface StackSettings {
  [key: string]: unknown;
}

export interface StackData {
  [tableName: string]: Record<string, unknown>[];
}

export interface Stack<TData extends StackData = StackData, TSettings extends StackSettings = StackSettings> {
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

### 5.2 Card and widget-level interfaces

V3 keeps the strong generic widget contracts from V2:

- `ColumnConfig<T>`
- `FieldConfig`
- `ComputedFieldConfig<T>`
- `FilterConfig`
- `ActionConfig`
- `FooterConfig`

These contracts eliminate hardcoded inventory assumptions from engine components.

### 5.3 Action typing strategy for V3

Although several hardening items are deferred, V3 still uses discriminated action unions for core app safety because it is directly relevant to implementation clarity.

```ts
type NavigateAction = { type: 'navigate'; card: string; paramValue?: string };
type BackAction = { type: 'back' };
type ToastAction = { type: 'toast'; message: string };

type UpdateQtyAction = { type: 'updateQty'; sku: string; delta: number };
type SaveItemAction = { type: 'saveItem'; sku: string; edits: Record<string, unknown> };
type DeleteItemAction = { type: 'deleteItem'; sku: string };
type CreateItemAction = { type: 'createItem'; values: Record<string, unknown> };
type ReceiveStockAction = { type: 'receiveStock'; values: { sku: string; qty: number } };
type AiSendAction = { type: 'aiSend'; text: string };

type DSLAction =
  | NavigateAction
  | BackAction
  | ToastAction
  | UpdateQtyAction
  | SaveItemAction
  | DeleteItemAction
  | CreateItemAction
  | ReceiveStockAction
  | AiSendAction;
```

### 5.4 Expression evaluation decision (deferred item C2)

V3 keeps computed-field expression support as implementation-compatible behavior (deferred hardening). We will not re-architect expression runtime in this phase.

Practical implication:
- `DetailCard` computed behavior remains functionally close to current concept.
- Security hardening for expression execution is tracked for post-V3.

## 6. State Management Model (RTK)

V3 state composition is explicit and aligned with the two-layer architecture.

### 6.1 Engine slices

Engine owns only generic slices:

- `navigation`
  - `layout`
  - `stack`
- `notifications`
  - `toast`

### 6.2 Inventory app slices

Inventory app owns domain slices:

- `inventory`
  - `items`
- `sales`
  - `log`
- `chat`
  - `messages`

### 6.3 Store assembly

```ts
export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    notifications: notificationsReducer,
    inventory: inventoryReducer,
    sales: salesReducer,
    chat: chatReducer,
  },
});
```

### 6.4 Selector strategy

- Engine selectors stay generic and domain-agnostic.
- App selectors can encode domain semantics.
- Cross-slice selectors live in app layer to avoid contamination.

## 7. Action Dispatch Architecture

V3 uses a split dispatch model.

### 7.1 Engine dispatcher responsibility

`dispatchDSLAction` in engine handles only generic actions:

- `navigate`
- `back`
- `toast`

All unknown actions are delegated to app-level domain handler.

### 7.2 Domain action handler responsibility

`inventoryActionHandler` handles:

- `updateQty`
- `saveItem`
- `deleteItem`
- `createItem`
- `receiveStock`
- app-specific action verbs if later added

### 7.3 Error handling policy

- Unknown action type logs warning in dev.
- Domain handler returns boolean handled status.
- UI remains responsive even when action is unhandled.

### 7.4 Hard-cut simplification

Because no migration path exists, we do not maintain compatibility wrappers for old action payload formats.

## 8. UI Component Architecture

V3 unifies V1 component extraction and V2 genericity constraints.

### 8.1 Widget layer (engine)

Reusable widgets:

- primitives: `Btn`, `Chip`, `Toast`
- data/input: `DataTable`, `FilterBar`, `FieldRow`
- card-level views: `MenuGrid`, `ListView`, `DetailView`, `FormView`, `ReportView`, `ChatView`

Key rules:

- no inventory-specific conditionals
- no global stack references
- no knowledge of SKU, price, qty semantics

### 8.2 Shell layer (engine)

Shell components:

- `WindowChrome`
- `TabBar`
- `NavBar`
- `LayoutSplit`
- `LayoutDrawer`
- `LayoutCardChat`
- `CardRenderer`
- `HyperCardShell`

Responsibilities:

- layout orchestration
- card renderer dispatch
- navigation chrome
- applying styling scope root

### 8.3 Override model (inventory app)

App overrides are used when domain behavior is necessary:

- `InventoryDetailCard` for inventory-specific computed/field highlighting
- `InventoryFormCard` for price-check and specialized form behavior
- `InventoryReportCard` for inventory compute sections
- `InventoryChatCard` for example intent engine integration

`cardRenderers.ts` registers overrides into engine `customRenderers` map.

## 9. Theming and Styling System

V3 keeps one token namespace and one part registry strategy.

### 9.1 Token strategy

Namespace: `--hc-*`

Token groups:

- colors
- typography
- spacing
- borders
- shadows
- layout sizing

### 9.2 Scope strategy

All selectors scoped to root:

```css
:where([data-widget="hypercard"]) { ... }
```

This avoids global bleed while keeping selectors straightforward.

### 9.3 Parts registry

`parts.ts` remains a single source of truth for `data-part` names used by widgets and shell.

### 9.4 Themes

- `theme-default.css` reproduces current retro visual language.
- `theme-dark.css` remains optional variant.

### 9.5 Styling decisions retained

- single shared token prefix (`--hc-`)
- no separate widget-prefix token translation layer
- `data-part` contract stability prioritized over CSS abstraction complexity

## 10. Storybook Architecture

V3 keeps Storybook as a development and review tool, not as a migration parity tool.

### 10.1 Story organization

Engine stories:

- widget stories (pure props)
- shell stories (minimal mocked store/context)

Inventory app stories:

- domain formatters/column configs
- override components
- integrated app shells with fixture store

### 10.2 Story quality requirements

For each major component:

- default state
- edge/empty state
- interaction state
- variant state (where applicable)

### 10.3 Store isolation

Each integrated story should instantiate its own fixture store.

### 10.4 Deferred chat rigor

Chat stories are expected to be illustrative. Intent disambiguation depth is out-of-scope in V3 per scope directive.

## 11. Detailed V3 Implementation Plan

This section is implementation-operational, not conceptual.

### 11.1 Phase A: Workspace and scaffolding

Deliverables:

- workspace structure with `packages/engine` and `apps/inventory`
- base TypeScript setup
- Vite setup for app
- Storybook setup for engine and/or inventory app entry

Tasks:

1. Create folder structure and base package manifests.
2. Configure TS path aliases for internal imports.
3. Set up linting baseline for TypeScript + React.
4. Verify both app dev server and Storybook run.

Acceptance criteria:

- `npm run dev` works for inventory app.
- `npm run storybook` works for selected package.
- TypeScript compiles across both package layers.

### 11.2 Phase B: Engine widget extraction

Deliverables:

- functional generic widgets with typed props
- no direct domain imports

Tasks:

1. Implement primitives (`Btn`, `Chip`, `Toast`).
2. Implement `DataTable` with `ColumnConfig`.
3. Implement `FilterBar`, `FieldRow`.
4. Implement `ListView`, `DetailView`, `FormView`, `ReportView`, `ChatView`, `MenuGrid`.
5. Add story coverage for each widget.

Acceptance criteria:

- Widgets render with pure fixture data.
- No import from inventory domain paths.
- Stories compile and visually load.

### 11.3 Phase C: Engine shell and runtime

Deliverables:

- navigation shell components
- card renderer runtime
- generic dispatch bridge

Tasks:

1. Implement `WindowChrome`, `TabBar`, `NavBar`.
2. Implement layout variants.
3. Implement `CardRenderer` + `customRenderers` extension point.
4. Implement engine slices and selectors.
5. Implement generic `dispatchDSLAction`.
6. Implement `HyperCardShell` assembly.

Acceptance criteria:

- A minimal sample stack renders and navigates.
- Generic actions (`navigate`, `back`, `toast`) function end-to-end.
- Shell stories run.

### 11.4 Phase D: Inventory domain implementation

Deliverables:

- app domain model
- app slices
- domain action handling
- renderer overrides

Tasks:

1. Define inventory domain types and stack file.
2. Implement inventory/sales/chat slices.
3. Implement domain selectors.
4. Implement `domainActionHandler`.
5. Implement domain formatters and computed helpers.
6. Implement override card components.
7. Register override renderers and mount app.

Acceptance criteria:

- Core inventory flows work in app runtime.
- Navigation and toasts function via engine+app composition.
- Override paths render correctly for detail/form/report/chat cards.

### 11.5 Phase E: Styling and theming integration

Deliverables:

- token file
- default and dark themes
- scoped component CSS

Tasks:

1. Implement `tokens.ts`.
2. Implement `theme-default.css` and `theme-dark.css`.
3. Implement `hypercard.css` with part-based selectors.
4. Attach `data-part` attributes consistently.
5. Verify default visual coherence.

Acceptance criteria:

- App renders with expected visual style under default theme.
- Dark theme toggles without structural breakage.

### 11.6 Phase F: Storybook completion

Deliverables:

- complete story map for critical widgets and shell
- inventory app composition stories

Tasks:

1. Finish widget stories.
2. Finish shell stories.
3. Add inventory override stories.
4. Add theme playground story.

Acceptance criteria:

- All planned stories compile.
- Team can review components in isolation without app boot.

### 11.7 Phase G: Final hard-cut shipping

Deliverables:

- V3 implementation merged and designated as only implementation path

Tasks:

1. Remove monolith implementation path from active runtime.
2. Update docs/readme to point to V3 structure.
3. Confirm build and smoke checks.

Acceptance criteria:

- One implementation path exists.
- Build passes and runtime is usable for intended scope.

## 12. V3 Testing Plan (Hard-Cut, Non-Migration)

Since migration/parity harness work is out-of-scope, V3 testing is implementation-focused.

### 12.1 Required tests

- Unit tests:
  - reducers
  - selectors
  - formatters/computations
  - action-handler branches
- Component tests:
  - key widget rendering
  - shell navigation interactions
- Integration smoke tests:
  - browse -> detail -> save -> back
  - create item
  - receive stock
  - open report

### 12.2 Storybook as visual validation

- Use Storybook to inspect component states quickly.
- Keep manual visual review checklist for default theme fidelity.

### 12.3 Deferred tests

Per scope directives, the following are deferred:

- migration parity harness
- migration rollback tests
- deep chat intent quality benchmarks
- high-scale performance benchmarks

## 13. Detailed Component and API Contracts

### 13.1 DataTable contract

```ts
interface DataTableProps<T> {
  items: T[];
  columns: ColumnConfig<T>[];
  rowKey?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}
```

Behavior notes:

- No hardcoded column meanings.
- Formatting, state tagging, and rendering controlled via column config.

### 13.2 ListView contract

```ts
interface ListViewProps<T> {
  items: T[];
  columns: ColumnConfig<T>[];
  filters?: FilterConfig[];
  searchFields?: string[];
  toolbar?: ActionConfig[];
  footer?: FooterConfig;
  preFilter?: (items: T[]) => T[];
  onRowClick?: (row: T) => void;
  onAction?: (action: unknown) => void;
}
```

### 13.3 DetailView contract

```ts
interface DetailViewProps<T> {
  record: T;
  fields: FieldConfig[];
  computed?: ComputedFieldConfig<T>[];
  edits: Record<string, unknown>;
  onEdit: (id: string, value: unknown) => void;
  actions?: ActionConfig[];
  onAction?: (action: unknown) => void;
  fieldHighlight?: (fieldId: string, value: unknown, record: T) => React.CSSProperties | undefined;
}
```

### 13.4 FormView contract

```ts
interface FormViewProps {
  fields: FieldConfig[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
  onSubmit: (values: Record<string, unknown>) => void;
  submitResult?: string | null;
  submitLabel?: string;
  submitVariant?: 'default' | 'primary' | 'danger';
}
```

### 13.5 ChatView contract

```ts
interface ChatViewProps {
  messages: ChatMessage[];
  suggestions?: string[];
  onSend: (text: string) => void;
  onAction: (action: unknown) => void;
  renderResults?: (results: unknown[]) => React.ReactNode;
  placeholder?: string;
  welcome?: string;
}
```

Chat behavior quality is intentionally not deeply hardened in V3 (scope deferral H8).

## 14. Risks and Mitigations (In-Scope Only)

### Risk 1: Engine/app boundary erosion during implementation

Mitigation:
- code review rule: engine files cannot import app/domain paths
- PR template checklist includes boundary check

### Risk 2: Action payload inconsistency causing runtime bugs

Mitigation:
- discriminated action union
- strict typing in handler function signatures

### Risk 3: Theming contract drift due missing `data-part` attributes

Mitigation:
- include `data-part` review checklist in every component PR
- keep `parts.ts` as authoritative enum

### Risk 4: Overgrown override components duplicating engine logic

Mitigation:
- keep overrides thin
- if repeated override patterns appear, promote extension points in engine

### Risk 5: Scope creep into deferred items

Mitigation:
- enforce explicit out-of-scope section in sprint planning
- defer tickets for C1/C2/C6/H5/H7/H8/M4/M5 tracking

## 15. Delivery Checklist (V3)

The following checklist defines completion for this design:

- [ ] Engine package compiles independently.
- [ ] Inventory app composes engine with domain slices and render overrides.
- [ ] Core inventory flows execute in runtime.
- [ ] Storybook contains widget, shell, and app-level stories.
- [ ] Theme default + dark are usable and scoped.
- [ ] Monolith runtime path is retired from active implementation.
- [ ] Documentation points to V3 as canonical plan.

## 16. V3 Canonicalization Notes

V3 supersedes V1 and V2 for implementation.

- V1 remains historical background for technical breadth.
- V2 remains historical background for layer separation rationale.
- Implementation teams should not cherry-pick contradictory guidance from V1/V2 once V3 exists.

If there is any conflict between documents, V3 wins.

## 17. Immediate Next Execution Sequence

First execution block after approving V3:

1. Scaffold repo package layout and dev tooling.
2. Implement engine primitives + `DataTable` + stories.
3. Implement engine shell runtime + generic dispatch.
4. Implement inventory domain slices and action handler.
5. Implement card overrides and app assembly.
6. Apply theming and finalize Storybook.
7. Remove monolith runtime path and ship hard-cut V3.

This sequence is intentionally direct and avoids migration overhead.

---

This document is the V3 merged design and implementation plan for `HC-001-IMPORT-JSX`.

## Appendix A: File-by-File Implementation Blueprint

This appendix defines the practical order to build V3 so dependencies remain stable and review load stays manageable.

### A.1 Engine bootstrap files

1. `packages/engine/src/index.ts`
- re-export stable symbols from `widgets`, `shell`, `dsl`, `features`, `styles`, and dispatcher.

2. `packages/engine/src/parts.ts`
- define complete `PARTS` constant
- export `PartName` union

3. `packages/engine/src/styles/tokens.ts`
- define `TOKENS` constant
- keep names stable and string literal typed

### A.2 Engine widget files (strict order)

Build in this order to reduce cascading type errors:

1. `Btn.tsx`
2. `Chip.tsx`
3. `Toast.tsx`
4. `FieldRow.tsx`
5. `FilterBar.tsx`
6. `DataTable.tsx`
7. `MenuGrid.tsx`
8. `ListView.tsx`
9. `DetailView.tsx`
10. `FormView.tsx`
11. `ReportView.tsx`
12. `ChatView.tsx`
13. `widgets/index.ts`

### A.3 Engine shell files

1. `WindowChrome.tsx`
2. `TabBar.tsx`
3. `NavBar.tsx`
4. `LayoutSplit.tsx`
5. `LayoutDrawer.tsx`
6. `LayoutCardChat.tsx`
7. `CardRenderer.tsx`
8. `HyperCardShell.tsx`
9. `shell/index.ts`

### A.4 Engine state/runtime files

1. `features/navigation/navigationSlice.ts`
2. `features/navigation/selectors.ts`
3. `features/notifications/notificationsSlice.ts`
4. `features/notifications/selectors.ts`
5. `dsl/types.ts`
6. `dsl/resolver.ts`
7. `app/dispatchDSLAction.ts`

### A.5 Inventory app files

1. `domain/types.ts`
2. `domain/stack.ts`
3. `features/inventory/inventorySlice.ts`
4. `features/sales/salesSlice.ts`
5. `features/chat/chatSlice.ts`
6. `domain/formatters.ts`
7. `domain/columnConfigs.ts`
8. `domain/computeFields.ts`
9. `domain/reportCompute.ts`
10. `app/domainActionHandler.ts`
11. `overrides/*.tsx`
12. `overrides/cardRenderers.ts`
13. `app/store.ts`
14. `app/hooks.ts`
15. `app/App.tsx`
16. `main.tsx`

### A.6 Storybook files

Engine-first story order:

1. primitives
2. `DataTable`
3. `ListView`
4. `DetailView`
5. `FormView`
6. `ReportView`
7. `ChatView`
8. shell stories

Then app-level stories:

1. formatter stories
2. override stories
3. integrated app stories

## Appendix B: Reference Code Skeletons

These are intentionally compact scaffolds that implementation can use directly.

### B.1 CardRenderer scaffold

```tsx
export function CardRenderer({ cardId, cardDef, context, customRenderers }: CardRendererProps) {
  const custom = customRenderers?.[cardDef.type];
  if (custom) {
    const result = custom(cardDef, context);
    if (result !== null) return result;
  }

  switch (cardDef.type) {
    case 'menu':
      return <MenuGrid card={cardDef} onAction={context.dispatch} />;
    case 'list':
      return <ListCardView card={cardDef} context={context} />;
    case 'detail':
      return <DetailCardView card={cardDef} context={context} />;
    case 'form':
      return <FormCardView card={cardDef} context={context} />;
    case 'report':
      return <ReportCardView card={cardDef} context={context} />;
    case 'chat':
      return <ChatCardView card={cardDef} context={context} />;
    default:
      return <div data-part="card">Unknown type: {(cardDef as any).type}</div>;
  }
}
```

### B.2 Domain action handler scaffold

```ts
export const inventoryActionHandler: DomainActionHandler = (action, dispatch, getState) => {
  switch (action.type) {
    case 'updateQty': {
      dispatch(updateQty({ sku: action.sku, delta: action.delta }));
      dispatch(showToast(`${action.delta > 0 ? '+' : ''}${action.delta} qty for ${action.sku}`));
      return true;
    }
    case 'saveItem': {
      dispatch(saveItem({ sku: action.sku, edits: action.edits }));
      dispatch(showToast(`Saved ${action.sku}`));
      return true;
    }
    case 'deleteItem': {
      dispatch(deleteItem({ sku: action.sku }));
      dispatch(goBack());
      dispatch(showToast(`Deleted ${action.sku}`));
      return true;
    }
    case 'createItem': {
      dispatch(createItem(action.values as any));
      dispatch(showToast(`Created ${(action.values as any).sku}`));
      return true;
    }
    case 'receiveStock': {
      const sku = action.values.sku;
      const qty = Number(action.values.qty);
      dispatch(receiveStock({ sku, qty }));
      dispatch(showToast(`Received +${qty} for ${sku}`));
      return true;
    }
    default:
      return false;
  }
};
```

### B.3 DataTable scaffold

```tsx
export function DataTable<T extends Record<string, unknown>>({
  items,
  columns,
  rowKey,
  onRowClick,
  emptyMessage,
}: DataTableProps<T>) {
  const template = columns
    .map((c) => (typeof c.width === 'number' ? `${c.width}px` : c.width ?? '1fr'))
    .join(' ');

  const keyFor = (row: T, index: number) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (typeof rowKey === 'string') return String(row[rowKey]);
    return String(row['id'] ?? index);
  };

  return (
    <div data-part="data-table">
      <div data-part="table-header" style={{ display: 'grid', gridTemplateColumns: template }}>
        {columns.map((c) => (
          <span key={c.key}>{c.label ?? c.key}</span>
        ))}
      </div>

      {items.length === 0 && <div data-part="status-bar">{emptyMessage ?? 'No results'}</div>}

      {items.map((row, i) => (
        <div
          key={keyFor(row, i)}
          data-part="table-row"
          style={{ display: 'grid', gridTemplateColumns: template }}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((c) => {
            const raw = row[c.key];
            const state = c.cellState?.(raw, row);
            const style = c.cellStyle?.(raw, row);
            const rendered = c.renderCell
              ? c.renderCell(raw, row)
              : c.format
              ? c.format(raw, row)
              : String(raw ?? '');

            return (
              <span key={c.key} data-part="table-cell" data-state={state} style={style}>
                {rendered}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

### B.4 HyperCardShell scaffold

```tsx
export function HyperCardShell({
  stack,
  domainActionHandler,
  customRenderers,
}: HyperCardShellProps) {
  const dispatch = useAppDispatch();
  const layout = useAppSelector(selectLayout);
  const current = useAppSelector(selectCurrentNav);
  const toast = useAppSelector(selectToast);
  const data = useAppSelector(selectStackData);

  const dslDispatch = useCallback(
    (action: DSLAction) => dispatchDSLAction(dispatch, action, domainActionHandler),
    [dispatch, domainActionHandler],
  );

  const cardDef = stack.cards[current.card];

  return (
    <WindowChrome>
      <TabBar />
      <LayoutResolver
        layout={layout}
        renderMain={() => (
          <CardRenderer
            cardId={current.card}
            cardDef={cardDef}
            context={{ data, settings: stack.settings, dispatch: dslDispatch, paramValue: current.param }}
            customRenderers={customRenderers}
          />
        )}
      />
      {toast && <Toast message={toast} onDone={() => dispatch(clearToast())} />}
    </WindowChrome>
  );
}
```

## Appendix C: Implementation Work Packages (Detailed)

### WP-1 Engine Foundation

Scope:
- setup engine package + exports
- primitives + parts registry + tokens

Output:
- package compiles
- first Storybook primitive stories visible

Review focus:
- typing correctness
- no app-layer imports

### WP-2 Generic Data and Form Widgets

Scope:
- `DataTable`, `FilterBar`, `FieldRow`, `FormView`, `DetailView`, `ListView`

Output:
- data-centric UI kit usable outside inventory domain

Review focus:
- generic API quality
- callback correctness
- predictable render behavior

### WP-3 Shell Runtime

Scope:
- chrome, layouts, `CardRenderer`, `HyperCardShell`
- navigation and notifications slices

Output:
- minimal stack runtime with generic actions

Review focus:
- routing state transitions
- action bridge behavior

### WP-4 Inventory Domain Wiring

Scope:
- domain types + stack
- inventory/sales/chat slices
- domain action handler

Output:
- app domain runtime operational

Review focus:
- action semantics
- cross-slice access patterns

### WP-5 Domain Overrides

Scope:
- specialized detail/form/report/chat wrappers
- renderer registration

Output:
- inventory-specific UX behavior layered on generic runtime

Review focus:
- override thinness
- no forked engine internals

### WP-6 Styling and Theme

Scope:
- default theme + dark theme + full part-based CSS

Output:
- coherent themed UI with predictable token usage

Review focus:
- selector stability
- missing `data-part` coverage

### WP-7 Storybook and Verification

Scope:
- complete story coverage for widget/shell/app

Output:
- reviewable component catalog and integration snapshots

Review focus:
- story isolation
- edge states

### WP-8 Hard-Cut Finalization

Scope:
- remove old runtime path
- update docs and references

Output:
- V3 becomes only implementation path

Review focus:
- no residual imports of monolith runtime
- docs consistently reference V3

## Appendix D: Day-by-Day Execution Plan

### Day 1

- scaffold package structure
- TS config and build scripts
- engine primitives and part registry

Success markers:
- engine package builds
- primitive stories render

### Day 2

- build `DataTable`, `FieldRow`, `FilterBar`, `ListView`
- wire base styles for those parts

Success markers:
- list and table stories cover default/empty/clickable states

### Day 3

- build `DetailView`, `FormView`, `ReportView`, `ChatView`, `MenuGrid`
- complete widget exports

Success markers:
- all widgets compile and stories pass

### Day 4

- build shell components and runtime slices
- implement `CardRenderer` and `HyperCardShell`

Success markers:
- generic sample stack runs

### Day 5

- implement inventory domain slices and selectors
- implement domain action handler
- wire store and app root

Success markers:
- browse/detail/edit/create/receive actions working

### Day 6

- implement domain override components
- register custom renderers
- finalize theming integration

Success markers:
- inventory-specific cards render correctly

### Day 7

- complete Storybook app-level stories
- cleanup docs
- hard-cut old runtime path

Success markers:
- single runtime path, docs updated, smoke checks pass

## Appendix E: Pull Request Plan

To keep review quality high, split implementation into these PRs:

1. `PR-1 engine scaffold + primitives + tokens`
2. `PR-2 engine data/form widgets`
3. `PR-3 engine shell + slices + dispatcher`
4. `PR-4 inventory domain slices + store`
5. `PR-5 inventory overrides + app assembly`
6. `PR-6 styles + themes`
7. `PR-7 Storybook completion + hard-cut cleanup`

Each PR must include:

- scope statement
- changed files list
- manual test steps
- screenshot/story links when UI touched

## Appendix F: Out-of-Scope Backlog Tickets (Deferred)

Create follow-up ticket placeholders now so deferred scope does not disappear:

- `HC-00X-C1-DOC-INDEX-HYGIENE`
- `HC-00X-C2-EXPR-HARDENING`
- `HC-00X-C6-SCHEMA-VERSIONING`
- `HC-00X-H5-PERFORMANCE-SCALING`
- `HC-00X-H7-PARITY-HARNESS`
- `HC-00X-H8-CHAT-QUALITY`
- `HC-00X-M4-ENGINE-API-GOVERNANCE`

This keeps V3 delivery focused while preserving clarity about deferred work.
