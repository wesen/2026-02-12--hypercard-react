// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../../../app/createAppStore';
import type { CardStackDefinition } from '../../../cards/types';
import { focusWindow, openWindow } from '../../../desktop/core/state/windowingSlice';
import { DesktopShell } from './DesktopShell';
import { useRegisterWindowContextActions, useRegisterWindowMenuSections } from './desktopMenuRuntime';
import type { DesktopActionEntry, DesktopActionSection } from './types';

const roots: Root[] = [];
const containers: HTMLElement[] = [];

const TEST_STACK: CardStackDefinition = {
  id: 'context-menu-runtime-stack',
  name: 'Context Menu Runtime',
  icon: '🧪',
  homeCard: 'missing-home-card',
  plugin: {
    bundleCode: '',
  },
  cards: {},
};

const APP_CONTEXT_ACTIONS: DesktopActionEntry[] = [
  {
    id: 'inspect-widget',
    label: 'Inspect Widget',
    commandId: 'runtime.widget.inspect',
    payload: { target: 'widget:timeline' },
  },
];

const APP_MENU_SECTIONS: DesktopActionSection[] = [
  {
    id: 'chat',
    label: 'Chat',
    merge: 'replace',
    items: [{ id: 'runtime-chat-new', label: 'New Chat', commandId: 'runtime.chat.new' }],
  },
  {
    id: 'profile',
    label: 'Profile',
    merge: 'replace',
    items: [{ id: 'runtime-profile-default', label: 'Default Agent', commandId: 'runtime.profile.default' }],
  },
];

function RuntimeWindow() {
  useRegisterWindowContextActions(APP_CONTEXT_ACTIONS);
  return (
    <section style={{ padding: 8 }}>
      <strong>Runtime Window</strong>
    </section>
  );
}

function RuntimeMenuWindow() {
  useRegisterWindowMenuSections(APP_MENU_SECTIONS);
  return (
    <section style={{ padding: 8 }}>
      <strong>Runtime Menu Window</strong>
    </section>
  );
}

function menuLabels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-part="windowing-menu-button"]'))
    .map((node) => node.textContent?.trim() ?? '')
    .filter((label): label is string => label.length > 0);
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.scrollIntoView !== 'function') {
    HTMLElement.prototype.scrollIntoView = () => undefined;
  }
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

function fireContextMenu(target: Element): void {
  act(() => {
    target.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: 320,
        clientY: 180,
      }),
    );
  });
}

describe('desktop shell context-menu invocation metadata', () => {
  it('passes source/menu/window/widget/payload metadata to onCommand from title-bar actions', async () => {
    const { createStore } = createAppStore({});
    const store = createStore();
    const onCommand = vi.fn();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <DesktopShell
            stack={TEST_STACK}
            renderAppWindow={(appKey) => (appKey === 'runtime-tools:one' ? <RuntimeWindow /> : null)}
            onCommand={onCommand}
          />
        </Provider>,
      );
    });

    const runtimeWindowId = 'window:runtime:one';
    await act(async () => {
      store.dispatch(
        openWindow({
          id: runtimeWindowId,
          title: 'Runtime Tools',
          icon: '🧪',
          bounds: { x: 220, y: 72, w: 440, h: 320 },
          content: {
            kind: 'app',
            appKey: 'runtime-tools:one',
          },
        }),
      );
    });

    const titleBar = container.querySelector('[data-part="windowing-window-title-bar"]');
    expect(titleBar).not.toBeNull();
    fireContextMenu(titleBar as Element);

    const contextMenu = container.querySelector('[data-part="context-menu"]');
    expect(contextMenu).not.toBeNull();
    const inspectAction = Array.from(contextMenu?.querySelectorAll('button') ?? []).find((button) =>
      button.textContent?.includes('Inspect Widget'),
    );
    expect(inspectAction).not.toBeUndefined();

    act(() => {
      inspectAction?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    expect(onCommand).toHaveBeenCalledWith(
      'runtime.widget.inspect',
      expect.objectContaining({
        source: 'context-menu',
        menuId: 'window-context',
        windowId: runtimeWindowId,
        widgetId: 'title-bar',
        contextTarget: expect.objectContaining({
          kind: 'window',
          windowId: runtimeWindowId,
          widgetId: 'title-bar',
          appId: 'runtime-tools',
        }),
        payload: { target: 'widget:timeline' },
      }),
    );
  });

  it('recomposes focused menubar sections when switching between runtime and neutral windows', async () => {
    const { createStore } = createAppStore({});
    const store = createStore();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <DesktopShell
            stack={TEST_STACK}
            renderAppWindow={(appKey) => {
              if (appKey === 'runtime-tools:menu') {
                return <RuntimeMenuWindow />;
              }
              if (appKey === 'runtime-tools:neutral') {
                return <section style={{ padding: 8 }}>Neutral Window</section>;
              }
              return null;
            }}
          />
        </Provider>,
      );
    });

    const runtimeWindowId = 'window:runtime:menu';
    const neutralWindowId = 'window:runtime:neutral';
    await act(async () => {
      store.dispatch(
        openWindow({
          id: runtimeWindowId,
          title: 'Runtime Menu',
          icon: '🧪',
          bounds: { x: 180, y: 68, w: 420, h: 300 },
          content: { kind: 'app', appKey: 'runtime-tools:menu' },
        }),
      );
      store.dispatch(
        openWindow({
          id: neutralWindowId,
          title: 'Neutral Window',
          icon: '📄',
          bounds: { x: 640, y: 96, w: 420, h: 300 },
          content: { kind: 'app', appKey: 'runtime-tools:neutral' },
        }),
      );
    });

    expect(menuLabels(container)).not.toContain('Chat');
    expect(menuLabels(container)).not.toContain('Profile');

    await act(async () => {
      store.dispatch(focusWindow(runtimeWindowId));
    });
    expect(menuLabels(container)).toContain('Chat');
    expect(menuLabels(container)).toContain('Profile');

    await act(async () => {
      store.dispatch(focusWindow(neutralWindowId));
    });
    expect(menuLabels(container)).not.toContain('Chat');
    expect(menuLabels(container)).not.toContain('Profile');
  });
});
