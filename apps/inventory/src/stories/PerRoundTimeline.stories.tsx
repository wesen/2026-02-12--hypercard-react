import type { Meta, StoryObj } from '@storybook/react';
import { InventoryTimelineWidget } from '../features/chat/InventoryTimelineWidget';
import type { TimelineWidgetItem } from '../features/chat/chatSlice';

/**
 * These stories demonstrate the per-round timeline widget behavior introduced in F1.
 * Each round gets its own InventoryTimelineWidget instance placed inline with the
 * conversation messages that produced them.
 *
 * In the real app, separate widget messages with round-keyed IDs are created
 * by the reducer. Here we render individual InventoryTimelineWidget instances
 * to show what each round's widget looks like.
 */

function at(msAgo: number): number {
  return Date.now() - msAgo;
}

const round1Items: TimelineWidgetItem[] = [
  {
    id: 'tool:r1-search',
    title: 'Tool inventory_low_stock',
    status: 'success',
    detail: 'done',
    kind: 'tool',
    updatedAt: at(20000),
    rawData: { name: 'inventory_low_stock', input: { threshold: 5 } },
  },
  {
    id: 'widget:r1-1',
    title: 'Low Stock Widget',
    status: 'success',
    detail: 'template=miniKpi · artifact=low_stock_overview',
    kind: 'widget',
    template: 'miniKpi',
    artifactId: 'low_stock_overview',
    updatedAt: at(18000),
  },
];

const round2Items: TimelineWidgetItem[] = [
  {
    id: 'tool:r2-report',
    title: 'Tool inventory_report',
    status: 'running',
    detail: 'args={"low_stock_threshold":5}',
    kind: 'tool',
    updatedAt: at(5000),
    rawData: { name: 'inventory_report', input: { low_stock_threshold: 5 } },
  },
  {
    id: 'card:r2-1',
    title: 'Inventory Report',
    status: 'running',
    detail: 'started',
    kind: 'card',
    template: 'reportViewer',
    updatedAt: at(3000),
  },
];

const hydratedItems: TimelineWidgetItem[] = [
  {
    id: 'tool:h-1',
    title: 'Tool inventory_search_items',
    status: 'success',
    detail: 'done',
    kind: 'tool',
    updatedAt: at(60000),
  },
  {
    id: 'widget:h-1',
    title: 'Search Results Widget',
    status: 'success',
    detail: 'template=dataTable',
    kind: 'widget',
    template: 'dataTable',
    updatedAt: at(58000),
  },
];

/**
 * Composite component simulating a multi-round chat with interleaved timeline widgets.
 */
function MultiRoundDemo({
  rounds,
}: {
  rounds: { label: string; items: TimelineWidgetItem[]; messages?: string[] }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, fontFamily: 'system-ui' }}>
      {rounds.map((round, idx) => (
        <div key={idx}>
          {round.messages?.map((msg, i) => (
            <div key={i} style={{ padding: '4px 0', color: '#333' }}>
              {msg}
            </div>
          ))}
          {round.items.length > 0 && (
            <div style={{ margin: '4px 0' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  background: '#f0f0f4',
                  borderBottom: '1px solid #d9d9df',
                }}
              >
                {round.label}
              </div>
              <InventoryTimelineWidget items={round.items} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: 'Widgets/Per-Round Timeline',
  component: MultiRoundDemo,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560, maxWidth: '95vw' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MultiRoundDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single round with tool calls and a widget */
export const SingleRound: Story = {
  args: {
    rounds: [
      {
        label: 'Run Timeline (round 1)',
        items: round1Items,
        messages: ['You: Show me low stock items', 'AI: Here are 3 items that are low stock...'],
      },
    ],
  },
};

/** Two distinct rounds with separate timeline widgets */
export const TwoRounds: Story = {
  args: {
    rounds: [
      {
        label: 'Run Timeline (round 1)',
        items: round1Items,
        messages: ['You: Show me low stock items', 'AI: Here are 3 items that are low stock...'],
      },
      {
        label: 'Run Timeline (round 2)',
        items: round2Items,
        messages: ['You: Generate a full inventory report'],
      },
    ],
  },
};

/** Hydrated "Previous Session" widget plus one live round */
export const HydratedPlusLive: Story = {
  args: {
    rounds: [
      {
        label: 'Run Timeline (Previous Session)',
        items: hydratedItems,
        messages: ['(hydrated from previous session)'],
      },
      {
        label: 'Run Timeline (round 1)',
        items: round1Items,
        messages: ['You: Show me low stock items', 'AI: Here are 3 items that are low stock...'],
      },
    ],
  },
};

/** A round where no tool calls occurred — no timeline widget should appear */
export const EmptyRound: Story = {
  args: {
    rounds: [
      {
        label: 'Run Timeline (round 1)',
        items: [],
        messages: ['You: Hello', 'AI: Hi! How can I help you with inventory today?'],
      },
    ],
  },
};
