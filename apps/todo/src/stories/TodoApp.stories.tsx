import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { navigationReducer, notificationsReducer, navigate } from '@hypercard/engine';
import type { NavigationStateSlice } from '@hypercard/engine';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { tasksReducer } from '../features/tasks/tasksSlice';
import { selectTasks, type TasksStateSlice } from '../features/tasks/selectors';
import { App } from '../App';
import { STACK } from '../domain/stack';
import { todoActionHandler } from '../app/domainActionHandler';
import { todoRenderers } from '../overrides/cardRenderers';
import { HyperCardShell } from '@hypercard/engine';
import { selectCurrentCardId } from '@hypercard/engine';

function freshStore() {
  return configureStore({
    reducer: {
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

type AppState = TasksStateSlice & NavigationStateSlice;

function TodoShellAtCard({ card, param }: { card: string; param?: string }) {
  const dispatch = useDispatch();
  const currentCard = useSelector((s: AppState) => selectCurrentCardId(s));
  const tasks = useSelector((s: AppState) => selectTasks(s));

  useEffect(() => {
    if (currentCard !== card) {
      dispatch(navigate({ card, paramValue: param }));
    }
  }, [dispatch, card, param, currentCard]);

  return (
    <HyperCardShell
      stack={STACK as any}
      domainActionHandler={todoActionHandler}
      customRenderers={todoRenderers}
      domainData={{ tasks }}
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
