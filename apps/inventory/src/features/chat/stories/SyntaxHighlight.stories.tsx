import type { Meta, StoryObj } from '@storybook/react';
import { SyntaxHighlight } from '../utils/SyntaxHighlight';

const meta = {
  title: 'Apps/Inventory/Chat/SyntaxHighlight',
  component: SyntaxHighlight,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SyntaxHighlight>;

export default meta;
type Story = StoryObj<typeof meta>;

const JS_CODE = `({ ui }) => ({
  render({ cardState, globalState }) {
    const items = (globalState?.domains?.inventory?.items ?? [])
      .filter(item => Number(item?.qty ?? 0) <= 5);
    return ui.panel([
      ui.text("Low Stock Items"),
      items.length === 0
        ? ui.text("No items below threshold.")
        : ui.table(
            items.map(item => [
              String(item?.sku ?? ""),
              String(item?.name ?? ""),
              String(item?.qty ?? 0),
              "$" + Number(item?.price ?? 0).toFixed(2)
            ]),
            { headers: ["SKU", "Name", "Qty", "Price"] }
          ),
      ui.button("Close", { onClick: { handler: "close" } })
    ]);
  },
  handlers: {
    close(ctx) {
      ctx.dispatchSystemCommand("window.close");
    }
  }
})`;

const YAML_CODE = `name: Low Stock Items
title: Items Below Reorder Threshold
artifact:
  id: low-stock-drilldown
  data:
    threshold: 5
card:
  id: lowStockDrilldown
  code: |-
    ({ ui }) => ({
      render({ globalState }) {
        return ui.panel([ui.text("Hello")]);
      }
    })`;

export const JavaScriptLight: Story = {
  args: { code: JS_CODE, language: 'javascript', variant: 'light' },
};

export const JavaScriptDark: Story = {
  args: { code: JS_CODE, language: 'javascript', variant: 'dark' },
};

export const YamlLight: Story = {
  args: { code: YAML_CODE, language: 'yaml', variant: 'light' },
};

export const YamlDark: Story = {
  args: { code: YAML_CODE, language: 'yaml', variant: 'dark' },
};

export const TruncatedWithExpand: Story = {
  args: { code: JS_CODE, language: 'javascript', variant: 'light', maxLines: 5 },
};

export const ShortCodeNoTruncation: Story = {
  args: { code: 'const x = 42;\nreturn ui.text(x);', language: 'javascript', variant: 'light', maxLines: 10 },
};
