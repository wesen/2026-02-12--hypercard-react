import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { createWindow } from './storyFixtures';
import type { DesktopWindowDef } from './types';
import { WindowSurface } from './WindowSurface';

interface WindowSurfaceHarnessProps {
  window: DesktopWindowDef;
  content: string;
}

function WindowSurfaceHarness({ window: initialWindow, content }: WindowSurfaceHarnessProps) {
  const [window, setWindow] = useState(initialWindow);
  const [status, setStatus] = useState('Ready');

  const body = useMemo(() => {
    return (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{window.title}</div>
        <p style={{ margin: 0, lineHeight: 1.4 }}>{content}</p>
      </div>
    );
  }, [content, window.title]);

  return (
    <div style={{ width: 720, height: 420, position: 'relative', border: '1px solid #7f8899' }}>
      <WindowSurface
        window={window}
        onFocusWindow={() => {
          setWindow((prev) => ({ ...prev, focused: true }));
          setStatus('Focused window');
        }}
        onCloseWindow={() => {
          setStatus('Close requested');
        }}
        onWindowDragStart={() => {
          setStatus('Drag start requested');
        }}
        onWindowResizeStart={() => {
          setStatus('Resize start requested');
        }}
      >
        {body}
      </WindowSurface>
      <div style={{ position: 'absolute', left: 8, bottom: 8, fontSize: 10 }}>{status}</div>
    </div>
  );
}

const meta = {
  title: 'Shell/Windowing/WindowSurface',
  component: WindowSurfaceHarness,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof WindowSurfaceHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusedWindow: Story = {
  args: {
    window: createWindow({
      id: 'window:inventory',
      title: 'Inventory',
      icon: '📦',
      x: 120,
      y: 80,
      width: 360,
      height: 240,
      zIndex: 2,
      focused: true,
    }),
    content: 'Focused state with close, drag, and resize affordances active.',
  },
};

export const UnfocusedWindow: Story = {
  args: {
    window: createWindow({
      id: 'window:sales',
      title: 'Sales',
      icon: '📈',
      x: 180,
      y: 100,
      width: 340,
      height: 220,
      zIndex: 1,
      focused: false,
    }),
    content: 'Unfocused state for depth comparison and pointer focus handoff.',
  },
};

export const TallContent: Story = {
  args: {
    window: createWindow({
      id: 'window:report',
      title: 'Report',
      icon: '📊',
      x: 100,
      y: 60,
      width: 380,
      height: 260,
      zIndex: 1,
      focused: true,
    }),
    content:
      'Longer body content can scroll inside the window surface. The window frame remains stable while body content overflows.',
  },
};

export const DialogWindow: Story = {
  args: {
    window: createWindow({
      id: 'window:about',
      title: 'About HyperCard Desktop',
      x: 140,
      y: 80,
      width: 320,
      height: 200,
      zIndex: 2,
      focused: true,
      isDialog: true,
    }),
    content: 'Dialog windows have no close box, no drag handle, and no resize handle. They are modal prompts.',
  },
};
