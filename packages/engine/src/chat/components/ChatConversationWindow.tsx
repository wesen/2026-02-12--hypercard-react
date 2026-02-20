import { type ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatWindow } from '../../components/widgets/ChatWindow';
import {
  registerDefaultTimelineRenderers,
  resolveTimelineRenderers,
} from '../renderers/rendererRegistry';
import type { RenderEntity, RenderMode } from '../renderers/types';
import {
  type ChatStateSlice,
  selectCurrentTurnStats,
  selectModelName,
  selectRenderableTimelineEntities,
  selectTimelineEntityById,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
} from '../state/selectors';
import {
  DEFAULT_CHAT_SUGGESTIONS,
  readSuggestionsEntityProps,
  STARTER_SUGGESTIONS_ENTITY_ID,
} from '../state/suggestions';
import { timelineSlice } from '../state/timelineSlice';
import { isRecord } from '../utils/guards';
import { useConversation } from '../runtime/useConversation';
import { StatsFooter } from './StatsFooter';

export interface ChatConversationWindowProps {
  convId: string;
  basePrefix?: string;
  title?: string;
  placeholder?: string;
  headerActions?: ReactNode;
  renderMode?: RenderMode;
}

function toRenderEntity(entity: {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;
  props: unknown;
}): RenderEntity {
  return {
    id: entity.id,
    kind: entity.kind,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    props: isRecord(entity.props) ? entity.props : {},
  };
}

export function ChatConversationWindow({
  convId,
  basePrefix = '',
  title = 'Chat',
  placeholder,
  headerActions,
  renderMode = 'normal',
}: ChatConversationWindowProps) {
  const dispatch = useDispatch();
  const { send, connectionStatus, isStreaming } = useConversation(convId, basePrefix);

  const entities = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectRenderableTimelineEntities(state, convId)
  );
  const starterSuggestionsEntity = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectTimelineEntityById(state, convId, STARTER_SUGGESTIONS_ENTITY_ID)
  );
  const suggestions = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectSuggestions(state, convId)
  );
  const modelName = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectModelName(state, convId)
  );
  const turnStats = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectCurrentTurnStats(state, convId)
  );
  const streamStartTime = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectStreamStartTime(state, convId)
  );
  const streamOutputTokens = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectStreamOutputTokens(state, convId)
  );

  useEffect(() => {
    if (entities.length > 0) {
      return;
    }
    if (readSuggestionsEntityProps(starterSuggestionsEntity)) {
      return;
    }
    dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId,
        entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        source: 'starter',
        suggestions: DEFAULT_CHAT_SUGGESTIONS,
        replace: true,
      })
    );
  }, [convId, dispatch, entities.length, starterSuggestionsEntity]);

  const sendWithSuggestionLifecycle = useCallback(
    async (prompt: string) => {
      dispatch(
        timelineSlice.actions.upsertSuggestions({
          convId,
          entityId: STARTER_SUGGESTIONS_ENTITY_ID,
          source: 'starter',
          suggestions: DEFAULT_CHAT_SUGGESTIONS,
          replace: true,
        })
      );
      dispatch(
        timelineSlice.actions.consumeSuggestions({
          convId,
          entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        })
      );
      await send(prompt);
    },
    [convId, dispatch, send]
  );

  const renderers = useMemo(() => {
    registerDefaultTimelineRenderers();
    return resolveTimelineRenderers();
  }, []);

  const timelineContent = useMemo(
    () =>
      entities.map((entity) => {
        const renderEntity = toRenderEntity(entity);
        const Renderer = renderers[renderEntity.kind] ?? renderers.default;
        return <Renderer key={renderEntity.id} e={renderEntity} ctx={{ mode: renderMode, convId }} />;
      }),
    [convId, entities, renderMode, renderers]
  );

  const subtitle =
    connectionStatus === 'connected'
      ? 'connected'
      : connectionStatus === 'connecting'
        ? 'connecting…'
        : connectionStatus;

  return (
    <ChatWindow
      timelineContent={timelineContent}
      timelineItemCount={entities.length}
      isStreaming={isStreaming}
      onSend={sendWithSuggestionLifecycle}
      suggestions={suggestions}
      showSuggestionsAlways
      title={title}
      subtitle={subtitle}
      placeholder={placeholder}
      headerActions={headerActions}
      footer={
        <StatsFooter
          modelName={modelName}
          turnStats={turnStats}
          isStreaming={isStreaming}
          streamStartTime={streamStartTime}
          streamOutputTokens={streamOutputTokens}
        />
      }
    />
  );
}
