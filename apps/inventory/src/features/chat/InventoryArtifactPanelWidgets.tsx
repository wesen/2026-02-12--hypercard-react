import type { CSSProperties } from 'react';
import type { TimelineWidgetItem } from './chatSlice';
import { statusColor, statusGlyph } from './InventoryTimelineWidget';
import { SyntaxHighlight } from './utils/SyntaxHighlight';
import { toYaml } from './utils/yamlFormat';

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

const openBtnStyle: CSSProperties = {
  border: '1px solid rgba(44, 58, 88, 0.35)',
  borderRadius: 4,
  padding: '0 6px',
  background: '#fff',
  fontSize: 10,
  cursor: 'pointer',
};

/* ── Metadata table (debug or error) ─────────────────────────────────── */

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

function MetadataTable({ item }: { item: TimelineWidgetItem }) {
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
      {item.rawData && Object.keys(item.rawData).length > 0 && (
        <SyntaxHighlight
          code={toYaml(item.rawData)}
          language="yaml"
          style={{ margin: '4px 0 0', fontSize: 10, maxHeight: 240 }}
        />
      )}
    </div>
  );
}

/* ── Should we show metadata? ────────────────────────────────────────── */

function shouldShowMeta(item: TimelineWidgetItem, debug: boolean): boolean {
  return debug || item.status === 'error';
}

/* ── ArtifactPanel ───────────────────────────────────────────────────── */

interface ArtifactPanelProps {
  items: TimelineWidgetItem[];
  emptyText: string;
  panelPart: string;
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  debug?: boolean;
}

function ArtifactPanel({ items, emptyText, panelPart, onOpenArtifact, debug }: ArtifactPanelProps) {
  if (items.length === 0) {
    return (
      <div data-part={`${panelPart}-empty`} style={{ fontSize: 11, opacity: 0.75 }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div data-part={panelPart} style={panelStyle}>
      {items.map((item) => {
        const showMeta = shouldShowMeta(item, !!debug);

        return (
          <div key={item.id} data-part={`${panelPart}-item`} data-status={item.status} style={itemStyle}>
            {/* Status glyph */}
            <span
              data-part={`${panelPart}-status`}
              style={{ fontWeight: 700, color: statusColor(item.status), textAlign: 'center' }}
            >
              {statusGlyph(item.status)}
            </span>

            <div>
              {/* Title row with chips and Open button */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontWeight: 700 }}>{item.title}</span>
                {item.template && <span style={chipStyle}>{item.template}</span>}
                {item.artifactId && item.status === 'success' && onOpenArtifact && (
                  <button
                    type="button"
                    data-part={`${panelPart}-open`}
                    onClick={() => onOpenArtifact(item)}
                    style={openBtnStyle}
                  >
                    Open
                  </button>
                )}
              </div>

              {/* Artifact ID */}
              {item.artifactId && (
                <div style={{ opacity: 0.8, fontSize: 10 }}>artifact: {item.artifactId}</div>
              )}

              {/* Detail text */}
              {item.detail && (
                <div style={{ opacity: 0.78 }}>{item.detail}</div>
              )}

              {/* Metadata table (debug mode or error status) */}
              {showMeta && <MetadataTable item={item} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Exported panel components ───────────────────────────────────────── */

export interface InventoryCardPanelWidgetProps {
  items: TimelineWidgetItem[];
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  debug?: boolean;
}

export function InventoryCardPanelWidget({ items, onOpenArtifact, debug }: InventoryCardPanelWidgetProps) {
  return (
    <ArtifactPanel
      items={items}
      emptyText="No card proposals yet."
      panelPart="inventory-card-panel-widget"
      onOpenArtifact={onOpenArtifact}
      debug={debug}
    />
  );
}

export interface InventoryGeneratedWidgetPanelProps {
  items: TimelineWidgetItem[];
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  debug?: boolean;
}

export function InventoryGeneratedWidgetPanel({ items, onOpenArtifact, debug }: InventoryGeneratedWidgetPanelProps) {
  return (
    <ArtifactPanel
      items={items}
      emptyText="No generated widgets yet."
      panelPart="inventory-generated-widget-panel"
      onOpenArtifact={onOpenArtifact}
      debug={debug}
    />
  );
}
