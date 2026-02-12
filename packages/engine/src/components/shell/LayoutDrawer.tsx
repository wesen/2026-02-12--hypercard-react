import { useState, type ReactNode } from 'react';

export interface LayoutDrawerProps {
  main: ReactNode;
  drawer: ReactNode;
}

export function LayoutDrawer({ main, drawer }: LayoutDrawerProps) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {main}
      </div>
      <div
        data-part="ai-panel"
        style={{
          borderTop: '2px solid var(--hc-color-border, #000)',
          maxHeight: open ? 'var(--hc-drawer-max-height, 200px)' : 26,
          transition: 'max-height 0.15s',
        }}
      >
        <div
          data-part="ai-panel-header"
          style={{ cursor: 'pointer', borderBottom: open ? undefined : 'none' }}
          onClick={() => setOpen(!open)}
        >
          <span>🤖 AI {open ? '▾' : '▸'}</span>
          <span data-part="ai-model-label" style={{ fontStyle: 'italic' }}>Ask a question…</span>
        </div>
        {open && <div style={{ flex: 1, overflow: 'hidden' }}>{drawer}</div>}
      </div>
    </div>
  );
}
