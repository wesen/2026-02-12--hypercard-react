# HyperCard JS API User Guide and Reference

> **Last verified against source**: 2026-02-13  
> **Engine barrel**: `packages/engine/src/index.ts`

## 1. Purpose and Scope

This document is the authoritative API reference for `@hypercard/engine`. It covers:

- DSL model (CardStackDefinition, CardDefinition, ActionDescriptor, UINode)
- Shell runtime (HyperCardShell, CardRenderer, navigation, toasts)
- Domain integration (shared selectors, shared actions, createAppStore)
- Value expressions (Sel, Param, Ev, Act)
- Scoped state system
- App creation patterns (createDSLApp, createStoryHelpers)
- Streaming chat system
- Debug utilities

## 2. Architecture

### Runtime Flow

```
User interaction → CardRenderer emits binding event
  → Shell resolves ActionDescriptor args (Sel/Param/Ev expressions)
  → Runtime executes action:
      1. Built-in (nav.go, toast, state.set, etc.)
      2. Local handler (card → cardType → background → stack → global)
      3. Shared handler (from sharedActions registry)
      4. Unhandled (console.warn)
  → Reducers update state → Shell re-renders
```

### Package Structure

| Module | Exports | Purpose |
|--------|---------|---------|
| `cards/` | `CardStackDefinition`, `CardDefinition`, `ActionDescriptor`, `UINode`, `Act`, `Sel`, `Param`, `Ev`, `ui.*` | DSL types + helpers |
| `components/shell/` | `HyperCardShell`, `CardRenderer`, `ChatSidebar`, layouts | Runtime shell |
| `components/widgets/` | `DataTable`, `ListView`, `FormView`, `DetailView`, `MenuGrid`, `ChatView`, `StreamingChatView`, etc. | UI primitives |
| `app/` | `createAppStore`, `createDSLApp`, `createStoryHelpers` | App bootstrap utilities |
| `chat/` | `streamingChatReducer`, `useChatStream`, `fakeStream` | Streaming chat system |
| `debug/` | `debugReducer`, `StandardDebugPane`, `useStandardDebugHooks` | Debug infrastructure |
| `features/navigation/` | `navigationReducer`, `navigate`, `goBack`, `setLayout`, `initializeNavigation` | Navigation state |
| `features/notifications/` | `notificationsReducer`, `showToast`, `clearToast` | Toast state |

## 3. DSL Model

### CardStackDefinition

```ts
interface CardStackDefinition<TRootState = unknown> {
  id: string;
  name: string;
  icon: string;
  homeCard: string;            // ID of the default card
  global?: { state?, selectors?, actions? };
  stack?: { state?, selectors?, actions? };
  backgrounds?: Record<string, BackgroundDefinition>;
  cardTypes?: Record<string, CardTypeDefinition>;
  cards: Record<string, CardDefinition>;
}
```

### CardDefinition

```ts
interface CardDefinition<TRootState = unknown> {
  id: string;
  type: string;                // e.g., 'list', 'detail', 'form', 'menu'
  title?: string;
  icon?: string;
  backgroundId?: string;
  state?: { initial?: Record<string, unknown> };
  ui: UINode;                  // DSL UI tree
  bindings?: CardBindings;     // event→action mapping
  selectors?: Record<string, CardSelectorFn>;
  actions?: Record<string, CardActionHandler>;
}
```

### ActionDescriptor

```ts
interface ActionDescriptor {
  $: 'act';
  type: string;
  args?: ValueExpr;
  to?: ActionScope;  // 'card' | 'cardType' | 'background' | 'stack' | 'global' | 'shared' | 'auto'
}
```

### Value Expressions

| Helper | Type | Purpose |
|--------|------|---------|
| `Sel(name, from?, args?)` | `SelExpr` | Resolve a selector by name |
| `Param(name)` | `ParamExpr` | Read a navigation parameter |
| `Ev(name)` | `EvExpr` | Read from the triggering event payload |
| `Act(type, args?, opts?)` | `ActionDescriptor` | Create an action descriptor |

Example:
```ts
Act('nav.go', { card: 'detail', param: Ev('id') })
Act('contact.save', { data: Sel('formValues', 'card') }, { to: 'shared' })
```

### UI Node Helpers

```ts
ui.menu({ items: [...] })
ui.list({ items: Sel('allItems', 'shared'), columns: [...] })
ui.detail({ fields: [...], record: Sel('currentItem', 'shared') })
ui.form({ fields: [...] })
ui.report({ sections: [...] })
ui.chat({ messages: Sel('messages', 'shared'), suggestions: [...] })
```

## 4. Built-in Actions

| Action | Args | Behavior |
|--------|------|----------|
| `nav.go` | `{ card, param? }` | Push card onto navigation stack |
| `nav.back` | — | Pop navigation stack |
| `toast.show` | `{ message }` | Show a toast notification |
| `state.set` | `{ scope?, path, value }` | Set a scoped state path |
| `state.setField` | `{ scope?, path?, key, value }` | Set `path.key` in scoped state |
| `state.patch` | `{ scope?, patch }` | Merge patch into scoped state |
| `state.reset` | `{ scope? }` | Reset scoped state for scope |

