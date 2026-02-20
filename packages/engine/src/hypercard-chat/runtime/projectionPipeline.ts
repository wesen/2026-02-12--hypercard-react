import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { applySemTimelineOps, type SemRegistry } from '../sem/registry';
import type { SemEnvelope, SemHandlerResult } from '../sem/types';

export interface ProjectionPipelineAdapterContext {
  conversationId: string;
  dispatch: Dispatch<UnknownAction>;
  envelope: SemEnvelope;
  projected: SemHandlerResult;
}

/**
 * Adapter hooks are strictly for side effects (artifacts, telemetry, debug).
 * Core timeline projection correctness must stay in SemRegistry handlers.
 */
export interface ProjectionPipelineAdapter {
  onEnvelope?: (ctx: ProjectionPipelineAdapterContext) => void;
}

export interface ProjectSemEnvelopeInput {
  conversationId: string;
  dispatch: Dispatch<UnknownAction>;
  envelope: SemEnvelope;
  semRegistry: SemRegistry;
  adapters?: ProjectionPipelineAdapter[];
  now?: () => number;
}

export interface TimelineSnapshotEntityRecord {
  id?: string;
  [key: string]: unknown;
}

export interface TimelineSnapshotPayload {
  version?: string;
  entities: TimelineSnapshotEntityRecord[];
}

export interface HydrateTimelineSnapshotInput {
  conversationId: string;
  dispatch: Dispatch<UnknownAction>;
  semRegistry: SemRegistry;
  snapshot: TimelineSnapshotPayload;
  adapters?: ProjectionPipelineAdapter[];
  now?: () => number;
}

export interface RunProjectionAdaptersInput {
  conversationId: string;
  dispatch: Dispatch<UnknownAction>;
  envelope: SemEnvelope;
  projected: SemHandlerResult;
  adapters?: ProjectionPipelineAdapter[];
}

function projectionResultSignature(projected: SemHandlerResult): string {
  return JSON.stringify({
    ops: projected.ops,
    effects: projected.effects,
  });
}

export function runProjectionAdapters(input: RunProjectionAdaptersInput): void {
  const {
    conversationId,
    dispatch,
    envelope,
    projected,
    adapters = [],
  } = input;
  const assertImmutable = true;

  for (const adapter of adapters) {
    const before = assertImmutable
      ? projectionResultSignature(projected)
      : '';
    adapter.onEnvelope?.({
      conversationId,
      dispatch,
      envelope,
      projected,
    });
    if (
      assertImmutable &&
      before !== projectionResultSignature(projected)
    ) {
      throw new Error(
        'Projection adapter mutated SemRegistry projection output. ' +
          'Move projection logic into SemRegistry handlers.',
      );
    }
  }
}

export function projectSemEnvelope(
  input: ProjectSemEnvelopeInput,
): SemHandlerResult {
  const {
    conversationId,
    dispatch,
    envelope,
    semRegistry,
    adapters = [],
    now = Date.now,
  } = input;

  const projected = semRegistry.handle(envelope, {
    convId: conversationId,
    now,
  });
  applySemTimelineOps(dispatch, conversationId, projected.ops);

  runProjectionAdapters({
    conversationId,
    dispatch,
    envelope,
    projected,
    adapters,
  });

  return projected;
}

export function hydrateTimelineSnapshot(input: HydrateTimelineSnapshotInput): void {
  const {
    conversationId,
    dispatch,
    semRegistry,
    snapshot,
    adapters = [],
    now = Date.now,
  } = input;

  for (const entity of snapshot.entities) {
    const envelope: SemEnvelope = {
      sem: true,
      event: {
        type: 'timeline.upsert',
        id: entity.id,
        data: {
          version: snapshot.version,
          entity: entity as Record<string, unknown>,
        },
      },
    };
    projectSemEnvelope({
      conversationId,
      dispatch,
      envelope,
      semRegistry,
      adapters,
      now,
    });
  }
}
