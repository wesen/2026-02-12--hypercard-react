---
Title: "HC-034 Feature Analysis and Implementation Plan"
Ticket: HC-034-BETTER-UI
Status: active
Topics:
  - chat
  - frontend
  - ux
  - debugging
  - storybook
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
  - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
    Note: "Primary chat orchestration: SEM ingest, dispatch, widget rendering"
  - Path: apps/inventory/src/features/chat/chatSlice.ts
    Note: "Redux state: messages, timeline items, suggestions, connection status"
  - Path: apps/inventory/src/features/chat/InventoryTimelineWidget.tsx
    Note: "Timeline widget renderer — reused across all rounds today"
  - Path: apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx
    Note: "Card and widget panel renderers — reused across all rounds today"
  - Path: apps/inventory/src/features/chat/webchatClient.ts
    Note: "WebSocket + HTTP transport client, conversation persistence"
  - Path: apps/inventory/src/App.tsx
    Note: "App shell: single chat window opened on mount"
  - Path: packages/engine/src/components/widgets/ChatWindow.tsx
    Note: "Reusable ChatWindow component — widget host, composer, suggestions"
  - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
    Note: "Desktop shell: menu bar, icon layer, window management"
  - Path: packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx
    Note: "Menu bar component — command dispatch"
  - Path: packages/engine/src/theme/base.css
    Note: "Global theme CSS — user-select: none declarations"
  - Path: packages/engine/src/features/windowing/windowingSlice.ts
    Note: "Windowing Redux slice: openWindow, dedupeKey, focusWindow"
  - Path: packages/engine/src/features/windowing/types.ts
    Note: "Window instance types, OpenWindowPayload"
  - Path: apps/inventory/src/domain/stack.ts
    Note: "Card stack definition and card metadata"
Summary: >
  Comprehensive analysis of seven UI/DX improvements for the inventory webchat:
  per-round timeline/card-panel widgets, collapsed tool-call rendering with YAML,
  multi-conversation windows, model/token stats display, copy-paste/selection in chat,
  debug mode toggle, and a streaming event viewer window.
  Includes codebase mapping, ASCII mockups, and storybook story lists per feature.
LastUpdated: 2026-02-16T15:58:00-05:00
WhatFor: >
  Technical analysis and implementation guidance for all HC-034 features,
  with enough detail for a developer to start implementation immediately.
WhenToUse: >
  Read before implementing any HC-034 feature. Use the per-feature sections
  as self-contained implementation guides.
---

# HC-034 Feature Analysis and Implementation Plan

## 1. Context and scope

This document analyzes seven distinct improvements to the inventory webchat UI and
developer experience. Each feature is self-contained: it has its own codebase impact
analysis, implementation strategy, ASCII mockup (where relevant), and storybook story
list.

The features come from direct usage observations after HC-032/HC-033 delivery.

### Feature index

| # | Feature | Impact | Complexity |
|---|---------|--------|-----------|
| F1 | Per-round timeline/card-panel widgets | Medium | Medium |
| F2 | Collapsed tool-call messages with structured YAML | Low | Low |
| F3 | Multiple chat windows for different conversations | High | Medium |
| F4 | Model information + token counts + TPS display | Low | Low-Medium |
| F5 | Copy/paste and text selection in chat | Low | Low |
| F6 | Debug mode toggle for timeline object inspection | Medium | Medium |
| F7 | Streaming event viewer window | High | High |

---

## 2. F1 — Per-round timeline and card-panel widgets

### 2.1 Problem

Today the chat reducer maintains **one** global timeline widget message (`timeline-widget-message`),
one global card panel message (`card-panel-widget-message`), and one global widget panel message
(`widget-panel-widget-message`). These are created lazily via `ensureTimelineWidgetMessage()` /
`ensureCardPanelMessage()` / `ensureWidgetPanelMessage()` and reused for the entire conversation.

The result: all timeline/card/widget items pile into a single widget block regardless of which
user turn created them. A user who sends three prompts sees all three rounds' tool calls and
artifacts merged into one ever-growing timeline panel at the top of the chat, rather than inline
with the conversation round that produced them.

### 2.2 Desired behavior

Each **conversation round** (user prompt → assistant response) should produce its own
timeline widget, card panel, and widget panel, inserted into the message list at the point
where the events occurred. Earlier rounds' widgets remain stable and reflect only their round's
items.

### 2.3 Codebase areas affected

| File | What changes |
|------|-------------|
| `apps/inventory/src/features/chat/chatSlice.ts` | Replace single-ID widget messages with per-round IDs. Add a `currentRoundId` counter or marker. On `queueUserPrompt`, increment the round marker. Widget ensure functions take roundId. |
| `apps/inventory/src/features/chat/InventoryChatWindow.tsx` | `onSemEnvelope()` must route upserts to the current round's widget. No mapping logic change beyond passing round context. |
| `apps/inventory/src/features/chat/InventoryTimelineWidget.tsx` | No change — it already renders whatever items it receives. |
| `apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx` | No change — same reason. |

### 2.4 Implementation plan

#### Step 1: Add round tracking to chatSlice

```typescript
// New state field
interface ChatState {
  // ... existing fields ...
  currentRoundId: number;
}

// In queueUserPrompt:
state.currentRoundId += 1;
```

#### Step 2: Parameterize widget message IDs by round

Replace the current constants:

```typescript
// Before (global):
const TIMELINE_WIDGET_MESSAGE_ID = 'timeline-widget-message';

// After (per-round):
function timelineWidgetMessageId(roundId: number): string {
  return `timeline-widget-message-r${roundId}`;
}
function cardPanelMessageId(roundId: number): string {
  return `card-panel-widget-message-r${roundId}`;
}
function widgetPanelMessageId(roundId: number): string {
  return `widget-panel-widget-message-r${roundId}`;
}
```

