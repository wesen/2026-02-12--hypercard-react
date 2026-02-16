import { describe, expect, it } from 'vitest';
import { applyLLMDelta, applyLLMFinal, applyLLMStart, chatReducer, queueUserPrompt, setStreamError } from './chatSlice';

function reduce(actions: Parameters<typeof chatReducer>[1][]) {
  let state = chatReducer(undefined, { type: '__test__/init' });
  for (const action of actions) {
    state = chatReducer(state, action);
  }
  return state;
}

describe('chatSlice', () => {
  it('streams llm.start -> llm.delta -> llm.final into a single ai message', () => {
    const state = reduce([
      queueUserPrompt({ text: 'hello' }),
      applyLLMStart({ messageId: 'm-1' }),
      applyLLMDelta({ messageId: 'm-1', cumulative: 'Hi there' }),
      applyLLMFinal({ messageId: 'm-1', text: 'Hi there!' }),
    ]);

    const ai = state.messages.find((message) => message.id === 'm-1');
    expect(ai).toBeTruthy();
    expect(ai?.role).toBe('ai');
    expect(ai?.text).toBe('Hi there!');
    expect(ai?.status).toBe('complete');
    expect(state.isStreaming).toBe(false);
  });

  it('prefers cumulative deltas to keep updates idempotent', () => {
    const state = reduce([
      queueUserPrompt({ text: 'status?' }),
      applyLLMStart({ messageId: 'm-2' }),
      applyLLMDelta({ messageId: 'm-2', cumulative: 'A' }),
      applyLLMDelta({ messageId: 'm-2', cumulative: 'AB' }),
    ]);

    const ai = state.messages.find((message) => message.id === 'm-2');
    expect(ai?.text).toBe('AB');
    expect(ai?.status).toBe('streaming');
    expect(state.isStreaming).toBe(true);
  });

  it('marks active streaming message as error when stream fails', () => {
    const state = reduce([
      queueUserPrompt({ text: 'ping' }),
      applyLLMStart({ messageId: 'm-3' }),
      setStreamError({ message: 'backend unavailable' }),
    ]);

    const ai = state.messages.find((message) => message.id === 'm-3');
    expect(ai?.status).toBe('error');
    expect(state.lastError).toBe('backend unavailable');
    expect(state.isStreaming).toBe(false);
  });
});
