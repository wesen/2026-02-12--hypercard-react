import { describe, expect, it } from 'vitest';
import {
  buildContextTargetKey,
  normalizeContextTargetRef,
  resolveContextActions,
  resolveContextActionPrecedenceKeys,
  type ContextActionRegistryState,
} from './contextActionRegistry';
import type { DesktopActionEntry } from './types';

function action(id: string): DesktopActionEntry {
  return {
    id,
    label: id,
    commandId: `cmd.${id}`,
  };
}

describe('contextActionRegistry', () => {
  it('normalizes target values and builds deterministic keys', () => {
    const key = buildContextTargetKey(
      normalizeContextTargetRef({
        kind: 'message',
        windowId: ' window:1 ',
        appId: ' inventory ',
        conversationId: ' conv:1 ',
        messageId: ' msg:1 ',
      })
    );
    expect(key).toBe('kind=message|app=inventory|window=window:1|conversation=conv:1|message=msg:1');
  });

  it('resolves precedence exact -> qualified kind -> kind -> window', () => {
    const target = {
      kind: 'message' as const,
      appId: 'inventory',
      windowId: 'window:inventory:1',
      conversationId: 'conv:1',
      messageId: 'msg:1',
    };

    const keys = resolveContextActionPrecedenceKeys(target);
    expect(keys).toEqual([
      'kind=message|app=inventory|window=window:inventory:1|conversation=conv:1|message=msg:1',
      'kind=message|app=inventory',
      'kind=message',
      'kind=window|app=inventory|window=window:inventory:1',
      'kind=window|window=window:inventory:1',
    ]);
  });

  it('merges entries with deterministic precedence and item-id de-duplication', () => {
    const target = {
      kind: 'message' as const,
      appId: 'inventory',
      windowId: 'window:inventory:1',
      conversationId: 'conv:1',
      messageId: 'msg:1',
    };

    const exactKey = buildContextTargetKey(target);
    const appKindKey = buildContextTargetKey({ kind: 'message', appId: 'inventory' });
    const kindKey = buildContextTargetKey({ kind: 'message' });
    const windowKey = buildContextTargetKey({ kind: 'window', windowId: 'window:inventory:1' });

    const registry: ContextActionRegistryState = {
      [windowKey]: {
        target: { kind: 'window', windowId: 'window:inventory:1' },
        actions: [action('close-window')],
      },
      [kindKey]: {
        target: { kind: 'message' },
        actions: [action('copy')],
      },
      [appKindKey]: {
        target: { kind: 'message', appId: 'inventory' },
        actions: [action('copy'), action('create-task')],
      },
      [exactKey]: {
        target,
        actions: [action('reply')],
      },
    };

    const resolved = resolveContextActions(registry, target);
    expect(resolved).toEqual([
      action('reply'),
      action('copy'),
      action('create-task'),
      action('close-window'),
    ]);
  });
});
