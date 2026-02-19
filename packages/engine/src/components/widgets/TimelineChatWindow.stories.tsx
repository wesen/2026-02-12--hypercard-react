import type { Meta, StoryObj } from '@storybook/react';
import type { TimelineEntity } from '../../hypercard-chat/timeline/types';
import type { TimelineWidgetItem } from '../../hypercard-chat/types';
import {
  type HypercardWidgetPackRenderContext,
  registerHypercardWidgetPack,
} from '../../hypercard-chat/widgets/hypercardWidgetPack';
import { TimelineChatWindow } from '../../hypercard-chat/runtime/TimelineChatWindow';

// Story-level bootstrap mirrors runtime behavior where hosts register widget packs explicitly.
registerHypercardWidgetPack({ namespace: 'inventory' });

function at(msAgo: number): number {
  return Date.now() - msAgo;
}

const timelineEntities: TimelineEntity[] = [
  {
    id: 'msg-user-1',
    kind: 'message',
    createdAt: at(8000),
    props: { role: 'user', content: 'Show low stock and a restock card.', streaming: false },
  },
  {
    id: 'tool-low-stock',
    kind: 'tool_call',
    createdAt: at(7000),
    updatedAt: at(6900),
    props: {
      name: 'inventory_low_stock',
      input: { threshold: 3 },
      done: true,
      status: 'success',
    },
  },
  {
    id: 'low-stock-widget:widget',
    kind: 'hypercard_widget',
    createdAt: at(6800),
    updatedAt: at(6500),
    props: {
      schemaVersion: 1,
      itemId: 'low-stock-widget',
      title: 'Low Stock Items',
      widgetType: 'table',
      phase: 'ready',
      data: { artifact: { id: 'low-stock-items' } },
    },
  },
  {
    id: 'restock-card:card',
    kind: 'hypercard_card',
    createdAt: at(6400),
    updatedAt: at(6200),
    props: {
      schemaVersion: 1,
      itemId: 'restock-card',
      title: 'Restock Proposal',
      name: 'reportViewer',
      phase: 'ready',
      data: {
        artifact: { id: 'restock-proposal' },
        card: { id: 'runtime.restock.proposal', code: 'export default {}' },
      },
    },
  },
  {
    id: 'msg-ai-1',
    kind: 'message',
    createdAt: at(6000),
    props: { role: 'assistant', content: 'Generated widget and card proposals.', streaming: false },
  },
];

const widgetContext: HypercardWidgetPackRenderContext = {
  onOpenArtifact: (item: TimelineWidgetItem) => {
    console.info('[storybook] open artifact', item.artifactId);
  },
  onEditCard: (item: TimelineWidgetItem) => {
    console.info('[storybook] edit card', item.id);
  },
};

const meta = {
  title: 'Engine/Widgets/TimelineChatWindow',
  component: TimelineChatWindow,
  args: {
    timelineEntities,
    isStreaming: false,
    onSend: () => {},
    title: 'Inventory Chat',
    subtitle: 'storybook',
    placeholder: 'Ask about inventory...',
    widgetNamespace: 'inventory',
    widgetRenderContext: widgetContext,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 16, maxWidth: 860 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TimelineChatWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DebugMode: Story = {
  args: {
    debug: true,
  },
};

export const HostCallbacksWired: Story = {
  args: {
    widgetRenderContext: {
      ...widgetContext,
      debug: true,
    },
  },
};

export const UnknownWidgetFallback: Story = {
  args: {
    widgetNamespace: 'inventory-missing',
    widgetRenderContext: {},
  },
};

export const Streaming: Story = {
  args: {
    isStreaming: true,
    timelineEntities: [
      ...timelineEntities,
      {
        id: 'msg-ai-streaming',
        kind: 'message',
        createdAt: at(300),
        props: { role: 'assistant', content: 'Analyzing inventory deltas...', streaming: true },
      },
    ],
  },
};
