import { configureStore } from '@reduxjs/toolkit';
import { hypercardRuntimeReducer, navigationReducer, notificationsReducer } from '@hypercard/engine';
import { inventoryReducer } from '../features/inventory/inventorySlice';
import { salesReducer } from '../features/sales/salesSlice';
import { chatReducer } from '../features/chat/chatSlice';

export const store = configureStore({
  reducer: {
    hypercardRuntime: hypercardRuntimeReducer,
    navigation: navigationReducer,
    notifications: notificationsReducer,
    inventory: inventoryReducer,
    sales: salesReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
