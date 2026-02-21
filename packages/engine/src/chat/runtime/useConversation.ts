import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { chatSessionSlice, createChatError } from '../state/chatSessionSlice';
import {
  type ChatStateSlice,
  selectConnectionStatus,
  selectIsStreaming,
} from '../state/selectors';
import { conversationManager } from './conversationManager';
import { ChatHttpError } from './http';

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
          chatSessionSlice.actions.pushError({
            convId,
            error: createChatError({
              kind: 'runtime_error',
              stage: 'connect',
              source: 'useConversation.connect',
              message: error instanceof Error ? error.message : String(error),
              recoverable: true,
            }),
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
        const mapped =
          error instanceof ChatHttpError
            ? createChatError({
                kind: 'http_error',
                stage: error.stage,
                source: 'useConversation.send',
                status: error.status,
                message: error.message,
                recoverable: error.status >= 500 || error.status === 429,
                details: { url: error.url },
              })
            : createChatError({
                kind: 'runtime_error',
                stage: 'send',
                source: 'useConversation.send',
                message: error instanceof Error ? error.message : String(error),
                recoverable: true,
              });
        dispatch(
          chatSessionSlice.actions.pushError({
            convId,
            error: mapped,
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
