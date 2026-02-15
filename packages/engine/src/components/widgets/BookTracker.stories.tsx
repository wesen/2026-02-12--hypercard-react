import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Provider } from 'react-redux';
import {
  Act,
  type CardStackDefinition,
  defineCardStack,
  Ev,
  Sel,
  type SharedActionRegistry,
  type SharedSelectorRegistry,
  ui,
} from '../../cards';
import { hypercardRuntimeReducer } from '../../cards/runtimeStateSlice';
import { notificationsReducer } from '../../features/notifications/notificationsSlice';
import { windowingReducer } from '../../features/windowing/windowingSlice';
import type { ColumnConfig, ComputedFieldConfig, FieldConfig, FilterConfig } from '../../types';
import { DesktopShell } from '../shell/windowing/DesktopShell';
import { DetailView } from './DetailView';
import { FormView } from './FormView';
import { ListView } from './ListView';
import { MenuGrid } from './MenuGrid';

type Book = {
  id: string;
  title: string;
  author: string;
  status: 'to-read' | 'reading' | 'read';
  rating: number;
  [key: string]: unknown;
};

function cloneBookSeed(): Book[] {
  return JSON.parse(JSON.stringify(BOOKS)) as Book[];
}

const BOOKS: Book[] = [
  { id: 'b1', title: 'Dune', author: 'Herbert', status: 'read', rating: 5 },
  { id: 'b2', title: '1984', author: 'Orwell', status: 'reading', rating: 4 },
  { id: 'b3', title: 'Neuromancer', author: 'Gibson', status: 'to-read', rating: 0 },
  { id: 'b4', title: 'Foundation', author: 'Asimov', status: 'read', rating: 5 },
  { id: 'b5', title: 'Snow Crash', author: 'Stephenson', status: 'reading', rating: 3 },
];

const BOOK_COLUMNS: ColumnConfig<Book>[] = [
  { key: 'title', label: 'Title', width: '1fr' },
  { key: 'author', label: 'Author', width: 120 },
  { key: 'status', label: 'Status', width: 80 },
  { key: 'rating', label: 'Rating', width: 60 },
];

const BOOK_FILTERS: FilterConfig[] = [
  { field: 'status', type: 'select', options: ['All', 'to-read', 'reading', 'read'] },
  { field: '_search', type: 'text', placeholder: 'Search title or author…' },
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
    compute: (r) => (r.status === 'read' ? '✅ Finished' : r.status === 'reading' ? '📖 In Progress' : '📋 Queued'),
  },
];

