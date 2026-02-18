import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { subscribeConversationEvents, type EventLogEntry } from './eventBus';
import { buildEventLogYamlExport, buildEventLogYamlFilename, exportEventLogYaml } from './exportYaml';
import { SyntaxHighlight } from '../utils/syntaxHighlight';
import { toYaml } from '../utils/yamlFormat';

const MAX_ENTRIES = 500;
const ALL_FAMILIES = ['llm', 'tool', 'hypercard', 'timeline', 'ws', 'other'] as const;
type Family = (typeof ALL_FAMILIES)[number];

const FAMILY_COLORS: Record<Family, string> = {
  llm: '#3b82f6',
  tool: '#f59e0b',
  hypercard: '#8b5cf6',
  timeline: '#10b981',
  ws: '#ef4444',
  other: '#6b7280',
};

const FAMILY_LABELS: Record<Family, string> = {
  llm: 'LLM',
  tool: 'Tool',
  hypercard: 'HC',
  timeline: 'TL',
  ws: 'WS',
  other: '…',
};

export interface EventViewerWindowProps {
  conversationId: string;
  initialEntries?: EventLogEntry[];
}

export function EventViewerWindow({
  conversationId,
  initialEntries,
}: EventViewerWindowProps) {
  const [entries, setEntries] = useState<EventLogEntry[]>(initialEntries ?? []);
  const [filters, setFilters] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const family of ALL_FAMILIES) {
      initial[family] = true;
    }
    return initial;
  });
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const pausedRef = useRef(paused);
  const endRef = useRef<HTMLDivElement>(null);
  pausedRef.current = paused;

  useEffect(() => {
    const unsubscribe = subscribeConversationEvents(conversationId, (entry) => {
      if (pausedRef.current) {
        return;
      }
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_ENTRIES
          ? next.slice(next.length - MAX_ENTRIES)
          : next;
      });
    });
    return unsubscribe;
  }, [conversationId]);

  const entryCount = entries.length;
  useLayoutEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [entryCount, autoScroll]);

  const visible = useMemo(
    () => entries.filter((entry) => filters[entry.family] !== false),
    [entries, filters],
  );

  const toggleFilter = useCallback((family: string) => {
    setFilters((prev) => ({ ...prev, [family]: !prev[family] }));
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearLog = useCallback(() => {
    setEntries([]);
    setExpandedIds(new Set());
  }, []);

  const exportYaml = useCallback(() => {
    const now = Date.now();
    const payload = buildEventLogYamlExport(conversationId, visible, filters, now);
    exportEventLogYaml(payload, buildEventLogYamlFilename(conversationId, now));
  }, [conversationId, visible, filters]);

  return (
    <div
      data-part="event-viewer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'monospace',
        fontSize: 12,
      }}
    >
      <div
        data-part="event-viewer-toolbar"
        style={{
          display: 'flex',
          gap: 4,
          padding: '4px 8px',
          borderBottom: '1px solid #333',
          background: '#1a1a2e',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {ALL_FAMILIES.map((family) => (
          <button
            key={family}
            data-state={filters[family] ? 'active' : 'inactive'}
            onClick={() => toggleFilter(family)}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              borderRadius: 3,
              border: `1px solid ${FAMILY_COLORS[family]}`,
              background: filters[family]
                ? `${FAMILY_COLORS[family]}30`
                : 'transparent',
              color: filters[family] ? FAMILY_COLORS[family] : '#666',
              cursor: 'pointer',
            }}
          >
            {FAMILY_LABELS[family]}
          </button>
        ))}

        <span style={{ flex: 1 }} />

        <button onClick={() => setPaused((prev) => !prev)} style={controlBtnStyle}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button onClick={clearLog} style={controlBtnStyle}>
          🗑 Clear
        </button>
        <button onClick={exportYaml} style={controlBtnStyle}>
          ⬇ YAML
        </button>
        <button
          onClick={() => setAutoScroll((prev) => !prev)}
          style={controlBtnStyle}
        >
          {autoScroll ? '📌 Pinned' : '📌 Free'}
        </button>
        <span style={{ color: '#666', fontSize: 10 }}>
          {visible.length}/{entries.length}
        </span>
      </div>

      <div
        data-part="event-viewer-log"
        style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}
      >
        {visible.length === 0 && (
          <div
            style={{
              color: '#555',
              textAlign: 'center',
              padding: 24,
              fontSize: 13,
            }}
          >
            {entries.length === 0
              ? '📡 Waiting for events…'
              : `All ${entries.length} events are filtered out`}
          </div>
        )}

        {visible.map((entry) => (
          <div
            key={entry.id}
            data-part="event-viewer-entry"
            data-family={entry.family}
            style={{ borderBottom: '1px solid #222' }}
          >
            <div
              data-part="event-viewer-entry-header"
              onClick={() => toggleExpand(entry.id)}
              style={{
                display: 'flex',
                gap: 8,
                padding: '3px 8px',
                cursor: 'pointer',
                alignItems: 'baseline',
              }}
            >
              <span style={{ color: '#555', fontSize: 10, minWidth: 70 }}>
                {formatTimestamp(entry.timestamp)}
              </span>
              <span
                style={{
                  color: FAMILY_COLORS[entry.family as Family] ?? '#6b7280',
                  minWidth: 130,
                  fontWeight: 600,
                }}
              >
                {entry.eventType}
              </span>
              {entry.eventId && (
                <span style={{ color: '#555', fontSize: 10 }}>
                  {entry.eventId.length > 12
                    ? `${entry.eventId.slice(0, 12)}…`
                    : entry.eventId}
                </span>
              )}
              <span
                style={{
                  color: '#888',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.summary}
              </span>
              <span style={{ color: '#444', fontSize: 10 }}>
                {expandedIds.has(entry.id) ? '▼' : '▶'}
              </span>
            </div>

            {expandedIds.has(entry.id) && (
              <div style={{ margin: '0 8px 4px 86px' }}>
                <SyntaxHighlight
                  code={toYaml(entry.rawPayload as Record<string, unknown>)}
                  language="yaml"
                  variant="dark"
                  style={{ fontSize: 11, maxHeight: 300, userSelect: 'text' }}
                />
              </div>
            )}
          </div>
        ))}

        <div ref={endRef} />
      </div>
    </div>
  );
}

const controlBtnStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: 11,
  borderRadius: 3,
  border: '1px solid #444',
  background: '#222',
  color: '#aaa',
  cursor: 'pointer',
};

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toISOString().slice(11, 23);
}
