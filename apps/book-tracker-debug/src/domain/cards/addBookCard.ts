import { Act, type CardDefinition, Ev, Sel, ui } from '@hypercard/engine';
import type { BooksStateSlice } from '../types';
import { FORM_FIELDS } from './common';

export const addBookCard: CardDefinition<BooksStateSlice> = {
  id: 'addBook',
  type: 'form',
  title: 'Add Book',
  icon: '➕',
  state: {
    initial: {
      formValues: { title: '', author: '', status: 'to-read', rating: 0 },
      submitResult: '',
    },
  },
  ui: ui.form({
    key: 'addBookForm',
    fields: FORM_FIELDS,
    values: Sel('state.formValues'),
    submitLabel: 'Add Book',
    submitResult: Sel('state.submitResult'),
  }),
  bindings: {
    addBookForm: {
      change: Act('state.setField', {
        scope: 'card',
        path: 'formValues',
        key: Ev('field'),
        value: Ev('value'),
      }),
      submit: Act('books.create', { values: Ev('values') }, { to: 'shared' }),
    },
  },
};
