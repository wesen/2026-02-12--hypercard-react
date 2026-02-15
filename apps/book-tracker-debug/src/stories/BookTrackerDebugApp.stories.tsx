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
  cardParams: { bookDetail: 'b1' },
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
