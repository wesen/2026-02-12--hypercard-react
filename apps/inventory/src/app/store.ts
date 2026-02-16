import { createAppStore } from '@hypercard/engine';
import { artifactsReducer } from '../features/chat/artifactsSlice';
import { chatReducer } from '../features/chat/chatSlice';
import { inventoryReducer } from '../features/inventory/inventorySlice';
import { salesReducer } from '../features/sales/salesSlice';

export const { store, createStore: createInventoryStore } = createAppStore({
  inventory: inventoryReducer,
  sales: salesReducer,
  artifacts: artifactsReducer,
  chat: chatReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
