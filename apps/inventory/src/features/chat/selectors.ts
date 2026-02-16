import type { ChatMessage } from '@hypercard/engine';
import type { ChatConnectionStatus } from './chatSlice';

interface ChatStateShape {
  conversationId: string | null;
  connectionStatus: ChatConnectionStatus;
  isStreaming: boolean;
  messages: ChatMessage[];
  lastError: string | null;
}

export interface ChatStateSlice {
  chat: ChatStateShape;
}

export const selectConversationId = (state: ChatStateSlice) => state.chat.conversationId;
export const selectConnectionStatus = (state: ChatStateSlice) => state.chat.connectionStatus;
export const selectIsStreaming = (state: ChatStateSlice) => state.chat.isStreaming;
export const selectMessages = (state: ChatStateSlice) => state.chat.messages;
export const selectLastError = (state: ChatStateSlice) => state.chat.lastError;
