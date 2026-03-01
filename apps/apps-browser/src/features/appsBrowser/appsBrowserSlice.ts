import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AppsBrowserUIState {
  selectedAppId?: string;
  selectedApiId?: string;
  selectedSchemaId?: string;
}

const initialState: AppsBrowserUIState = {};

export const appsBrowserSlice = createSlice({
  name: 'appsBrowser',
  initialState,
  reducers: {
    selectModule(state, action: PayloadAction<string | undefined>) {
      state.selectedAppId = action.payload;
      state.selectedApiId = undefined;
      state.selectedSchemaId = undefined;
    },
    selectApi(state, action: PayloadAction<string | undefined>) {
      state.selectedApiId = action.payload;
      state.selectedSchemaId = undefined;
    },
    selectSchema(state, action: PayloadAction<string | undefined>) {
      state.selectedSchemaId = action.payload;
    },
    clearSelection(state) {
      state.selectedAppId = undefined;
      state.selectedApiId = undefined;
      state.selectedSchemaId = undefined;
    },
  },
});

export const appsBrowserReducer = appsBrowserSlice.reducer;
export const { selectModule, selectApi, selectSchema, clearSelection } = appsBrowserSlice.actions;
