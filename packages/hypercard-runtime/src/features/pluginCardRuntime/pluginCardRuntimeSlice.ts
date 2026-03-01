import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import type { RuntimeIntent } from '../../plugin-runtime/contracts';
import {
  authorizeDomainIntent,
  authorizeSystemIntent,
  resolveCapabilityPolicy,
  type CapabilityPolicy,
} from './capabilityPolicy';

export type DispatchOutcome = 'applied' | 'denied' | 'ignored';

export type RuntimeSessionStatus = 'loading' | 'ready' | 'error';

export interface RuntimeTimelineEntry {
  id: string;
  timestamp: string;
  sessionId: string;
  cardId: string;
  scope: RuntimeIntent['scope'];
  actionType?: string;
  domain?: string;
  command?: string;
  payload?: unknown;
  outcome: DispatchOutcome;
  reason: string | null;
}

export interface DomainIntentEnvelope {
  id: string;
  timestamp: string;
  sessionId: string;
  cardId: string;
  domain: string;
  actionType: string;
  payload?: unknown;
}

export interface SystemIntentEnvelope {
  id: string;
  timestamp: string;
  sessionId: string;
  cardId: string;
  command: string;
  payload?: unknown;
}

export interface PluginRuntimeSession {
  stackId: string;
  status: RuntimeSessionStatus;
  error: string | null;
  sessionState: Record<string, unknown>;
  cardState: Record<string, Record<string, unknown>>;
  capabilities: CapabilityPolicy;
}

export interface PluginCardRuntimeState {
  sessions: Record<string, PluginRuntimeSession>;
  timeline: RuntimeTimelineEntry[];
  pendingDomainIntents: DomainIntentEnvelope[];
  pendingSystemIntents: SystemIntentEnvelope[];
  pendingNavIntents: SystemIntentEnvelope[];
}

export interface PluginCardRuntimeStateSlice {
  pluginCardRuntime: PluginCardRuntimeState;
}

interface RegisterSessionPayload {
  sessionId: string;
  stackId: string;
  initialSessionState?: Record<string, unknown>;
  initialCardState?: Record<string, Record<string, unknown>>;
  capabilities?: Partial<CapabilityPolicy>;
  status?: RuntimeSessionStatus;
}

interface RemoveSessionPayload {
  sessionId: string;
}

interface SetSessionStatusPayload {
  sessionId: string;
  status: RuntimeSessionStatus;
  error?: string | null;
}

interface IngestIntentPayload {
  id: string;
  timestamp: string;
  sessionId: string;
  cardId: string;
  intent: RuntimeIntent;
}

const MAX_TIMELINE_ENTRIES = 300;

