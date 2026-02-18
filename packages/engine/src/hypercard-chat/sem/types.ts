import type { TimelineEntity } from '../timeline/types';

export interface SemEvent {
  type?: string;
  id?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  seq?: number | string;
  stream_id?: string;
}

export interface SemEnvelope {
  sem?: boolean;
  event?: SemEvent;
}

export interface SemContext {
  convId: string;
  now: () => number;
}

export type SemTimelineOp =
  | { type: 'addEntity'; entity: TimelineEntity }
  | { type: 'upsertEntity'; entity: TimelineEntity }
  | { type: 'rekeyEntity'; fromId: string; toId: string }
  | { type: 'clearConversation' };

export type RuntimeEffect =
  | { type: 'debug.emitRawEnvelope'; envelope: SemEnvelope }
  | { type: 'noop' };

export interface SemHandlerResult {
  ops: SemTimelineOp[];
  effects: RuntimeEffect[];
}

export type SemHandler = (
  envelope: SemEnvelope,
  ctx: SemContext,
) => SemHandlerResult;
