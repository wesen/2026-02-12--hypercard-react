import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {
  HyperCardShell,
  navigate,
  selectCurrentCardId,
} from '@hypercard/engine';
import type { NavigationStateSlice } from '@hypercard/engine';
import { App } from '../App';
import { createAppStore } from '../app/store';
import { bookSharedActions, bookSharedSelectors } from '../app/cardRuntime';
import { BOOK_STACK } from '../domain/stack';
import { DebugPane } from '../debug/DebugPane';
import { useRuntimeDebugHooks } from '../debug/useRuntimeDebugHooks';

function BookTrackerStoreDecorator(Story: React.ComponentType) {
  return (
    <Provider store={createAppStore()}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'BookTrackerDebug/Full App',
  component: App,
  decorators: [BookTrackerStoreDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

type AppState = NavigationStateSlice;

function DebugShellAtCard({ card, param }: { card: string; param?: string }) {
  const debugHooks = useRuntimeDebugHooks();
  const dispatch = useDispatch();
  const currentCard = useSelector((state: AppState) => selectCurrentCardId(state));

  useEffect(() => {
    if (currentCard !== card) {
      dispatch(navigate({ card, paramValue: param }));
    }
  }, [dispatch, card, param, currentCard]);

  return (
    <HyperCardShell
      stack={BOOK_STACK}
      sharedSelectors={bookSharedSelectors}
      sharedActions={bookSharedActions}
      debugHooks={debugHooks}
      renderAIPanel={() => <DebugPane />}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'readingNow', icon: '🔥' },
        { card: 'readingReport', icon: '📊' },
        { card: 'addBook', icon: '➕' },
      ]}
    />
  );
}

export const Home: Story = {
  render: () => <DebugShellAtCard card="home" />,
};

export const Browse: Story = {
  render: () => <DebugShellAtCard card="browse" />,
};

export const Detail: Story = {
  render: () => <DebugShellAtCard card="bookDetail" param="b1" />,
};
