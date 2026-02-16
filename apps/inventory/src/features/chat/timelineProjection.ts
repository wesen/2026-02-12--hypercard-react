import type { TimelineItemStatus } from './chatSlice';

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

function booleanField(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  if (typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

function compactJSON(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '"<unserializable>"';
  }
}

function shortText(value: string | undefined, max = 180): string | undefined {
  if (!value) {
    return value;
  }
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}

type ProjectedLifecycleKind = 'widget' | 'card';

interface ProjectedLifecycleStatus {
  kind: ProjectedLifecycleKind;
  title?: string;
  detail: string;
}

function parseProjectedLifecycleStatus(text: string | undefined): ProjectedLifecycleStatus | undefined {
  if (!text) {
    return undefined;
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parseWithPrefix = (
    prefix: string,
    kind: ProjectedLifecycleKind,
    detail: string,
  ): ProjectedLifecycleStatus | undefined => {
    if (!trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
      return undefined;
    }
    const rawTitle = trimmed.slice(prefix.length).trim();
    return {
      kind,
      title: rawTitle.length > 0 ? rawTitle : undefined,
      detail,
    };
  };

  return (
    parseWithPrefix('Building widget: ', 'widget', 'started') ??
    parseWithPrefix('Updating widget: ', 'widget', 'updating') ??
    parseWithPrefix('Building card proposal: ', 'card', 'started') ??
    parseWithPrefix('Updating card proposal: ', 'card', 'updating') ??
    (trimmed.toLowerCase() === 'building widget...'
      ? { kind: 'widget', detail: 'started' }
      : undefined) ??
    (trimmed.toLowerCase() === 'updating widget...'
      ? { kind: 'widget', detail: 'updating' }
      : undefined) ??
    (trimmed.toLowerCase() === 'building card proposal...'
      ? { kind: 'card', detail: 'started' }
      : undefined) ??
    (trimmed.toLowerCase() === 'updating card proposal...'
      ? { kind: 'card', detail: 'updating' }
      : undefined)
  );
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

function artifactIdFromStructuredResult(result: Record<string, unknown> | undefined): string | undefined {
  const data = result ? recordField(result, 'data') : undefined;
  const artifact = data ? recordField(data, 'artifact') : undefined;
  return artifact ? stringField(artifact, 'id') : undefined;
}

function readyDetail(template: string | undefined, artifactId: string | undefined): string {
  const parts: string[] = [];
  if (template) {
    parts.push(`template=${template}`);
  }
  if (artifactId) {
    parts.push(`artifact=${artifactId}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'ready';
}

function statusFromTimelineType(value: string | undefined): TimelineItemStatus {
  if (value === 'error') {
    return 'error';
  }
  if (value === 'success') {
    return 'success';
  }
  return 'info';
}

export interface TimelineItemUpdate {
  id: string;
  title: string;
  status: TimelineItemStatus;
  detail?: string;
  kind?: 'tool' | 'widget' | 'card' | 'timeline';
  template?: string;
  artifactId?: string;
  rawData?: Record<string, unknown>;
}

export function formatTimelineUpsert(data: Record<string, unknown>): TimelineItemUpdate | undefined {
  const entity = recordField(data, 'entity');
  if (!entity) {
    return undefined;
  }
  const kind = stringField(entity, 'kind') ?? '';
  const id = stringField(entity, 'id') ?? 'unknown';
  const toolCall = recordField(entity, 'toolCall');
  if (toolCall && kind === 'tool_call') {
    const name = stringField(toolCall, 'name') ?? id;
    const statusValue = (stringField(toolCall, 'status') ?? '').toLowerCase();
    const done = booleanField(toolCall, 'done') ?? false;
    const input = toolCall.input;
    let status: TimelineItemStatus = 'running';
    if (done) {
      status = statusValue === 'error' || statusValue === 'failed' ? 'error' : 'success';
    }
    const detail =
      typeof input === 'undefined'
        ? done
          ? status === 'error'
            ? 'error'
            : 'done'
          : 'started'
        : shortText(`args=${compactJSON(input)}`);
    const rawData: Record<string, unknown> = { name };
    if (typeof input !== 'undefined') rawData.input = input;
    if (done && toolCall.output !== undefined) rawData.output = toolCall.output;
    return {
      id: `tool:${id}`,
      title: `Tool ${name}`,
      status,
      detail,
      kind: 'tool',
      rawData,
    };
  }
  const status = recordField(entity, 'status');
  if (status && kind === 'status') {
    const text = stringField(status, 'text');
    const statusType = stringField(status, 'type');
    const baseId = id.endsWith(':status') ? id.slice(0, -7) : id;
    const projected = parseProjectedLifecycleStatus(text);
    const lowered = (text ?? '').toLowerCase();
    let prefix = 'timeline';
    if (projected?.kind === 'widget' || lowered.includes('widget')) {
      prefix = 'widget';
    } else if (projected?.kind === 'card' || lowered.includes('card')) {
      prefix = 'card';
    }
    const timelineKind = prefix === 'widget' ? 'widget' : prefix === 'card' ? 'card' : 'timeline';
    const timelineStatus = projected ? 'running' : statusFromTimelineType(statusType);
    return {
      id: `${prefix}:${baseId}`,
      title: projected?.title ?? text ?? id,
      status: timelineStatus,
      detail: shortText(projected?.detail ?? (statusType ? `timeline status=${statusType}` : undefined)),
      kind: timelineKind,
      rawData: entity as Record<string, unknown>,
    };
  }

  const toolResult = recordField(entity, 'toolResult');
  if (toolResult && kind === 'tool_result') {
    const customKind = stringField(toolResult, 'customKind');
    const toolCallId = stringField(toolResult, 'toolCallId') ?? id;
    const resultRecord =
      structuredRecordFromUnknown(toolResult.result) ?? structuredRecordFromUnknown(toolResult.resultRaw);
    const resultTitle = resultRecord ? stringField(resultRecord, 'title') : undefined;
    const resultTemplate = resultRecord ? stringField(resultRecord, 'template') : undefined;
    const resultWidgetType = resultRecord ? stringField(resultRecord, 'type') : undefined;
    const resultArtifactId = artifactIdFromStructuredResult(resultRecord);
    if (customKind === 'hypercard.widget.v1') {
      return {
        id: `widget:${toolCallId}`,
        title: resultTitle ?? 'Widget',
        status: 'success',
        detail: shortText(readyDetail(resultWidgetType, resultArtifactId)),
        kind: 'widget',
        template: resultWidgetType,
        artifactId: resultArtifactId,
        rawData: resultRecord ?? (entity as Record<string, unknown>),
      };
    }
    if (customKind === 'hypercard.card.v2') {
      return {
        id: `card:${toolCallId}`,
        title: resultTitle ?? 'Card',
        status: 'success',
        detail: shortText(readyDetail(resultTemplate, resultArtifactId)),
        kind: 'card',
        template: resultTemplate,
        artifactId: resultArtifactId,
        rawData: resultRecord ?? (entity as Record<string, unknown>),
      };
    }
    const resultText = stringField(toolResult, 'resultRaw') ?? compactJSON(toolResult.result);
    return {
      id: `tool:${toolCallId}`,
      title: `Tool ${toolCallId}`,
      status: 'success',
      detail: shortText(resultText),
      kind: 'tool',
      rawData: toolResult as Record<string, unknown>,
    };
  }
  return undefined;
}
