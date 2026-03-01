import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../app/store';
import { MOCK_APPS_MANY, MOCK_GEPA, MOCK_INVENTORY_UNHEALTHY } from '../mocks/fixtures/apps';
import { createDefaultAppsHandlers } from '../mocks/msw/defaultHandlers';
import { AppsFolderWindow } from './AppsFolderWindow';

function StoreDecorator(Story: React.ComponentType) {
  const store = createAppsBrowserStore();
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'Apps/AppsBrowser/AppsFolderWindow',
  component: AppsFolderWindow,
  decorators: [StoreDecorator],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof AppsFolderWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const WithUnhealthy: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({
        apps: [MOCK_INVENTORY_UNHEALTHY, MOCK_GEPA],
      }),
    },
  },
};

export const ManyModules: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({ apps: MOCK_APPS_MANY }),
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({}, { delayMs: 60000 }),
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({ apps: [] }),
    },
  },
};
