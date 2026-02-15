import { afterEach, describe, expect, it } from 'vitest';
import { QuickJSCardRuntimeService } from './runtimeService';

const INVENTORY_STACK = `
defineStackBundle(({ ui }) => {
  return {
    id: 'inventory',
    title: 'Inventory',
    initialSessionState: { filter: 'all' },
    initialCardState: { lowStock: { limit: 5 } },
    cards: {
      lowStock: {
        render({ cardState, sessionState }) {
          return ui.panel([
            ui.text('Filter: ' + String(sessionState?.filter ?? 'all')),
            ui.text('Limit: ' + String(cardState?.limit ?? 0)),
            ui.button('Reserve', { onClick: { handler: 'reserve', args: { sku: 'A-1' } } }),
          ]);
        },
        handlers: {
          reserve({ dispatchCardAction, dispatchSessionAction, dispatchDomainAction, dispatchSystemCommand }, args) {
            dispatchCardAction('set.lastSku', args?.sku);
            dispatchSessionAction('set.filter', 'low-stock');
            dispatchDomainAction('inventory', 'reserve-item', { sku: args?.sku });
            dispatchSystemCommand('notify', { level: 'info', message: 'reserved' });
          },
        },
      },
    },
  };
});
`;

const COLUMN_STACK = `
defineStackBundle(({ ui }) => {
  return {
    id: 'column-demo',
    title: 'Column Demo',
    cards: {
      main: {
        render() {
          return ui.column([
            ui.text('top'),
            ui.text('bottom'),
          ]);
        },
        handlers: {},
      },
    },
  };
});
`;

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

    await service.loadStackBundle(
      'loop',
      'loop@one',
      `
defineStackBundle(({ ui }) => {
  return {
    id: 'loop',
    title: 'Loop',
    cards: {
      loop: {
        render() {
          while (true) {}
        },
        handlers: {},
      },
    },
  };
});
      `
    );

    expect(() => service.renderCard('loop@one', 'loop', {}, {}, {})).toThrow(/interrupted/i);
  });
});
