---
Title: Imported Source - Webchat Hyper Integration
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - frontend
    - architecture
    - websocket
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources:
    - /tmp/webchat-hyper-integration.md
Summary: Imported source analysis document provided by user; retained verbatim below.
LastUpdated: 2026-02-16T10:00:00-05:00
WhatFor: External design reference for validating and planning implementation.
WhenToUse: Read this source when comparing implementation decisions with the original proposed architecture.
---

HyperCard VM Plugins + Card DSL
Pinocchio WebChat + Geppetto Middlewares & Structured Event Sinks
Integration & Inventory App Design

 

Design/analysis document (generated February 16, 2026)

 

Scope:

1) Explain the HyperCard React engine’s Card DSL and QuickJS VM plugin runtime, Pinocchio’s WebChat transport + timeline model, and Geppetto’s inference middlewares and structured event sinks.
2) Design a system that prompts an LLM to emit HyperCard VM plugin code in a machine-extractable way, so the code can be validated and injected into the VM.
3) Lay out an architecture for a chat-driven HyperCard inventory app that can inline rich widgets in chat and optionally materialize results as new cards.

 

Repository snapshot analyzed:

• /mnt/data/webchat-hypercard/2026-02-12--hypercard-react (TypeScript/React)

• /mnt/data/webchat-hypercard/pinocchio (Go + web frontend)

• /mnt/data/webchat-hypercard/geppetto (Go)

 

Table of contents (high level)
1. HyperCard: Card DSL + VM Plugin Runtime (QuickJS)
2. Pinocchio WebChat: conversation lifecycle + streaming SEM events
3. Geppetto: inference middlewares + structured event sinks
4. Designing an LLM→Plugin pipeline (middlewares + sinks + validation + injection)
5. Inventory app design: chat + inline widgets + “create card” flows
Appendix A: Key file references (where the behaviors come from)
Appendix B: Example prompts and structured blocks
 

1. HyperCard: Card DSL and QuickJS VM Plugin Runtime
In this codebase, “HyperCard” is a React/Redux desktop shell that can host multiple independent “card sessions” in draggable/resizable windows. Cards are described by a small host-side DSL (metadata + configuration), but their actual rendering and event handling can live inside a sandboxed JavaScript VM (QuickJS compiled to WASM).

There are two distinct layers to keep straight:

• Host layer (TypeScript/React): windowing, persistence, capabilities, domain reducers.
• VM layer (QuickJS): card render functions + event handlers that return intents.
1.1 Core concepts and data model
The smallest useful mental model is:
• A stack is an application (e.g., Inventory, CRM) described by a CardStackDefinition.
• The stack contains card definitions (CardDefinition), mostly metadata: id/title/icon/type.
• For plugin cards, the real behavior lives in a VM “bundle” loaded per session.
• A session is a running instance of the VM + its session/card local state.
• A window is a UI container bound to a session + current card navigation state.

Host-side DSL: CardStackDefinition and CardDefinition
The host describes a stack with CardStackDefinition:
• id, name, icon
• homeCard (default card)
• plugin bundle configuration (bundleCode + capabilities)
• cards: a dictionary from cardId → CardDefinition

A CardDefinition is mostly metadata plus a ‘type’. In the current engine, the primary type is type: 'plugin', which indicates the window should be hosted by the VM runtime.

// packages/engine/src/cards/types.ts (simplified)

export interface CardStackDefinition {

  id: string;

  name: string;

  icon?: string;

  homeCard: string;

 

  plugin: {

    bundleCode: string;        // JS source code run inside QuickJS

    capabilities: {

      domain?: string[];       // domains the plugin may dispatch to

      system?: string[];       // system commands the plugin may emit

    };

  };

 

  cards: Record<string, CardDefinition>;

}

 

export interface CardDefinition {

  id: string;

  type: string;               // 'plugin' is the important one here

  title?: string;

  icon?: string;

  ui: CardUINode;             // mostly placeholder for plugin cards

}

 

Example: the Inventory app defines a stack with a plugin bundle and a fixed set of plugin cards (home, browse, report, assistant, etc.).

// apps/inventory/src/domain/stack.ts (abridged)

export const STACK: CardStackDefinition = {

  id: 'inventory',

  name: 'Shop Inventory',

  icon: '📇',

  homeCard: 'home',

  plugin: {

    bundleCode: INVENTORY_PLUGIN_BUNDLE,

    capabilities: {

      domain: ['inventory', 'sales'],

      system: ['nav.go', 'nav.back', 'notify'],

    },

  },

  cards: { home: {...}, browse: {...}, report: {...}, ... },

};

 

1.2 Windowing and sessions
The DesktopShell component renders the desktop UI and creates windows. Each window either:
• hosts a plugin card (kind: 'card'), or
• hosts an app-owned React component (kind: 'app'), via a renderAppWindow callback.

For plugin cards, DesktopShell instantiates a PluginCardSessionHost which:
1) ensures a plugin runtime session exists in Redux (pluginCardRuntime slice)
2) loads the stack’s plugin bundle into a QuickJS VM for that session
3) renders the current card by calling VM code (renderCard)
4) forwards UI events to VM handlers (eventCard) and dispatches returned intents.

// Window content types (conceptual)

type WindowContent =

  | { kind: 'card'; card: { stackId: string; cardId: string; cardSessionId: string } }

  | { kind: 'app'; appKey: string };

 

This split between “app windows” and “plugin card windows” becomes extremely useful for the inventory-chat design later: the chat surface can be an app window that is allowed to mutate the stack (e.g., add new cards), while plugin cards remain capability-gated.

1.3 The VM plugin runtime: QuickJSCardRuntimeService
HyperCard runs plugin code inside QuickJS (WASM), per session. The runtime service is responsible for:
• creating the QuickJS runtime/context
• loading a “stack bootstrap” script that defines the plugin API (ui primitives, __stackHost)
• evaluating the bundle code for the stack
• calling into the bundle for render/event
• validating outputs (UI nodes + intents)
• enforcing resource limits (memory/stack) and timeouts (interrupt handler)

A very important detail: the VM is not a general-purpose JS runtime. It has no DOM, no network, and only the small API surface the bootstrap exposes. That is what makes runtime code injection relatively safe.

QuickJS safety constraints
The runtime sets explicit limits:
• runtime memory limit (default 32 MB)
• runtime stack size (default 1 MB)
• per-operation deadlines (load, render, handler execution)
• an interrupt handler that stops the VM when the deadline passes

