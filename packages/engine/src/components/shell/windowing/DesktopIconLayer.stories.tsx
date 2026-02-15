import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DesktopIconLayer } from './DesktopIconLayer';
import { WINDOWING_DENSE_ICONS, WINDOWING_ICONS } from './storyFixtures';
import type { DesktopIconDef } from './types';

interface IconLayerHarnessProps {
  icons: DesktopIconDef[];
  initialSelectedIconId: string | null;
}

function IconLayerHarness({ icons, initialSelectedIconId }: IconLayerHarnessProps) {
  const [selectedIconId, setSelectedIconId] = useState<string | null>(initialSelectedIconId);
  const [status, setStatus] = useState('Select or open an icon');

  return (
    <div style={{ width: 560, height: 430, position: 'relative', border: '1px solid #7f8899' }}>
      <DesktopIconLayer
        icons={icons}
        selectedIconId={selectedIconId}
        onSelectIcon={(iconId) => {
          setSelectedIconId(iconId);
          setStatus(`Selected: ${iconId}`);
        }}
        onOpenIcon={(iconId) => {
          setStatus(`Opened: ${iconId}`);
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 8,
          fontSize: 10,
          color: '#283040',
          padding: '3px 6px',
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid #7f8899',
        }}
      >
        {status}
      </div>
    </div>
  );
}

const meta = {
  title: 'Shell/Windowing/DesktopIconLayer',
  component: IconLayerHarness,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof IconLayerHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSelection: Story = {
  args: {
    icons: WINDOWING_ICONS,
    initialSelectedIconId: null,
  },
};

export const SelectedIcon: Story = {
  args: {
    icons: WINDOWING_ICONS,
    initialSelectedIconId: 'sales',
  },
};

export const DenseDesktopIcons: Story = {
  args: {
    icons: WINDOWING_DENSE_ICONS,
    initialSelectedIconId: 'icon-5',
  },
};
