import { DesktopShell, openWindow } from '@hypercard/engine';
import type { DesktopIconDef, DesktopMenuSection } from '@hypercard/engine';
import { type ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { STACK } from './domain/stack';
import { EventViewerWindow } from './features/chat/EventViewerWindow';
import { InventoryChatWindow } from './features/chat/InventoryChatWindow';
import { CodeEditorWindow } from './features/chat/CodeEditorWindow';
import { getEditorInitialCode } from './features/chat/editorLaunch';
import { RuntimeCardDebugWindow } from './features/chat/RuntimeCardDebugWindow';

const CHAT_APP_KEY = 'inventory-chat';

function newConversationId(): string {
  return typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `inv-${Date.now()}`;
}

function openNewChatWindow(dispatch: ReturnType<typeof useDispatch>) {
  const convId = newConversationId();
  const windowId = `window:chat:${convId}`;
  dispatch(
    openWindow({
      id: windowId,
      title: '💬 Inventory Chat',
      icon: '💬',
      bounds: {
        x: 340 + Math.round(Math.random() * 60),
        y: 20 + Math.round(Math.random() * 40),
        w: 520,
        h: 440,
      },
      content: {
        kind: 'app',
        appKey: `${CHAT_APP_KEY}:${convId}`,
      },
      dedupeKey: `chat:${convId}`,
    }),
  );
}

export function App() {
  const dispatch = useDispatch();

  // Open initial chat window on mount
  useEffect(() => {
    openNewChatWindow(dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCommand = useCallback(
    (commandId: string) => {
      if (commandId === 'chat.new' || commandId === 'icon.open.new-chat') {
        openNewChatWindow(dispatch);
      }
      if (commandId === 'debug.stacks' || commandId === 'icon.open.runtime-debug') {
        dispatch(openWindow({
          id: 'window:runtime-debug',
          title: '🔧 Stacks & Cards',
          icon: '🔧',
          bounds: { x: 80, y: 30, w: 560, h: 480 },
          content: { kind: 'app', appKey: 'runtime-card-debug' },
          dedupeKey: 'runtime-card-debug',
        }));
      }
    },
    [dispatch],
  );

  const renderAppWindow = useCallback((appKey: string): ReactNode => {
    if (appKey.startsWith(`${CHAT_APP_KEY}:`)) {
      const convId = appKey.slice(CHAT_APP_KEY.length + 1);
      return <InventoryChatWindow conversationId={convId} />;
    }
    if (appKey.startsWith('event-viewer:')) {
      const convId = appKey.slice('event-viewer:'.length);
      return <EventViewerWindow conversationId={convId} />;
    }
    if (appKey === 'runtime-card-debug') {
      return <RuntimeCardDebugWindow />;
    }
    if (appKey.startsWith('code-editor:')) {
      const cardId = appKey.slice('code-editor:'.length);
      return <CodeEditorWindow cardId={cardId} initialCode={getEditorInitialCode(cardId)} />;
    }
    return null;
  }, []);

  // Custom icons: add a "New Chat" icon alongside stack card icons
  const icons = useMemo((): DesktopIconDef[] => {
    const cardIcons = Object.keys(STACK.cards).map((cardId) => ({
      id: cardId,
      label: STACK.cards[cardId].title ?? cardId,
      icon: STACK.cards[cardId].icon ?? '📄',
    }));
    return [
      { id: 'new-chat', label: 'New Chat', icon: '💬' },
      { id: 'runtime-debug', label: 'Stacks & Cards', icon: '🔧' },
      ...cardIcons,
    ];
  }, []);

  // Custom menus: add "New Chat" to File menu
  const menus = useMemo((): DesktopMenuSection[] => {
    return [
      {
        id: 'file',
        label: 'File',
        items: [
          { id: 'new-chat', label: 'New Chat', commandId: 'chat.new', shortcut: 'Ctrl+N' },
          {
            id: 'new-home',
            label: `New ${STACK.cards[STACK.homeCard]?.title ?? 'Home'} Window`,
            commandId: 'window.open.home',
          },
          { id: 'close-focused', label: 'Close Window', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
        ],
      },
      {
        id: 'cards',
        label: 'Cards',
        items: Object.keys(STACK.cards).map((cardId) => ({
          id: `open-${cardId}`,
          label: `${STACK.cards[cardId].icon ?? ''} ${STACK.cards[cardId].title ?? cardId}`.trim(),
          commandId: `window.open.card.${cardId}`,
        })),
      },
      {
        id: 'window',
        label: 'Window',
        items: [
          { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
          { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade' },
        ],
      },
    ];
  }, []);

  return (
    <DesktopShell
      stack={STACK}
      renderAppWindow={renderAppWindow}
      icons={icons}
      menus={menus}
      onCommand={handleCommand}
    />
  );
}
