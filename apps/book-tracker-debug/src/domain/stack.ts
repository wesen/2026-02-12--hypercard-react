import { defineCardStack, type CardStackDefinition } from '@hypercard/engine';
import {
  addBookCard,
  bookDetailCard,
  browseCard,
  homeCard,
  readingNowCard,
  readingReportCard,
} from './cards';
import type { BooksStateSlice } from './types';

export const BOOK_STACK: CardStackDefinition<BooksStateSlice> = defineCardStack({
  id: 'bookTrackerDebug',
  name: 'Book Tracker',
  icon: '📚',
  homeCard: 'home',
  cards: {
    home: homeCard,
    browse: browseCard,
    readingNow: readingNowCard,
    bookDetail: bookDetailCard,
    addBook: addBookCard,
    readingReport: readingReportCard,
  },
});
