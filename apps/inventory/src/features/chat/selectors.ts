import type { TimelineState } from '@hypercard/engine';
import type {
  ChatConnectionStatus,
  ConversationState,
  TurnStats,
} from './chatSlice';

export interface ChatStateSlice {
  chat: {
    conversations: Record<string, ConversationState>;
  };
  timeline?: TimelineState;
}

const EMPTY_SUGGESTIONS: string[] = [];

function getConv(state: ChatStateSlice, convId: string): ConversationState | undefined {
  return state.chat.conversations[convId];
}

export const selectConnectionStatus = (state: ChatStateSlice, convId: string): ChatConnectionStatus =>
  getConv(state, convId)?.connectionStatus ?? 'idle';

export const selectSuggestions = (state: ChatStateSlice, convId: string): string[] =>
  getConv(state, convId)?.suggestions ?? EMPTY_SUGGESTIONS;

export const selectLastError = (state: ChatStateSlice, convId: string): string | null =>
  getConv(state, convId)?.lastError ?? null;

export const selectModelName = (state: ChatStateSlice, convId: string): string | null =>
  getConv(state, convId)?.modelName ?? null;

export const selectCurrentTurnStats = (state: ChatStateSlice, convId: string): TurnStats | null =>
  getConv(state, convId)?.currentTurnStats ?? null;

export const selectStreamStartTime = (state: ChatStateSlice, convId: string): number | null =>
  getConv(state, convId)?.streamStartTime ?? null;

export const selectStreamOutputTokens = (state: ChatStateSlice, convId: string): number =>
  getConv(state, convId)?.streamOutputTokens ?? 0;

export const selectConversationIds = (state: ChatStateSlice): string[] =>
  Object.keys(state.chat.conversations);
