---
Title: ""
Ticket: ""
Status: ""
Topics: []
DocType: ""
Intent: ""
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/sources/local/hypercard(4).jsx
      Note: Monolithic JSX source – all components and state
    - Path: ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/sources/local/hypercard-dev-guide.md
      Note: Original dev guide – DSL architecture reference
ExternalSources: []
Summary: ""
LastUpdated: 0001-01-01T00:00:00Z
WhatFor: ""
WhenToUse: ""
---


# HyperCard Modularization Guide

## RTK Toolkit · Storybook · Vite · Themeable Architecture

> Superseded for implementation by V3:
> `design/04-v3-unified-modularization-design-and-implementation-plan.md`
> Keep this document as historical reference only.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Target Architecture Overview](#3-target-architecture-overview)
4. [Phase 1 – Vite Project Scaffold](#4-phase-1--vite-project-scaffold)
5. [Phase 2 – Module Extraction & File Structure](#5-phase-2--module-extraction--file-structure)
6. [Phase 3 – RTK Toolkit State Management](#6-phase-3--rtk-toolkit-state-management)
7. [Phase 4 – Themeable Design System](#7-phase-4--themeable-design-system)
8. [Phase 5 – Storybook Integration](#8-phase-5--storybook-integration)
9. [Phase 6 – Advanced Patterns](#9-phase-6--advanced-patterns)
10. [Migration Checklist](#10-migration-checklist)
11. [Appendix: Component API Reference](#11-appendix-component-api-reference)

---

## 1. Executive Summary

The HyperCard application is a DSL-driven inventory management UI that renders a complete application from a JSON "Stack" definition. It currently lives in a **single JSX file (~900 lines)** with:

- All state in `useState` hooks inside one root component
- A manual `dispatch` switch statement for all actions
- All styling as inline JavaScript objects
- No build tooling, routing, or component isolation

This guide describes a phased modularization into:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Build** | Vite | Fast dev server, HMR, optimized production builds |
| **State** | Redux Toolkit (RTK) | Centralized state with slices, typed actions, selectors |
| **Components** | React + TypeScript | Typed, modular components with `data-part` styling hooks |
| **Theming** | CSS Variables + `data-part` | Token-based visual customization, unstyled mode |
| **Documentation** | Storybook | Visual component catalog, theme playground, QA |

**Guiding principles:**
- Preserve all existing behavior during extraction (no behavior changes in Phase 1–3)
- Keep the DSL-driven architecture — the STACK object remains the source of truth
- Make theming additive — the default theme should reproduce the exact current look
- Each phase is independently shippable and testable

---

## 2. Current Architecture Analysis

### 2.1 File Layout (monolith)

```
hypercard(4).jsx
├── Lines 1–180:    STACK constant (DSL definition)
│   ├── settings, data tables (items, salesLog)
│   ├── cards{} — 10 card definitions (menu, list, detail, form, chat, report)
│   └── ai{} — 10 intents + fallback
├── Lines 181–210:  Theme constants (T, B, font) + Btn, Chip
├── Lines 211–270:  Utilities (matchFilter, resolveValue) + DataTable + Toast
├── Lines 271–620:  Card renderers (MenuCard, ListCard, DetailCard, FormCard, ReportCard, ChatCard)
├── Lines 621–700:  Layout shells (NavBar, LayoutSplit, LayoutDrawer, LayoutCardChat)
└── Lines 701–800:  HyperCardEngine (root component: state, dispatch, renderCard)
```

### 2.2 State Shape (implicit)

Currently scattered across multiple `useState` calls in `HyperCardEngine`:

```typescript
// Implicit state shape
{
  layout: "split" | "drawer" | "cardChat",
  navStack: Array<{ card: string; param?: string }>,
  data: {
    items: Item[],
    salesLog: SaleEntry[],
  },
  toast: string | null,
}
```

Additional local state in card components:
- `ListCard`: `filters`, `sortCol`, `sortDir`
- `DetailCard`: `edits`
- `FormCard`: `values`, `result`
- `ChatCard`: `msgs`, `input`
- `LayoutDrawer`: `open`

### 2.3 Action Types (10 total)

| Action | Payload | Reducer Logic |
|--------|---------|---------------|
| `navigate` | `{ card, paramValue }` | Push onto navStack |
| `back` | — | Pop navStack |
| `toast` | `{ message }` | Set toast string |
| `updateQty` | `{ sku, delta }` | Map items, clamp qty to 0 |
| `saveItem` | `{ sku, edits }` | Merge edits into item |
| `deleteItem` | `{ sku }` | Filter items, pop nav |
| `createItem` | `{ values }` | Append to items |
| `receiveStock` | `{ values: { sku, qty } }` | Find item by SKU (case-insensitive), add qty |
| `priceCheck` | `{ values: { sku } }` | Inline lookup (no state change) |
| `aiSend` | `{ text }` | Handled in ChatCard, no global state |

### 2.4 Component Dependency Graph

```
HyperCardEngine
├── LayoutSplit / LayoutDrawer / LayoutCardChat
│   ├── NavBar
│   │   └── Btn
│   ├── renderCard() →
│   │   ├── MenuCard → Btn
│   │   ├── ListCard → DataTable, Btn
│   │   ├── DetailCard → Btn
│   │   ├── FormCard → Btn
│   │   ├── ReportCard → Btn
│   │   └── ChatCard → DataTable, Chip, Btn
│   └── ChatCard (in Split/Drawer panels)
└── Toast
```

### 2.5 Pain Points for Modularization

1. **Tight coupling to `STACK` global**: Card renderers reference `STACK.settings` directly (e.g., `STACK.settings.lowStockThreshold` in DataTable qty coloring)
2. **`new Function()` in DetailCard**: Computed fields use dynamic evaluation — security risk, not type-safe
3. **ChatCard processInput**: 6 compute handlers + query resolution all inline (~80 lines)
4. **No TypeScript**: All types are implicit; DSL schema has no validation
5. **Inline styles everywhere**: ~200 style objects scattered across components

---

## 3. Target Architecture Overview

### 3.1 High-Level Module Map

```
src/
├── app/                          # Application shell
│   ├── App.tsx                   # Root component
│   ├── store.ts                  # RTK store configuration
│   └── hooks.ts                  # Typed useAppDispatch, useAppSelector
│
├── features/                     # Feature slices (RTK)
│   ├── navigation/
│   │   ├── navigationSlice.ts    # navStack + layout state
│   │   └── selectors.ts
│   ├── inventory/
│   │   ├── inventorySlice.ts     # items CRUD
│   │   ├── selectors.ts
│   │   └── thunks.ts             # (future: API persistence)
│   ├── sales/
│   │   ├── salesSlice.ts         # salesLog state
│   │   └── selectors.ts
│   ├── notifications/
│   │   └── notificationsSlice.ts # toast state
│   └── chat/
│       ├── chatSlice.ts          # messages, intent processing
│       ├── intentEngine.ts       # Extracted AI intent matching
│       └── computeHandlers.ts    # Extracted compute functions
│
├── dsl/                          # DSL schema & runtime
│   ├── types.ts                  # TypeScript types for STACK, Card, Intent, etc.
│   ├── stack.ts                  # The STACK constant (typed)
│   ├── resolver.ts               # resolveValue, matchFilter, expression eval
│   └── validation.ts             # (future: runtime schema validation)
│
├── components/                   # Presentational UI components
│   ├── primitives/
│   │   ├── Btn.tsx
│   │   ├── Chip.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── data-display/
│   │   ├── DataTable.tsx
│   │   └── index.ts
│   ├── cards/
│   │   ├── MenuCard.tsx
│   │   ├── ListCard.tsx
│   │   ├── DetailCard.tsx
│   │   ├── FormCard.tsx
│   │   ├── ReportCard.tsx
│   │   ├── ChatCard.tsx
│   │   ├── CardRenderer.tsx      # renderCard dispatcher
│   │   └── index.ts
│   ├── layouts/
│   │   ├── NavBar.tsx
│   │   ├── LayoutSplit.tsx
│   │   ├── LayoutDrawer.tsx
│   │   ├── LayoutCardChat.tsx
│   │   ├── WindowChrome.tsx      # Title bar + tabs
│   │   └── index.ts
│   └── parts.ts                  # data-part name constants
│
├── styles/                       # CSS theming system
│   ├── hypercard.css             # Base layout using data-part + tokens
│   ├── theme-default.css         # Default Mac System 7 token values
│   ├── theme-dark.css            # Example dark theme
│   └── tokens.ts                 # Token name constants (for Storybook controls)
│
├── stories/                      # Storybook stories
│   ├── primitives/
│   │   ├── Btn.stories.tsx
│   │   ├── Chip.stories.tsx
│   │   └── Toast.stories.tsx
│   ├── data-display/
│   │   └── DataTable.stories.tsx
│   ├── cards/
│   │   ├── MenuCard.stories.tsx
│   │   ├── ListCard.stories.tsx
│   │   ├── DetailCard.stories.tsx
│   │   ├── FormCard.stories.tsx
│   │   ├── ReportCard.stories.tsx
│   │   └── ChatCard.stories.tsx
│   ├── layouts/
│   │   └── LayoutSplit.stories.tsx
│   └── themes/
│       └── ThemePlayground.stories.tsx
│
├── main.tsx                      # Vite entry point
└── vite-env.d.ts                 # Vite TypeScript env
```

### 3.2 Data Flow (RTK)

```
User Action → Component onClick
  → dispatch(actionCreator(payload))
    → RTK Slice Reducer (immutable update via Immer)
      → Store updated
        → useAppSelector re-renders affected components
```

Compared to current:
```
User Action → Component onClick
  → dispatch({ type, ...payload })         ← manual object
    → switch(action.type) in HyperCardEngine  ← manual switch
      → setState(...)                         ← manual immutable update
```

---

## 4. Phase 1 – Vite Project Scaffold

### 4.1 Initialize

```bash
npm create vite@latest hypercard-react -- --template react-ts
cd hypercard-react
npm install
```

### 4.2 Dependencies

```bash
# Core
npm install @reduxjs/toolkit react-redux

# Dev
npm install -D @storybook/react-vite @storybook/addon-essentials
npm install -D @storybook/blocks @storybook/addon-themes
npm install -D typescript @types/react @types/react-dom
```

### 4.3 Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: false, // We use data-part selectors, not CSS modules
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### 4.4 TypeScript Configuration

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

### 4.5 Storybook Init

```bash
npx storybook@latest init --type react_vite --no-dev
```

Configure `.storybook/preview.ts` to import the base CSS:

```typescript
// .storybook/preview.ts
import '../src/styles/hypercard.css';
import '../src/styles/theme-default.css';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
  },
};

export default preview;
```

---

## 5. Phase 2 – Module Extraction & File Structure

### 5.1 DSL Types (`src/dsl/types.ts`)

Extract TypeScript types from the implicit STACK schema:

```typescript
// src/dsl/types.ts

// ── Data types ──
export interface Item {
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  qty: number;
  tags: string[];
}

export interface SaleEntry {
  id: string;
  date: string;
  sku: string;
  qty: number;
  total: number;
}

export interface StackData {
  items: Item[];
  salesLog: SaleEntry[];
  [key: string]: unknown[]; // extensible for future tables
}

// ── Settings ──
export interface StackSettings {
  aiModel: string;
  lowStockThreshold: number;
  [key: string]: unknown;
}

// ── Actions ──
export interface DSLAction {
  type: string;
  card?: string;
  param?: string;
  paramValue?: string;
  delta?: number;
  sku?: string;
  edits?: Record<string, unknown>;
  values?: Record<string, unknown>;
  message?: string;
  text?: string;
}

// ── Card field types ──
export type FieldType = 'label' | 'readonly' | 'text' | 'number' | 'select' | 'tags';

export interface CardField {
  id: string;
  label?: string;
  type: FieldType;
  value?: string;
  style?: string;
  placeholder?: string;
  required?: boolean;
  default?: unknown;
  step?: number;
  options?: string[];
  highlight?: string;
}

export interface ComputedField {
  id: string;
  label: string;
  expr: string;
}

export interface CardButton {
  label: string;
  action: DSLAction;
  style?: 'primary' | 'danger';
}

// ── Filter ──
export type FilterOp = '<=' | '>=' | '==' | '!=' | '<' | '>' | 'contains' | 'iequals';

export interface DataFilter {
  field: string;
  op: FilterOp;
  value: string | number;
}

export interface FilterControl {
  field: string;
  type: 'select' | 'text';
  options?: string[];
  placeholder?: string;
}

// ── Card definitions ──
export type CardType = 'menu' | 'list' | 'detail' | 'form' | 'chat' | 'report';

export interface BaseCard {
  type: CardType;
  title: string;
  icon: string;
}

export interface MenuCard extends BaseCard {
  type: 'menu';
  fields?: CardField[];
  buttons?: CardButton[];
}

export interface ListCard extends BaseCard {
  type: 'list';
  dataSource: string;
  columns: string[];
  sortable?: boolean;
  filters?: FilterControl[];
  dataFilter?: DataFilter;
  rowAction?: DSLAction;
  toolbar?: CardButton[];
  footer?: { type: 'sum'; field: string; label: string };
  emptyMessage?: string;
}

export interface DetailCard extends BaseCard {
  type: 'detail';
  dataSource: string;
  keyField: string;
  fields: CardField[];
  computed?: ComputedField[];
  buttons?: CardButton[];
}

export interface FormCard extends BaseCard {
  type: 'form';
  fields: CardField[];
  submitAction: DSLAction;
  submitLabel: string;
}

export interface ReportSection {
  label: string;
  compute: string;
}

export interface ReportCard extends BaseCard {
  type: 'report';
  sections: ReportSection[];
}

export interface ChatCard extends BaseCard {
  type: 'chat';
  welcome: string;
  suggestions?: string[];
}

export type CardDefinition = MenuCard | ListCard | DetailCard | FormCard | ReportCard | ChatCard;

// ── AI Intent ──
export interface IntentQuery {
  source: string;
  filter?: DataFilter;
  limit?: number;
  aggregate?: string;
}

export interface IntentAction {
  label: string;
  action: DSLAction;
}

export interface AIIntent {
  patterns: string[];
  response?: string;
  query?: IntentQuery;
  compute?: string;
  actions?: IntentAction[];
}

export interface AIFallback {
  response: string;
  actions: IntentAction[];
}

// ── The Stack ──
export interface Stack {
  name: string;
  icon: string;
  homeCard: string;
  settings: StackSettings;
  data: StackData;
  cards: Record<string, CardDefinition>;
  ai: {
    intents: AIIntent[];
    fallback: AIFallback;
  };
}
```

### 5.2 Stack Definition (`src/dsl/stack.ts`)

```typescript
// src/dsl/stack.ts
import type { Stack } from './types';

export const STACK: Stack = {
  // ... (move the entire STACK constant here, now typed)
};
```

### 5.3 DSL Resolver (`src/dsl/resolver.ts`)

```typescript
// src/dsl/resolver.ts
import type { DataFilter, StackSettings } from './types';

export interface ResolveContext {
  settings: StackSettings;
  input?: string;
  match?: string;
}

export function resolveValue(val: string | number, ctx: ResolveContext): string | number {
  if (typeof val === 'string') {
    if (val.startsWith('$settings.')) return ctx.settings[val.slice(10)] as string | number;
    if (val === '$input') return ctx.input ?? '';
    if (val === '$match') return ctx.match ?? '';
  }
  return val;
}

export function matchFilter(
  item: Record<string, unknown>,
  filter: DataFilter,
  ctx: ResolveContext,
): boolean {
  const v = resolveValue(filter.value, ctx);
  const f = item[filter.field];
  switch (filter.op) {
    case '<=': return (f as number) <= (v as number);
    case '>=': return (f as number) >= (v as number);
    case '==': return String(f) === String(v);
    case '!=': return f !== v;
    case '<':  return (f as number) < (v as number);
    case '>':  return (f as number) > (v as number);
    case 'contains':
      return String(f).toLowerCase().includes(String(v).toLowerCase());
    case 'iequals':
      return String(f).toLowerCase() === String(v).toLowerCase();
    default: return true;
  }
}

/**
 * Safe expression evaluator for computed fields.
 * Replaces `new Function()` with a whitelist approach.
 */
export function evaluateExpression(
  expr: string,
  variables: Record<string, number>,
): string {
  try {
    // Create a safe sandbox with only numeric variables
    const fn = new Function(
      ...Object.keys(variables),
      `"use strict"; return ${expr};`,
    );
    return String(fn(...Object.values(variables)));
  } catch {
    return '—';
  }
}

/**
 * Interpolate {{fieldName}} placeholders in a template string.
 */
export function interpolateTemplate(
  template: string,
  record: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(record[key] ?? ''));
}
```

### 5.4 Primitive Components

Extract `Btn`, `Chip`, `Toast` into individual files:

```typescript
// src/components/primitives/Btn.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  active?: boolean;
  children: ReactNode;
}

export function Btn({ children, active, variant = 'default', ...props }: BtnProps) {
  return (
    <button
      data-part="btn"
      data-state={active ? 'active' : undefined}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  );
}
```

```typescript
// src/components/primitives/Chip.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Chip({ children, ...props }: ChipProps) {
  return (
    <button data-part="chip" {...props}>
      {children}
    </button>
  );
}
```

```typescript
// src/components/primitives/Toast.tsx
import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  duration?: number;
  onDone: () => void;
}

export function Toast({ message, duration = 2200, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return <div data-part="toast">{message}</div>;
}
```

### 5.5 Parts Registry (`src/components/parts.ts`)

Single source of truth for all `data-part` names:

```typescript
// src/components/parts.ts
export const PARTS = {
  // Widget root
  root: 'hypercard',

  // Primitives
  btn: 'btn',
  chip: 'chip',
  toast: 'toast',

  // Window chrome
  windowFrame: 'window-frame',
  titleBar: 'title-bar',
  closeBox: 'close-box',
  titleText: 'title-text',
  tabBar: 'tab-bar',
  tab: 'tab',

  // Navigation
  navBar: 'nav-bar',

  // Data display
  dataTable: 'data-table',
  tableHeader: 'table-header',
  tableRow: 'table-row',
  tableCell: 'table-cell',
  tableFooter: 'table-footer',

  // Cards (generic)
  card: 'card',
  cardTitle: 'card-title',
  cardBody: 'card-body',
  cardToolbar: 'card-toolbar',

  // Menu card
  menuGrid: 'menu-grid',

  // Detail card
  fieldGrid: 'field-grid',
  fieldLabel: 'field-label',
  fieldValue: 'field-value',
  fieldInput: 'field-input',
  buttonGroup: 'button-group',

  // Chat
  chatTimeline: 'chat-timeline',
  chatMessage: 'chat-message',
  chatBubble: 'chat-bubble',
  chatComposer: 'chat-composer',
  chatInput: 'chat-input',
  chatSuggestions: 'chat-suggestions',

  // Status
  statusBar: 'status-bar',
  filterBar: 'filter-bar',

  // AI panel
  aiPanel: 'ai-panel',
  aiPanelHeader: 'ai-panel-header',
} as const;

export type PartName = (typeof PARTS)[keyof typeof PARTS];
```

---

## 6. Phase 3 – RTK Toolkit State Management

### 6.1 Store Configuration (`src/app/store.ts`)

```typescript
// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { navigationReducer } from '@/features/navigation/navigationSlice';
import { inventoryReducer } from '@/features/inventory/inventorySlice';
import { salesReducer } from '@/features/sales/salesSlice';
import { notificationsReducer } from '@/features/notifications/notificationsSlice';
import { chatReducer } from '@/features/chat/chatSlice';

export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    inventory: inventoryReducer,
    sales: salesReducer,
    notifications: notificationsReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 6.2 Typed Hooks (`src/app/hooks.ts`)

```typescript
// src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### 6.3 Navigation Slice (`src/features/navigation/navigationSlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type LayoutMode = 'split' | 'drawer' | 'cardChat';

interface NavEntry {
  card: string;
  param?: string;
}

interface NavigationState {
  layout: LayoutMode;
  stack: NavEntry[];
}

const initialState: NavigationState = {
  layout: 'split',
  stack: [{ card: 'home' }],
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    navigate(state, action: PayloadAction<{ card: string; paramValue?: string }>) {
      state.stack.push({
        card: action.payload.card,
        param: action.payload.paramValue,
      });
    },
    goBack(state) {
      if (state.stack.length > 1) state.stack.pop();
    },
    setLayout(state, action: PayloadAction<LayoutMode>) {
      state.layout = action.payload;
      state.stack = [{ card: 'home' }]; // reset nav on layout switch
    },
  },
});

export const { navigate, goBack, setLayout } = navigationSlice.actions;
export const navigationReducer = navigationSlice.reducer;
```

**Selectors:**

```typescript
// src/features/navigation/selectors.ts
import type { RootState } from '@/app/store';

export const selectCurrentNav = (state: RootState) =>
  state.navigation.stack[state.navigation.stack.length - 1];

export const selectCurrentCardId = (state: RootState) =>
  selectCurrentNav(state).card;

export const selectCurrentParam = (state: RootState) =>
  selectCurrentNav(state).param;

export const selectNavDepth = (state: RootState) =>
  state.navigation.stack.length;

export const selectLayout = (state: RootState) =>
  state.navigation.layout;
```

### 6.4 Inventory Slice (`src/features/inventory/inventorySlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Item } from '@/dsl/types';
import { STACK } from '@/dsl/stack';

interface InventoryState {
  items: Item[];
}

const initialState: InventoryState = {
  items: JSON.parse(JSON.stringify(STACK.data.items)),
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    updateQty(state, action: PayloadAction<{ sku: string; delta: number }>) {
      const item = state.items.find(i => i.sku === action.payload.sku);
      if (item) {
        item.qty = Math.max(0, item.qty + action.payload.delta);
      }
    },
    saveItem(state, action: PayloadAction<{ sku: string; edits: Partial<Item> }>) {
      const idx = state.items.findIndex(i => i.sku === action.payload.sku);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.edits };
      }
    },
    deleteItem(state, action: PayloadAction<{ sku: string }>) {
      state.items = state.items.filter(i => i.sku !== action.payload.sku);
    },
    createItem(state, action: PayloadAction<Omit<Item, 'tags'> & { tags?: string[] }>) {
      state.items.push({ ...action.payload, tags: action.payload.tags ?? [] });
    },
    receiveStock(state, action: PayloadAction<{ sku: string; qty: number }>) {
      const item = state.items.find(
        i => i.sku.toLowerCase() === action.payload.sku.toLowerCase(),
      );
      if (item) {
        item.qty += action.payload.qty;
      }
    },
  },
});

export const { updateQty, saveItem, deleteItem, createItem, receiveStock } =
  inventorySlice.actions;
export const inventoryReducer = inventorySlice.reducer;
```

**Selectors:**

```typescript
// src/features/inventory/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { STACK } from '@/dsl/stack';

export const selectItems = (state: RootState) => state.inventory.items;

export const selectItemBySku = (sku: string) => (state: RootState) =>
  state.inventory.items.find(i => i.sku === sku);

export const selectLowStockItems = createSelector(
  [selectItems],
  (items) => items.filter(i => i.qty <= STACK.settings.lowStockThreshold),
);

export const selectOutOfStockItems = createSelector(
  [selectItems],
  (items) => items.filter(i => i.qty === 0),
);

export const selectTotalRetailValue = createSelector(
  [selectItems],
  (items) => items.reduce((sum, i) => sum + i.price * i.qty, 0),
);
```

### 6.5 Sales Slice (`src/features/sales/salesSlice.ts`)

```typescript
import { createSlice } from '@reduxjs/toolkit';
import type { SaleEntry } from '@/dsl/types';
import { STACK } from '@/dsl/stack';

interface SalesState {
  log: SaleEntry[];
}

const initialState: SalesState = {
  log: JSON.parse(JSON.stringify(STACK.data.salesLog)),
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    // Future: addSale, etc.
  },
});

