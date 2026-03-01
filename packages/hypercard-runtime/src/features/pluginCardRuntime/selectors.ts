import type {
  PluginCardRuntimeState,
  PluginCardRuntimeStateSlice,
  PluginRuntimeSession,
} from './pluginCardRuntimeSlice';

const RUNTIME_GLOBAL_EXCLUDED_SLICES = new Set(['pluginCardRuntime', 'windowing', 'notifications', 'debug']);
const EMPTY_RUNTIME_OBJECT = Object.freeze({}) as Record<string, unknown>;
const projectedDomainsCache = new WeakMap<object, Record<string, unknown>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const selectPluginCardRuntimeState = (state: PluginCardRuntimeStateSlice): PluginCardRuntimeState =>
  state.pluginCardRuntime;

export const selectRuntimeSession = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string
): PluginRuntimeSession | undefined => state.pluginCardRuntime.sessions[sessionId];

export const selectRuntimeSessionState = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string
): Record<string, unknown> => state.pluginCardRuntime.sessions[sessionId]?.sessionState ?? EMPTY_RUNTIME_OBJECT;

export const selectRuntimeCardState = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string,
  cardId: string
): Record<string, unknown> => state.pluginCardRuntime.sessions[sessionId]?.cardState[cardId] ?? EMPTY_RUNTIME_OBJECT;

export const selectRuntimeTimeline = (state: PluginCardRuntimeStateSlice) => state.pluginCardRuntime.timeline;

export const selectPendingDomainIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingDomainIntents;

export const selectPendingSystemIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingSystemIntents;

export const selectPendingNavIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingNavIntents;

/**
 * Returns app/domain slices that should be exposed to plugin runtime as `globalState.domains`.
 * The result is intended to be consumed with `useSelector(..., shallowEqual)` so callers
 * rerender only when domain slice references change.
 */
export const selectProjectedRuntimeDomains = (state: unknown): Record<string, unknown> => {
  if (!isRecord(state)) {
    return EMPTY_RUNTIME_OBJECT;
  }

  const cached = projectedDomainsCache.get(state);
  if (cached) {
    return cached;
  }
  const projected = Object.fromEntries(
    Object.entries(state).filter(([key]) => !RUNTIME_GLOBAL_EXCLUDED_SLICES.has(key)),
  );
  projectedDomainsCache.set(state, projected);
  return projected;
};
