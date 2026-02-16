import type { ChatWindowMessage, InlineWidget } from '@hypercard/engine';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ChatConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';
export type TimelineItemStatus = 'running' | 'success' | 'error' | 'info';

export interface TimelineWidgetItem {
  id: string;
  title: string;
  status: TimelineItemStatus;
  detail?: string;
  kind?: 'tool' | 'widget' | 'card' | 'timeline';
  template?: string;
  artifactId?: string;
  updatedAt: number;
  /** Structured payload for expanded display (tool args, results, etc.) */
  rawData?: Record<string, unknown>;
}

export interface TurnStats {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  durationMs?: number;
  tps?: number;
}

export interface TimelineItemUpsertPayload {
  id: string;
  title: string;
  status: TimelineItemStatus;
  detail?: string;
  kind?: 'tool' | 'widget' | 'card' | 'timeline';
  template?: string;
  artifactId?: string;
  updatedAt?: number;
  rawData?: Record<string, unknown>;
}

/* ── Per-round widget ID helpers ─────────────────────────────────────── */

function timelineWidgetMessageId(roundId: number): string {
  return `timeline-widget-message-r${roundId}`;
}
function timelineWidgetId(roundId: number): string {
  return `inventory-timeline-widget-r${roundId}`;
}
function cardPanelMessageId(roundId: number): string {
  return `card-panel-widget-message-r${roundId}`;
}
function cardPanelWidgetId(roundId: number): string {
  return `inventory-card-panel-widget-r${roundId}`;
}
function widgetPanelMessageId(roundId: number): string {
  return `widget-panel-widget-message-r${roundId}`;
}
function widgetPanelWidgetId(roundId: number): string {
  return `inventory-widget-panel-widget-r${roundId}`;
}
function roundLabel(roundId: number): string {
  return roundId === 0 ? 'Previous Session' : `round ${roundId}`;
}

/* ── Constants ───────────────────────────────────────────────────────── */

const MAX_TIMELINE_ITEMS = 24;
const MAX_PANEL_ITEMS = 16;
const MAX_SUGGESTIONS = 8;

export const DEFAULT_CHAT_SUGGESTIONS = [
  'Show current inventory status',
  'What items are low stock?',
  'Summarize today sales',
];

/* ── Per-conversation state ──────────────────────────────────────────── */

export interface ConversationState {
  connectionStatus: ChatConnectionStatus;
  isStreaming: boolean;
  messages: ChatWindowMessage[];
  suggestions: string[];
  lastError: string | null;
  modelName: string | null;
  currentTurnStats: TurnStats | null;
  streamStartTime: number | null;
  streamOutputTokens: number;
  currentRoundId: number;
}

function createInitialConversationState(): ConversationState {
  return {
    connectionStatus: 'idle',
    isStreaming: false,
    messages: [],
    suggestions: [...DEFAULT_CHAT_SUGGESTIONS],
    lastError: null,
    modelName: null,
    currentTurnStats: null,
    streamStartTime: null,
    streamOutputTokens: 0,
    currentRoundId: 0,
  };
}

/* ── Top-level chat state (keyed by conversationId) ──────────────────── */

interface ChatState {
  conversations: Record<string, ConversationState>;
}

const initialState: ChatState = {
  conversations: {},
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

let messageCounter = 0;

function nextMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

function getConv(state: ChatState, convId: string): ConversationState {
  if (!state.conversations[convId]) {
    state.conversations[convId] = createInitialConversationState();
  }
  return state.conversations[convId];
}

function findMessage(conv: ConversationState, id: string): ChatWindowMessage | undefined {
  return conv.messages.find((message) => message.id === id);
}

function findLatestStreamingMessage(conv: ConversationState): ChatWindowMessage | undefined {
  for (let index = conv.messages.length - 1; index >= 0; index -= 1) {
    const message = conv.messages[index];
    if (message.role === 'ai' && message.status === 'streaming') {
      return message;
    }
  }
  return undefined;
}

function isWidget(value: unknown): value is InlineWidget {
  return typeof value === 'object' && value !== null;
}

function stripTrailingWhitespace(value: string): string {
  return value.replace(/[ \t]+$/gm, '').trimEnd();
}

function normalizeHydratedRole(value: string): ChatWindowMessage['role'] | undefined {
  const role = value.trim().toLowerCase();
  if (role === 'assistant' || role === 'ai') {
    return 'ai';
  }
  if (role === 'user') {
    return 'user';
  }
  if (role === 'system') {
    return 'system';
  }
  return undefined;
}

function normalizeSuggestionList(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const next = stripTrailingWhitespace(value).trim();
    if (next.length === 0) {
      continue;
    }
    const key = next.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(next);
    if (out.length >= MAX_SUGGESTIONS) {
      break;
    }
  }
  return out;
}

