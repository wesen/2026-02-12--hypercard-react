import type {
  ColumnConfig,
  ComputedFieldConfig,
  FieldConfig,
  FilterConfig,
} from '@hypercard/engine';
import type { Book } from '../types';

export const BOOK_COLUMNS: ColumnConfig<Book>[] = [
  { key: 'title', label: 'Title', width: '1fr' },
  { key: 'author', label: 'Author', width: 160 },
  { key: 'status', label: 'Status', width: 90 },
  { key: 'rating', label: 'Rating', width: 80 },
];

export const BOOK_FILTERS: FilterConfig[] = [
  { field: 'status', type: 'select', options: ['All', 'to-read', 'reading', 'read'] },
  { field: '_search', type: 'text', placeholder: 'Search title or author...' },
];

export const DETAIL_FIELDS: FieldConfig[] = [
  { id: 'id', label: 'ID', type: 'readonly' },
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'author', label: 'Author', type: 'text' },
  { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
  { id: 'rating', label: 'Rating', type: 'number', step: 1 },
];

export const DETAIL_COMPUTED: ComputedFieldConfig<Book>[] = [
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

export const FORM_FIELDS: FieldConfig[] = [
  { id: 'title', label: 'Title', type: 'text', placeholder: 'Book title', required: true },
  { id: 'author', label: 'Author', type: 'text', placeholder: 'Author name', required: true },
  { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
  { id: 'rating', label: 'Rating', type: 'number', step: 1 },
];
