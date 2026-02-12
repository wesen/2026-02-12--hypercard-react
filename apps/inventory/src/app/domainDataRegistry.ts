import {
  defineSelectorRegistry,
  selectDomainData,
} from '@hypercard/engine';
import { selectItems, type InventoryStateSlice } from '../features/inventory/selectors';
import { selectSalesLog, type SalesStateSlice } from '../features/sales/selectors';

export type InventoryDomainDataState = InventoryStateSlice & SalesStateSlice;

export const inventoryDomainDataRegistry = defineSelectorRegistry({
  items: selectItems,
  salesLog: selectSalesLog,
});

export const selectInventoryDomainData = (state: InventoryDomainDataState) =>
  selectDomainData(state, inventoryDomainDataRegistry);
