import type { NavigationStateSlice } from '@hypercard/engine';
import {
  HyperCardShell,
  hypercardRuntimeReducer,
  navigate,
  navigationReducer,
  notificationsReducer,
  selectCurrentCardId,
} from '@hypercard/engine';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { App } from '../App';
import { todoSharedActions, todoSharedSelectors } from '../app/cardRuntime';
import { STACK } from '../domain/stack';
import { tasksReducer } from '../features/tasks/tasksSlice';

function freshStore() {
  return configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      navigation: navigationReducer,
      notifications: notificationsReducer,
      tasks: tasksReducer,
    },
  });
}

function TodoStoreDecorator(Story: React.ComponentType) {
  return (
    <Provider store={freshStore()}>
      <Story />
    </Provider>
  );
}

// ── Full App ──

const meta = {
  title: 'Todo/Full App',
  component: App,
  decorators: [TodoStoreDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// ── Individual Cards ──

type AppState = NavigationStateSlice;

function TodoShellAtCard({ card, param }: { card: string; param?: string }) {
  const dispatch = useDispatch();
  const currentCard = useSelector((s: AppState) => selectCurrentCardId(s));

  useEffect(() => {
    if (currentCard !== card) {
      dispatch(navigate({ card, paramValue: param }));
    }
  }, [dispatch, card, param, currentCard]);

  return (
    <HyperCardShell
      stack={STACK}
      sharedSelectors={todoSharedSelectors}
      sharedActions={todoSharedActions}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'inProgress', icon: '🔥' },
      ]}
    />
  );
}

export const Home: Story = {
  render: () => <TodoShellAtCard card="home" />,
};
export const AllTasks: Story = {
  render: () => <TodoShellAtCard card="browse" />,
};
export const InProgress: Story = {
  render: () => <TodoShellAtCard card="inProgress" />,
};
export const Completed: Story = {
  render: () => <TodoShellAtCard card="completed" />,
};
export const TaskDetail: Story = {
  render: () => <TodoShellAtCard card="taskDetail" param="t1" />,
};
export const NewTask: Story = {
  render: () => <TodoShellAtCard card="newTask" />,
};