export const salesReducer = salesSlice.reducer;
```

### 6.6 Notifications Slice (`src/features/notifications/notificationsSlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationsState {
  toast: string | null;
}

const initialState: NotificationsState = { toast: null };

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<string>) {
      state.toast = action.payload;
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { showToast, clearToast } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;
```

### 6.7 Chat Slice (`src/features/chat/chatSlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  results?: Record<string, unknown>[];
  actions?: Array<{ label: string; action: { type: string; [key: string]: unknown } }>;
  isCardCreated?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
}

const initialState: ChatState = {
  messages: [], // welcome message added on mount from card def
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    addMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages.push(...action.payload);
    },
    resetChat(state) {
      state.messages = [];
    },
  },
});

export const { addMessage, addMessages, resetChat } = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
```

### 6.8 Intent Engine (extracted) (`src/features/chat/intentEngine.ts`)

```typescript
import type { AIIntent, StackData, StackSettings } from '@/dsl/types';
import { matchFilter, resolveValue } from '@/dsl/resolver';
import { computeHandlers } from './computeHandlers';

export interface IntentResult {
  text: string;
  results?: Record<string, unknown>[];
  actions?: Array<{ label: string; action: { type: string; [key: string]: unknown } }>;
  isCardCreated?: boolean;
}

