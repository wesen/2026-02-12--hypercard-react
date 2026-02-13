import { describe, expect, it, vi } from 'vitest';
import { createSelectorResolver } from '../cards/runtime';
import type { CardContext, CardDefinition, CardStackDefinition } from '../cards/types';

function createTestCtx(): CardContext {
  return {
    stackId: 's1',
    cardId: 'c1',
    cardType: 'default',
    mode: 'interactive',
    params: {},
    getState: () => ({}),
    dispatch: vi.fn(),
    nav: { go: vi.fn(), back: vi.fn() },
    getScopedState: () => ({}),
    getMergedScopedState: () => ({}),
    setScopedState: vi.fn(),
    patchScopedState: vi.fn(),
    resetScopedState: vi.fn(),
  };
}

describe('createSelectorResolver', () => {
  it('resolves card-level selector first (auto scope)', () => {
    const cardDef: CardDefinition = {
      id: 'c1',
      type: 'default',
      ui: { t: 'text', text: '' },
      selectors: { count: () => 42 },
    };
    const stackDef: CardStackDefinition = {
      id: 's1',
      name: 'Test',
      icon: '🧪',
      homeCard: 'c1',
      cards: { c1: cardDef },
      stack: { selectors: { count: () => 99 } },
    };
    const ctx = createTestCtx();
    const resolve = createSelectorResolver({}, ctx, { cardDef, stackDef }, {});
    expect(resolve('count', undefined, undefined)).toBe(42);
  });

  it('falls through to stack-level selector', () => {
    const cardDef: CardDefinition = {
      id: 'c1',
      type: 'default',
      ui: { t: 'text', text: '' },
    };
    const stackDef: CardStackDefinition = {
      id: 's1',
      name: 'Test',
      icon: '🧪',
      homeCard: 'c1',
      cards: { c1: cardDef },
      stack: { selectors: { total: () => 100 } },
    };
    const ctx = createTestCtx();
    const resolve = createSelectorResolver({}, ctx, { cardDef, stackDef }, {});
    expect(resolve('total', undefined, undefined)).toBe(100);
  });

  it('falls through to shared selectors', () => {
    const cardDef: CardDefinition = {
      id: 'c1',
      type: 'default',
      ui: { t: 'text', text: '' },
    };
    const stackDef: CardStackDefinition = {
      id: 's1',
      name: 'Test',
      icon: '🧪',
      homeCard: 'c1',
      cards: { c1: cardDef },
    };
    const ctx = createTestCtx();
    const sharedSelectors = { allItems: () => ['a', 'b', 'c'] };
    const resolve = createSelectorResolver({}, ctx, { cardDef, stackDef }, sharedSelectors);
    expect(resolve('allItems', undefined, undefined)).toEqual(['a', 'b', 'c']);
  });

  it('from: "shared" goes directly to shared selectors', () => {
    const cardDef: CardDefinition = {
      id: 'c1',
      type: 'default',
      ui: { t: 'text', text: '' },
      selectors: { data: () => 'local' },
    };
    const stackDef: CardStackDefinition = {
      id: 's1',
      name: 'Test',
      icon: '🧪',
      homeCard: 'c1',
      cards: { c1: cardDef },
    };
    const ctx = createTestCtx();
    const sharedSelectors = { data: () => 'shared' };
    const resolve = createSelectorResolver({}, ctx, { cardDef, stackDef }, sharedSelectors);
    expect(resolve('data', 'shared', undefined)).toBe('shared');
  });

  it('from: specific scope only checks that scope', () => {
    const cardDef: CardDefinition = {
      id: 'c1',
      type: 'default',
      ui: { t: 'text', text: '' },
      selectors: { x: () => 'card-value' },
    };
    const stackDef: CardStackDefinition = {
      id: 's1',
      name: 'Test',
      icon: '🧪',
      homeCard: 'c1',
      cards: { c1: cardDef },
      stack: { selectors: { x: () => 'stack-value' } },
    };
    const ctx = createTestCtx();
    const resolve = createSelectorResolver({}, ctx, { cardDef, stackDef }, {});
    expect(resolve('x', 'stack', undefined)).toBe('stack-value');
  });

  it('returns undefined for missing selector', () => {
    const cardDef: CardDefinition = {
      id: 'c1',
      type: 'default',
      ui: { t: 'text', text: '' },
    };
    const stackDef: CardStackDefinition = {
      id: 's1',
      name: 'Test',
      icon: '🧪',
      homeCard: 'c1',
      cards: { c1: cardDef },
    };
    const ctx = createTestCtx();
    const resolve = createSelectorResolver({}, ctx, { cardDef, stackDef }, {});
    expect(resolve('nonexistent', undefined, undefined)).toBeUndefined();
  });
});
