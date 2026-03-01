import { describe, expect, it } from 'vitest';
import { validateRuntimeIntent, validateRuntimeIntents } from './intentSchema';

describe('validateRuntimeIntent', () => {
  it('accepts card intents', () => {
    const intent = validateRuntimeIntent({
      scope: 'card',
      actionType: 'set.count',
      payload: { value: 2 },
    });

    expect(intent).toEqual({
      scope: 'card',
      actionType: 'set.count',
      payload: { value: 2 },
    });
  });

  it('accepts session intents', () => {
    const intent = validateRuntimeIntent({
      scope: 'session',
      actionType: 'set.filter',
      payload: 'open',
    });

    expect(intent.scope).toBe('session');
  });

  it('accepts domain intents', () => {
    const intent = validateRuntimeIntent({
      scope: 'domain',
      domain: 'inventory',
      actionType: 'reserve',
      payload: { sku: 'A1' },
    });

    expect(intent).toEqual({
      scope: 'domain',
      domain: 'inventory',
      actionType: 'reserve',
      payload: { sku: 'A1' },
    });
  });

  it('accepts system intents', () => {
    const intent = validateRuntimeIntent({
      scope: 'system',
      command: 'nav.go',
      payload: { cardId: 'detail' },
    });

    expect(intent.scope).toBe('system');
  });

  it('rejects malformed intent arrays', () => {
    expect(() => validateRuntimeIntents({} as never)).toThrow(/must be an array/i);
  });

  it('rejects domain intents without domain', () => {
    expect(() =>
      validateRuntimeIntent({
        scope: 'domain',
        actionType: 'reserve',
      })
    ).toThrow(/domain/i);
  });
});