export function processIntent(
  input: string,
  intents: AIIntent[],
  fallback: { response: string; actions: any[] },
  data: StackData,
  settings: StackSettings,
): IntentResult {
  const lower = input.toLowerCase();

  for (const intent of intents) {
    const matched = intent.patterns.find(p => lower.includes(p));
    if (!matched) continue;

    // Computed intents
    if (intent.compute) {
      const handler = computeHandlers[intent.compute];
      if (handler) {
        const result = handler(data, settings, input, matched);
        return { ...result, actions: result.actions ?? intent.actions };
      }
    }

    // Query-based intents
    if (intent.query) {
      let src = (data[intent.query.source] as Record<string, unknown>[]) || [];
      if (intent.query.filter) {
        const ctx = { settings, input, match: matched };
        src = src.filter(i => matchFilter(i, intent.query!.filter!, ctx));
      }
      if (intent.query.limit) src = src.slice(0, intent.query.limit);
      const resp = (intent.response ?? '')
        .replace('{{threshold}}', String(settings.lowStockThreshold))
        .replace('{{matchCap}}', matched.charAt(0).toUpperCase() + matched.slice(1));
      return { text: resp, results: src, actions: intent.actions };
    }

    return { text: intent.response ?? 'Done.', actions: intent.actions };
  }

  return { text: fallback.response, actions: fallback.actions };
}
```

### 6.9 Compute Handlers (extracted) (`src/features/chat/computeHandlers.ts`)

```typescript
import type { Item, SaleEntry, StackData, StackSettings } from '@/dsl/types';

