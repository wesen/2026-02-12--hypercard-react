import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ArtifactSource = 'widget' | 'card';

export interface ArtifactRecord {
  id: string;
  title: string;
  template: string;
  data: Record<string, unknown>;
  source: ArtifactSource;
  updatedAt: number;
}

interface ArtifactsState {
  byId: Record<string, ArtifactRecord>;
}

const initialState: ArtifactsState = {
  byId: {},
};

function cleanString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

const artifactsSlice = createSlice({
  name: 'artifacts',
  initialState,
  reducers: {
    upsertArtifact(
      state,
      action: PayloadAction<{
        id: string;
        title?: string;
        template?: string;
        data?: Record<string, unknown>;
        source: ArtifactSource;
        updatedAt?: number;
      }>,
    ) {
      const id = cleanString(action.payload.id);
      if (!id) {
        return;
      }
      const existing = state.byId[id];
      const title = cleanString(action.payload.title) ?? existing?.title ?? id;
      const template = cleanString(action.payload.template) ?? existing?.template ?? '';
      const data =
        action.payload.data !== undefined
          ? cleanObject(action.payload.data)
          : existing?.data ?? {};
      const source = action.payload.source ?? existing?.source ?? 'widget';
      const updatedAt = action.payload.updatedAt ?? Date.now();
      state.byId[id] = {
        id,
        title,
        template,
        data,
        source,
        updatedAt,
      };
    },
    clearArtifacts(state) {
      state.byId = {};
    },
  },
});

export const { upsertArtifact, clearArtifacts } = artifactsSlice.actions;
export const artifactsReducer = artifactsSlice.reducer;
