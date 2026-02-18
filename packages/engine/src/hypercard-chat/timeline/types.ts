export interface TimelineEntity {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;
  // backend timeline version is uint64; keep as decimal string in JS
  version?: string;
  props: Record<string, unknown>;
}

export interface ConversationTimeline {
  byId: Record<string, TimelineEntity>;
  order: string[];
}

export interface TimelineState {
  conversations: Record<string, ConversationTimeline>;
}

export interface TimelineRootState {
  timeline?: TimelineState;
  timelineCore?: TimelineState;
}
