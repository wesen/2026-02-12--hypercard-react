import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatProfileListItem } from '../runtime/profileTypes';

export interface ScopedProfileSelection {
  profile: string | null;
}

export interface ChatProfilesState {
  availableProfiles: ChatProfileListItem[];
  selectedProfile: string | null;
  selectedByScope: Record<string, ScopedProfileSelection>;
  loading: boolean;
  error: string | null;
}

const initialState: ChatProfilesState = {
  availableProfiles: [],
  selectedProfile: null,
  selectedByScope: {},
  loading: false,
  error: null,
};

export const chatProfilesSlice = createSlice({
  name: 'chatProfiles',
  initialState,
  reducers: {
    setAvailableProfiles(state, action: PayloadAction<ChatProfileListItem[]>) {
      state.availableProfiles = action.payload;
    },
    setProfileLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setProfileError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.loading = false;
      }
    },
    setSelectedProfile(
      state,
      action: PayloadAction<{ profile: string | null; scopeKey?: string | null }>
    ) {
      const scopeKey = String(action.payload.scopeKey ?? '').trim();
      if (scopeKey) {
        state.selectedByScope[scopeKey] = {
          profile: action.payload.profile,
        };
        return;
      }
      state.selectedProfile = action.payload.profile;
    },
    clearSelectedProfile(state) {
      state.selectedProfile = null;
      state.selectedByScope = {};
    },
    clearScopedProfile(state, action: PayloadAction<{ scopeKey: string }>) {
      const scopeKey = String(action.payload.scopeKey ?? '').trim();
      if (!scopeKey) {
        return;
      }
      delete state.selectedByScope[scopeKey];
    },
  },
});

export const chatProfilesReducer = chatProfilesSlice.reducer;
