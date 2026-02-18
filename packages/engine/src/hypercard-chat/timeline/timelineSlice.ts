import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConversationTimeline, TimelineEntity, TimelineState } from './types';
import { compareVersions, normalizeVersion } from './version';

const initialState: TimelineState = {
  conversations: {},
};

function ensureConversation(state: TimelineState, convId: string): ConversationTimeline {
  if (!state.conversations[convId]) {
    state.conversations[convId] = {
      byId: {},
      order: [],
    };
  }
  return state.conversations[convId];
}

function normalizeEntity(entity: TimelineEntity): TimelineEntity {
  const normalizedVersion = normalizeVersion(entity.version);
  return {
    ...entity,
    version: normalizedVersion,
  };
}

export const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    clearAll(state) {
      state.conversations = {};
    },
    clearConversation(state, action: PayloadAction<{ convId: string }>) {
      delete state.conversations[action.payload.convId];
    },
    addEntity(state, action: PayloadAction<{ convId: string; entity: TimelineEntity }>) {
      const { convId } = action.payload;
      const entity = normalizeEntity(action.payload.entity);
      const conversation = ensureConversation(state, convId);

      if (conversation.byId[entity.id]) return;
      conversation.byId[entity.id] = entity;
      conversation.order.push(entity.id);
    },
    upsertEntity(state, action: PayloadAction<{ convId: string; entity: TimelineEntity }>) {
      const { convId } = action.payload;
      const incoming = normalizeEntity(action.payload.entity);
      const conversation = ensureConversation(state, convId);
      const existing = conversation.byId[incoming.id];

      if (!existing) {
        conversation.byId[incoming.id] = incoming;
        conversation.order.push(incoming.id);
        return;
      }

      const versionCmp = compareVersions(incoming.version, existing.version);
      if (existing.version && incoming.version && versionCmp < 0) {
        return;
      }

      if (existing.version && !incoming.version) {
        conversation.byId[incoming.id] = {
          ...existing,
          updatedAt: incoming.updatedAt ?? existing.updatedAt,
          props: { ...(existing.props ?? {}), ...(incoming.props ?? {}) },
        };
        return;
      }

      conversation.byId[incoming.id] = {
        ...existing,
        ...incoming,
        createdAt: incoming.createdAt || existing.createdAt,
        kind: incoming.kind || existing.kind,
        version: incoming.version ?? existing.version,
        props: { ...(existing.props ?? {}), ...(incoming.props ?? {}) },
      };
    },
    rekeyEntity(
      state,
      action: PayloadAction<{ convId: string; fromId: string; toId: string }>,
    ) {
      const { convId, fromId, toId } = action.payload;
      if (!fromId || !toId || fromId === toId) return;
      const conversation = ensureConversation(state, convId);
      const from = conversation.byId[fromId];
      if (!from) return;

      const existing = conversation.byId[toId];
      if (existing) {
        conversation.byId[toId] = {
          ...from,
          ...existing,
          id: toId,
          createdAt: existing.createdAt || from.createdAt,
          updatedAt: existing.updatedAt ?? from.updatedAt,
          version: existing.version ?? from.version,
          props: { ...(from.props ?? {}), ...(existing.props ?? {}) },
        };
      } else {
        conversation.byId[toId] = { ...from, id: toId };
      }

      delete conversation.byId[fromId];

      const fromIdx = conversation.order.indexOf(fromId);
      if (fromIdx >= 0) {
        const toIdx = conversation.order.indexOf(toId);
        if (toIdx >= 0) {
          conversation.order.splice(fromIdx, 1);
        } else {
          conversation.order[fromIdx] = toId;
        }
      }
    },
  },
});

export const {
  clearAll,
  clearConversation,
  addEntity,
  upsertEntity,
  rekeyEntity,
} = timelineSlice.actions;

export const timelineReducer = timelineSlice.reducer;
