import type { ChatMessage } from '@hypercard/engine';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ChatConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

interface ChatState {
  conversationId: string | null;
  connectionStatus: ChatConnectionStatus;
  isStreaming: boolean;
  messages: ChatMessage[];
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

function findMessage(state: ChatState, id: string): ChatMessage | undefined {
  return state.messages.find((message) => message.id === id);
}

function findLatestStreamingMessage(state: ChatState): ChatMessage | undefined {
  for (let index = state.messages.length - 1; index >= 0; index -= 1) {
    const message = state.messages[index];
    if (message.role === 'ai' && message.status === 'streaming') {
      return message;
    }
  }
  return undefined;
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
  setStreamError,
  resetConversation,
} = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
