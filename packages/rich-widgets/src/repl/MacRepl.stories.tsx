import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { MacRepl } from './MacRepl';
import {
  createMacReplStateSeed,
  MAC_REPL_STATE_KEY,
  macReplActions,
  macReplReducer,
} from './replState';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof MacRepl> = {
  title: 'RichWidgets/MacRepl',
  component: MacRepl,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MacRepl>;

function createMacReplStoryStore() {
  return configureStore({
    reducer: {
      [MAC_REPL_STATE_KEY]: macReplReducer,
    },
  });
}

type MacReplStoryStore = ReturnType<typeof createMacReplStoryStore>;
type MacReplSeedStore = SeedStore<MacReplStoryStore>;

function renderWithStore(seedStore: MacReplSeedStore) {
  return () => (
    <SeededStoreProvider createStore={createMacReplStoryStore} seedStore={seedStore}>
      <MacRepl />
    </SeededStoreProvider>
  );
}

function renderSeededStory(seed: Parameters<typeof createMacReplStateSeed>[0]) {
  return renderWithStore((store) => {
    store.dispatch(macReplActions.replaceState(createMacReplStateSeed(seed)));
  });
}

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const CustomPrompt: Story = {
  render: renderSeededStory({ prompt: '❯' }),
  decorators: [fullscreenDecorator],
};

export const WithHistory: Story = {
  render: renderSeededStory({
    initialLines: [
      { type: 'system', text: 'Macintosh System REPL v1.0' },
      { type: 'system', text: '' },
      { type: 'input', text: 'whoami' },
      { type: 'output', text: 'macuser' },
      { type: 'input', text: 'date' },
      { type: 'output', text: '3/5/2026, 9:41:00 AM' },
      { type: 'input', text: 'fortune' },
      { type: 'output', text: 'The best way to predict the future is to invent it. — Alan Kay' },
      { type: 'system', text: '' },
    ],
    historyStack: ['whoami', 'date', 'fortune'],
  }),
  decorators: [fullscreenDecorator],
};

export const ErrorOutput: Story = {
  render: renderSeededStory({
    initialLines: [
      { type: 'system', text: 'Macintosh System REPL v1.0' },
      { type: 'input', text: 'open /System/Extensions' },
      { type: 'error', text: 'Permission denied: /System/Extensions' },
      { type: 'input', text: 'connect prod-db --mode write' },
      { type: 'error', text: 'Network timeout while opening session' },
      { type: 'system', text: '' },
    ],
  }),
  decorators: [fullscreenDecorator],
};

export const LongSession: Story = {
  render: renderSeededStory({
    initialLines: Array.from({ length: 24 }, (_, index) =>
      index % 3 === 0
        ? { type: 'input' as const, text: `echo run-${index}` }
        : index % 3 === 1
          ? { type: 'output' as const, text: `run-${index - 1}` }
          : { type: 'system' as const, text: '' },
    ),
    historyStack: Array.from({ length: 8 }, (_, index) => `echo run-${index * 3}`),
  }),
  decorators: [fixedFrameDecorator('100%', 640)],
};
