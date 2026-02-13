import { Act, Sel, ui, type CardDefinition } from '@hypercard/engine';
import type { BooksStateSlice } from '../types';

export const readingReportCard: CardDefinition<BooksStateSlice> = {
  id: 'readingReport',
  type: 'report',
  title: 'Reading Report',
  icon: '📊',
  ui: ui.report({
    key: 'readingReportView',
    sections: Sel('books.reportSections', undefined, { from: 'shared' }),
    actions: [
      { label: 'Browse', action: Act('nav.go', { card: 'browse' }) },
      { label: 'Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
      { label: 'Reset Demo', action: Act('books.resetDemo', undefined, { to: 'shared' }) },
    ],
  }),
};
