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

export const ActionEntries: Story = {
  args: {
    x: 80,
    y: 40,
    items: [
      { id: 'close', label: 'Close Window', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
      { separator: true },
      { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
      { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade', checked: true },
      { id: 'disabled', label: 'Disabled Item', commandId: 'window.disabled', disabled: true },
    ],
    onSelect: () => {},
    onAction: () => {},
    onClose: () => {},
  },
};

export const WidgetTargetActions: Story = {
  args: {
    x: 80,
    y: 40,
    items: [
      {
        id: 'timeline-pin',
        label: 'Pin Timeline Widget',
        commandId: 'widget.timeline.pin',
        payload: { widgetId: 'timeline-widget', target: 'timeline' },
      },
      {
        id: 'timeline-copy',
        label: 'Copy Widget Data',
        commandId: 'widget.timeline.copy',
        payload: { widgetId: 'timeline-widget', format: 'json' },
      },
      { separator: true },
      {
        id: 'sidebar-collapse',
        label: 'Collapse Sidebar',
        commandId: 'widget.sidebar.collapse',
        payload: { widgetId: 'sidebar-main' },
        checked: true,
      },
    ],
    onSelect: () => {},
    onAction: () => {},
    onClose: () => {},
  },
};