The `ensureTimelineWidgetMessage` / `ensureCardPanelMessage` / `ensureWidgetPanelMessage`
functions take `roundId` and use the parameterized ID. If no matching message exists,
a new widget system message is pushed.

#### Step 3: Route upserts through current round

The actions `upsertTimelineItem`, `upsertCardPanelItem`, `upsertWidgetPanelItem`
internally use `state.currentRoundId` to target the correct widget message.

#### Step 4: Handle hydration

On hydration, items from previous rounds need to be replayed into their respective
round widgets. Two approaches:

- **Simple:** On hydration, use a single round-0 "historical" widget for all hydrated
  timeline entities, then new rounds start fresh from round 1.
- **Full-fidelity:** Hydrated entities carry round markers if persisted server-side.

Recommendation: start with the simple approach. The hydration widget can be labeled
"Previous Session" and new rounds start numbering from 1.

### 2.5 ASCII mockup

```
┌─────────────────────────────────────────────┐
│ 💬 Inventory Chat                           │
│ connected · abc-123                         │
├─────────────────────────────────────────────┤
│ You: Show me low stock items                │
│                                             │
│ ┌─ Run Timeline (round 1) ────────────────┐ │
│ │ OK   Tool inventory_low_stock    TOOL   │ │
│ │ OK   Low Stock Widget            WIDGET │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ AI: Here are 3 items that are low on stock… │
│                                             │
│ You: Generate a full inventory report       │
│                                             │
│ ┌─ Run Timeline (round 2) ────────────────┐ │
│ │ ...  Tool inventory_report       TOOL   │ │
│ │ ...  Inventory Report            CARD   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ Generated Cards (round 2) ─────────────┐ │
│ │ ...  Inventory Report  reportViewer     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ AI: I'm generating a comprehensive report…  │
│ █                                           │
├─────────────────────────────────────────────┤
│ [Show current inventory status]             │
│ [Type a message…                    ] [Send]│
└─────────────────────────────────────────────┘
```

### 2.6 Storybook stories

| Story | Description |
|-------|------------|
| `PerRoundTimeline/SingleRound` | One round with 3 tool calls and 1 widget ready |
| `PerRoundTimeline/TwoRounds` | Two distinct round timelines interleaved with user/AI messages |
| `PerRoundTimeline/HydratedPlusLive` | A "Previous Session" hydrated timeline + one live round |
| `PerRoundTimeline/EmptyRound` | A round with no tool calls (timeline widget should not appear) |
| `PerRoundCardPanel/SingleCard` | One round producing a card proposal |
| `PerRoundCardPanel/TwoRoundsMultipleCards` | Two rounds each producing different cards |

---

## 3. F2 — Collapsed tool-call messages with structured YAML

### 3.1 Problem

Tool-call messages in the timeline currently show raw JSON in the `detail` field via
`compactJSON()`. The JSON is dense, hard to read, and always expanded. Multi-step tool
loops with large argument payloads make the timeline noisy and hard to scan.

### 3.2 Desired behavior

1. Tool-call timeline items should be **collapsed by default**, showing only the tool name and status.
2. Clicking/toggling expands to reveal structured details.
3. The expanded detail renders the JSON payload as **YAML** for readability.

### 3.3 Codebase areas affected

| File | What changes |
|------|-------------|
| `apps/inventory/src/features/chat/InventoryTimelineWidget.tsx` | Add collapse/expand toggle per item. Add JSON-to-YAML formatter for detail. |
| `apps/inventory/src/features/chat/InventoryChatWindow.tsx` | Store full structured data in timeline items instead of pre-formatted strings. |
| `apps/inventory/src/features/chat/chatSlice.ts` | Add optional `rawData` field to `TimelineWidgetItem` for storing tool args/results. |

### 3.4 Implementation plan

#### Step 1: Extend TimelineWidgetItem with raw data

```typescript
export interface TimelineWidgetItem {
  // ... existing fields ...
  rawData?: Record<string, unknown>;  // tool args or result payload
  collapsed?: boolean;                // default true for tool items
}
```

#### Step 2: Store structured data in tool event mapping

In `InventoryChatWindow.tsx`, for `tool.start` / `tool.result` events, store the raw
input/result object in `rawData` alongside the existing truncated `detail` string.

#### Step 3: Add YAML formatter utility

```typescript
// Simple recursive YAML formatter (no dependency needed)
function toYaml(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (value === null || value === undefined) return `${pad}null`;
  if (typeof value === 'string') return `${pad}${value}`;
  if (typeof value === 'number' || typeof value === 'boolean') return `${pad}${value}`;
  if (Array.isArray(value)) {
    return value.map(item => `${pad}- ${toYaml(item, 0).trim()}`).join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => {
        const valStr = toYaml(v, indent + 1);
        if (typeof v === 'object' && v !== null) {
          return `${pad}${k}:\n${valStr}`;
        }
        return `${pad}${k}: ${valStr.trim()}`;
      })
      .join('\n');
  }
  return `${pad}${String(value)}`;
}
```

#### Step 4: Collapse/expand toggle in InventoryTimelineWidget

Add a local React state `Set<string>` tracking expanded item IDs. By default, tool
items are collapsed. A small `▶`/`▼` toggle button precedes each tool item. When
expanded, the `rawData` is rendered as formatted YAML in a `<pre>` block.

### 3.5 ASCII mockup

