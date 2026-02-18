import { describe, expect, it } from 'vitest';
import {
  chatReducer,
  markStreamStart,
  mergeSuggestions,
  removeConversation,
  replaceSuggestions,
  resetConversation,
  setConnectionStatus,
  setModelName,
  setStreamError,
  setTurnStats,
  updateStreamTokens,
} from './chatSlice';

const C = 'test-conv';

function reduce(actions: Parameters<typeof chatReducer>[1][]) {
  let state = chatReducer(undefined, { type: '__test__/init' });
  for (const action of actions) {
    state = chatReducer(state, action);
  }
  return state;
}

describe('chatSlice (timeline-first metadata state)', () => {
  it('creates per-conversation state lazily when first action arrives', () => {
    const state = reduce([setConnectionStatus({ conversationId: C, status: 'connecting' })]);
    expect(state.conversations[C]).toBeTruthy();
    expect(state.conversations[C]?.connectionStatus).toBe('connecting');
  });

  it('tracks connection and model metadata', () => {
    const state = reduce([
      setConnectionStatus({ conversationId: C, status: 'connected' }),
      setModelName({ conversationId: C, model: 'gpt-5' }),
    ]);

    expect(state.conversations[C]?.connectionStatus).toBe('connected');
    expect(state.conversations[C]?.modelName).toBe('gpt-5');
  });

  it('normalizes and de-duplicates suggestions with a max cap', () => {
    const state = reduce([
      replaceSuggestions({
        conversationId: C,
        suggestions: [
          '  Show current inventory status  ',
          'show current inventory status',
          'What items are low stock?',
          'Summarize today sales',
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
        ],
      }),
    ]);

    expect(state.conversations[C]?.suggestions).toEqual([
      'Show current inventory status',
      'What items are low stock?',
      'Summarize today sales',
      'A',
      'B',
      'C',
      'D',
      'E',
    ]);
  });

  it('merges suggestions into existing list while preserving uniqueness', () => {
    const state = reduce([
      replaceSuggestions({ conversationId: C, suggestions: ['A', 'B'] }),
      mergeSuggestions({ conversationId: C, suggestions: ['b', 'C', 'D'] }),
    ]);

    expect(state.conversations[C]?.suggestions).toEqual(['A', 'B', 'C', 'D']);
  });

  it('marks stream start and tracks live output tokens', () => {
    const state = reduce([
      setTurnStats({ conversationId: C, inputTokens: 10, outputTokens: 20, durationMs: 1000 }),
      markStreamStart({ conversationId: C, time: 100 }),
      updateStreamTokens({ conversationId: C, outputTokens: 7 }),
    ]);

    expect(state.conversations[C]?.streamStartTime).toBe(100);
    expect(state.conversations[C]?.streamOutputTokens).toBe(7);
    expect(state.conversations[C]?.currentTurnStats).toBeNull();
  });

  it('computes tps when setting final turn stats and clears stream counters', () => {
    const state = reduce([
      markStreamStart({ conversationId: C, time: 42 }),
      updateStreamTokens({ conversationId: C, outputTokens: 15 }),
      setTurnStats({
        conversationId: C,
        inputTokens: 123,
        outputTokens: 99,
        durationMs: 1100,
      }),
    ]);

    expect(state.conversations[C]?.currentTurnStats).toMatchObject({
      inputTokens: 123,
      outputTokens: 99,
      durationMs: 1100,
      tps: 90,
    });
    expect(state.conversations[C]?.streamStartTime).toBeNull();
    expect(state.conversations[C]?.streamOutputTokens).toBe(0);
  });

  it('records stream error and stops active stream timer', () => {
    const state = reduce([
      markStreamStart({ conversationId: C, time: 999 }),
      setStreamError({ conversationId: C, message: 'backend unavailable' }),
    ]);

    expect(state.conversations[C]?.lastError).toBe('backend unavailable');
    expect(state.conversations[C]?.streamStartTime).toBeNull();
  });

  it('resetConversation clears chat metadata but preserves connection status', () => {
    const state = reduce([
      setConnectionStatus({ conversationId: C, status: 'connected' }),
      setModelName({ conversationId: C, model: 'gpt-5-mini' }),
      replaceSuggestions({ conversationId: C, suggestions: ['X'] }),
      markStreamStart({ conversationId: C, time: 500 }),
      updateStreamTokens({ conversationId: C, outputTokens: 12 }),
      setStreamError({ conversationId: C, message: 'oops' }),
      resetConversation({ conversationId: C }),
    ]);

    expect(state.conversations[C]?.connectionStatus).toBe('connected');
    expect(state.conversations[C]?.modelName).toBeNull();
    expect(state.conversations[C]?.currentTurnStats).toBeNull();
    expect(state.conversations[C]?.streamStartTime).toBeNull();
    expect(state.conversations[C]?.streamOutputTokens).toBe(0);
    expect(state.conversations[C]?.lastError).toBeNull();
    expect(state.conversations[C]?.suggestions).toEqual([
      'Show current inventory status',
      'What items are low stock?',
      'Summarize today sales',
    ]);
  });

  it('removeConversation deletes only the targeted conversation', () => {
    const state = reduce([
      setConnectionStatus({ conversationId: C, status: 'connected' }),
      setConnectionStatus({ conversationId: 'conv-2', status: 'error' }),
      removeConversation({ conversationId: C }),
    ]);

    expect(state.conversations[C]).toBeUndefined();
    expect(state.conversations['conv-2']?.connectionStatus).toBe('error');
  });

  it('isolates independent conversation metadata', () => {
    const state = reduce([
      setConnectionStatus({ conversationId: C, status: 'connected' }),
      setModelName({ conversationId: C, model: 'gpt-5' }),
      setConnectionStatus({ conversationId: 'conv-2', status: 'closed' }),
      setModelName({ conversationId: 'conv-2', model: 'other' }),
    ]);

    expect(state.conversations[C]?.connectionStatus).toBe('connected');
    expect(state.conversations[C]?.modelName).toBe('gpt-5');
    expect(state.conversations['conv-2']?.connectionStatus).toBe('closed');
    expect(state.conversations['conv-2']?.modelName).toBe('other');
  });
});