function widgetItemsFromMessage(message: ChatWindowMessage): TimelineWidgetItem[] {
  const block = message.content?.find((entry) => entry.kind === 'widget');
  if (!block || !isWidget(block.widget) || !block.widget.props) {
    return [];
  }
  const rawItems = (block.widget.props as Record<string, unknown>).items;
  if (!Array.isArray(rawItems)) {
    return [];
  }
  return rawItems.filter((item): item is TimelineWidgetItem => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.status === 'string' &&
      (typeof candidate.kind === 'undefined' || typeof candidate.kind === 'string') &&
      (typeof candidate.template === 'undefined' || typeof candidate.template === 'string') &&
      (typeof candidate.artifactId === 'undefined' || typeof candidate.artifactId === 'string') &&
      typeof candidate.updatedAt === 'number'
    );
  });
}

function setWidgetItems(message: ChatWindowMessage, items: TimelineWidgetItem[]) {
  const widgetBlock = message.content?.find((entry) => entry.kind === 'widget');
  if (!widgetBlock || !isWidget(widgetBlock.widget)) {
    return;
  }
  widgetBlock.widget.props = {
    ...(widgetBlock.widget.props as Record<string, unknown>),
    items,
  };
}

function ensureWidgetMessage(
  conv: ConversationState,
  messageID: string,
  widgetID: string,
  widgetType: string,
  label: string,
): ChatWindowMessage {
  let message = findMessage(conv, messageID);
  if (message) {
    return message;
  }

  message = {
    id: messageID,
    role: 'system',
    text: '',
    status: 'complete',
    content: [
      {
        kind: 'widget',
        widget: {
          id: widgetID,
          type: widgetType,
          label,
          props: {
            items: [],
          },
        },
      },
    ],
  };
  conv.messages.push(message);
  return message;
}

function ensureTimelineWidgetMessage(conv: ConversationState): ChatWindowMessage {
  const r = conv.currentRoundId;
  return ensureWidgetMessage(
    conv,
    timelineWidgetMessageId(r),
    timelineWidgetId(r),
    'inventory.timeline',
    `Run Timeline (${roundLabel(r)})`,
  );
}

function ensureCardPanelMessage(conv: ConversationState): ChatWindowMessage {
  const r = conv.currentRoundId;
  return ensureWidgetMessage(
    conv,
    cardPanelMessageId(r),
    cardPanelWidgetId(r),
    'inventory.cards',
    `Generated Cards (${roundLabel(r)})`,
  );
}

function ensureWidgetPanelMessage(conv: ConversationState): ChatWindowMessage {
  const r = conv.currentRoundId;
  return ensureWidgetMessage(
    conv,
    widgetPanelMessageId(r),
    widgetPanelWidgetId(r),
    'inventory.widgets',
    `Generated Widgets (${roundLabel(r)})`,
  );
}

function applyTimelineItemUpsert(
  message: ChatWindowMessage,
  payload: TimelineItemUpsertPayload,
  maxItems: number,
  defaultKind?: 'tool' | 'widget' | 'card' | 'timeline',
) {
  const items = widgetItemsFromMessage(message);
  const updatedAt = payload.updatedAt ?? Date.now();
  const existingIndex = items.findIndex((item) => item.id === payload.id);
  const nextItem: TimelineWidgetItem = {
    id: payload.id,
    title: payload.title,
    status: payload.status,
    detail: payload.detail ? stripTrailingWhitespace(payload.detail).trim() : undefined,
    updatedAt,
  };
  const nextKind = payload.kind ?? defaultKind;
  if (nextKind) {
    nextItem.kind = nextKind;
  }
  if (payload.template) {
    nextItem.template = payload.template.trim();
  }
  if (payload.artifactId) {
    nextItem.artifactId = payload.artifactId.trim();
  }
  if (payload.rawData) {
    nextItem.rawData = payload.rawData;
  }

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      ...nextItem,
    };
  } else {
    items.push(nextItem);
  }

  items.sort((a, b) => b.updatedAt - a.updatedAt);
  setWidgetItems(message, items.slice(0, maxItems));
}

/* ── Payload type helper — every action includes conversationId ──────── */

type WithConv<T> = T & { conversationId: string };

