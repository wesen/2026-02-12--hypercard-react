import type { ChatWindowMessage, InlineWidget } from '@hypercard/engine';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ChatConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';
export type TimelineItemStatus = 'running' | 'success' | 'error' | 'info';

export interface TimelineWidgetItem {
  id: string;
  title: string;
  status: TimelineItemStatus;
  detail?: string;
  updatedAt: number;
}

const TIMELINE_WIDGET_MESSAGE_ID = 'timeline-widget-message';
const TIMELINE_WIDGET_ID = 'inventory-timeline-widget';
const MAX_TIMELINE_ITEMS = 24;

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

function timelineItemsFromMessage(message: ChatWindowMessage): TimelineWidgetItem[] {
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
      typeof candidate.updatedAt === 'number'
    );
  });
}

function setTimelineItems(message: ChatWindowMessage, items: TimelineWidgetItem[]) {
  const widgetBlock = message.content?.find((entry) => entry.kind === 'widget');
  if (!widgetBlock || !isWidget(widgetBlock.widget)) {
    return;
  }
  widgetBlock.widget.props = {
    ...(widgetBlock.widget.props as Record<string, unknown>),
    items,
  };
}

function ensureTimelineWidgetMessage(state: ChatState): ChatWindowMessage {
  let message = findMessage(state, TIMELINE_WIDGET_MESSAGE_ID);
  if (message) {
    return message;
  }

  message = {
    id: TIMELINE_WIDGET_MESSAGE_ID,
    role: 'system',
    text: '',
    status: 'complete',
    content: [
      {
        kind: 'widget',
        widget: {
          id: TIMELINE_WIDGET_ID,
          type: 'inventory.timeline',
          label: 'Run Timeline',
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
          text: text ?? '',
          status: 'complete',
        });
      } else {
        if (typeof text === 'string') {
          message.text = text;
        }
        message.status = 'complete';
      }
      state.isStreaming = false;
    },
    appendToolEvent(state, action: PayloadAction<{ text: string }>) {
      state.messages.push({
        id: nextMessageId('tool'),
        role: 'system',
        text: action.payload.text,
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
        updatedAt?: number;
      }>,
    ) {
      const id = action.payload.id.trim();
      const title = action.payload.title.trim();
      if (id.length === 0 || title.length === 0) {
        return;
      }

      const message = ensureTimelineWidgetMessage(state);
      const items = timelineItemsFromMessage(message);
      const updatedAt = action.payload.updatedAt ?? Date.now();
      const existingIndex = items.findIndex((item) => item.id === id);
      const nextItem: TimelineWidgetItem = {
        id,
        title,
        status: action.payload.status,
        detail: action.payload.detail?.trim() || undefined,
        updatedAt,
      };

      if (existingIndex >= 0) {
        items[existingIndex] = {
          ...items[existingIndex],
          ...nextItem,
        };
      } else {
        items.push(nextItem);
      }

      items.sort((a, b) => b.updatedAt - a.updatedAt);
      setTimelineItems(message, items.slice(0, MAX_TIMELINE_ITEMS));
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
  setStreamError,
  resetConversation,
} = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
