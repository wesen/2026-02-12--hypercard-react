import type { Item, SaleEntry } from './types';

export const ITEMS: Item[] = [
  { sku: 'A-1002', qty: 2, price: 9.99, cost: 3.25, name: 'Keychain - Brass', category: 'Accessories', tags: ['gift', 'sale'] },
  { sku: 'A-1021', qty: 0, price: 8.99, cost: 2.8, name: 'Keychain - Silver', category: 'Accessories', tags: ['gift'] },
  { sku: 'A-1033', qty: 5, price: 7.99, cost: 2.1, name: 'Keychain - Steel', category: 'Accessories', tags: ['new'] },
  { sku: 'A-1055', qty: 1, price: 12.99, cost: 4.5, name: 'Ring - Copper Band', category: 'Accessories', tags: ['artisan'] },
  { sku: 'B-2001', qty: 14, price: 24.99, cost: 8, name: 'Mug - Ceramic Blue', category: 'Kitchen', tags: ['popular'] },
  { sku: 'B-2015', qty: 3, price: 19.99, cost: 7.5, name: 'Mug - Hand-thrown', category: 'Kitchen', tags: ['artisan'] },
  { sku: 'C-3010', qty: 0, price: 34.99, cost: 12, name: 'Candle - Beeswax Lg', category: 'Home', tags: ['seasonal'] },
  { sku: 'C-3011', qty: 8, price: 14.99, cost: 5, name: 'Candle - Soy Sm', category: 'Home', tags: ['popular', 'gift'] },
  { sku: 'D-4001', qty: 20, price: 4.99, cost: 1.2, name: 'Sticker Pack - Logo', category: 'Merch', tags: ['cheap', 'popular'] },
  { sku: 'D-4002', qty: 6, price: 18.99, cost: 6, name: 'Tote Bag - Canvas', category: 'Merch', tags: ['new', 'eco'] },
];

export const SALES_LOG: SaleEntry[] = [
  { id: 's1', date: '2026-02-10', sku: 'A-1002', qty: 2, total: 19.98 },
  { id: 's2', date: '2026-02-10', sku: 'B-2001', qty: 1, total: 24.99 },
  { id: 's3', date: '2026-02-09', sku: 'A-1002', qty: 3, total: 29.97 },
  { id: 's4', date: '2026-02-09', sku: 'D-4001', qty: 5, total: 24.95 },
  { id: 's5', date: '2026-02-08', sku: 'A-1002', qty: 4, total: 39.96 },
  { id: 's6', date: '2026-02-08', sku: 'C-3011', qty: 2, total: 29.98 },
  { id: 's7', date: '2026-02-07', sku: 'B-2015', qty: 1, total: 19.99 },
];
