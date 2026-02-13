import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type LayoutMode = 'split' | 'drawer' | 'cardChat';

export interface NavEntry {
  card: string;
  param?: string;
}

export interface NavigationState {
  layout: LayoutMode;
  stack: NavEntry[];
}

const initialState: NavigationState = {
  layout: 'split',
  stack: [{ card: 'home' }],
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    navigate(state, action: PayloadAction<{ card: string; paramValue?: string }>) {
      state.stack.push({ card: action.payload.card, param: action.payload.paramValue });
    },
    goBack(state) {
      if (state.stack.length > 1) state.stack.pop();
    },
    setLayout(state, action: PayloadAction<LayoutMode>) {
      state.layout = action.payload;
      state.stack = [{ card: 'home' }];
    },
  },
});

export const { navigate, goBack, setLayout } = navigationSlice.actions;
export const navigationReducer = navigationSlice.reducer;
