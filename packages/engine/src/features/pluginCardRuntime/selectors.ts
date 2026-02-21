import type {
  PluginCardRuntimeState,
  PluginCardRuntimeStateSlice,
  PluginRuntimeSession,
} from './pluginCardRuntimeSlice';

export const selectPluginCardRuntimeState = (state: PluginCardRuntimeStateSlice): PluginCardRuntimeState =>
  state.pluginCardRuntime;

export const selectRuntimeSession = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string
): PluginRuntimeSession | undefined => state.pluginCardRuntime.sessions[sessionId];

export const selectRuntimeSessionState = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string
): Record<string, unknown> => state.pluginCardRuntime.sessions[sessionId]?.sessionState ?? {};

export const selectRuntimeCardState = (
  state: PluginCardRuntimeStateSlice,
  sessionId: string,
  cardId: string
): Record<string, unknown> => state.pluginCardRuntime.sessions[sessionId]?.cardState[cardId] ?? {};

export const selectRuntimeTimeline = (state: PluginCardRuntimeStateSlice) => state.pluginCardRuntime.timeline;

export const selectPendingDomainIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingDomainIntents;

export const selectPendingSystemIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingSystemIntents;

export const selectPendingNavIntents = (state: PluginCardRuntimeStateSlice) =>
  state.pluginCardRuntime.pendingNavIntents;
