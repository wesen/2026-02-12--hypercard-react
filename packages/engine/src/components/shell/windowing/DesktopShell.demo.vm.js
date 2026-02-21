defineStackBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  const ITEMS = [
    { id: '1', sku: 'W-1001', name: 'Widget A', category: 'Widgets', price: '$12.00', qty: 45 },
    { id: '2', sku: 'G-2001', name: 'Gadget B', category: 'Gadgets', price: '$25.50', qty: 38 },
    { id: '3', sku: 'P-3001', name: 'Doohickey C', category: 'Parts', price: '$8.75', qty: 73 },
    { id: '4', sku: 'W-1002', name: 'Widget D', category: 'Widgets', price: '$15.00', qty: 12 },
    { id: '5', sku: 'G-2002', name: 'Gizmo E', category: 'Gadgets', price: '$42.00', qty: 5 },
    { id: '6', sku: 'P-3002', name: 'Thingamajig F', category: 'Parts', price: '$3.25', qty: 120 },
  ];

  function go(dispatchSystemCommand, cardId, param) {
    dispatchSystemCommand('nav.go', param ? { cardId: String(cardId), param: String(param) } : { cardId: String(cardId) });
  }

  return {
    id: 'demo',
    title: 'Demo App',
    initialCardState: {
      chat: {
        draft: '',
        history: [
          { role: 'assistant', text: "Hello! I'm the demo assistant. How can I help?" },
          { role: 'assistant', text: 'Try asking about low stock, reports, or settings.' },
        ],
      },
    },
    cards: {
      home: {
        render() {
          return ui.panel([
            ui.text('Demo Desktop App'),
            ui.button('📋 Browse Items', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
            ui.button('📊 Reports', { onClick: { handler: 'go', args: { cardId: 'report' } } }),
            ui.button('💬 Chat', { onClick: { handler: 'go', args: { cardId: 'chat' } } }),
            ui.button('⚙️ Settings', { onClick: { handler: 'go', args: { cardId: 'settings' } } }),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
        },
      },

      browse: {
        render() {
          return ui.panel([
            ui.text('Browse Items'),
            ui.table(
              ITEMS.map((item) => [item.sku, item.name, item.category, item.price, String(item.qty)]),
              { headers: ['SKU', 'Name', 'Category', 'Price', 'Qty'] }
            ),
            ui.row([
              ui.button('🏠 Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
              ui.button('📊 Reports', { onClick: { handler: 'go', args: { cardId: 'report' } } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
        },
      },

      report: {
        render() {
          return ui.panel([
            ui.text('Inventory Report'),
            ui.table(
              [
                ['Total Items', '156'],
                ['Total Value', '$4,230.00'],
                ['Low Stock Items', '3'],
                ['Out of Stock', '0'],
                ['Top Category', 'Parts (73 items)'],
                ['Avg. Price', '$17.75'],
                ['Last Restock', 'Feb 12, 2026'],
              ],
              { headers: ['Metric', 'Value'] }
            ),
            ui.row([
              ui.button('📄 Export CSV', { onClick: { handler: 'notify', args: { message: 'Export not implemented' } } }),
              ui.button('🔄 Refresh', { onClick: { handler: 'notify', args: { message: 'Data refreshed' } } }),
              ui.button('🏠 Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          notify({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('notify', { message: String(asRecord(args).message || '') });
          },
        },
      },

      chat: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const history = Array.isArray(state.history) ? state.history : [];
          const draft = String(state.draft || '');
          const lines = history.map((entry) => {
            const row = asRecord(entry);
            const role = String(row.role || 'assistant');
            const text = String(row.text || '');
            return ui.text((role === 'user' ? '🧑 ' : '🤖 ') + text);
          });

          return ui.panel([
            ui.text('Assistant'),
            ui.column(lines),
            ui.input(draft, { onChange: { handler: 'changeDraft' } }),
            ui.row([
              ui.button('Send', { onClick: { handler: 'send' } }),
              ui.button('🏠 Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          changeDraft({ dispatchCardAction }, args) {
            dispatchCardAction('set', {
              path: 'draft',
              value: asRecord(args).value,
            });
          },
          send({ cardState, dispatchCardAction }) {
            const state = asRecord(cardState);
            const draft = String(state.draft || '').trim();
            if (!draft) return;

            const history = Array.isArray(state.history) ? state.history : [];
            const nextHistory = history.concat([
              { role: 'user', text: draft },
              { role: 'assistant', text: 'Received: ' + draft },
            ]);

            dispatchCardAction('patch', {
              history: nextHistory.slice(-12),
              draft: '',
            });
          },
        },
      },

      settings: {
        render() {
          return ui.panel([
            ui.text('Settings'),
            ui.table(
              [
                ['Theme', 'Classic Mac'],
                ['Font Size', '14px'],
                ['Notifications', 'On'],
                ['Language', 'English'],
                ['Auto Save', 'Enabled'],
              ],
              { headers: ['Key', 'Value'] }
            ),
            ui.button('🏠 Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
        },
      },
    },
  };
});
