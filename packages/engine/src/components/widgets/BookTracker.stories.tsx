import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  Act,
  Ev,
  HyperCardShell,
  Sel,
  defineCardStack,
  hypercardRuntimeReducer,
  navigationReducer,
  navigate,
  notificationsReducer,
  ui,
  type CardStackDefinition,
  type ColumnConfig,
  type ComputedFieldConfig,
  type FieldConfig,
  type FilterConfig,
  type SharedActionRegistry,
  type SharedSelectorRegistry,
} from '@hypercard/engine';
import { MenuGrid } from './MenuGrid';
import { ListView } from './ListView';
import { DetailView } from './DetailView';
import { FormView } from './FormView';

type Book = {
  id: string;
  title: string;
  author: string;
  status: 'to-read' | 'reading' | 'read';
  rating: number;
  [key: string]: unknown;
};

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
    compute: (r) =>
      r.status === 'read' ? '✅ Finished' : r.status === 'reading' ? '📖 In Progress' : '📋 Queued',
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
    labels: [
      { value: 'Book Tracker' },
      { value: 'Track your reading', style: 'muted' },
    ],
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
  initialState: { items: JSON.parse(JSON.stringify(BOOKS)) as Book[] },
  reducers: {
    saveBook(state, action: PayloadAction<{ id: string; edits: Partial<Book> }>) {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.edits };
      }
    },
    deleteBook(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((b) => b.id !== action.payload.id);
    },
    createBook(state, action: PayloadAction<{ title: string; author: string; status?: string; rating?: number }>) {
      const nextId = `b${state.items.length + 1}`;
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
        labels: [
          { value: 'Book Tracker' },
          { value: 'CardDefinition story example', style: 'muted' },
        ],
        buttons: [
          { label: '📋 Browse Books', action: Act('nav.go', { card: 'browse' }) },
          { label: '➕ Add Book', action: Act('nav.go', { card: 'addBook' }) },
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
        toolbar: [{ label: '➕ Add', action: Act('nav.go', { card: 'addBook' }) }],
      }),
      bindings: {
        browseList: {
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
          { label: '✏️ Save', variant: 'primary', action: Act('books.save', { id: Sel('books.paramId', undefined, { from: 'shared' }), edits: Sel('state.edits') }, { to: 'shared' }) },
          { label: '🗑 Delete', variant: 'danger', action: Act('books.delete', { id: Sel('books.paramId', undefined, { from: 'shared' }) }, { to: 'shared' }) },
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
  },
});

const bookSharedSelectors: SharedSelectorRegistry<BooksState> = {
  'books.all': (state) => state.books.items,
  'books.paramId': (_state, _args, ctx) => String(ctx.params.param ?? ''),
  'books.byParam': (state, _args, ctx) => state.books.items.find((b) => b.id === String(ctx.params.param ?? '')) ?? null,
};

const bookSharedActions: SharedActionRegistry<BooksState> = {
  'books.save': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(booksSlice.actions.saveBook({
      id: String(data.id ?? ''),
      edits: (data.edits ?? {}) as Partial<Book>,
    }));
    ctx.patchScopedState('card', { edits: {} });
  },
  'books.delete': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(booksSlice.actions.deleteBook({ id: String(data.id ?? '') }));
    ctx.nav.back();
  },
  'books.create': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    if (!values.title || !values.author) {
      ctx.patchScopedState('card', { submitResult: '❌ Title and Author are required' });
      return;
    }
    ctx.dispatch(booksSlice.actions.createBook({
      title: String(values.title),
      author: String(values.author),
      status: values.status ? String(values.status) : 'to-read',
      rating: Number(values.rating ?? 0),
    }));
    ctx.patchScopedState('card', {
      submitResult: '✅ Book added',
      formValues: { title: '', author: '', status: 'to-read', rating: 0 },
    });
  },
};

function createStoryStore(initialCard?: string, paramValue?: string) {
  const store = configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      navigation: navigationReducer,
      notifications: notificationsReducer,
      books: booksSlice.reducer,
    },
  });

  if (initialCard && initialCard !== 'home') {
    store.dispatch(navigate({ card: initialCard, paramValue }));
  }

  return store;
}

function ShellDemo({ initialCard, paramValue }: { initialCard?: string; paramValue?: string }) {
  const store = createStoryStore(initialCard, paramValue);

  return (
    <div style={{ width: 760, height: 520 }}>
      <Provider store={store}>
        <HyperCardShell
          stack={BOOK_STACK}
          sharedSelectors={bookSharedSelectors}
          sharedActions={bookSharedActions}
          navShortcuts={[
            { card: 'home', icon: '🏠' },
            { card: 'browse', icon: '📋' },
          ]}
        />
      </Provider>
    </div>
  );
}

export const ShellHomeFromDSLCard: MenuStory = {
  name: 'Shell Home Card (CardDefinition)',
  render: () => <ShellDemo />,
};

export const ShellBrowseAndDetailFromDSLCards: MenuStory = {
  name: 'Shell Browse/Detail Cards (CardDefinition)',
  render: () => <ShellDemo initialCard="browse" />,
};
