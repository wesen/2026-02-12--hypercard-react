import type { LayoutMode, NavEntry } from './navigationSlice';

// Generic selectors that work with any store shape containing navigation
export interface NavigationStateSlice {
  navigation: { layout: LayoutMode; stack: NavEntry[] };
}

export const selectCurrentNav = (state: NavigationStateSlice) =>
  state.navigation.stack[state.navigation.stack.length - 1];

export const selectCurrentCardId = (state: NavigationStateSlice) => selectCurrentNav(state).card;

export const selectCurrentParam = (state: NavigationStateSlice) => selectCurrentNav(state).param;

export const selectNavDepth = (state: NavigationStateSlice) => state.navigation.stack.length;

export const selectLayout = (state: NavigationStateSlice) => state.navigation.layout;
