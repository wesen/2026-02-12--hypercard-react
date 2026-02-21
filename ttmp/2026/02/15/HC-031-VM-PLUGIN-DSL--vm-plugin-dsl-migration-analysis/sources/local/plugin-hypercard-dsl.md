---
Title: Imported Source - plugin-hypercard-dsl
Ticket: HC-031-VM-PLUGIN-DSL
Status: active
Topics:
    - architecture
    - dsl
    - frontend
DocType: reference
Intent: reference
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Imported source proposal used as an input for HC-031 analysis.
LastUpdated: 2026-02-15T16:19:32-05:00
WhatFor: Preserve the original migration concept draft inside ticket-managed docs.
WhenToUse: Use as input reference when reviewing HC-031 design decisions.
---

Yes — that mapping can be *very* clean:

* **Card ≈ plugin module** (JS `render()` + `handlers`, returns a data-only UI tree)
* **Stack ≈ plugin container** (a manifest + a set of card modules, plus shared stack resources)
* **Session ≈ open window** with **one JS VM instance** (QuickJS) that executes the stack’s cards

And if you keep the “JS in the DSL, executed in the sandbox” idea, you can delete most of the confusing HyperCard resolver machinery (`Sel/Param/Ev`, auto-scope lookup, etc.) and adopt the plugin pipeline that’s already working well.

Below is a deeper, updated design that takes your plugin runtime seriously as the foundation, while still integrating with the **Redux store** and **stack/windowing system**.

---

# 1) Detailed overview of the frontend plugin system (what you actually have)

I’m going to describe it from the *concrete implementation* in the zip.

## 1.1 QuickJS execution model (Worker + per-instance VM)

* There is **one Web Worker** (see `packages/plugin-runtime/src/worker/runtime.worker.ts`).
* Inside it, `QuickJSRuntimeService` manages a `Map<instanceId, PluginVm>` (`runtimeService.ts`).
* Each `PluginVm` has:

  * a `QuickJSRuntime`
  * a `QuickJSContext`
  * a deadline for timeouts (interrupt handler)

Default limits (in `runtimeService.ts`):

* memory limit: **32 MB**
* stack: **1 MB**
* load timeout: **1000 ms**
* render timeout: **100 ms**
* event timeout: **100 ms**

That’s already very aligned with “session = VM”.

## 1.2 Bootstrap API: `definePlugin`, `ui.*`, and `__pluginHost`

The worker injects a big bootstrap string (`BOOTSTRAP_SOURCE` in `runtimeService.ts`) which defines:

### `__ui` — *builder functions that return JSON nodes*

Examples:

* `ui.text(content)` → `{ kind: "text", text: "..." }`
* `ui.column(children)` → `{ kind: "column", children: [...] }`
* `ui.button(label, props)` → `{ kind: "button", props: { label, onClick?, ... } }`

Everything is **data-only**.

### `definePlugin(factory)`

* Called by plugin code.
* Stores the created plugin object into `__plugin`.

### `globalThis.__pluginHost`

A host-callable API:

* `getMeta()` → returns plugin meta (title, description, initialState, widgets list)
* `render(widgetId, pluginState, globalState)` → runs widget render and returns a UINode tree
* `event(widgetId, handlerName, args, pluginState, globalState)` → runs handler and returns **dispatch intents**

## 1.3 State change pipeline: “intents, not dispatch”

Inside `__pluginHost.event(...)`:

* it creates `__dispatchIntents = []`
* exposes two functions to plugin handlers:

  * `dispatchPluginAction(actionType, payload?)`
  * `dispatchSharedAction(domain, actionType, payload?)`
* handler runs and pushes intents into the list
* host receives `DispatchIntent[]`

So plugin code never gets Redux dispatch. It can only emit **intent objects**.

## 1.4 Host side: Sandbox client and request routing

The browser uses `QuickJSSandboxClient` (`worker/sandboxClient.ts`) which posts messages to the worker:

* `loadPlugin`
* `render`
* `event`
* `disposePlugin`
* `health`

That client is what your “stack shell” would call.

## 1.5 Redux integration + capability gating

The plugin playground runtime store (`redux-adapter/store.ts`) shows the pattern:

* Keep per-instance local state (`pluginStateById`)
* Keep shared domains (`shared`) with reducers
* Enforce grants:

  * `readShared` → filters what appears in `globalState.shared`
  * `writeShared` → gates whether shared dispatch is applied or denied
