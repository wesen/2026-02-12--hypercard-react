import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { createWindow, WINDOWING_WINDOWS } from './storyFixtures';
import type { DesktopWindowDef } from './types';
import { WindowLayer } from './WindowLayer';

interface WindowLayerHarnessProps {
  initialWindows: DesktopWindowDef[];
}

function WindowLayerHarness({ initialWindows }: WindowLayerHarnessProps) {
  const [windows, setWindows] = useState(initialWindows);

  const focusedWindow = useMemo(() => windows.find((window) => window.focused), [windows]);

  return (
    <div style={{ width: 920, height: 500, position: 'relative', border: '1px solid #7f8899' }}>
      <WindowLayer
        windows={windows}
        onFocusWindow={(windowId) => {
          setWindows((prev) => {
            const maxZ = prev.length === 0 ? 0 : Math.max(...prev.map((window) => window.zIndex));
            return prev.map((window) =>
              window.id === windowId ? { ...window, focused: true, zIndex: maxZ + 1 } : { ...window, focused: false },
            );
          });
        }}
        onCloseWindow={(windowId) => {
          setWindows((prev) => prev.filter((window) => window.id !== windowId));
        }}
        renderWindowBody={(window) => (
          <div>
            <div style={{ fontWeight: 'bold' }}>{window.title}</div>
            <div style={{ fontSize: 10 }}>zIndex {window.zIndex}</div>
          </div>
        )}
      />
      <div style={{ position: 'absolute', left: 8, bottom: 8, fontSize: 10 }}>
        focused: {focusedWindow?.title ?? 'none'}
      </div>
    </div>
  );
}

const meta = {
  title: 'Shell/Windowing/WindowLayer',
  component: WindowLayerHarness,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof WindowLayerHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleWindow: Story = {
  args: {
    initialWindows: [
      createWindow({
        id: 'window:single',
        title: 'Single Window',
        icon: '🪟',
        x: 180,
        y: 120,
        width: 360,
        height: 240,
        zIndex: 1,
        focused: true,
      }),
    ],
  },
};

export const OverlappingSet: Story = {
  args: {
    initialWindows: WINDOWING_WINDOWS,
  },
};

export const UnsortedInputSortedOutput: Story = {
  args: {
    initialWindows: [
      createWindow({ id: 'window:high', title: 'High Z', x: 320, y: 130, zIndex: 9, focused: true }),
      createWindow({ id: 'window:low', title: 'Low Z', x: 120, y: 70, zIndex: 1 }),
      createWindow({ id: 'window:mid', title: 'Mid Z', x: 220, y: 100, zIndex: 5 }),
    ],
  },
};
