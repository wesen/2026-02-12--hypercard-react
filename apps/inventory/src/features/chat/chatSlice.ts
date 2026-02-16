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
}

const TIMELINE_WIDGET_MESSAGE_ID = 'timeline-widget-message';
const TIMELINE_WIDGET_ID = 'inventory-timeline-widget';
const CARD_PANEL_MESSAGE_ID = 'card-panel-widget-message';
const CARD_PANEL_WIDGET_ID = 'inventory-card-panel-widget';
const WIDGET_PANEL_MESSAGE_ID = 'widget-panel-widget-message';
const WIDGET_PANEL_WIDGET_ID = 'inventory-widget-panel-widget';
const MAX_TIMELINE_ITEMS = 24;
const MAX_PANEL_ITEMS = 16;

interface ChatState {
  conversationId: string | null;
  connectionStatus: ChatConnectionStatus;
  isStreaming: boolean;
  messages: ChatWindowMessage[];
  lastError: string | null;
}

const initialState: ChatState = {
  conversationId: null,
  connectionStatus: 'idle',
  isStreaming: false,
  messages: [],
  lastError: null,
};

let messageCounter = 0;

function nextMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

function findMessage(state: ChatState, id: string): ChatWindowMessage | undefined {
  return state.messages.find((message) => message.id === id);
}

