import type { ChatErrorRecord, ChatSessionSliceState } from './chatSessionSlice';
import type { ConversationTimelineState, TimelineEntity, TimelineState } from './timelineSlice';
import {
  ASSISTANT_SUGGESTIONS_ENTITY_ID,
  readSuggestionsEntityProps,
  STARTER_SUGGESTIONS_ENTITY_ID,
  SUGGESTIONS_ENTITY_KIND,
} from './suggestions';

export interface ChatStateSlice {
  timeline: TimelineState;
  chatSession: ChatSessionSliceState;
}

const EMPTY_TIMELINE: ConversationTimelineState = {
  byId: {},
  order: [],
};
const EMPTY_TIMELINE_ENTITIES: TimelineEntity[] = [];
const EMPTY_SUGGESTIONS: string[] = [];
const EMPTY_ERROR_HISTORY: ChatErrorRecord[] = [];

function getTimelineConversation(
  state: ChatStateSlice,
  convId: string
): ConversationTimelineState {
  return state.timeline.byConvId[convId] ?? EMPTY_TIMELINE;
}

function getChatSession(state: ChatStateSlice, convId: string) {
  return state.chatSession.byConvId[convId];
}

export const selectConversationTimelineState = (
  state: ChatStateSlice,
  convId: string
): ConversationTimelineState => getTimelineConversation(state, convId);

export const selectTimelineEntities = (
  state: ChatStateSlice,
  convId: string
): TimelineEntity[] => {
  const conv = getTimelineConversation(state, convId);
  if (conv.order.length === 0) {
    return EMPTY_TIMELINE_ENTITIES;
  }
  return conv.order.map((id) => conv.byId[id]).filter(Boolean);
};

export const selectRenderableTimelineEntities = (
  state: ChatStateSlice,
  convId: string
): TimelineEntity[] => selectTimelineEntities(state, convId).filter((entity) => entity.kind !== SUGGESTIONS_ENTITY_KIND);

export const selectTimelineEntityById = (
  state: ChatStateSlice,
  convId: string,
  entityId: string
): TimelineEntity | undefined => getTimelineConversation(state, convId).byId[entityId];

export const selectConnectionStatus = (state: ChatStateSlice, convId: string) =>
  getChatSession(state, convId)?.connectionStatus ?? 'idle';

export const selectIsStreaming = (state: ChatStateSlice, convId: string): boolean =>
  getChatSession(state, convId)?.isStreaming ?? false;

export const selectSuggestions = (state: ChatStateSlice, convId: string): string[] =>
{
  const conv = getTimelineConversation(state, convId);

  const assistant = readSuggestionsEntityProps(conv.byId[ASSISTANT_SUGGESTIONS_ENTITY_ID]);
  if (assistant && assistant.consumedAt === undefined && assistant.items.length > 0) {
    return assistant.items;
  }

  const starter = readSuggestionsEntityProps(conv.byId[STARTER_SUGGESTIONS_ENTITY_ID]);
  if (!starter || starter.consumedAt !== undefined || starter.items.length === 0) {
    return EMPTY_SUGGESTIONS;
  }

  const hasRenderableEntities = conv.order.some((id) => {
    const entity = conv.byId[id];
    return Boolean(entity && entity.kind !== SUGGESTIONS_ENTITY_KIND);
  });

  return hasRenderableEntities ? EMPTY_SUGGESTIONS : starter.items;
};

export const selectLastError = (state: ChatStateSlice, convId: string): string | null =>
  getChatSession(state, convId)?.currentError?.message ?? getChatSession(state, convId)?.lastError ?? null;

export const selectCurrentError = (
  state: ChatStateSlice,
  convId: string
): ChatErrorRecord | null => getChatSession(state, convId)?.currentError ?? null;

export const selectErrorHistory = (
  state: ChatStateSlice,
  convId: string
): ChatErrorRecord[] => getChatSession(state, convId)?.errorHistory ?? EMPTY_ERROR_HISTORY;

export const selectHasRecoverableError = (state: ChatStateSlice, convId: string): boolean => {
  const current = getChatSession(state, convId)?.currentError;
  return Boolean(current && current.recoverable !== false);
};

export const selectModelName = (state: ChatStateSlice, convId: string): string | null =>
  getChatSession(state, convId)?.modelName ?? null;

export const selectCurrentTurnStats = (state: ChatStateSlice, convId: string) =>
  getChatSession(state, convId)?.turnStats ?? null;

export const selectStreamStartTime = (state: ChatStateSlice, convId: string): number | null =>
  getChatSession(state, convId)?.streamStartTime ?? null;

export const selectStreamOutputTokens = (state: ChatStateSlice, convId: string): number =>
  getChatSession(state, convId)?.streamOutputTokens ?? 0;

export const selectConversationCachedTokens = (state: ChatStateSlice, convId: string): number => {
  const session = getChatSession(state, convId);
  if (!session) return 0;
  return Math.max(0, session.conversationCachedTokens);
};

export const selectConversationTotalTokens = (state: ChatStateSlice, convId: string): number => {
  const session = getChatSession(state, convId);
  if (!session) return 0;
  return Math.max(
    0,
    session.conversationInputTokens +
      session.conversationOutputTokens +
      session.conversationCachedTokens
  );
};

export const selectConversationIds = (state: ChatStateSlice): string[] => {
  const timelineIds = Object.keys(state.timeline.byConvId);
  const sessionIds = Object.keys(state.chatSession.byConvId);
  return Array.from(new Set([...timelineIds, ...sessionIds]));
};
