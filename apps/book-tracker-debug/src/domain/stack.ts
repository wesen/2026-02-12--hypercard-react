import {
  Act,
  Ev,
  Sel,
  defineCardStack,
  ui,
  type CardStackDefinition,
  type ColumnConfig,
  type ComputedFieldConfig,
  type FieldConfig,
  type FilterConfig,
} from '@hypercard/engine';
import type { Book, BooksStateSlice } from './types';

export const BOOK_COLUMNS: ColumnConfig<Book>[] = [
  { key: 'title', label: 'Title', width: '1fr' },
  { key: 'author', label: 'Author', width: 160 },
  { key: 'status', label: 'Status', width: 90 },
  { key: 'rating', label: 'Rating', width: 80 },
];

const BOOK_FILTERS: FilterConfig[] = [
  { field: 'status', type: 'select', options: ['All', 'to-read', 'reading', 'read'] },
  { field: '_search', type: 'text', placeholder: 'Search title or author...' },
];

const DETAIL_FIELDS: FieldConfig[] = [
  { id: 'id', label: 'ID', type: 'readonly' },
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'author', label: 'Author', type: 'text' },
  { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
  { id: 'rating', label: 'Rating', type: 'number', step: 1 },
];

const DETAIL_COMPUTED: ComputedFieldConfig<Book>[] = [
  {
    id: 'readingProgress',
    label: 'Progress',
    compute: (record) => {
      if (record.status === 'read') return 'Finished';
      if (record.status === 'reading') return 'In Progress';
      return 'Queued';
    },
  },
];

const FORM_FIELDS: FieldConfig[] = [
  { id: 'title', label: 'Title', type: 'text', placeholder: 'Book title', required: true },
  { id: 'author', label: 'Author', type: 'text', placeholder: 'Author name', required: true },
  { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
  { id: 'rating', label: 'Rating', type: 'number', step: 1 },
];

export const BOOK_STACK: CardStackDefinition<BooksStateSlice> = defineCardStack({
  id: 'bookTrackerDebug',
  name: 'Book Tracker',
  icon: '📚',
  homeCard: 'home',
  cards: {
    home: {
      id: 'home',
      type: 'menu',
      title: 'Home',
      icon: '🏠',
      ui: ui.menu({
        key: 'homeMenu',
        icon: '📚',
        labels: [
          { value: 'Book Tracker' },
          { value: 'DSL runtime + debug pane', style: 'muted' },
        ],
        buttons: [
          { label: 'Browse Books', action: Act('nav.go', { card: 'browse' }) },
          { label: 'Reading Now', action: Act('nav.go', { card: 'readingNow' }) },
          { label: 'Reading Report', action: Act('nav.go', { card: 'readingReport' }) },
          { label: 'Add Book', action: Act('nav.go', { card: 'addBook' }) },
          { label: 'Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
          { label: 'Reset Demo Data', action: Act('books.resetDemo', undefined, { to: 'shared' }) },
        ],
      }),
    },

    browse: {
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
    },

    readingNow: {
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
    },

    bookDetail: {
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
    },

    addBook: {
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
    },

    readingReport: {
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
    },
  },
});
