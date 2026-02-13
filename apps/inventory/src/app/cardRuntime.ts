import {
  Act,
  type SharedActionRegistry,
  type SharedSelectorRegistry,
  type ChatMessage,
} from '@hypercard/engine';
import { itemColumns, salesColumns } from '../domain/columnConfigs';
import { computeReportSections } from '../domain/reportCompute';
import type { Item } from '../domain/types';
import { selectMessages, type ChatStateSlice } from '../features/chat/selectors';
import { addMessages } from '../features/chat/chatSlice';
import { selectItems, type InventoryStateSlice } from '../features/inventory/selectors';
import {
  createItem,
  deleteItem,
  receiveStock,
  saveItem,
  updateQty,
} from '../features/inventory/inventorySlice';
import { selectSalesLog, type SalesStateSlice } from '../features/sales/selectors';

export type InventoryRootState = InventoryStateSlice & SalesStateSlice & ChatStateSlice;

export const inventorySharedSelectors: SharedSelectorRegistry<InventoryRootState> = {
  'inventory.items': (state) => selectItems(state),
  'sales.log': (state) => selectSalesLog(state),
  'chat.messages': (state) => selectMessages(state),

  'inventory.columns': (_state, args, ctx) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const threshold = Number(ctx.getMergedScopedState().lowStockThreshold ?? 3);
    return data.kind === 'sales' ? salesColumns() : itemColumns(threshold);
  },

  'inventory.lowStock': (state, _args, ctx) => {
    const threshold = Number(ctx.getMergedScopedState().lowStockThreshold ?? 3);
    return selectItems(state).filter((item) => item.qty <= threshold);
  },

  'inventory.paramSku': (_state, _args, ctx) => String(ctx.params.param ?? ''),

  'inventory.itemByParam': (state, _args, ctx) => {
    const sku = String(ctx.params.param ?? '');
    return selectItems(state).find((item) => item.sku === sku) ?? null;
  },

  'inventory.reportSections': (state, _args, ctx) => {
    const items = selectItems(state);
    const sales = selectSalesLog(state);
    const threshold = Number(ctx.getMergedScopedState().lowStockThreshold ?? 3);
    const report = computeReportSections(items, sales, threshold);
    return [
      { label: 'Total SKUs', value: report.totalSkus },
      { label: 'Total Units', value: report.totalUnits },
      { label: 'Retail Value', value: report.retailValue },
      { label: 'Cost Basis', value: report.costBasis },
      { label: 'Potential Profit', value: report.potentialProfit },
      { label: 'Low Stock Items', value: report.lowStockCount },
      { label: 'Out of Stock', value: report.outOfStockCount },
      { label: 'Best Margin', value: report.bestMargin },
      { label: 'Sales (last 3 days)', value: report.recentSalesTotal },
    ];
  },
};

function parseItem(values: Record<string, unknown>): Item {
  return {
    sku: String(values.sku ?? ''),
    name: String(values.name ?? ''),
    category: String(values.category ?? 'Accessories'),
    price: Number(values.price ?? 0),
    cost: Number(values.cost ?? 0),
    qty: Number(values.qty ?? 0),
    tags: Array.isArray(values.tags) ? values.tags.map((x) => String(x)) : [],
  };
}

export const inventorySharedActions: SharedActionRegistry<InventoryRootState> = {
  'inventory.updateQty': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(updateQty({ sku: String(data.sku ?? ''), delta: Number(data.delta ?? 0) }));
  },

  'inventory.saveItem': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(saveItem({
      sku: String(data.sku ?? ''),
      edits: (data.edits ?? {}) as Partial<Item>,
    }));
    ctx.patchScopedState('card', { edits: {} });
  },

  'inventory.deleteItem': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(deleteItem({ sku: String(data.sku ?? '') }));
    ctx.nav.back();
  },

  'inventory.createItem': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const item = parseItem(values);
    if (!item.sku || !item.name) {
      ctx.patchScopedState('card', { submitResult: '❌ SKU and Name are required' });
      return;
    }
    ctx.dispatch(createItem(item));
    ctx.patchScopedState('card', {
      submitResult: `✅ Created ${item.sku}`,
      formValues: {
        sku: '',
        name: '',
        category: 'Accessories',
        price: 0,
        cost: 0,
        qty: 0,
      },
    });
  },

  'inventory.receiveStock': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const sku = String(values.sku ?? '');
    const qty = Number(values.qty ?? 0);
    if (!sku || !qty) {
      ctx.patchScopedState('card', { submitResult: '❌ SKU and qty are required' });
      return;
    }

    ctx.dispatch(receiveStock({ sku, qty }));
    ctx.patchScopedState('card', {
      submitResult: `✅ Received +${qty} for ${sku}`,
      formValues: { sku: '', qty: 1, note: '' },
    });
  },

  'inventory.priceCheck': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const sku = String(values.sku ?? '').toLowerCase();
    const state = ctx.getState() as InventoryRootState;
    const found = selectItems(state).find((item) => item.sku.toLowerCase() === sku);

    if (found) {
      ctx.patchScopedState('card', {
        submitResult: `✅ ${found.name} — $${found.price.toFixed(2)} (${found.qty} in stock)`,
      });
      return;
    }

    ctx.patchScopedState('card', {
      submitResult: `❌ SKU "${values.sku ?? ''}" not found`,
    });
  },

  'chat.send': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const text = String(data.text ?? '').trim();
    if (!text) return;

    const state = ctx.getState() as InventoryRootState;
    const items = selectItems(state);
    const sales = selectSalesLog(state);
    const lower = text.toLowerCase();

    const userMessage: ChatMessage = { role: 'user', text };

    let aiMessage: ChatMessage;

    if (lower.includes('low stock') || lower.includes('reorder')) {
      const threshold = Number(ctx.getMergedScopedState().lowStockThreshold ?? 3);
      const low = items.filter((item) => item.qty <= threshold);
      aiMessage = {
        role: 'ai',
        text: `Items at or below low-stock threshold (${threshold}):`,
        results: low,
        actions: [{ label: '📋 Open Low Stock', action: Act('nav.go', { card: 'lowStock' }) }],
      };
    } else if (lower.includes('value') || lower.includes('worth')) {
      const retail = items.reduce((a, i) => a + i.price * i.qty, 0);
      aiMessage = {
        role: 'ai',
        text: `Total retail value: $${retail.toFixed(2)}`,
        actions: [{ label: '📊 Open Report', action: Act('nav.go', { card: 'report' }) }],
      };
    } else if (lower.includes('sales')) {
      aiMessage = {
        role: 'ai',
        text: 'Recent sales:',
        results: sales.slice(0, 5),
        actions: [{ label: '💰 Open Sales Log', action: Act('nav.go', { card: 'salesToday' }) }],
      };
    } else {
      aiMessage = {
        role: 'ai',
        text: 'I can help with low stock, sales, and inventory value. Try: "low stock" or "total value".',
        actions: [
          { label: '⚠️ Low Stock', action: Act('chat.send', { text: 'low stock' }, { to: 'shared' }) },
          { label: '📊 Inventory Value', action: Act('chat.send', { text: 'total value' }, { to: 'shared' }) },
        ],
      };
    }

    ctx.dispatch(addMessages([userMessage, aiMessage]));
  },
};
