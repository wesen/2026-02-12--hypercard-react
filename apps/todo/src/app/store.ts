import { createAppStore } from '@hypercard/hypercard-runtime';
import { tasksReducer } from '../features/tasks/tasksSlice';

export const { store, createStore: createTodoStore } = createAppStore({
  tasks: tasksReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
