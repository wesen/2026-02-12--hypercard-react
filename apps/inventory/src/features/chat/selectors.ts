import type { ChatMessage } from '@hypercard/engine';

export interface ChatStateSlice { chat: { messages: ChatMessage[] } }

export const selectMessages = (state: ChatStateSlice) => state.chat.messages;
