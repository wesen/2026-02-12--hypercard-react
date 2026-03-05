import type { Meta, StoryObj } from '@storybook/react';
import { MacRepl } from './MacRepl';
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

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const CustomPrompt: Story = {
  args: {
    prompt: '❯',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithHistory: Story = {
  args: {
    initialLines: [
      { type: 'system', text: 'Macintosh System REPL v1.0' },
      { type: 'system', text: '' },
      { type: 'input', text: 'whoami' },
      { type: 'output', text: 'macuser' },
      { type: 'input', text: 'date' },
      { type: 'output', text: new Date().toLocaleString() },
      { type: 'input', text: 'fortune' },
      {
        type: 'output',
        text: 'The best way to predict the future is to invent it. — Alan Kay',
      },
      { type: 'system', text: '' },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};
