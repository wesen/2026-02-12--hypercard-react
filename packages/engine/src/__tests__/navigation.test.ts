import { describe, expect, it } from 'vitest';
import {
  goBack,
  initializeNavigation,
  navigate,
  navigationReducer,
  resetNavigation,
  setLayout,
} from '../features/navigation/navigationSlice';

describe('navigationReducer', () => {
  const defaultState = navigationReducer(undefined, { type: '@@INIT' });

  it('initializes with default home card', () => {
    expect(defaultState.homeCard).toBe('home');
    expect(defaultState.stack).toEqual([{ card: 'home' }]);
  });

  describe('initializeNavigation', () => {
    it('sets homeCard and resets stack', () => {
      const state = navigationReducer(defaultState, initializeNavigation({ homeCard: 'dashboard' }));
      expect(state.homeCard).toBe('dashboard');
      expect(state.stack).toEqual([{ card: 'dashboard' }]);
    });
  });

  describe('navigate', () => {
    it('pushes a new card', () => {
      const state = navigationReducer(defaultState, navigate({ card: 'browse' }));
      expect(state.stack).toEqual([{ card: 'home' }, { card: 'browse', param: undefined }]);
    });

    it('pushes a card with param', () => {
      const state = navigationReducer(defaultState, navigate({ card: 'detail', paramValue: 'item-1' }));
      expect(state.stack).toEqual([{ card: 'home' }, { card: 'detail', param: 'item-1' }]);
    });
  });

  describe('goBack', () => {
    it('pops the top entry', () => {
      let state = navigationReducer(defaultState, navigate({ card: 'browse' }));
      state = navigationReducer(state, goBack());
      expect(state.stack).toEqual([{ card: 'home' }]);
    });

    it('does not pop the last entry', () => {
      const state = navigationReducer(defaultState, goBack());
      expect(state.stack).toEqual([{ card: 'home' }]);
    });
  });

  describe('setLayout', () => {
    it('changes layout and resets stack to homeCard', () => {
      let state = navigationReducer(defaultState, initializeNavigation({ homeCard: 'dashboard' }));
      state = navigationReducer(state, navigate({ card: 'browse' }));
      state = navigationReducer(state, setLayout('drawer'));
      expect(state.layout).toBe('drawer');
      expect(state.stack).toEqual([{ card: 'dashboard' }]);
    });
  });

  describe('resetNavigation', () => {
    it('resets stack to homeCard without changing layout', () => {
      let state = navigationReducer(defaultState, initializeNavigation({ homeCard: 'main' }));
      state = navigationReducer(state, navigate({ card: 'sub' }));
      state = navigationReducer(state, navigate({ card: 'detail' }));
      state = navigationReducer(state, resetNavigation());
      expect(state.stack).toEqual([{ card: 'main' }]);
      expect(state.layout).toBe('split'); // unchanged
    });
  });
});
