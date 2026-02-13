import type { BooksStateSlice } from '../../domain/types';

export function selectBooks(state: BooksStateSlice) {
  return state.books.items;
}
