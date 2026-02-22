import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  ensureChatModulesRegistered: vi.fn(),
  clearConversationEventHistory: vi.fn(),
  emitConversationEvent: vi.fn(),
  wsConnect: vi.fn(async () => {}),
  wsDisconnect: vi.fn(),
}));

vi.mock('./registerChatModules', () => ({
  ensureChatModulesRegistered: mocked.ensureChatModulesRegistered,
}));

vi.mock('../debug/eventBus', () => ({
  emitConversationEvent: mocked.emitConversationEvent,
  clearConversationEventHistory: mocked.clearConversationEventHistory,
}));

vi.mock('../ws/wsManager', () => ({
  WsManager: class {
    connect = mocked.wsConnect;
    disconnect = mocked.wsDisconnect;
  },
}));

import { ConversationManager } from './conversationManager';

describe('conversationManager', () => {
  beforeEach(() => {
    mocked.ensureChatModulesRegistered.mockClear();
    mocked.clearConversationEventHistory.mockClear();
    mocked.emitConversationEvent.mockClear();
    mocked.wsConnect.mockClear();
    mocked.wsDisconnect.mockClear();
  });

  it('clears retained debug event history on final disconnect', async () => {
    const manager = new ConversationManager();
    const dispatch = vi.fn();

    await manager.connect({ convId: 'conv-1', dispatch });
    expect(manager.getActiveConversationIds()).toEqual(['conv-1']);

    manager.disconnect('conv-1');

    expect(mocked.wsDisconnect).toHaveBeenCalledTimes(1);
    expect(mocked.clearConversationEventHistory).toHaveBeenCalledTimes(1);
    expect(mocked.clearConversationEventHistory).toHaveBeenCalledWith('conv-1');
    expect(manager.getActiveConversationIds()).toEqual([]);
  });

  it('does not clear history while conversation still has active references', async () => {
    const manager = new ConversationManager();
    const dispatch = vi.fn();

    await manager.connect({ convId: 'conv-shared', dispatch });
    await manager.connect({ convId: 'conv-shared', dispatch });
    expect(mocked.wsConnect).toHaveBeenCalledTimes(2);

    manager.disconnect('conv-shared');
    expect(mocked.wsDisconnect).not.toHaveBeenCalled();
    expect(mocked.clearConversationEventHistory).not.toHaveBeenCalled();
    expect(manager.getActiveConversationIds()).toEqual(['conv-shared']);

    manager.disconnect('conv-shared');
    expect(mocked.wsDisconnect).toHaveBeenCalledTimes(1);
    expect(mocked.clearConversationEventHistory).toHaveBeenCalledTimes(1);
    expect(mocked.clearConversationEventHistory).toHaveBeenCalledWith('conv-shared');
    expect(manager.getActiveConversationIds()).toEqual([]);
  });
});
