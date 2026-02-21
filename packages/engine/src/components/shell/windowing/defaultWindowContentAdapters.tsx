import type { WindowContentAdapter } from './windowContentAdapter';
import { PluginCardSessionHost } from './PluginCardSessionHost';

export function createAppWindowContentAdapter(): WindowContentAdapter {
  return {
    id: 'default.app-window',
    canRender: (window, ctx) => window.content.kind === 'app' && Boolean(window.content.appKey) && Boolean(ctx.renderAppWindow),
    render: (window, ctx) => {
      if (window.content.kind !== 'app' || !window.content.appKey || !ctx.renderAppWindow) return null;
      return ctx.renderAppWindow(window.content.appKey, window.id);
    },
  };
}

export function createHypercardCardContentAdapter(): WindowContentAdapter {
  return {
    id: 'default.hypercard-card',
    canRender: (window) => window.content.kind === 'card' && Boolean(window.content.card),
    render: (window, ctx) => {
      const cardRef = window.content.card;
      if (window.content.kind !== 'card' || !cardRef) return null;
      return (
        <PluginCardSessionHost
          windowId={window.id}
          sessionId={cardRef.cardSessionId}
          stack={ctx.stack}
          mode={ctx.mode}
        />
      );
    },
  };
}

export function createFallbackWindowContentAdapter(): WindowContentAdapter {
  return {
    id: 'default.fallback',
    canRender: () => true,
    render: (window) => (
      <div style={{ padding: 10 }}>
        <p>{window.title}</p>
      </div>
    ),
  };
}
