import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { stripTrailingWhitespace } from '../sem/semHelpers';

export type ChatConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

export interface TurnStats {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  durationMs?: number;
  tps?: number;
}

export interface ChatSessionState {
  connectionStatus: ChatConnectionStatus;
  isStreaming: boolean;
  suggestions: string[];
  modelName: string | null;
  turnStats: TurnStats | null;
  streamStartTime: number | null;
  streamOutputTokens: number;
  lastError: string | null;
}

export interface ChatSessionSliceState {
  byConvId: Record<string, ChatSessionState>;
}

const MAX_SUGGESTIONS = 8;

export const DEFAULT_CHAT_SUGGESTIONS = [
  'Show current inventory status',
  'What items are low stock?',
  'Summarize today sales',
];

const initialState: ChatSessionSliceState = {
  byConvId: {},
};

function createInitialChatSessionState(): ChatSessionState {
  return {
    connectionStatus: 'idle',
    isStreaming: false,
    suggestions: [...DEFAULT_CHAT_SUGGESTIONS],
    modelName: null,
    turnStats: null,
    streamStartTime: null,
    streamOutputTokens: 0,
    lastError: null,
  };
}

function getSession(state: ChatSessionSliceState, convId: string): ChatSessionState {
  if (!state.byConvId[convId]) {
    state.byConvId[convId] = createInitialChatSessionState();
  }
  return state.byConvId[convId];
}

function normalizeSuggestionList(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const next = stripTrailingWhitespace(value).trim();
    if (!next) continue;

    const key = next.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(next);
    if (out.length >= MAX_SUGGESTIONS) {
      break;
    }
  }

  return out;
}

export const chatSessionSlice = createSlice({
  name: 'chatSession',
  initialState,
  reducers: {
    setConnectionStatus(
      state,
      action: PayloadAction<{ convId: string; status: ChatConnectionStatus }>
    ) {
      getSession(state, action.payload.convId).connectionStatus = action.payload.status;
    },

    setIsStreaming(state, action: PayloadAction<{ convId: string; isStreaming: boolean }>) {
      getSession(state, action.payload.convId).isStreaming = action.payload.isStreaming;
    },

    setSuggestions(state, action: PayloadAction<{ convId: string; suggestions: string[] }>) {
      const normalized = normalizeSuggestionList(action.payload.suggestions);
      getSession(state, action.payload.convId).suggestions =
        normalized.length > 0 ? normalized : [...DEFAULT_CHAT_SUGGESTIONS];
    },

    replaceSuggestions(state, action: PayloadAction<{ convId: string; suggestions: string[] }>) {
      const normalized = normalizeSuggestionList(action.payload.suggestions);
      getSession(state, action.payload.convId).suggestions =
        normalized.length > 0 ? normalized : [...DEFAULT_CHAT_SUGGESTIONS];
    },

    mergeSuggestions(state, action: PayloadAction<{ convId: string; suggestions: string[] }>) {
      const session = getSession(state, action.payload.convId);
      session.suggestions = normalizeSuggestionList([
        ...session.suggestions,
        ...action.payload.suggestions,
      ]);
    },

    setModelName(state, action: PayloadAction<{ convId: string; modelName: string | null }>) {
      getSession(state, action.payload.convId).modelName = action.payload.modelName;
    },

    setTurnStats(state, action: PayloadAction<{ convId: string; turnStats: TurnStats | null }>) {
      getSession(state, action.payload.convId).turnStats = action.payload.turnStats;
    },

    markStreamStart(state, action: PayloadAction<{ convId: string; streamStartTime?: number }>) {
      const session = getSession(state, action.payload.convId);
      session.streamStartTime = action.payload.streamStartTime ?? Date.now();
      session.streamOutputTokens = 0;
      session.lastError = null;
    },

    updateStreamTokens(state, action: PayloadAction<{ convId: string; streamOutputTokens: number }>) {
      const session = getSession(state, action.payload.convId);
      session.streamOutputTokens = Math.max(0, Math.trunc(action.payload.streamOutputTokens));
    },

    setStreamError(state, action: PayloadAction<{ convId: string; error: string | null }>) {
      getSession(state, action.payload.convId).lastError = action.payload.error;
    },

    resetSession(state, action: PayloadAction<{ convId: string }>) {
      state.byConvId[action.payload.convId] = createInitialChatSessionState();
    },

    clearConversationSession(state, action: PayloadAction<{ convId: string }>) {
      delete state.byConvId[action.payload.convId];
    },
  },
});

export const chatSessionReducer = chatSessionSlice.reducer;