This protects the host from common failure modes like infinite loops, runaway recursion, or extremely large allocations.

1.4 Stack bootstrap: defining the plugin surface
Before your bundle runs, the host loads a bootstrap script (stack-bootstrap.vm.js) into the VM. This script defines the global functions and objects that plugin code can use.

The most important globals created by the bootstrap:
• globalThis.ui: a factory for UI nodes (panel, row, column, text, badge, button, input, table, …)
• globalThis.defineStackBundle(factory): register stack metadata + card definitions
• globalThis.__stackHost: host-callable API for rendering, events, and dynamic definition/patching
The bootstrap stores card definitions in a VM-local registry and exposes __stackHost methods like:
• getMeta(): returns stack metadata (title/description, initial state)
• render(cardId, cardState, sessionState, globalState): returns a UI node tree
• event(cardId, handlerName, args, …): executes a handler and returns intents
• defineCard(cardId, code): dynamically registers a new card
• defineCardRender(cardId, code): replaces a card’s render function
• defineCardHandler(cardId, handlerName, code): replaces/adds an individual handler

// VM-side API shape exposed through __stackHost (conceptual)

__stackHost = {

  getMeta(): StackBundleMeta,

  render(cardId, cardState, sessionState, globalState): UINode,

  event(cardId, handler, args, cardState, sessionState, globalState): RuntimeIntent[],

 

  // Dynamic injection / patching:

  defineCard(cardId, factoryOrObject): void,

  defineCardRender(cardId, fn): void,

  defineCardHandler(cardId, handlerName, fn): void,

};

 

1.5 UI DSL inside the VM
The UI DSL is intentionally tiny and serializable. A plugin card render function returns a JSON-like tree of nodes. On the host side, PluginCardRenderer walks that tree and renders corresponding React components.

Common UI node shapes:
// Example UINode values returned by VM render()

ui.panel([

  ui.text("Inventory Report"),

  ui.row([

    ui.badge("Low stock", { tone: "danger" }),

    ui.button("Open full report", { onClick: { handler: "openReport" } }),

  ]),

  ui.table(

    [{ key: "sku", label: "SKU" }, { key: "qty", label: "Qty", align: "right" }],

    [{ sku: "W-1001", qty: 5 }, { sku: "G-2002", qty: 2 }],

  ),

]);

 

Each button/input can carry an onClick/onChange descriptor of the form:
{ handler: string, args?: any }.
When a user interacts in the host UI, the host calls __stackHost.event(cardId, handler, args, ...).

1.6 State model: cardState, sessionState, globalState
Render and handler functions receive three layers of state:
• cardState: mutable state scoped to the current card within the session
• sessionState: mutable state shared across cards in the same session
• globalState: read-only projection of the host’s Redux state (domains + navigation + system info)

Handlers can emit intents to update cardState/sessionState (patch/set/reset), dispatch domain actions, or trigger system commands (navigation, notifications).

The host constructs globalState for each render/event by filtering out engine internal slices (pluginCardRuntime, windowing, notifications, debug) and projecting the rest as “domains”. It also includes nav.current, nav.param, and a few system fields.

// Projected global state (conceptual)

globalState = {

  self: { stackId, sessionId, cardId, windowId },

  domains: { inventory: {...}, sales: {...}, ... },  // all non-engine reducers

  nav: { current: "browse", param: "sku:W-1001", depth: 2, canBack: true },

  system: { focusedWindowId, runtimeHealth: { status: "ready" } },

};

 

1.7 Intent model and capability policy
Handlers do not mutate host state directly. Instead they “return intents”. An intent is a small object describing an action in one of four scopes:
• card: update cardState
• session: update sessionState
• domain: dispatch a Redux action into an allowed domain reducer
• system: request a host-side system command (nav.go/nav.back/notify/window.close)

The host validates and routes these intents and enforces a capability policy: a plugin bundle must be explicitly granted domain/system permissions in the stack definition.

// Example handler emitting intents

handlers: {

  receiveStock: function(ctx, args) {

    ctx.dispatchDomainAction("inventory", "receiveStock", { sku: args.sku, qty: args.qty });

    ctx.dispatchSystemCommand("notify", { message: "Shipment received" });

  }

}

 

This is an important security boundary for “LLM-generated plugin code”: even if the model emits code that attempts to dispatch arbitrary domain/system operations, the host can deny them.

1.8 Dynamic injection and patching (the key for LLM codegen)
HyperCard supports runtime changes to the set of available cards. There are two practical ways:
1) Inject directly into an existing VM session via runtimeService.defineCard/defineCardRender/defineCardHandler.
2) Append a defineCard(...) call to the stack’s bundleCode so that any *new* session loads the new definition.

The Storybook “Chat Desktop” story demonstrates (2): it registers a new card in stack.cards (metadata), and appends a defineCard call to the plugin bundle’s source string.

// Pattern used in ChatWindowDesktop story:

stack.cards[newId] = { id: newId, type: "plugin", title, icon, ui: {...} };

 

const defineCall =

  `\nglobalThis.__stackHost.defineCard(${JSON.stringify(newId)}, (${code}));\n`;

 

stack.plugin.bundleCode += defineCall;

 

This split is non-negotiable: adding a card requires BOTH
• host-side metadata (CardDefinition) so the desktop knows the card exists, and
• VM-side behavior (defineCard) so the session can render it.

In a production setup you would not mutate the original bundle in-place, but instead maintain a small list of patch strings (or patch objects) that are appended on load. The story’s approach is conceptually correct, even if it is simplistic.

 

1.9 Worker-based sandbox option
The engine also contains a Worker-based runtime (packages/engine/src/plugin-runtime/worker). The idea is to run QuickJS inside a Web Worker so that heavy evaluation does not block the UI thread. The worker speaks a request/response protocol (loadStackBundle, renderCard, eventCard, defineCard, …).

The current DesktopShell uses the in-thread QuickJSCardRuntimeService directly, but the worker path is a natural evolution once runtime injection becomes frequent or bundles become large.

// Worker message protocol (contracts.ts)

type WorkerRequest =

  | { type: "loadStackBundle", stackId, sessionId, code }

  | { type: "renderCard", sessionId, cardId, cardState, sessionState, globalState }

  | { type: "eventCard", sessionId, cardId, handler, args, cardState, sessionState, globalState }

  | { type: "defineCard", sessionId, cardId, code }

  | ...

 

 

