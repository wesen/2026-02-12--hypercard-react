import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { EventLogEntry } from './eventBus';
import { subscribeConversationEvents } from './eventBus';
import { SyntaxHighlight } from './SyntaxHighlight';
import { toYaml } from './yamlFormat';

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
  /** Optional initial entries for storybook/testing */
  initialEntries?: EventLogEntry[];
}

export function EventViewerWindow({ conversationId, initialEntries }: EventViewerWindowProps) {
  const [entries, setEntries] = useState<EventLogEntry[]>(initialEntries ?? []);
  const [filters, setFilters] = useState<Record<string, boolean>>(() => {
    const f: Record<string, boolean> = {};
    for (const family of ALL_FAMILIES) f[family] = true;
    return f;
  });
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const logRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Subscribe to conversation event bus
  useEffect(() => {
    const unsubscribe = subscribeConversationEvents(conversationId, (entry) => {
      if (pausedRef.current) return;
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
      });
    });
    return unsubscribe;
  }, [conversationId]);

  // Auto-scroll — use entry count as stable dep so window-focus re-renders don't trigger scroll
  const entryCount = entries.length;
  useLayoutEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [entryCount, autoScroll]);

  const visible = useMemo(
    () => entries.filter((e) => filters[e.family] !== false),
    [entries, filters],
  );

  const toggleFilter = useCallback((family: string) => {
    setFilters((f) => ({ ...f, [family]: !f[family] }));
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

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const toggleAutoScroll = useCallback(() => setAutoScroll((a) => !a), []);

  return (
    <div data-part="event-viewer" style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'monospace', fontSize: '12px' }}>
      {/* Filter bar */}
      <div data-part="event-viewer-toolbar" style={{
        display: 'flex', gap: '4px', padding: '4px 8px', borderBottom: '1px solid #333',
        background: '#1a1a2e', flexWrap: 'wrap', alignItems: 'center',
      }}>
        {ALL_FAMILIES.map((family) => (
          <button
            key={family}
            data-state={filters[family] ? 'active' : 'inactive'}
            onClick={() => toggleFilter(family)}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              borderRadius: '3px',
              border: `1px solid ${FAMILY_COLORS[family]}`,
              background: filters[family] ? FAMILY_COLORS[family] + '30' : 'transparent',
              color: filters[family] ? FAMILY_COLORS[family] : '#666',
              cursor: 'pointer',
            }}
          >
            {FAMILY_LABELS[family]}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={togglePause} style={controlBtnStyle}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button onClick={clearLog} style={controlBtnStyle}>
          🗑 Clear
        </button>
        <button onClick={toggleAutoScroll} style={controlBtnStyle}>
          {autoScroll ? '📌 Pinned' : '📌 Free'}
        </button>
        <span style={{ color: '#666', fontSize: '10px' }}>
          {visible.length}/{entries.length}
        </span>
      </div>

      {/* Event log */}
      <div
        ref={logRef}
        data-part="event-viewer-log"
        style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}
      >
        {visible.length === 0 && (
          <div style={{ color: '#555', textAlign: 'center', padding: '24px', fontSize: '13px' }}>
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
                display: 'flex', gap: '8px', padding: '3px 8px', cursor: 'pointer',
                alignItems: 'baseline',
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = '#ffffff08'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ color: '#555', fontSize: '10px', minWidth: '70px' }}>
                {formatTimestamp(entry.timestamp)}
              </span>
              <span style={{
                color: FAMILY_COLORS[entry.family as Family] ?? '#6b7280',
                minWidth: '130px',
                fontWeight: 600,
              }}>
                {entry.eventType}
              </span>
              {entry.eventId && (
                <span style={{ color: '#555', fontSize: '10px' }}>
                  {entry.eventId.length > 12 ? entry.eventId.slice(0, 12) + '…' : entry.eventId}
                </span>
              )}
              <span style={{ color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.summary}
              </span>
              <span style={{ color: '#444', fontSize: '10px' }}>
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
  fontSize: '11px',
  borderRadius: '3px',
  border: '1px solid #444',
  background: '#222',
  color: '#aaa',
  cursor: 'pointer',
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().slice(11, 23);
}
