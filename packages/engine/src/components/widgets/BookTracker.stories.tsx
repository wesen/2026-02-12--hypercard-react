/**
 * BookTracker validation stories — written using ONLY docs/js-api-user-guide-reference.md
 * to test whether the doc is self-contained enough to produce working cards.
 *
 * These use widget-level components directly (no Redux/shell needed).
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MenuGrid } from './MenuGrid';
import { ListView } from './ListView';
import { DetailView } from './DetailView';
import { FormView } from './FormView';
import type { ColumnConfig, FieldConfig, ComputedFieldConfig, FilterConfig, ActionConfig } from '../../types';

/* ── Inline data (simulating stack.data.books) ── */

type Book = {
  id: string;
  title: string;
  author: string;
  status: string;
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

/* ═══════════════════════════════════════════════════
   Story 1: Home menu card
   DSL: type 'menu', fields + buttons
   ═══════════════════════════════════════════════════ */

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
      { label: '📋 All Books', action: { type: 'navigate', card: 'browse' }, variant: 'default' as const },
      { label: '➕ Add Book', action: { type: 'navigate', card: 'addBook' }, variant: 'default' as const },
    ],
    onAction: (action: unknown) => alert(JSON.stringify(action)),
  },
} satisfies Meta<typeof MenuGrid>;

export default menuMeta;
type MenuStory = StoryObj<typeof menuMeta>;
export const Home: MenuStory = {};

/* ═══════════════════════════════════════════════════
   Story 2: Browse list card
   DSL: type 'list', dataSource 'books', columns, filters, rowAction
   ═══════════════════════════════════════════════════ */

const bookColumns: ColumnConfig<Book>[] = [
  { key: 'title', label: 'Title', width: '1fr' },
  { key: 'author', label: 'Author', width: 120 },
  { key: 'status', label: 'Status', width: 80 },
  { key: 'rating', label: 'Rating', width: 60 },
];

const bookFilters: FilterConfig[] = [
  { field: 'status', type: 'select', options: ['All', 'to-read', 'reading', 'read'] },
  { field: '_search', type: 'text', placeholder: 'Search title or author…' },
];

export const BrowseBooks: MenuStory = {
  render: () => (
    <div style={{ width: 600, height: 400 }}>
      <ListView<Book>
        items={BOOKS}
        columns={bookColumns}
        filters={bookFilters}
        searchFields={['title', 'author']}
        rowKey="id"
        toolbar={[{ label: '➕ Add', action: { type: 'navigate', card: 'addBook' }, variant: 'default' }]}
        onRowClick={(row) => alert(`Navigate to detail for: ${row.title} (id=${row.id})`)}
        onAction={(action) => alert(JSON.stringify(action))}
        emptyMessage="No books yet — add some! 📖"
      />
    </div>
  ),
};

/* ═══════════════════════════════════════════════════
   Story 3: Book detail card
   DSL: type 'detail', dataSource 'books', keyField 'id',
        fields, computed, buttons
   ═══════════════════════════════════════════════════ */

const detailFields: FieldConfig[] = [
  { id: 'id', label: 'ID', type: 'readonly' },
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'author', label: 'Author', type: 'text' },
  { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
  { id: 'rating', label: 'Rating', type: 'number', step: 1 },
];

const detailComputed: ComputedFieldConfig<Book>[] = [
  {
    id: 'readingProgress',
    label: 'Progress',
    compute: (r) =>
      r.status === 'read' ? '✅ Finished' : r.status === 'reading' ? '📖 In Progress' : '📋 Queued',
  },
];

function BookDetailDemo() {
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const record = BOOKS[0]; // Simulating ctx.paramValue='b1' lookup

  const actions: ActionConfig[] = [
    { label: '✏️ Save', variant: 'primary', action: { type: 'saveBook', id: record.id, edits } },
    { label: '🗑 Delete', variant: 'danger', action: { type: 'deleteBook', id: record.id } },
  ];

  return (
    <DetailView<Book>
      record={record}
      fields={detailFields}
      computed={detailComputed}
      edits={edits}
      onEdit={(id, v) => setEdits((p) => ({ ...p, [id]: v }))}
      actions={actions}
      onAction={(a) => alert(JSON.stringify(a))}
    />
  );
}

export const BookDetail: MenuStory = {
  render: () => <BookDetailDemo />,
};

/* ═══════════════════════════════════════════════════
   Story 4: Add book form card
   DSL: type 'form', fields, submitAction, submitLabel
   ═══════════════════════════════════════════════════ */

const formFields: FieldConfig[] = [
  { id: 'title', label: 'Title', type: 'text', placeholder: 'Book title', required: true },
  { id: 'author', label: 'Author', type: 'text', placeholder: 'Author name', required: true },
  { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
  { id: 'rating', label: 'Rating', type: 'number', step: 1, defaultValue: 0 },
];

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
      fields={formFields}
      values={values}
      onChange={(id, v) => setValues((p) => ({ ...p, [id]: v }))}
      onSubmit={(v) => {
        // Simulates: ctx.dispatch({ ...submitAction, values: v })
        setResult(`📚 Added: ${JSON.stringify(v)}`);
      }}
      submitResult={result}
      submitLabel="📚 Add Book"
    />
  );
}

export const AddBook: MenuStory = {
  render: () => <AddBookDemo />,
};