2. Pinocchio WebChat: streaming conversations + semantic event model
Pinocchio’s WebChat is a transport and lifecycle layer around Geppetto’s inference engine. It provides:
• conversation/session management (create/reuse/evict)
• HTTP submission endpoint (/chat)
• WebSocket streaming endpoint (/ws)
• an event translation layer that turns low-level inference events into “SEM frames”
• an optional timeline persistence/projector layer.

2.1 Key moving parts
The WebChat package is deliberately modular:

• ConversationService: core conversation + inference orchestration.
• ConvManager: lifecycle storage, fingerprinting, eviction, WebSocket attachments.
• StreamBackend: Watermill router + publisher/subscriber abstraction.
• StreamCoordinator: subscribes to events topic and converts them to SEM frames.
• StreamHub: HTTP/WebSocket handler glue for /ws (upgrade, attach, broadcast).
• TimelineProjector + TimelineStore: optional durable snapshot projection.
2.2 Conversation lifecycle and runtime composition
A conversation is identified by conv_id (string). When a user submits a prompt, WebChat resolves a runtime profile (runtimeKey) and overrides, then ensures a Conversation object exists. Conversations are fingerprinted by runtime configuration; if the fingerprint changes, the engine/sink are rebuilt for that conversation.

The runtime pieces (engine, sink, allowed tools, seed system prompt) are produced by a RuntimeComposer. This is the key extension point: you can create different profiles for different products or “modes”, and you can wrap the event sink with a FilteringSink (structured extraction) for UI artifacts.

// pinocchio/pkg/inference/runtime/composer.go

type RuntimeComposer interface {

  Compose(ctx context.Context, req RuntimeComposeRequest) (RuntimeArtifacts, error)

}

 

type RuntimeArtifacts struct {

  Engine engine.Engine

  Sink   events.EventSink

  SeedSystemPrompt string

  AllowedTools []string

  RuntimeFingerprint string

  RuntimeKey string

}

 

2.3 How /chat triggers inference
The /chat handler accepts a prompt and an optional conv_id. The handler:
1) resolves/ensures the conversation via ChatService
2) publishes a “user message” event
3) starts a Geppetto toolloop run in a goroutine
4) returns quickly (the client reads output via WebSocket).

The toolloop run produces inference events (partial deltas, tool calls/results, final completion). Those events are sent into the conversation’s EventSink.

2.4 Event transport: Watermill topics per conversation
Internally, WebChat uses Watermill as its message bus. Each conversation has a topic:
   chat:<conv_id>

The default sink publishes Geppetto events as JSON onto that topic. A StreamCoordinator subscribes to the same topic and broadcasts translated frames to any connected websockets.

// Topic naming helper in conversation.go

func topicForConv(convID string) string { return "chat:" + convID }

 

2.5 SEM frames: a uniform stream for the frontend
Pinocchio does not stream raw Geppetto events directly. Instead it translates them to a “Semantic Event Message” (SEM) envelope:
   { sem: true, event: { type, id, data, metadata, seq, stream_id } }

This gives the frontend a stable vocabulary for rendering a timeline (messages, tool calls, logs, etc.), even if the underlying LLM provider or engine changes.

// SEM envelope shape (conceptual)

{

  "sem": true,

  "event": {

    "type": "llm.delta",

    "id": "msg-123",

    "data": { "id": "msg-123", "delta": "Hel", "cumulative": "Hel" },

    "seq": 42,

    "stream_id": "c1"

  }

}

 

The StreamCoordinator detects whether a Watermill message is already a SEM envelope. If it is not, it parses it as a Geppetto Event and runs it through an EventTranslator which uses a registry of handlers (semregistry) to produce SEM frames.

2.6 Timeline projection (optional durable state)
If configured with a TimelineStore, WebChat maintains a durable, queryable “timeline” per conversation.
• While frames stream over WebSocket, TimelineProjector applies those frames and updates entity snapshots.
• Clients can hydrate their UI by calling /api/timeline for the full snapshot.

The timeline layer also supports custom event types: you can register handlers that project new SEM event kinds into timeline entities.

2.7 Why WebChat matters for HyperCard integration
WebChat gives you a ready-made set of primitives for building a chat-driven UI with structured artifacts:
• Streaming output (token deltas)
• Tool call lifecycle
• A place to translate “artifact” events (like report widgets or card proposals)
• Durable storage of those artifacts and their relationship to a conversation

The main missing piece is teaching the LLM how to emit HyperCard card/widget specs in a structured way — that is where Geppetto’s structured sink comes in.

 

2.8 WebSocket attachment and backpressure
Each conversation maintains a ConnectionPool (active websocket clients) and a semFrameBuffer (a ring buffer of recent SEM frames). When a new client connects:
• it is added to the pool
• the pool can replay buffered frames (depending on attach options)
• the stream coordinator is started if it was idle.

If all clients disconnect, an idle timer stops the stream subscription.

Design implication:
Because the server can have multiple clients subscribed to the same conversation topic, artifact events (like ‘card proposal’) must be idempotent and carry stable IDs. This matches how HyperCard tends to treat cards: cardId is the stable identifier.

 

3. Geppetto: inference middlewares and structured event sinks
Geppetto is the inference framework underneath Pinocchio. In the context of this document we care about two things:
• Middlewares: wrappers that modify/augment the inference run (system prompts, logging, tool message ordering, etc.)
• Event sinks: subscribers that receive streaming events from the engine (LLM deltas, tool calls, logs). Structured event sinks let you turn specific patterns in model output into typed events.

3.1 The middleware model
In Geppetto, a middleware wraps an inference handler (HandlerFunc). Each middleware can inspect or modify the input turn, inject blocks (system prompts), or post-process the output turn.

// geppetto/pkg/inference/middleware/middleware.go (simplified)

type HandlerFunc func(

  ctx context.Context,

  conv *Conversation,

  t *turns.Turn,

  reg tools.ToolRegistry,

  opts map[string]any,

) (*turns.Turn, error)

 

type Middleware func(next HandlerFunc) HandlerFunc

 

func Chain(m ...Middleware) Middleware { ... }

 

In Pinocchio, a RuntimeComposer uses EngineBuilder to assemble an engine plus middlewares, and then a tool loop drives that engine.

