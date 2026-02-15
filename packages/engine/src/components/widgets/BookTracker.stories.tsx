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
  title: 'BookTracker/Home',
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

const BOOK_PLUGIN_BUNDLE = String.raw`
defineStackBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value);
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function selectBooks(globalState) {
    const domains = asRecord(asRecord(globalState).domains);
    return asArray(asRecord(domains.books).items);
  }

  function navParam(globalState) {
    const param = asRecord(asRecord(globalState).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function findBook(globalState, id) {
    const target = toText(id).toLowerCase();
    return selectBooks(globalState).find((book) => toText(asRecord(book).id).toLowerCase() === target) || null;
  }

  function statusLabel(status) {
    const value = toText(status);
    if (value === 'read') return '✅ read';
    if (value === 'reading') return '🔥 reading';
    return '◻️ to-read';
  }

  function rows(items) {
    return items.map((book) => {
      const row = asRecord(book);
      return [toText(row.id), toText(row.title), toText(row.author), statusLabel(row.status), String(toNumber(row.rating, 0))];
    });
  }

  function readingNow(globalState) {
    return selectBooks(globalState).filter((book) => toText(asRecord(book).status) === 'reading');
  }

  function reportRows(globalState) {
    const items = selectBooks(globalState);
    const total = items.length;
    const toRead = items.filter((book) => toText(asRecord(book).status) === 'to-read').length;
    const reading = items.filter((book) => toText(asRecord(book).status) === 'reading').length;
    const read = items.filter((book) => toText(asRecord(book).status) === 'read').length;
    const avgRating = total ? (items.reduce((sum, book) => sum + toNumber(asRecord(book).rating, 0), 0) / total).toFixed(1) : '0.0';

    return [
      ['Total Books', String(total)],
      ['To Read', String(toRead)],
      ['Reading', String(reading)],
      ['Read', String(read)],
      ['Average Rating', avgRating],
    ];
  }

  function quickOpen(items) {
    return items.slice(0, 10).map((book) => {
      const row = asRecord(book);
      const id = toText(row.id);
      const label = toText(row.title, id);
      return ui.button('Open ' + label, { onClick: { handler: 'openBook', args: { id } } });
    });
  }

  function go(dispatchSystemCommand, cardId, param) {
    dispatchSystemCommand('nav.go', param ? { cardId: String(cardId), param: String(param) } : { cardId: String(cardId) });
  }

  return {
    id: 'bookTracker',
    title: 'Book Tracker',
    initialCardState: {
      bookDetail: { edits: {} },
      addBook: {
        formValues: { title: '', author: '', status: 'to-read', rating: 0 },
        submitResult: '',
      },
    },
    cards: {
      home: {
        render() {
          return ui.panel([
            ui.text('Book Tracker'),
            ui.button('📋 Browse Books', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
            ui.button('🔥 Reading Now', { onClick: { handler: 'go', args: { cardId: 'readingNow' } } }),
            ui.button('📊 Reading Report', { onClick: { handler: 'go', args: { cardId: 'readingReport' } } }),
            ui.button('➕ Add Book', { onClick: { handler: 'go', args: { cardId: 'addBook' } } }),
            ui.row([
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('♻️ Reset Demo Data', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
          resetDemo({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'resetDemo');
          },
        },
      },

      browse: {
        render({ globalState }) {
          const items = selectBooks(globalState);
          return ui.panel([
            ui.text('Browse Books (' + items.length + ')'),
            ui.table(rows(items), { headers: ['ID', 'Title', 'Author', 'Status', 'Rating'] }),
            ui.column(quickOpen(items)),
            ui.row([
              ui.button('➕ Add', { onClick: { handler: 'go', args: { cardId: 'addBook' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('♻️ Reset', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          openBook({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, 'bookDetail', asRecord(args).id);
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
          resetDemo({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'resetDemo');
          },
        },
      },

      readingNow: {
        render({ globalState }) {
          const items = readingNow(globalState);
          return ui.panel([
            ui.text('Reading Now (' + items.length + ')'),
            ui.table(rows(items), { headers: ['ID', 'Title', 'Author', 'Status', 'Rating'] }),
            ui.column(quickOpen(items)),
            ui.row([
              ui.button('📋 Browse All', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          openBook({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, 'bookDetail', asRecord(args).id);
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
        },
      },

      bookDetail: {
        render({ cardState, globalState }) {
          const state = asRecord(cardState);
          const edits = asRecord(state.edits);
          const id = navParam(globalState);
          const record = findBook(globalState, id);

          if (!record) {
            return ui.panel([
              ui.text('Book not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const current = { ...asRecord(record), ...edits };

          return ui.panel([
            ui.text('Book Detail: ' + toText(current.title, id)),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(current.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Author:'),
              ui.input(toText(current.author), { onChange: { handler: 'change', args: { field: 'author' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(current.status), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Rating:'),
              ui.input(toText(current.rating), { onChange: { handler: 'change', args: { field: 'rating' } } }),
            ]),
            ui.row([
              ui.button('✏️ Save', { onClick: { handler: 'save' } }),
              ui.button('📖 Mark Reading', { onClick: { handler: 'setStatus', args: { status: 'reading' } } }),
              ui.button('✅ Mark Read', { onClick: { handler: 'setStatus', args: { status: 'read' } } }),
            ]),
            ui.row([
              ui.button('🗑 Delete', { onClick: { handler: 'remove' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          back({ dispatchSystemCommand }) {
            dispatchSystemCommand('nav.back');
          },
          change({ dispatchCardAction }, args) {
            const payload = asRecord(args);
            const field = String(payload.field || '');
            if (!field) return;
            dispatchCardAction('set', { path: 'edits.' + field, value: payload.value });
          },
          save({ cardState, dispatchCardAction, dispatchDomainAction, globalState }) {
            const id = navParam(globalState);
            if (!id) return;
            const edits = { ...asRecord(asRecord(cardState).edits) };
            if (edits.rating !== undefined) {
              edits.rating = toNumber(edits.rating, 0);
            }
            dispatchDomainAction('books', 'saveBook', { id, edits });
            dispatchCardAction('patch', { edits: {} });
          },
          setStatus({ dispatchCardAction, dispatchDomainAction, globalState }, args) {
            const id = navParam(globalState);
            if (!id) return;
            const status = toText(asRecord(args).status);
            if (!status) return;
            dispatchDomainAction('books', 'setStatus', { id, status });
            dispatchCardAction('patch', { edits: {} });
          },
          remove({ dispatchDomainAction, dispatchSystemCommand, globalState }) {
            const id = navParam(globalState);
            if (!id) return;
            dispatchDomainAction('books', 'deleteBook', { id });
            dispatchSystemCommand('nav.back');
          },
        },
      },

      addBook: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const form = asRecord(state.formValues);
          const submitResult = toText(state.submitResult);

          return ui.panel([
            ui.text('Add Book'),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(form.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Author:'),
              ui.input(toText(form.author), { onChange: { handler: 'change', args: { field: 'author' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(form.status, 'to-read'), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Rating:'),
              ui.input(toText(form.rating, '0'), { onChange: { handler: 'change', args: { field: 'rating' } } }),
            ]),
            submitResult ? ui.badge(submitResult) : ui.text(''),
            ui.row([
              ui.button('📚 Add Book', { onClick: { handler: 'submit' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          back({ dispatchSystemCommand }) {
            dispatchSystemCommand('nav.back');
          },
          change({ dispatchCardAction }, args) {
            const payload = asRecord(args);
            const field = String(payload.field || '');
            if (!field) return;
            dispatchCardAction('set', { path: 'formValues.' + field, value: payload.value });
          },
          submit({ cardState, dispatchCardAction, dispatchDomainAction }) {
            const values = asRecord(asRecord(cardState).formValues);
            const title = toText(values.title).trim();
            const author = toText(values.author).trim();
            if (!title || !author) {
              dispatchCardAction('patch', { submitResult: '❌ Title and Author are required' });
              return;
            }

            dispatchDomainAction('books', 'createBook', {
              title,
              author,
              status: toText(values.status, 'to-read'),
              rating: toNumber(values.rating, 0),
            });

            dispatchCardAction('patch', {
              submitResult: '✅ Book added',
              formValues: { title: '', author: '', status: 'to-read', rating: 0 },
            });
          },
        },
      },

      readingReport: {
        render({ globalState }) {
          return ui.panel([
            ui.text('Reading Report'),
            ui.table(reportRows(globalState), { headers: ['Metric', 'Value'] }),
            ui.row([
              ui.button('📋 Browse', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('♻️ Reset Demo', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
          resetDemo({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'resetDemo');
          },
        },
      },
    },
  };
});
`;

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
