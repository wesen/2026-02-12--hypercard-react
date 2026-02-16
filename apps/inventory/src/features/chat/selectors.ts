import type { ChatWindowMessage } from '@hypercard/engine';
import type { ChatConnectionStatus, TurnStats } from './chatSlice';

interface ChatStateShape {
  conversationId: string | null;
  connectionStatus: ChatConnectionStatus;
  isStreaming: boolean;
  messages: ChatWindowMessage[];
  suggestions: string[];
  lastError: string | null;
  modelName: string | null;
  currentTurnStats: TurnStats | null;
  streamStartTime: number | null;
  streamOutputTokens: number;
}

export interface ChatStateSlice {
  chat: ChatStateShape;
}

export const selectConversationId = (state: ChatStateSlice) => state.chat.conversationId;
export const selectConnectionStatus = (state: ChatStateSlice) => state.chat.connectionStatus;
export const selectIsStreaming = (state: ChatStateSlice) => state.chat.isStreaming;
export const selectMessages = (state: ChatStateSlice) => state.chat.messages;
export const selectSuggestions = (state: ChatStateSlice) => state.chat.suggestions;
export const selectLastError = (state: ChatStateSlice) => state.chat.lastError;
export const selectModelName = (state: ChatStateSlice) => state.chat.modelName;
export const selectCurrentTurnStats = (state: ChatStateSlice) => state.chat.currentTurnStats;
export const selectStreamStartTime = (state: ChatStateSlice) => state.chat.streamStartTime;
export const selectStreamOutputTokens = (state: ChatStateSlice) => state.chat.streamOutputTokens;
