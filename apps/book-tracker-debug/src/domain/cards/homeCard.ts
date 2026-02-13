import { Act, type CardDefinition, ui } from '@hypercard/engine';
import type { BooksStateSlice } from '../types';

export const homeCard: CardDefinition<BooksStateSlice> = {
  id: 'home',
  type: 'menu',
  title: 'Home',
  icon: '🏠',
  ui: ui.menu({
    key: 'homeMenu',
    icon: '📚',
    labels: [{ value: 'Book Tracker' }, { value: 'DSL runtime + debug pane', style: 'muted' }],
    buttons: [
      { label: 'Browse Books', action: Act('nav.go', { card: 'browse' }) },
      { label: 'Reading Now', action: Act('nav.go', { card: 'readingNow' }) },
      { label: 'Reading Report', action: Act('nav.go', { card: 'readingReport' }) },
      { label: 'Add Book', action: Act('nav.go', { card: 'addBook' }) },
      { label: 'Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
      { label: 'Reset Demo Data', action: Act('books.resetDemo', undefined, { to: 'shared' }) },
    ],
  }),
};
