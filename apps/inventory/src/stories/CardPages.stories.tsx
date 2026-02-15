import { createStoryHelpers } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { createInventoryStore } from '../app/store';
import { STACK } from '../domain/stack';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  stack: STACK,
  createStore: createInventoryStore,
  cardParams: { itemDetail: 'A-1002' },
});

const meta = {
  title: 'Pages/Cards',
  component: FullApp,
  decorators: [storeDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FullApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Home: Story = createStory('home');
export const Browse: Story = createStory('browse');
export const LowStock: Story = createStory('lowStock');
export const SalesLog: Story = createStory('salesToday');
export const ItemDetail: Story = createStory('itemDetail');
export const NewItem: Story = createStory('newItem');
export const Receive: Story = createStory('receive');
export const PriceChecker: Story = createStory('priceCheck');
export const Report: Story = createStory('report');
export const AIAssistant: Story = createStory('assistant');
