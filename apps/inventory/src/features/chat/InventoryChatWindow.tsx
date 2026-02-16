import { ChatWindow } from '@hypercard/engine';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  appendToolEvent,
  applyLLMDelta,
  applyLLMFinal,
  applyLLMStart,
  queueUserPrompt,
  setConnectionStatus,
  setConversationId,
  setStreamError,
} from './chatSlice';
import { selectConnectionStatus, selectConversationId, selectIsStreaming, selectMessages } from './selectors';
import {
  getOrCreateConversationId,
  InventoryWebChatClient,
  type InventoryWebChatClientHandlers,
  type SemEventEnvelope,
  submitPrompt,
} from './webchatClient';

function eventIdFromEnvelope(envelope: SemEventEnvelope): string {
  const eventId = envelope.event?.id;
  if (typeof eventId === 'string' && eventId.length > 0) {
    return eventId;
  }
  return `evt-${Date.now()}`;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

function onSemEnvelope(envelope: SemEventEnvelope, dispatch: ReturnType<typeof useDispatch>): void {
  const type = envelope.event?.type;
  const data = envelope.event?.data ?? {};
  const messageId = eventIdFromEnvelope(envelope);

  if (type === 'llm.start') {
    dispatch(applyLLMStart({ messageId }));
    return;
  }

  if (type === 'llm.delta') {
    dispatch(
      applyLLMDelta({
        messageId,
        cumulative: stringField(data, 'cumulative'),
        delta: stringField(data, 'delta'),
      }),
    );
    return;
  }

  if (type === 'llm.final') {
    dispatch(
      applyLLMFinal({
        messageId,
        text: stringField(data, 'text'),
      }),
    );
    return;
  }

  if (type === 'tool.start') {
    const name = stringField(data, 'name') ?? 'tool';
    dispatch(appendToolEvent({ text: `tool start: ${name}` }));
    return;
  }

  if (type === 'tool.result') {
    const result = stringField(data, 'result') ?? 'ok';
    dispatch(appendToolEvent({ text: `tool result: ${result}` }));
    return;
  }

  if (type === 'ws.error') {
    dispatch(setStreamError({ message: stringField(data, 'message') ?? 'websocket stream error' }));
  }
}

export function InventoryChatWindow() {
  const dispatch = useDispatch();
  const conversationId = useSelector(selectConversationId);
  const connectionStatus = useSelector(selectConnectionStatus);
  const messages = useSelector(selectMessages);
  const isStreaming = useSelector(selectIsStreaming);

  const clientRef = useRef<InventoryWebChatClient | null>(null);

  useEffect(() => {
    if (conversationId) {
      return;
    }

    dispatch(setConversationId(getOrCreateConversationId()));
  }, [dispatch, conversationId]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const handlers: InventoryWebChatClientHandlers = {
      onEnvelope: (envelope) => onSemEnvelope(envelope, dispatch),
      onStatus: (status) => dispatch(setConnectionStatus(status)),
      onError: (error) => dispatch(setStreamError({ message: error })),
    };

    const client = new InventoryWebChatClient(conversationId, handlers);
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [conversationId, dispatch]);

  const subtitle = useMemo(() => {
    if (!conversationId) {
      return 'bootstrapping...';
    }
    return `${connectionStatus} · ${conversationId}`;
  }, [connectionStatus, conversationId]);

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) {
        return;
      }

      const prompt = text.trim();
      if (prompt.length === 0) {
        return;
      }

      const convId = conversationId ?? getOrCreateConversationId();
      if (!conversationId) {
        dispatch(setConversationId(convId));
      }

      dispatch(queueUserPrompt({ text: prompt }));

      try {
        await submitPrompt(prompt, convId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'chat request failed';
        dispatch(setStreamError({ message }));
      }
    },
    [conversationId, dispatch, isStreaming],
  );

  return (
    <ChatWindow
      messages={messages}
      isStreaming={isStreaming}
      onSend={handleSend}
      title="Inventory Chat"
      subtitle={subtitle}
      placeholder="Ask about inventory..."
      suggestions={['Show current inventory status', 'What items are low stock?', 'Summarize today sales']}
      footer={<span>Streaming via /chat + /ws</span>}
    />
  );
}
