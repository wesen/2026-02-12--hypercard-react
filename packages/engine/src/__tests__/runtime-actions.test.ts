import { describe, expect, it, vi } from 'vitest';
import { executeActionDescriptor } from '../cards/runtime';
import type { ActionDescriptor, CardContext, CardDefinition, CardStackDefinition } from '../cards/types';

// ── Test fixtures ──

function createMockCtx(overrides: Partial<CardContext> = {}): CardContext {
  return {
    stackId: 'test-stack',
    cardId: 'test-card',
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
    ...overrides,
  };
}

function createMockLookup(
  overrides: Partial<{ cardActions: Record<string, any>; stackActions: Record<string, any> }> = {},
) {
  const cardDef: CardDefinition = {
    id: 'test-card',
    type: 'default',
    ui: { t: 'text', text: 'test' },
    actions: overrides.cardActions ?? {},
  };
  const stackDef: CardStackDefinition = {
    id: 'test-stack',
    name: 'Test',
    icon: '🧪',
    homeCard: 'home',
    cards: { 'test-card': cardDef },
    stack: { actions: overrides.stackActions ?? {} },
  };
  return { cardDef, stackDef };
}

function act(type: string, args?: unknown, to?: string): ActionDescriptor {
  return { $: 'act', type, args: args as any, to: to as any };
}

const deps = { showToast: vi.fn() };

// ── Tests ──

describe('executeActionDescriptor', () => {
  describe('built-in actions', () => {
    it('nav.go dispatches navigation', () => {
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('nav.go'), { card: 'browse' }, ctx, lookup, {}, deps);
      expect(ctx.nav.go).toHaveBeenCalledWith('browse', undefined);
    });

    it('nav.go with param', () => {
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('nav.go'), { card: 'detail', param: 'item-1' }, ctx, lookup, {}, deps);
      expect(ctx.nav.go).toHaveBeenCalledWith('detail', 'item-1');
    });

    it('nav.back calls back()', () => {
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('nav.back'), {}, ctx, lookup, {}, deps);
      expect(ctx.nav.back).toHaveBeenCalled();
    });

    it('toast.show shows toast message', () => {
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('toast.show'), { message: 'Hello!' }, ctx, lookup, {}, deps);
      expect(deps.showToast).toHaveBeenCalledWith('Hello!');
    });

    it('state.set calls setScopedState', () => {
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('state.set'), { scope: 'card', path: 'name', value: 'Alice' }, ctx, lookup, {}, deps);
      expect(ctx.setScopedState).toHaveBeenCalledWith('card', 'name', 'Alice');
    });

    it('state.setField builds path correctly', () => {
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(
        act('state.setField'),
        { scope: 'card', path: 'edits', key: 'name', value: 'Bob' },
        ctx,
        lookup,
        {},
        deps,
      );
      expect(ctx.setScopedState).toHaveBeenCalledWith('card', 'edits.name', 'Bob');
    });

    it('state.patch calls patchScopedState', () => {
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('state.patch'), { scope: 'card', patch: { x: 1, y: 2 } }, ctx, lookup, {}, deps);
      expect(ctx.patchScopedState).toHaveBeenCalledWith('card', { x: 1, y: 2 });
    });

    it('state.reset calls resetScopedState', () => {
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('state.reset'), { scope: 'card' }, ctx, lookup, {}, deps);
      expect(ctx.resetScopedState).toHaveBeenCalledWith('card');
    });
  });

  describe('local action precedence', () => {
    it('card action takes precedence over shared', () => {
      const cardHandler = vi.fn();
      const sharedHandler = vi.fn();
      const ctx = createMockCtx();
      const lookup = createMockLookup({ cardActions: { 'my.action': cardHandler } });
      executeActionDescriptor(act('my.action'), { x: 1 }, ctx, lookup, { 'my.action': sharedHandler }, deps);
      expect(cardHandler).toHaveBeenCalledWith(ctx, { x: 1 });
      expect(sharedHandler).not.toHaveBeenCalled();
    });

    it('shared action used when no local handler', () => {
      const sharedHandler = vi.fn();
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('my.action'), {}, ctx, lookup, { 'my.action': sharedHandler }, deps);
      expect(sharedHandler).toHaveBeenCalledWith(ctx, {});
    });

    it('stack-level action used when no card handler', () => {
      const stackHandler = vi.fn();
      const ctx = createMockCtx();
      const lookup = createMockLookup({ stackActions: { 'stack.action': stackHandler } });
      executeActionDescriptor(act('stack.action'), {}, ctx, lookup, {}, deps);
      expect(stackHandler).toHaveBeenCalledWith(ctx, {});
    });
  });

  describe('action scope (descriptor.to)', () => {
    it('to: "shared" skips local handlers', () => {
      const cardHandler = vi.fn();
      const sharedHandler = vi.fn();
      const ctx = createMockCtx();
      const lookup = createMockLookup({ cardActions: { 'my.action': cardHandler } });
      executeActionDescriptor(
        act('my.action', undefined, 'shared'),
        {},
        ctx,
        lookup,
        { 'my.action': sharedHandler },
        deps,
      );
      expect(cardHandler).not.toHaveBeenCalled();
      expect(sharedHandler).toHaveBeenCalled();
    });

    it('to: "card" only checks card scope', () => {
      const cardHandler = vi.fn();
      const stackHandler = vi.fn();
      const ctx = createMockCtx();
      const lookup = createMockLookup({
        cardActions: { 'my.action': cardHandler },
        stackActions: { 'my.action': stackHandler },
      });
      executeActionDescriptor(act('my.action', undefined, 'card'), {}, ctx, lookup, {}, deps);
      expect(cardHandler).toHaveBeenCalled();
      expect(stackHandler).not.toHaveBeenCalled();
    });

    it('to: "stack" checks only stack scope', () => {
      const cardHandler = vi.fn();
      const stackHandler = vi.fn();
      const ctx = createMockCtx();
      const lookup = createMockLookup({ cardActions: { test: cardHandler }, stackActions: { test: stackHandler } });
      executeActionDescriptor(act('test', undefined, 'stack'), {}, ctx, lookup, {}, deps);
      expect(cardHandler).not.toHaveBeenCalled();
      expect(stackHandler).toHaveBeenCalled();
    });
  });

  describe('unhandled actions', () => {
    it('warns when no handler is found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const ctx = createMockCtx();
      const lookup = createMockLookup();
      executeActionDescriptor(act('nonexistent.action'), {}, ctx, lookup, {}, deps);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled action: "nonexistent.action"'),
        expect.objectContaining({ cardId: 'test-card' }),
      );
      warnSpy.mockRestore();
    });
  });
});
