import type { OpenWindowPayload } from '../../desktop/core/state';
import type { ArtifactSource } from './artifactsSlice';
import { recordField, stringField } from './semFields';

export interface ArtifactUpsert {
  id: string;
  title?: string;
  template?: string;
  data?: Record<string, unknown>;
  source: ArtifactSource;
  runtimeCardId?: string;
  runtimeCardCode?: string;
}

export interface ArtifactTemplateResolver {
  resolveCardId: (template: string | undefined) => string;
  resolveIcon?: (template: string | undefined) => string;
}

const defaultTemplateResolver: ArtifactTemplateResolver = {
  resolveCardId(template) {
    const normalized = (template ?? '').trim().toLowerCase();
    if (normalized === 'itemviewer') {
      return 'itemViewer';
    }
    return 'reportViewer';
  },
  resolveIcon(template) {
    const normalized = (template ?? '').trim().toLowerCase();
    return normalized === 'itemviewer' ? '📦' : '📊';
  },
};

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

function withRuntimeCardFields(
  upsert: ArtifactUpsert | undefined,
  data: Record<string, unknown> | undefined,
): ArtifactUpsert | undefined {
  if (!upsert || !data) {
    return upsert;
  }
  const cardData = recordField(data, 'card');
  if (!cardData) {
    return upsert;
  }
  upsert.runtimeCardId = stringField(cardData, 'id');
  upsert.runtimeCardCode = stringField(cardData, 'code');
  return upsert;
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
    const payload = recordField(data, 'data');
    return withRuntimeCardFields(artifactFromStructured(data, 'card'), payload);
  }

  if (type !== 'timeline.upsert') {
    return undefined;
  }

  const entity = recordField(data, 'entity');
  if (!entity) {
    return undefined;
  }

  const kind = stringField(entity, 'kind');
  const props = recordField(entity, 'props');
  if (!kind || !props) {
    return undefined;
  }

  if (kind === 'hypercard_widget') {
    const template = stringField(props, 'widgetType') ?? stringField(props, 'type') ?? stringField(props, 'template');
    return artifactFromStructured(
      {
        title: stringField(props, 'title'),
        data: recordField(props, 'data') ?? {},
      },
      'widget',
      template,
    );
  }

  if (kind === 'hypercard_card') {
    const dataRecord = recordField(props, 'data');
    const upsert = artifactFromStructured(
      {
        title: stringField(props, 'title'),
        data: dataRecord ?? {},
      },
      'card',
      stringField(props, 'name') ?? stringField(props, 'template'),
    );
    return withRuntimeCardFields(upsert, dataRecord);
  }

  return undefined;
}

function sanitizeArtifactKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
}

export function buildArtifactOpenWindowPayload(input: {
  artifactId: string;
  template?: string;
  title?: string;
  stackId?: string;
  runtimeCardId?: string;
  templateResolver?: ArtifactTemplateResolver;
}): OpenWindowPayload | undefined {
  const artifactId = input.artifactId.trim();
  if (artifactId.length === 0) {
    return undefined;
  }

  const safeKey = sanitizeArtifactKey(artifactId);
  const resolver = input.templateResolver ?? defaultTemplateResolver;
  const cardId = input.runtimeCardId ?? resolver.resolveCardId(input.template);
  const title = input.title?.trim() || `Artifact ${artifactId}`;
  const stackId = (input.stackId ?? 'inventory').trim() || 'inventory';

  return {
    id: `window:artifact:${safeKey}`,
    title,
    icon: input.runtimeCardId ? '🃏' : (resolver.resolveIcon?.(input.template) ?? '📄'),
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

export function defaultArtifactTemplateResolver(): ArtifactTemplateResolver {
  return defaultTemplateResolver;
}
