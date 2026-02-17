import type { Meta, StoryObj } from '@storybook/react';
import { InventoryTimelineWidget } from '../InventoryTimelineWidget';
import type { TimelineWidgetItem } from '../chatSlice';

function at(msAgo: number): number {
  return Date.now() - msAgo;
}

const toolWithArgs: TimelineWidgetItem = {
  id: 'tool:call-1',
  title: 'Tool inventory_low_stock',
  status: 'success',
  detail: 'args={"threshold":5}',
  kind: 'tool',
  updatedAt: at(5000),
  rawData: {
    name: 'inventory_low_stock',
    input: { threshold: 5, include_zero: true },
  },
};

const toolWithResult: TimelineWidgetItem = {
  id: 'tool:call-2',
  title: 'Tool inventory_report',
  status: 'success',
  detail: 'result={...}',
  kind: 'tool',
  updatedAt: at(9000),
  rawData: {
    result: {
      totalItems: 10,
      lowStockCount: 3,
      lowStockItems: [
        { sku: 'SHOE-RUN-42', name: 'Running Shoes', qty: 2, price: 89.99 },
        { sku: 'HAT-BEANIE', name: 'Winter Beanie', qty: 1, price: 24.99 },
        { sku: 'SOCK-WOOL-M', name: 'Wool Socks M', qty: 3, price: 12.50 },
      ],
      totalValue: 15234.50,
      avgPrice: 42.87,
    },
  },
};

const toolRunning: TimelineWidgetItem = {
  id: 'tool:call-3',
  title: 'Tool inventory_search_items',
  status: 'running',
  detail: 'args={"query":"shoes"}',
  kind: 'tool',
  updatedAt: at(2000),
  rawData: {
    name: 'inventory_search_items',
    input: { query: 'shoes', category: 'footwear' },
  },
};

const widgetReady: TimelineWidgetItem = {
  id: 'widget:tc-1',
  title: 'Low Stock Widget',
  status: 'success',
  detail: 'template=miniKpi · artifact=low_stock_overview',
  kind: 'widget',
  template: 'miniKpi',
  artifactId: 'low_stock_overview',
  updatedAt: at(4000),
};

const cardReady: TimelineWidgetItem = {
  id: 'card:tc-2',
  title: 'Detailed Inventory Summary',
  status: 'success',
  detail: 'template=reportViewer · artifact=detailed_inventory_summary',
  kind: 'card',
  template: 'reportViewer',
  artifactId: 'detailed_inventory_summary',
  updatedAt: at(3000),
};

const widgetError: TimelineWidgetItem = {
  id: 'widget:tc-3',
  title: 'Failed Widget',
  status: 'error',
  detail: 'Parse error: unexpected end of YAML',
  kind: 'widget',
  updatedAt: at(12000),
};

const largeResultTool: TimelineWidgetItem = {
  id: 'tool:call-large',
  title: 'Tool inventory_report',
  status: 'success',
  detail: 'result={...large payload...}',
  kind: 'tool',
  updatedAt: at(1000),
  rawData: {
    result: {
      report: {
        generatedAt: '2026-02-16T15:42:00Z',
        period: { from: '2026-02-01', to: '2026-02-16' },
        summary: {
          totalItems: 247,
          totalValue: 158234.50,
          averagePrice: 42.87,
          categories: ['footwear', 'apparel', 'accessories', 'electronics'],
        },
        lowStock: [
          { sku: 'SHOE-RUN-42', name: 'Running Shoes 42', qty: 2, reorderPoint: 10 },
          { sku: 'HAT-BEANIE-BLK', name: 'Black Winter Beanie', qty: 1, reorderPoint: 15 },
          { sku: 'SOCK-WOOL-M', name: 'Wool Socks Medium', qty: 3, reorderPoint: 20 },
          { sku: 'GLOVE-LEATHER-L', name: 'Leather Gloves L', qty: 0, reorderPoint: 5 },
          { sku: 'SCARF-SILK-RED', name: 'Red Silk Scarf', qty: 4, reorderPoint: 8 },
        ],
        topSellers: [
          { sku: 'TSHIRT-BASIC-M', name: 'Basic T-Shirt M', sold: 142, revenue: 2840.0 },
          { sku: 'JEANS-SLIM-32', name: 'Slim Jeans 32', sold: 98, revenue: 5880.0 },
          { sku: 'SHOE-CASUAL-10', name: 'Casual Shoes 10', sold: 67, revenue: 4355.0 },
        ],
      },
    },
  },
};

const allItems: TimelineWidgetItem[] = [
  toolRunning,
  cardReady,
  widgetReady,
  toolWithResult,
  toolWithArgs,
  widgetError,
];

const meta = {
  title: 'Apps/Inventory/Chat/InventoryTimelineWidget',
  component: InventoryTimelineWidget,
  args: {
    items: allItems,
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
} satisfies Meta<typeof InventoryTimelineWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default mixed timeline with collapsible tool items */
export const Default: Story = {};

/** Empty state */
export const Empty: Story = {
  args: { items: [] },
};

/** Tool items only — all collapsed by default */
export const AllCollapsed: Story = {
  args: {
    items: [toolWithArgs, toolWithResult, toolRunning],
  },
};

/** Mix of collapsible (tools) and non-collapsible (widget/card) items */
export const MixedItems: Story = {
  args: {
    items: [toolWithArgs, widgetReady, toolWithResult, cardReady],
  },
};

/** Tool with a large nested result payload */
export const LargePayload: Story = {
  args: {
    items: [largeResultTool],
  },
};

/** Debug mode showing metadata for each item */
export const DebugMode: Story = {
  args: {
    items: allItems,
    debug: true,
  },
};
