import {
  ChatWindow,
  DataTable,
  ReportView,
  openWindow,
  type CardStackDefinition,
  type ChatContentBlock,
  type ChatWindowMessage,
  type ColumnConfig,
  type InlineWidget,
} from '@hypercard/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { injectPluginCard, type CardProposal } from './cardInjector';
import {
  connectConversationStream,
  fetchTimeline,
  parseToolPayload,
  startChatTurn,
  type BackendArtifact,
  type BackendTimelineEntity,
} from './protocol';

const SUGGESTIONS = [
  'Show low stock below 3',
  'What is total inventory value?',
  'Show sales last 7 days',
  'Find A-1002',
];

const STORAGE_CONVERSATION_KEY = 'hc-inventory-chat-conversation-id';

const STRUCTURED_BLOCK_RE =
  /<hypercard:(widget|card):1>\s*(\{[\s\S]*?\})\s*<\/hypercard:(?:widget|card):1>/g;
const ACTION_BLOCK_RE =
  /<hypercard:actions:1>\s*(\[[\s\S]*?\])\s*<\/hypercard:actions:1>/g;

interface InventoryChatAssistantWindowProps {
  stack: CardStackDefinition;
  backendBaseUrl?: string;
}

function readConversationId(): string {
  if (typeof window === 'undefined') {
    return 'default';
  }
  return window.localStorage.getItem(STORAGE_CONVERSATION_KEY) ?? 'default';
}