* Record a timeline entry for every dispatch attempt:

  * applied / denied / ignored

This model is gold for debugging and is *exactly* the kind of thing you want for cards too.

---

# 2) Why the plugin DSL is clearer than the current HyperCard DSL

## What the plugin DSL does better

* **Render is JS**: derived values are computed naturally (no resolver gymnastics).
* **Events are explicit**: `onClick: { handler: "..." }` is straightforward.
* **No render-time dispatch**: state changes happen only via intents returned from handlers → applied by host after the event completes.
* **Everything crossing the boundary is data-only**: forces discipline, makes sandboxing real.

## Where HyperCard differs (and gets confusing)

Your current HyperCard runtime:

* renders a data DSL tree where values are `ValueExpr` (`Sel/Param/Ev`)
* resolves expressions by pulling `store.getState()` in render and running selector registries
* has “auto scope” + “state fallback” behavior that makes it hard to reason about
* can accidentally create render/update loops (you saw this)

In short:

* **Plugin system** = “JS render, intent actions, host applies”
* **Current HyperCard** = “host resolves expressions during render, plus direct dispatch plumbing”

If you like plugin DSL clarity, the best move is to **flip HyperCard to the plugin model**.

---

# 3) Your proposed mapping (card=plugin, stack=container, session=VM) — what works, and what to watch

## The clean conceptual model

* **Card plugin module**: a JS file that exports `{ render, handlers, meta, initialState }`
* **Stack container**: assembles multiple card plugins and gives stack-level metadata (icon, home card, etc)
* **Session/window**: owns one VM instance (QuickJS context) running that stack container code

## The big practical detail: isolation boundaries

If multiple cards run inside the **same VM**, they share JS memory. That means:

* you **cannot** enforce per-card capability isolation inside one VM (a card can stash data in a module global and another card can read it later).
* so capabilities should be applied at the **stack/session VM level**, not per card.

This is usually fine: a “stack” is one authored app. Cards inside a stack typically aren’t meant to be mutually untrusted.

If you *do* want third-party cards with different privileges:

* you’ll need **separate VMs per card**, or a separate “embedded plugin widget” model (cards can host other plugin VMs inside them).

---

# 4) Bridging design: keep plugin DSL, integrate with Redux + stacks + windowing

Here’s the system I’d build given your new direction:

## 4.1 Runtime architecture overview

### Host (React + Redux)

* Owns the **real Redux store**:

  * your domain slices (inventory, crm, todo…)
  * windowing/session nav slice
  * a new “card sandbox runtime” slice (VM lifecycle, card local state, timeline)
* Renders windows
* Calls sandbox to render the active card UI tree
* Applies intents from sandbox into Redux

### Sandbox (QuickJS)

* Executes card render and handlers
* Returns:

  * UI tree (data-only)
  * intents (data-only)

### Loop

1. Redux state changes → host recomputes projected `globalState` → sandbox `render()` → host renders tree
2. UI event → sandbox `event()` → returns intents → host applies them to Redux → repeat

This is literally your plugin playground loop, just with “widgetId = current card id” and “instanceId = sessionId”.

---

# 5) Recommended implementation shape: “Stack bundle per session” with card modules inside

Even if you *think* “plugin = card”, I strongly recommend making the **loaded unit** a *stack bundle* (container) that registers multiple cards.

Why?

* one VM per session
* fast card navigation (no load/unload)
* shared stack-level utilities in the VM
* matches your existing plugin runtime shape (one plugin object with many widgets)

You can still author each card as its own “plugin-like module” and bundle them into the container at build time.

### In other words

* **Authoring**: card = plugin module
* **Runtime load unit**: stack container plugin (widgets = cards)

This is the same compromise most systems use (modules vs bundles).

---

# 6) The missing piece: per-card state in the plugin model

Your current plugin runtime passes only:

* `pluginState` (per instance)
* `globalState`

But in a card system you almost always want:

* **session state** (per window)
* **card state** (per card instance within that window)

In HyperCard terms: “card scoped state” should be per `(sessionId, cardId)`.

## 6.1 Extend the sandbox contract (v2)

Change worker API to pass **two state objects**:

* `instanceState` (session-level)
* `cardState` (per card)

So sandbox calls become:

* `render(cardId, cardState, instanceState, globalState)`
* `event(cardId, handler, args, cardState, instanceState, globalState)`

