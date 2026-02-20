import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type TimelineEntity = {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;
  version?: number;
  props: unknown;
};

export type ConversationTimelineState = {
  byId: Record<string, TimelineEntity>;
  order: string[];
};

export type TimelineState = {
  byConvId: Record<string, ConversationTimelineState>;
};

interface ConversationEntityPayload {
  convId: string;
  entity: TimelineEntity;
}

interface RekeyEntityPayload {
  convId: string;
  fromId: string;
  toId: string;
}

interface ApplySnapshotPayload {
  convId: string;
  entities: TimelineEntity[];
}

const initialState: TimelineState = {
  byConvId: {},
};

function createConversationTimelineState(): ConversationTimelineState {
  return {
    byId: {},
    order: [],
  };
}

function ensureConversationTimeline(state: TimelineState, convId: string): ConversationTimelineState {
  if (!state.byConvId[convId]) {
    state.byConvId[convId] = createConversationTimelineState();
  }
  return state.byConvId[convId];
}

export const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    rekeyEntity(state, action: PayloadAction<RekeyEntityPayload>) {
      const { convId, fromId, toId } = action.payload;
      if (!fromId || !toId || fromId === toId) return;

      const conv = ensureConversationTimeline(state, convId);
      const from = conv.byId[fromId];
      if (!from) return;

      const existing = conv.byId[toId];
      if (existing) {
        conv.byId[toId] = {
          ...from,
          ...existing,
          id: toId,
          createdAt: existing.createdAt || from.createdAt,
          updatedAt: existing.updatedAt ?? from.updatedAt,
          version: existing.version ?? from.version,
          props: { ...(from.props as Record<string, unknown>), ...(existing.props as Record<string, unknown>) },
        };
      } else {
        conv.byId[toId] = { ...from, id: toId };
      }

      delete conv.byId[fromId];

      const fromIndex = conv.order.indexOf(fromId);
      if (fromIndex >= 0) {
        const toIndex = conv.order.indexOf(toId);
        if (toIndex >= 0) {
          conv.order.splice(fromIndex, 1);
        } else {
          conv.order[fromIndex] = toId;
        }
      }
    },

    addEntity(state, action: PayloadAction<ConversationEntityPayload>) {
      const { convId, entity } = action.payload;
      const conv = ensureConversationTimeline(state, convId);
      if (conv.byId[entity.id]) return;

      conv.byId[entity.id] = entity;
      conv.order.push(entity.id);
    },

    upsertEntity(state, action: PayloadAction<ConversationEntityPayload>) {
      const { convId, entity } = action.payload;
      const conv = ensureConversationTimeline(state, convId);
      const existing = conv.byId[entity.id];

      if (!existing) {
        conv.byId[entity.id] = entity;
        conv.order.push(entity.id);
        return;
      }

      const incomingVersion =
        typeof entity.version === 'number' && Number.isFinite(entity.version) ? entity.version : 0;
      const existingVersion =
        typeof existing.version === 'number' && Number.isFinite(existing.version) ? existing.version : 0;

      if (incomingVersion > 0) {
        if (incomingVersion < existingVersion) {
          return;
        }

        conv.byId[entity.id] = {
          ...existing,
          ...entity,
          createdAt: entity.createdAt || existing.createdAt,
          kind: entity.kind || existing.kind,
          version: incomingVersion,
          props: { ...(existing.props as Record<string, unknown>), ...(entity.props as Record<string, unknown>) },
        };
        return;
      }

      if (existingVersion > 0) {
        conv.byId[entity.id] = {
          ...existing,
          updatedAt: entity.updatedAt ?? existing.updatedAt,
          props: { ...(existing.props as Record<string, unknown>), ...(entity.props as Record<string, unknown>) },
        };
        return;
      }

      conv.byId[entity.id] = {
        ...existing,
        ...entity,
        createdAt: existing.createdAt,
        kind: entity.kind || existing.kind,
        props: { ...(existing.props as Record<string, unknown>), ...(entity.props as Record<string, unknown>) },
      };
    },

    applySnapshot(state, action: PayloadAction<ApplySnapshotPayload>) {
      const { convId, entities } = action.payload;
      const byId: Record<string, TimelineEntity> = {};
      const order: string[] = [];

      for (const entity of entities) {
        if (!entity?.id) continue;
        if (!byId[entity.id]) {
          order.push(entity.id);
        }
        byId[entity.id] = entity;
      }

      state.byConvId[convId] = { byId, order };
    },

    clearConversation(state, action: PayloadAction<{ convId: string }>) {
      delete state.byConvId[action.payload.convId];
    },
  },
});

export const timelineReducer = timelineSlice.reducer;