```
┌─ Run Timeline (round 1) ────────────────────┐
│ OK   Tool inventory_low_stock   TOOL  [▶]   │
│ OK   Tool inventory_report      TOOL  [▼]   │
│      ┌──────────────────────────────────┐    │
│      │ low_stock_threshold: 5           │    │
│      │ include_zero: true               │    │
│      │ result:                          │    │
│      │   totalItems: 10                 │    │
│      │   lowStockItems:                 │    │
│      │     - sku: SHOE-RUN-42           │    │
│      │       name: Running Shoes        │    │
│      │       qty: 2                     │    │
│      └──────────────────────────────────┘    │
│ OK   Inventory Report Widget    WIDGET       │
└──────────────────────────────────────────────┘
```

### 3.6 Storybook stories

| Story | Description |
|-------|------------|
| `CollapsibleTimeline/AllCollapsed` | Multiple tool items, all collapsed |
| `CollapsibleTimeline/OneExpanded` | One tool item expanded showing YAML |
| `CollapsibleTimeline/LargePayload` | Tool with a large result payload expanded |
| `CollapsibleTimeline/MixedItems` | Mix of tool (collapsible) and widget/card (non-collapsible) items |
| `CollapsibleTimeline/ToggleInteraction` | Interactive story demonstrating toggle behavior |

---

## 4. F3 — Multiple chat windows for different conversations

### 4.1 Problem

Currently, `App.tsx` opens exactly **one** chat window on mount with a single, fixed
conversation ID persisted in `localStorage`. There is no way to:
- Start a new conversation
- Open multiple concurrent conversations
- Switch between conversations

### 4.2 Desired behavior

1. A **desktop icon** (💬 "New Chat") and a **menu entry** (File → New Chat Window) create
   a new chat window with a fresh `conv_id`.
2. Each chat window manages its own independent state (messages, timeline, connection).
3. Multiple chat windows can be open simultaneously in the windowing system.
4. The dedupeKey is per-conversation, so the same conversation cannot open twice, but
   different conversations can coexist.

### 4.3 Codebase areas affected

| File | What changes |
|------|-------------|
| `apps/inventory/src/App.tsx` | Add "New Chat" icon and menu item. Change `renderAppWindow` to extract `convId` from window content. |
| `apps/inventory/src/features/chat/InventoryChatWindow.tsx` | Accept `conversationId` as a prop instead of reading from global Redux. All selectors/dispatches pass `convId`. |
| `apps/inventory/src/features/chat/chatSlice.ts` | Restructure to keyed-by-conversation-id: `conversations: Record<string, ConversationState>`. Every action payload includes `conversationId`. |
| `apps/inventory/src/features/chat/selectors.ts` | All selectors take `(state, convId)` and look up the per-conversation sub-state. |
| `apps/inventory/src/features/chat/webchatClient.ts` | Remove global `localStorage` conversation persistence. The App manages conversation IDs. |
| `packages/engine/src/components/shell/windowing/DesktopShell.tsx` | No change needed — already supports multiple app windows. |
| `packages/engine/src/features/windowing/types.ts` | No change needed — `appKey` + `dedupeKey` already sufficient. |

### 4.4 Implementation plan

**Architecture decision (locked):** Keep conversations in the global Redux store, keyed
by conversation ID. This preserves Redux DevTools visibility across all conversations,
enables cross-window state observation (e.g., streaming badges, conversation list sidebar),
and keeps centralized hydration/persistence straightforward.

#### Step 1: Restructure chatSlice to keyed state

```typescript
// Per-conversation state (what ChatState is today, minus conversationId)
interface ConversationState {
  connectionStatus: ChatConnectionStatus;
  isStreaming: boolean;
  messages: ChatWindowMessage[];
  suggestions: string[];
  lastError: string | null;
  currentRoundId: number;          // from F1
  modelName: string | null;        // from F4
  currentTurnStats: TurnStats | null; // from F4
}

// Top-level chat slice state
interface ChatState {
  conversations: Record<string, ConversationState>;
}

const initialState: ChatState = {
  conversations: {},
};

// Helper to get-or-create a conversation sub-state
function getConv(state: ChatState, convId: string): ConversationState {
  if (!state.conversations[convId]) {
    state.conversations[convId] = createInitialConversationState();
  }
  return state.conversations[convId];
}

function createInitialConversationState(): ConversationState {
  return {
    connectionStatus: 'idle',
    isStreaming: false,
    messages: [],
    suggestions: [...DEFAULT_CHAT_SUGGESTIONS],
    lastError: null,
    currentRoundId: 0,
    modelName: null,
    currentTurnStats: null,
  };
}
```

Every existing action gets a `conversationId` field in its payload:

```typescript
// Before:
queueUserPrompt(state, action: PayloadAction<{ text: string }>)

// After:
queueUserPrompt(state, action: PayloadAction<{ conversationId: string; text: string }>)
```

The reducer body changes from `state.messages.push(...)` to
`getConv(state, action.payload.conversationId).messages.push(...)`.

#### Step 2: Update selectors to take convId

```typescript
// Before:
export const selectMessages = (state: RootState) => state.chat.messages;

// After:
export const selectMessages = (state: RootState, convId: string) =>
  state.chat.conversations[convId]?.messages ?? [];

export const selectIsStreaming = (state: RootState, convId: string) =>
  state.chat.conversations[convId]?.isStreaming ?? false;

// etc.
```

#### Step 3: Update InventoryChatWindow to accept conversationId prop

```typescript
export function InventoryChatWindow({ conversationId }: { conversationId: string }) {
  const dispatch = useDispatch();
  const messages = useSelector((s: RootState) => selectMessages(s, conversationId));
  const isStreaming = useSelector((s: RootState) => selectIsStreaming(s, conversationId));
  // ...

  const handleSend = useCallback(async (text: string) => {
    dispatch(queueUserPrompt({ conversationId, text: text.trim() }));
    await submitPrompt(text.trim(), conversationId);
  }, [conversationId, dispatch]);

  // WS client and hydration keyed to this conversationId
  // ...
}
```

