import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { App } from '../../App';
import { createInventoryStore } from '../store';

function FullAppStoreDecorator(Story: React.ComponentType) {
  return (
    <Provider store={createInventoryStore()}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'Apps/Inventory/FullApp',
  component: App,
  decorators: [FullAppStoreDecorator],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
