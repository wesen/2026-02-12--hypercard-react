import { createStoryHelpers } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { bookSharedActions, bookSharedSelectors } from '../app/cardRuntime';
import { createBookStore } from '../app/store';
import { BOOK_STACK } from '../domain/stack';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  stack: BOOK_STACK,
  sharedSelectors: bookSharedSelectors,
  sharedActions: bookSharedActions,
  createStore: createBookStore,
  navShortcuts: [
    { card: 'home', icon: '🏠' },
    { card: 'browse', icon: '📋' },
    { card: 'readingNow', icon: '🔥' },
    { card: 'readingReport', icon: '📊' },
    { card: 'addBook', icon: '➕' },
  ],
  cardParams: { bookDetail: 'b1' },
  snapshotSelector: (state: any) => ({
    navigation: state.navigation,
    books: state.books,
    runtime: state.hypercardRuntime,
  }),
  debugTitle: 'Book Tracker Debug',
});

const meta = {
  title: 'BookTrackerDebug/Full App',
  component: FullApp,
  decorators: [storeDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FullApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Home: Story = createStory('home');
export const Browse: Story = createStory('browse');
export const ReadingNow: Story = createStory('readingNow');
export const BookDetail: Story = createStory('bookDetail');
export const AddBook: Story = createStory('addBook');
export const ReadingReport: Story = createStory('readingReport');
