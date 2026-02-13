import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { BooksStateSlice } from '../types';
import { BOOK_COLUMNS, BOOK_FILTERS } from './common';

export const readingNowCard: CardDefinition<BooksStateSlice> = {
  id: 'readingNow',
  type: 'list',
  title: 'Reading Now',
  icon: '🔥',
  ui: ui.list({
    key: 'readingNowList',
    items: Sel('books.reading', undefined, { from: 'shared' }),
    columns: BOOK_COLUMNS,
    filters: BOOK_FILTERS,
    searchFields: ['title', 'author'],
    rowKey: 'id',
    toolbar: [
      { label: 'Browse All', action: Act('nav.go', { card: 'browse' }) },
      { label: 'Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
    ],
    emptyMessage: 'No active reading books right now.',
  }),
  bindings: {
    readingNowList: {
      rowClick: Act('nav.go', { card: 'bookDetail', param: Ev('row.id') }),
    },
  },
};
