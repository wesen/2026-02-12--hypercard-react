import { chatSessionReducer, createAppStore, timelineReducer } from '@hypercard/engine';
import { inventoryReducer } from '../features/inventory/inventorySlice';
import { salesReducer } from '../features/sales/salesSlice';

export const { store, createStore: createInventoryStore } = createAppStore(
  {
    inventory: inventoryReducer,
    sales: salesReducer,
    timeline: timelineReducer,
    chatSession: chatSessionReducer,
  },
  {
    enableReduxDiagnostics: import.meta.env.DEV,
    diagnosticsWindowMs: 5000,
  },
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
