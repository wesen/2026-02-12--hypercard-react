import {
  createDomainActionHandler,
  defineActionRegistry,
  goBack,
} from '@hypercard/engine';
import { updateQty, saveItem, deleteItem, createItem, receiveStock } from '../features/inventory/inventorySlice';
import type { Item } from '../domain/types';

const inventoryActionRegistry = defineActionRegistry({
  updateQty: {
    actionCreator: updateQty,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return { sku: String(a.sku ?? ''), delta: Number(a.delta ?? 0) };
    },
    toast: (payload) => `${payload.delta > 0 ? '+' : ''}${payload.delta} qty for ${payload.sku}`,
  },
  saveItem: {
    actionCreator: saveItem,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return { sku: String(a.sku ?? ''), edits: (a.edits ?? {}) as Partial<Item> };
    },
    toast: (payload) => `Saved ${payload.sku}`,
  },
  deleteItem: {
    actionCreator: deleteItem,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return { sku: String(a.sku ?? '') };
    },
    effect: ({ dispatch }) => {
      dispatch(goBack());
    },
    toast: (payload) => `Deleted ${payload.sku}`,
  },
  createItem: {
    actionCreator: createItem,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return (a.values ?? {}) as Item;
    },
    toast: (payload) => `Created ${payload.sku}`,
  },
  receiveStock: {
    actionCreator: receiveStock,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      const values = (a.values ?? {}) as { sku?: unknown; qty?: unknown };
      return { sku: String(values.sku ?? ''), qty: Number(values.qty ?? 0) };
    },
    toast: (payload) =>
      payload.sku && payload.qty
        ? `Received +${payload.qty} for ${payload.sku}`
        : undefined,
  },
});

export const inventoryActionHandler = createDomainActionHandler(inventoryActionRegistry);