And handler context includes:

* `dispatchCardAction(type, payload?)`
* `dispatchInstanceAction(type, payload?)`
* `dispatchDomainAction(domain, type, payload?)`
* `dispatchSystemCommand(command, payload?)`

This keeps the plugin DSL ergonomics, but aligns with card semantics.

## 6.2 Where these live in Redux

Create a slice like:

```ts
cardSandboxRuntime: {
  instanceStateBySession: Record<sessionId, any>,
  cardStateBySession: Record<sessionId, Record<cardId, any>>,
  timeline: TimelineEntry[],
  vms: Record<sessionId, { stackId, status, error? }>
}
```

This replaces your current `hypercardRuntime` slice nicely, or you can map it onto the same scopes if you still want global/stack/cardType/background later.

---

# 7) Integrating with the windowing + stack system

You can keep most of your windowing slice logic as-is.

## 7.1 Session identity

In your engine, card windows already have `cardSessionId`.
Use:

* `instanceId = cardSessionId`
* `widgetId/cardId = currentNav.card`

So “session = VM instance” becomes literal.

## 7.2 Navigation

Navigation remains host-owned (Redux `windowing.sessions[sessionId].nav`).

Sandbox doesn’t mutate nav directly. It emits system intents:

* `{ scope: "system", command: "nav.go", payload: { cardId, params } }`
* `{ scope: "system", command: "nav.back" }`

Host applies:

* `nav.go` → dispatch `windowingSlice.sessionNavGo(...)`
* `nav.back` → dispatch `windowingSlice.sessionNavBack(...)`

## 7.3 Params should become structured

Your windowing types currently store `param?: string`.

If you’re moving to a JS plugin DSL, you will quickly want structured params:

* `{ sku: "A-123" }`
* `{ customerId: "c42", tab: "orders" }`

So change nav entry to:

```ts
type NavEntry = { card: string; params?: unknown };
```

Everything crossing the sandbox boundary is JSON anyway, so this is natural.

---

# 8) How cards access Redux state (domain + stack/runtime), without “selectors”

In the plugin model, cards don’t need “selectors” as a special concept. They just read from `globalState` and compute.

## 8.1 Projected `globalState` shape for cards

Keep the plugin playground convention, but extend it:

```ts
globalState = {
  self: { sessionId, stackId, cardId, windowId },

  // Domain slices the stack is allowed to read (filtered)
  domains: {
    inventory: { items: [...], suppliers: [...] },
    crm: { customers: [...] },
  },

  // Stack/session runtime info
  nav: {
    current: { cardId, params },
    depth: number,
    canBack: boolean,
  },

  // Optional: scoped runtime state beyond cardState
  scopes: {
    global: {...},
    stack: {...},
    // cardState is passed separately, but merged can be convenient:
    merged: {...},
  },

  system: {
    now: Date.now(),
    focusedWindowId: ...,
    // maybe debug metrics, etc
  }
}
```

Then a card render is just:

```js
render({ cardState, globalState }) {
  const items = globalState.domains.inventory.items;
  const low = items.filter(i => i.qty <= (globalState.scopes.stack.threshold ?? 3));
  ...
}
```

No resolver, no “auto scope”, no memoization traps.

---

# 9) Bridging the UI layer: extend the plugin UI DSL to cover your HyperCard widgets

Right now plugin UI DSL supports: `text, badge, button, input, row, column, panel, table`.

Your HyperCard engine supports richer nodes: `screen, toolbar, list, detail, form, report, chat, menu…`

If you want plugin DSL to replace HyperCard DSL, you have two options:

## Option A: Keep plugin DSL minimal, implement everything with primitive nodes

This quickly gets painful (you’ll re-implement list/detail patterns in every card).

## Option B (recommended): Extend plugin UI schema with “blessed widgets”

Add builders like:

* `ui.screen({ header, body })`
* `ui.toolbar({ left, right })`
* `ui.list({ items, columns, onRowClick, ... })`
* `ui.detail({ record, fields, ... })`
* `ui.form({ fields, values, onSubmit })`
* `ui.report({ sections, actions })`
* `ui.chat({ messages, onSend, ... })`

The host React renderer maps these to your existing components (`ListView`, `DetailView`, etc).

**Important constraint**: configs must become **data-only**.
Your current HyperCard `columns` sometimes carry functions. That won’t cross the sandbox boundary. So you’ll want to redesign column configs into declarative specs (format ids, cell variants, etc.) or precompute display values in render.

