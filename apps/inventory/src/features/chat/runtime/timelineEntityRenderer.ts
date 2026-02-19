import {
  type ChatWindowMessage,
  formatTimelineEntity,
  type TimelineEntity,
  type TimelineWidgetItem,
} from '@hypercard/engine';
import { stripTrailingWhitespace } from '../semHelpers';

function shortText(value: string | undefined, max = 180): string | undefined {
  if (!value) return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

type WidgetGroup = 'timeline' | 'cards' | 'widgets';

interface RoundWidgetBuckets {
  timeline: Map<string, TimelineWidgetItem>;
  cards: Map<string, TimelineWidgetItem>;
  widgets: Map<string, TimelineWidgetItem>;
}

const MAX_TIMELINE_ITEMS = 24;
const MAX_PANEL_ITEMS = 16;

function roundLabel(round: number): string {
  return round === 0 ? 'Previous Session' : `round ${round}`;
}

function createRoundWidgetBuckets(): RoundWidgetBuckets {
  return {
    timeline: new Map(),
    cards: new Map(),
    widgets: new Map(),
  };
}

function ensureRoundBuckets(byRound: Map<number, RoundWidgetBuckets>, round: number): RoundWidgetBuckets {
  const existing = byRound.get(round);
  if (existing) {
    return existing;
  }
  const created = createRoundWidgetBuckets();
  byRound.set(round, created);
  return created;
}

function createWidgetMessage(group: WidgetGroup, round: number): ChatWindowMessage {
  if (group === 'cards') {
    return {
      id: `card-panel-widget-message-r${round}`,
      role: 'system',
      text: '',
      status: 'complete',
      content: [
        {
          kind: 'widget',
          widget: {
            id: `inventory-card-panel-widget-r${round}`,
            type: 'inventory.cards',
            label: `Generated Cards (${roundLabel(round)})`,
            props: { items: [] },
          },
        },
      ],
    };
  }

  if (group === 'widgets') {
    return {
      id: `widget-panel-widget-message-r${round}`,
      role: 'system',
      text: '',
      status: 'complete',
      content: [
        {
          kind: 'widget',
          widget: {
            id: `inventory-widget-panel-widget-r${round}`,
            type: 'inventory.widgets',
            label: `Generated Widgets (${roundLabel(round)})`,
            props: { items: [] },
          },
        },
      ],
    };
  }

  return {
    id: `timeline-widget-message-r${round}`,
    role: 'system',
    text: '',
    status: 'complete',
    content: [
      {
        kind: 'widget',
        widget: {
          id: `inventory-timeline-widget-r${round}`,
          type: 'inventory.timeline',
          label: `Run Timeline (${roundLabel(round)})`,
          props: { items: [] },
        },
      },
    ],
  };
}

function groupForItem(item: TimelineWidgetItem): WidgetGroup {
  if (item.kind === 'card') return 'cards';
  if (item.kind === 'widget') return 'widgets';
  return 'timeline';
}

function maxItemsForGroup(group: WidgetGroup): number {
  if (group === 'timeline') return MAX_TIMELINE_ITEMS;
  return MAX_PANEL_ITEMS;
}

function timelineWidgetItemFromEntity(entity: TimelineEntity): TimelineWidgetItem | undefined {
  const projected = formatTimelineEntity(entity);
  if (!projected) {
    return undefined;
  }

  return {
    id: projected.id,
    title: projected.title,
    status: projected.status,
    detail: projected.detail,
    kind: projected.kind,
    template: projected.template,
    artifactId: projected.artifactId,
    rawData: projected.rawData,
    updatedAt: entity.updatedAt ?? entity.createdAt,
  };
}

function sortedItems(values: Iterable<TimelineWidgetItem>, maxItems: number): TimelineWidgetItem[] {
  return [...values].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, maxItems);
}

