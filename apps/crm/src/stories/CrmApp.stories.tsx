import { createStoryHelpers } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { crmSharedActions, crmSharedSelectors } from '../app/cardRuntime';
import { createCrmStore } from '../app/store';
import { CRM_STACK } from '../domain/stack';

const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  stack: CRM_STACK,
  sharedSelectors: crmSharedSelectors,
  sharedActions: crmSharedActions,
  createStore: createCrmStore,
  navShortcuts: [
    { card: 'home', icon: '🏠' },
    { card: 'contacts', icon: '👤' },
    { card: 'companies', icon: '🏢' },
    { card: 'deals', icon: '💰' },
    { card: 'pipeline', icon: '📊' },
    { card: 'activityLog', icon: '📝' },
  ],
  cardParams: { contactDetail: 'c1', companyDetail: 'co1', dealDetail: 'd1' },
  snapshotSelector: (state: any) => ({
    navigation: state.navigation,
    contacts: state.contacts,
    companies: state.companies,
    deals: state.deals,
    activities: state.activities,
    streamingChat: state.streamingChat,
    runtime: state.hypercardRuntime,
  }),
  debugTitle: 'CRM Debug',
});

const meta = {
  title: 'CRM/Full App',
  component: FullApp,
  decorators: [storeDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FullApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Home: Story = createStory('home');
export const Contacts: Story = createStory('contacts');
export const ContactDetail: Story = createStory('contactDetail');
export const AddContact: Story = createStory('addContact');
export const Companies: Story = createStory('companies');
export const CompanyDetail: Story = createStory('companyDetail');
export const Deals: Story = createStory('deals');
export const OpenDeals: Story = createStory('openDeals');
export const DealDetail: Story = createStory('dealDetail');
export const AddDeal: Story = createStory('addDeal');
export const Pipeline: Story = createStory('pipeline');
export const ActivityLog: Story = createStory('activityLog');
export const AddActivity: Story = createStory('addActivity');