#### Step 4: Lift conversation management to App.tsx

```typescript
const CHAT_APP_KEY = 'inventory-chat';

function newChatWindowId(): string {
  return `window:chat:${crypto.randomUUID()}`;
}

function openNewChatWindow(dispatch: ReturnType<typeof useDispatch>) {
  const convId = crypto.randomUUID();
  dispatch(openWindow({
    id: newChatWindowId(),
    title: '💬 Inventory Chat',
    icon: '💬',
    bounds: { x: 340 + Math.random() * 60, y: 20 + Math.random() * 40, w: 520, h: 440 },
    content: {
      kind: 'app',
      appKey: `${CHAT_APP_KEY}:${convId}`,
    },
    dedupeKey: `chat:${convId}`,  // per-conversation dedupe
  }));
}
```

#### Step 5: Parse convId from appKey in renderAppWindow

```typescript
const renderAppWindow = useCallback((appKey: string): ReactNode => {
  if (appKey.startsWith(`${CHAT_APP_KEY}:`)) {
    const convId = appKey.slice(CHAT_APP_KEY.length + 1);
    return <InventoryChatWindow conversationId={convId} />;
  }
  return null;
}, []);
```

#### Step 6: Add icon and menu entries

In `App.tsx`:

```typescript
const icons: DesktopIconDef[] = [
  { id: 'new-chat', label: 'New Chat', icon: '💬' },
  // ... existing icons from stack
];

const menus: DesktopMenuSection[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new-chat', label: 'New Chat', commandId: 'chat.new', shortcut: 'Ctrl+N' },
      // ...
    ],
  },
  // ...
];
```

Wire `handleCommand('chat.new')` and `handleOpenIcon('new-chat')` to `openNewChatWindow`.

#### Step 7: Open initial chat on mount

Keep opening one chat window on mount (as today), but use the new pattern so it's
just the first conversation window rather than a special case.

#### Step 8: Optional — cleanup on window close

Add a `removeConversation` action to clean up the Redux sub-state when a chat window
is closed. Wire via a `useEffect` cleanup in `InventoryChatWindow` or by listening
to `closeWindow` actions.

```typescript
removeConversation(state, action: PayloadAction<{ conversationId: string }>) {
  delete state.conversations[action.payload.conversationId];
}
```

#### Benefits of the keyed Redux approach

1. **Redux DevTools:** All conversation states visible at once for debugging.
2. **Cross-window observation:** A conversation-list sidebar, streaming badges on
   desktop icons, or a "1 active stream" indicator can read any conversation's state.
3. **Centralized persistence:** Easy to snapshot/restore all conversations from
   `state.chat.conversations`.
4. **Consistent patterns:** Existing tests can be adapted by adding `conversationId`
   to payloads rather than rewriting test infrastructure for `useReducer`.

### 4.5 ASCII mockup

```
┌──────────────────────────────────────────────────────────────────────┐
│ [File ▾] [Cards ▾] [Window ▾]                                      │
│  ┌──────────┐                                                        │
│  │ New Chat  │                                                       │
│  │ Close Win │                                                       │
│  └──────────┘                                                        │
│                                                                      │
│ 💬         🏠         📋         ⚠️                                  │
│ New Chat   Home       Browse     Low Stock                           │
│                                                                      │
│  ┌─ 💬 Inventory Chat (conv abc) ──────────┐                        │
│  │ You: Show low stock                     │   ┌─ 💬 Inventory Chat │
│  │ AI: Here are the items...               │   │ (conv xyz) ────────│
│  │                                         │   │ You: Report please │
│  │ [Type a message…               ] [Send] │   │ AI: Generating...  │
│  └─────────────────────────────────────────┘   │                    │
│                                                 │ [Type…      ][Send]│
│                                                 └────────────────────│
└──────────────────────────────────────────────────────────────────────┘
```

### 4.6 Storybook stories

| Story | Description |
|-------|------------|
| `MultiChat/DesktopWithTwoWindows` | Desktop shell with two chat windows side by side |
| `MultiChat/NewChatFromMenu` | Interactive story: clicking menu opens a new chat window |
| `MultiChat/IndependentStreaming` | Two windows with independent streaming states |
| `MultiChat/ConversationIsolation` | Verify that messages in one window don't appear in another |

---

## 5. F4 — Model information + token counts + TPS display

### 5.1 Problem

The chat UI currently shows no information about which model is being used, how many
tokens were consumed, or how fast inference is running. Users (especially developers)
want this visibility for debugging and cost awareness.

### 5.2 What data is already available

The backend **already emits** `metadata` on every SEM frame (`llm.start`, `llm.delta`,
`llm.final`). This metadata contains:

```typescript
interface LlmInferenceMetadata {
  model?: string;          // e.g. "claude-sonnet-4-20250514"
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  durationMs?: number;     // total inference duration
}
```

The frontend currently **ignores** `envelope.event.metadata` — it only reads
`envelope.event.type` and `envelope.event.data`.

### 5.3 Desired behavior

1. Display model name in the chat window header subtitle or footer.
2. After each completed turn (`llm.final`), show token usage inline:
   - Input tokens / Output tokens / Cached tokens
   - Duration and derived tokens-per-second
3. During streaming, show live TPS (output tokens / elapsed time).

### 5.4 Codebase areas affected

| File | What changes |
|------|-------------|
| `apps/inventory/src/features/chat/chatSlice.ts` | Add `modelInfo` and `turnStats` state fields. Add actions for metadata updates. |
| `apps/inventory/src/features/chat/InventoryChatWindow.tsx` | Parse `envelope.event.metadata` on `llm.start` / `llm.final`. Dispatch metadata actions. Wire into footer/header. |
| `packages/engine/src/components/widgets/ChatWindow.tsx` | Optionally extend `footer` or add a `stats` prop for structured stats rendering. |

