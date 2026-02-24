import { readFileSync } from 'node:fs';
import {
  buildLauncherContributions,
  createAppRegistry,
  createRenderAppWindow,
  formatAppKey,
  type LaunchableAppModule,
} from '@hypercard/desktop-os';
import { type DesktopCommandContext, routeContributionCommand } from '@hypercard/engine/desktop-react';
import { describe, expect, it, vi } from 'vitest';
import { launcherRegistry } from '../app/registry';

function commandContext(): DesktopCommandContext {
  return {
    dispatch: () => undefined,
    getState: () => ({}),
    focusedWindowId: null,
    openCardWindow: () => undefined,
    closeWindow: () => undefined,
  };
}

describe('launcher host wiring', () => {
  it('routes icon open command to module launch window creation', () => {
    const openWindow = vi.fn();
    const hostContext = {
      dispatch: () => undefined,
      getState: () => ({}),
      openWindow,
      closeWindow: () => undefined,
      resolveApiBase: (appId: string) => `/api/apps/${appId}`,
      resolveWsBase: (appId: string) => `/api/apps/${appId}/ws`,
    };

    const contributions = buildLauncherContributions(launcherRegistry, { hostContext });
    const handlers = contributions.flatMap((contribution) => contribution.commands ?? []);
    const handled = routeContributionCommand('icon.open.inventory', handlers, commandContext());

    expect(handled).toBe(true);
    expect(openWindow).toHaveBeenCalledTimes(1);
    const [payload] = openWindow.mock.calls[0] as [{ content: { appKey: string } }];
    expect(payload.content.appKey).toMatch(/^inventory:/);
  });

  it('renders unknown-app fallback when registry lookup fails', () => {
    const render = createRenderAppWindow({
      registry: launcherRegistry,
      hostContext: {
        dispatch: () => undefined,
        getState: () => ({}),
      },
      onUnknownAppKey: (appKey) => `unknown:${appKey}`,
    });

    expect(render('bad-key', 'window:1')).toBe('unknown:bad-key');
    expect(render('missing-app:instance', 'window:2')).toBe('unknown:missing-app:instance');
  });

  it('renders module window content for a valid app key', () => {
    const render = createRenderAppWindow({
      registry: launcherRegistry,
      hostContext: {
        dispatch: () => undefined,
        getState: () => ({}),
      },
    });

    const content = render(formatAppKey('inventory', 'test-instance'), 'window:test');
    expect(content).not.toBeNull();
  });

  it('fails registry creation when module ids collide', () => {
    const duplicateA: LaunchableAppModule = {
      manifest: {
        id: 'duplicate',
        name: 'Duplicate A',
        icon: '📦',
        launch: { mode: 'window' },
      },
      buildLaunchWindow: () => ({
        id: 'window:dup:a',
        title: 'Duplicate A',
        bounds: { x: 0, y: 0, w: 300, h: 240 },
        content: { kind: 'app', appKey: 'duplicate:a' },
      }),
      renderWindow: () => null,
    };
    const duplicateB: LaunchableAppModule = {
      ...duplicateA,
      manifest: {
        ...duplicateA.manifest,
        name: 'Duplicate B',
      },
    };

    expect(() => createAppRegistry([duplicateA, duplicateB])).toThrow(/Duplicate app manifest id/);
  });

  it('keeps host app orchestration-only (no app-specific business imports)', () => {
    const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
    const forbiddenImports = [
      'apps/inventory',
      'apps/todo',
      'apps/crm',
      'apps/book-tracker-debug',
      'ChatConversationWindow',
      'ConfirmRequestWindowHost',
    ];

    for (const forbiddenImport of forbiddenImports) {
      expect(source).not.toContain(forbiddenImport);
    }
  });
});
