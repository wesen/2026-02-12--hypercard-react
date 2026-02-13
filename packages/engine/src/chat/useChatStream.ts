import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addMessage,
  appendStreamToken,
  finishStreaming,
  nextMessageId,
  resetConversation,
  selectActiveMessages,
  selectChatError,
  selectIsStreaming,
  startStreaming,
  streamError,
  type StreamingChatStateSlice,
} from './chatSlice';
import { fakeStream, type FakeStreamConfig } from './mocks/fakeStreamService';
import type { ResponseMatcher } from './mocks/fakeResponses';

export interface UseChatStreamOptions {
  /** Conversation ID (default: uses active conversation) */
  conversationId?: string;
  /** Custom response matcher for fake streaming */
  responseMatcher?: ResponseMatcher;
  /** Fake stream timing config */
  streamConfig?: FakeStreamConfig;
}

export interface UseChatStreamReturn {
  messages: ReturnType<typeof selectActiveMessages>;
  isStreaming: boolean;
  error: string | null;
  send: (text: string) => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * React hook that manages the chat streaming lifecycle.
 *
 * Provides `send()` to start a message, `cancel()` to abort streaming,
 * and `reset()` to clear the conversation.
 *
 * Currently uses the fake stream service. To switch to a real API,
 * replace the `fakeStream` call with `startCompletion` + `connectStream`.
 */
export function useChatStream(options: UseChatStreamOptions = {}): UseChatStreamReturn {
  const dispatch = useDispatch();
  const messages = useSelector((state: StreamingChatStateSlice) => selectActiveMessages(state));
  const isStreaming = useSelector((state: StreamingChatStateSlice) => selectIsStreaming(state));
  const error = useSelector((state: StreamingChatStateSlice) => selectChatError(state));
  const cancelRef = useRef<(() => void) | null>(null);
  const convId = options.conversationId;

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isStreaming) return; // don't send while streaming

    // Add user message
    const userMsgId = nextMessageId();
    dispatch(addMessage({
      conversationId: convId,
      message: { id: userMsgId, role: 'user', text: trimmed, status: 'complete' },
    }));

    // Start streaming
    const aiMsgId = nextMessageId();
    dispatch(startStreaming({ conversationId: convId, messageId: aiMsgId }));

    // Start fake stream
    const cancel = fakeStream(
      trimmed,
      {
        onToken: (token) => {
          dispatch(appendStreamToken({ conversationId: convId, messageId: aiMsgId, token }));
        },
        onDone: (data) => {
          dispatch(finishStreaming({
            conversationId: convId,
            messageId: aiMsgId,
            actions: data.actions,
          }));
          cancelRef.current = null;
        },
        onError: (err) => {
          dispatch(streamError({ conversationId: convId, messageId: aiMsgId, error: err }));
          cancelRef.current = null;
        },
      },
      {
        ...options.streamConfig,
        responseMatcher: options.responseMatcher,
      },
    );

    cancelRef.current = cancel;
  }, [dispatch, convId, isStreaming, options.streamConfig, options.responseMatcher]);

  const cancel = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
      // The streaming message stays as-is with partial text
      // Mark it as complete with whatever text we have
      const streamingMsg = messages.find((m) => m.status === 'streaming');
      if (streamingMsg?.id) {
        dispatch(finishStreaming({
          conversationId: convId,
          messageId: streamingMsg.id,
        }));
      }
    }
  }, [dispatch, convId, messages]);

  const reset = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    dispatch(resetConversation(convId));
  }, [dispatch, convId]);

  return { messages, isStreaming, error, send, cancel, reset };
}
