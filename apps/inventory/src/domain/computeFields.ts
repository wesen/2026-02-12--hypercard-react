import type { ComputedFieldConfig } from '@hypercard/engine';
import type { Item } from './types';

export const inventoryComputedFields: ComputedFieldConfig<Item>[] = [
  {
    id: 'margin',
    label: 'Margin',
    compute: (r) => `${(((r.price - r.cost) / r.price) * 100).toFixed(1)}%`,
  },
  {
    id: 'value',
    label: 'Inventory Value',
    compute: (r) => `$${(r.price * r.qty).toFixed(2)}`,
  },
];
