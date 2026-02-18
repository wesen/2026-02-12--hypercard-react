import type { ConversationTimeline, TimelineEntity, TimelineRootState, TimelineState } from './types';

const EMPTY_CONVERSATION: ConversationTimeline = {
  byId: {},
  order: [],
};
const EMPTY_ENTITIES: TimelineEntity[] = [];

function timelineState(state: TimelineRootState): TimelineState | undefined {
  return state.timeline ?? state.timelineCore;
}

export function selectConversationTimeline(
  state: TimelineRootState,
  convId: string,
): ConversationTimeline {
  return timelineState(state)?.conversations?.[convId] ?? EMPTY_CONVERSATION;
}

export function selectTimelineEntities(
  state: TimelineRootState,
  convId: string,
): TimelineEntity[] {
  const conversation = selectConversationTimeline(state, convId);
  if (conversation.order.length === 0) return EMPTY_ENTITIES;
  return conversation.order
    .map((id) => conversation.byId[id])
    .filter((entity): entity is TimelineEntity => Boolean(entity));
}

export function selectTimelineEntityById(
  state: TimelineRootState,
  convId: string,
  entityId: string,
): TimelineEntity | undefined {
  return selectConversationTimeline(state, convId).byId[entityId];
}