This is exactly where plugin DSL’s discipline helps.

---

# 10) Intent routing into Redux (domain + card + system)

This is where you combine the best parts of both systems: Redux + capability gating + timeline.

## 10.1 Intent types

Generalize your current intent union:

* `scope: "card"` → updates cardState for `(sessionId, cardId)`
* `scope: "session"` → updates instanceState for session
* `scope: "domain"` → dispatches into a whitelisted domain reducer/action table
* `scope: "system"` → nav/window/toast/focus/etc

Example intents:

```js
// card local UI state
{ scope: "card", actionType: "state/merge", payload: { query: "abc" } }

// navigate
{ scope: "system", command: "nav.go", payload: { cardId: "itemDetail", params: { sku: "A-1" } } }

// domain write (inventory)
{ scope: "domain", domain: "inventory", actionType: "adjustStock", payload: { sku: "A-1", delta: -1 } }
```

## 10.2 Capability gating (stack-level)

Each stack container declares grants:

```ts
capabilities: {
  readDomains: ["inventory"],
  writeDomains: ["inventory"],
  systemCommands: ["nav.go", "nav.back", "toast.show", "window.open"],
}
```

Host enforces these exactly like your plugin runtime enforces shared domains today:

* missing write grant → denied
* unknown action → ignored
* applied → applied

…and records timeline entries.

---

# 11) What you gain immediately (and why this resolves your earlier pain)

Moving to “JS render in sandbox + intent handlers” gives you:

* No React-Redux selector weirdness inside cards
* No render-time state mutation loops (the class of bug you hit)
* Cleaner debugging:

  * timeline shows *exactly* what intents happened and why
  * sandbox render errors are isolated and attributable to a session + card
* Much clearer mental model:

  * “render is a pure function of (cardState, globalState)”
  * “handlers emit intents”

Which is the same clarity your plugin playground already demonstrates.

---

# 12) If you want the *purest* “plugin=card” runtime (not just authoring)

If you truly want each card to be a separately loaded plugin *at runtime* (not bundled):

### Two ways:

## A) Separate VM per card instance

* session would host multiple VMs (one per visited card) or reload on navigation
* strongest isolation (capabilities per card possible)
* heavier runtime and more lifecycle complexity

## B) Multi-card registry inside one VM (recommended if isolation isn’t needed)

Extend bootstrap to support multiple registrations:

* `defineStack(meta)`
* `defineCard(cardId, factory)`

Then the host loads N card scripts into the same VM instance for the session.

This matches your conceptual model (“cards are plugins”), but still keeps “session = one VM”.

---

# 13) Suggested “v2 card plugin API” (concrete and ergonomic)

Here’s a shape that matches your plugin DSL style but is card-oriented:

```js
defineStack(({ ui }) => ({
  id: "inventory",
  title: "Inventory",
  icon: "box",
  home: "home",

  cards: {
    lowStock: {
      title: "Low Stock",
      initialState: { query: "" },

      render({ cardState, globalState }) {
        const items = globalState.domains.inventory.items;
        const q = (cardState.query ?? "").toLowerCase();
        const filtered = items.filter(i => i.name.toLowerCase().includes(q) && i.qty <= 3);

        return ui.column([
          ui.text("Low Stock"),
          ui.input(cardState.query ?? "", { onChange: { handler: "queryChanged" } }),
          ui.table(
            filtered.map(i => [i.sku, i.name, i.qty]),
            { headers: ["SKU", "Name", "Qty"] }
          ),
        ]);
      },

      handlers: {
        queryChanged({ dispatchCardAction }, { value }) {
          dispatchCardAction("state/merge", { query: value });
        },

        openItem({ dispatchSystemCommand }, { sku }) {
          dispatchSystemCommand("nav.go", { cardId: "itemDetail", params: { sku } });
        }
      }
    }
  }
}));
```

It’s basically your plugin system API, but with:

* stack metadata
* per-card state
* system commands

---

## Bottom line recommendation

Given your preference and what’s already solid in the plugin runtime:

* Keep **session = VM instance** (per window)
* Load a **stack container** into that VM (bundle of cards)
* Model **cards as widgets/modules** inside the container
* Run **render + handlers in sandbox**
* Route **intents through Redux** with capability gating + timeline
* Extend UI DSL with your richer widgets, but make configs **data-only**
