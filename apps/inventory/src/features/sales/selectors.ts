import type { SaleEntry } from '../../domain/types';

export interface SalesStateSlice { sales: { log: SaleEntry[] } }

export const selectSalesLog = (state: SalesStateSlice) => state.sales.log;
