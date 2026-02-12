export interface Item {
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  qty: number;
  tags: string[];
  [key: string]: unknown;
}

export interface SaleEntry {
  id: string;
  date: string;
  sku: string;
  qty: number;
  total: number;
  [key: string]: unknown;
}

export interface InventorySettings {
  aiModel: string;
  lowStockThreshold: number;
  [key: string]: unknown;
}

export interface InventoryData {
  items: Item[];
  salesLog: SaleEntry[];
  [tableName: string]: Record<string, unknown>[];
}
