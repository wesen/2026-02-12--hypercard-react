import type { Meta, StoryObj } from '@storybook/react';
import { EventViewerWindow } from '../EventViewerWindow';
import type { EventLogEntry } from '../eventBus';

const meta: Meta<typeof EventViewerWindow> = {
  title: 'Apps/Inventory/Chat/EventViewer',
  component: EventViewerWindow,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ width: 640, height: 480, background: '#111', color: '#ccc' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof EventViewerWindow>;

let seq = 0;
function makeEntry(
  type: string,
  overrides: Partial<EventLogEntry> = {},
): EventLogEntry {
  seq += 1;
  const dot = type.indexOf('.');
  const family = dot >= 0 && ['llm', 'tool', 'hypercard', 'timeline', 'ws'].includes(type.slice(0, dot))
    ? type.slice(0, dot)
    : 'other';
  return {
    id: `story-evt-${seq}`,
    timestamp: Date.now() - (200 - seq) * 1000,
    eventType: type,
    eventId: `evt-${seq}`,
    family,
    summary: overrides.summary ?? type,
    rawPayload: overrides.rawPayload ?? {
      event: { type, id: `evt-${seq}`, data: { example: 'payload' } },
    },
    ...overrides,
  };
}

export const Empty: Story = {
  args: {
    conversationId: 'story-empty',
    initialEntries: [],
  },
};

export const MixedEvents: Story = {
  args: {
    conversationId: 'story-mixed',
    initialEntries: [
      makeEntry('llm.start', { summary: 'inference started' }),
      makeEntry('llm.delta', { summary: '+12 chars (12 total)' }),
      makeEntry('llm.delta', { summary: '+8 chars (20 total)' }),
      makeEntry('llm.delta', { summary: '+15 chars (35 total)' }),
      makeEntry('tool.start', {
        summary: 'start get_inventory',
        rawPayload: {
          event: {
            type: 'tool.start',
            id: 'tool-1',
            data: { name: 'get_inventory', input: { category: 'electronics', limit: 50 } },
          },
        },
      }),
      makeEntry('tool.result', {
        summary: 'tool result',
        rawPayload: {
          event: {
            type: 'tool.result',
            id: 'tool-1',
            data: {
              result: {
                items: [
                  { id: 'SKU-001', name: 'Laptop Pro', qty: 42, price: 1299.99 },
                  { id: 'SKU-002', name: 'Wireless Mouse', qty: 156, price: 29.99 },
                ],
                totalCount: 2,
              },
            },
          },
        },
      }),
      makeEntry('tool.done', { summary: 'tool done' }),
      makeEntry('hypercard.suggestions.v1', {
        summary: 'suggestions',
        rawPayload: {
          event: {
            type: 'hypercard.suggestions.v1',
            data: { suggestions: ['Show low stock', 'Generate report', 'Check orders'] },
          },
        },
      }),
      makeEntry('timeline.upsert', {
        summary: 'upsert card',
        rawPayload: {
          event: {
            type: 'timeline.upsert',
            data: {
              entity: {
                id: 'card:inv-report',
                kind: 'card',
                template: 'reportViewer',
                artifactId: 'inventory_summary',
              },
            },
          },
        },
      }),
      makeEntry('llm.final', {
        summary: 'inference complete',
        rawPayload: {
          event: {
            type: 'llm.final',
            id: 'msg-1',
            data: { text: 'Here is your inventory report.' },
            metadata: {
              model: 'claude-sonnet-4-20250514',
              usage: { inputTokens: 2048, outputTokens: 350, cachedTokens: 1500 },
              durationMs: 4200,
            },
          },
        },
      }),
    ],
  },
};

export const HighVolume: Story = {
  args: {
    conversationId: 'story-highvol',
    initialEntries: Array.from({ length: 200 }, (_, i) => {
      const types = ['llm.delta', 'llm.delta', 'llm.delta', 'tool.start', 'tool.done', 'timeline.upsert'];
      const type = types[i % types.length];
      return makeEntry(type, { summary: `Event ${i + 1}: ${type}` });
    }),
  },
};

export const ColorCoded: Story = {
  args: {
    conversationId: 'story-colors',
    initialEntries: [
      makeEntry('llm.start', { summary: 'LLM inference started' }),
      makeEntry('llm.delta', { summary: '+22 chars' }),
      makeEntry('llm.final', { summary: 'LLM inference complete' }),
      makeEntry('tool.start', { summary: 'start search_database' }),
      makeEntry('tool.result', { summary: 'result received' }),
      makeEntry('tool.done', { summary: 'tool done' }),
      makeEntry('hypercard.ready', { summary: 'card ready' }),
      makeEntry('hypercard.suggestions.v1', { summary: 'suggestions emitted' }),
      makeEntry('timeline.upsert', { summary: 'timeline entity upserted' }),
      makeEntry('ws.error', { summary: 'connection timeout' }),
    ],
  },
};