type ComputeHandler = (
  data: StackData,
  settings: StackSettings,
  input: string,
  match: string,
) => { text: string; results?: Record<string, unknown>[]; actions?: any[]; isCardCreated?: boolean };

export const computeHandlers: Record<string, ComputeHandler> = {
  inventoryValue: (data) => {
    const items = data.items as Item[];
    const rv = items.reduce((a, i) => a + i.price * i.qty, 0);
    const cv = items.reduce((a, i) => a + i.cost * i.qty, 0);
    return {
      text: `Total retail value: $${rv.toFixed(2)}\nCost basis: $${cv.toFixed(2)}\nPotential profit: $${(rv - cv).toFixed(2)}`,
    };
  },

  marginReport: (data) => {
    const items = data.items as Item[];
    const sorted = [...items].sort(
      (a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price,
    );
    const top = sorted.slice(0, 4);
    return {
      text:
        'Top margin items:\n' +
        top.map(i => `  ${i.sku} ${i.name}: ${(((i.price - i.cost) / i.price) * 100).toFixed(0)}%`).join('\n'),
      results: top as unknown as Record<string, unknown>[],
    };
  },

  bestSellers: (data) => {
    const sales = data.salesLog as SaleEntry[];
    const items = data.items as Item[];
    const counts: Record<string, number> = {};
    sales.forEach(s => { counts[s.sku] = (counts[s.sku] || 0) + s.qty; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topSkus = sorted.slice(0, 3).map(([sku, qty]) => ({ sku, soldQty: qty }));
    const results = topSkus.map(t => items.find(i => i.sku === t.sku)).filter(Boolean);
    return {
      text: 'Top sellers by volume:\n' + topSkus.map(t => `  ${t.sku}: ${t.soldQty} units sold`).join('\n'),
      results: results as unknown as Record<string, unknown>[],
    };
  },

  createCard: () => ({
    text: `Created snapshot card "Report ${new Date().toISOString().slice(0, 10)}" with current stats.`,
    isCardCreated: true,
    actions: [{ label: '📊 Open report', action: { type: 'navigate', card: 'report' } }],
  }),

  catalogCount: (data) => {
    const items = data.items as Item[];
    const cats: Record<string, number> = {};
    items.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
    return {
      text: `${items.length} items in catalog:\n` +
        Object.entries(cats).map(([c, n]) => `  ${c}: ${n}`).join('\n'),
      actions: [{ label: '📋 Browse', action: { type: 'navigate', card: 'browse' } }],
    };
  },

  priceExtreme: (data, _settings, input) => {
    const items = data.items as Item[];
    const lower = input.toLowerCase();
    const direction = lower.includes('cheap') || lower.includes('least') ? 'cheapest' : 'expensive';
    const sorted = [...items].sort((a, b) =>
      direction === 'cheapest' ? a.price - b.price : b.price - a.price,
    );
    const top = sorted.slice(0, 3);
    return {
      text: (direction === 'cheapest' ? 'Cheapest' : 'Most expensive') + ' items:',
      results: top as unknown as Record<string, unknown>[],
      actions: [{ label: '📋 Browse', action: { type: 'navigate', card: 'browse' } }],
    };
  },
};
```

### 6.10 Unified Action Dispatcher

To bridge DSL actions (from card buttons, AI chips) to RTK actions:

```typescript
// src/app/dispatchDSLAction.ts
import type { AppDispatch } from './store';
import type { DSLAction } from '@/dsl/types';
import { navigate, goBack } from '@/features/navigation/navigationSlice';
import { updateQty, saveItem, deleteItem, createItem, receiveStock } from '@/features/inventory/inventorySlice';
import { showToast } from '@/features/notifications/notificationsSlice';

/**
 * Translates a DSL action object into the corresponding RTK dispatch.
 * This is the bridge between the declarative STACK definition and
 * the typed Redux actions.
 */
export function dispatchDSLAction(dispatch: AppDispatch, action: DSLAction) {
  switch (action.type) {
    case 'navigate':
      dispatch(navigate({ card: action.card!, paramValue: action.paramValue }));
      break;
    case 'back':
      dispatch(goBack());
      break;
    case 'toast':
      dispatch(showToast(action.message!));
      break;
    case 'updateQty':
      dispatch(updateQty({ sku: action.sku!, delta: action.delta! }));
      dispatch(showToast(`${action.delta! > 0 ? '+' : ''}${action.delta} qty for ${action.sku}`));
      break;
    case 'saveItem':
      if (action.edits && action.sku) {
        dispatch(saveItem({ sku: action.sku, edits: action.edits as any }));
        dispatch(showToast(`Saved ${action.sku}`));
      }
      break;
    case 'deleteItem':
      dispatch(deleteItem({ sku: action.sku! }));
      dispatch(goBack());
      dispatch(showToast(`Deleted ${action.sku}`));
      break;
    case 'createItem':
      if (action.values?.sku && action.values?.name) {
        dispatch(createItem(action.values as any));
        dispatch(showToast(`Created ${action.values.sku}`));
      }
      break;
    case 'receiveStock': {
      const vals = action.values as { sku?: string; qty?: number } | undefined;
      if (vals?.sku && vals?.qty) {
        dispatch(receiveStock({ sku: vals.sku, qty: Number(vals.qty) }));
        dispatch(showToast(`Received +${vals.qty} for ${vals.sku}`));
      }
      break;
    }
  }
}
```

---

## 7. Phase 4 – Themeable Design System

### 7.1 Design Tokens (`src/styles/tokens.ts`)

```typescript
// src/styles/tokens.ts — Token names for programmatic use and Storybook controls

export const TOKENS = {
  // Colors
  colorBg: '--hc-color-bg',
  colorSurface: '--hc-color-surface',
  colorAlt: '--hc-color-alt',
  colorAi: '--hc-color-ai',
  colorBorder: '--hc-color-border',
  colorText: '--hc-color-text',
  colorMuted: '--hc-color-muted',
  colorError: '--hc-color-error',
  colorWarning: '--hc-color-warning',
  colorSuccess: '--hc-color-success',
  colorLink: '--hc-color-link',
  colorHighlight: '--hc-color-highlight',

  // Typography
  fontFamily: '--hc-font-family',
  fontSizeXs: '--hc-font-size-xs',
  fontSizeSm: '--hc-font-size-sm',
  fontSizeMd: '--hc-font-size-md',
  fontSizeLg: '--hc-font-size-lg',
  fontWeightNormal: '--hc-font-weight-normal',
  fontWeightBold: '--hc-font-weight-bold',

  // Spacing
  space1: '--hc-space-1',
  space2: '--hc-space-2',
  space3: '--hc-space-3',
  space4: '--hc-space-4',
  space5: '--hc-space-5',
  space6: '--hc-space-6',

  // Borders
  borderWidth: '--hc-border-width',
  borderWidthThin: '--hc-border-width-thin',
  borderRadius: '--hc-border-radius',

  // Shadows
  shadowBtn: '--hc-shadow-btn',
  shadowWindow: '--hc-shadow-window',

  // Layout
  contentMaxWidth: '--hc-content-max-width',
  windowHeight: '--hc-window-height',
  aiPanelWidth: '--hc-ai-panel-width',
  drawerMaxHeight: '--hc-drawer-max-height',
} as const;
```

### 7.2 Default Theme (`src/styles/theme-default.css`)

Maps 1:1 to the current inline values in the monolith:

```css
/* src/styles/theme-default.css
   HyperCard Mac System 7 Theme — the faithful reproduction
   of the original inline styles as CSS custom properties.
*/

:where([data-widget="hypercard"]) {
  /* ── Colors (from T object) ── */
  --hc-color-bg: #fff;
  --hc-color-surface: #fff;
  --hc-color-alt: #f5f4ed;
  --hc-color-ai: #f0efe8;
  --hc-color-border: #000;
  --hc-color-text: #000;
  --hc-color-muted: #777;
  --hc-color-error: #a00;
  --hc-color-warning: #960;
  --hc-color-success: #060;
  --hc-color-link: #006;
  --hc-color-highlight: #ffffcc;

  /* ── Typography ── */
  --hc-font-family: "Geneva", "Chicago", "Monaco", monospace;
  --hc-font-size-xs: 9px;
  --hc-font-size-sm: 10px;
  --hc-font-size-md: 11px;
  --hc-font-size-lg: 12px;
  --hc-font-weight-normal: 400;
  --hc-font-weight-bold: 700;

  /* ── Spacing ── */
  --hc-space-1: 2px;
  --hc-space-2: 4px;
  --hc-space-3: 8px;
  --hc-space-4: 12px;
  --hc-space-5: 16px;
  --hc-space-6: 24px;

  /* ── Borders ── */
  --hc-border-width: 2px;
  --hc-border-width-thin: 1px;
  --hc-border-radius: 0;

  /* ── Shadows ── */
  --hc-shadow-btn: 1px 1px 0 var(--hc-color-border);
  --hc-shadow-window: 2px 2px 0 var(--hc-color-border);

  /* ── Layout ── */
  --hc-content-max-width: 860px;
  --hc-window-height: min(650px, 88vh);
  --hc-ai-panel-width: 270px;
  --hc-drawer-max-height: 200px;
}
```

### 7.3 Base Layout CSS (`src/styles/hypercard.css`)

Uses `data-part` selectors with token variables — no hard-coded values:

```css
/* src/styles/hypercard.css
   Base layout and structure. Uses tokens from theme-default.css.
   All selectors scoped to [data-widget="hypercard"].
*/

/* ── Reset / base ── */
:where([data-widget="hypercard"]) {
  font-family: var(--hc-font-family);
  color: var(--hc-color-text);
  box-sizing: border-box;
}

:where([data-widget="hypercard"]) *,
:where([data-widget="hypercard"]) *::before,
:where([data-widget="hypercard"]) *::after {
  box-sizing: inherit;
}

/* ── Window chrome ── */
:where([data-widget="hypercard"]) [data-part="window-frame"] {
  width: 100%;
  max-width: var(--hc-content-max-width);
  height: var(--hc-window-height);
  margin: var(--hc-space-5) auto;
  display: flex;
  flex-direction: column;
}

:where([data-widget="hypercard"]) [data-part="title-bar"] {
  background: var(--hc-color-bg);
  border: var(--hc-border-width) solid var(--hc-color-border);
  padding: var(--hc-space-2) var(--hc-space-3);
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  user-select: none;
}

:where([data-widget="hypercard"]) [data-part="close-box"] {
  width: 13px;
  height: 13px;
  border: var(--hc-border-width) solid var(--hc-color-border);
  flex-shrink: 0;
}

:where([data-widget="hypercard"]) [data-part="title-text"] {
  flex: 1;
  text-align: center;
  font-weight: var(--hc-font-weight-bold);
  font-size: 13px;
}

/* ── Tab bar ── */
:where([data-widget="hypercard"]) [data-part="tab-bar"] {
  display: flex;
  background: #ddd;
  border-left: var(--hc-border-width) solid var(--hc-color-border);
  border-right: var(--hc-border-width) solid var(--hc-color-border);
}

:where([data-widget="hypercard"]) [data-part="tab"] {
  padding: var(--hc-space-2) 14px;
  font-size: var(--hc-font-size-md);
  font-family: var(--hc-font-family);
  cursor: pointer;
  background: #ccc;
  border-right: var(--hc-border-width-thin) solid var(--hc-color-border);
  border-bottom: var(--hc-border-width) solid var(--hc-color-border);
  user-select: none;
}

:where([data-widget="hypercard"]) [data-part="tab"][data-state="active"] {
  background: var(--hc-color-bg);
  border-bottom-color: var(--hc-color-bg);
  font-weight: var(--hc-font-weight-bold);
  margin-bottom: calc(-1 * var(--hc-border-width));
  position: relative;
  z-index: 2;
}

/* ── Button ── */
:where([data-widget="hypercard"]) [data-part="btn"] {
  font-family: var(--hc-font-family);
  font-size: var(--hc-font-size-md);
  background: var(--hc-color-bg);
  border: var(--hc-border-width) solid var(--hc-color-border);
  border-radius: var(--hc-border-radius);
  padding: 3px 10px;
  cursor: pointer;
  box-shadow: var(--hc-shadow-btn);
  user-select: none;
  white-space: nowrap;
}

:where([data-widget="hypercard"]) [data-part="btn"][data-state="active"],
:where([data-widget="hypercard"]) [data-part="btn"][data-variant="primary"] {
  background: var(--hc-color-border);
  color: var(--hc-color-bg);
}

:where([data-widget="hypercard"]) [data-part="btn"][data-variant="danger"] {
  border-color: var(--hc-color-error);
  color: var(--hc-color-error);
}

/* ── Chip ── */
:where([data-widget="hypercard"]) [data-part="chip"] {
  font-family: var(--hc-font-family);
  font-size: var(--hc-font-size-sm);
  background: var(--hc-color-border);
  color: var(--hc-color-bg);
  border: none;
  padding: var(--hc-space-1) var(--hc-space-3);
  cursor: pointer;
}

/* ── Input ── */
:where([data-widget="hypercard"]) [data-part="field-input"],
:where([data-widget="hypercard"]) [data-part="chat-input"] select,
:where([data-widget="hypercard"]) input,
:where([data-widget="hypercard"]) select {
  font-family: var(--hc-font-family);
  font-size: var(--hc-font-size-lg);
  border: var(--hc-border-width) solid var(--hc-color-border);
  border-radius: var(--hc-border-radius);
  padding: 3px 6px;
  outline: none;
  background: var(--hc-color-bg);
}

/* ── DataTable ── */
:where([data-widget="hypercard"]) [data-part="data-table"] {
  font-size: var(--hc-font-size-md);
}

:where([data-widget="hypercard"]) [data-part="table-header"] {
  border-bottom: var(--hc-border-width) solid var(--hc-color-border);
  font-weight: var(--hc-font-weight-bold);
  padding: var(--hc-space-1) var(--hc-space-2);
  text-transform: uppercase;
}

:where([data-widget="hypercard"]) [data-part="table-row"]:nth-child(odd) {
  background: var(--hc-color-bg);
}

:where([data-widget="hypercard"]) [data-part="table-row"]:nth-child(even) {
  background: #eee;
}

:where([data-widget="hypercard"]) [data-part="table-row"] {
  padding: var(--hc-space-1) var(--hc-space-2);
  border-bottom: var(--hc-border-width-thin) solid #ccc;
}

:where([data-widget="hypercard"]) [data-part="table-footer"] {
  border-top: var(--hc-border-width) solid var(--hc-color-border);
  padding: 5px var(--hc-space-3);
  font-weight: var(--hc-font-weight-bold);
  font-size: var(--hc-font-size-lg);
  background: var(--hc-color-alt);
}

/* ── Toast ── */
:where([data-widget="hypercard"]) [data-part="toast"] {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--hc-color-border);
  color: var(--hc-color-bg);
  font-family: var(--hc-font-family);
  font-size: var(--hc-font-size-lg);
  padding: 6px 16px;
  z-index: 999;
  box-shadow: var(--hc-shadow-window);
}

/* ── NavBar ── */
:where([data-widget="hypercard"]) [data-part="nav-bar"] {
  padding: var(--hc-space-2) var(--hc-space-3);
  border-bottom: var(--hc-border-width-thin) solid #ccc;
  display: flex;
  gap: var(--hc-space-2);
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* ── Card body ── */
:where([data-widget="hypercard"]) [data-part="card"] {
  height: 100%;
  overflow: auto;
}

:where([data-widget="hypercard"]) [data-part="card-title"] {
  font-weight: var(--hc-font-weight-bold);
  font-size: 14px;
  margin-bottom: var(--hc-space-3);
}

/* ── Filter bar ── */
:where([data-widget="hypercard"]) [data-part="filter-bar"] {
  padding: 5px var(--hc-space-3);
  border-bottom: var(--hc-border-width-thin) solid #ccc;
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
}

/* ── Status bar ── */
:where([data-widget="hypercard"]) [data-part="status-bar"] {
  border-top: var(--hc-border-width-thin) solid #ccc;
  padding: 3px var(--hc-space-3);
  font-size: var(--hc-font-size-sm);
  color: var(--hc-color-muted);
}

/* ── Field grid (detail + form cards) ── */
:where([data-widget="hypercard"]) [data-part="field-grid"] {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: var(--hc-space-2) var(--hc-space-3);
  margin-bottom: var(--hc-space-4);
  max-width: 400px;
}

:where([data-widget="hypercard"]) [data-part="field-label"] {
  font-size: var(--hc-font-size-md);
  color: var(--hc-color-muted);
  text-align: right;
  padding-top: 3px;
}

:where([data-widget="hypercard"]) [data-part="field-value"] {
  font-size: var(--hc-font-size-lg);
  font-weight: var(--hc-font-weight-bold);
}

/* ── Button group ── */
:where([data-widget="hypercard"]) [data-part="button-group"] {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ── Menu card grid ── */
:where([data-widget="hypercard"]) [data-part="menu-grid"] {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  max-width: 340px;
  width: 100%;
  margin-top: var(--hc-space-3);
}

/* ── Chat ── */
:where([data-widget="hypercard"]) [data-part="chat-timeline"] {
  flex: 1;
  overflow: auto;
  padding: var(--hc-space-3) 10px;
}

:where([data-widget="hypercard"]) [data-part="chat-message"][data-role="ai"] {
  padding-left: var(--hc-space-3);
  border-left: 3px solid var(--hc-color-border);
}

:where([data-widget="hypercard"]) [data-part="chat-composer"] {
  border-top: var(--hc-border-width) solid var(--hc-color-border);
  padding: 5px var(--hc-space-3);
  display: flex;
  gap: var(--hc-space-2);
  flex-shrink: 0;
}

:where([data-widget="hypercard"]) [data-part="chat-suggestions"] {
  padding: var(--hc-space-2) var(--hc-space-3);
  border-top: var(--hc-border-width-thin) solid #ccc;
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

/* ── AI panel (split layout) ── */
:where([data-widget="hypercard"]) [data-part="ai-panel"] {
  display: flex;
  flex-direction: column;
  background: var(--hc-color-ai);
}

:where([data-widget="hypercard"]) [data-part="ai-panel-header"] {
  padding: 5px var(--hc-space-3);
  border-bottom: var(--hc-border-width-thin) solid #ccc;
  font-weight: var(--hc-font-weight-bold);
  font-size: var(--hc-font-size-md);
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
}

/* ── Quantity coloring (semantic) ── */
:where([data-widget="hypercard"]) [data-part="table-cell"][data-state="out-of-stock"] {
  font-weight: var(--hc-font-weight-bold);
  color: var(--hc-color-error);
}

:where([data-widget="hypercard"]) [data-part="table-cell"][data-state="low-stock"] {
  font-weight: var(--hc-font-weight-bold);
  color: var(--hc-color-warning);
}
```

### 7.4 Example Dark Theme (`src/styles/theme-dark.css`)

Demonstrates how easy theming is with the token approach:

```css
/* src/styles/theme-dark.css
   Dark "CRT terminal" variant of the HyperCard theme.
*/

:where([data-widget="hypercard"].theme-dark) {
  --hc-color-bg: #0c0c0c;
  --hc-color-surface: #1a1a1a;
  --hc-color-alt: #1a1a1a;
  --hc-color-ai: #111;
  --hc-color-border: #33ff33;
  --hc-color-text: #33ff33;
  --hc-color-muted: #339933;
  --hc-color-error: #ff3333;
  --hc-color-warning: #ffaa33;
  --hc-color-success: #33ff33;
  --hc-color-link: #33aaff;
  --hc-color-highlight: #333;

  --hc-font-family: "Courier New", "Courier", monospace;
  --hc-shadow-btn: 1px 1px 0 #33ff33;
  --hc-shadow-window: 2px 2px 0 #33ff33;
}
```

### 7.5 Unstyled Mode

Add an `unstyled` prop to the root widget. When true, skip importing `hypercard.css` and `theme-default.css`, but still render all `data-part` attributes. This enables complete consumer CSS override.

```tsx
// src/components/layouts/WindowChrome.tsx
import type { ReactNode } from 'react';
import { PARTS } from '../parts';

export interface WindowChromeProps {
  children: ReactNode;
  unstyled?: boolean;
  className?: string;
}

export function WindowChrome({ children, unstyled, className }: WindowChromeProps) {
  return (
    <div
      data-widget={PARTS.root}
      className={className}
      data-state={unstyled ? 'unstyled' : undefined}
    >
      {children}
    </div>
  );
}
```

### 7.6 Theme Provider (runtime)

For programmatic theme switching via JS:

```typescript
// src/styles/useTheme.ts
import { useEffect } from 'react';

export type ThemeName = 'default' | 'dark' | string;

export function useTheme(theme: ThemeName, rootRef?: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = rootRef?.current ?? document.querySelector('[data-widget="hypercard"]');
    if (!el) return;

    // Remove all theme- classes
    el.classList.forEach(cls => {
      if (cls.startsWith('theme-')) el.classList.remove(cls);
    });

    // Add new theme class (unless default)
    if (theme !== 'default') {
      el.classList.add(`theme-${theme}`);
    }
  }, [theme, rootRef]);
}
```

### 7.7 ThemeVars Override (Storybook-friendly)

For Storybook stories that override individual tokens:

```typescript
// src/styles/ThemeVarsProvider.tsx
import type { ReactNode, CSSProperties } from 'react';

interface ThemeVarsProviderProps {
  vars?: Record<string, string>;
  children: ReactNode;
}

export function ThemeVarsProvider({ vars, children }: ThemeVarsProviderProps) {
  const style = vars
    ? (Object.fromEntries(
        Object.entries(vars).map(([k, v]) => [k, v]),
      ) as CSSProperties)
    : undefined;

  return <div style={style}>{children}</div>;
}
```

---

## 8. Phase 5 – Storybook Integration

### 8.1 Story Structure

Each component gets a story file following this pattern:

```typescript
// src/stories/primitives/Btn.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Btn } from '@/components/primitives/Btn';

const meta = {
  title: 'Primitives/Btn',
  component: Btn,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'danger'],
    },
    active: { control: 'boolean' },
  },
} satisfies Meta<typeof Btn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: '📋 Browse Items' },
};