### 5.5 Implementation plan

#### Step 1: Add metadata state

```typescript
interface TurnStats {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  durationMs?: number;
  tps?: number;             // outputTokens / (durationMs / 1000)
}

interface ChatState {
  // ... existing ...
  modelName: string | null;
  currentTurnStats: TurnStats | null;
  streamStartTime: number | null;  // for live TPS calc
}
```

#### Step 2: Parse metadata from SEM envelopes

In `onSemEnvelope()`:

```typescript
if (type === 'llm.start') {
  const metadata = envelope.event?.metadata as Record<string, unknown> | undefined;
  if (metadata?.model) {
    dispatch(setModelName(metadata.model as string));
  }
  dispatch(markStreamStart({ time: Date.now() }));
  // ... existing llm.start handling ...
}

if (type === 'llm.final') {
  const metadata = envelope.event?.metadata as Record<string, unknown> | undefined;
  if (metadata) {
    const usage = metadata.usage as Record<string, unknown> | undefined;
    dispatch(setTurnStats({
      inputTokens: usage?.inputTokens as number | undefined,
      outputTokens: usage?.outputTokens as number | undefined,
      cachedTokens: usage?.cachedTokens as number | undefined,
      durationMs: metadata.durationMs as number | undefined,
    }));
  }
  // ... existing llm.final handling ...
}
```

#### Step 3: Render in footer

The `ChatWindow` footer already accepts arbitrary `ReactNode`. Render a compact stats
bar:

```
claude-sonnet-4  ·  In: 1,234  Out: 567  Cached: 890  ·  4.2s  ·  135 tok/s
```

During streaming, show a live counter from `outputTokens / elapsed` that updates
on each `llm.delta`.

### 5.6 ASCII mockup

```
┌─────────────────────────────────────────────┐
│ 💬 Inventory Chat                           │
│ connected · abc-123 · claude-sonnet-4       │
├─────────────────────────────────────────────┤
│ You: Show me low stock items                │
│                                             │
│ AI: Here are the low-stock items...         │
│                                             │
│ [Type a message…                    ] [Send]│
├─────────────────────────────────────────────┤
│ claude-sonnet-4 · In:1234 Out:567           │
│ Cache:890 · 4.2s · 135 tok/s               │
└─────────────────────────────────────────────┘
```

### 5.7 Storybook stories

| Story | Description |
|-------|------------|
| `ModelStats/WithFullStats` | Footer showing complete token stats after a turn |
| `ModelStats/Streaming` | Live TPS counter during streaming |
| `ModelStats/NoMetadata` | Graceful fallback when backend doesn't send metadata |
| `ModelStats/LargeTokenCounts` | Number formatting with large values (100k+ tokens) |

---

## 6. F5 — Copy/paste and text selection in chat

### 6.1 Problem

The desktop shell sets `user-select: none` on the root `[data-part="windowing-desktop-shell"]`
element (line 162 of `base.css`). This cascades to all children, including chat message
content. Users cannot select or copy AI responses.

### 6.2 Desired behavior

1. Text in chat messages (both user and AI) should be selectable and copyable.
2. The rest of the desktop UI (title bars, menu bar, buttons, tabs) should remain
   non-selectable to preserve the desktop metaphor.

### 6.3 Codebase areas affected

| File | What changes |
|------|-------------|
| `packages/engine/src/theme/base.css` | Add `user-select: text` override on `[data-part="chat-timeline"]` and/or `[data-part="chat-message"]`. |

### 6.4 Implementation plan

This is a pure CSS fix. Add the following rules to `base.css`:

```css
/* Allow text selection in chat message content */
[data-part="chat-timeline"] {
  user-select: text;
}

/* Keep non-content chat parts non-selectable */
[data-part="chat-window-header"],
[data-part="chat-composer"],
[data-part="chat-suggestions"],
[data-part="chat-window-footer"] {
  user-select: none;
}
```

That's it. The cascade from `chat-timeline` will make all message text selectable,
while header/composer/footer remain part of the desktop's non-selectable surface.

### 6.5 Verification

1. Open a chat window, get an AI response.
2. Click-drag over AI text → text should highlight.
3. Ctrl+C → should copy to clipboard.
4. Verify title bars, menu bar, buttons are still non-selectable.

### 6.6 Storybook stories

No new stories needed — this is a CSS-only change. Verify in existing
`ChatWindow.stories.tsx` and `ChatWindowDesktop.stories.tsx`.

---

## 7. F6 — Debug mode toggle for timeline object inspection

### 7.1 Problem

When debugging timeline projection issues (like the "Updating..." flicker from HC-033),
developers need to see the raw timeline item metadata: full `id`, `kind`, `template`,
`artifactId`, `updatedAt` timestamp, and the raw `data` payload. Currently this requires
adding `console.log` statements and reading browser devtools.

### 7.2 Desired behavior

1. A toggle button in the chat window header or footer: `[🔍 Debug]`.
2. When enabled, timeline items show expanded metadata:
   - Full item ID
   - Kind + template + artifactId
   - Raw timestamp
   - Full `rawData` payload as YAML
3. Messages show their internal ID and status.
4. The debug mode state can be toggled without reloading.

### 7.3 Codebase areas affected

| File | What changes |
|------|-------------|
| `apps/inventory/src/features/chat/InventoryChatWindow.tsx` | Add debug state toggle. Pass debug flag to widget renderers. |
| `apps/inventory/src/features/chat/InventoryTimelineWidget.tsx` | Accept `debug` prop. When true, render expanded metadata for each item. |
| `apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx` | Accept `debug` prop. Same expanded metadata rendering. |
| `packages/engine/src/components/widgets/ChatWindow.tsx` | Optionally accept a `headerActions` prop for rendering custom buttons in the header. |

