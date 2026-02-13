import { Act, type CardStackDefinition, defineCardStack, Ev, type FieldConfig, Sel, ui } from '@hypercard/engine';
import { itemColumns, salesColumns } from './columnConfigs';
import { inventoryComputedFields } from './computeFields';
import { formatCurrency } from './formatters';

const ITEM_FIELDS: FieldConfig[] = [
  { id: 'sku', label: 'SKU', type: 'readonly' },
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'category', label: 'Category', type: 'select', options: ['Accessories', 'Kitchen', 'Home', 'Merch'] },
  { id: 'price', label: 'Price ($)', type: 'number', step: 0.01 },
  { id: 'cost', label: 'Cost ($)', type: 'number', step: 0.01 },
  { id: 'qty', label: 'Quantity', type: 'number' },
  { id: 'tags', label: 'Tags', type: 'tags' },
];

const NEW_ITEM_FIELDS: FieldConfig[] = [
  { id: 'sku', label: 'SKU', type: 'text', placeholder: 'e.g. E-5001', required: true },
  { id: 'name', label: 'Name', type: 'text', placeholder: 'Item name', required: true },
  { id: 'category', label: 'Category', type: 'select', options: ['Accessories', 'Kitchen', 'Home', 'Merch'] },
  { id: 'price', label: 'Price ($)', type: 'number', step: 0.01 },
  { id: 'cost', label: 'Cost ($)', type: 'number', step: 0.01 },
  { id: 'qty', label: 'Initial Qty', type: 'number' },
];

const RECEIVE_FIELDS: FieldConfig[] = [
  { id: 'sku', label: 'SKU', type: 'text', placeholder: 'Scan or type SKU', required: true },
  { id: 'qty', label: 'Quantity', type: 'number', required: true },
  { id: 'note', label: 'Note', type: 'text', placeholder: 'PO#, condition…' },
];

const PRICE_CHECK_FIELDS: FieldConfig[] = [
  { id: 'sku', label: 'Scan / Type SKU', type: 'text', placeholder: 'e.g. A-1002', required: true },
];

