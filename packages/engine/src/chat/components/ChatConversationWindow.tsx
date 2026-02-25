import { type ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatWindow } from '../../components/widgets/ChatWindow';
import {
  getTimelineRendererRegistryVersion,
  resolveTimelineRenderers,
  subscribeTimelineRenderers,
} from '../renderers/rendererRegistry';
import type { RenderEntity, RenderMode } from '../renderers/types';
import {
  type ChatStateSlice,
  selectCurrentTurnStats,
  selectConversationTotalTokens,
  selectModelName,
  selectRenderableTimelineEntities,
  selectTimelineEntityById,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
} from '../state/selectors';
import {
  ASSISTANT_SUGGESTIONS_ENTITY_ID,
  DEFAULT_CHAT_SUGGESTIONS,
  readSuggestionsEntityProps,
  STARTER_SUGGESTIONS_ENTITY_ID,
} from '../state/suggestions';
import { timelineSlice } from '../state/timelineSlice';
import { isRecord } from '../utils/guards';
import { useConversation } from '../runtime/useConversation';
import { useCurrentProfile } from '../runtime/useCurrentProfile';
import { useProfiles } from '../runtime/useProfiles';
import { useSetProfile } from '../runtime/useSetProfile';
import {
  resolveProfileSelectionChange,
  resolveProfileSelectorValue,
} from './profileSelectorState';
import { StatsFooter } from './StatsFooter';

export interface ChatConversationWindowProps {
  convId: string;
  basePrefix?: string;
  title?: string;
  placeholder?: string;
  headerActions?: ReactNode;
  enableProfileSelector?: boolean;
  profileRegistry?: string;
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

function isInboundResponseEntity(
  entity: { kind: string; createdAt: number; props: unknown },
  awaitingSinceMs: number
): boolean {
  if (entity.createdAt < awaitingSinceMs) {
    return false;
  }
  if (entity.kind !== 'message') {
    return true;
  }
  const props = isRecord(entity.props) ? entity.props : {};
  const role = typeof props.role === 'string' ? props.role : 'assistant';
  if (role === 'user') {
    return false;
  }
  const content = typeof props.content === 'string' ? props.content.trim() : '';
  const streaming = props.streaming === true;
  return content.length > 0 || streaming;
}

export function ChatConversationWindow({
  convId,
  basePrefix = '',
  title = 'Chat',
  placeholder,
  headerActions,
  enableProfileSelector = false,
  profileRegistry,
  renderMode = 'normal',
}: ChatConversationWindowProps) {
  const dispatch = useDispatch();
  const { send, connectionStatus, isStreaming } = useConversation(convId, basePrefix);
  const { profiles, loading: profilesLoading, error: profileError } = useProfiles(
    basePrefix,
    profileRegistry,
    { enabled: enableProfileSelector }
  );
  const currentProfile = useCurrentProfile();
  const setProfile = useSetProfile(basePrefix);
  const [awaitingResponseSinceMs, setAwaitingResponseSinceMs] = useState<number | null>(null);

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
  const conversationTotalTokens = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectConversationTotalTokens(state, convId)
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

  useEffect(() => {
    setAwaitingResponseSinceMs(null);
  }, [convId]);

  useEffect(() => {
    if (awaitingResponseSinceMs === null) {
      return;
    }
    if (connectionStatus === 'error' || connectionStatus === 'closed') {
      setAwaitingResponseSinceMs(null);
      return;
    }
    if (
      entities.some((entity) =>
        isInboundResponseEntity(entity, awaitingResponseSinceMs)
      )
    ) {
      setAwaitingResponseSinceMs(null);
    }
  }, [awaitingResponseSinceMs, connectionStatus, entities]);

  const sendWithSuggestionLifecycle = useCallback(
    async (prompt: string) => {
      setAwaitingResponseSinceMs(Date.now());
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
      dispatch(
        timelineSlice.actions.consumeSuggestions({
          convId,
          entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        })
      );
      try {
        await send(prompt);
      } catch (error) {
        setAwaitingResponseSinceMs(null);
        throw error;
      }
    },
    [convId, dispatch, send]
  );

  const rendererRegistryVersion = useSyncExternalStore(
    subscribeTimelineRenderers,
    getTimelineRendererRegistryVersion,
    getTimelineRendererRegistryVersion
  );
  const renderers = useMemo(
    () => resolveTimelineRenderers(),
    [rendererRegistryVersion]
  );

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
  const defaultProfileSlug = profiles.find((profile) => profile.is_default)?.slug ?? '';
  const selectedProfileValue = resolveProfileSelectorValue(
    profiles,
    currentProfile.profile
  );

  const profileSelector = enableProfileSelector ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <label htmlFor={`chat-profile-${convId}`} style={{ fontSize: 11, opacity: 0.8 }}>
        Profile
      </label>
      <select
        id={`chat-profile-${convId}`}
        value={selectedProfileValue}
        onChange={(event) => {
          const nextProfile = resolveProfileSelectionChange(
            event.target.value,
            defaultProfileSlug
          );
          const resolvedRegistry = profileRegistry ?? currentProfile.registry ?? null;
          if (nextProfile) {
            void setProfile(nextProfile, resolvedRegistry);
            return;
          }
          void setProfile(null, resolvedRegistry);
        }}
        disabled={profilesLoading}
        style={{ fontSize: 11, padding: '1px 4px', maxWidth: 180 }}
      >
        {profilesLoading ? <option value="">Loading…</option> : null}
        {!profilesLoading && profiles.length === 0 ? <option value="">No profiles</option> : null}
        {profiles.map((profile) => (
          <option key={profile.slug} value={profile.slug}>
            {(profile.display_name?.trim() || profile.slug) + (profile.is_default ? ' (default)' : '')}
          </option>
        ))}
      </select>
      {profileError ? (
        <span style={{ fontSize: 10, color: '#b45309' }} title={profileError}>
          profile error
        </span>
      ) : null}
    </div>
  ) : null;

  const composedHeaderActions =
    profileSelector || headerActions
      ? (
          <>
            {profileSelector}
            {headerActions}
          </>
        )
      : undefined;

  return (
    <ChatWindow
      timelineContent={timelineContent}
      timelineItemCount={entities.length}
      conversationTotalTokens={conversationTotalTokens}
      isStreaming={isStreaming}
      showPendingResponseSpinner={awaitingResponseSinceMs !== null}
      onSend={sendWithSuggestionLifecycle}
      suggestions={suggestions}
      showSuggestionsAlways
      title={title}
      subtitle={subtitle}
      placeholder={placeholder}
      headerActions={composedHeaderActions}
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