const FORM_FIELDS: FieldConfig[] = [
  { id: 'title', label: 'Title', type: 'text', placeholder: 'Book title', required: true },
  { id: 'author', label: 'Author', type: 'text', placeholder: 'Author name', required: true },
  { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
  { id: 'rating', label: 'Rating', type: 'number', step: 1 },
];

const menuMeta = {
  title: 'BookTracker/Home',
  component: MenuGrid,
  args: {
    icon: '📚',
    labels: [{ value: 'Book Tracker' }, { value: 'Track your reading', style: 'muted' }],
    buttons: [
      { label: '📋 All Books', action: Act('nav.go', { card: 'browse' }), variant: 'default' as const },
      { label: '➕ Add Book', action: Act('nav.go', { card: 'addBook' }), variant: 'default' as const },
    ],
    onAction: (action: unknown) => alert(JSON.stringify(action)),
  },
} satisfies Meta<typeof MenuGrid>;

export default menuMeta;
type MenuStory = StoryObj<typeof menuMeta>;

export const Home: MenuStory = {};

export const BrowseBooks: MenuStory = {
  render: () => (
    <div style={{ width: 600, height: 400 }}>
      <ListView<Book>
        items={BOOKS}
        columns={BOOK_COLUMNS}
        filters={BOOK_FILTERS}
        searchFields={['title', 'author']}
        rowKey="id"
        toolbar={[{ label: '➕ Add', action: Act('nav.go', { card: 'addBook' }), variant: 'default' }]}
        onRowClick={(row) => alert(`Navigate to detail for: ${row.title} (id=${row.id})`)}
        onAction={(action) => alert(JSON.stringify(action))}
        emptyMessage="No books yet — add some! 📖"
      />
    </div>
  ),
};

function BookDetailDemo() {
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const record = BOOKS[0];

  return (
    <DetailView<Book>
      record={record}
      fields={DETAIL_FIELDS}
      computed={DETAIL_COMPUTED}
      edits={edits}
      onEdit={(id, value) => setEdits((p) => ({ ...p, [id]: value }))}
      actions={[
        { label: '✏️ Save', variant: 'primary', action: { edits } },
        { label: '🗑 Delete', variant: 'danger', action: {} },
      ]}
      onAction={(a) => alert(JSON.stringify(a))}
    />
  );
}

export const BookDetail: MenuStory = {
  render: () => <BookDetailDemo />,
};

function AddBookDemo() {
  const [values, setValues] = useState<Record<string, unknown>>({
    title: '',
    author: '',
    status: 'to-read',
    rating: 0,
  });
  const [result, setResult] = useState<string | null>(null);

  return (
    <FormView
      fields={FORM_FIELDS}
      values={values}
      onChange={(id, value) => setValues((p) => ({ ...p, [id]: value }))}
      onSubmit={(v) => setResult(`📚 Added: ${JSON.stringify(v)}`)}
      submitResult={result}
      submitLabel="📚 Add Book"
    />
  );
}

export const AddBook: MenuStory = {
  render: () => <AddBookDemo />,
};

type BooksState = { books: { items: Book[] } };

const booksSlice = createSlice({
  name: 'books',
  initialState: { items: cloneBookSeed() },
  reducers: {
    saveBook(state, action: PayloadAction<{ id: string; edits: Partial<Book> }>) {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.edits };
      }
    },
    setStatus(state, action: PayloadAction<{ id: string; status: Book['status'] }>) {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx].status = action.payload.status;
      }
    },
    deleteBook(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((b) => b.id !== action.payload.id);
    },
    markAllRead(state) {
      state.items = state.items.map((book) => ({ ...book, status: 'read' as const }));
    },
    resetDemo(state) {
      state.items = cloneBookSeed();
    },
    createBook(state, action: PayloadAction<{ title: string; author: string; status?: string; rating?: number }>) {
      const nextId = `b${
        state.items.reduce((max, b) => {
          const n = Number.parseInt(b.id.replace(/^b/, ''), 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 0) + 1
      }`;
      state.items.push({
        id: nextId,
        title: action.payload.title,
        author: action.payload.author,
        status: (action.payload.status as Book['status']) ?? 'to-read',
        rating: Number(action.payload.rating ?? 0),
      });
    },
  },
});

const BOOK_STACK: CardStackDefinition<BooksState> = defineCardStack({
  id: 'bookTracker',
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
        labels: [{ value: 'Book Tracker' }, { value: 'Full app via CardDefinition widgets', style: 'muted' }],
        buttons: [
          { label: '📋 Browse Books', action: Act('nav.go', { card: 'browse' }) },
          { label: '🔥 Reading Now', action: Act('nav.go', { card: 'readingNow' }) },
          { label: '📊 Reading Report', action: Act('nav.go', { card: 'readingReport' }) },
          { label: '➕ Add Book', action: Act('nav.go', { card: 'addBook' }) },
          { label: '✅ Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
          { label: '♻️ Reset Demo Data', action: Act('books.resetDemo', undefined, { to: 'shared' }) },
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
          { label: '➕ Add', action: Act('nav.go', { card: 'addBook' }) },
          { label: '✅ Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
          { label: '♻️ Reset', action: Act('books.resetDemo', undefined, { to: 'shared' }) },
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
          { label: '📋 Browse All', action: Act('nav.go', { card: 'browse' }) },
          { label: '✅ Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
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
            label: '✏️ Save',
            variant: 'primary',
            action: Act(
              'books.save',
              { id: Sel('books.paramId', undefined, { from: 'shared' }), edits: Sel('state.edits') },
              { to: 'shared' },
            ),
          },
          {
            label: '📖 Mark Reading',
            action: Act(
              'books.setStatus',
              { id: Sel('books.paramId', undefined, { from: 'shared' }), status: 'reading' },
              { to: 'shared' },
            ),
          },
          {
            label: '✅ Mark Read',
            action: Act(
              'books.setStatus',
              { id: Sel('books.paramId', undefined, { from: 'shared' }), status: 'read' },
              { to: 'shared' },
            ),
          },
          {
            label: '🗑 Delete',
            variant: 'danger',
            action: Act('books.delete', { id: Sel('books.paramId', undefined, { from: 'shared' }) }, { to: 'shared' }),
          },
        ],
      }),
      bindings: {
        bookDetailView: {
          change: Act('state.setField', { scope: 'card', path: 'edits', key: Ev('field'), value: Ev('value') }),
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
        submitLabel: '📚 Add Book',
        submitResult: Sel('state.submitResult'),
      }),
      bindings: {
        addBookForm: {
          change: Act('state.setField', { scope: 'card', path: 'formValues', key: Ev('field'), value: Ev('value') }),
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
          { label: '📋 Browse', action: Act('nav.go', { card: 'browse' }) },
          { label: '✅ Mark All Read', action: Act('books.markAllRead', undefined, { to: 'shared' }) },
          { label: '♻️ Reset Demo', action: Act('books.resetDemo', undefined, { to: 'shared' }) },
        ],
      }),
    },
  },
});

