import { DesktopShell } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { inventorySharedActions, inventorySharedSelectors } from '../app/cardRuntime';
import { createInventoryStore } from '../app/store';
import { STACK } from '../domain/stack';
import '../../../../packages/engine/src/theme/classic.css';
import '../../../../packages/engine/src/theme/modern.css';

function ThemedShell({ themeClass }: { themeClass?: string }) {
  return (
    <DesktopShell
      stack={STACK}
      sharedSelectors={inventorySharedSelectors}
      sharedActions={inventorySharedActions}
      themeClass={themeClass}
    />
  );
}

function ThemedStoreDecorator(Story: React.ComponentType) {
  return (
    <Provider store={createInventoryStore()}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'Pages/Themed',
  component: ThemedShell,
  decorators: [ThemedStoreDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ThemedShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultTheme: Story = { args: {} };
export const ClassicMac: Story = { args: { themeClass: 'theme-classic' } };
export const Modern: Story = { args: { themeClass: 'theme-modern' } };
