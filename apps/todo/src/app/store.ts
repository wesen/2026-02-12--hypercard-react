import { hypercardRuntimeReducer, navigationReducer, notificationsReducer } from '@hypercard/engine';
import { configureStore } from '@reduxjs/toolkit';
import { tasksReducer } from '../features/tasks/tasksSlice';

export const store = configureStore({
  reducer: {
    hypercardRuntime: hypercardRuntimeReducer,
    navigation: navigationReducer,
    notifications: notificationsReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
