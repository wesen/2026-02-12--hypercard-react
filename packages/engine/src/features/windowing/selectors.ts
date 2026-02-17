import { createSelector } from '@reduxjs/toolkit';
import type { NavEntry, WindowBounds, WindowInstance, WindowingState } from './types';

/** Store shape for selectors — just needs the windowing slice. */
export interface WindowingStateSlice {
  windowing: WindowingState;
}

const selectWindowingState = (state: WindowingStateSlice): WindowingState => state.windowing;

const selectWindowOrder = (state: WindowingStateSlice) => selectWindowingState(state).order;

const selectWindowMap = (state: WindowingStateSlice) => selectWindowingState(state).windows;

const selectWindowInteraction = (state: WindowingStateSlice) => selectWindowingState(state).interaction;

// ── Desktop state ──

export const selectFocusedWindowId = (state: WindowingStateSlice) => state.windowing.desktop.focusedWindowId;

export const selectActiveMenuId = (state: WindowingStateSlice) => state.windowing.desktop.activeMenuId;

export const selectSelectedIconId = (state: WindowingStateSlice) => state.windowing.desktop.selectedIconId;

// ── Windows ──

/** All windows in insertion order. */
export const selectWindowsInOrder = createSelector(
  [selectWindowOrder, selectWindowMap],
  (order, windows): WindowInstance[] => order.map((id) => windows[id]).filter(Boolean),
);

/** All windows sorted by z-index (paint order, lowest first). */
export const selectWindowsByZ = createSelector([selectWindowsInOrder], (windows): WindowInstance[] =>
  [...windows].sort((a, b) => a.z - b.z),
);

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

/** Active interaction window id for W-E channel, if any. */
export const selectActiveInteractionId = (state: WindowingStateSlice): string | null =>
  selectWindowInteraction(state).activeWindowId;

/** Get draft bounds by window id from W-E interaction channel. */
export const selectInteractionDraftById = (
  state: WindowingStateSlice,
  windowId: string,
): WindowBounds | undefined => selectWindowInteraction(state).draftsById[windowId];

/** Effective bounds for rendering: interaction draft (if present) else durable bounds. */
export const selectEffectiveWindowBoundsById = (
  state: WindowingStateSlice,
  windowId: string,
): WindowBounds | undefined => {
  const draft = selectInteractionDraftById(state, windowId);
  if (draft) return draft;
  return selectWindowById(state, windowId)?.bounds;
};

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
