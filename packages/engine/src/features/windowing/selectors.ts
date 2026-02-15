import type { NavEntry, WindowInstance, WindowingState } from './types';

/** Store shape for selectors — just needs the windowing slice. */
export interface WindowingStateSlice {
  windowing: WindowingState;
}

// ── Desktop state ──

export const selectFocusedWindowId = (state: WindowingStateSlice) => state.windowing.desktop.focusedWindowId;

export const selectActiveMenuId = (state: WindowingStateSlice) => state.windowing.desktop.activeMenuId;

export const selectSelectedIconId = (state: WindowingStateSlice) => state.windowing.desktop.selectedIconId;

// ── Windows ──

/** All windows in insertion order. */
export const selectWindowsInOrder = (state: WindowingStateSlice): WindowInstance[] =>
  state.windowing.order.map((id) => state.windowing.windows[id]).filter(Boolean);

/** All windows sorted by z-index (paint order, lowest first). */
export const selectWindowsByZ = (state: WindowingStateSlice): WindowInstance[] =>
  [...selectWindowsInOrder(state)].sort((a, b) => a.z - b.z);

/** The currently focused window, or undefined if none. */
export const selectFocusedWindow = (state: WindowingStateSlice): WindowInstance | undefined => {
  const id = state.windowing.desktop.focusedWindowId;
  return id ? state.windowing.windows[id] : undefined;
};

/** Get a specific window by id. */
export const selectWindowById = (state: WindowingStateSlice, windowId: string): WindowInstance | undefined =>
  state.windowing.windows[windowId];

/** Number of open windows. */
export const selectWindowCount = (state: WindowingStateSlice): number => state.windowing.order.length;

// ── Session navigation ──

/** Current nav entry for a session (top of stack). */
export const selectSessionCurrentNav = (state: WindowingStateSlice, sessionId: string): NavEntry | undefined => {
  const session = state.windowing.sessions[sessionId];
  if (!session || session.nav.length === 0) return undefined;
  return session.nav[session.nav.length - 1];
};

/** Nav depth for a session. */
export const selectSessionNavDepth = (state: WindowingStateSlice, sessionId: string): number => {
  const session = state.windowing.sessions[sessionId];
  return session?.nav.length ?? 0;
};
