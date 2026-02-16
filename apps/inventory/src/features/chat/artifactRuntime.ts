import type { OpenWindowPayload } from '@hypercard/engine';
import type { ArtifactSource } from './artifactsSlice';

export interface ArtifactUpsert {
  id: string;
  title?: string;
  template?: string;
  data?: Record<string, unknown>;
  source: ArtifactSource;
  runtimeCardId?: string;
  runtimeCardCode?: string;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

function recordField(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = record[key];
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function structuredRecordFromUnknown(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function artifactFromStructured(
  record: Record<string, unknown>,
  source: ArtifactSource,
  template?: string,
): ArtifactUpsert | undefined {
  const payload = recordField(record, 'data');
  const artifact = payload ? recordField(payload, 'artifact') : undefined;
  const artifactId = artifact ? stringField(artifact, 'id') : undefined;
  if (!artifactId) {
    return undefined;
  }
  return {
    id: artifactId,
    title: stringField(record, 'title'),
    template,
    data: artifact ? recordField(artifact, 'data') : undefined,
    source,
  };
}

export function extractArtifactUpsertFromSem(
  type: string | undefined,
  data: Record<string, unknown>,
): ArtifactUpsert | undefined {
  if (!type) {
    return undefined;
  }

  if (type === 'hypercard.widget.v1') {
    const template = stringField(data, 'widgetType') ?? stringField(data, 'type') ?? stringField(data, 'template');
    return artifactFromStructured(data, 'widget', template);
  }

  if (type === 'hypercard.card.v2') {
    const upsert = artifactFromStructured(data, 'card');
    if (upsert) {
      // Extract runtime card fields from the payload
      const payload = recordField(data, 'data');
      const cardData = payload ? recordField(payload, 'card') : undefined;
      if (cardData) {
        upsert.runtimeCardId = stringField(cardData, 'id');
        upsert.runtimeCardCode = stringField(cardData, 'code');
      }
    }
    return upsert;
  }

  if (type !== 'timeline.upsert') {
    return undefined;
  }

  const entity = recordField(data, 'entity');
  if (!entity || stringField(entity, 'kind') !== 'tool_result') {
    return undefined;
  }
  const toolResult = recordField(entity, 'toolResult');
  if (!toolResult) {
    return undefined;
  }
  const customKind = stringField(toolResult, 'customKind');
  const resultRecord =
    structuredRecordFromUnknown(toolResult.result) ?? structuredRecordFromUnknown(toolResult.resultRaw);
  if (!resultRecord) {
    return undefined;
  }
  if (customKind === 'hypercard.widget.v1') {
    const template =
      stringField(resultRecord, 'widgetType') ??
      stringField(resultRecord, 'type') ??
      stringField(resultRecord, 'template');
    return artifactFromStructured(resultRecord, 'widget', template);
  }
  if (customKind === 'hypercard.card.v2') {
    const upsert = artifactFromStructured(resultRecord, 'card', stringField(resultRecord, 'template'));
    if (upsert && customKind === 'hypercard.card.v2') {
      const cardData = recordField(resultRecord, 'card') ?? (resultRecord.data ? recordField(resultRecord.data as Record<string, unknown>, 'card') : undefined);
      if (cardData) {
        upsert.runtimeCardId = stringField(cardData, 'id');
        upsert.runtimeCardCode = stringField(cardData, 'code');
      }
    }
    return upsert;
  }
  return undefined;
}

function sanitizeArtifactKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

export function templateToCardId(template: string | undefined): string {
  const normalized = (template ?? '').trim().toLowerCase();
  if (normalized === 'itemviewer') {
    return 'itemViewer';
  }
  return 'reportViewer';
}

function templateIcon(template: string | undefined): string {
  return templateToCardId(template) === 'itemViewer' ? '📦' : '📊';
}

export function buildArtifactOpenWindowPayload(input: {
  artifactId: string;
  template?: string;
  title?: string;
  stackId?: string;
  runtimeCardId?: string;
}): OpenWindowPayload | undefined {
  const artifactId = input.artifactId.trim();
  if (artifactId.length === 0) {
    return undefined;
  }
  const safeKey = sanitizeArtifactKey(artifactId);
  const cardId = input.runtimeCardId ?? templateToCardId(input.template);
  const title = input.title?.trim() || `Artifact ${artifactId}`;
  const stackId = (input.stackId ?? 'inventory').trim() || 'inventory';

  return {
    id: `window:artifact:${safeKey}`,
    title,
    icon: input.runtimeCardId ? '🃏' : templateIcon(input.template),
    bounds: { x: 220, y: 50, w: 520, h: 420 },
    content: {
      kind: 'card',
      card: {
        stackId,
        cardId,
        cardSessionId: `artifact-session:${safeKey}`,
        param: artifactId,
      },
    },
    dedupeKey: `artifact:${artifactId}`,
  };
}
