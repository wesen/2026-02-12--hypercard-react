import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { BooksStateSlice } from '../types';
import { BOOK_COLUMNS, BOOK_FILTERS } from './common';

export const browseCard: CardDefinition<BooksStateSlice> = {
  id: 'browse',
  type: 'list',
  title: 'Browse Books',
  icon: '📋',
  ui: ui.list({
    key: 'browseList',
    items: Sel('books.all', undefined, { from: 'shared' }),
    columns: BOOK_COLUMNS,
    filters: BOOK_FILTERS,
    searchFields: ['title', 'author'],
    rowKey: 'id',
    toolbar: [
      { label: 'Add', action: Act('nav.go', { card: 'addBook' }) },
      { label: 'Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
      { label: 'Reset', action: Act('books.resetDemo', undefined, { to: 'shared' }) },
    ],
  }),
  bindings: {
    browseList: {
      rowClick: Act('nav.go', { card: 'bookDetail', param: Ev('row.id') }),
    },
  },
};
