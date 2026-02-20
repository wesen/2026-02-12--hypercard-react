import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { timelineSlice } from '../state/timelineSlice';
import {
  clearSemHandlers,
  handleSem,
  registerDefaultSemHandlers,
  registerSem,
  type SemContext,
} from './semRegistry';

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
    },
  });
}

describe('semRegistry', () => {
  beforeEach(() => {
    clearSemHandlers();
  });

  it('registers a handler and threads SemContext through handleSem', () => {
    const handler = vi.fn();
    registerSem('custom.event', handler);

    const dispatch = vi.fn();
    const ctx: SemContext = { convId: 'conv-custom', dispatch };

    handleSem(
      {
        sem: true,
        event: {
          type: 'custom.event',
          id: 'evt-1',
        },
      },
      ctx
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'custom.event', id: 'evt-1' }),
      expect.objectContaining({ convId: 'conv-custom', dispatch })
    );
  });

  it('routes default handlers into conversation-scoped timeline actions', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.start',
          id: 'msg-1',
          data: {
            id: 'msg-1',
            role: 'assistant',
          },
        },
      },
      { convId: 'conv-1', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.start',
          id: 'msg-1',
          data: {
            id: 'msg-1',
            role: 'thinking',
          },
        },
      },
      { convId: 'conv-2', dispatch: store.dispatch }
    );

    const state = store.getState().timeline;

    expect(state.byConvId['conv-1'].order).toEqual(['msg-1']);
    expect(state.byConvId['conv-1'].byId['msg-1'].props).toEqual({
      role: 'assistant',
      content: '',
      streaming: true,
    });

    expect(state.byConvId['conv-2'].order).toEqual(['msg-1']);
    expect(state.byConvId['conv-2'].byId['msg-1'].props).toEqual({
      role: 'thinking',
      content: '',
      streaming: true,
    });
  });
});
