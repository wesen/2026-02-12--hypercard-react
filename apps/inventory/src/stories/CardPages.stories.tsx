import { HyperCardShell, type NavigationStateSlice, navigate, selectCurrentCardId } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventorySharedActions, inventorySharedSelectors } from '../app/cardRuntime';
import { STACK } from '../domain/stack';
import { storeDecorator } from './decorators';

type AppState = NavigationStateSlice;

function ShellAtCard({ card, param }: { card: string; param?: string }) {
  const dispatch = useDispatch();
  const currentCard = useSelector((s: AppState) => selectCurrentCardId(s));

  useEffect(() => {
    if (currentCard !== card) {
      dispatch(navigate({ card, paramValue: param }));
    }
  }, [dispatch, card, param, currentCard]);

  return (
    <HyperCardShell
      stack={STACK}
      sharedSelectors={inventorySharedSelectors}
      sharedActions={inventorySharedActions}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'report', icon: '📊' },
        { card: 'assistant', icon: '💬' },
      ]}
    />
  );
}

const meta = {
  title: 'Pages/Cards',
  component: ShellAtCard,
  decorators: [storeDecorator()],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ShellAtCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = { args: { card: 'home' } };
export const Browse: Story = { args: { card: 'browse' } };
export const LowStock: Story = { args: { card: 'lowStock' } };
export const SalesLog: Story = { args: { card: 'salesToday' } };
export const ItemDetail: Story = { args: { card: 'itemDetail', param: 'A-1002' } };
export const NewItem: Story = { args: { card: 'newItem' } };
export const Receive: Story = { args: { card: 'receive' } };
export const PriceChecker: Story = { args: { card: 'priceCheck' } };
export const Report: Story = { args: { card: 'report' } };
export const AIAssistant: Story = { args: { card: 'assistant' } };