export const Primary: Story = {
  args: { children: '✏️ Save Changes', variant: 'primary' },
};

export const Danger: Story = {
  args: { children: '🗑 Delete', variant: 'danger' },
};

export const Active: Story = {
  args: { children: '🏠', active: true },
};
```

### 8.2 Card Stories with Mock Data

Card stories need mock data and a mock dispatch:

```typescript
// src/stories/cards/ListCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ListCard } from '@/components/cards/ListCard';
import { STACK } from '@/dsl/stack';

// Create a mock store for stories
function createMockStore() {
  return configureStore({
    reducer: {
      inventory: () => ({ items: STACK.data.items }),
      sales: () => ({ log: STACK.data.salesLog }),
      navigation: () => ({ layout: 'split', stack: [{ card: 'home' }] }),
      notifications: () => ({ toast: null }),
      chat: () => ({ messages: [] }),
    },
  });
}

const meta = {
  title: 'Cards/ListCard',
  component: ListCard,
  decorators: [
    (Story) => (
      <Provider store={createMockStore()}>
        <div data-widget="hypercard" style={{ width: 600, height: 400 }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
} satisfies Meta<typeof ListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BrowseAll: Story = {
  args: { card: STACK.cards.browse as any },
};

export const LowStock: Story = {
  args: { card: STACK.cards.lowStock as any },
};

export const Empty: Story = {
  args: {
    card: {
      ...STACK.cards.lowStock,
      dataFilter: { field: 'qty', op: '<', value: -1 }, // force empty
    } as any,
  },
};
```

### 8.3 Theme Playground Story

```typescript
// src/stories/themes/ThemePlayground.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { App } from '@/app/App';
import { store } from '@/app/store';

const meta = {
  title: 'Themes/Playground',
  component: App,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
  argTypes: {
    theme: {
      control: 'select',
      options: ['default', 'dark'],
    },
    'colorBg': { control: 'color' },
    'colorBorder': { control: 'color' },
    'colorText': { control: 'color' },
    'colorMuted': { control: 'color' },
    'colorError': { control: 'color' },
    'fontFamily': {
      control: 'select',
      options: [
        '"Geneva", "Chicago", "Monaco", monospace',
        '"Courier New", monospace',
        '"Comic Sans MS", cursive',
        'system-ui, sans-serif',
      ],
    },
    'borderRadius': {
      control: 'select',
      options: ['0', '4px', '8px'],
    },
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultTheme: Story = { args: { theme: 'default' } };

export const DarkTheme: Story = { args: { theme: 'dark' } };

export const RoundedModern: Story = {
  args: {
    theme: 'default',
    'borderRadius': '8px',
    'fontFamily': 'system-ui, sans-serif',
  },
};
```

### 8.4 Required Story Coverage

| Component | Stories | Notes |
|-----------|---------|-------|
| Btn | Default, Primary, Danger, Active | All variants |
| Chip | Default | Single variant |
| Toast | Default, LongMessage | Auto-dismiss |
| DataTable | Default, Empty, WithRowClick, QuantityColors | Qty coloring states |
| MenuCard | Home | With buttons grid |
| ListCard | BrowseAll, LowStock, Sales, Filtered, Empty | Filter & sort states |
| DetailCard | ViewItem, EditItem, LowStockHighlight | Field types + computed |
| FormCard | NewItem, PriceCheck, Validation | Required fields |
| ReportCard | FullReport | All compute sections |
| ChatCard | Welcome, Conversation, WithResults | Intent matching |
| NavBar | Default, WithBackButton | Nav depth states |
| LayoutSplit | Default | Full layout with AI panel |
| LayoutDrawer | Open, Closed | Drawer toggle |
| ThemePlayground | Default, Dark, RoundedModern | Theme switching |

---

## 9. Phase 6 – Advanced Patterns

### 9.1 Slot/Renderer Pattern for Card Extensions

Allow consumers to override how specific card parts render:

```typescript
// src/components/cards/types.ts
import type { ReactNode } from 'react';
import type { Item } from '@/dsl/types';

export interface CardSlots {
  /** Override the card header rendering */
  renderHeader?: (title: string, icon: string) => ReactNode;
  /** Override empty state rendering */
  renderEmpty?: (message: string) => ReactNode;
  /** Override individual table cell rendering */
  renderCell?: (column: string, value: unknown, item: Item) => ReactNode;
  /** Override button rendering */
  renderButton?: (label: string, onClick: () => void, variant?: string) => ReactNode;
}
```

Usage in a card:

```tsx
function ListCard({ card, slots }: { card: ListCardDef; slots?: CardSlots }) {
  // ...
  const header = slots?.renderHeader
    ? slots.renderHeader(card.title, card.icon)
    : <div data-part="card-title">{card.icon} {card.title}</div>;

  const empty = slots?.renderEmpty
    ? slots.renderEmpty(card.emptyMessage ?? 'No results')
    : <div data-part="status-bar">{card.emptyMessage ?? 'No results'}</div>;
  // ...
}
```

### 9.2 Persistence Middleware (future)

RTK makes adding persistence trivial via middleware:

```typescript
// src/features/persistence/persistenceMiddleware.ts
import type { Middleware } from '@reduxjs/toolkit';

export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Persist inventory and sales after mutations
  const state = store.getState();
  localStorage.setItem('hypercard-data', JSON.stringify({
    items: state.inventory.items,
    salesLog: state.sales.log,
  }));

  return result;
};
```

### 9.3 URL-based Navigation (future)

Replace the nav stack with a URL-synced approach:

```typescript
// Navigation state could sync to hash:
// #/home → [{ card: 'home' }]
// #/browse → [{ card: 'home' }, { card: 'browse' }]
// #/itemDetail/A-1002 → [{ card: 'home' }, { card: 'itemDetail', param: 'A-1002' }]
```

### 9.4 Real LLM Integration (future)

The `processIntent` function is the single integration point. Replace it with:

```typescript
// src/features/chat/llmEngine.ts
export async function processWithLLM(
  input: string,
  data: StackData,
  settings: StackSettings,
): Promise<IntentResult> {
  // 1. Try pattern matching first (fast path)
  const patternResult = processIntent(input, STACK.ai.intents, STACK.ai.fallback, data, settings);
  if (patternResult.text !== STACK.ai.fallback.response) return patternResult;

  // 2. Fall back to LLM API
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ input, context: summarizeData(data) }),
  });
  return response.json();
}
```

---

## 10. Migration Checklist

### Phase 1: Scaffold (Day 1)
- [ ] Initialize Vite project with React + TypeScript template
- [ ] Install dependencies (@reduxjs/toolkit, react-redux, storybook)
- [ ] Configure Vite aliases, TypeScript paths
- [ ] Initialize Storybook
- [ ] Verify dev server and Storybook both start

### Phase 2: Module Extraction (Day 1–2)
- [ ] Create `src/dsl/types.ts` with full TypeScript types
- [ ] Move STACK constant to `src/dsl/stack.ts`
- [ ] Extract `resolveValue`, `matchFilter` to `src/dsl/resolver.ts`
- [ ] Extract Btn, Chip, Toast to `src/components/primitives/`
- [ ] Extract DataTable to `src/components/data-display/`
- [ ] Extract card renderers to `src/components/cards/`
- [ ] Extract layout shells to `src/components/layouts/`
- [ ] Create `src/components/parts.ts` with all data-part names
- [ ] Verify app renders identically to monolith

### Phase 3: RTK (Day 2–3)
- [ ] Create store with all 5 slices
- [ ] Create typed hooks
- [ ] Create navigation slice + selectors
- [ ] Create inventory slice + selectors
- [ ] Create sales slice
- [ ] Create notifications slice
- [ ] Create chat slice
- [ ] Extract intent engine + compute handlers
- [ ] Create `dispatchDSLAction` bridge
- [ ] Wire `<Provider>` in main.tsx
- [ ] Replace all useState with useAppSelector/useAppDispatch
- [ ] Verify all 10 action types work identically

### Phase 4: Theming (Day 3–4)
- [ ] Create `tokens.ts` with all token names
- [ ] Create `theme-default.css` mapping current inline values
- [ ] Create `hypercard.css` with data-part selectors
- [ ] Add `data-part` attributes to all components
- [ ] Add `data-state` for active/variant/stock states
- [ ] Add `data-widget="hypercard"` to root
- [ ] Remove all inline style objects
- [ ] Create `theme-dark.css` as proof of concept
- [ ] Add `useTheme` hook and theme class switching
- [ ] Implement unstyled mode
- [ ] Verify pixel-perfect match with original

### Phase 5: Storybook (Day 4–5)
- [ ] Write stories for all primitives (Btn, Chip, Toast)
- [ ] Write DataTable stories (empty, populated, clickable)
- [ ] Write stories for each card type with mock data
- [ ] Write layout stories
- [ ] Create ThemePlayground with controls
- [ ] Verify Storybook builds without errors
- [ ] Check accessibility: labels, focus states, contrast

### Phase 6: Polish & Ship
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] Storybook build succeeds
- [ ] All card types render correctly
- [ ] Theme switching works
- [ ] Document the public API (parts, tokens, slots)
- [ ] Update README with architecture diagram

---

## 11. Appendix: Component API Reference

### A. Data-Part Map

| data-part | Element | Used in |
|-----------|---------|---------|
| `hypercard` | Root widget div | WindowChrome (data-widget) |
| `window-frame` | Outer container | WindowChrome |
| `title-bar` | Title bar row | WindowChrome |
| `close-box` | Close box square | WindowChrome |
| `title-text` | Centered title | WindowChrome |
| `tab-bar` | Layout tab strip | WindowChrome |
| `tab` | Individual tab | WindowChrome |
| `nav-bar` | Navigation bar | NavBar |
| `btn` | Button | Btn |
| `chip` | Action chip | Chip |
| `toast` | Toast notification | Toast |
| `data-table` | Table container | DataTable |
| `table-header` | Header row | DataTable |
| `table-row` | Data row | DataTable |
| `table-cell` | Cell | DataTable |
| `table-footer` | Footer row | DataTable |
| `card` | Card wrapper | All cards |
| `card-title` | Card heading | All cards |
| `card-body` | Card content | All cards |
| `card-toolbar` | Card toolbar | ListCard |
| `filter-bar` | Filter controls | ListCard |
| `status-bar` | Row count / status | ListCard |
| `menu-grid` | Button grid | MenuCard |
| `field-grid` | Field layout | DetailCard, FormCard |
| `field-label` | Field label | DetailCard, FormCard |
| `field-value` | Read-only value | DetailCard |
| `field-input` | Editable input | DetailCard, FormCard |
| `button-group` | Action buttons | DetailCard, FormCard |
| `chat-timeline` | Message list | ChatCard |
| `chat-message` | Single message | ChatCard |
| `chat-composer` | Input area | ChatCard |
| `chat-input` | Text input | ChatCard |
| `chat-suggestions` | Suggestion chips | ChatCard |
| `ai-panel` | AI side panel | LayoutSplit |
| `ai-panel-header` | AI panel header | LayoutSplit |

### B. Data-State Values

| data-state | Meaning | Used on |
|------------|---------|--------|
| `active` | Currently selected | btn, tab |
| `out-of-stock` | qty === 0 | table-cell |
| `low-stock` | qty <= threshold | table-cell |
| `unstyled` | No base CSS | root widget |
| `open` | Drawer expanded | ai-panel (drawer) |
| `closed` | Drawer collapsed | ai-panel (drawer) |

### C. Token Quick Reference

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-color-bg` | `#fff` | Background |
| `--hc-color-alt` | `#f5f4ed` | Alternating / footer bg |
| `--hc-color-ai` | `#f0efe8` | AI panel background |
| `--hc-color-border` | `#000` | All borders and shadows |
| `--hc-color-text` | `#000` | Primary text |
| `--hc-color-muted` | `#777` | Labels, metadata |
| `--hc-color-error` | `#a00` | Out-of-stock, danger |
| `--hc-color-warning` | `#960` | Low-stock |
| `--hc-color-success` | `#060` | AI labels |
| `--hc-color-link` | `#006` | User message labels |
| `--hc-font-family` | Geneva/Chicago/Monaco | All text |
| `--hc-border-width` | `2px` | Primary borders |
| `--hc-border-radius` | `0` | All corners (retro = square) |
| `--hc-shadow-btn` | `1px 1px 0` | Button depth |
| `--hc-shadow-window` | `2px 2px 0` | Window depth |
| `--hc-ai-panel-width` | `270px` | Split layout AI panel |

### D. RTK Slice Summary

| Slice | State Shape | Actions | Key Selectors |
|-------|------------|---------|---------------|
| navigation | `{ layout, stack[] }` | navigate, goBack, setLayout | selectCurrentCardId, selectNavDepth, selectLayout |
| inventory | `{ items[] }` | updateQty, saveItem, deleteItem, createItem, receiveStock | selectItems, selectItemBySku, selectLowStockItems |
| sales | `{ log[] }` | (future) | selectSalesLog |
| notifications | `{ toast }` | showToast, clearToast | selectToast |
| chat | `{ messages[] }` | addMessage, addMessages, resetChat | selectMessages |

---

*Document produced for ticket HC-001-IMPORT-JSX on 2026-02-12.*
