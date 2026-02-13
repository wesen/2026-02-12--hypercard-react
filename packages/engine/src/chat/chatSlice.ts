import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '../types';

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;
}

export interface ChatState {
  conversations: Record<string, Conversation>;
  activeConversationId: string;
}

function ensureConversation(state: ChatState, id: string): Conversation {
  if (!state.conversations[id]) {
    state.conversations[id] = {
      id,
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
      error: null,
    };
  }
  return state.conversations[id];
}

let msgCounter = 0;
export function nextMessageId(): string {
  msgCounter += 1;
  return `msg-${msgCounter}`;
}

const initialState: ChatState = {
  conversations: {
    default: {
      id: 'default',
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
      error: null,
    },
  },
  activeConversationId: 'default',
};

export const streamingChatSlice = createSlice({
  name: 'streamingChat',
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string>) {
      ensureConversation(state, action.payload);
      state.activeConversationId = action.payload;
    },

    addMessage(state, action: PayloadAction<{ conversationId?: string; message: ChatMessage }>) {
      const convId = action.payload.conversationId ?? state.activeConversationId;
      const conv = ensureConversation(state, convId);
      conv.messages.push(action.payload.message);
    },

    startStreaming(state, action: PayloadAction<{ conversationId?: string; messageId: string }>) {
      const convId = action.payload.conversationId ?? state.activeConversationId;
      const conv = ensureConversation(state, convId);
      conv.isStreaming = true;
      conv.streamingMessageId = action.payload.messageId;
      conv.error = null;
      // Add a placeholder streaming message
      conv.messages.push({
        id: action.payload.messageId,
        role: 'ai',
        text: '',
        status: 'streaming',
      });
    },

    appendStreamToken(state, action: PayloadAction<{ conversationId?: string; messageId: string; token: string }>) {
      const convId = action.payload.conversationId ?? state.activeConversationId;
      const conv = state.conversations[convId];
      if (!conv) return;
      const msg = conv.messages.find((m) => m.id === action.payload.messageId);
      if (msg && msg.status === 'streaming') {
        msg.text += action.payload.token;
      }
    },

    finishStreaming(state, action: PayloadAction<{
      conversationId?: string;
      messageId: string;
      actions?: ChatMessage['actions'];
      results?: unknown[];
    }>) {
      const convId = action.payload.conversationId ?? state.activeConversationId;
      const conv = state.conversations[convId];
      if (!conv) return;
      conv.isStreaming = false;
      conv.streamingMessageId = null;
      const msg = conv.messages.find((m) => m.id === action.payload.messageId);
      if (msg) {
        msg.status = 'complete';
        if (action.payload.actions) msg.actions = action.payload.actions;
        if (action.payload.results) msg.results = action.payload.results;
      }
    },

    streamError(state, action: PayloadAction<{ conversationId?: string; messageId: string; error: string }>) {
      const convId = action.payload.conversationId ?? state.activeConversationId;
      const conv = state.conversations[convId];
      if (!conv) return;
      conv.isStreaming = false;
      conv.streamingMessageId = null;
      conv.error = action.payload.error;
      const msg = conv.messages.find((m) => m.id === action.payload.messageId);
      if (msg) {
        msg.status = 'error';
        msg.text = msg.text || action.payload.error;
      }
    },

    resetConversation(state, action: PayloadAction<string | undefined>) {
      const convId = action.payload ?? state.activeConversationId;
      const conv = state.conversations[convId];
      if (conv) {
        conv.messages = [];
        conv.isStreaming = false;
        conv.streamingMessageId = null;
        conv.error = null;
      }
    },
  },
});

export const {
  setActiveConversation,
  addMessage,
  startStreaming,
  appendStreamToken,
  finishStreaming,
  streamError,
  resetConversation,
} = streamingChatSlice.actions;

export const streamingChatReducer = streamingChatSlice.reducer;

// ── Selectors ──

export interface StreamingChatStateSlice {
  streamingChat: ChatState;
}

const selectChatRoot = (state: StreamingChatStateSlice) => state.streamingChat;

export const selectActiveConversationId = createSelector(
  [selectChatRoot],
  (chat) => chat.activeConversationId,
);

export const selectActiveConversation = createSelector(
  [selectChatRoot],
  (chat) => chat.conversations[chat.activeConversationId] ?? null,
);

export const selectActiveMessages = createSelector(
  [selectActiveConversation],
  (conv) => conv?.messages ?? [],
);

export const selectIsStreaming = createSelector(
  [selectActiveConversation],
  (conv) => conv?.isStreaming ?? false,
);

export const selectStreamingMessageId = createSelector(
  [selectActiveConversation],
  (conv) => conv?.streamingMessageId ?? null,
);

export const selectChatError = createSelector(
  [selectActiveConversation],
  (conv) => conv?.error ?? null,
);