Examples of built-in middlewares
SystemPromptMiddleware:
• Ensures a system prompt block exists at the start of the turn.
• Useful for injecting a product-specific instruction set (like “output HyperCard plugin blocks”).

ToolResultReorderMiddleware:
• Some model providers are strict about message ordering (tool results must appear immediately after tool calls).
• This middleware walks the output turn and reorders blocks to conform.

LoggingMiddleware:
• Emits log events for observability; useful when you are debugging why a model did or didn’t emit structured blocks.

3.2 The event model: EventSink
Engines emit events into one or more EventSinks. The default pattern is to publish events for:
• LLM partial deltas (streamed tokens)
• LLM final completion
• tool start/delta/result/done
• logs and debug events

An EventSink is just:
   PublishEvent(ctx, event)
and it is up to the sink to store, forward, or translate that event.

Pinocchio commonly uses a WatermillSink: it serializes events as JSON and publishes them onto a Watermill topic. WebChat then translates those into SEM frames for the browser.

3.3 Structured event sinks: FilteringSink
FilteringSink is the bridge from “unstructured LLM text” to “typed UI artifacts”.

It wraps another sink and intercepts text streams (partial and final completions). As deltas arrive, it scans for structured blocks delimited by tags:
   <package:type:version>
      ...payload...
   </package:type:version>

When it finds a registered tag, it:
1) captures the payload bytes into an extractor session
2) removes the payload (and tags) from the outgoing delta text so the end-user does not see it
3) emits typed events produced by the extractor session (OnStart/OnRaw/OnCompleted)

In other words: the model can print YAML/JSON artifacts into the stream, but the user sees only the narrative text, while the system receives a structured artifact event.

Tag syntax and matching
The implementation parses open tags of the form:
   <pkg:type:ver>
and expects the close tag:
   </pkg:type:ver>

It tolerates streaming boundaries (tags can be split across multiple deltas) using a lag buffer.

Extractor interface
// geppetto/pkg/events/structuredsink/filtering_sink.go (simplified)

type Extractor interface {

  TagPackage() string

  TagType() string

  TagVersion() string

  NewSession(ctx context.Context, meta events.EventMetadata, itemID string) ExtractorSession

}

 

type ExtractorSession interface {

  OnStart(ctx context.Context) []events.Event

  OnRaw(ctx context.Context, chunk []byte) []events.Event

  OnCompleted(ctx context.Context, raw []byte, success bool, err error) []events.Event

}

 

The extractor session is streaming-aware. For example, a YAML extractor can:
• buffer all bytes and parse at completion (simplest)
• or parse incrementally and emit progress events as more data arrives.

FilteringSink also has a policy for malformed blocks (unclosed tags): emit error events, reconstruct text back into the user-visible stream, or ignore.

3.4 Why structured sinks matter for HyperCard
HyperCard’s VM card definitions are code-as-data. To safely generate them with an LLM, you want:
• a machine-parseable envelope that can carry multi-line code
• the ability to stream narrative text while extracting the code separately
• an explicit place to validate and gate application (capabilities, timeouts, schema)

FilteringSink provides the extraction layer; the rest of this document designs the glue.

 

4. Designing an LLM→HyperCard plugin injection pipeline
Goal: enable a chat-driven workflow where an LLM can propose new HyperCard plugin cards (or patches) as VM code, and the system can safely extract, validate, and inject that code into the running stack.

Key constraint: the HyperCard VM expects executable JavaScript (factory functions that return {render, handlers}). We therefore need a robust transport format for multi-line code, and guardrails so a bad suggestion doesn’t crash the session or trigger unsafe intents.

4.1 Requirements and design principles
Streaming UX: user sees normal assistant text while artifacts are extracted in parallel.
Machine-parseable artifacts: no fragile regex on markdown; use explicit tags and a parser.
Validation before application: code must parse, execute within time/memory limits, and render a valid UI tree.
Capability gating: even valid code should be constrained to allowed intents (domain/system).
User control: default should be “propose + preview + accept”, not silent auto-apply.
Idempotency: artifacts must carry stable IDs so multiple clients or reconnects don’t duplicate cards.
Persistence: accepted cards/patches should be saved so the stack is reproducible on reload.
4.2 Proposed architecture at a glance
User

  │

  │ (chat prompt)

  ▼

HyperCard ChatWindow (app window)

  │  HTTP POST /chat  (Pinocchio)

  ▼

Pinocchio WebChat

  │

  │  Geppetto engine emits text deltas + tool events

  │  FilteringSink extracts <hypercard:*> blocks

  ▼

Watermill topic chat:<conv_id>

  │

  │ StreamCoordinator translates events -> SEM frames

  ▼

WebSocket /ws  ───────────────► HyperCard ChatWindow

                                │

                                │ shows text stream + inline widgets + card proposals

                                │

                                ├─(user clicks “Create card”)─► CardInjector

                                │                              │

                                │                              ├─ validate in QuickJS (dry-run)

                                │                              ├─ update stack.cards + patch bundleCode

                                │                              └─ openWindow(newCard)

                                │

                                └─(optional) POST /api/cards/save to persist patches

 

This architecture uses Pinocchio + Geppetto for streaming and artifact extraction, and uses HyperCard’s existing dynamic injection mechanisms for application.

4.3 The structured artifact protocol
FilteringSink gives us a clean artifact transport: tags + payload. We can define a small protocol for HyperCard-related artifacts.

Recommended tags:
• <hypercard:widget:1> … </hypercard:widget:1>  — inline widget description for chat
• <hypercard:card:1> … </hypercard:card:1>      — a new card definition (VM code + metadata)
• <hypercard:patch:1> … </hypercard:patch:1>    — patch render/handler for an existing card

Payload format: YAML is a good default because it supports multi-line code blocks (|) cleanly.

Example: inline report widget
<hypercard:widget:1>

id: widget-2026-02-16-low-stock

type: report-view

label: "Low Stock Summary"

props:

  sections:

    - { label: "Items below 10", value: "7" }

    - { label: "Estimated lost sales", value: "$1,240" }

actions:

  - { label: "Open full report card", action: "open-card", cardId: "report" }

  - { label: "Create a saved report card", action: "create-card", template: "saved_report_low_stock" }

</hypercard:widget:1>

 

The narrative assistant text can refer to the widget, but the YAML payload is extracted and does not clutter the chat transcript.

