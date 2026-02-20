import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ChatConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'closed'
  | 'error';

export interface TurnStats {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  durationMs?: number;
  tps?: number;
}

export interface ConversationState {
  // Legacy inventory-local metadata. Primary runtime metadata now lives in
  // engine ConversationRuntime and should be consumed via runtime selectors.
  connectionStatus: ChatConnectionStatus;
  lastError: string | null;
  modelName: string | null;
  currentTurnStats: TurnStats | null;
  streamStartTime: number | null;
  streamOutputTokens: number;
}

function createInitialConversationState(): ConversationState {
  return {
    connectionStatus: 'idle',
    lastError: null,
    modelName: null,
    currentTurnStats: null,
    streamStartTime: null,
    streamOutputTokens: 0,
  };
}

interface ChatState {
  conversations: Record<string, ConversationState>;
}

const initialState: ChatState = {
  conversations: {},
};

type WithConv<T> = T & { conversationId: string };

function getConv(state: ChatState, convId: string): ConversationState {
  if (!state.conversations[convId]) {
    state.conversations[convId] = createInitialConversationState();
  }
  return state.conversations[convId];
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConnectionStatus(
      state,
      action: PayloadAction<WithConv<{ status: ChatConnectionStatus }>>,
    ) {
      const conv = getConv(state, action.payload.conversationId);
      conv.connectionStatus = action.payload.status;
    },

    setStreamError(state, action: PayloadAction<WithConv<{ message: string }>>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.lastError = action.payload.message.trim() || 'Request failed';
      conv.streamStartTime = null;
    },

    resetConversation(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = getConv(state, action.payload.conversationId);
      conv.lastError = null;
      conv.modelName = null;
      conv.currentTurnStats = null;
      conv.streamStartTime = null;
      conv.streamOutputTokens = 0;
    },

    removeConversation(state, action: PayloadAction<{ conversationId: string }>) {
      delete state.conversations[action.payload.conversationId];
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

    updateStreamTokens(
      state,
      action: PayloadAction<WithConv<{ outputTokens: number }>>,
    ) {
      const conv = getConv(state, action.payload.conversationId);
      conv.streamOutputTokens = action.payload.outputTokens;
    },

    setTurnStats(state, action: PayloadAction<WithConv<TurnStats>>) {
      const conv = getConv(state, action.payload.conversationId);
      const { conversationId: _, ...rest } = action.payload;
      const stats = { ...rest };
      if (stats.outputTokens && stats.durationMs && stats.durationMs > 0) {
        stats.tps =
          Math.round((stats.outputTokens / (stats.durationMs / 1000)) * 10) /
          10;
      }
      conv.currentTurnStats = stats;
      conv.streamStartTime = null;
      conv.streamOutputTokens = 0;
    },
  },
});

export const {
  setConnectionStatus,
  setStreamError,
  resetConversation,
  removeConversation,
  setModelName,
  markStreamStart,
  updateStreamTokens,
  setTurnStats,
} = chatSlice.actions;

export const chatReducer = chatSlice.reducer;
