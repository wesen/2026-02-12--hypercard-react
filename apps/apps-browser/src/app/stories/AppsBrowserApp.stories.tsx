import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { AppsFolderWindow } from '../../components/AppsFolderWindow';
import { GetInfoWindow } from '../../components/GetInfoWindow';
import { HealthDashboardWindow } from '../../components/HealthDashboardWindow';
import { ModuleBrowserWindow } from '../../components/ModuleBrowserWindow';
import { MOCK_APPS_MANY, MOCK_GEPA, MOCK_INVENTORY_UNHEALTHY } from '../../mocks/fixtures/apps';
import { createDefaultAppsHandlers } from '../../mocks/msw/defaultHandlers';
import { createAppsBrowserStore } from '../store';

function StoreDecorator(Story: React.ComponentType) {
  const store = createAppsBrowserStore();
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
}

function WindowFrame({
  title,
  children,
  width = 600,
  height = 400,
}: {
  title: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        border: '2px solid #000',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--hc-font-family)',
      }}
    >
      <div
        style={{
          padding: '4px 8px',
          borderBottom: '2px solid #000',
          fontWeight: 'bold',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

const meta = {
  title: 'Apps/AppsBrowser/FullApp',
  decorators: [StoreDecorator],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Folder: Story = {
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
  render: () => (
    <WindowFrame title="Mounted Apps" width={520} height={400}>
      <AppsFolderWindow />
    </WindowFrame>
  ),
};

export const Browser: Story = {
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
  render: () => (
    <WindowFrame title="Module Browser" width={780} height={560}>
      <ModuleBrowserWindow initialAppId="gepa" />
    </WindowFrame>
  ),
};

export const GetInfo: Story = {
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
  render: () => (
    <WindowFrame title="GEPA — Get Info" width={440} height={520}>
      <GetInfoWindow app={MOCK_GEPA} />
    </WindowFrame>
  ),
};

export const HealthDashboard: Story = {
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
  render: () => (
    <WindowFrame title="Health Dashboard" width={600} height={480}>
      <HealthDashboardWindow />
    </WindowFrame>
  ),
};

export const DegradedHealthDashboard: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({
        apps: [MOCK_INVENTORY_UNHEALTHY, MOCK_GEPA],
      }),
    },
  },
  render: () => (
    <WindowFrame title="Health Dashboard" width={600} height={480}>
      <HealthDashboardWindow />
    </WindowFrame>
  ),
};

export const ManyModulesBrowser: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({ apps: MOCK_APPS_MANY }),
    },
  },
  render: () => (
    <WindowFrame title="Module Browser" width={780} height={560}>
      <ModuleBrowserWindow />
    </WindowFrame>
  ),
};