Example: new card proposal
<hypercard:card:1>

cardId: saved_report_low_stock

title: "Saved Report: Low Stock (qty < 10)"

icon: "📉"

dedupeKey: "saved_report_low_stock"     # stable idempotency key

policy:

  readOnly: true                        # frontend/host enforcement hint

code: |

  ({ ui }) => ({

    render({ globalState }) {

      var items = globalState.domains.inventory.items || [];

      var rows = [];

      for (var i = 0; i < items.length; i++) {

        var it = items[i];

        if (Number(it.qty) < 10) rows.push({ sku: it.sku, name: it.name, qty: it.qty });

      }

      return ui.panel([

        ui.text("Low Stock Report (qty < 10)"),

        ui.table(

          [

            { key: "sku", label: "SKU", width: 90 },

            { key: "name", label: "Name", width: 180 },

            { key: "qty", label: "Qty", width: 60, align: "right" },

          ],

          rows

        ),

        ui.row([

          ui.button("Back", { onClick: { handler: "back" } }),

          ui.button("Open Inventory", { onClick: { handler: "goBrowse" } }),

        ]),

      ]);

    },

    handlers: {

      back: function(ctx) { ctx.dispatchSystemCommand("nav.back"); },

      goBrowse: function(ctx) { ctx.dispatchSystemCommand("nav.go", { cardId: "browse" }); },

    },

  })

</hypercard:card:1>

 

Note the separation:
• The YAML includes card metadata the host needs (cardId/title/icon).
• The code is a single JavaScript expression (a factory function). HyperCard injection wraps it in parentheses and passes it to __stackHost.defineCard.

4.4 Middlewares and prompts: teaching the LLM to emit artifacts
We need the model to reliably output these tags. The strongest lever is the seed system prompt (Pinocchio RuntimeArtifacts.SeedSystemPrompt) and/or a SystemPromptMiddleware.

Recommended prompt elements:

Explain that anything inside <hypercard:…> tags is machine-consumed and will not be shown to the user.
Provide the list of allowed widget types and required fields.
Provide the HyperCard plugin card factory template (render + handlers).
Provide the available UI primitives (ui.panel/ui.row/ui.column/ui.text/ui.badge/ui.button/ui.input/ui.table).
Provide the allowed system commands and domain actions (or instruct to avoid domain writes for read-only reports).
Require stable cardId/dedupeKey to avoid duplicates.
Require that code is ES5-compatible (QuickJS) and avoids advanced JS features if needed.
Require that generated code is self-contained (no imports, no external references).
4.5 Extractors: turning tags into typed events
On the backend, configure a FilteringSink with HyperCard extractors. Each extractor parses the YAML payload and emits a typed Geppetto event. Those events then flow through the normal Pinocchio path (Watermill → SEM translation → WebSocket).

Conceptually:

// Pseudo-Go: wrapping the sink in Pinocchio Router options

router := webchat.NewRouter(

  ...,

  webchat.WithEventSinkWrapper(func(convID string, req webchat.AppConversationRequest, next events.EventSink) (events.EventSink, error) {

    return structuredsink.NewFilteringSink(next, structuredsink.Options{},

      NewHypercardWidgetExtractor(),

      NewHypercardCardExtractor(),

      NewHypercardPatchExtractor(),

    ), nil

  }),

)

 

Each extractor session can emit events such as:
• hypercard.widget.proposed
• hypercard.card.proposed
• hypercard.patch.proposed
• hypercard.artifact.error

Pinocchio then needs a SEM mapping for these new event types so the frontend can receive them.

4.6 Validation and application (the injection gate)
Once the frontend receives a ‘card proposal’ artifact, it should not blindly inject it. A robust application path looks like:
1) Syntax check: ensure code is a single JS expression (factory or object literal).
2) Dry-run in an isolated QuickJS runtime: defineCard() into a temporary session and render with mock state.
3) Schema validate: verify the returned UI tree matches the UI zod schema.
4) Intent scan (optional): check that handlers don’t emit disallowed intents in a smoke test.
5) User approval: show a preview card window (mode='preview') or widget preview.
6) Apply: update stack.cards + append defineCard call to stack.plugin.bundleCode (or store as patch list).
7) Persist: optionally POST to backend to store accepted cards for reload.

HyperCard already has validation in the runtime service: it schema-validates UI output and intents. The additional dry-run step is about catching runtime errors before the user ‘accepts’ the proposal.

4.7 Applying code: two practical strategies
Strategy A — Append-to-bundle patches (recommended for simplicity)
• Maintain an array of patch strings (defineCard calls).
• On session load, concatenate base bundle + patches.
• This is exactly what the Chat Desktop story demonstrates.

Strategy B — Live session injection + patch persistence
• Call runtimeService.defineCard(sessionId, cardId, code) to hot-load into the running session.
• Also persist the patch so new sessions get it.
• More complex (must update all relevant sessions), but gives instant availability without new sessions.

4.8 Optional: per-card safety policies
One limitation of the current engine is that capabilities are per session (stack.plugin.capabilities), not per card. If your stack grants domain write access (inventory, sales), any injected code could in principle dispatch those actions.

Two mitigations to consider:

A) Extend the host DSL to support per-card policies.
   Example: stack.cards[cardId].policy = { readOnly: true }.
   Then pluginIntentRouting enforces extra checks based on currentCardId.
B) Use separate stacks/sessions for risky capabilities.
   Example: run report cards in a stack that only grants nav + notify, and keep editing cards in a different profile.
 

5. HyperCard Inventory App: chat-driven widgets + “create card” flows
This section lays out a concrete design for an inventory app that:
• shows a normal HyperCard desktop with inventory cards (browse, sales, reports, etc.)
• includes a chat assistant window
• can inline widgets (tables/reports/details) in the chat
• can optionally turn those results into new plugin cards (saved reports, saved searches, dashboards)

The design intentionally leverages code that already exists in the repositories:
• HyperCard has a ChatWindow component that supports inline widgets and actions.
• HyperCard has proven dynamic card injection (ChatWindowDesktop story).
• Pinocchio + Geppetto already support streaming and structured artifact extraction.

