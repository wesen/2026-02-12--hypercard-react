import type { CSSProperties } from 'react';
import type { TimelineWidgetItem } from './chatSlice';
import { statusColor, statusGlyph } from './InventoryTimelineWidget';

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 11,
  border: '1px solid var(--hc-color-border-subtle, #d9d9df)',
  borderRadius: 6,
  padding: 8,
  background: 'var(--hc-color-bg-panel, #f8f8fb)',
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px 1fr',
  gap: 8,
  alignItems: 'start',
  paddingBottom: 6,
  borderBottom: '1px dotted rgba(66, 72, 89, 0.18)',
};

const chipStyle: CSSProperties = {
  border: '1px solid rgba(44, 58, 88, 0.25)',
  borderRadius: 999,
  padding: '0 6px',
  fontSize: 9,
};

interface ArtifactPanelProps {
  items: TimelineWidgetItem[];
  emptyText: string;
  panelPart: string;
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
}

function ArtifactPanel({ items, emptyText, panelPart, onOpenArtifact }: ArtifactPanelProps) {
  if (items.length === 0) {
    return (
      <div data-part={`${panelPart}-empty`} style={{ fontSize: 11, opacity: 0.75 }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div data-part={panelPart} style={panelStyle}>
      {items.map((item) => (
        <div key={item.id} data-part={`${panelPart}-item`} data-status={item.status} style={rowStyle}>
          <span data-part={`${panelPart}-status`} style={{ fontWeight: 700, color: statusColor(item.status) }}>
            {statusGlyph(item.status)}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontWeight: 700 }}>{item.title}</span>
              {item.template ? <span style={chipStyle}>{item.template}</span> : null}
              {item.artifactId && item.status === 'success' && onOpenArtifact ? (
                <button
                  type="button"
                  data-part={`${panelPart}-open`}
                  onClick={() => onOpenArtifact(item)}
                  style={{
                    border: '1px solid rgba(44, 58, 88, 0.35)',
                    borderRadius: 4,
                    padding: '0 6px',
                    background: '#fff',
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  Open
                </button>
              ) : null}
            </div>
            {item.artifactId ? <div style={{ opacity: 0.82 }}>artifact: {item.artifactId}</div> : null}
            {item.detail ? <div style={{ opacity: 0.78 }}>{item.detail}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface InventoryCardPanelWidgetProps {
  items: TimelineWidgetItem[];
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
}

export function InventoryCardPanelWidget({ items, onOpenArtifact }: InventoryCardPanelWidgetProps) {
  return (
    <ArtifactPanel
      items={items}
      emptyText="No card proposals yet."
      panelPart="inventory-card-panel-widget"
      onOpenArtifact={onOpenArtifact}
    />
  );
}

export interface InventoryGeneratedWidgetPanelProps {
  items: TimelineWidgetItem[];
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
}

export function InventoryGeneratedWidgetPanel({ items, onOpenArtifact }: InventoryGeneratedWidgetPanelProps) {
  return (
    <ArtifactPanel
      items={items}
      emptyText="No generated widgets yet."
      panelPart="inventory-generated-widget-panel"
      onOpenArtifact={onOpenArtifact}
    />
  );
}
