import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { createAppStore } from '../../app/createAppStore';
import type { CardDefinition, CardStackDefinition } from '../../cards/types';
import type { ColumnConfig, FieldConfig, FilterConfig } from '../../types';
import { DesktopShell } from '../shell/windowing/DesktopShell';
import { DetailView } from './DetailView';
import { FormView } from './FormView';
import { ListView } from './ListView';
import { MenuGrid } from './MenuGrid';
import BOOK_PLUGIN_BUNDLE from './BookTracker.plugin.vm.js?raw';

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

function cloneBookSeed(): Book[] {
  return JSON.parse(JSON.stringify(BOOKS)) as Book[];
}

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

const FORM_FIELDS: FieldConfig[] = [
  { id: 'title', label: 'Title', type: 'text', placeholder: 'Book title', required: true },
  { id: 'author', label: 'Author', type: 'text', placeholder: 'Author name', required: true },
  { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
  { id: 'rating', label: 'Rating', type: 'number', step: 1 },
];

const menuMeta = {
  title: 'Engine/Widgets/BookTracker',
  component: MenuGrid,
  args: {
    icon: '📚',
    labels: [{ value: 'Book Tracker' }, { value: 'Plugin runtime stories', style: 'muted' }],
    buttons: [
      { label: '📋 All Books', action: { kind: 'nav', cardId: 'browse' }, variant: 'default' as const },
      { label: '➕ Add Book', action: { kind: 'nav', cardId: 'addBook' }, variant: 'default' as const },
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
        toolbar={[{ label: '➕ Add', action: { kind: 'nav', cardId: 'addBook' }, variant: 'default' }]}
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
      edits={edits}
      onEdit={(id, value) => setEdits((prev) => ({ ...prev, [id]: value }))}
      actions={[
        { label: '✏️ Save', variant: 'primary', action: { edits } },
        { label: '🗑 Delete', variant: 'danger', action: { id: record.id } },
      ]}
      onAction={(action) => alert(JSON.stringify(action))}
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
      onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
      onSubmit={(nextValues) => setResult(`📚 Added: ${JSON.stringify(nextValues)}`)}
      submitResult={result}
      submitLabel="📚 Add Book"
    />
  );
}

export const AddBook: MenuStory = {
  render: () => <AddBookDemo />,
};

const booksSlice = createSlice({
  name: 'books',
  initialState: { items: cloneBookSeed() },
  reducers: {
    saveBook(state, action: PayloadAction<{ id: string; edits: Partial<Book> }>) {
      const idx = state.items.findIndex((book) => book.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.edits };
      }
    },
    setStatus(state, action: PayloadAction<{ id: string; status: Book['status'] }>) {
      const idx = state.items.findIndex((book) => book.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx].status = action.payload.status;
      }
    },
    deleteBook(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((book) => book.id !== action.payload.id);
    },
    markAllRead(state) {
      state.items = state.items.map((book) => ({ ...book, status: 'read' as const }));
    },
    resetDemo(state) {
      state.items = cloneBookSeed();
    },
    createBook(state, action: PayloadAction<{ title: string; author: string; status?: string; rating?: number }>) {
      const nextId = `b${
        state.items.reduce((max, book) => {
          const n = Number.parseInt(book.id.replace(/^b/, ''), 10);
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

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

const BOOK_CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'browse', title: 'Browse Books', icon: '📋' },
  { id: 'readingNow', title: 'Reading Now', icon: '🔥' },
  { id: 'bookDetail', title: 'Book Detail', icon: '📖' },
  { id: 'addBook', title: 'Add Book', icon: '➕' },
  { id: 'readingReport', title: 'Reading Report', icon: '📊' },
];

function toPluginCard(card: PluginCardMeta): CardDefinition {
  return {
    id: card.id,
    type: 'plugin',
    title: card.title,
    icon: card.icon,
    ui: {
      t: 'text',
      value: `Plugin card placeholder: ${card.id}`,
    },
  };
}

const BOOK_STACK: CardStackDefinition = {
  id: 'bookTracker',
  name: 'Book Tracker',
  icon: '📚',
  homeCard: 'home',
  plugin: {
    bundleCode: BOOK_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['books'],
      system: ['nav.go', 'nav.back', 'notify'],
    },
  },
  cards: Object.fromEntries(BOOK_CARD_META.map((card) => [card.id, toPluginCard(card)])),
};

const { createStore } = createAppStore({
  books: booksSlice.reducer,
});

function ShellDemo({ initialCard, paramValue }: { initialCard?: string; paramValue?: string }) {
  const store = createStore();
  const stackAtCard = initialCard ? { ...BOOK_STACK, homeCard: initialCard } : BOOK_STACK;

  return (
    <div style={{ width: 760, height: 520 }}>
      <Provider store={store}>
        <DesktopShell stack={stackAtCard} homeParam={paramValue} />
      </Provider>
    </div>
  );
}

export const ShellHomeFromPluginCard: MenuStory = {
  name: 'Shell Home Card (Plugin)',
  render: () => <ShellDemo />,
};

export const ShellFullAppFromPluginCards: MenuStory = {
  name: 'Shell Full App (Plugin DSL)',
  render: () => <ShellDemo />,
};

export const ShellBrowseAndDetailFromPluginCards: MenuStory = {
  name: 'Shell Browse/Detail Cards (Plugin)',
  render: () => <ShellDemo initialCard="browse" paramValue="b1" />,
};
