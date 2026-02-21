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
