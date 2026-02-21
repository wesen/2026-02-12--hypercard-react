import type { TimelineEntityV2 } from './pb/proto/sem/timeline/transport_pb';
import type { TimelineEntity } from '../state/timelineSlice';
import { recordField, stringField, structuredRecordFromUnknown } from './semHelpers';
import { toNumber, toNumberOr } from '../utils/number';
import { normalizeTimelineProps } from './timelinePropsRegistry';

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function propsFromTimelineEntity(e: TimelineEntityV2): Record<string, unknown> {
  const base = isObject(e?.props) ? { ...e.props } : {};
  return normalizeTimelineProps(e?.kind ?? '', base);
}

function normalizedToolCallId(id: string, props: Record<string, unknown>): string {
  const fromProps = stringField(props, 'toolCallId');
  if (fromProps) {
    return fromProps;
  }
  if (id.endsWith(':result')) {
    return id.slice(0, -7);
  }
  if (id.endsWith(':custom')) {
    return id.slice(0, -7);
  }
  return id;
}

function artifactIdFromResult(result: Record<string, unknown> | undefined): string | undefined {
  const normalize = (value: string | undefined): string | undefined => {
    if (!value) return undefined;
    let normalized = value.trim();
    if (!normalized) return undefined;
    for (let i = 0; i < 2; i += 1) {
      const quoted =
        (normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'"));
      if (quoted && normalized.length > 1) {
        normalized = normalized.slice(1, -1).trim();
      } else {
        break;
      }
    }
    return normalized || undefined;
  };

  if (!result) return undefined;
  const artifact = recordField(result, 'artifact');
  if (artifact) {
    return normalize(stringField(artifact, 'id'));
  }
  const data = recordField(result, 'data');
  const nestedArtifact = data ? recordField(data, 'artifact') : undefined;
  if (nestedArtifact) {
    return normalize(stringField(nestedArtifact, 'id'));
  }
  return undefined;
}

function resultRecordFromProps(
  props: Record<string, unknown>,
  kindHint?: 'hypercard.widget.v1' | 'hypercard.card.v2',
): Record<string, unknown> | undefined {
  const fromResult = structuredRecordFromUnknown(props.result);
  if (fromResult) {
    return fromResult;
  }

  const fromRaw = structuredRecordFromUnknown(props.resultRaw);
  if (fromRaw) {
    return fromRaw;
  }

  if (kindHint === 'hypercard.widget.v1' || kindHint === 'hypercard.card.v2') {
    return props;
  }
  return undefined;
}

function runtimeCardFromResult(
  result: Record<string, unknown> | undefined,
): { runtimeCardId?: string; runtimeCardCode?: string } {
  if (!result) {
    return {};
  }
  const directCard = recordField(result, 'card');
  const nestedCard = recordField(recordField(result, 'data') ?? {}, 'card');
  const card = directCard ?? nestedCard;
  if (!card) {
    return {};
  }
  return {
    runtimeCardId: stringField(card, 'id'),
    runtimeCardCode: stringField(card, 'code'),
  };
}

function remapHypercardEntity(
  entity: TimelineEntity,
  kind: 'hypercard.widget.v1' | 'hypercard.card.v2',
): TimelineEntity {
  const props = isObject(entity.props) ? entity.props : {};
  const resultRecord = resultRecordFromProps(props, kind);
  const toolCallId = normalizedToolCallId(entity.id, props);
  const itemId = stringField(resultRecord ?? {}, 'itemId') ?? toolCallId;
  const artifactId = artifactIdFromResult(resultRecord ?? undefined);
  const template =
    stringField(resultRecord ?? {}, 'widgetType') ??
    stringField(resultRecord ?? {}, 'type') ??
    stringField(resultRecord ?? {}, 'template');

  if (kind === 'hypercard.widget.v1') {
    return {
      ...entity,
      id: `widget:${itemId}`,
      kind: 'hypercard_widget',
      props: {
        ...props,
        itemId,
        artifactId,
        template,
        status: 'success',
        title: stringField(resultRecord ?? {}, 'title') ?? 'Widget',
        detail: 'ready',
      },
    };
  }

  const { runtimeCardId, runtimeCardCode } = runtimeCardFromResult(resultRecord);

  return {
    ...entity,
    id: `card:${itemId}`,
    kind: 'hypercard_card',
    props: {
      ...props,
      itemId,
      artifactId,
      template,
      runtimeCardId,
      runtimeCardCode,
      status: 'success',
      title: stringField(resultRecord ?? {}, 'title') ?? 'Card',
      detail: 'ready',
    },
  };
}

function remapHypercardKind(entity: TimelineEntity): TimelineEntity {
  if (entity.kind === 'hypercard.widget.v1') {
    return remapHypercardEntity(entity, 'hypercard.widget.v1');
  }
  if (entity.kind === 'hypercard.card.v2') {
    return remapHypercardEntity(entity, 'hypercard.card.v2');
  }
  return entity;
}

export function timelineEntityFromProto(e: TimelineEntityV2, version?: unknown): TimelineEntity | null {
  if (!e?.id || !e?.kind) return null;
  const createdAt = toNumberOr((e as any).createdAtMs, Date.now());
  const updatedAt = toNumber((e as any).updatedAtMs) || undefined;
  const versionNum = toNumber(version);
  const mapped: TimelineEntity = {
    id: e.id,
    kind: e.kind,
    createdAt,
    updatedAt,
    version: typeof versionNum === 'number' ? versionNum : undefined,
    props: propsFromTimelineEntity(e),
  };
  return remapHypercardKind(mapped);
}
