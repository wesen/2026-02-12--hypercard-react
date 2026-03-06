import { describe, expect, it } from 'vitest';
import {
  createMacReplStateSeed,
  macReplActions,
  macReplReducer,
} from './replState';

describe('replState', () => {
  it('creates a normalized seed', () => {
    const state = createMacReplStateSeed({
      prompt: '❯',
      historyStack: ['whoami'],
      envVars: { USER: 'alice' },
    });

    expect(state).toMatchObject({
      initialized: true,
      prompt: '❯',
      historyStack: ['whoami'],
    });
    expect(state.envVars.USER).toBe('alice');
  });

  it('appends lines and aliases', () => {
    const seeded = createMacReplStateSeed();
    const updated = macReplReducer(
      macReplReducer(
        seeded,
        macReplActions.appendLines([{ type: 'output', text: 'hello' }]),
      ),
      macReplActions.setAlias({ key: 'll', value: 'history' }),
    );

    expect(updated.lines.at(-1)?.text).toBe('hello');
    expect(updated.aliases.ll).toBe('history');
  });
});
