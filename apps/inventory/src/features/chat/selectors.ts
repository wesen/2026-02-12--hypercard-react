import type { TimelineState } from '@hypercard/engine';
import type { ConversationState } from './chatSlice';

export interface ChatStateSlice {
  chat: {
    conversations: Record<string, ConversationState>;
  };
  timeline?: TimelineState;
}

export const selectConversationIds = (state: ChatStateSlice): string[] =>
  Object.keys(state.chat.conversations);