`scope` defaults to `'card'` and can be: `card`, `cardType`, `background`, `stack`, `global`.

## 5. Action Resolution

When `descriptor.to` is set:
- `'shared'` → only shared handler
- `'card'` / `'stack'` / etc. → only that local scope
- `'auto'` or unset → cascade: local (card→cardType→background→stack→global) then shared

Unhandled actions emit a `console.warn` with action type and card context.

## 6. Selector Resolution

Order (when `from` is `auto` or unset): card → cardType → background → stack → global → shared.

Each scope can also read from scoped state:
- `state.somePath` reads from that scope's state object
- Direct key names match against scope's state keys

## 7. App Bootstrap

### createAppStore

```ts
import { createAppStore } from '@hypercard/engine';

const { store, createStore } = createAppStore({
  contacts: contactsReducer,
  deals: dealsReducer,
});
```

Pre-wires: `hypercardRuntime`, `navigation`, `notifications`, `debug` reducers.

### createDSLApp

```ts
const { App, store, createStore } = createDSLApp({
  stack: MY_STACK,
  sharedSelectors, sharedActions,
  domainReducers: { contacts: contactsReducer },
  navShortcuts: [{ card: 'home', icon: '🏠' }],
  snapshotSelector: (state) => ({ contacts: state.contacts }),
});
```

### createStoryHelpers

```ts
const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  stack: MY_STACK,
  sharedSelectors, sharedActions,
  createStore,
  navShortcuts: [...],
  cardParams: { contactDetail: 'c1' },
  snapshotSelector: (state) => ({ ... }),
});
```

Returns helpers for Storybook. The `meta` and `export default` must be inline in the story file (Storybook v10 CSF parser requirement).

## 8. Streaming Chat

### Setup

```ts
import { streamingChatReducer, useChatStream } from '@hypercard/engine';

// Add to store
const { store } = createAppStore({ streamingChat: streamingChatReducer, ... });

// In component
const { messages, isStreaming, send, cancel, reset } = useChatStream({
  responseMatcher: myCustomMatcher,
});
```

### Components

- **`StreamingChatView`** — Chat widget with streaming cursor, thinking state, cancel
- **`ChatSidebar`** — Collapsible sidebar wrapping StreamingChatView

### Fake Streaming

```ts
import { fakeStream, defaultResponseMatcher, tokenize } from '@hypercard/engine';

const cancel = fakeStream('hello', {
  onToken: (t) => console.log(t),
  onDone: () => console.log('done'),
  onError: (e) => console.error(e),
}, { thinkingDelay: 400, minTokenDelay: 20, maxTokenDelay: 60 });
```

## 9. Debug Utilities

- **`useStandardDebugHooks()`** — Hook providing `onEvent` + `shouldCapture` + `sanitize`
- **`StandardDebugPane`** — Collapsible debug panel with event log + state inspector
- **`debugReducer`** — Redux slice for debug event storage

## 10. Navigation

```ts
import { navigate, goBack, setLayout, initializeNavigation, resetNavigation } from '@hypercard/engine';

dispatch(initializeNavigation({ homeCard: 'dashboard' }));
dispatch(navigate({ card: 'detail', paramValue: 'item-1' }));
dispatch(goBack());
dispatch(setLayout('drawer'));  // resets to homeCard
dispatch(resetNavigation());    // resets to homeCard without layout change
```

## 11. Theming

Import default theme packs, then optionally a named theme:

```ts
import '@hypercard/engine/src/theme';
import '@hypercard/engine/src/theme/modern.css';
```

Override tokens:
```css
[data-widget="hypercard"].theme-custom {
  --hc-color-bg: #1a1a2e;
  --hc-font-family: 'Inter', sans-serif;
}
```

## 12. Tooling

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (inventory) |
| `npm run build` | Build engine + all 4 apps |
| `npm run typecheck` | TypeScript project-references check |
| `npm run lint` | Biome lint + format check |
| `npm run lint:fix` | Biome auto-fix |
| `npm run test` | Vitest runtime tests (engine) |
| `npm run storybook` | Storybook dev server |

## 13. Legacy Notes

The following symbols from earlier versions are **no longer part of the API**:

- `dispatchDSLAction` — replaced by runtime action execution in HyperCardShell
- `defineActionRegistry` — replaced by `sharedActions` prop on HyperCardShell
- `selectDomainData` — replaced by shared selectors
- `customRenderers` — replaced by DSL `ui.*` node system + CardRenderer
- `domainData` — replaced by shared selectors reading from Redux state
- `Stack.data` — replaced by Redux slices + shared selectors

If migrating from these patterns, see the card stack DSL architecture in the README.