export function mapTimelineEntityToMessage(entity: TimelineEntity): ChatWindowMessage {
  if (entity.kind === 'message') {
    const roleRaw = typeof entity.props.role === 'string' ? entity.props.role : 'assistant';
    const role: ChatWindowMessage['role'] = roleRaw === 'user' ? 'user' : roleRaw === 'system' ? 'system' : 'ai';
    const text = typeof entity.props.content === 'string' ? stripTrailingWhitespace(entity.props.content) : '';
    const streaming = entity.props.streaming === true;
    return {
      id: entity.id,
      role,
      text,
      status: streaming ? 'streaming' : 'complete',
    };
  }

  if (entity.kind === 'tool_call') {
    const name = typeof entity.props.name === 'string' ? entity.props.name : 'tool';
    const done = entity.props.done === true;
    return {
      id: entity.id,
      role: 'system',
      text: done ? `Tool ${name} done` : `Tool ${name} running`,
      status: done ? 'complete' : 'streaming',
    };
  }

  if (entity.kind === 'tool_result') {
    const customKind =
      typeof entity.props.customKind === 'string' && entity.props.customKind.length > 0 ? entity.props.customKind : '';
    const resultText =
      typeof entity.props.resultText === 'string'
        ? entity.props.resultText
        : (shortText(
            typeof entity.props.result === 'string' ? entity.props.result : JSON.stringify(entity.props.result ?? {}),
          ) ?? '');
    const prefix = customKind ? `Result (${customKind})` : 'Result';
    return {
      id: entity.id,
      role: 'system',
      text: stripTrailingWhitespace(`${prefix}: ${resultText}`),
      status: 'complete',
    };
  }

  if (entity.kind === 'status') {
    const text = typeof entity.props.text === 'string' ? entity.props.text : 'status';
    const type = typeof entity.props.type === 'string' ? entity.props.type : 'info';
    return {
      id: entity.id,
      role: 'system',
      text: `[${type}] ${text}`,
      status: type === 'error' ? 'error' : 'complete',
    };
  }

  if (entity.kind === 'log') {
    const level = typeof entity.props.level === 'string' ? entity.props.level : 'info';
    const text = typeof entity.props.message === 'string' ? entity.props.message : 'log';
    return {
      id: entity.id,
      role: 'system',
      text: `[${level}] ${text}`,
      status: 'complete',
    };
  }

  return {
    id: entity.id,
    role: 'system',
    text: `${entity.kind}: ${shortText(JSON.stringify(entity.props ?? {})) ?? ''}`,
    status: 'complete',
  };
}

export function buildTimelineDisplayMessages(timelineEntities: TimelineEntity[]): ChatWindowMessage[] {
  const messages: ChatWindowMessage[] = [];
  const byRound = new Map<number, RoundWidgetBuckets>();
  const widgetMessages = new Map<string, ChatWindowMessage>();

  let activeRound = 0;

  for (const entity of timelineEntities) {
    if (entity.kind === 'message') {
      const message = mapTimelineEntityToMessage(entity);
      if (message.role === 'user') {
        activeRound += 1;
      }
      messages.push(message);
      continue;
    }

    const item = timelineWidgetItemFromEntity(entity);
    if (item) {
      const group = groupForItem(item);
      const bucket = ensureRoundBuckets(byRound, activeRound)[group];
      bucket.set(item.id, item);

      const key = `${group}:r${activeRound}`;
      if (!widgetMessages.has(key)) {
        const widgetMessage = createWidgetMessage(group, activeRound);
        widgetMessages.set(key, widgetMessage);
        messages.push(widgetMessage);
      }
      continue;
    }

    messages.push(mapTimelineEntityToMessage(entity));
  }

  for (const [key, widgetMessage] of widgetMessages) {
    const [groupRaw, roundRaw] = key.split(':r');
    const group = groupRaw as WidgetGroup;
    const round = Number.parseInt(roundRaw ?? '0', 10);
    const roundBuckets = byRound.get(round);
    if (!roundBuckets) {
      continue;
    }

    const items = sortedItems(roundBuckets[group].values(), maxItemsForGroup(group));
    const content = widgetMessage.content;
    if (!content || content.length === 0 || content[0].kind !== 'widget') {
      continue;
    }
    content[0].widget.props = {
      ...(content[0].widget.props as Record<string, unknown>),
      items,
    };
  }

  return messages;
}
