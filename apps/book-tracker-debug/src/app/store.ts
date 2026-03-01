import { createAppStore } from '@hypercard/hypercard-runtime';
import { booksReducer } from '../features/books/booksSlice';

export const { store, createStore: createBookStore } = createAppStore({
  books: booksReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
