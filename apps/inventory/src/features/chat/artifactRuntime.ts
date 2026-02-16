import type { OpenWindowPayload } from '@hypercard/engine';
import type { ArtifactSource } from './artifactsSlice';

export interface ArtifactUpsert {
  id: string;
  title?: string;
  template?: string;
  data?: Record<string, unknown>;
  source: ArtifactSource;
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

  if (type === 'hypercard.card_proposal.v1') {
    return artifactFromStructured(data, 'card', stringField(data, 'template'));
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
  if (customKind === 'hypercard.card_proposal.v1') {
    return artifactFromStructured(resultRecord, 'card', stringField(resultRecord, 'template'));
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
}): OpenWindowPayload | undefined {
  const artifactId = input.artifactId.trim();
  if (artifactId.length === 0) {
    return undefined;
  }
  const safeKey = sanitizeArtifactKey(artifactId);
  const cardId = templateToCardId(input.template);
  const title = input.title?.trim() || `Artifact ${artifactId}`;
  const stackId = (input.stackId ?? 'inventory').trim() || 'inventory';

  return {
    id: `window:artifact:${safeKey}`,
    title,
    icon: templateIcon(input.template),
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
