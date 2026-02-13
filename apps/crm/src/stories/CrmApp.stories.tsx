import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {
  HyperCardShell,
  navigate,
  selectCurrentCardId,
} from '@hypercard/engine';
import type { NavigationStateSlice } from '@hypercard/engine';
import { App } from '../App';
import { createAppStore } from '../app/store';
import { crmSharedActions, crmSharedSelectors } from '../app/cardRuntime';
import { CRM_STACK } from '../domain/stack';
import { DebugPane } from '../debug/DebugPane';
import { useRuntimeDebugHooks } from '../debug/useRuntimeDebugHooks';

// ── Store decorator (fresh store per story) ──

function CrmStoreDecorator(Story: React.ComponentType) {
  return (
    <Provider store={createAppStore()}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'CRM/Full App',
  component: App,
  decorators: [CrmStoreDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Shared shell-at-card helper ──

type AppState = NavigationStateSlice;

function CrmShellAtCard({ card, param }: { card: string; param?: string }) {
  const debugHooks = useRuntimeDebugHooks();
  const dispatch = useDispatch();
  const currentCard = useSelector((state: AppState) => selectCurrentCardId(state));

  useEffect(() => {
    if (currentCard !== card) {
      dispatch(navigate({ card, paramValue: param }));
    }
  }, [dispatch, card, param, currentCard]);

  return (
    <HyperCardShell
      stack={CRM_STACK}
      sharedSelectors={crmSharedSelectors}
      sharedActions={crmSharedActions}
      debugHooks={debugHooks}
      layoutMode="debugPane"
      renderDebugPane={() => <DebugPane />}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'contacts', icon: '👤' },
        { card: 'companies', icon: '🏢' },
        { card: 'deals', icon: '💰' },
        { card: 'pipeline', icon: '📊' },
        { card: 'activityLog', icon: '📝' },
      ]}
    />
  );
}

// ── Full app default ──
export const Default: Story = {};

// ── Per-card stories ──

export const Home: Story = {
  render: () => <CrmShellAtCard card="home" />,
};

export const Contacts: Story = {
  render: () => <CrmShellAtCard card="contacts" />,
};

export const ContactDetail: Story = {
  render: () => <CrmShellAtCard card="contactDetail" param="c1" />,
};

export const AddContact: Story = {
  render: () => <CrmShellAtCard card="addContact" />,
};

export const Companies: Story = {
  render: () => <CrmShellAtCard card="companies" />,
};

export const CompanyDetail: Story = {
  render: () => <CrmShellAtCard card="companyDetail" param="co1" />,
};

export const Deals: Story = {
  render: () => <CrmShellAtCard card="deals" />,
};

export const OpenDeals: Story = {
  render: () => <CrmShellAtCard card="openDeals" />,
};

export const DealDetail: Story = {
  render: () => <CrmShellAtCard card="dealDetail" param="d1" />,
};

export const AddDeal: Story = {
  render: () => <CrmShellAtCard card="addDeal" />,
};

export const Pipeline: Story = {
  render: () => <CrmShellAtCard card="pipeline" />,
};

export const ActivityLog: Story = {
  render: () => <CrmShellAtCard card="activityLog" />,
};

export const AddActivity: Story = {
  render: () => <CrmShellAtCard card="addActivity" />,
};
