// @ts-check
/// <reference path="./pluginBundle.authoring.d.ts" />
defineStackBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function toMoney(value) {
    return '$' + toNumber(value, 0).toFixed(2);
  }

  function domains(globalState) {
    return asRecord(asRecord(globalState).domains);
  }

  function inventory(globalState) {
    return asRecord(domains(globalState).inventory);
  }

  function sales(globalState) {
    return asRecord(domains(globalState).sales);
  }

  function selectItems(globalState) {
    return asArray(inventory(globalState).items);
  }

  function selectSales(globalState) {
    return asArray(sales(globalState).log);
  }

  function navParam(globalState) {
    const param = asRecord(globalState).nav && asRecord(globalState).nav.param;
    return typeof param === 'string' ? param : '';
  }

  function threshold(sessionState) {
    const value = toNumber(asRecord(sessionState).lowStockThreshold, 3);
    return value > 0 ? value : 3;
  }

  function findItem(globalState, sku) {
    const normalized = String(sku || '').toLowerCase();
    return selectItems(globalState).find((item) => String(asRecord(item).sku || '').toLowerCase() === normalized) || null;
  }

  function reportRows(globalState, sessionState) {
    const items = selectItems(globalState);
    const low = threshold(sessionState);
    const totalSkus = items.length;
    const totalUnits = items.reduce((sum, item) => sum + toNumber(asRecord(item).qty, 0), 0);
    const retailValue = items.reduce(
      (sum, item) => sum + toNumber(asRecord(item).price, 0) * toNumber(asRecord(item).qty, 0),
      0
    );
    const costBasis = items.reduce(
      (sum, item) => sum + toNumber(asRecord(item).cost, 0) * toNumber(asRecord(item).qty, 0),
      0
    );
    const lowStockCount = items.filter((item) => toNumber(asRecord(item).qty, 0) <= low).length;
    const outOfStockCount = items.filter((item) => toNumber(asRecord(item).qty, 0) <= 0).length;
    const potentialProfit = retailValue - costBasis;
    const recentSalesTotal = selectSales(globalState).reduce((sum, sale) => sum + toNumber(asRecord(sale).total, 0), 0);

    return [
      ['Total SKUs', String(totalSkus)],
      ['Total Units', String(totalUnits)],
      ['Retail Value', toMoney(retailValue)],
      ['Cost Basis', toMoney(costBasis)],
      ['Potential Profit', toMoney(potentialProfit)],
      ['Low Stock Items', String(lowStockCount)],
      ['Out of Stock', String(outOfStockCount)],
      ['Sales (recent)', toMoney(recentSalesTotal)],
    ];
  }

  function itemRows(items) {
    return items.map((item) => {
      const row = asRecord(item);
      return [
        String(row.sku || ''),
        String(row.name || ''),
        String(row.category || ''),
        toMoney(row.price),
        String(toNumber(row.qty, 0)),
      ];
    });
  }

  function salesRows(entries) {
    return entries.map((sale) => {
      const row = asRecord(sale);
      return [
        String(row.id || ''),
        String(row.date || ''),
        String(row.sku || ''),
        String(toNumber(row.qty, 0)),
        toMoney(row.total),
      ];
    });
  }

  function parseTags(value) {
    return String(value || '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  function assistantReply(text, globalState, sessionState) {
    const lower = String(text || '').toLowerCase();
    const items = selectItems(globalState);
    if (lower.includes('low stock') || lower.includes('reorder')) {
      const low = threshold(sessionState);
      const rows = items
        .filter((item) => toNumber(asRecord(item).qty, 0) <= low)
        .map((item) => {
          const row = asRecord(item);
          return String(row.sku || '?') + ' (' + String(toNumber(row.qty, 0)) + ')';
        })
        .slice(0, 6);
      return rows.length ? 'Low stock: ' + rows.join(', ') : 'No low-stock items right now.';
    }

    if (lower.includes('value') || lower.includes('worth')) {
      const total = items.reduce(
        (sum, item) => sum + toNumber(asRecord(item).price, 0) * toNumber(asRecord(item).qty, 0),
        0
      );
      return 'Total retail inventory value is ' + toMoney(total) + '.';
    }

    if (lower.includes('sales')) {
      const total = selectSales(globalState).reduce((sum, sale) => sum + toNumber(asRecord(sale).total, 0), 0);
      return 'Recent sales total is ' + toMoney(total) + '.';
    }

    return 'Try asking about low stock, sales, or total value.';
  }

  return {
    id: 'inventory',
    title: 'Shop Inventory',
    initialSessionState: {
      lowStockThreshold: 3,
      aiModel: 'Local LLM',
    },
    initialCardState: {
      itemDetail: { edits: {} },
      newItem: {
        form: { sku: '', name: '', category: 'Accessories', price: 0, cost: 0, qty: 0 },
        submitResult: '',
      },
      receive: { form: { sku: '', qty: 1, note: '' }, submitResult: '' },
      priceCheck: { form: { sku: '' }, submitResult: '' },
      assistant: { draft: '', history: [] },
    },
    cards: {
      home: {
        render() {
          return ui.panel([
            ui.text('Welcome to Shop Inventory'),
            ui.text('Plugin DSL runtime'),
            ui.button('📋 Browse Items', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
            ui.button('⚠️ Low Stock', { onClick: { handler: 'go', args: { cardId: 'lowStock' } } }),
            ui.button('💰 Sales Today', { onClick: { handler: 'go', args: { cardId: 'salesToday' } } }),
            ui.button('📊 Inventory Report', { onClick: { handler: 'go', args: { cardId: 'report' } } }),
            ui.button('📦 Receive Shipment', { onClick: { handler: 'go', args: { cardId: 'receive' } } }),
            ui.button('💬 Ask AI', { onClick: { handler: 'go', args: { cardId: 'assistant' } } }),
            ui.button('➕ New Item', { onClick: { handler: 'go', args: { cardId: 'newItem' } } }),
            ui.button('🏷 Price Checker', { onClick: { handler: 'go', args: { cardId: 'priceCheck' } } }),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', { cardId: String(asRecord(args).cardId || 'home') });
          },
        },
      },

      browse: {
        render({ globalState }) {
          const items = selectItems(globalState);
          const quickOpen = items.slice(0, 10).map((item) => {
            const row = asRecord(item);
            const sku = String(row.sku || '');
            return ui.button('Open ' + sku, { onClick: { handler: 'open', args: { sku } } });
          });

          return ui.panel([
            ui.text('Browse Inventory (' + items.length + ' items)'),
            ui.table(itemRows(items), { headers: ['SKU', 'Name', 'Category', 'Price', 'Qty'] }),
            ui.text('Quick open:'),
            ui.column(quickOpen),
            ui.row([
              ui.button('➕ New Item', { onClick: { handler: 'go', args: { cardId: 'newItem' } } }),
              ui.button('🏠 Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', { cardId: String(asRecord(args).cardId || 'home') });
          },
          open({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', {
              cardId: 'itemDetail',
              param: String(asRecord(args).sku || ''),
            });
          },
        },
      },

      lowStock: {
        render({ globalState, sessionState }) {
          const low = threshold(sessionState);
          const items = selectItems(globalState).filter((item) => toNumber(asRecord(item).qty, 0) <= low);
          const quickOpen = items.slice(0, 10).map((item) => {
            const row = asRecord(item);
            const sku = String(row.sku || '');
            return ui.button('Open ' + sku, { onClick: { handler: 'open', args: { sku } } });
          });

          return ui.panel([
            ui.text('Low Stock (threshold ≤ ' + String(low) + ')'),
            ui.table(itemRows(items), { headers: ['SKU', 'Name', 'Category', 'Price', 'Qty'] }),
            items.length === 0 ? ui.badge('All stocked up') : ui.text('Quick open:'),
            ui.column(quickOpen),
            ui.row([
              ui.button('📧 Email Supplier', { onClick: { handler: 'notify', args: { message: 'Reorder email drafted (mock)' } } }),
              ui.button('🖨 Print', { onClick: { handler: 'notify', args: { message: 'Sent to printer (mock)' } } }),
            ]),
          ]);
        },
        handlers: {
          open({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', {
              cardId: 'itemDetail',
              param: String(asRecord(args).sku || ''),
            });
          },
          notify({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('notify', { message: String(asRecord(args).message || '') });
          },
        },
      },

      salesToday: {
        render({ globalState }) {
          const entries = selectSales(globalState);
          const quickOpen = entries.slice(0, 10).map((sale) => {
            const row = asRecord(sale);
            const sku = String(row.sku || '');
            return ui.button('Open item ' + sku, { onClick: { handler: 'open', args: { sku } } });
          });

          const total = entries.reduce((sum, sale) => sum + toNumber(asRecord(sale).total, 0), 0);

          return ui.panel([
            ui.text('Sales Log (' + entries.length + ' entries)'),
            ui.table(salesRows(entries), { headers: ['ID', 'Date', 'SKU', 'Qty', 'Total'] }),
            ui.badge('Total Revenue: ' + toMoney(total)),
            ui.text('Quick open sold SKU:'),
            ui.column(quickOpen),
          ]);
        },
        handlers: {
          open({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', {
              cardId: 'itemDetail',
              param: String(asRecord(args).sku || ''),
            });
          },
        },
      },

      itemDetail: {
        render({ cardState, globalState }) {
          const sku = navParam(globalState);
          const record = findItem(globalState, sku);
          if (!record) {
            return ui.panel([
              ui.text('Item not found: ' + String(sku || '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const edits = asRecord(asRecord(cardState).edits);
          const current = { ...asRecord(record), ...edits };

          return ui.panel([
            ui.text('Item Detail: ' + String(current.sku || '')), 
            ui.row([
              ui.text('Name:'),
              ui.input(String(current.name || ''), { onChange: { handler: 'change', args: { field: 'name' } } }),
            ]),
            ui.row([
              ui.text('Category:'),
              ui.input(String(current.category || ''), { onChange: { handler: 'change', args: { field: 'category' } } }),
            ]),
            ui.row([
              ui.text('Price:'),
              ui.input(String(toNumber(current.price, 0)), { onChange: { handler: 'change', args: { field: 'price' } } }),
            ]),
            ui.row([
              ui.text('Cost:'),
              ui.input(String(toNumber(current.cost, 0)), { onChange: { handler: 'change', args: { field: 'cost' } } }),
            ]),
            ui.row([
              ui.text('Qty:'),
              ui.input(String(toNumber(current.qty, 0)), { onChange: { handler: 'change', args: { field: 'qty' } } }),
            ]),
            ui.row([
              ui.text('Tags:'),
              ui.input(asArray(current.tags).join(', '), { onChange: { handler: 'change', args: { field: 'tags' } } }),
            ]),
            ui.row([
              ui.button('🛒 Sell 1', { onClick: { handler: 'delta', args: { delta: -1 } } }),
              ui.button('🛒 Sell 5', { onClick: { handler: 'delta', args: { delta: -5 } } }),
              ui.button('📦 Receive +5', { onClick: { handler: 'delta', args: { delta: 5 } } }),
              ui.button('📦 Receive +10', { onClick: { handler: 'delta', args: { delta: 10 } } }),
            ]),
            ui.row([
              ui.button('✏️ Save Changes', { onClick: { handler: 'save' } }),
              ui.button('🗑 Delete', { onClick: { handler: 'remove' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          back({ dispatchSystemCommand }) {
            dispatchSystemCommand('nav.back');
          },
          change({ dispatchCardAction }, args) {
            const field = String(asRecord(args).field || '');
            const value = asRecord(args).value;
            if (!field) return;

            let nextValue = value;
            if (field === 'qty' || field === 'price' || field === 'cost') {
              nextValue = toNumber(value, 0);
            }
            if (field === 'tags') {
              nextValue = parseTags(value);
            }

            dispatchCardAction('set', {
              path: 'edits.' + field,
              value: nextValue,
            });
          },
          delta({ dispatchDomainAction, globalState }, args) {
            const sku = navParam(globalState);
            if (!sku) return;
            dispatchDomainAction('inventory', 'updateQty', {
              sku,
              delta: toNumber(asRecord(args).delta, 0),
            });
          },
          save({ dispatchCardAction, dispatchDomainAction, dispatchSystemCommand, cardState, globalState }) {
            const sku = navParam(globalState);
            if (!sku) return;
            dispatchDomainAction('inventory', 'saveItem', {
              sku,
              edits: asRecord(asRecord(cardState).edits),
            });
            dispatchCardAction('patch', { edits: {} });
            dispatchSystemCommand('notify', { message: 'Saved ' + sku });
          },
          remove({ dispatchDomainAction, dispatchSystemCommand, globalState }) {
            const sku = navParam(globalState);
            if (!sku) return;
            dispatchDomainAction('inventory', 'deleteItem', { sku });
            dispatchSystemCommand('notify', { message: 'Deleted ' + sku });
            dispatchSystemCommand('nav.back');
          },
        },
      },

      newItem: {
        render({ cardState }) {
          const form = asRecord(asRecord(cardState).form);
          const submitResult = String(asRecord(cardState).submitResult || '');
          return ui.panel([
            ui.text('Create New Item'),
            ui.row([
              ui.text('SKU:'),
              ui.input(String(form.sku || ''), { onChange: { handler: 'change', args: { field: 'sku' } } }),
            ]),
            ui.row([
              ui.text('Name:'),
              ui.input(String(form.name || ''), { onChange: { handler: 'change', args: { field: 'name' } } }),
            ]),
            ui.row([
              ui.text('Category:'),
              ui.input(String(form.category || ''), { onChange: { handler: 'change', args: { field: 'category' } } }),
            ]),
            ui.row([
              ui.text('Price:'),
              ui.input(String(toNumber(form.price, 0)), { onChange: { handler: 'change', args: { field: 'price' } } }),
            ]),
            ui.row([
              ui.text('Cost:'),
              ui.input(String(toNumber(form.cost, 0)), { onChange: { handler: 'change', args: { field: 'cost' } } }),
            ]),
            ui.row([
              ui.text('Qty:'),
              ui.input(String(toNumber(form.qty, 0)), { onChange: { handler: 'change', args: { field: 'qty' } } }),
            ]),
            submitResult ? ui.badge(submitResult) : ui.text(''),
            ui.row([
              ui.button('💾 Create Item', { onClick: { handler: 'submit' } }),
              ui.button('🏠 Home', { onClick: { handler: 'goHome' } }),
            ]),
          ]);
        },
        handlers: {
          change({ dispatchCardAction }, args) {
            const field = String(asRecord(args).field || '');
            if (!field) return;
            let value = asRecord(args).value;
            if (field === 'price' || field === 'cost' || field === 'qty') {
              value = toNumber(value, 0);
            }
            dispatchCardAction('set', {
              path: 'form.' + field,
              value,
            });
          },
          submit({ dispatchCardAction, dispatchDomainAction, dispatchSystemCommand, cardState }) {
            const form = asRecord(asRecord(cardState).form);
            const sku = String(form.sku || '').trim();
            const name = String(form.name || '').trim();
            if (!sku || !name) {
              dispatchCardAction('set', {
                path: 'submitResult',
                value: '❌ SKU and Name are required',
              });
              return;
            }

            dispatchDomainAction('inventory', 'createItem', {
              sku,
              name,
              category: String(form.category || 'Accessories'),
              price: toNumber(form.price, 0),
              cost: toNumber(form.cost, 0),
              qty: toNumber(form.qty, 0),
              tags: [],
            });

            dispatchCardAction('patch', {
              form: { sku: '', name: '', category: 'Accessories', price: 0, cost: 0, qty: 0 },
              submitResult: '✅ Created ' + sku,
            });
            dispatchSystemCommand('notify', { message: 'Created ' + sku });
          },
          goHome({ dispatchSystemCommand }) {
            dispatchSystemCommand('nav.go', { cardId: 'home' });
          },
        },
      },

      receive: {
        render({ cardState }) {
          const form = asRecord(asRecord(cardState).form);
          const submitResult = String(asRecord(cardState).submitResult || '');
          return ui.panel([
            ui.text('Receive Shipment'),
            ui.row([
              ui.text('SKU:'),
              ui.input(String(form.sku || ''), { onChange: { handler: 'change', args: { field: 'sku' } } }),
            ]),
            ui.row([
              ui.text('Qty:'),
              ui.input(String(toNumber(form.qty, 1)), { onChange: { handler: 'change', args: { field: 'qty' } } }),
            ]),
            ui.row([
              ui.text('Note:'),
              ui.input(String(form.note || ''), { onChange: { handler: 'change', args: { field: 'note' } } }),
            ]),
            submitResult ? ui.badge(submitResult) : ui.text(''),
            ui.button('📦 Receive Stock', { onClick: { handler: 'submit' } }),
          ]);
        },
        handlers: {
          change({ dispatchCardAction }, args) {
            const field = String(asRecord(args).field || '');
            if (!field) return;
            let value = asRecord(args).value;
            if (field === 'qty') {
              value = toNumber(value, 0);
            }
            dispatchCardAction('set', {
              path: 'form.' + field,
              value,
            });
          },
          submit({ dispatchCardAction, dispatchDomainAction, dispatchSystemCommand, cardState }) {
            const form = asRecord(asRecord(cardState).form);
            const sku = String(form.sku || '').trim();
            const qty = toNumber(form.qty, 0);
            if (!sku || qty <= 0) {
              dispatchCardAction('set', {
                path: 'submitResult',
                value: '❌ SKU and qty are required',
              });
              return;
            }

            dispatchDomainAction('inventory', 'receiveStock', { sku, qty });
            dispatchCardAction('patch', {
              form: { sku: '', qty: 1, note: '' },
              submitResult: '✅ Received +' + String(qty) + ' for ' + sku,
            });
            dispatchSystemCommand('notify', { message: 'Received stock for ' + sku });
          },
        },
      },

      priceCheck: {
        render({ cardState }) {
          const form = asRecord(asRecord(cardState).form);
          const submitResult = String(asRecord(cardState).submitResult || '');
          return ui.panel([
            ui.text('Price Checker'),
            ui.row([
              ui.text('SKU:'),
              ui.input(String(form.sku || ''), { onChange: { handler: 'change', args: { field: 'sku' } } }),
            ]),
            submitResult ? ui.badge(submitResult) : ui.text(''),
            ui.button('🔍 Look Up Price', { onClick: { handler: 'submit' } }),
          ]);
        },
        handlers: {
          change({ dispatchCardAction }, args) {
            dispatchCardAction('set', {
              path: 'form.sku',
              value: String(asRecord(args).value || ''),
            });
          },
          submit({ dispatchCardAction, cardState, globalState }) {
            const sku = String(asRecord(asRecord(cardState).form).sku || '').trim();
            const item = findItem(globalState, sku);
            if (!item) {
              dispatchCardAction('set', {
                path: 'submitResult',
                value: '❌ SKU "' + sku + '" not found',
              });
              return;
            }
            dispatchCardAction('set', {
              path: 'submitResult',
              value:
                '✅ ' +
                String(asRecord(item).name || '') +
                ' — ' +
                toMoney(asRecord(item).price) +
                ' (' +
                String(toNumber(asRecord(item).qty, 0)) +
                ' in stock)',
            });
          },
        },
      },

      report: {
        render({ globalState, sessionState }) {
          return ui.panel([
            ui.text('Inventory Report'),
            ui.table(reportRows(globalState, sessionState), { headers: ['Metric', 'Value'] }),
            ui.row([
              ui.button('🖨 Print', { onClick: { handler: 'notify', args: { message: 'Report sent to printer (mock)' } } }),
              ui.button('📧 Email', { onClick: { handler: 'notify', args: { message: 'Report emailed (mock)' } } }),
            ]),
          ]);
        },
        handlers: {
          notify({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('notify', { message: String(asRecord(args).message || '') });
          },
        },
      },

      assistant: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const draft = String(state.draft || '');
          const history = asArray(state.history).slice(-12);
          const timeline = history.map((entry) => {
            const row = asRecord(entry);
            const role = String(row.role || 'ai');
            const text = String(row.text || '');
            return ui.text((role === 'user' ? 'You: ' : 'AI: ') + text);
          });

          return ui.panel([
            ui.text('AI Assistant'),
            ui.column(timeline),
            ui.row([
              ui.input(draft, { onChange: { handler: 'changeDraft' }, placeholder: 'Ask about stock, sales, value…' }),
              ui.button('Send', { onClick: { handler: 'send' } }),
            ]),
            ui.row([
              ui.button('Low stock?', { onClick: { handler: 'suggest', args: { text: 'low stock' } } }),
              ui.button('Total value?', { onClick: { handler: 'suggest', args: { text: 'total value' } } }),
              ui.button('Sales?', { onClick: { handler: 'suggest', args: { text: 'sales' } } }),
            ]),
          ]);
        },
        handlers: {
          changeDraft({ dispatchCardAction }, args) {
            dispatchCardAction('set', {
              path: 'draft',
              value: String(asRecord(args).value || ''),
            });
          },
          suggest({ dispatchCardAction }, args) {
            dispatchCardAction('set', {
              path: 'draft',
              value: String(asRecord(args).text || ''),
            });
          },
          send({ dispatchCardAction, cardState, globalState, sessionState }, args) {
            const state = asRecord(cardState);
            const explicit = String(asRecord(args).text || '').trim();
            const draft = String(state.draft || '').trim();
            const text = explicit || draft;
            if (!text) return;

            const response = assistantReply(text, globalState, sessionState);
            const history = asArray(state.history).concat([
              { role: 'user', text },
              { role: 'ai', text: response },
            ]);

            dispatchCardAction('patch', {
              draft: '',
              history: history.slice(-12),
            });
          },
        },
      },
    },
  };
});
