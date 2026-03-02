import type { Meta, StoryObj } from '@storybook/react';
import { NodeEditor } from './NodeEditor';
import { INITIAL_NODES, INITIAL_CONNECTIONS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof NodeEditor> = {
  title: 'RichWidgets/NodeEditor',
  component: NodeEditor,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof NodeEditor>;

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
    initialNodes: [],
    initialConnections: [],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const SingleChain: Story = {
  args: {
    initialNodes: [
      {
        id: 'a',
        x: 80,
        y: 120,
        title: 'Source',
        icon: '📁',
        inputs: [],
        outputs: [{ id: 'a-out-0', label: 'Data', type: 'data' }],
        fields: [{ label: 'File', value: 'input.csv' }],
      },
      {
        id: 'b',
        x: 380,
        y: 120,
        title: 'Transform',
        icon: '⚙️',
        inputs: [{ id: 'b-in-0', label: 'Input', type: 'data' }],
        outputs: [{ id: 'b-out-0', label: 'Output', type: 'data' }],
        fields: [{ label: 'Op', value: 'normalize' }],
      },
      {
        id: 'c',
        x: 680,
        y: 120,
        title: 'Output',
        icon: '💾',
        inputs: [{ id: 'c-in-0', label: 'Input', type: 'data' }],
        outputs: [],
        fields: [{ label: 'File', value: 'output.csv' }],
      },
    ],
    initialConnections: [
      { from: 'a-out-0', to: 'b-in-0' },
      { from: 'b-out-0', to: 'c-in-0' },
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
