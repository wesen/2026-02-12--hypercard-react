import { readFileSync } from 'node:fs';
import {
  buildLauncherContributions,
  createAppRegistry,
  createRenderAppWindow,
  formatAppKey,
  type LaunchableAppModule,
  parseAppKey,
} from '@hypercard/desktop-os';
import { type DesktopCommandContext, routeContributionCommand } from '@hypercard/engine/desktop-react';
import { describe, expect, it, vi } from 'vitest';
import { launcherModules } from '../app/modules';
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

function createHostContext() {
  return {
    dispatch: () => undefined,
    getState: () => ({}),
    openWindow: vi.fn(),
    closeWindow: () => undefined,
    resolveApiBase: (appId: string) => `/api/apps/${appId}`,
    resolveWsBase: (appId: string) => `/api/apps/${appId}/ws`,
  };
}

describe('launcher host wiring', () => {
  it('routes icon open command to module launch window creation for every app', () => {
    const hostContext = createHostContext();

    const contributions = buildLauncherContributions(launcherRegistry, { hostContext });
    const handlers = contributions.flatMap((contribution) => contribution.commands ?? []);
    const appIds = ['inventory', 'todo', 'crm', 'book-tracker-debug'];

    for (const appId of appIds) {
      const handled = routeContributionCommand(`icon.open.${appId}`, handlers, commandContext());
      expect(handled).toBe(true);
    }

    expect(hostContext.openWindow).toHaveBeenCalledTimes(appIds.length);
    for (const [index, appId] of appIds.entries()) {
      const [payload] = hostContext.openWindow.mock.calls[index] as [{ content: { appKey: string } }];
      expect(payload.content.appKey).toMatch(new RegExp(`^${appId}:`));
    }
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

  it('keeps module list on app-owned launcher modules only', () => {
    const source = readFileSync(new URL('../app/modules.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('createPlaceholderModule');
    expect(source).not.toContain('/main');
    expect(source).not.toContain('/App');
  });

  it('builds valid launch window payloads and render content for every module', () => {
    for (const module of launcherModules) {
      const ctx = createHostContext();
      const payload = module.buildLaunchWindow(ctx, 'icon');
      const appKey = payload.content.kind === 'app' ? payload.content.appKey : '';
      const parsed = parseAppKey(appKey);

      expect(payload.content.kind).toBe('app');
      expect(parsed).not.toBeNull();
      expect(parsed?.appId).toBe(module.manifest.id);
      expect(payload.id).toContain(module.manifest.id);

      const rendered = module.renderWindow({
        appId: module.manifest.id,
        appKey,
        instanceId: parsed?.instanceId ?? 'missing',
        windowId: payload.id,
        ctx: {
          dispatch: () => undefined,
          getState: () => ({}),
          moduleId: module.manifest.id,
          stateKey: module.state?.stateKey,
        },
      });
      expect(rendered).not.toBeNull();
    }
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

  it('removes legacy standalone desktop shell boot wiring from app roots', () => {
    const appRootSources = [
      readFileSync(new URL('../../../inventory/src/App.tsx', import.meta.url), 'utf8'),
      readFileSync(new URL('../../../todo/src/App.tsx', import.meta.url), 'utf8'),
      readFileSync(new URL('../../../crm/src/App.tsx', import.meta.url), 'utf8'),
      readFileSync(new URL('../../../book-tracker-debug/src/App.tsx', import.meta.url), 'utf8'),
    ];

    for (const source of appRootSources) {
      expect(source).not.toContain('DesktopShell');
      expect(source).toContain("from './launcher/module'");
      expect(source).toContain('renderWindow');
    }
  });
});
