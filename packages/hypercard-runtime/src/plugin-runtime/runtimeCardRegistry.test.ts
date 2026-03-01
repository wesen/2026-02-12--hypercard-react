import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerRuntimeCard,
  unregisterRuntimeCard,
  getPendingRuntimeCards,
  hasRuntimeCard,
  onRegistryChange,
  clearRuntimeCardRegistry,
  injectPendingCards,
  injectPendingCardsWithReport,
} from './runtimeCardRegistry';

beforeEach(() => {
  clearRuntimeCardRegistry();
});

describe('runtimeCardRegistry', () => {
  it('registers and retrieves runtime cards', () => {
    registerRuntimeCard('lowStock', '({ ui }) => ({ render() { return ui.text("hi"); } })');
    expect(hasRuntimeCard('lowStock')).toBe(true);
    expect(getPendingRuntimeCards()).toHaveLength(1);
    expect(getPendingRuntimeCards()[0].cardId).toBe('lowStock');
    expect(getPendingRuntimeCards()[0].code).toContain('ui.text');
  });

  it('overwrites existing card with same id', () => {
    registerRuntimeCard('lowStock', 'v1');
    registerRuntimeCard('lowStock', 'v2');
    expect(getPendingRuntimeCards()).toHaveLength(1);
    expect(getPendingRuntimeCards()[0].code).toBe('v2');
  });

  it('unregisters cards', () => {
    registerRuntimeCard('lowStock', 'code');
    unregisterRuntimeCard('lowStock');
    expect(hasRuntimeCard('lowStock')).toBe(false);
    expect(getPendingRuntimeCards()).toHaveLength(0);
  });

  it('notifies listeners on change', () => {
    const listener = vi.fn();
    const unsub = onRegistryChange(listener);
    registerRuntimeCard('a', 'code-a');
    expect(listener).toHaveBeenCalledTimes(1);
    unregisterRuntimeCard('a');
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    registerRuntimeCard('b', 'code-b');
    expect(listener).toHaveBeenCalledTimes(2); // no more calls after unsub
  });

  it('injects pending cards into a service', () => {
    registerRuntimeCard('lowStock', 'code-a');
    registerRuntimeCard('catBrowser', 'code-b');
    const service = { defineCard: vi.fn() };
    const injected = injectPendingCards(service, 'session-1');
    expect(injected).toEqual(['lowStock', 'catBrowser']);
    expect(service.defineCard).toHaveBeenCalledTimes(2);
    expect(service.defineCard).toHaveBeenCalledWith('session-1', 'lowStock', 'code-a');
    expect(service.defineCard).toHaveBeenCalledWith('session-1', 'catBrowser', 'code-b');
  });

  it('continues injecting if one card fails', () => {
    registerRuntimeCard('bad', 'syntax error');
    registerRuntimeCard('good', 'valid code');
    const service = {
      defineCard: vi.fn().mockImplementation((_s, cardId) => {
        if (cardId === 'bad') throw new Error('syntax error');
      }),
    };
    const injected = injectPendingCards(service, 'session-1');
    expect(injected).toEqual(['good']); // bad was skipped
    expect(service.defineCard).toHaveBeenCalledTimes(2);
  });

  it('returns injection failure details with report helper', () => {
    registerRuntimeCard('bad', 'syntax error');
    registerRuntimeCard('good', 'valid code');
    const service = {
      defineCard: vi.fn().mockImplementation((_s, cardId) => {
        if (cardId === 'bad') throw new Error('syntax error');
      }),
    };
    const report = injectPendingCardsWithReport(service, 'session-1');
    expect(report.injected).toEqual(['good']);
    expect(report.failed).toEqual([{ cardId: 'bad', error: 'syntax error' }]);
  });
});
