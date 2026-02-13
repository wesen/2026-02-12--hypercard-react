import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Book, BookStatus } from '../../domain/types';

const BOOKS_SEED: Book[] = [
  { id: 'b1', title: 'Dune', author: 'Frank Herbert', status: 'read', rating: 5 },
  { id: 'b2', title: '1984', author: 'George Orwell', status: 'reading', rating: 4 },
  { id: 'b3', title: 'Neuromancer', author: 'William Gibson', status: 'to-read', rating: 0 },
  { id: 'b4', title: 'Foundation', author: 'Isaac Asimov', status: 'read', rating: 5 },
  { id: 'b5', title: 'Snow Crash', author: 'Neal Stephenson', status: 'reading', rating: 3 },
];

function cloneSeed(): Book[] {
  return JSON.parse(JSON.stringify(BOOKS_SEED)) as Book[];
}

function nextBookId(items: Book[]): string {
  const maxId = items.reduce((max, b) => {
    const parsed = Number.parseInt(String(b.id).replace(/^b/, ''), 10);
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 0);
  return `b${maxId + 1}`;
}

export const booksSlice = createSlice({
  name: 'books',
  initialState: { items: cloneSeed() },
  reducers: {
    saveBook(state, action: PayloadAction<{ id: string; edits: Partial<Book> }>) {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.edits };
      }
    },
    setStatus(state, action: PayloadAction<{ id: string; status: BookStatus }>) {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx].status = action.payload.status;
      }
    },
    deleteBook(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((b) => b.id !== action.payload.id);
    },
    markAllRead(state) {
      state.items = state.items.map((book) => ({ ...book, status: 'read' }));
    },
    resetDemo(state) {
      state.items = cloneSeed();
    },
    createBook(state, action: PayloadAction<{ title: string; author: string; status?: string; rating?: number }>) {
      state.items.push({
        id: nextBookId(state.items),
        title: action.payload.title,
        author: action.payload.author,
        status: (action.payload.status as BookStatus) ?? 'to-read',
        rating: Number(action.payload.rating ?? 0),
      });
    },
  },
});

export const { saveBook, setStatus, deleteBook, markAllRead, resetDemo, createBook } = booksSlice.actions;

export const booksReducer = booksSlice.reducer;
