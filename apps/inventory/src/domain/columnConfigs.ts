import type { ColumnConfig } from '@hypercard/engine';
import type { Item, SaleEntry } from './types';
import { formatCurrency, qtyState } from './formatters';

export function itemColumns(threshold: number): ColumnConfig<Item>[] {
  return [
    { key: 'sku', label: 'SKU', width: 65 },
    { key: 'qty', label: 'QTY', width: 35, cellState: (v) => qtyState(threshold)(v) },
    { key: 'price', label: 'PRICE', width: 55, format: (v) => formatCurrency(v), align: 'right' },
    { key: 'name', label: 'NAME', width: '1fr' },
    { key: 'category', label: 'CATEGORY', width: 80 },
  ];
}

export function salesColumns(): ColumnConfig<SaleEntry>[] {
  return [
    { key: 'date', label: 'DATE', width: 78 },
    { key: 'sku', label: 'SKU', width: 65 },
    { key: 'qty', label: 'QTY', width: 35 },
    { key: 'total', label: 'TOTAL', width: 58, format: (v) => formatCurrency(v), align: 'right' },
  ];
}
