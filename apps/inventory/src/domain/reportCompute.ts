import type { Item, SaleEntry } from './types';

export function computeReportSections(
  items: Item[],
  sales: SaleEntry[],
  threshold: number,
): Record<string, string> {
  return {
    totalSkus: String(items.length),
    totalUnits: String(items.reduce((a, i) => a + i.qty, 0)),
    retailValue: '$' + items.reduce((a, i) => a + i.price * i.qty, 0).toFixed(2),
    costBasis: '$' + items.reduce((a, i) => a + i.cost * i.qty, 0).toFixed(2),
    potentialProfit: '$' + items.reduce((a, i) => a + (i.price - i.cost) * i.qty, 0).toFixed(2),
    lowStockCount: String(items.filter((i) => i.qty <= threshold && i.qty > 0).length),
    outOfStockCount: String(items.filter((i) => i.qty === 0).length),
    bestMargin: (() => {
      const sorted = [...items].sort((a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price);
      return sorted[0] ? `${sorted[0].sku} ${sorted[0].name} (${((sorted[0].price - sorted[0].cost) / sorted[0].price * 100).toFixed(0)}%)` : '—';
    })(),
    recentSalesTotal: '$' + sales.filter((s) => s.date >= '2026-02-08').reduce((a, s) => a + s.total, 0).toFixed(2),
  };
}
