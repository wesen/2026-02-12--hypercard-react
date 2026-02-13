import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CardScopedState, LocalScope } from './types';

interface RuntimeCardState {
  type: string;
  backgroundId?: string;
  state: Record<string, unknown>;
}

interface RuntimeStackState {
  state: Record<string, unknown>;
  backgrounds: Record<string, { state: Record<string, unknown> }>;
  cardTypes: Record<string, { state: Record<string, unknown> }>;
  cards: Record<string, RuntimeCardState>;
}

export interface HypercardRuntimeState {
  global: Record<string, unknown>;
  stacks: Record<string, RuntimeStackState>;
}

const initialState: HypercardRuntimeState = {
  global: {},
  stacks: {},
};

interface RuntimeTarget {
  stackId: string;
  cardId: string;
  cardType: string;
  backgroundId?: string;
}

interface EnsureCardRuntimePayload extends RuntimeTarget {
  defaults?: CardScopedState;
}

interface ScopedStatePayload extends RuntimeTarget {
  scope: LocalScope;
}

interface SetScopedStatePayload extends ScopedStatePayload {
  path: string;
  value: unknown;
}

interface PatchScopedStatePayload extends ScopedStatePayload {
  patch: Record<string, unknown>;
}

function ensureStack(state: HypercardRuntimeState, stackId: string): RuntimeStackState {
  if (!state.stacks[stackId]) {
    state.stacks[stackId] = {
      state: {},
      backgrounds: {},
      cardTypes: {},
      cards: {},
    };
  }
  return state.stacks[stackId];
}

function ensureCard(state: HypercardRuntimeState, payload: RuntimeTarget): RuntimeCardState {
  const stack = ensureStack(state, payload.stackId);

  if (!stack.cardTypes[payload.cardType]) {
    stack.cardTypes[payload.cardType] = { state: {} };
  }

  if (payload.backgroundId && !stack.backgrounds[payload.backgroundId]) {
    stack.backgrounds[payload.backgroundId] = { state: {} };
  }

  if (!stack.cards[payload.cardId]) {
    stack.cards[payload.cardId] = {
      type: payload.cardType,
      backgroundId: payload.backgroundId,
      state: {},
    };
  }

  const card = stack.cards[payload.cardId];
  card.type = payload.cardType;
  card.backgroundId = payload.backgroundId;

  return card;
}

function deepSet(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.').filter(Boolean);
  if (keys.length === 0) return;

  let cur: Record<string, unknown> = target;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const next = cur[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}

function getScopeStateRef(state: HypercardRuntimeState, payload: ScopedStatePayload): Record<string, unknown> {
  const stack = ensureStack(state, payload.stackId);
  const card = ensureCard(state, payload);

  switch (payload.scope) {
    case 'global':
      return state.global;
    case 'stack':
      return stack.state;
    case 'background': {
      const bgId = payload.backgroundId ?? card.backgroundId ?? 'default';
      if (!stack.backgrounds[bgId]) stack.backgrounds[bgId] = { state: {} };
      return stack.backgrounds[bgId].state;
    }
    case 'cardType':
      if (!stack.cardTypes[payload.cardType]) stack.cardTypes[payload.cardType] = { state: {} };
      return stack.cardTypes[payload.cardType].state;
    default:
      return card.state;
  }
}

const runtimeSlice = createSlice({
  name: 'hypercardRuntime',
  initialState,
  reducers: {
    ensureCardRuntime(state, action: PayloadAction<EnsureCardRuntimePayload>) {
      const payload = action.payload;
      ensureCard(state, payload);
      const stack = ensureStack(state, payload.stackId);
      const card = stack.cards[payload.cardId];

      const defaults = payload.defaults;
      if (!defaults) return;

      if (defaults.global) {
        state.global = { ...defaults.global, ...state.global };
      }
      if (defaults.stack) {
        stack.state = { ...defaults.stack, ...stack.state };
      }
      if (defaults.background) {
        const bgId = payload.backgroundId ?? card.backgroundId ?? 'default';
        if (!stack.backgrounds[bgId]) stack.backgrounds[bgId] = { state: {} };
        stack.backgrounds[bgId].state = { ...defaults.background, ...stack.backgrounds[bgId].state };
      }
      if (defaults.cardType) {
        if (!stack.cardTypes[payload.cardType]) stack.cardTypes[payload.cardType] = { state: {} };
        stack.cardTypes[payload.cardType].state = {
          ...defaults.cardType,
          ...stack.cardTypes[payload.cardType].state,
        };
      }
      if (defaults.card) {
        card.state = { ...defaults.card, ...card.state };
      }
    },

    setScopedState(state, action: PayloadAction<SetScopedStatePayload>) {
      const target = getScopeStateRef(state, action.payload);
      deepSet(target, action.payload.path, action.payload.value);
    },

    patchScopedState(state, action: PayloadAction<PatchScopedStatePayload>) {
      const target = getScopeStateRef(state, action.payload);
      Object.assign(target, action.payload.patch);
    },

    resetScopedState(state, action: PayloadAction<ScopedStatePayload>) {
      const payload = action.payload;
      const stack = ensureStack(state, payload.stackId);
      const card = ensureCard(state, payload);

      switch (payload.scope) {
        case 'global':
          state.global = {};
          return;
        case 'stack':
          stack.state = {};
          return;
        case 'background': {
          const bgId = payload.backgroundId ?? card.backgroundId ?? 'default';
          if (!stack.backgrounds[bgId]) stack.backgrounds[bgId] = { state: {} };
          stack.backgrounds[bgId].state = {};
          return;
        }
        case 'cardType':
          if (!stack.cardTypes[payload.cardType]) stack.cardTypes[payload.cardType] = { state: {} };
          stack.cardTypes[payload.cardType].state = {};
          return;
        default:
          card.state = {};
      }
    },
  },
});

export const { ensureCardRuntime, setScopedState, patchScopedState, resetScopedState } = runtimeSlice.actions;

export const hypercardRuntimeReducer = runtimeSlice.reducer;

export interface HypercardRuntimeStateSlice {
  hypercardRuntime: HypercardRuntimeState;
}

export interface ScopedLookup extends RuntimeTarget {
  scope: LocalScope;
}

export function selectScopedState(root: HypercardRuntimeStateSlice, lookup: ScopedLookup): Record<string, unknown> {
  const runtime = root.hypercardRuntime;
  const stack = runtime.stacks[lookup.stackId];
  if (!stack) return {};

  const card = stack.cards[lookup.cardId];

  switch (lookup.scope) {
    case 'global':
      return runtime.global;
    case 'stack':
      return stack.state;
    case 'background': {
      const bgId = lookup.backgroundId ?? card?.backgroundId;
      return bgId ? (stack.backgrounds[bgId]?.state ?? {}) : {};
    }
    case 'cardType':
      return stack.cardTypes[lookup.cardType]?.state ?? {};
    default:
      return card?.state ?? {};
  }
}

export function selectMergedScopedState(
  root: HypercardRuntimeStateSlice,
  lookup: RuntimeTarget,
): Record<string, unknown> {
  const runtime = root.hypercardRuntime;
  const stack = runtime.stacks[lookup.stackId];
  if (!stack) return {};

  const card = stack.cards[lookup.cardId];
  const bgId = lookup.backgroundId ?? card?.backgroundId;

  return {
    ...runtime.global,
    ...stack.state,
    ...(bgId ? (stack.backgrounds[bgId]?.state ?? {}) : {}),
    ...(stack.cardTypes[lookup.cardType]?.state ?? {}),
    ...(card?.state ?? {}),
  };
}