### 7.4 Implementation plan

#### Step 1: Add debug toggle state

In `InventoryChatWindow`, add local state:

```typescript
const [debugMode, setDebugMode] = useState(false);
```

#### Step 2: Pass debug flag to ChatWindow

Either use the existing `footer` prop to render the toggle, or extend `ChatWindow`
with a `headerActions` slot:

```tsx
<ChatWindow
  // ...
  headerActions={
    <button onClick={() => setDebugMode(d => !d)}>
      {debugMode ? '🔍 Debug ON' : '🔍 Debug'}
    </button>
  }
/>
```

#### Step 3: Extend timeline widget with debug rendering

```tsx
interface InventoryTimelineWidgetProps {
  items: TimelineWidgetItem[];
  debug?: boolean;
}

// When debug is true, render for each item:
{debug && (
  <pre style={{ fontSize: 9, opacity: 0.7, background: '#f0f0f4', padding: 4 }}>
    id: {item.id}
    kind: {item.kind}
    template: {item.template}
    artifactId: {item.artifactId}
    updatedAt: {new Date(item.updatedAt).toISOString()}
    {item.rawData ? `data:\n${toYaml(item.rawData, 1)}` : ''}
  </pre>
)}
```

#### Step 4: Debug rendering for messages

When debug mode is on, each message in the ChatWindow can show a small debug badge:

```
[msg:llm-42 | status:complete | role:ai]
```

This requires passing a `debugMode` flag through `renderWidget` or a context provider.

### 7.5 ASCII mockup

```
┌─────────────────────────────────────────────┐
│ 💬 Inventory Chat           [🔍 Debug ON]  │
│ connected · abc-123                         │
├─────────────────────────────────────────────┤
│ [msg:user-1 | complete | user]              │
│ You: Show low stock items                   │
│                                             │
│ ┌─ Run Timeline (round 1) ────────────────┐ │
│ │ OK  Tool inventory_low_stock      TOOL  │ │
│ │     id: tool:call-abc123                │ │
│ │     kind: tool                          │ │
│ │     updatedAt: 2026-02-16T15:42:00Z     │ │
│ │     data:                               │ │
│ │       name: inventory_low_stock         │ │
│ │       input:                            │ │
│ │         threshold: 5                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [msg:llm-42 | complete | ai]                │
│ AI: Here are 3 items that are low stock...  │
├─────────────────────────────────────────────┤
│ [Type a message…                    ] [Send]│
└─────────────────────────────────────────────┘
```

### 7.6 Storybook stories

| Story | Description |
|-------|------------|
| `DebugMode/Off` | Normal rendering (debug toggle visible but off) |
| `DebugMode/On` | All messages and timeline items showing debug metadata |
| `DebugMode/TimelineWithRawData` | Timeline items with full rawData payloads expanded |
| `DebugMode/Toggle` | Interactive story with working toggle |

---

## 8. F7 — Streaming event viewer window

### 8.1 Problem

When developing or debugging the webchat integration, there is no way to observe the
raw stream of SEM events coming through the WebSocket. Developers must use browser
devtools Network tab to inspect individual WS frames, which is cumbersome:
- No filtering by event type
- No pretty-printing
- Cannot correlate events across time
- Must keep devtools open

### 8.2 Desired behavior

A dedicated **Event Viewer** window that can be opened from a chat window:

1. **Launch:** A button in the chat window header: `[📡 Events]`.
2. **Display:** Scrolling log of all SEM events received by that conversation's WebSocket.
3. **Filtering:** Toggle buttons to show/hide event families:
   - `llm.*`
   - `tool.*`
   - `hypercard.*`
   - `timeline.*`
   - `ws.*`
4. **Event rendering:** Each event shown as a compact row with expandable detail:
   - Timestamp | Type | ID | Status badge
   - Expandable: full payload as YAML
5. **Controls:** Clear log, pause/resume, auto-scroll toggle.

### 8.3 Codebase areas affected

| File | What changes |
|------|-------------|
| `apps/inventory/src/features/chat/InventoryChatWindow.tsx` | Add "Events" button that opens event viewer window. Pass event stream to viewer. |
| `apps/inventory/src/features/chat/EventViewerWindow.tsx` | **NEW** — Full event viewer component. |
| `apps/inventory/src/features/chat/eventViewerSlice.ts` | **NEW** — State for event log, filters, paused state. |
| `apps/inventory/src/App.tsx` | Register event viewer `appKey` pattern in `renderAppWindow`. |
| `packages/engine/src/components/widgets/ChatWindow.tsx` | Add `headerActions` prop if not already done in F6. |

### 8.4 Implementation plan

#### Step 1: Design the event log state

```typescript
interface EventLogEntry {
  id: string;           // sequential
  timestamp: number;
  eventType: string;    // e.g. "llm.delta", "tool.start"
  eventId: string;      // SEM event ID
  family: string;       // "llm" | "tool" | "hypercard" | "timeline" | "ws" | "other"
  summary: string;      // one-line summary
  rawPayload: unknown;  // full envelope for expanded view
}

interface EventViewerState {
  entries: EventLogEntry[];
  filters: Record<string, boolean>; // family -> visible
  paused: boolean;
  autoScroll: boolean;
  maxEntries: number;   // ring buffer cap (e.g. 500)
}
```

#### Step 2: Tap into the SEM stream

The event viewer needs the raw SEM envelopes. Two approaches:

- **Shared callback:** `InventoryChatWindow` already processes all envelopes in
  `onSemEnvelope()`. Add an optional callback/ref that also pushes to the event viewer.
- **Shared event bus:** Create a simple pub/sub per conversation that both the
  chat window and event viewer subscribe to.

