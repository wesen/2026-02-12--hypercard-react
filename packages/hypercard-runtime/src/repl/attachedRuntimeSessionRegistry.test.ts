import { afterEach, describe, expect, it } from 'vitest';
import {
  clearAttachedRuntimeSessions,
  getAttachedRuntimeSession,
  listAttachedRuntimeSessions,
  registerAttachedRuntimeSession,
  unregisterAttachedRuntimeSession,
} from './attachedRuntimeSessionRegistry';
import type { RuntimeSessionHandle } from './runtimeBroker';

function createHandle(sessionId: string): RuntimeSessionHandle {
  return {
    sessionId,
    stackId: 'inventory',
    origin: 'attached',
    writable: false,
    getBundleMeta: () => ({
      stackId: 'inventory',
      sessionId,
      title: 'Inventory',
      packageIds: ['ui'],
      surfaces: ['lowStock'],
    }),
    renderSurface: () => ({ kind: 'panel' }),
    eventSurface: () => [],
    defineSurface: () => {
      throw new Error('read-only');
    },
    defineSurfaceRender: () => {
      throw new Error('read-only');
    },
    defineSurfaceHandler: () => {
      throw new Error('read-only');
    },
    dispose: () => false,
  };
}

afterEach(() => {
  clearAttachedRuntimeSessions();
});

describe('attachedRuntimeSessionRegistry', () => {
  it('registers and looks up attached runtime sessions', () => {
    registerAttachedRuntimeSession({
      handle: createHandle('inventory@live'),
      summary: {
        sessionId: 'inventory@live',
        stackId: 'inventory',
        packageIds: ['ui'],
        surfaces: ['lowStock'],
        title: 'Inventory',
        origin: 'attached',
        writable: false,
      },
    });

    expect(listAttachedRuntimeSessions()).toHaveLength(1);
    expect(getAttachedRuntimeSession('inventory@live')?.summary.origin).toBe('attached');
  });

  it('unregisters attached sessions', () => {
    registerAttachedRuntimeSession({
      handle: createHandle('inventory@live'),
      summary: {
        sessionId: 'inventory@live',
        stackId: 'inventory',
        packageIds: ['ui'],
        surfaces: ['lowStock'],
        title: 'Inventory',
        origin: 'attached',
        writable: false,
      },
    });

    unregisterAttachedRuntimeSession('inventory@live');
    expect(listAttachedRuntimeSessions()).toEqual([]);
  });
});
