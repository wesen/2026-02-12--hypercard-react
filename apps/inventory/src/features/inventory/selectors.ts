import type { Item } from '../../domain/types';

export interface InventoryStateSlice {
  inventory: { items: Item[] };
}

export const selectItems = (state: InventoryStateSlice) => state.inventory.items;
export const selectItemBySku = (sku: string) => (state: InventoryStateSlice) =>
  state.inventory.items.find((i) => i.sku === sku);