Recommended: the callback approach is simpler. When the event viewer is open, the
chat window pushes each envelope into a shared ref/context that the event viewer reads.

For multi-window support (F3), each conversation manages its own event buffer.

#### Step 3: Build the EventViewerWindow component

```tsx
export function EventViewerWindow({ conversationId }: { conversationId: string }) {
  const [entries, setEntries] = useState<EventLogEntry[]>([]);
  const [filters, setFilters] = useState<Record<string, boolean>>({
    llm: true, tool: true, hypercard: true, timeline: true, ws: true, other: true,
  });
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  // Filtered entries
  const visible = useMemo(
    () => entries.filter(e => filters[e.family] !== false),
    [entries, filters],
  );

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visible, autoScroll]);

  return (
    <div data-part="event-viewer">
      {/* Filter bar */}
      <div data-part="event-viewer-filters">
        {Object.keys(filters).map(family => (
          <button
            key={family}
            data-state={filters[family] ? 'active' : 'inactive'}
            onClick={() => setFilters(f => ({ ...f, [family]: !f[family] }))}
          >
            {family}
          </button>
        ))}
        <button onClick={() => setPaused(p => !p)}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button onClick={() => setEntries([])}>🗑 Clear</button>
        <button onClick={() => setAutoScroll(a => !a)}>
          {autoScroll ? '📌 Pinned' : '📌 Unpinned'}
        </button>
      </div>

      {/* Event log */}
      <div data-part="event-viewer-log">
        {visible.map(entry => (
          <div key={entry.id} data-part="event-viewer-entry" data-family={entry.family}>
            <div
              data-part="event-viewer-entry-header"
              onClick={() => toggleExpand(entry.id)}
            >
              <span data-part="event-viewer-ts">
                {new Date(entry.timestamp).toISOString().slice(11, 23)}
              </span>
              <span data-part="event-viewer-type">{entry.eventType}</span>
              <span data-part="event-viewer-id">{entry.eventId}</span>
              <span data-part="event-viewer-summary">{entry.summary}</span>
            </div>
            {expandedIds.has(entry.id) && (
              <pre data-part="event-viewer-detail">
                {toYaml(entry.rawPayload)}
              </pre>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
```

#### Step 4: Wire opening from chat window

In `InventoryChatWindow`:

```typescript
const openEventViewer = useCallback(() => {
  dispatch(openWindow({
    id: `window:event-viewer:${conversationId}`,
    title: `📡 Events — ${conversationId.slice(0, 8)}`,
    icon: '📡',
    bounds: { x: 600, y: 60, w: 560, h: 400 },
    content: { kind: 'app', appKey: `event-viewer:${conversationId}` },
    dedupeKey: `event-viewer:${conversationId}`,
  }));
}, [dispatch, conversationId]);
```

In `App.tsx` `renderAppWindow`:

```typescript
if (appKey.startsWith('event-viewer:')) {
  const convId = appKey.slice('event-viewer:'.length);
  return <EventViewerWindow conversationId={convId} />;
}
```

#### Step 5: Share event stream between windows

Use a simple in-memory event bus per conversation. The chat window pushes events;
the event viewer subscribes.

```typescript
// Shared per-conversation event emitter
const conversationEventBus = new Map<string, Set<(e: SemEventEnvelope) => void>>();

export function emitConversationEvent(convId: string, envelope: SemEventEnvelope) {
  conversationEventBus.get(convId)?.forEach(cb => cb(envelope));
}

export function subscribeConversationEvents(
  convId: string,
  callback: (e: SemEventEnvelope) => void,
): () => void {
  if (!conversationEventBus.has(convId)) {
    conversationEventBus.set(convId, new Set());
  }
  conversationEventBus.get(convId)!.add(callback);
  return () => conversationEventBus.get(convId)?.delete(callback);
}
```

### 8.5 ASCII mockup

