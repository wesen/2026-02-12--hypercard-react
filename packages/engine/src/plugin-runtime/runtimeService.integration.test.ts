import { afterEach, describe, expect, it } from 'vitest';
import COLUMN_STACK from './fixtures/column-stack.vm.js?raw';
import DYNAMIC_CARD from './fixtures/dynamic-card.vm.js?raw';
import INVENTORY_STACK from './fixtures/inventory-stack.vm.js?raw';
import LOOP_STACK from './fixtures/loop-stack.vm.js?raw';
import PATCHED_LOW_STOCK_HANDLER from './fixtures/patched-low-stock-handler.vm.js?raw';
import PATCHED_LOW_STOCK_RENDER from './fixtures/patched-low-stock-render.vm.js?raw';
import { QuickJSCardRuntimeService } from './runtimeService';

describe('QuickJSCardRuntimeService', () => {
  const services: QuickJSCardRuntimeService[] = [];

  afterEach(() => {
    for (const service of services) {
      for (const sessionId of service.health().sessions) {
        service.disposeSession(sessionId);
      }
    }
    services.length = 0;
  });

  it('loads stack bundle and renders a valid tree', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    const bundle = await service.loadStackBundle('inventory', 'inventory@one', INVENTORY_STACK);
    expect(bundle.cards).toEqual(['lowStock']);

    const tree = service.renderCard('inventory@one', 'lowStock', { limit: 3 }, { filter: 'all' }, {});
    expect(tree.kind).toBe('panel');
  });

  it('returns card/session/domain/system intents from handlers', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@one', INVENTORY_STACK);

    const intents = service.eventCard(
      'inventory@one',
      'lowStock',
      'reserve',
      { sku: 'A-1' },
      { limit: 5 },
      { filter: 'all' },
      {}
    );

    expect(intents).toEqual([
      {
        scope: 'card',
        actionType: 'set.lastSku',
        payload: 'A-1',
      },
      {
        scope: 'session',
        actionType: 'set.filter',
        payload: 'low-stock',
      },
      {
        scope: 'domain',
        domain: 'inventory',
        actionType: 'reserve-item',
        payload: { sku: 'A-1' },
      },
      {
        scope: 'system',
        command: 'notify',
        payload: { level: 'info', message: 'reserved' },
      },
    ]);
  });

  it('disposes runtime sessions and rejects further renders', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@one', INVENTORY_STACK);
    expect(service.disposeSession('inventory@one')).toBe(true);
    expect(service.disposeSession('inventory@one')).toBe(false);
    expect(() => service.renderCard('inventory@one', 'lowStock', {}, {}, {})).toThrow(/not found/i);
  });

  it('supports multiple sessions from one stack bundle', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@one', INVENTORY_STACK);
    await service.loadStackBundle('inventory', 'inventory@two', INVENTORY_STACK);

    const firstTree = service.renderCard('inventory@one', 'lowStock', { limit: 1 }, { filter: 'all' }, {});
    const secondTree = service.renderCard('inventory@two', 'lowStock', { limit: 7 }, { filter: 'low-stock' }, {});

    expect(firstTree.kind).toBe('panel');
    expect(secondTree.kind).toBe('panel');
    expect(service.health().sessions).toEqual(expect.arrayContaining(['inventory@one', 'inventory@two']));
  });

  it('supports ui.column render output', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('column-demo', 'column-demo@one', COLUMN_STACK);
    const tree = service.renderCard('column-demo@one', 'main', {}, {}, {});

    expect(tree.kind).toBe('column');
  });

  it('interrupts infinite render loops with timeout', async () => {
    const service = new QuickJSCardRuntimeService({ renderTimeoutMs: 10 });
    services.push(service);

    await service.loadStackBundle('loop', 'loop@one', LOOP_STACK);

    expect(() => service.renderCard('loop@one', 'loop', {}, {}, {})).toThrow(/interrupted/i);
  });

  it('supports defining cards and patching render/handlers at runtime', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    await service.loadStackBundle('inventory', 'inventory@dynamic', INVENTORY_STACK);

    const withDynamicCard = service.defineCard('inventory@dynamic', 'onDemand', DYNAMIC_CARD);
    expect(withDynamicCard.cards).toContain('onDemand');

    const dynamicTree = service.renderCard('inventory@dynamic', 'onDemand', { name: 'Backorder' }, {}, {});
    expect(dynamicTree.kind).toBe('panel');

    const dynamicIntents = service.eventCard('inventory@dynamic', 'onDemand', 'back', {}, {}, {}, {});
    expect(dynamicIntents).toEqual([
      {
        scope: 'system',
        command: 'nav.back',
      },
    ]);

    service.defineCardRender('inventory@dynamic', 'lowStock', PATCHED_LOW_STOCK_RENDER);
    const patchedTree = service.renderCard('inventory@dynamic', 'lowStock', { limit: 9 }, { filter: 'all' }, {});
    expect(patchedTree.kind).toBe('panel');
    expect((patchedTree as { children?: Array<{ kind?: string; text?: string }> }).children?.[0]?.text).toContain(
      'Patched limit: 9'
    );

    service.defineCardHandler('inventory@dynamic', 'lowStock', 'patchedNotify', PATCHED_LOW_STOCK_HANDLER);
    const patchedIntents = service.eventCard(
      'inventory@dynamic',
      'lowStock',
      'patchedNotify',
      {},
      {},
      {},
      {}
    );
    expect(patchedIntents).toEqual([
      {
        scope: 'system',
        command: 'notify',
        payload: { level: 'info', message: 'patched-handler' },
      },
    ]);
  });
});
