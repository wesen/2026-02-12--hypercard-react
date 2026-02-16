import type { Meta, StoryObj } from '@storybook/react';
import {
  InventoryCardPanelWidget,
  InventoryGeneratedWidgetPanel,
} from '../features/chat/InventoryArtifactPanelWidgets';
import type { TimelineWidgetItem } from '../features/chat/chatSlice';

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
  },
];

const cardMeta = {
  title: 'Widgets/Inventory Card Panel',
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
