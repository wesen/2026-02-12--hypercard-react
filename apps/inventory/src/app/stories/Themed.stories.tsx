import { DesktopShell } from '@hypercard/engine/desktop-react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createInventoryStore } from '../store';
import { STACK } from '../../domain/stack';
import '@hypercard/engine/theme/classic.css';
import '@hypercard/engine/theme/modern.css';

function ThemedShell({ themeClass }: { themeClass?: string }) {
  return <DesktopShell stack={STACK} themeClass={themeClass} />;
}

function ThemedStoreDecorator(Story: React.ComponentType) {
  return (
    <Provider store={createInventoryStore()}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'Apps/Inventory/Themed',
  component: ThemedShell,
  decorators: [ThemedStoreDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ThemedShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultTheme: Story = { args: {} };
export const ClassicMac: Story = { args: { themeClass: 'theme-classic' } };
export const Modern: Story = { args: { themeClass: 'theme-modern' } };