function writeConversationId(nextConversationId: string) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_CONVERSATION_KEY, nextConversationId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function makeSystemMessage(text: string): ChatWindowMessage {
  return {
    id: `sys-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    role: 'system',
    text,
    status: 'complete',
  };
}

function normalizeColumns(raw: unknown): ColumnConfig[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => isRecord(item) && typeof item.key === 'string')
    .map((item) => {
      const formatType = typeof item.format === 'string' ? item.format : '';
      return {
        key: item.key as string,
        label: typeof item.label === 'string' ? item.label : (item.key as string),
        width: typeof item.width === 'number' || typeof item.width === 'string' ? item.width : undefined,
        align: item.align === 'left' || item.align === 'right' || item.align === 'center' ? item.align : undefined,
        format:
          formatType === 'money'
            ? (value: unknown) => `$${Number(value ?? 0).toFixed(2)}`
            : undefined,
      } satisfies ColumnConfig;
    });
}

function normalizeDataTableItems(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isRecord);
}

function normalizeReportSections(raw: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      label: String(item.label ?? 'Metric'),
      value: String(item.value ?? ''),
    }));
}

function createMessageContent(text: string, blocks: ChatContentBlock[]): ChatContentBlock[] | undefined {
  if (blocks.length === 0) {
    return undefined;
  }

  const content: ChatContentBlock[] = [];
  if (text.trim()) {
    content.push({ kind: 'text', text: text.trim() });
  }
  return [...content, ...blocks];
}

function normalizeRole(role: string): ChatWindowMessage['role'] {
  if (role === 'user' || role === 'ai' || role === 'system') {
    return role;
  }
  if (role === 'assistant') {
    return 'ai';
  }
  return 'system';
}

function upsertTimelineEntity(
  previous: BackendTimelineEntity[],
  nextEntity: BackendTimelineEntity,
): BackendTimelineEntity[] {
  const index = previous.findIndex((entity) => entity.id === nextEntity.id);
  if (index === -1) {
    return [...previous, nextEntity];
  }
  const out = [...previous];
  out[index] = nextEntity;
  return out;
}

function extractStructuredArtifactsFromText(text: string): {
  cleanText: string;
  artifacts: BackendArtifact[];
  actions: Array<{ label: string; action: Record<string, unknown> }>;
} {
  if (!text.trim()) {
    return { cleanText: text, artifacts: [], actions: [] };
  }

  const artifacts: BackendArtifact[] = [];
  const actions: Array<{ label: string; action: Record<string, unknown> }> = [];
  let lastIndex = 0;
  let output = '';

  for (const match of text.matchAll(STRUCTURED_BLOCK_RE)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const kind = match[1];
    const payloadRaw = match[2];

    output += text.slice(lastIndex, start);
    lastIndex = end;

    try {
      const parsed = JSON.parse(payloadRaw) as unknown;
      if (!isRecord(parsed) || typeof parsed.id !== 'string') {
        continue;
      }
      if (kind === 'widget') {
        artifacts.push({
          kind: 'widget',
          id: parsed.id,
          widgetType: typeof parsed.widgetType === 'string' ? parsed.widgetType : undefined,
          label: typeof parsed.label === 'string' ? parsed.label : undefined,
          props: isRecord(parsed.props) ? parsed.props : undefined,
        });
      } else {
        artifacts.push({
          kind: 'card-proposal',
          id: parsed.id,
          cardId: typeof parsed.cardId === 'string' ? parsed.cardId : undefined,
          title: typeof parsed.title === 'string' ? parsed.title : undefined,
          icon: typeof parsed.icon === 'string' ? parsed.icon : undefined,
          code: typeof parsed.code === 'string' ? parsed.code : undefined,
          dedupeKey: typeof parsed.dedupeKey === 'string' ? parsed.dedupeKey : undefined,
          version: typeof parsed.version === 'number' ? parsed.version : undefined,
          policy: isRecord(parsed.policy) ? parsed.policy : undefined,
        });
      }
    } catch {
      continue;
    }
  }
  output += text.slice(lastIndex);

  let textWithoutActions = output;
  for (const actionMatch of output.matchAll(ACTION_BLOCK_RE)) {
    const payloadRaw = actionMatch[1];
    try {
      const parsed = JSON.parse(payloadRaw) as unknown;
      if (!Array.isArray(parsed)) {
        continue;
      }
      for (const rawAction of parsed) {
        if (!isRecord(rawAction)) {
          continue;
        }
        if (typeof rawAction.label !== 'string' || !isRecord(rawAction.action)) {
          continue;
        }
        actions.push({
          label: rawAction.label,
          action: rawAction.action,
        });
      }
    } catch {
      continue;
    }
    textWithoutActions = textWithoutActions.replace(actionMatch[0], '');
  }

  return {
    cleanText: textWithoutActions.trim(),
    artifacts,
    actions,
  };
}

export function InventoryChatAssistantWindow({
  stack,
  backendBaseUrl,
}: InventoryChatAssistantWindowProps) {
  const dispatch = useDispatch();
  const [conversationId, setConversationId] = useState(readConversationId());
  const [entities, setEntities] = useState<BackendTimelineEntity[]>([]);
  const [systemMessages, setSystemMessages] = useState<ChatWindowMessage[]>([]);

  const streamCancelRef = useRef<(() => void) | null>(null);
  const cardProposalsRef = useRef<Map<string, CardProposal>>(new Map());
  const sessionCounterRef = useRef(2000);

  const resolvedBaseUrl =
    backendBaseUrl ??
    (import.meta.env.VITE_INVENTORY_CHAT_BASE_URL as string | undefined) ??
    'http://localhost:8081';

  const openCardWindow = useCallback(
    (cardId: string, param?: string) => {
      const cardDef = stack.cards[cardId];
      if (!cardDef) {
        setSystemMessages((prev) => [...prev, makeSystemMessage(`Card '${cardId}' does not exist.`)]);
        return;
      }

      sessionCounterRef.current += 1;
      const sessionId = `chat-session-${sessionCounterRef.current}`;

      dispatch(
        openWindow({
          id: `window:${cardId}:${sessionId}`,
          title: cardDef.title ?? cardId,
          icon: cardDef.icon,
          bounds: {
            x: 210 + (sessionCounterRef.current % 5) * 28,
            y: 50 + (sessionCounterRef.current % 4) * 22,
            w: 440,
            h: 360,
          },
          content: {
            kind: 'card',
            card: {
              stackId: stack.id,
              cardId,
              cardSessionId: sessionId,
              param,
            },
          },
        }),
      );
    },
    [dispatch, stack],
  );

  const toContentBlock = useCallback((artifact: BackendArtifact): ChatContentBlock | null => {
    if (artifact.kind === 'widget') {
      const widgetType = artifact.widgetType;
      if (!widgetType) {
        return null;
      }
      const widget: InlineWidget = {
        id: artifact.id,
        type: widgetType,
        label: artifact.label,
        props: artifact.props ?? {},
      };
      return { kind: 'widget', widget };
    }

    if (artifact.kind === 'card-proposal') {
      const proposal: CardProposal = {
        id: artifact.id,
        cardId: String(artifact.cardId ?? ''),
        title: String(artifact.title ?? 'Generated Card'),
        icon: String(artifact.icon ?? 'GEN'),
        code: String(artifact.code ?? ''),
        dedupeKey: typeof artifact.dedupeKey === 'string' ? artifact.dedupeKey : undefined,
        version: typeof artifact.version === 'number' ? artifact.version : undefined,
        policy: artifact.policy,
      };
      cardProposalsRef.current.set(proposal.id, proposal);
      return {
        kind: 'text',
        text: `Card proposal ready: ${proposal.title} (${proposal.cardId}). Use 'Create Saved Card'.`,
      };
    }

    return null;
  }, []);

  const timelineMessages = useMemo(() => {
    cardProposalsRef.current.clear();
    const ordered = [...entities].sort((a, b) => {
      if (a.createdAt === b.createdAt) {
        return a.id.localeCompare(b.id);
      }
      return a.createdAt - b.createdAt;
    });
    const out: ChatWindowMessage[] = [];

    for (const entity of ordered) {
      if (entity.kind === 'message' && entity.message) {
        const extracted = extractStructuredArtifactsFromText(entity.message.content);
        const artifacts = [...(entity.message.artifacts ?? []), ...extracted.artifacts];
        const actions = [
          ...(entity.message.actions ?? []),
          ...extracted.actions,
        ];
        const blocks: ChatContentBlock[] = artifacts
          .map((artifact) => toContentBlock(artifact))
          .filter((value): value is ChatContentBlock => value !== null);

        out.push({
          id: entity.id,
          role: normalizeRole(entity.message.role),
          text: extracted.cleanText,
          status: entity.message.streaming ? 'streaming' : 'complete',
          actions,
          content: createMessageContent(extracted.cleanText, blocks),
        });
        continue;
      }

      if (entity.kind === 'tool_result' && entity.toolResult) {
        const payload = parseToolPayload(entity.toolResult.resultRaw);
        if (!payload) {
          continue;
        }
        const blocks: ChatContentBlock[] = payload.artifacts
          .map((artifact) => toContentBlock(artifact))
          .filter((value): value is ChatContentBlock => value !== null);
        out.push({
          id: entity.id,
          role: 'ai',
          text: payload.summary || 'Tool result',
          status: 'complete',
          actions: payload.actions,
          content: createMessageContent(payload.summary, blocks),
        });
      }
    }

    return out;
  }, [entities, toContentBlock]);

  const messages = useMemo(() => [...timelineMessages, ...systemMessages], [timelineMessages, systemMessages]);
  const isStreaming = useMemo(
    () => timelineMessages.some((message) => message.status === 'streaming'),
    [timelineMessages],
  );

  useEffect(() => {
    let cancelled = false;
    const conv = conversationId || 'default';

    void (async () => {
      try {
        const timeline = await fetchTimeline(conv, resolvedBaseUrl);
        if (cancelled) {
          return;
        }
        setEntities(timeline.entities);
        if (timeline.conversationId !== conversationId) {
          setConversationId(timeline.conversationId);
          writeConversationId(timeline.conversationId);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        setSystemMessages((prev) => [...prev, makeSystemMessage(`Timeline hydration failed: ${message}`)]);
      }
    })();

    if (streamCancelRef.current) {
      streamCancelRef.current();
    }
    streamCancelRef.current = connectConversationStream(conv, resolvedBaseUrl, {
      onUpsert: (entity) => {
        setEntities((prev) => upsertTimelineEntity(prev, entity));
      },
      onError: (error) => {
        setSystemMessages((prev) => [...prev, makeSystemMessage(`Backend stream error: ${error}`)]);
      },
    });

    return () => {
      cancelled = true;
      if (streamCancelRef.current) {
        streamCancelRef.current();
        streamCancelRef.current = null;
      }
    };
  }, [conversationId, resolvedBaseUrl]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) {
        return;
      }
      try {
        const response = await startChatTurn(
          {
            conversationId,
            prompt: trimmed,
          },
          resolvedBaseUrl,
        );
        if (response.conversationId && response.conversationId !== conversationId) {
          setConversationId(response.conversationId);
          writeConversationId(response.conversationId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSystemMessages((prev) => [...prev, makeSystemMessage(`Request failed: ${message}`)]);
      }
    },
    [conversationId, isStreaming, resolvedBaseUrl],
  );

  const handleCancel = useCallback(() => {
    setSystemMessages((prev) => [
      ...prev,
      makeSystemMessage('Interrupt is not exposed yet by this backend. The current turn will finish server-side.'),
    ]);
  }, []);

  const handleAction = useCallback(
    (rawAction: unknown) => {
      if (!isRecord(rawAction) || typeof rawAction.type !== 'string') {
        setSystemMessages((prev) => [...prev, makeSystemMessage('Unsupported action payload from backend.')]);
        return;
      }

      const actionType = rawAction.type;
      if (actionType === 'open-card' && typeof rawAction.cardId === 'string') {
        const param = typeof rawAction.param === 'string' ? rawAction.param : undefined;
        openCardWindow(rawAction.cardId, param);
        return;
      }

      if (actionType === 'prefill' && typeof rawAction.text === 'string') {
        void send(rawAction.text);
        return;
      }

      if (actionType === 'create-card' && typeof rawAction.proposalId === 'string') {
        const proposal = cardProposalsRef.current.get(rawAction.proposalId);
        if (!proposal) {
          setSystemMessages((prev) => [
            ...prev,
            makeSystemMessage(`Proposal '${rawAction.proposalId}' is not available.`),
          ]);
          return;
        }

        const result = injectPluginCard(stack, proposal);
        setSystemMessages((prev) => [...prev, makeSystemMessage(result.reason)]);
        openCardWindow(proposal.cardId);
        return;
      }

      setSystemMessages((prev) => [...prev, makeSystemMessage(`Unhandled action type: ${actionType}`)]);
    },
    [openCardWindow, send, stack],
  );

  const renderWidget = useCallback((widget: InlineWidget) => {
    if (widget.type === 'data-table') {
      const items = normalizeDataTableItems(widget.props.items);
      const columns = normalizeColumns(widget.props.columns);
      return <DataTable items={items} columns={columns} />;
    }

    if (widget.type === 'report-view') {
      const sections = normalizeReportSections(widget.props.sections);
      return <ReportView sections={sections} />;
    }

    return <div style={{ padding: 8, fontSize: 11 }}>Unsupported widget type: {widget.type}</div>;
  }, []);

  return (
    <ChatWindow
      messages={messages}
      isStreaming={isStreaming}
      onSend={(text) => {
        void send(text);
      }}
      onCancel={handleCancel}
      onAction={handleAction}
      suggestions={SUGGESTIONS}
      title="Inventory Assistant"
      subtitle="Pinocchio/Geppetto web-chat runtime"
      placeholder="Ask about stock levels, sales, inventory value, or a SKU..."
      renderWidget={renderWidget}
      footer={<span>Conversation: {conversationId} · Backend: {resolvedBaseUrl}</span>}
    />
  );
}
