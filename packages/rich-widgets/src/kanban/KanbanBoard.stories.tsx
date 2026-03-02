import type { Meta, StoryObj } from '@storybook/react';
import { KanbanBoard } from './KanbanBoard';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof KanbanBoard> = {
  title: 'RichWidgets/KanbanBoard',
  component: KanbanBoard,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof KanbanBoard>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    initialTasks: [],
    initialColumns: INITIAL_COLUMNS,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const FewColumns: Story = {
  args: {
    initialColumns: [
      { id: 'todo', title: 'To Do', icon: '📋' },
      { id: 'progress', title: 'In Progress', icon: '⚡' },
      { id: 'done', title: 'Done', icon: '✅' },
    ],
    initialTasks: INITIAL_TASKS.map((t) => ({
      ...t,
      col: t.col === 'backlog' || t.col === 'review' ? 'todo' : t.col,
    })),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const ManyTasks: Story = {
  args: {
    initialTasks: [
      ...INITIAL_TASKS,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `gen-${i}`,
        col: INITIAL_COLUMNS[i % INITIAL_COLUMNS.length].id,
        title: `Generated task ${i + 1}`,
        tags: [(['bug', 'feature', 'docs'] as const)[i % 3]],
        priority: (['high', 'medium', 'low'] as const)[i % 3],
        desc: i % 2 === 0 ? `Description for task ${i + 1}` : '',
      })),
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
