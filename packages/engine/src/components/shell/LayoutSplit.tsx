import type { ReactNode } from 'react';

export interface LayoutSplitProps {
  main: ReactNode;
  side: ReactNode;
}

export function LayoutSplit({ main, side }: LayoutSplitProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr var(--hc-ai-panel-width, 270px)', height: '100%' }}>
      <div
        style={{
          borderRight: '2px solid var(--hc-color-border, #000)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {main}
      </div>
      <div data-part="ai-panel">
        <div data-part="ai-panel-header">
          <span>🤖 AI Copilot</span>
          <span data-part="ai-model-label">Local LLM</span>
        </div>
        {side}
      </div>
    </div>
  );
}
