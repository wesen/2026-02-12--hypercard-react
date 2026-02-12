import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '@hypercard/engine';

interface ChatState { messages: ChatMessage[] }

const initialState: ChatState = { messages: [] };

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages.push(...action.payload);
    },
    resetChat(state) {
      state.messages = [];
    },
  },
});

export const { addMessages, resetChat } = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