const bookSharedSelectors: SharedSelectorRegistry<BooksState> = {
  'books.all': (state) => state.books.items,
  'books.reading': (state) => state.books.items.filter((b) => b.status === 'reading'),
  'books.paramId': (_state, _args, ctx) => String(ctx.params.param ?? ''),
  'books.byParam': (state, _args, ctx) =>
    state.books.items.find((b) => b.id === String(ctx.params.param ?? '')) ?? null,
  'books.reportSections': (state) => {
    const items = state.books.items;
    const total = items.length;
    const byStatus = {
      toRead: items.filter((b) => b.status === 'to-read').length,
      reading: items.filter((b) => b.status === 'reading').length,
      read: items.filter((b) => b.status === 'read').length,
    };
    const avgRating = total ? (items.reduce((sum, b) => sum + Number(b.rating ?? 0), 0) / total).toFixed(1) : '0.0';

    return [
      { label: 'Total Books', value: String(total) },
      { label: 'To Read', value: String(byStatus.toRead) },
      { label: 'Reading', value: String(byStatus.reading) },
      { label: 'Read', value: String(byStatus.read) },
      { label: 'Average Rating', value: avgRating },
    ];
  },
};

const bookSharedActions: SharedActionRegistry<BooksState> = {
  'books.save': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(
      booksSlice.actions.saveBook({
        id: String(data.id ?? ''),
        edits: (data.edits ?? {}) as Partial<Book>,
      }),
    );
    ctx.patchScopedState('card', { edits: {} });
  },
  'books.delete': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(booksSlice.actions.deleteBook({ id: String(data.id ?? '') }));
    ctx.nav.back();
  },
  'books.setStatus': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const id = String(data.id ?? '');
    const status = String(data.status ?? '') as Book['status'];
    if (!id || !status) return;
    ctx.dispatch(booksSlice.actions.setStatus({ id, status }));
    ctx.patchScopedState('card', { edits: {} });
  },
  'books.markAllRead': (ctx) => {
    ctx.dispatch(booksSlice.actions.markAllRead());
  },
  'books.resetDemo': (ctx) => {
    ctx.dispatch(booksSlice.actions.resetDemo());
    ctx.patchScopedState('card', { edits: {} });
  },
  'books.create': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    if (!values.title || !values.author) {
      ctx.patchScopedState('card', { submitResult: '❌ Title and Author are required' });
      return;
    }
    ctx.dispatch(
      booksSlice.actions.createBook({
        title: String(values.title),
        author: String(values.author),
        status: values.status ? String(values.status) : 'to-read',
        rating: Number(values.rating ?? 0),
      }),
    );
    ctx.patchScopedState('card', {
      submitResult: '✅ Book added',
      formValues: { title: '', author: '', status: 'to-read', rating: 0 },
    });
  },
};

function createStoryStore(initialCard?: string, paramValue?: string) {
  return configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      windowing: windowingReducer,
      notifications: notificationsReducer,
      books: booksSlice.reducer,
    },
  });
}

function ShellDemo({ initialCard, paramValue }: { initialCard?: string; paramValue?: string }) {
  const store = createStoryStore(initialCard, paramValue);
  const stackAtCard = initialCard ? { ...BOOK_STACK, homeCard: initialCard } : BOOK_STACK;

  return (
    <div style={{ width: 760, height: 520 }}>
      <Provider store={store}>
        <DesktopShell
          stack={stackAtCard}
          sharedSelectors={bookSharedSelectors}
          sharedActions={bookSharedActions}
          homeParam={paramValue}
        />
      </Provider>
    </div>
  );
}

export const ShellHomeFromDSLCard: MenuStory = {
  name: 'Shell Home Card (CardDefinition)',
  render: () => <ShellDemo />,
};

export const ShellFullAppFromDSLCards: MenuStory = {
  name: 'Shell Full App (CardDefinition DSL)',
  render: () => <ShellDemo />,
};

export const ShellBrowseAndDetailFromDSLCards: MenuStory = {
  name: 'Shell Browse/Detail Cards (CardDefinition)',
  render: () => <ShellDemo initialCard="browse" />,
};
