import { configureStore } from '@reduxjs/toolkit';
import { navigationReducer, notificationsReducer } from '@hypercard/engine';
import { tasksReducer } from '../features/tasks/tasksSlice';

export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    notifications: notificationsReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
