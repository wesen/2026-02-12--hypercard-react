import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenu } from './ContextMenu';

const meta = {
  title: 'Engine/Widgets/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    x: 80,
    y: 40,
    items: ['Get Info', 'Duplicate', 'Open', 'Move to Trash'],
    onSelect: () => {},
    onClose: () => {},
  },
};

export const WithSeparators: Story = {
  args: {
    x: 80,
    y: 40,
    items: [
      'Get Info',
      'Duplicate',
      { separator: true },
      'Open',
      'Open With…',
      { separator: true },
      'Move to Trash',
      { separator: true },
      'Inspect (Smalltalk)',
      'Browse Senders',
      'Browse Implementors',
    ],
    onSelect: () => {},
    onClose: () => {},
  },
};

export const ManyItems: Story = {
  args: {
    x: 80,
    y: 40,
    items: [
      'Cut',
      'Copy',
      'Paste',
      'Clear',
      { separator: true },
      'Select All',
      'Undo',
      'Redo',
      { separator: true },
      'Find…',
      'Replace…',
    ],
    onSelect: () => {},
    onClose: () => {},
  },
};