function findLatestStreamingMessage(state: ChatState): ChatWindowMessage | undefined {
  for (let index = state.messages.length - 1; index >= 0; index -= 1) {
    const message = state.messages[index];
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
  state: ChatState,
  messageID: string,
  widgetID: string,
  widgetType: string,
  label: string,
): ChatWindowMessage {
  let message = findMessage(state, messageID);
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
  state.messages.push(message);
  return message;
}

function ensureTimelineWidgetMessage(state: ChatState): ChatWindowMessage {
  return ensureWidgetMessage(
    state,
    TIMELINE_WIDGET_MESSAGE_ID,
    TIMELINE_WIDGET_ID,
    'inventory.timeline',
    'Run Timeline',
  );
}

function ensureCardPanelMessage(state: ChatState): ChatWindowMessage {
  return ensureWidgetMessage(
    state,
    CARD_PANEL_MESSAGE_ID,
    CARD_PANEL_WIDGET_ID,
    'inventory.cards',
    'Generated Cards',
  );
}

function ensureWidgetPanelMessage(state: ChatState): ChatWindowMessage {
  return ensureWidgetMessage(
    state,
    WIDGET_PANEL_MESSAGE_ID,
    WIDGET_PANEL_WIDGET_ID,
    'inventory.widgets',
    'Generated Widgets',
  );
}

function applyTimelineItemUpsert(
  message: ChatWindowMessage,
  payload: {
    id: string;
    title: string;
    status: TimelineItemStatus;
    detail?: string;
    kind?: 'tool' | 'widget' | 'card' | 'timeline';
    template?: string;
    artifactId?: string;
    updatedAt?: number;
  },
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

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversationId(state, action: PayloadAction<string>) {
      state.conversationId = action.payload;
    },
    setConnectionStatus(state, action: PayloadAction<ChatConnectionStatus>) {
      state.connectionStatus = action.payload;
    },
    queueUserPrompt(state, action: PayloadAction<{ text: string }>) {
      const text = action.payload.text.trim();
      if (text.length === 0) {
        return;
      }

      state.lastError = null;
      state.messages.push({
        id: nextMessageId('user'),
        role: 'user',
        text,
        status: 'complete',
      });
      state.messages.push({
        id: nextMessageId('pending-ai'),
        role: 'ai',
        text: '',
        status: 'streaming',
      });
      state.isStreaming = true;
    },
    applyLLMStart(state, action: PayloadAction<{ messageId: string }>) {
      const { messageId } = action.payload;
      const existing = findMessage(state, messageId);
      if (existing) {
        existing.status = 'streaming';
      } else {
        const pending = findLatestStreamingMessage(state);
        if (pending?.id?.startsWith('pending-ai-')) {
          pending.id = messageId;
        } else {
          state.messages.push({
            id: messageId,
            role: 'ai',
            text: '',
            status: 'streaming',
          });
        }
      }
      state.isStreaming = true;
    },
    applyLLMDelta(state, action: PayloadAction<{ messageId: string; cumulative?: string; delta?: string }>) {
      const { messageId, cumulative, delta } = action.payload;
      let message = findMessage(state, messageId);
      if (!message) {
        message = findLatestStreamingMessage(state);
      }
      if (!message) {
        message = {
          id: messageId,
          role: 'ai',
          text: '',
          status: 'streaming',
        };
        state.messages.push(message);
      }

      if (typeof cumulative === 'string') {
        message.text = cumulative;
      } else if (typeof delta === 'string' && delta.length > 0) {
        message.text += delta;
      }
      message.status = 'streaming';
      state.isStreaming = true;
    },
    applyLLMFinal(state, action: PayloadAction<{ messageId: string; text?: string }>) {
      const { messageId, text } = action.payload;
      let message = findMessage(state, messageId);
      if (!message) {
        message = findLatestStreamingMessage(state);
      }
      if (!message) {
        state.messages.push({
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
      state.isStreaming = false;
    },
    appendToolEvent(state, action: PayloadAction<{ text: string }>) {
      state.messages.push({
        id: nextMessageId('tool'),
        role: 'system',
        text: stripTrailingWhitespace(action.payload.text),
        status: 'complete',
      });
    },
    upsertTimelineItem(
      state,
      action: PayloadAction<{
        id: string;
        title: string;
        status: TimelineItemStatus;
        detail?: string;
        kind?: 'tool' | 'widget' | 'card' | 'timeline';
        template?: string;
        artifactId?: string;
        updatedAt?: number;
      }>,
    ) {
      const id = action.payload.id.trim();
      const title = action.payload.title.trim();
      if (id.length === 0 || title.length === 0) {
        return;
      }

      const message = ensureTimelineWidgetMessage(state);
      applyTimelineItemUpsert(
        message,
        {
          ...action.payload,
          id,
          title,
        },
        MAX_TIMELINE_ITEMS,
      );
    },
    upsertCardPanelItem(
      state,
      action: PayloadAction<{
        id: string;
        title: string;
        status: TimelineItemStatus;
        detail?: string;
        kind?: 'tool' | 'widget' | 'card' | 'timeline';
        template?: string;
        artifactId?: string;
        updatedAt?: number;
      }>,
    ) {
      const id = action.payload.id.trim();
      const title = action.payload.title.trim();
      if (id.length === 0 || title.length === 0) {
        return;
      }
      const message = ensureCardPanelMessage(state);
      applyTimelineItemUpsert(
        message,
        {
          ...action.payload,
          id,
          title,
        },
        MAX_PANEL_ITEMS,
        'card',
      );
    },
    upsertWidgetPanelItem(
      state,
      action: PayloadAction<{
        id: string;
        title: string;
        status: TimelineItemStatus;
        detail?: string;
        kind?: 'tool' | 'widget' | 'card' | 'timeline';
        template?: string;
        artifactId?: string;
        updatedAt?: number;
      }>,
    ) {
      const id = action.payload.id.trim();
      const title = action.payload.title.trim();
      if (id.length === 0 || title.length === 0) {
        return;
      }
      const message = ensureWidgetPanelMessage(state);
      applyTimelineItemUpsert(
        message,
        {
          ...action.payload,
          id,
          title,
        },
        MAX_PANEL_ITEMS,
        'widget',
      );
    },
    setStreamError(state, action: PayloadAction<{ message: string }>) {
      const message = action.payload.message.trim() || 'Request failed';
      state.lastError = message;
      state.isStreaming = false;

      const streaming = findLatestStreamingMessage(state);
      if (streaming) {
        streaming.status = 'error';
        if (!streaming.text) {
          streaming.text = message;
        }
      } else {
        state.messages.push({
          id: nextMessageId('error'),
          role: 'system',
          text: message,
          status: 'error',
        });
      }
    },
    resetConversation(state) {
      state.messages = [];
      state.isStreaming = false;
      state.lastError = null;
    },
  },
});

export const {
  setConversationId,
  setConnectionStatus,
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
} = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
