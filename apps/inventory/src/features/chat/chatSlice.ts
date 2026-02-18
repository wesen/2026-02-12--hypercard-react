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

const MAX_SUGGESTIONS = 8;

export const DEFAULT_CHAT_SUGGESTIONS = [
  'Show current inventory status',
  'What items are low stock?',
  'Summarize today sales',
];

export interface ConversationState {
  connectionStatus: ChatConnectionStatus;
  suggestions: string[];
  lastError: string | null;
  modelName: string | null;
  currentTurnStats: TurnStats | null;
  streamStartTime: number | null;
  streamOutputTokens: number;
}

function createInitialConversationState(): ConversationState {
  return {
    connectionStatus: 'idle',
    suggestions: [...DEFAULT_CHAT_SUGGESTIONS],
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

function normalizeSuggestionList(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const next = value.trim();
    if (!next) continue;
    const key = next.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
    if (out.length >= MAX_SUGGESTIONS) break;
  }
  return out;
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
      conv.suggestions = [...DEFAULT_CHAT_SUGGESTIONS];
      conv.lastError = null;
      conv.modelName = null;
      conv.currentTurnStats = null;
      conv.streamStartTime = null;
      conv.streamOutputTokens = 0;
    },

    removeConversation(state, action: PayloadAction<{ conversationId: string }>) {
      delete state.conversations[action.payload.conversationId];
    },

    replaceSuggestions(
      state,
      action: PayloadAction<WithConv<{ suggestions: string[] }>>,
    ) {
      const conv = getConv(state, action.payload.conversationId);
      conv.suggestions = normalizeSuggestionList(action.payload.suggestions);
    },

    mergeSuggestions(
      state,
      action: PayloadAction<WithConv<{ suggestions: string[] }>>,
    ) {
      const conv = getConv(state, action.payload.conversationId);
      conv.suggestions = normalizeSuggestionList([
        ...conv.suggestions,
        ...action.payload.suggestions,
      ]);
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
  replaceSuggestions,
  mergeSuggestions,
  setModelName,
  markStreamStart,
  updateStreamTokens,
  setTurnStats,
} = chatSlice.actions;

export const chatReducer = chatSlice.reducer;