5.1 UX goals (what it should feel like)
Ask questions in natural language: “What’s low in stock?”, “Show me last week’s sales by category.”
See immediate, useful inline widgets in chat: tables, report summaries, item cards.
Get actionable buttons right next to results: “Open Inventory”, “Open Full Report”, “Create saved card”.
When you create a card, it appears as a first-class card (optionally with a desktop icon) and can be reopened later.
Saved cards are parameterized (saved query/report definition) so they stay up to date with the underlying inventory data.
5.2 Baseline: existing Inventory stack
The repository already contains an Inventory stack (apps/inventory) with domain reducers and a plugin bundle.
• inventorySlice: items (sku/name/qty/price/category)
• salesSlice: log entries
• pluginBundle.vm.js: plugin cards for home/browse/sales/reports/assistant

We do not need to discard this; we can add a chat assistant window alongside it and gradually make the assistant smarter.

5.3 UI architecture: an app-owned Chat window
Recommended architecture: implement the assistant as an app window (not a plugin card).

Why?
• The assistant needs privileges to mutate the stack (create new cards), which is a host responsibility.
• The assistant also needs to talk to a backend (Pinocchio). Plugin cards are VM-sandboxed and should stay offline.
• HyperCard already supports app windows via DesktopShell.renderAppWindow.
• The Storybook Chat Desktop story is a working reference implementation.

High-level component sketch
InventoryApp (host)

  ├─ DesktopShell(stack, icons, renderAppWindow)

  │    ├─ plugin card windows (PluginCardSessionHost)

  │    └─ app windows (ChatAssistantWindow, maybe Settings, etc.)

  └─ Redux store

       ├─ domain reducers: inventory, sales, savedReports, ...

       └─ engine reducers: windowing, pluginCardRuntime, notifications, ...

 

5.4 Chat transport: using Pinocchio WebChat endpoints
The assistant window needs two connections:
• POST /chat to submit user prompts
• WS /ws to receive SEM frames

The assistant maintains a conv_id (conversation id). When the user sends a message, it POSTs /chat with {conv_id, prompt}. In parallel, it keeps a websocket open to /ws for that conv_id to stream responses.

Client-side responsibilities:
Maintain conv_id (persist in localStorage or Redux).
Maintain a message list for ChatWindow (user + assistant messages).
Parse SEM frames:
  • llm.delta → append streaming text
  • llm.final → mark assistant message complete
  • tool.* → optionally show tool traces in a debug pane
  • hypercard.* → create inline widgets or card proposals
Provide widget renderer: map widget.type to React components (ReportView/DataTable/etc.).
Provide action handler: map action objects to functions (open existing cards, create new cards, etc.).
5.5 Inline widget catalog
Start with a small, explicit set of inline widgets — enough to cover inventory workflows, but not so large that the LLM has too many degrees of freedom.

Suggested widget types (matching existing HyperCard components):

data-table — Tabular results (items, sales rows). Uses the existing DataTable component.
report-view — Small KPI/summary panel. Uses the existing ReportView component.
item-detail — A compact detail panel for one SKU (name, qty, price, category).
chart — Optional later: simple bar/line charts.
diff-view — Optional later: change proposal (before/after) for inventory edits.
Each widget payload should include a stable id, a label, and strongly typed props. Keep the shape versioned, because you will evolve it.

5.6 Saved cards: what kinds of cards should be created?
The assistant should create cards that are useful to re-open later. A good heuristic is: create a card when the result is a repeatable view or dashboard.

Examples:

Saved report cards: low stock, category summary, weekly sales, margin analysis.
Saved search cards: “Widgets supplier X”, “All items with qty < reorder_point”.
Operational dashboards: “Today’s orders”, “Open purchase orders”, “Receiving schedule”.
One-off cards: A temporary analysis for the current conversation (optional, auto-expire).
For each of these, there are two design choices:
• Generate dedicated VM code per saved card (more flexible)
• Or store a structured ‘query definition’ and use a single generic card renderer (more maintainable)

Because your requirement explicitly calls out “LLM returns plugin code”, the main path below uses dedicated code. But it is worth considering a hybrid approach: codegen only when needed, otherwise use template cards.

5.7 The ‘report in chat → saved report card’ flow
This is the canonical scenario from your prompt.

Step-by-step:

User: “Give me a low stock report for items below 10 units.”
Backend tools compute the report (or LLM computes if data is small).
Assistant response includes:
  • narrative explanation
  • <hypercard:widget:1> describing a report-view widget
  • (option A) also includes <hypercard:card:1> with a saved card proposal
    OR
  • (option B) includes only widget + a “Create saved card” action; code is generated in a second round on click.
Frontend renders the report widget inline in ChatWindow.
Frontend shows buttons: “Open full report card”, “Create saved card”.
If user clicks “Create saved card”:
  • apply proposal immediately (option A)
  • or request a card proposal from the backend (option B)
  • validate the code (dry-run) and show a preview
  • on accept: inject into stack + add desktop icon + open it.
5.8 Implementing card creation in HyperCard
Use the same mechanism as the Chat Desktop story:
1) Add a CardDefinition to stack.cards[cardId]
2) Append a defineCard() call to stack.plugin.bundleCode
3) Optionally update the desktop icons list
4) Dispatch openWindow(...) to open the new card

This can live in a small utility module: CardInjector.

// TypeScript pseudo-code: CardInjector

function injectPluginCard(stack: CardStackDefinition, proposal: {

  cardId: string; title: string; icon: string; code: string;

}) {

  // 1) Host metadata

  stack.cards[proposal.cardId] = {

    id: proposal.cardId,

    type: "plugin",

    title: proposal.title,

    icon: proposal.icon,

    ui: { t: "text", value: `Plugin card: ${proposal.cardId}` },

  };

 

  // 2) VM patch

  const defineCall =

    `\nglobalThis.__stackHost.defineCard(${JSON.stringify(proposal.cardId)}, (${proposal.code}));\n`;

  stack.plugin.bundleCode += defineCall;

}

 

A robust version stores patches separately (stack.pluginPatches: string[]) so you can persist and replay them.

Note: If you want the card to be available in already-running sessions, also call runtimeService.defineCard for those sessions. Otherwise it will be available in any new session created after injection.

5.9 Suggested tool set for the LLM
To make the assistant reliable, give it tools to query inventory data instead of forcing it to infer from memory. In Pinocchio, these are registered tool functions. Example tools:

