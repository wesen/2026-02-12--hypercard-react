import type { InlineWidget } from '@hypercard/engine';
import type { TimelineItemStatus, TimelineWidgetItem } from './chatSlice';

export function timelineItemsFromInlineWidget(widget: InlineWidget): TimelineWidgetItem[] {
  const raw = (widget.props as Record<string, unknown>).items;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item): item is TimelineWidgetItem => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.status === 'string' &&
      typeof candidate.updatedAt === 'number'
    );
  });
}

export function statusGlyph(status: TimelineItemStatus): string {
  if (status === 'running') {
    return '...';
  }
  if (status === 'success') {
    return 'OK';
  }
  if (status === 'error') {
    return 'ERR';
  }
  return 'i';
}

function kindLabel(kind: TimelineWidgetItem['kind']): string | null {
  if (!kind) {
    return null;
  }
  if (kind === 'tool') {
    return 'TOOL';
  }
  if (kind === 'widget') {
    return 'WIDGET';
  }
  if (kind === 'card') {
    return 'CARD';
  }
  return 'TIMELINE';
}

export function statusColor(status: TimelineItemStatus): string {
  if (status === 'error') {
    return '#c0352b';
  }
  if (status === 'success') {
    return '#1b6e3a';
  }
  if (status === 'running') {
    return '#7b6500';
  }
  return '#4c5671';
}

export interface InventoryTimelineWidgetProps {
  items: TimelineWidgetItem[];
}

export function InventoryTimelineWidget({ items }: InventoryTimelineWidgetProps) {
  if (items.length === 0) {
    return (
      <div data-part="inventory-timeline-widget-empty" style={{ fontSize: 11, opacity: 0.75 }}>
        Waiting for events...
      </div>
    );
  }

  return (
    <div
      data-part="inventory-timeline-widget"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontSize: 11,
        border: '1px solid var(--hc-color-border-subtle, #d9d9df)',
        borderRadius: 6,
        padding: 8,
        background: 'var(--hc-color-bg-panel, #f8f8fb)',
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          data-part="inventory-timeline-item"
          data-status={item.status}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr',
            gap: 8,
            alignItems: 'start',
            paddingBottom: 6,
            borderBottom: '1px dotted rgba(66, 72, 89, 0.18)',
          }}
        >
          <span
            data-part="inventory-timeline-status"
            style={{
              fontWeight: 700,
              color: statusColor(item.status),
            }}
          >
            {statusGlyph(item.status)}
          </span>
          <div>
            <div
              data-part="inventory-timeline-title-row"
              style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}
            >
              <span data-part="inventory-timeline-title" style={{ fontWeight: 700 }}>
                {item.title}
              </span>
              {kindLabel(item.kind) ? (
                <span
                  data-part="inventory-timeline-kind"
                  style={{
                    border: '1px solid rgba(44, 58, 88, 0.3)',
                    borderRadius: 999,
                    padding: '0 6px',
                    fontSize: 9,
                    letterSpacing: 0.2,
                  }}
                >
                  {kindLabel(item.kind)}
                </span>
              ) : null}
              {item.template ? (
                <span
                  data-part="inventory-timeline-template"
                  style={{
                    border: '1px solid rgba(44, 58, 88, 0.18)',
                    borderRadius: 999,
                    padding: '0 6px',
                    fontSize: 9,
                  }}
                >
                  {item.template}
                </span>
              ) : null}
            </div>

            {item.artifactId ? (
              <div data-part="inventory-timeline-artifact" style={{ opacity: 0.8 }}>
                artifact: {item.artifactId}
              </div>
            ) : null}
            {item.detail ? (
              <div data-part="inventory-timeline-detail" style={{ opacity: 0.82 }}>
                {item.detail}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
