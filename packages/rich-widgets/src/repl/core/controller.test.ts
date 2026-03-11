import { describe, expect, it } from 'vitest';
import { resolveReplCompletionState } from './controller';
import type { ReplDriver } from './types';

const TEST_DRIVER: ReplDriver = {
  execute() {
    return { lines: [] };
  },
  getCompletions(input) {
    return input.startsWith('he')
      ? [
          { value: 'help', detail: 'Show help' },
          { value: 'hello', detail: 'Greet' },
        ]
      : [];
  },
};

describe('repl controller', () => {
  it('derives completion items for single-token inputs', () => {
    const completionState = resolveReplCompletionState('he', TEST_DRIVER, {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });

    expect(completionState.items.map((item) => item.value)).toEqual(['help', 'hello']);
    expect(completionState.suggestion).toBe('');
  });

  it('ignores multi-token inputs for inline completions', () => {
    const completionState = resolveReplCompletionState('help to', TEST_DRIVER, {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });

    expect(completionState).toEqual({ suggestion: '', items: [] });
  });
});
