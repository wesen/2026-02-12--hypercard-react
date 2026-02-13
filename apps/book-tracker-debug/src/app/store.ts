import { configureStore } from '@reduxjs/toolkit';
import {
  hypercardRuntimeReducer,
  navigationReducer,
  notificationsReducer,
} from '@hypercard/engine';
import { booksReducer } from '../features/books/booksSlice';
import { debugReducer } from '../debug/debugSlice';

export function createAppStore() {
  return configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      navigation: navigationReducer,
      notifications: notificationsReducer,
      books: booksReducer,
      debug: debugReducer,
    },
  });
}

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
