import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Item } from '../../domain/types';
import { STACK } from '../../domain/stack';

interface InventoryState { items: Item[] }

const initialState: InventoryState = {
  items: JSON.parse(JSON.stringify(STACK.data.items)),
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    updateQty(state, action: PayloadAction<{ sku: string; delta: number }>) {
      const item = state.items.find((i) => i.sku === action.payload.sku);
      if (item) item.qty = Math.max(0, item.qty + action.payload.delta);
    },
    saveItem(state, action: PayloadAction<{ sku: string; edits: Partial<Item> }>) {
      const idx = state.items.findIndex((i) => i.sku === action.payload.sku);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload.edits };
    },
    deleteItem(state, action: PayloadAction<{ sku: string }>) {
      state.items = state.items.filter((i) => i.sku !== action.payload.sku);
    },
    createItem(state, action: PayloadAction<Item>) {
      state.items.push({ ...action.payload, tags: action.payload.tags ?? [] });
    },
    receiveStock(state, action: PayloadAction<{ sku: string; qty: number }>) {
      const item = state.items.find((i) => i.sku.toLowerCase() === action.payload.sku.toLowerCase());
      if (item) item.qty += action.payload.qty;
    },
  },
});

export const { updateQty, saveItem, deleteItem, createItem, receiveStock } = inventorySlice.actions;
export const inventoryReducer = inventorySlice.reducer;
