import { Act, Ev, Sel, ui, type CardDefinition } from '@hypercard/engine';
import { DETAIL_COMPUTED, DETAIL_FIELDS } from './common';
import type { BooksStateSlice } from '../types';

export const bookDetailCard: CardDefinition<BooksStateSlice> = {
  id: 'bookDetail',
  type: 'detail',
  title: 'Book Detail',
  icon: '📖',
  state: { initial: { edits: {} } },
  ui: ui.detail({
    key: 'bookDetailView',
    record: Sel('books.byParam', undefined, { from: 'shared' }),
    fields: DETAIL_FIELDS,
    computed: DETAIL_COMPUTED,
    edits: Sel('state.edits'),
    actions: [
      {
        label: 'Save',
        variant: 'primary',
        action: Act('books.save', {
          id: Sel('books.paramId', undefined, { from: 'shared' }),
          edits: Sel('state.edits'),
        }, { to: 'shared' }),
      },
      {
        label: 'Mark Reading',
        action: Act('books.setStatus', {
          id: Sel('books.paramId', undefined, { from: 'shared' }),
          status: 'reading',
        }, { to: 'shared' }),
      },
      {
        label: 'Mark Read',
        action: Act('books.setStatus', {
          id: Sel('books.paramId', undefined, { from: 'shared' }),
          status: 'read',
        }, { to: 'shared' }),
      },
      {
        label: 'Delete',
        variant: 'danger',
        action: Act('books.delete', {
          id: Sel('books.paramId', undefined, { from: 'shared' }),
        }, { to: 'shared' }),
      },
    ],
  }),
  bindings: {
    bookDetailView: {
      change: Act('state.setField', {
        scope: 'card',
        path: 'edits',
        key: Ev('field'),
        value: Ev('value'),
      }),
    },
  },
};