export const STACK: CardStackDefinition = defineCardStack({
  id: 'inventory',
  name: 'Shop Inventory',
  icon: '📇',
  homeCard: 'home',
  stack: {
    state: {
      lowStockThreshold: 3,
      aiModel: 'Local LLM',
    },
  },
  cards: {
    home: {
      id: 'home',
      type: 'menu',
      title: 'Home',
      icon: '🏠',
      ui: ui.menu({
        key: 'homeMenu',
        icon: '📇',
        labels: [{ value: 'Welcome to Shop Inventory' }, { value: 'CardDefinition + JS API', style: 'muted' }],
        buttons: [
          { label: '📋 Browse Items', action: Act('nav.go', { card: 'browse' }) },
          { label: '⚠️ Low Stock', action: Act('nav.go', { card: 'lowStock' }) },
          { label: '💰 Sales Today', action: Act('nav.go', { card: 'salesToday' }) },
          { label: '📊 Inventory Report', action: Act('nav.go', { card: 'report' }) },
          { label: '📦 Receive Shipment', action: Act('nav.go', { card: 'receive' }) },
          { label: '💬 Ask AI', action: Act('nav.go', { card: 'assistant' }) },
          { label: '➕ New Item', action: Act('nav.go', { card: 'newItem' }) },
          { label: '🏷 Price Checker', action: Act('nav.go', { card: 'priceCheck' }) },
        ],
      }),
    },

    browse: {
      id: 'browse',
      type: 'list',
      title: 'Browse Inventory',
      icon: '📋',
      ui: ui.list({
        key: 'browseList',
        items: Sel('inventory.items', undefined, { from: 'shared' }),
        columns: Sel('inventory.columns', { kind: 'items' }, { from: 'shared' }),
        filters: [
          { field: 'category', type: 'select', options: ['All', 'Accessories', 'Kitchen', 'Home', 'Merch'] },
          { field: '_search', type: 'text', placeholder: 'Search name or SKU…' },
        ],
        searchFields: ['name', 'sku'],
        toolbar: [{ label: '➕ New', action: Act('nav.go', { card: 'newItem' }) }],
        rowKey: 'sku',
      }),
      bindings: {
        browseList: {
          rowClick: Act('nav.go', { card: 'itemDetail', param: Ev('row.sku') }),
        },
      },
    },

    lowStock: {
      id: 'lowStock',
      type: 'list',
      title: 'Low Stock',
      icon: '⚠️',
      ui: ui.list({
        key: 'lowStockList',
        items: Sel('inventory.lowStock', undefined, { from: 'shared' }),
        columns: Sel('inventory.columns', { kind: 'items' }, { from: 'shared' }),
        toolbar: [
          { label: '📧 Email Supplier', action: Act('toast.show', { message: 'Reorder email drafted (mock)' }) },
          { label: '🖨 Print', action: Act('toast.show', { message: 'Sent to printer (mock)' }) },
        ],
        rowKey: 'sku',
        emptyMessage: 'All stocked up! 🎉',
      }),
      bindings: {
        lowStockList: {
          rowClick: Act('nav.go', { card: 'itemDetail', param: Ev('row.sku') }),
        },
      },
    },

    salesToday: {
      id: 'salesToday',
      type: 'list',
      title: 'Sales Log',
      icon: '💰',
      ui: ui.list({
        key: 'salesList',
        items: Sel('sales.log', undefined, { from: 'shared' }),
        columns: Sel('inventory.columns', { kind: 'sales' }, { from: 'shared' }),
        filters: [
          { field: 'date', type: 'select', options: ['All', '2026-02-10', '2026-02-09', '2026-02-08', '2026-02-07'] },
        ],
        rowKey: 'id',
        footer: { type: 'sum', field: 'total', label: 'Total Revenue', format: formatCurrency },
      }),
      bindings: {
        salesList: {
          rowClick: Act('nav.go', { card: 'itemDetail', param: Ev('row.sku') }),
        },
      },
    },

    itemDetail: {
      id: 'itemDetail',
      type: 'detail',
      title: 'Item Detail',
      icon: '📦',
      state: {
        initial: {
          edits: {},
        },
      },
      ui: ui.detail({
        key: 'itemDetailView',
        record: Sel('inventory.itemByParam', undefined, { from: 'shared' }),
        fields: ITEM_FIELDS,
        computed: inventoryComputedFields,
        edits: Sel('state.edits'),
        actions: [
          {
            label: '🛒 Sell 1',
            action: Act('inventory.updateQty', {
              sku: Sel('inventory.paramSku', undefined, { from: 'shared' }),
              delta: -1,
            }),
            variant: 'primary',
          },
          {
            label: '🛒 Sell 5',
            action: Act('inventory.updateQty', {
              sku: Sel('inventory.paramSku', undefined, { from: 'shared' }),
              delta: -5,
            }),
          },
          {
            label: '📦 Receive +5',
            action: Act('inventory.updateQty', {
              sku: Sel('inventory.paramSku', undefined, { from: 'shared' }),
              delta: 5,
            }),
          },
          {
            label: '📦 Receive +10',
            action: Act('inventory.updateQty', {
              sku: Sel('inventory.paramSku', undefined, { from: 'shared' }),
              delta: 10,
            }),
          },
          {
            label: '✏️ Save Changes',
            action: Act('inventory.saveItem', {
              sku: Sel('inventory.paramSku', undefined, { from: 'shared' }),
              edits: Sel('state.edits'),
            }),
            variant: 'primary',
          },
          {
            label: '🗑 Delete',
            action: Act('inventory.deleteItem', { sku: Sel('inventory.paramSku', undefined, { from: 'shared' }) }),
            variant: 'danger',
          },
        ],
      }),
      bindings: {
        itemDetailView: {
          change: Act('state.setField', {
            scope: 'card',
            path: 'edits',
            key: Ev('field'),
            value: Ev('value'),
          }),
        },
      },
    },

    newItem: {
      id: 'newItem',
      type: 'form',
      title: 'New Item',
      icon: '➕',
      state: {
        initial: {
          formValues: {
            sku: '',
            name: '',
            category: 'Accessories',
            price: 0,
            cost: 0,
            qty: 0,
          },
          submitResult: '',
        },
      },
      ui: ui.form({
        key: 'newItemForm',
        fields: NEW_ITEM_FIELDS,
        values: Sel('state.formValues'),
        submitLabel: '💾 Create Item',
        submitResult: Sel('state.submitResult'),
      }),
      bindings: {
        newItemForm: {
          change: Act('state.setField', {
            scope: 'card',
            path: 'formValues',
            key: Ev('field'),
            value: Ev('value'),
          }),
          submit: Act('inventory.createItem', { values: Ev('values') }, { to: 'shared' }),
        },
      },
    },

    receive: {
      id: 'receive',
      type: 'form',
      title: 'Receive Shipment',
      icon: '📦',
      state: {
        initial: {
          formValues: {
            sku: '',
            qty: 1,
            note: '',
          },
          submitResult: '',
        },
      },
      ui: ui.form({
        key: 'receiveForm',
        fields: RECEIVE_FIELDS,
        values: Sel('state.formValues'),
        submitLabel: '📦 Receive Stock',
        submitResult: Sel('state.submitResult'),
      }),
      bindings: {
        receiveForm: {
          change: Act('state.setField', {
            scope: 'card',
            path: 'formValues',
            key: Ev('field'),
            value: Ev('value'),
          }),
          submit: Act('inventory.receiveStock', { values: Ev('values') }, { to: 'shared' }),
        },
      },
    },

    priceCheck: {
      id: 'priceCheck',
      type: 'form',
      title: 'Price Checker',
      icon: '🏷',
      state: {
        initial: {
          formValues: {
            sku: '',
          },
          submitResult: '',
        },
      },
      ui: ui.form({
        key: 'priceCheckForm',
        fields: PRICE_CHECK_FIELDS,
        values: Sel('state.formValues'),
        submitLabel: '🔍 Look Up Price',
        submitResult: Sel('state.submitResult'),
      }),
      bindings: {
        priceCheckForm: {
          change: Act('state.setField', {
            scope: 'card',
            path: 'formValues',
            key: Ev('field'),
            value: Ev('value'),
          }),
          submit: Act('inventory.priceCheck', { values: Ev('values') }, { to: 'shared' }),
        },
      },
    },

    report: {
      id: 'report',
      type: 'report',
      title: 'Inventory Report',
      icon: '📊',
      ui: ui.report({
        key: 'inventoryReport',
        sections: Sel('inventory.reportSections', undefined, { from: 'shared' }),
        actions: [
          { label: '🖨 Print', action: Act('toast.show', { message: 'Report sent to printer (mock)' }) },
          { label: '📧 Email', action: Act('toast.show', { message: 'Report emailed (mock)' }) },
        ],
      }),
    },

    assistant: {
      id: 'assistant',
      type: 'chat',
      title: 'AI Assistant',
      icon: '💬',
      ui: ui.chat({
        key: 'assistantChat',
        messages: Sel('chat.messages', undefined, { from: 'shared' }),
        suggestions: ["What's low stock?", 'Best selling item?', 'Show accessories', 'Total inventory value'],
      }),
      bindings: {
        assistantChat: {
          send: Act('chat.send', { text: Ev('text') }, { to: 'shared' }),
        },
      },
    },
  },
});

export const INVENTORY_COLUMNS = {
  items: itemColumns,
  sales: salesColumns,
};
