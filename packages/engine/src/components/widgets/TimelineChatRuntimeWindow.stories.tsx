import type { Meta, StoryObj } from '@storybook/react';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { useMemo, useRef } from 'react';
import { createSemRegistry } from '../../hypercard-chat/sem/registry';
import { TimelineChatRuntimeWindow } from '../../hypercard-chat/runtime/timelineChatRuntime';
import type { TimelineEntity } from '../../hypercard-chat/timeline/types';

function at(msAgo: number): number {
  return Date.now() - msAgo;
}

const noopDispatch = ((action: UnknownAction) => action) as Dispatch<UnknownAction>;

const runtimeTimelineEntities: TimelineEntity[] = [
  {
    id: 'msg-user-1',
    kind: 'message',
    createdAt: at(9000),
    props: { role: 'user', content: 'Show low stock by warehouse.', streaming: false },
  },
  {
    id: 'tool-1',
    kind: 'tool_call',
    createdAt: at(8000),
    updatedAt: at(7800),
    props: { name: 'inventory_low_stock', done: true, input: { threshold: 2 } },
  },
  {
    id: 'widget-1:widget',
    kind: 'hypercard_widget',
    createdAt: at(7600),
    updatedAt: at(7300),
    props: {
      schemaVersion: 1,
      itemId: 'widget-1',
      title: 'Warehouse Low Stock',
      widgetType: 'table',
      phase: 'ready',
      data: { artifact: { id: 'low-stock-by-warehouse' } },
    },
  },
  {
    id: 'msg-ai-1',
    kind: 'message',
    createdAt: at(7000),
    props: { role: 'assistant', content: 'Prepared warehouse summary widget.', streaming: false },
  },
];

function RuntimeStoryHost({
  timelineEntities,
  debug = false,
  widgetNamespace = 'inventory',
}: {
  timelineEntities: TimelineEntity[];
  debug?: boolean;
  widgetNamespace?: string;
}) {
  const semRegistry = useRef(createSemRegistry());

  const createClient = useMemo(() => {
    return (_handlers: unknown) => ({
      connect: () => {},
      close: () => {},
    });
  }, []);

  return (
    <TimelineChatRuntimeWindow
      conversationId="conv-story"
      dispatch={noopDispatch}
      timelineEntities={timelineEntities}
      semRegistry={semRegistry.current}
      createClient={createClient}
      projectionMode="timeline-upsert-only"
      widgetNamespace={widgetNamespace}
      debug={debug}
      hostActions={{
        onOpenArtifact: (item) => console.info('[storybook] open artifact', item.artifactId),
        onEditCard: (item) => console.info('[storybook] edit card', item.id),
      }}
      onSend={(text) => console.info('[storybook] send', text)}
      title="Runtime Chat"
      subtitle="runtime boundary"
      placeholder="Ask inventory runtime..."
      suggestions={['Show low stock', 'Generate summary card']}
      showSuggestionsAlways
    />
  );
}

const meta = {
  title: 'Engine/Widgets/TimelineChatRuntimeWindow',
  component: RuntimeStoryHost,
  args: {
    timelineEntities: runtimeTimelineEntities,
    debug: false,
    widgetNamespace: 'inventory',
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
} satisfies Meta<typeof RuntimeStoryHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DebugMode: Story = {
  args: {
    debug: true,
  },
};

export const UnknownWidgetFallback: Story = {
  args: {
    widgetNamespace: 'inventory-missing',
  },
};
