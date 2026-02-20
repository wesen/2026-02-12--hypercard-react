import type { ChatSessionSliceState } from './chatSessionSlice';
import type { ConversationTimelineState, TimelineEntity, TimelineState } from './timelineSlice';

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
  getChatSession(state, convId)?.suggestions ?? EMPTY_SUGGESTIONS;

export const selectLastError = (state: ChatStateSlice, convId: string): string | null =>
  getChatSession(state, convId)?.lastError ?? null;

export const selectModelName = (state: ChatStateSlice, convId: string): string | null =>
  getChatSession(state, convId)?.modelName ?? null;

export const selectCurrentTurnStats = (state: ChatStateSlice, convId: string) =>
  getChatSession(state, convId)?.turnStats ?? null;

export const selectStreamStartTime = (state: ChatStateSlice, convId: string): number | null =>
  getChatSession(state, convId)?.streamStartTime ?? null;

export const selectStreamOutputTokens = (state: ChatStateSlice, convId: string): number =>
  getChatSession(state, convId)?.streamOutputTokens ?? 0;

export const selectConversationIds = (state: ChatStateSlice): string[] => {
  const timelineIds = Object.keys(state.timeline.byConvId);
  const sessionIds = Object.keys(state.chatSession.byConvId);
  return Array.from(new Set([...timelineIds, ...sessionIds]));
};
