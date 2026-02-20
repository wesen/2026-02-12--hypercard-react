import { describe, expect, it } from 'vitest';
import { chatSessionReducer, chatSessionSlice, DEFAULT_CHAT_SUGGESTIONS } from './chatSessionSlice';

const actions = chatSessionSlice.actions;

function reduce(input: Parameters<typeof chatSessionReducer>[1][]) {
  let state = chatSessionReducer(undefined, { type: '__test__/init' });
  for (const action of input) {
    state = chatSessionReducer(state, action);
  }
  return state;
}

describe('chatSessionSlice', () => {
  it('keeps state scoped per conversation id', () => {
    const state = reduce([
      actions.setConnectionStatus({ convId: 'a', status: 'connected' }),
      actions.setConnectionStatus({ convId: 'b', status: 'error' }),
      actions.setIsStreaming({ convId: 'a', isStreaming: true }),
    ]);

    expect(state.byConvId.a?.connectionStatus).toBe('connected');
    expect(state.byConvId.a?.isStreaming).toBe(true);
    expect(state.byConvId.b?.connectionStatus).toBe('error');
    expect(state.byConvId.b?.isStreaming).toBe(false);
  });

  it('normalizes and merges suggestions', () => {
    const state = reduce([
      actions.setSuggestions({
        convId: 's1',
        suggestions: ['  true  ', 'Show totals', 'show totals', '', '  '],
      }),
      actions.mergeSuggestions({
        convId: 's1',
        suggestions: ['What items are low stock?', 'show totals', 'Summarize today sales'],
      }),
    ]);

    expect(state.byConvId.s1?.suggestions).toEqual([
      'true',
      'Show totals',
      'What items are low stock?',
      'Summarize today sales',
    ]);
  });

  it('falls back to defaults when suggestion payload normalizes to empty', () => {
    const state = reduce([
      actions.replaceSuggestions({ convId: 's2', suggestions: ['   ', '\n\t'] }),
    ]);

    expect(state.byConvId.s2?.suggestions).toEqual(DEFAULT_CHAT_SUGGESTIONS);
  });

  it('tracks stream start, token updates, and clears errors on restart', () => {
    const state = reduce([
      actions.setStreamError({ convId: 'stream-1', error: 'network' }),
      actions.markStreamStart({ convId: 'stream-1', streamStartTime: 123 }),
      actions.updateStreamTokens({ convId: 'stream-1', streamOutputTokens: 12.9 }),
      actions.setStreamError({ convId: 'stream-1', error: 'timeout' }),
      actions.markStreamStart({ convId: 'stream-1', streamStartTime: 456 }),
      actions.updateStreamTokens({ convId: 'stream-1', streamOutputTokens: -5 }),
    ]);

    expect(state.byConvId['stream-1']?.streamStartTime).toBe(456);
    expect(state.byConvId['stream-1']?.streamOutputTokens).toBe(0);
    expect(state.byConvId['stream-1']?.lastError).toBeNull();
  });

  it('resets and clears a conversation session', () => {
    const state = reduce([
      actions.setModelName({ convId: 'r1', modelName: 'gpt-test' }),
      actions.setConnectionStatus({ convId: 'r1', status: 'connected' }),
      actions.resetSession({ convId: 'r1' }),
      actions.clearConversationSession({ convId: 'r1' }),
    ]);

    expect(state.byConvId.r1).toBeUndefined();
  });
});