inventory.searchItems({ query, filters, limit }) → [{ sku, name, qty, price, category, ... }]
inventory.getItem({ sku }) → { sku, name, qty, price, category, ... }
inventory.lowStock({ threshold }) → [{ sku, name, qty, reorderSuggestion? }]
inventory.salesSummary({ startDate, endDate, groupBy }) → rows + aggregates
inventory.createSavedReport({ name, definition }) → { reportId }  (optional persistence tool)
The assistant can then decide:
• “I’ll show this as a widget” (hypercard:widget)
• “This is worth saving” (hypercard:card proposal)
• “Open an existing card to edit data” (action nav.go or openWindow)

5.10 Persistence strategy for created cards
You will eventually want created cards to survive reload.

Two straightforward options:

A) Persist patches (defineCard calls) in a server-side store keyed by stackId.
   • On app load, fetch patches and append to bundleCode.
   • Pros: simple, matches HyperCard runtime model.
   • Cons: hard to diff/inspect; code is stored as string.
B) Persist higher-level card proposal objects (YAML/JSON), and regenerate patch strings on load.
   • Pros: inspectable, can evolve schema, can migrate.
   • Cons: you still need to store executable code somewhere (or re-generate it).
5.11 MVP implementation plan
Add a ChatAssistantWindow (app window) to the inventory app using the existing ChatWindow component.
Connect it to Pinocchio /chat + /ws; render llm.delta streams as assistant messages.
Wrap Pinocchio’s sink with FilteringSink and add at least one extractor: <hypercard:widget:1>.
Implement the widget renderer for data-table and report-view.
Add a second extractor: <hypercard:card:1> to carry card proposals (code + metadata).
Implement CardInjector with dry-run validation (optional at first, recommended soon).
Add UI actions: ‘Create card’, ‘Open card’, and ‘Add desktop icon’.
Add persistence for accepted card proposals (optional but recommended).
 

Appendix A: Key file references
HyperCard (TypeScript/React)
Card DSL types: packages/engine/src/cards/types.ts
App bootstrapping (DSL app): packages/engine/src/app/createDSLApp.tsx
Desktop shell / windowing: packages/engine/src/components/shell/windowing/DesktopShell.tsx
Plugin card host: packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx
Plugin UI renderer: packages/engine/src/components/shell/windowing/PluginCardRenderer.tsx
Intent routing + capability checks: packages/engine/src/components/shell/windowing/pluginIntentRouting.ts
Capability policy: packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts
QuickJS runtime service: packages/engine/src/plugin-runtime/runtimeService.ts
VM bootstrap script: packages/engine/src/plugin-runtime/stack-bootstrap.vm.js
UI schema/types: packages/engine/src/plugin-runtime/uiTypes.ts + uiSchema.ts
Story: chat window creates cards: packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx
Inventory app stack + plugin bundle: apps/inventory/src/domain/stack.ts + pluginBundle.vm.js
Pinocchio WebChat (Go)
HTTP + WS router: pinocchio/pkg/webchat/router.go
Router options (sink wrapper): pinocchio/pkg/webchat/router_options.go
Conversation + ConvManager: pinocchio/pkg/webchat/conversation.go
Chat + conversation services: pinocchio/pkg/webchat/chat_service.go + conversation_service.go
Stream coordinator + SEM translation: pinocchio/pkg/webchat/stream_coordinator.go + sem_translator.go
Timeline projector + registry: pinocchio/pkg/webchat/timeline_projector.go + timeline_registry.go
Command entrypoint: pinocchio/cmd/web-chat/main.go
Geppetto (Go)
Middleware primitives: geppetto/pkg/inference/middleware/middleware.go
System prompt middleware: geppetto/pkg/inference/middleware/systemprompt_middleware.go
Tool result reorder middleware: geppetto/pkg/inference/middleware/reorder_tool_results_middleware.go
Watermill sink: geppetto/pkg/inference/middleware/sink_watermill.go
Structured filtering sink: geppetto/pkg/events/structuredsink/filtering_sink.go
Event types: geppetto/pkg/events/chat-events.go + others
 

Appendix B: Example prompts and outputs
B.1 Suggested seed system prompt (excerpt)
This is the kind of instruction set you want to place in Pinocchio RuntimeArtifacts.SeedSystemPrompt. It teaches the model the artifact protocol without overwhelming it.

You are the assistant inside a desktop inventory app.

 

When you want to show rich UI in chat, emit a structured YAML block wrapped in tags:

  <hypercard:widget:1> ... </hypercard:widget:1>

 

When you want to propose creating a new HyperCard card (plugin VM code), emit:

  <hypercard:card:1> ... </hypercard:card:1>

 

IMPORTANT:

- Anything inside these tags is machine-consumed and WILL NOT be shown to the user.

- Do not wrap these YAML blocks in Markdown code fences.

- YAML must be valid.

 

Widget block requirements:

- fields: id, type, label, props

- optional: actions (buttons to show under the message)

 

Card block requirements:

- fields: cardId, title, icon, code

- code must be a single JavaScript expression:

    ({ ui }) => ({ render(...){...}, handlers: {...} })

- Use only these UI primitives: ui.panel, ui.row, ui.column, ui.text, ui.badge, ui.button, ui.input, ui.table

- Use only these system commands: nav.go, nav.back, notify

- For report cards, avoid domain writes (do not dispatchDomainAction unless explicitly asked).

 

If a user asks for a report:

1) respond with narrative text

2) emit a <hypercard:widget:1> report-view widget showing key stats

3) include an action offering to create a saved card for this report

 

B.2 Example assistant output
Assistant (user-visible):

I found 7 items below your threshold of 10 units. The most urgent is G-2002 (2 units).

Here’s a quick summary. You can create a saved report card if you want to track this regularly.

 

<hypercard:widget:1>

id: widget-low-stock-2026-02-16

type: report-view

label: "Low Stock Summary (qty < 10)"

props:

  sections:

    - { label: "Items below 10", value: "7" }

    - { label: "Lowest item", value: "G-2002 (2)" }

    - { label: "Estimated reorder cost", value: "$640" }

actions:

  - { label: "Open Inventory", action: "open-card", cardId: "browse" }

  - { label: "Create saved report card", action: "create-card", template: "saved_report_low_stock" }

</hypercard:widget:1>

 

If you choose the “two-phase” approach, clicking create-card triggers a follow-up prompt like:
   “Generate a HyperCard card for template saved_report_low_stock using this widget definition: …”