const initialState: PluginCardRuntimeState = {
  sessions: {},
  timeline: [],
  pendingDomainIntents: [],
  pendingSystemIntents: [],
  pendingNavIntents: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepSet(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.').filter(Boolean);
  if (keys.length === 0) return;

  let current: Record<string, unknown> = target;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const nextValue = current[key];
    if (!isRecord(nextValue)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

function clearObject(target: Record<string, unknown>) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
}

function applyStateAction(
  target: Record<string, unknown>,
  actionType: string,
  payload: unknown
): { outcome: DispatchOutcome; reason: string | null } {
  if (actionType === 'patch') {
    if (!isRecord(payload)) {
      return { outcome: 'ignored', reason: 'patch_requires_object_payload' };
    }

    Object.assign(target, payload);
    return { outcome: 'applied', reason: null };
  }

  if (actionType === 'set') {
    if (!isRecord(payload) || typeof payload.path !== 'string') {
      return { outcome: 'ignored', reason: 'set_requires_{path,value}_payload' };
    }

    deepSet(target, payload.path, payload.value);
    return { outcome: 'applied', reason: null };
  }

  if (actionType === 'reset') {
    clearObject(target);
    return { outcome: 'applied', reason: null };
  }

  return { outcome: 'ignored', reason: `unsupported_local_action:${actionType}` };
}

function appendTimeline(
  state: PluginCardRuntimeState,
  payload: IngestIntentPayload,
  outcome: DispatchOutcome,
  reason: string | null
) {
  const base: RuntimeTimelineEntry = {
    id: payload.id,
    timestamp: payload.timestamp,
    sessionId: payload.sessionId,
    cardId: payload.cardId,
    scope: payload.intent.scope,
    payload: 'payload' in payload.intent ? payload.intent.payload : undefined,
    outcome,
    reason,
  };

  if (payload.intent.scope === 'card' || payload.intent.scope === 'session' || payload.intent.scope === 'domain') {
    base.actionType = payload.intent.actionType;
  }

  if (payload.intent.scope === 'domain') {
    base.domain = payload.intent.domain;
  }

  if (payload.intent.scope === 'system') {
    base.command = payload.intent.command;
  }

  state.timeline.push(base);

  if (state.timeline.length > MAX_TIMELINE_ENTRIES) {
    state.timeline.splice(0, state.timeline.length - MAX_TIMELINE_ENTRIES);
  }
}

const pluginCardRuntimeSlice = createSlice({
  name: 'pluginCardRuntime',
  initialState,
  reducers: {
    registerRuntimeSession(state, action: PayloadAction<RegisterSessionPayload>) {
      const payload = action.payload;

      state.sessions[payload.sessionId] = {
        stackId: payload.stackId,
        status: payload.status ?? 'loading',
        error: null,
        sessionState: payload.initialSessionState ? { ...payload.initialSessionState } : {},
        cardState: payload.initialCardState ? { ...payload.initialCardState } : {},
        capabilities: resolveCapabilityPolicy(payload.capabilities),
      };
    },

    removeRuntimeSession(state, action: PayloadAction<RemoveSessionPayload>) {
      const { sessionId } = action.payload;
      delete state.sessions[sessionId];

      state.pendingDomainIntents = state.pendingDomainIntents.filter((intent) => intent.sessionId !== sessionId);
      state.pendingSystemIntents = state.pendingSystemIntents.filter((intent) => intent.sessionId !== sessionId);
      state.pendingNavIntents = state.pendingNavIntents.filter((intent) => intent.sessionId !== sessionId);
    },

    setRuntimeSessionStatus(state, action: PayloadAction<SetSessionStatusPayload>) {
      const session = state.sessions[action.payload.sessionId];
      if (!session) {
        return;
      }

      session.status = action.payload.status;
      session.error = action.payload.error ?? null;
    },

    ingestRuntimeIntent: {
      reducer(state, action: PayloadAction<IngestIntentPayload>) {
        const payload = action.payload;
        const session = state.sessions[payload.sessionId];
        if (!session) {
          appendTimeline(state, payload, 'denied', `missing_session:${payload.sessionId}`);
          return;
        }

        if (payload.intent.scope === 'card') {
          if (!session.cardState[payload.cardId]) {
            session.cardState[payload.cardId] = {};
          }

          const result = applyStateAction(
            session.cardState[payload.cardId],
            payload.intent.actionType,
            payload.intent.payload
          );
          appendTimeline(state, payload, result.outcome, result.reason);
          return;
        }

        if (payload.intent.scope === 'session') {
          const result = applyStateAction(
            session.sessionState,
            payload.intent.actionType,
            payload.intent.payload
          );
          appendTimeline(state, payload, result.outcome, result.reason);
          return;
        }

        if (payload.intent.scope === 'domain') {
          const decision = authorizeDomainIntent(session.capabilities, payload.intent.domain);
          if (!decision.allowed) {
            appendTimeline(state, payload, 'denied', decision.reason);
            return;
          }

          state.pendingDomainIntents.push({
            id: payload.id,
            timestamp: payload.timestamp,
            sessionId: payload.sessionId,
            cardId: payload.cardId,
            domain: payload.intent.domain,
            actionType: payload.intent.actionType,
            payload: payload.intent.payload,
          });

          appendTimeline(state, payload, 'applied', null);
          return;
        }

        const decision = authorizeSystemIntent(session.capabilities, payload.intent.command);
        if (!decision.allowed) {
          appendTimeline(state, payload, 'denied', decision.reason);
          return;
        }

        const systemIntent: SystemIntentEnvelope = {
          id: payload.id,
          timestamp: payload.timestamp,
          sessionId: payload.sessionId,
          cardId: payload.cardId,
          command: payload.intent.command,
          payload: payload.intent.payload,
        };

        state.pendingSystemIntents.push(systemIntent);
        if (payload.intent.command.startsWith('nav.')) {
          state.pendingNavIntents.push(systemIntent);
        }

        appendTimeline(state, payload, 'applied', null);
      },
      prepare(payload: Omit<IngestIntentPayload, 'id' | 'timestamp'> & { timestamp?: string }) {
        return {
          payload: {
            ...payload,
            id: nanoid(),
            timestamp: payload.timestamp ?? new Date().toISOString(),
          },
        };
      },
    },

    dequeuePendingDomainIntent(state, action: PayloadAction<{ id?: string } | undefined>) {
      const id = action.payload?.id;
      if (!id) {
        state.pendingDomainIntents.shift();
        return;
      }

      state.pendingDomainIntents = state.pendingDomainIntents.filter((intent) => intent.id !== id);
    },

    dequeuePendingSystemIntent(state, action: PayloadAction<{ id?: string } | undefined>) {
      const id = action.payload?.id;
      if (!id) {
        state.pendingSystemIntents.shift();
        return;
      }

      state.pendingSystemIntents = state.pendingSystemIntents.filter((intent) => intent.id !== id);
    },

    dequeuePendingNavIntent(state, action: PayloadAction<{ id?: string } | undefined>) {
      const id = action.payload?.id;
      if (!id) {
        state.pendingNavIntents.shift();
        return;
      }

      state.pendingNavIntents = state.pendingNavIntents.filter((intent) => intent.id !== id);
    },

    clearRuntimeTimeline(state) {
      state.timeline = [];
    },
  },
});

export const {
  clearRuntimeTimeline,
  dequeuePendingDomainIntent,
  dequeuePendingNavIntent,
  dequeuePendingSystemIntent,
  ingestRuntimeIntent,
  registerRuntimeSession,
  removeRuntimeSession,
  setRuntimeSessionStatus,
} = pluginCardRuntimeSlice.actions;

export const pluginCardRuntimeReducer = pluginCardRuntimeSlice.reducer;
