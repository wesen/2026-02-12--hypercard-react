import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { hypercardRuntimeReducer, navigationReducer, notificationsReducer } from '@hypercard/engine';
import { inventoryReducer } from '../features/inventory/inventorySlice';
import { salesReducer } from '../features/sales/salesSlice';
import { chatReducer } from '../features/chat/chatSlice';

function createFreshStore() {
  return configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      navigation: navigationReducer,
      notifications: notificationsReducer,
      inventory: inventoryReducer,
      sales: salesReducer,
      chat: chatReducer,
    },
  });
}

export function StoreDecorator({ children }: { children: ReactNode }) {
  return <Provider store={createFreshStore()}>{children}</Provider>;
}

export function storeDecorator() {
  return (Story: React.ComponentType) => (
    <StoreDecorator><Story /></StoreDecorator>
  );
}
