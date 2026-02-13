import { HyperCardShell } from '@hypercard/engine';
import type { Meta, StoryObj } from '@storybook/react';
import { inventorySharedActions, inventorySharedSelectors } from '../app/cardRuntime';
import { STACK } from '../domain/stack';
import { storeDecorator } from './decorators';
import '../../../../packages/engine/src/theme/classic.css';
import '../../../../packages/engine/src/theme/modern.css';

function ThemedShell({ themeClass }: { themeClass?: string }) {
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
      themeClass={themeClass}
    />
  );
}

const meta = {
  title: 'Pages/Themed',
  component: ThemedShell,
  decorators: [storeDecorator()],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ThemedShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultTheme: Story = { args: {} };
export const ClassicMac: Story = { args: { themeClass: 'theme-classic' } };
export const Modern: Story = { args: { themeClass: 'theme-modern' } };
