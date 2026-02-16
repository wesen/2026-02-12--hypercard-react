import { DesktopShell, openWindow } from '@hypercard/engine';
import { type ReactNode, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { STACK } from './domain/stack';
import { InventoryChatWindow } from './features/chat/InventoryChatWindow';

const CHAT_APP_KEY = 'inventory-chat';
const CHAT_WINDOW_ID = 'window:inventory-chat';

export function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      openWindow({
        id: CHAT_WINDOW_ID,
        title: '💬 Inventory Chat',
        icon: '💬',
        bounds: { x: 360, y: 20, w: 520, h: 440 },
        content: { kind: 'app', appKey: CHAT_APP_KEY },
        dedupeKey: CHAT_APP_KEY,
      }),
    );
  }, [dispatch]);

  const renderAppWindow = useCallback((appKey: string): ReactNode => {
    if (appKey === CHAT_APP_KEY) {
      return <InventoryChatWindow />;
    }
    return null;
  }, []);

  return <DesktopShell stack={STACK} renderAppWindow={renderAppWindow} />;
}
