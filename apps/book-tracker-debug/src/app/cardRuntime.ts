import {
  type SharedActionRegistry,
  type SharedSelectorRegistry,
} from '@hypercard/engine';
import type { BooksStateSlice, BookStatus } from '../domain/types';
import { selectBooks } from '../features/books/selectors';
import {
  createBook,
  deleteBook,
  markAllRead,
  resetDemo,
  saveBook,
  setStatus,
} from '../features/books/booksSlice';

export const bookSharedSelectors: SharedSelectorRegistry<BooksStateSlice> = {
  'books.all': (state) => selectBooks(state),
  'books.reading': (state) => selectBooks(state).filter((b) => b.status === 'reading'),
  'books.paramId': (_state, _args, ctx) => String(ctx.params.param ?? ''),
  'books.byParam': (state, _args, ctx) => {
    const id = String(ctx.params.param ?? '');
    return selectBooks(state).find((b) => b.id === id) ?? null;
  },
  'books.reportSections': (state) => {
    const items = selectBooks(state);
    const total = items.length;
    const toRead = items.filter((b) => b.status === 'to-read').length;
    const reading = items.filter((b) => b.status === 'reading').length;
    const read = items.filter((b) => b.status === 'read').length;
    const avgRating = total
      ? (items.reduce((sum, b) => sum + Number(b.rating ?? 0), 0) / total).toFixed(1)
      : '0.0';

    return [
      { label: 'Total Books', value: String(total) },
      { label: 'To Read', value: String(toRead) },
      { label: 'Reading', value: String(reading) },
      { label: 'Read', value: String(read) },
      { label: 'Average Rating', value: avgRating },
    ];
  },
};

export const bookSharedActions: SharedActionRegistry<BooksStateSlice> = {
  'books.save': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(saveBook({
      id: String(data.id ?? ''),
      edits: (data.edits ?? {}) as Record<string, unknown>,
    }));
    ctx.patchScopedState('card', { edits: {} });
  },
  'books.delete': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(deleteBook({ id: String(data.id ?? '') }));
    ctx.nav.back();
  },
  'books.setStatus': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const id = String(data.id ?? '');
    const status = String(data.status ?? '') as BookStatus;
    if (!id || !status) return;
    ctx.dispatch(setStatus({ id, status }));
    ctx.patchScopedState('card', { edits: {} });
  },
  'books.markAllRead': (ctx) => {
    ctx.dispatch(markAllRead());
  },
  'books.resetDemo': (ctx) => {
    ctx.dispatch(resetDemo());
    ctx.patchScopedState('card', { edits: {} });
  },
  'books.create': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const title = String(values.title ?? '').trim();
    const author = String(values.author ?? '').trim();
    if (!title || !author) {
      ctx.patchScopedState('card', { submitResult: 'Title and Author are required' });
      return;
    }

    ctx.dispatch(createBook({
      title,
      author,
      status: values.status ? String(values.status) : 'to-read',
      rating: Number(values.rating ?? 0),
    }));

    ctx.patchScopedState('card', {
      submitResult: 'Book added',
      formValues: { title: '', author: '', status: 'to-read', rating: 0 },
    });
  },
};