```
┌─ 📡 Events — abc-123 ───────────────────────────────────────────────┐
│ [llm ✓] [tool ✓] [hypercard ✓] [timeline ✓] [ws ✓]  ⏸  🗑  📌    │
├──────────────────────────────────────────────────────────────────────┤
│ 15:42:01.234  llm.start       msg-42     assistant start            │
│ 15:42:01.567  llm.delta       msg-42     +24 chars                  │
│ 15:42:01.890  llm.delta       msg-42     +31 chars                  │
│ 15:42:02.100  tool.start      call-7     inventory_low_stock        │
│ ▼ 15:42:02.800  tool.result   call-7     3 items returned           │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │ type: tool.result                                            │   │
│   │ id: call-7                                                   │   │
│   │ data:                                                        │   │
│   │   result:                                                    │   │
│   │     items:                                                   │   │
│   │       - sku: SHOE-RUN-42                                     │   │
│   │         name: Running Shoes                                  │   │
│   │         qty: 2                                               │   │
│   └──────────────────────────────────────────────────────────────┘   │
│ 15:42:03.100  hypercard.widget.start  wgt-1   Low Stock Widget      │
│ 15:42:03.400  hypercard.widget.v1     wgt-1   ready                 │
│ 15:42:03.500  timeline.upsert         wgt-1   status                │
│ 15:42:04.200  llm.final       msg-42     567 chars                  │
│ 15:42:04.201  hypercard.suggestions.v1  sug-1  3 suggestions        │
│                                                                      │
│ ── 19 events · 4 filtered ──                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.6 Storybook stories

| Story | Description |
|-------|------------|
| `EventViewer/Empty` | Empty event log with filter bar |
| `EventViewer/MixedEvents` | 20+ events of mixed types |
| `EventViewer/FilteredView` | Only `tool.*` events visible, others filtered out |
| `EventViewer/ExpandedEntry` | One entry expanded showing full YAML payload |
| `EventViewer/Paused` | Event log paused (indicator visible, new events buffered) |
| `EventViewer/HighVolume` | 200+ events to test scroll performance |
| `EventViewer/ColorCoded` | Events color-coded by family |
| `EventViewer/WithChatDesktop` | Full desktop with chat window + event viewer side by side |

---

## 9. Cross-cutting implementation notes

### 9.1 YAML formatter (shared by F2, F6, F7)

All three features need a lightweight JSON-to-YAML formatter. Implement once as a
shared utility:

```
apps/inventory/src/features/chat/utils/yamlFormat.ts
```

Keep it dependency-free (no `js-yaml` needed for display-only formatting).

### 9.2 headerActions prop for ChatWindow (shared by F6, F7)

Both the debug toggle (F6) and the event viewer button (F7) need to render custom
buttons in the chat window header. Extend `ChatWindowProps`:

```typescript
export interface ChatWindowProps {
  // ... existing ...
  headerActions?: ReactNode;
}
```

Render in the header right section alongside the message count and stop button.

### 9.3 Dependency order

The features have some natural dependencies:

```
F5 (copy/paste) ── standalone, do first
F2 (collapse tools) ── standalone
F4 (model stats) ── standalone
F1 (per-round widgets) ── standalone but foundational
F6 (debug mode) ── depends on F2 (YAML formatter), benefits from F1
F3 (multi-window) ── significant refactor, do after F1
F7 (event viewer) ── depends on F3 (multi-window arch), F2 (YAML), F6 (headerActions)
```

Recommended implementation order:

1. **F5** — CSS-only, 5 minutes
2. **F2** — Low complexity, introduces YAML util used everywhere
3. **F4** — Low complexity, parse existing metadata
4. **F1** — Medium complexity, changes reducer structure
5. **F6** — Medium, builds on F1 + F2
6. **F3** — Medium, significant state architecture change
7. **F7** — High, largest new component, benefits from everything above

### 9.4 Testing strategy

| Feature | Unit tests | Storybook | E2E |
|---------|-----------|-----------|-----|
| F1 | Reducer: per-round widget creation | Yes (listed above) | Verify separate widgets per round |
| F2 | YAML formatter | Yes | — |
| F3 | Reducer: independent state per conversation | Yes | Two windows independent |
| F4 | Metadata parsing | Yes | Footer shows stats |
| F5 | — | Visual check | Select + copy |
| F6 | — | Yes | Toggle shows metadata |
| F7 | Event log state | Yes | Events appear |

---

## 10. Task checklist

### F1: Per-round timeline/card-panel widgets
- [ ] F1.1 Add `currentRoundId` to ChatState
- [ ] F1.2 Parameterize widget message IDs by round
- [ ] F1.3 Route upsert actions through current round
- [ ] F1.4 Handle hydration with "Previous Session" widget
- [ ] F1.5 Update reducer tests for per-round behavior
- [ ] F1.6 Add storybook stories

### F2: Collapsed tool-call messages with YAML
- [ ] F2.1 Create `yamlFormat.ts` shared utility
- [ ] F2.2 Add `rawData` field to `TimelineWidgetItem`
- [ ] F2.3 Store structured data in tool event mapping
- [ ] F2.4 Add collapse/expand toggle in InventoryTimelineWidget
- [ ] F2.5 Render expanded detail as YAML
- [ ] F2.6 Add storybook stories

### F3: Multiple chat windows (keyed Redux store)
- [ ] F3.1 Restructure chatSlice to `conversations: Record<string, ConversationState>`
- [ ] F3.2 Add `conversationId` to all action payloads
- [ ] F3.3 Update all selectors to take `(state, convId)`
- [ ] F3.4 Convert InventoryChatWindow to accept `conversationId` prop
- [ ] F3.5 Wire convId-parameterized selectors and dispatches in InventoryChatWindow
- [ ] F3.6 Add "New Chat" icon and menu entries in App.tsx
- [ ] F3.7 Wire openNewChatWindow with per-conversation dedupeKey
- [ ] F3.8 Remove global localStorage conversation persistence
- [ ] F3.9 Add optional removeConversation cleanup on window close
- [ ] F3.10 Update existing reducer tests for keyed state shape
- [ ] F3.11 Add storybook stories

### F4: Model info + token counts + TPS
- [ ] F4.1 Add `modelName` and `turnStats` to chat state
- [ ] F4.2 Parse `metadata` from SEM envelopes
- [ ] F4.3 Compute TPS from duration + output tokens
- [ ] F4.4 Render stats in ChatWindow footer
- [ ] F4.5 Add storybook stories

### F5: Copy/paste and text selection
- [ ] F5.1 Add `user-select: text` override on chat-timeline
- [ ] F5.2 Verify in existing stories

### F6: Debug mode toggle
- [ ] F6.1 Add `headerActions` prop to ChatWindow
- [ ] F6.2 Add debug toggle state in InventoryChatWindow
- [ ] F6.3 Pass debug flag to timeline/panel widgets
- [ ] F6.4 Render expanded metadata in debug mode
- [ ] F6.5 Show message IDs and status badges in debug mode
- [ ] F6.6 Add storybook stories

### F7: Streaming event viewer window
- [ ] F7.1 Create conversation event bus utility
- [ ] F7.2 Create EventViewerWindow component
- [ ] F7.3 Implement filter toggle bar
- [ ] F7.4 Implement expand/collapse per entry
- [ ] F7.5 Add pause/resume and clear controls
- [ ] F7.6 Add auto-scroll toggle
- [ ] F7.7 Wire event viewer launch from chat window
- [ ] F7.8 Register event viewer appKey in App.tsx
- [ ] F7.9 Add CSS styling for event viewer
- [ ] F7.10 Add storybook stories
