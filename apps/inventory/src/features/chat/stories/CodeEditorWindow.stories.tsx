import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CodeEditorWindow } from '../CodeEditorWindow';
import { registerRuntimeCard, clearRuntimeCardRegistry } from '@hypercard/engine';

// Minimal store for useDispatch (CodeEditorWindow doesn't use Redux, but its imports may)
const store = configureStore({ reducer: { _: (s = {}) => s } });

function Wrapper(props: React.ComponentProps<typeof CodeEditorWindow>) {
  return (
    <Provider store={store}>
      <div style={{ width: 640, height: 480, border: '1px solid #333', borderRadius: 4, overflow: 'hidden' }}>
        <CodeEditorWindow {...props} />
      </div>
    </Provider>
  );
}

const meta = {
  title: 'Apps/Inventory/Chat/CodeEditorWindow',
  component: Wrapper,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => {
      clearRuntimeCardRegistry();
      return <Story />;
    },
  ],
} satisfies Meta<typeof Wrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_CODE = `({ ui }) => ({
  render({ cardState, globalState }) {
    const filter = String(cardState?.category ?? "");
    const items = globalState?.domains?.inventory?.items ?? [];
    const filtered = filter
      ? items.filter(i => String(i?.category ?? "") === filter)
      : items;
    return ui.panel([
      ui.text("Inventory Browser"),
      ui.table(
        filtered.map(item => [
          String(item?.sku ?? ""),
          String(item?.name ?? ""),
          String(item?.qty ?? 0)
        ]),
        { headers: ["SKU", "Name", "Qty"] }
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

export const Empty: Story = {
  args: {
    cardId: 'newCard',
    initialCode: '({ ui }) => ({\n  render() {\n    return ui.panel([ui.text("Hello")]);\n  }\n})',
  },
};

export const PrefilledCode: Story = {
  args: {
    cardId: 'inventoryBrowser',
    initialCode: SAMPLE_CODE,
  },
};

export const AlreadyRegistered: Story = {
  args: {
    cardId: 'registeredCard',
    initialCode: SAMPLE_CODE,
  },
  decorators: [
    (Story) => {
      registerRuntimeCard('registeredCard', SAMPLE_CODE);
      return <Story />;
    },
  ],
};

export const WithSaveCallback: Story = {
  args: {
    cardId: 'callbackCard',
    initialCode: '({ ui }) => ({ render() { return ui.text("edit me"); } })',
    onSave: (cardId: string, code: string) => {
      console.log(`[Story] Saved ${cardId}: ${code.length} chars`);
    },
  },
};
