import { useDispatch } from 'react-redux';
import type { RenderContext, RenderEntity } from '../../chat/renderers/types';
import { recordField, stringField } from '../../chat/sem/semHelpers';
import type { SemContext, SemEvent } from '../../chat/sem/semRegistry';
import { registerSem } from '../../chat/sem/semRegistry';
import { type TimelineEntity, timelineSlice } from '../../chat/state/timelineSlice';
import { openWindow } from '../../desktop/core';
import { registerRuntimeCard } from '../../plugin-runtime';
import {
  buildArtifactOpenWindowPayload,
  extractArtifactUpsertFromSem,
  extractArtifactUpsertFromTimelineEntity,
  normalizeArtifactId,
} from '../artifacts/artifactRuntime';
import { upsertArtifact } from '../artifacts/artifactsSlice';
import { buildCodeEditorWindowPayload } from '../editor/editorLaunch';

function asDataRecord(ev: SemEvent): Record<string, unknown> {
  if (typeof ev.data === 'object' && ev.data !== null && !Array.isArray(ev.data)) {
    return ev.data as Record<string, unknown>;
  }
  return {};
}

function cardEntityId(data: Record<string, unknown>, fallbackId: string): string {
  const itemId = stringField(data, 'itemId') ?? fallbackId;
  return `card:${itemId}`;
}

function maybeRegisterRuntimeCard(
  data: Record<string, unknown>,
  artifactUpdate: { runtimeCardId?: string; runtimeCardCode?: string } | undefined,
) {
  if (artifactUpdate?.runtimeCardId && artifactUpdate?.runtimeCardCode) {
    registerRuntimeCard(artifactUpdate.runtimeCardId, artifactUpdate.runtimeCardCode);
    return;
  }

  const payload = recordField(data, 'data');
  const cardRecord = payload ? recordField(payload, 'card') : undefined;
  const runtimeCardId = cardRecord ? stringField(cardRecord, 'id') : undefined;
  const runtimeCardCode = cardRecord ? stringField(cardRecord, 'code') : undefined;
  if (runtimeCardId && runtimeCardCode) {
    registerRuntimeCard(runtimeCardId, runtimeCardCode);
  }
}

function upsertCardEntity(ctx: SemContext, ev: SemEvent, status: 'running' | 'success' | 'error', detail: string) {
  const data = asDataRecord(ev);
  const entityId = cardEntityId(data, ev.id);
  const itemId = stringField(data, 'itemId') ?? ev.id;
  const title = stringField(data, 'name') ?? stringField(data, 'title') ?? 'Card';

  const artifactUpdate = extractArtifactUpsertFromSem(ev.type, data);
  if (artifactUpdate) {
    ctx.dispatch(
      upsertArtifact({
        ...artifactUpdate,
        updatedAt: Date.now(),
      }),
    );
  }

  if (ev.type === 'hypercard.card.v2') {
    maybeRegisterRuntimeCard(data, artifactUpdate);
  }

  const entity: TimelineEntity = {
    id: entityId,
    kind: 'hypercard_card',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    props: {
      title,
      status,
      detail,
      itemId,
      artifactId: artifactUpdate?.id,
      runtimeCardId: artifactUpdate?.runtimeCardId,
      rawData: data,
    },
  };

  ctx.dispatch(timelineSlice.actions.upsertEntity({ convId: ctx.convId, entity }));
}

export function registerHypercardCardSemHandlers() {
  registerSem('hypercard.card.start', (ev, ctx) => {
    upsertCardEntity(ctx, ev, 'running', 'started');
  });

  registerSem('hypercard.card.update', (ev, ctx) => {
    upsertCardEntity(ctx, ev, 'running', 'updating');
  });

  registerSem('hypercard.card.v2', (ev, ctx) => {
    upsertCardEntity(ctx, ev, 'success', 'ready');
  });

  registerSem('hypercard.card.error', (ev, ctx) => {
    const data = asDataRecord(ev);
    const errorDetail = stringField(data, 'error') ?? 'unknown error';
    upsertCardEntity(ctx, ev, 'error', errorDetail);
  });
}

export function HypercardCardRenderer({ e, ctx }: { e: RenderEntity; ctx?: RenderContext }) {
  const dispatch = useDispatch();
  const title = String(e.props.title ?? 'Card');
  const status = String(e.props.status ?? 'running');
  const detail = String(e.props.detail ?? '');
  const artifactId = e.props.artifactId ? String(e.props.artifactId) : '';
  const runtimeCardId = e.props.runtimeCardId ? String(e.props.runtimeCardId) : '';

  const openArtifact = () => {
    const fromTimelineEntity = extractArtifactUpsertFromTimelineEntity(e.kind, e.props);
    if (fromTimelineEntity) {
      dispatch(
        upsertArtifact({
          ...fromTimelineEntity,
          updatedAt: Date.now(),
        }),
      );
    }

    const payload = buildArtifactOpenWindowPayload({
      artifactId: fromTimelineEntity?.id ?? artifactId,
      title,
      runtimeCardId,
    });
    if (!payload) {
      return;
    }
    dispatch(openWindow(payload));
  };

  const editArtifact = () => {
    if (!runtimeCardId) {
      openArtifact();
      return;
    }
    dispatch(openWindow(buildCodeEditorWindowPayload(runtimeCardId)));
  };

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Card:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        <strong>{title}</strong> ({status}){runtimeCardId ? ` · runtime=${runtimeCardId}` : ''}
        {detail ? ` — ${detail}` : ''}
      </div>
      {ctx?.mode === 'debug' && (
        <pre
          style={{
            margin: '6px 0 0',
            fontSize: 10,
            whiteSpace: 'pre-wrap',
            opacity: 0.9,
          }}
        >
          {JSON.stringify(e.props, null, 2)}
        </pre>
      )}
      {normalizeArtifactId(artifactId) && (
        <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
          <button type="button" data-part="btn" onClick={openArtifact}>
            Open
          </button>
          <button type="button" data-part="btn" onClick={editArtifact}>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