and the model returns a <hypercard:card:1> block.

 

Appendix C: Optional template library for generated cards
To improve reliability, you can provide the LLM with template skeletons and have it fill in only parameters. This reduces the chance of invalid code. Example templates:

Template: saved_report_threshold

 

Inputs:

  threshold: number

  title: string

  description: string

 

Output code skeleton:

  ({ ui }) => ({

    render({ globalState }) {

      // compute rows based on threshold

      ...

    },

    handlers: { back: ..., goBrowse: ... },

  })

 

You can still store the final result as executable code in <hypercard:card:1>, but you generate it from a constrained vocabulary.

 

Appendix D: Deeper implementation notes and gotchas
D.1 QuickJS runtime service: load, render, event, defineCard
This appendix captures implementation details that are helpful when you start injecting code at runtime.

The QuickJSCardRuntimeService (packages/engine/src/plugin-runtime/runtimeService.ts) manages a map of sessions. Each session holds:
• a QuickJS context
• a cache of card definitions (inside the VM)
• last-known bundle metadata
• configuration (deadlines, memory limits)

Key behaviors:

loadStackBundle(stackId, sessionId, code): creates or reuses a VM session, evaluates stack bootstrap + bundle code, then reads __stackHost.getMeta().
renderCard(sessionId, cardId, ...): calls __stackHost.render(...) and validates the resulting UI tree with zod (uiSchema).
eventCard(sessionId, cardId, handler, ...): calls __stackHost.event(...) and validates returned intents with zod (intentSchema).
defineCard / defineCardRender / defineCardHandler: evaluate code strings and mutate the VM’s internal registry.
Deadlines and interruption
QuickJS supports an interrupt handler. The runtime service sets a deadline before evaluating bundle code, rendering, or executing handlers. If the deadline is exceeded, QuickJS interrupts execution and the host receives an error.

Design implication: when you run dry-run validation, you get a safety net against infinite loops. But you still want to keep generated code simple and deterministic.

D.2 UI validation: schema as a contract
The host validates VM output against zod schemas:
• uiSchema: validates the UI node tree shape
• intentSchema: validates each returned intent

This is effectively your ABI between LLM-generated code and the host. If you introduce new UI primitives, you must update both:
• the VM ui factory in stack-bootstrap.vm.js
• the host uiSchema and PluginCardRenderer mapping.

D.3 Plugin intent routing: where capability enforcement happens
Intents return from the VM and are dispatched in two steps:
1) ingestRuntimeIntent (pluginCardRuntime slice) records them in a timeline and queues system/domain intents
2) pluginIntentRouting maps system intents to actual Redux actions (nav.go/back, notify, closeWindow)

Capability checks are applied before dispatching domain/system actions:
• authorizeDomainIntent(capabilities, intent.domain)
• authorizeSystemIntent(capabilities, intent.command)

Design implication: if you add new system commands for card creation (e.g., stack.defineCard), you should route and authorize them in exactly the same way.

D.4 Pinocchio StreamCoordinator: dedupe and SEM sequencing
StreamCoordinator subscribes to the Watermill topic and turns messages into websocket frames. There are two notable behaviors:
• It checks if payload is already a SEM envelope (sem:true). If so, it just patches seq + stream_id.
• Otherwise it decodes a Geppetto Event from JSON and uses EventTranslator + semregistry to produce SEM frames.

It also maintains a semFrameBuffer so that new websocket clients can receive recent context on attach.

Design implication for HyperCard artifacts:
• Define stable IDs for widgets/cards (idempotency).
• Register SEM mappings so artifacts are not dropped.

D.5 Structured sink edge cases
FilteringSink is robust, but there are edge cases you should design around:
• Tag collisions: if the model accidentally prints something that looks like <a:b:c>, it could be interpreted as a tag.
  Mitigation: choose a distinctive package name (‘hypercard’ is good) and keep instructions clear.
• Partial tags split across deltas: handled via lag buffer, but be cautious with extremely long tags.
• MaxCaptureBytes: payloads larger than the configured limit should fail fast.
  Mitigation: keep card code small; if needed, switch to a “template + parameters” approach.
• Malformed blocks (missing close tag): choose a policy. Error-events is safest; reconstruct-text is best UX.
• Nested blocks: current design assumes blocks are not nested. Keep protocol simple (no nesting).

 

Appendix E: HyperCard artifact events and SEM mapping (proposed)
E.1 Proposed event types (Go)
To carry extracted artifacts through the existing Pinocchio pipeline, you can define new Geppetto events. They should implement events.Event and have stable Type() values.

// Pseudo-Go: define a new event for widget proposals

type EventHypercardWidgetProposed struct {

  events.EventMetadataImpl

  WidgetID string

  WidgetType string

  Label string

  Props map[string]any

  Actions []map[string]any

}

 

func (e *EventHypercardWidgetProposed) Type() events.EventType {

  return events.EventType("hypercard.widget.proposed")

}

 

func (e *EventHypercardWidgetProposed) Payload() any {

  return map[string]any{

    "id": e.WidgetID,

    "type": e.WidgetType,

    "label": e.Label,

    "props": e.Props,

    "actions": e.Actions,

  }

}

 

E.2 SEM mapping (Pinocchio semregistry)
Pinocchio translates Geppetto events to SEM frames via a registry of handlers. For each new HyperCard event type, register a handler that emits one SEM event. The SEM event type can match the Geppetto event type or use a separate namespace.

// Pseudo-Go: semregistry handler

semregistry.RegisterByType(&events.EventHypercardWidgetProposed{}, func(ev events.Event) ([]*sempb.SemanticEvent, error) {

  e := ev.(*events.EventHypercardWidgetProposed)

  return []*sempb.SemanticEvent{

    {

      Type: "hypercard.widget",

      Id:   e.WidgetID,

      Data: mustJSON(e.Payload()),

    },

  }, nil

})

 

On the client, your chat assistant window can treat “hypercard.widget” events as message attachments. If you also need durable projection, register timeline handlers that store these artifacts as timeline entities.

E.3 Two-phase card generation protocol
If you want to avoid generating VM code on every report, introduce a lightweight event:
  hypercard.card.intent
that carries a template name + parameters, but not code.

Then, only when the user clicks “Create card”, you ask the LLM to produce the actual <hypercard:card:1> block.

This reduces payload size and improves reliability.

 

 
    
 
    
