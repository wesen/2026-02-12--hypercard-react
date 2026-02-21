import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { CodeEditorWindow } from '../../hypercard/editor/CodeEditorWindow';
import { clearRuntimeCardRegistry, registerRuntimeCard } from '../../plugin-runtime';

const store = configureStore({ reducer: { _: (s = {}) => s } });

function Wrapper(props: React.ComponentProps<typeof CodeEditorWindow>) {
  return (
    <Provider store={store}>
      <div
        style={{
          width: 760,
          height: 520,
          border: '1px solid #333',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <CodeEditorWindow {...props} />
      </div>
    </Provider>
  );
}

const meta = {
  title: 'Engine/Widgets/CodeEditorWindow',
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
  render({ globalState }) {
    const items = globalState?.domains?.inventory?.items ?? [];
    return ui.panel([
      ui.text("Inventory Browser"),
      ui.table(
        items.map(item => [
          String(item?.sku ?? ""),
          String(item?.name ?? ""),
          String(item?.qty ?? 0)
        ]),
        { headers: ["SKU", "Name", "Qty"] }
      )
    ]);
  }
})`;

export const Empty: Story = {
  args: {
    cardId: 'newCard',
    initialCode: '({ ui }) => ({\\n  render() {\\n    return ui.panel([ui.text(\"Hello\")]);\\n  }\\n})',
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
