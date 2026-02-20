import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { chatSessionSlice } from '../state/chatSessionSlice';
import {
  type ChatStateSlice,
  selectConnectionStatus,
  selectIsStreaming,
} from '../state/selectors';
import { conversationManager } from './conversationManager';

type ConversationStoreState = ChatStateSlice & Record<string, unknown>;

export interface UseConversationResult {
  send: (prompt: string) => Promise<void>;
  connectionStatus: ReturnType<typeof selectConnectionStatus>;
  isStreaming: boolean;
}

export function useConversation(convId: string, basePrefix = ''): UseConversationResult {
  const dispatch = useDispatch();
  const connectionStatus = useSelector((state: ConversationStoreState) =>
    selectConnectionStatus(state, convId)
  );
  const isStreaming = useSelector((state: ConversationStoreState) =>
    selectIsStreaming(state, convId)
  );

  useEffect(() => {
    let disposed = false;

    conversationManager
      .connect({
        convId,
        basePrefix,
        dispatch: dispatch as (action: unknown) => unknown,
      })
      .catch((error) => {
        if (disposed) return;
        dispatch(
          chatSessionSlice.actions.setStreamError({
            convId,
            error: error instanceof Error ? error.message : String(error),
          })
        );
      });

    return () => {
      disposed = true;
      conversationManager.disconnect(convId);
    };
  }, [basePrefix, convId, dispatch]);

  const send = useCallback(
    async (prompt: string) => {
      try {
        await conversationManager.send(prompt, convId, basePrefix);
      } catch (error) {
        dispatch(
          chatSessionSlice.actions.setStreamError({
            convId,
            error: error instanceof Error ? error.message : String(error),
          })
        );
        throw error;
      }
    },
    [basePrefix, convId, dispatch]
  );

  return {
    send,
    connectionStatus,
    isStreaming,
  };
}
