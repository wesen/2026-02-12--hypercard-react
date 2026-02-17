import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { InlineWidget } from '@hypercard/engine';
import type { TimelineItemStatus, TimelineWidgetItem } from './chatSlice';
import { SyntaxHighlight } from './utils/SyntaxHighlight';
import { toYaml } from './utils/yamlFormat';

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

/* ── Status helpers (shared with ArtifactPanelWidgets) ───────────────── */

export function statusGlyph(status: TimelineItemStatus): string {
  if (status === 'running') return '⏳';
  if (status === 'success') return '✓';
  if (status === 'error') return '✗';
  return 'ℹ';
}

export function statusColor(status: TimelineItemStatus): string {
  if (status === 'error') return '#c0352b';
  if (status === 'success') return '#1b6e3a';
  if (status === 'running') return '#7b6500';
  return '#4c5671';
}

function kindLabel(kind: TimelineWidgetItem['kind']): string | null {
  if (!kind) return null;
  if (kind === 'tool') return 'TOOL';
  if (kind === 'widget') return 'WIDGET';
  if (kind === 'card') return 'CARD';
  return 'TIMELINE';
}

function hasExpandableContent(item: TimelineWidgetItem): boolean {
  return item.rawData !== undefined && Object.keys(item.rawData).length > 0;
}

/* ── Shared metadata table (debug or error) ──────────────────────────── */

const metaTableStyle: CSSProperties = {
  margin: '4px 0 0',
  borderCollapse: 'collapse',
  fontSize: 9,
  lineHeight: 1.5,
  width: '100%',
};

const metaThStyle: CSSProperties = {
  textAlign: 'left',
  fontWeight: 600,
  padding: '1px 8px 1px 0',
  color: '#666',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  width: '1%',
};

const metaTdStyle: CSSProperties = {
  padding: '1px 0',
  wordBreak: 'break-all',
  color: '#888',
  verticalAlign: 'top',
};

interface MetadataTableProps {
  item: TimelineWidgetItem;
  showRawData?: boolean;
}

function MetadataTable({ item, showRawData }: MetadataTableProps) {
  const rows: Array<[string, string]> = [
    ['id', item.id],
    ['kind', item.kind ?? '—'],
    ['status', item.status],
  ];
  if (item.template) rows.push(['template', item.template]);
  if (item.artifactId) rows.push(['artifactId', item.artifactId]);
  rows.push(['updatedAt', new Date(item.updatedAt).toISOString()]);

  return (
    <div style={{ margin: '4px 0 0' }}>
      <table data-part="meta-table" style={metaTableStyle}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th style={metaThStyle}>{label}</th>
              <td style={metaTdStyle}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showRawData && item.rawData && Object.keys(item.rawData).length > 0 && (
        <SyntaxHighlight
          code={toYaml(item.rawData)}
          language="yaml"
          style={{ margin: '4px 0 0', fontSize: 10, maxHeight: 240 }}
        />
      )}
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────────────────────── */

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: 11,
  border: '1px solid var(--hc-color-border-subtle, #d9d9df)',
  borderRadius: 6,
  padding: 6,
  background: 'var(--hc-color-bg-panel, #f8f8fb)',
};

const itemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '24px 1fr',
  gap: 6,
  alignItems: 'start',
  padding: '4px 2px',
  borderBottom: '1px dotted rgba(66, 72, 89, 0.15)',
};

const chipStyle: CSSProperties = {
  border: '1px solid rgba(44, 58, 88, 0.22)',
  borderRadius: 999,
  padding: '0 5px',
  fontSize: 9,
  lineHeight: '16px',
  letterSpacing: 0.2,
  whiteSpace: 'nowrap',
};

/* ── Should we show metadata for this item? ──────────────────────────── */

function shouldShowMeta(item: TimelineWidgetItem, debug: boolean): boolean {
  return debug || item.status === 'error';
}

/* ── Timeline widget ─────────────────────────────────────────────────── */

export interface InventoryTimelineWidgetProps {
  items: TimelineWidgetItem[];
  debug?: boolean;
}

export function InventoryTimelineWidget({ items, debug }: InventoryTimelineWidgetProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <div data-part="inventory-timeline-widget-empty" style={{ fontSize: 11, opacity: 0.75 }}>
        Waiting for events...
      </div>
    );
  }

  return (
    <div data-part="inventory-timeline-widget" style={panelStyle}>
      {items.map((item) => {
        const expandable = hasExpandableContent(item);
        const expanded = expandedIds.has(item.id);
        const showMeta = shouldShowMeta(item, !!debug);

        return (
          <div
            key={item.id}
            data-part="inventory-timeline-item"
            data-status={item.status}
            style={itemStyle}
          >
            {/* Status glyph */}
            <span
              data-part="inventory-timeline-status"
              style={{ fontWeight: 700, color: statusColor(item.status), textAlign: 'center' }}
            >
              {statusGlyph(item.status)}
            </span>

            <div>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                {expandable && (
                  <button
                    type="button"
                    data-part="inventory-timeline-expand-toggle"
                    onClick={() => toggleExpand(item.id)}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      cursor: 'pointer', fontSize: 10, lineHeight: 1,
                      color: 'var(--hc-color-muted, #666)',
                    }}
                    title={expanded ? 'Collapse' : 'Expand'}
                  >
                    {expanded ? '▼' : '▶'}
                  </button>
                )}
                <span style={{ fontWeight: 700 }}>{item.title}</span>
                {kindLabel(item.kind) && (
                  <span data-part="inventory-timeline-kind" style={chipStyle}>
                    {kindLabel(item.kind)}
                  </span>
                )}
                {item.template && (
                  <span data-part="inventory-timeline-template" style={{ ...chipStyle, opacity: 0.7 }}>
                    {item.template}
                  </span>
                )}
              </div>

              {/* Artifact link */}
              {item.artifactId && (
                <div style={{ opacity: 0.8, fontSize: 10 }}>artifact: {item.artifactId}</div>
              )}

              {/* Collapsed detail: show only when NOT expanded */}
              {!expanded && item.detail && (
                <div data-part="inventory-timeline-detail" style={{ opacity: 0.78 }}>
                  {item.detail}
                </div>
              )}

              {/* Expanded YAML */}
              {expanded && item.rawData && (
                <SyntaxHighlight
                  code={toYaml(item.rawData)}
                  language="yaml"
                  style={{ margin: '4px 0 0', fontSize: 10, maxHeight: 240 }}
                />
              )}

              {/* Metadata table (debug mode or error) */}
              {showMeta && (
                <MetadataTable item={item} showRawData={!expanded} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
