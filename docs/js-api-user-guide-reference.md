# HyperCard JS API User Guide and Reference

> **Last verified against source**: 2026-03-11  
> **Engine barrel**: `packages/engine/src/index.ts`

## 1. Purpose and Scope

This document is the authoritative API reference for `@hypercard/engine`. It covers:

- runtime bundle model (`RuntimeBundleDefinition`, `RuntimeSurfaceMeta`)
- desktop shell and window launching
- Storybook app wiring with `createStoryHelpers`
- VM-authored surface examples and host integration points
- widgets and theme loading

This reference used to describe the older card/stack DSL model. APP-23 renamed the live runtime-core types to bundle/surface terminology. The sections below are updated to match the current shipped source.

## 2. Architecture

### Runtime Flow

```
DesktopShell opens a runtime surface window
  → RuntimeSurfaceSessionHost loads a runtime bundle into a runtime session
  → VM render() returns a runtime surface tree for a surface type such as `ui.card.v1` or `kanban.v1`
  → Host validates and renders that tree
  → UI events call VM handlers
  → VM dispatches actions like `nav.go`, `notify.show`, `draft.patch`
  → Host reducers update state → surface re-renders
```

### Package Structure

| Module | Exports | Purpose |
|--------|---------|---------|
| `cards/` | `RuntimeBundleDefinition`, `RuntimeSurfaceMeta` | Desktop/runtime bundle metadata |
| `components/shell/windowing/` | `DesktopShell`, window content adapters, desktop command routing | Desktop shell |
| `components/widgets/` | `DataTable`, `ListView`, `FormView`, `DetailView`, `MenuGrid`, `ChatView`, `StreamingChatView`, etc. | UI primitives |
| `app/` | `createStoryHelpers`, story param helpers | Story/app bootstrap helpers |
| `chat/` | `streamingChatReducer`, `useChatStream`, `fakeStream` | Streaming chat system |
| `debug/` | `debugReducer`, `StandardDebugPane`, `useStandardDebugHooks` | Debug infrastructure |
| `features/notifications/` | `notificationsReducer`, `showToast`, `clearToast` | Toast state |

## 3. DSL Model

### RuntimeBundleDefinition

```ts
interface RuntimeBundleDefinition {
  id: string;
  name: string;
  icon: string;
  homeSurface: string;
  plugin: {
    packageIds: string[];
    bundleCode: string;
    capabilities?: {
      domain?: 'all' | string[];
      system?: 'all' | string[];
    };
  };
  surfaces: Record<string, RuntimeSurfaceMeta>;
}
```

### RuntimeSurfaceMeta

```ts
interface RuntimeSurfaceMeta {
  id: string;
  type: string;
  title?: string;
  icon?: string;
  ui: Record<string, unknown>;
  meta?: Record<string, unknown>;
}
```

The runtime-side UI DSL is no longer described by static engine `ActionDescriptor` / `CardDefinition` types. VM bundles define runtime surfaces in QuickJS via:

```js
defineRuntimeBundle(({ ui, widgets }) => ({
  id: 'example',
  title: 'Example',
  packageIds: ['ui'],
  surfaces: {
    home: {
      render() {
        return ui.panel([
          ui.text('Hello'),
          ui.button('Open detail', {
            onClick: { handler: 'go', args: { surfaceId: 'detail' } },
          }),
        ]);
      },
      handlers: {
        go(context, args) {
          context.dispatch({
            type: 'nav.go',
            payload: { surfaceId: String(args.surfaceId || 'home') },
          });
        },
      },
    },
  },
}));
```

## 4. Built-in Actions

| Action | Args | Behavior |
|--------|------|----------|
| `nav.go` | `{ surfaceId, param? }` | Navigate to another runtime surface |
| `nav.back` | — | Go back in runtime surface navigation |
| `notify.show` | `{ message }` | Show a host notification |
| `draft.set` | `{ path, value }` | Set a draft-state path |
| `draft.patch` | `{ ... }` | Merge into draft state |
| `draft.reset` | — | Reset draft state |
| `filters.set` | `{ path, value }` | Set a session/filter path |
| `filters.patch` | `{ ... }` | Merge into session/filter state |
| `filters.reset` | — | Reset session/filter state |

## 7. App Bootstrap

### createStoryHelpers

```ts
const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  bundle: MY_BUNDLE,
  createStore,
  surfaceParams: { detail: 'item-1' },
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

`DesktopShell` opens a bundle’s `homeSurface` by default. VM-authored runtime surfaces navigate by dispatching runtime actions:

```js
context.dispatch({ type: 'nav.go', payload: { surfaceId: 'detail', param: 'item-1' } });
context.dispatch({ type: 'nav.back' });
```

For Storybook and desktop-shell examples, the current helper path is:

```tsx
const { createStory, FullApp } = createStoryHelpers({
  bundle: MY_BUNDLE,
  createStore,
  surfaceParams: { detail: 'item-1' },
});
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
