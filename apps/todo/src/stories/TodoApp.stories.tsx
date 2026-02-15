import { createStoryHelpers } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { todoSharedActions, todoSharedSelectors } from '../app/cardRuntime';
import { createTodoStore } from '../app/store';
import { STACK } from '../domain/stack';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  stack: STACK,
  sharedSelectors: todoSharedSelectors,
  sharedActions: todoSharedActions,
  createStore: createTodoStore,
  cardParams: { taskDetail: 't1' },
});

const meta = {
  title: 'Todo/Full App',
  component: FullApp,
  decorators: [storeDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FullApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Home: Story = createStory('home');
export const AllTasks: Story = createStory('browse');
export const InProgress: Story = createStory('inProgress');
export const Completed: Story = createStory('completed');
export const TaskDetail: Story = createStory('taskDetail');
export const NewTask: Story = createStory('newTask');
