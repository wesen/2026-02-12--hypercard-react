import type { Meta, StoryObj } from '@storybook/react';
import {
  InventoryCardPanelWidget,
  InventoryGeneratedWidgetPanel,
} from '../InventoryArtifactPanelWidgets';
import type { TimelineWidgetItem } from '../chatSlice';

function at(msAgo: number): number {
  return Date.now() - msAgo;
}

const cardItems: TimelineWidgetItem[] = [
  {
    id: 'card:1',
    title: 'Low Stock Items',
    status: 'success',
    template: 'reportViewer',
    artifactId: 'low-stock-items',
    detail: 'template=reportViewer · artifact=low-stock-items',
    kind: 'card',
    updatedAt: at(5000),
  },
  {
    id: 'card:2',
    title: 'Detailed Inventory Summary',
    status: 'running',
    template: 'reportViewer',
    detail: 'updating',
    kind: 'card',
    updatedAt: at(9000),
  },
];

const widgetItems: TimelineWidgetItem[] = [
  {
    id: 'widget:1',
    title: 'Inventory Summary Report',
    status: 'success',
    template: 'report',
    artifactId: 'inventory-summary',
    detail: 'artifact=inventory-summary',
    kind: 'widget',
    updatedAt: at(4000),
  },
  {
    id: 'widget:2',
    title: 'Restock Priority',
    status: 'error',
    template: 'table',
    detail: 'malformed structured block',
    kind: 'widget',
    updatedAt: at(11000),
    rawData: {
      error: 'malformed structured block',
      rawContent: '{"widgetType":"table","data":{"artifact":{"id":"restock-priority","data":{broken',
      source: 'tool_result',
      toolId: 'generate_widget_abc123',
    },
  },
];

const cardMeta = {
  title: 'Apps/Inventory/Chat/InventoryArtifactPanelWidgets',
  component: InventoryCardPanelWidget,
  args: {
    items: cardItems,
  },
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
} satisfies Meta<typeof InventoryCardPanelWidget>;

export default cardMeta;
type Story = StoryObj<typeof cardMeta>;

export const CardsDefault: Story = {};

export const CardsEmpty: Story = {
  args: { items: [] },
};

export const WidgetsPanel: Story = {
  render: () => (
    <div style={{ width: 560, maxWidth: '95vw' }}>
      <InventoryGeneratedWidgetPanel items={widgetItems} />
    </div>
  ),
};

/** Card panel with debug mode enabled showing metadata for each item */
export const CardsDebugMode: Story = {
  args: { items: cardItems, debug: true },
};

/** Widget panel with debug mode enabled */
export const WidgetsDebugMode: Story = {
  render: () => (
    <div style={{ width: 560, maxWidth: '95vw' }}>
      <InventoryGeneratedWidgetPanel items={widgetItems} debug />
    </div>
  ),
};

/** Error items auto-show metadata table even without debug mode */
export const ErrorAutoShowsMeta: Story = {
  render: () => (
    <div style={{ width: 560, maxWidth: '95vw' }}>
      <InventoryGeneratedWidgetPanel items={widgetItems} />
    </div>
  ),
};
