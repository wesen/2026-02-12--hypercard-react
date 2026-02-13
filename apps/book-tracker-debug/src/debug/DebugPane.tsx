import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearEvents,
  selectDebugKinds,
  selectDebugState,
  selectEvent,
  selectFilteredDebugEvents,
  selectSelectedDebugEvent,
  setKindFilter,
  setTextFilter,
  toggleCollapsed,
} from './debugSlice';
import type { RootState } from '../app/store';

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function formatTs(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

export function DebugPane() {
  const dispatch = useDispatch();
  const debug = useSelector(selectDebugState);
  const kinds = useSelector(selectDebugKinds);
  const filteredEvents = useSelector(selectFilteredDebugEvents);
  const selected = useSelector(selectSelectedDebugEvent);

  const snapshot = useSelector((state: RootState) => ({
    navigation: state.navigation,
    books: state.books,
    runtime: state.hypercardRuntime,
  }));

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of debug.events) {
      counts[event.kind] = (counts[event.kind] ?? 0) + 1;
    }
    return counts;
  }, [debug.events]);

  if (debug.collapsed) {
    return (
      <aside style={{ width: 44, height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, borderLeft: '1px solid rgba(0,0,0,0.08)' }}>
        <button type="button" onClick={() => dispatch(toggleCollapsed())} title="Open debug pane">
          ▶
        </button>
      </aside>
    );
  }

  return (
    <aside style={{ width: 420, maxWidth: '48vw', minWidth: 320, height: '100%', borderLeft: '1px solid rgba(0,0,0,0.08)', background: '#f7f7f7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <strong style={{ fontSize: 12 }}>Debug Pane</strong>
        <span style={{ fontSize: 11, opacity: 0.7 }}>{debug.events.length} events</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => dispatch(clearEvents())}>Clear</button>
          <button type="button" onClick={() => dispatch(toggleCollapsed())} title="Collapse debug pane">◀</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <input
          value={debug.filters.text}
          onChange={(e) => dispatch(setTextFilter(e.target.value))}
          placeholder="Filter events"
          style={{ flex: 1, fontSize: 12 }}
        />
        <select
          value={debug.filters.kind}
          onChange={(e) => dispatch(setKindFilter(e.target.value))}
          style={{ width: 140, fontSize: 12 }}
        >
          <option value="all">all kinds</option>
          {kinds.map((kind) => (
            <option key={kind} value={kind}>{kind}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateRows: '1.2fr 1fr 1.1fr', minHeight: 0, flex: 1 }}>
        <section style={{ minHeight: 0, overflow: 'auto', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          {filteredEvents.slice().reverse().map((event) => {
            const active = selected?.id === event.id;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => dispatch(selectEvent(event.id))}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  fontSize: 11,
                  border: 0,
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  padding: '6px 8px',
                  background: active ? 'rgba(46, 120, 255, 0.12)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                  <code style={{ fontSize: 10, opacity: 0.65 }}>#{event.id}</code>
                  <strong>{event.kind}</strong>
                  <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{formatTs(event.ts)}</span>
                </div>
                <div style={{ opacity: 0.75, marginTop: 2 }}>
                  {event.cardId}
                  {event.actionType ? ` · ${event.actionType}` : ''}
                  {event.selectorName ? ` · ${event.selectorName}` : ''}
                </div>
              </button>
            );
          })}
        </section>

        <section style={{ minHeight: 0, overflow: 'auto', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Selected Event</div>
          <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
            {selected ? prettyJson(selected) : 'No event selected'}
          </pre>
        </section>

        <section style={{ minHeight: 0, overflow: 'auto', padding: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>State Inspector</div>
          <details open>
            <summary style={{ cursor: 'pointer', fontSize: 11 }}>Snapshot</summary>
            <pre style={{ margin: 0, marginTop: 4, fontSize: 10, lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
              {prettyJson(snapshot)}
            </pre>
          </details>
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontSize: 11 }}>Event Kind Stats</summary>
            <pre style={{ margin: 0, marginTop: 4, fontSize: 10, lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
              {prettyJson(stats)}
            </pre>
          </details>
        </section>
      </div>
    </aside>
  );
}
