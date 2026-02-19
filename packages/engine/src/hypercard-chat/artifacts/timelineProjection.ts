import type { TimelineEntity } from '../timeline/types';
import type { TimelineItemStatus, TimelineItemUpdate } from '../types';
import { booleanField, compactJSON, recordField, stringField } from './semFields';

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
    (trimmed.toLowerCase() === 'building widget...' ? { kind: 'widget', detail: 'started' } : undefined) ??
    (trimmed.toLowerCase() === 'updating widget...' ? { kind: 'widget', detail: 'updating' } : undefined) ??
    (trimmed.toLowerCase() === 'building card proposal...' ? { kind: 'card', detail: 'started' } : undefined) ??
    (trimmed.toLowerCase() === 'updating card proposal...' ? { kind: 'card', detail: 'updating' } : undefined)
  );
}

function artifactIdFromLifecycleData(data: Record<string, unknown> | undefined): string | undefined {
  const artifact = data ? recordField(data, 'artifact') : undefined;
  return artifact ? stringField(artifact, 'id') : undefined;
}

function lifecycleStatus(phase: string | undefined, error: string | undefined): TimelineItemStatus {
  if (phase === 'error' || (error ?? '').trim().length > 0) {
    return 'error';
  }
  if (phase === 'ready') {
    return 'success';
  }
  return 'running';
}

function lifecycleDetail(
  phase: string | undefined,
  template: string | undefined,
  artifactId: string | undefined,
  error: string | undefined,
): string | undefined {
  if (phase === 'ready') {
    return shortText(readyDetail(template, artifactId));
  }
  if (phase === 'error') {
    return shortText(error && error.trim().length > 0 ? error : 'error');
  }
  if (phase === 'start') {
    return 'started';
  }
  if (phase === 'update') {
    return 'updating';
  }
  return undefined;
}

function itemIdFromEntityId(id: string, suffix: 'widget' | 'card'): string {
  const marker = `:${suffix}`;
  if (id.endsWith(marker)) {
    return id.slice(0, -marker.length);
  }
  return id;
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
    if (typeof input !== 'undefined') {
      rawData.input = input;
    }
    if (done && toolCall.output !== undefined) {
      rawData.output = toolCall.output;
    }

    return {
      id: `tool:${id}`,
      title: `Tool ${name}`,
      status,
      detail,
      kind: 'tool',
      rawData,
    };
  }

  if (kind === 'hypercard_widget') {
    const props = recordField(entity, 'props') ?? {};
    const itemId = stringField(props, 'itemId') ?? itemIdFromEntityId(id, 'widget');
    const title = stringField(props, 'title') ?? 'Widget';
    const widgetType = stringField(props, 'widgetType') ?? stringField(props, 'type') ?? stringField(props, 'template');
    const phase = stringField(props, 'phase') ?? 'update';
    const error = stringField(props, 'error');
    const lifecycleData = recordField(props, 'data') ?? {};
    const artifactId = artifactIdFromLifecycleData(lifecycleData);
    return {
      id: `widget:${itemId}`,
      title,
      status: lifecycleStatus(phase, error),
      detail: lifecycleDetail(phase, widgetType, artifactId, error),
      kind: 'widget',
      template: widgetType,
      artifactId,
      rawData: lifecycleData,
    };
  }

  if (kind === 'hypercard_card') {
    const props = recordField(entity, 'props') ?? {};
    const itemId = stringField(props, 'itemId') ?? itemIdFromEntityId(id, 'card');
    const title = stringField(props, 'title') ?? 'Card';
    const template = stringField(props, 'name') ?? stringField(props, 'template');
    const phase = stringField(props, 'phase') ?? 'update';
    const error = stringField(props, 'error');
    const lifecycleData = recordField(props, 'data') ?? {};
    const artifactId = artifactIdFromLifecycleData(lifecycleData);
    return {
      id: `card:${itemId}`,
      title,
      status: lifecycleStatus(phase, error),
      detail: lifecycleDetail(phase, template, artifactId, error),
      kind: 'card',
      template,
      artifactId,
      rawData: lifecycleData,
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
    const toolCallId = stringField(toolResult, 'toolCallId') ?? id;
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

export function formatTimelineEntity(entity: TimelineEntity): TimelineItemUpdate | undefined {
  if (entity.kind === 'tool_call') {
    return formatTimelineUpsert({
      entity: {
        id: entity.id,
        kind: entity.kind,
        toolCall: entity.props,
      },
    });
  }

  if (entity.kind === 'status') {
    return formatTimelineUpsert({
      entity: {
        id: entity.id,
        kind: entity.kind,
        status: {
          text: stringField(entity.props, 'text') ?? '',
          type: stringField(entity.props, 'type') ?? 'info',
        },
      },
    });
  }

  if (entity.kind === 'tool_result') {
    const toolResult: Record<string, unknown> = {};
    const toolCallId = stringField(entity.props, 'toolCallId');
    const customKind = stringField(entity.props, 'customKind');
    if (toolCallId) {
      toolResult.toolCallId = toolCallId;
    }
    if (customKind) {
      toolResult.customKind = customKind;
    }
    if (typeof entity.props.result !== 'undefined') {
      toolResult.result = entity.props.result;
    }
    const resultText = stringField(entity.props, 'resultText');
    if (resultText) {
      toolResult.resultRaw = resultText;
    }

    return formatTimelineUpsert({
      entity: {
        id: entity.id,
        kind: entity.kind,
        toolResult,
      },
    });
  }

  if (entity.kind === 'hypercard_widget' || entity.kind === 'hypercard_card') {
    return formatTimelineUpsert({
      entity: {
        id: entity.id,
        kind: entity.kind,
        props: entity.props,
      },
    });
  }

  return undefined;
}