/* ── Slice ───────────────────────────────────────────────────────────── */

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConnectionStatus(state, action: PayloadAction<WithConv<{ status: ChatConnectionStatus }>>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.connectionStatus = action.payload.status;
    },
    upsertHydratedMessage(
      state,
      action: PayloadAction<
        WithConv<{
          id: string;
          role: string;
          text?: string;
          status?: 'complete' | 'streaming' | 'error';
        }>
      >,
    ) {
      const conv = getConv(state, action.payload.conversationId);
      const id = action.payload.id.trim();
      if (id.length === 0) {
        return;
      }
      const role = normalizeHydratedRole(action.payload.role);
      if (!role) {
        return;
      }
      const status = action.payload.status ?? 'complete';
      const nextText = typeof action.payload.text === 'string' ? stripTrailingWhitespace(action.payload.text) : '';
      const existing = findMessage(conv, id);
      if (existing) {
        existing.role = role;
        existing.status = status;
        if (nextText.length > 0 || existing.text.length === 0) {
          existing.text = nextText;
        }
        return;
      }

      // De-duplicate: if the backend echoes back a user/ai message we already
      // created locally (different ID, same role + text), adopt the server ID
      // instead of creating a duplicate row.
      if (nextText.length > 0) {
        const duplicate = conv.messages.find(
          (m) => m.role === role && m.text === nextText && m.id !== id,
        );
        if (duplicate) {
          duplicate.id = id;
          duplicate.status = status;
          return;
        }
      }

      conv.messages.push({
        id,
        role,
        text: nextText,
        status,
      });
    },
    queueUserPrompt(state, action: PayloadAction<WithConv<{ text: string }>>) {
      const conv = getConv(state, action.payload.conversationId);
      const text = action.payload.text.trim();
      if (text.length === 0) {
        return;
      }

      conv.currentRoundId += 1;
      conv.lastError = null;
      conv.messages.push({
        id: nextMessageId('user'),
        role: 'user',
        text,
        status: 'complete',
      });
      conv.messages.push({
        id: nextMessageId('pending-ai'),
        role: 'ai',
        text: '',
        status: 'streaming',
      });
      conv.suggestions = [];
      conv.isStreaming = true;
    },
    applyLLMStart(state, action: PayloadAction<WithConv<{ messageId: string }>>) {
      const conv = getConv(state, action.payload.conversationId);
      const { messageId } = action.payload;
      const existing = findMessage(conv, messageId);
      if (existing) {
        existing.status = 'streaming';
      } else {
        const pending = findLatestStreamingMessage(conv);
        if (pending?.id?.startsWith('pending-ai-')) {
          pending.id = messageId;
        } else {
          conv.messages.push({
            id: messageId,
            role: 'ai',
            text: '',
            status: 'streaming',
          });
        }
      }
      conv.isStreaming = true;
    },
    applyLLMDelta(
      state,
      action: PayloadAction<WithConv<{ messageId: string; cumulative?: string; delta?: string }>>,
    ) {
      const conv = getConv(state, action.payload.conversationId);
      const { messageId, cumulative, delta } = action.payload;
      let message = findMessage(conv, messageId);
      if (!message) {
        message = findLatestStreamingMessage(conv);
      }
      if (!message) {
        message = {
          id: messageId,
          role: 'ai',
          text: '',
          status: 'streaming',
        };
        conv.messages.push(message);
      }

      if (typeof cumulative === 'string') {
        message.text = cumulative;
      } else if (typeof delta === 'string' && delta.length > 0) {
        message.text += delta;
      }
      message.status = 'streaming';
      conv.isStreaming = true;
    },
    applyLLMFinal(state, action: PayloadAction<WithConv<{ messageId: string; text?: string }>>) {
      const conv = getConv(state, action.payload.conversationId);
      const { messageId, text } = action.payload;
      let message = findMessage(conv, messageId);
      if (!message) {
        message = findLatestStreamingMessage(conv);
      }
      if (!message) {
        conv.messages.push({
          id: messageId,
          role: 'ai',
          text: typeof text === 'string' ? stripTrailingWhitespace(text) : '',
          status: 'complete',
        });
      } else {
        if (typeof text === 'string') {
          message.text = stripTrailingWhitespace(text);
        }
        message.status = 'complete';
      }
      conv.isStreaming = false;
    },
    appendToolEvent(state, action: PayloadAction<WithConv<{ text: string }>>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.messages.push({
        id: nextMessageId('tool'),
        role: 'system',
        text: stripTrailingWhitespace(action.payload.text),
        status: 'complete',
      });
    },
    upsertTimelineItem(state, action: PayloadAction<WithConv<TimelineItemUpsertPayload>>) {
      const conv = getConv(state, action.payload.conversationId);
      const id = action.payload.id.trim();
      const title = action.payload.title.trim();
      if (id.length === 0 || title.length === 0) {
        return;
      }
      const message = ensureTimelineWidgetMessage(conv);
      applyTimelineItemUpsert(message, { ...action.payload, id, title }, MAX_TIMELINE_ITEMS);
    },
    upsertCardPanelItem(state, action: PayloadAction<WithConv<TimelineItemUpsertPayload>>) {
      const conv = getConv(state, action.payload.conversationId);
      const id = action.payload.id.trim();
      const title = action.payload.title.trim();
      if (id.length === 0 || title.length === 0) {
        return;
      }
      const message = ensureCardPanelMessage(conv);
      applyTimelineItemUpsert(message, { ...action.payload, id, title }, MAX_PANEL_ITEMS, 'card');
    },
    upsertWidgetPanelItem(state, action: PayloadAction<WithConv<TimelineItemUpsertPayload>>) {
      const conv = getConv(state, action.payload.conversationId);
      const id = action.payload.id.trim();
      const title = action.payload.title.trim();
      if (id.length === 0 || title.length === 0) {
        return;
      }
      const message = ensureWidgetPanelMessage(conv);
      applyTimelineItemUpsert(message, { ...action.payload, id, title }, MAX_PANEL_ITEMS, 'widget');
    },
    setStreamError(state, action: PayloadAction<WithConv<{ message: string }>>) {
      const conv = getConv(state, action.payload.conversationId);
      const message = action.payload.message.trim() || 'Request failed';
      conv.lastError = message;
      conv.isStreaming = false;

      const streaming = findLatestStreamingMessage(conv);
      if (streaming) {
        streaming.status = 'error';
        if (!streaming.text) {
          streaming.text = message;
        }
      } else {
        conv.messages.push({
          id: nextMessageId('error'),
          role: 'system',
          text: message,
          status: 'error',
        });
      }
    },
    resetConversation(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.messages = [];
      conv.suggestions = [...DEFAULT_CHAT_SUGGESTIONS];
      conv.isStreaming = false;
      conv.lastError = null;
      conv.currentRoundId = 0;
    },
    removeConversation(state, action: PayloadAction<{ conversationId: string }>) {
      delete state.conversations[action.payload.conversationId];
    },
    replaceSuggestions(state, action: PayloadAction<WithConv<{ suggestions: string[] }>>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.suggestions = normalizeSuggestionList(action.payload.suggestions);
    },
    mergeSuggestions(state, action: PayloadAction<WithConv<{ suggestions: string[] }>>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.suggestions = normalizeSuggestionList([...conv.suggestions, ...action.payload.suggestions]);
    },
    setModelName(state, action: PayloadAction<WithConv<{ model: string }>>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.modelName = action.payload.model;
    },
    markStreamStart(state, action: PayloadAction<WithConv<{ time: number }>>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.streamStartTime = action.payload.time;
      conv.streamOutputTokens = 0;
      conv.currentTurnStats = null;
    },
    updateStreamTokens(state, action: PayloadAction<WithConv<{ outputTokens: number }>>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.streamOutputTokens = action.payload.outputTokens;
    },
    setTurnStats(state, action: PayloadAction<WithConv<TurnStats>>) {
      const conv = getConv(state, action.payload.conversationId);
      const { conversationId: _, ...rest } = action.payload;
      const stats = { ...rest };
      if (stats.outputTokens && stats.durationMs && stats.durationMs > 0) {
        stats.tps = Math.round((stats.outputTokens / (stats.durationMs / 1000)) * 10) / 10;
      }
      conv.currentTurnStats = stats;
      conv.streamStartTime = null;
      conv.streamOutputTokens = 0;
    },
  },
});

export const {
  setConnectionStatus,
  upsertHydratedMessage,
  queueUserPrompt,
  applyLLMStart,
  applyLLMDelta,
  applyLLMFinal,
  appendToolEvent,
  upsertTimelineItem,
  upsertCardPanelItem,
  upsertWidgetPanelItem,
  setStreamError,
  resetConversation,
  removeConversation,
  replaceSuggestions,
  mergeSuggestions,
  setModelName,
  markStreamStart,
  updateStreamTokens,
  setTurnStats,
} = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
