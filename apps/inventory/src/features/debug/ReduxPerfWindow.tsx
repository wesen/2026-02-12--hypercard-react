import {
  resetMetrics,
  selectReduxPerfPaused,
  selectReduxPerfSnapshot,
  setWindowMs,
  togglePause,
  type ReduxPerfSnapshot,
} from '@hypercard/engine';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const WINDOW_OPTIONS = [1000, 3000, 5000, 10000];
const UPDATE_INTERVAL_MS = 500;

/** Format a number to N decimal places. */
function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

/** Severity color for reducer latency. */
function latencyColor(ms: number): string {
  if (ms > 8) return 'var(--hc-color-error, #e74c3c)';
  if (ms > 2) return 'var(--hc-color-warning, #f39c12)';
  return 'inherit';
}

/**
 * Live Redux throughput & FPS diagnostics panel.
 *
 * Reads from the `reduxPerf` slice and throttles UI updates to
 * `UPDATE_INTERVAL_MS` to avoid self-induced render pressure.
 */
export function ReduxPerfWindow() {
  const dispatch = useDispatch();
  const paused = useSelector(selectReduxPerfPaused);
  const liveSnapshot = useSelector(selectReduxPerfSnapshot);

  // Throttle UI updates: only repaint every UPDATE_INTERVAL_MS
  const [displaySnapshot, setDisplaySnapshot] = useState<ReduxPerfSnapshot>(liveSnapshot);
  const snapshotRef = useRef(liveSnapshot);
  snapshotRef.current = liveSnapshot;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setDisplaySnapshot(snapshotRef.current);
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  const handleReset = useCallback(() => dispatch(resetMetrics()), [dispatch]);
  const handleTogglePause = useCallback(() => dispatch(togglePause()), [dispatch]);
  const handleWindowChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch(setWindowMs(Number(e.target.value)));
    },
    [dispatch],
  );

  const snap = displaySnapshot;

  return (
    <div style={styles.container}>
      {/* Controls */}
      <div style={styles.controls}>
        <button onClick={handleTogglePause} style={styles.btn}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button onClick={handleReset} style={styles.btn}>
          ↺ Reset
        </button>
        <label style={styles.label}>
          Window:{' '}
          <select value={snap.windowMs} onChange={handleWindowChange} style={styles.select}>
            {WINDOW_OPTIONS.map((ms) => (
              <option key={ms} value={ms}>
                {ms / 1000}s
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Metrics grid */}
      <div style={styles.grid}>
        <MetricCell label="Actions/sec" value={fmt(snap.actionsPerSec, 0)} />
        <MetricCell label="State Δ/sec" value={fmt(snap.stateChangesPerSec, 0)} />
        <MetricCell
          label="Avg reducer"
          value={`${fmt(snap.avgReducerMs)}ms`}
          color={latencyColor(snap.avgReducerMs)}
        />
        <MetricCell
          label="p95 reducer"
          value={`${fmt(snap.p95ReducerMs)}ms`}
          color={latencyColor(snap.p95ReducerMs)}
        />
        <MetricCell label="FPS" value={fmt(snap.fps, 0)} />
        <MetricCell label="Long frames/s" value={fmt(snap.longFramesPerSec, 1)} />
      </div>

      {/* Top action types */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Top Action Types</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Action Type</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Rate/s</th>
            </tr>
          </thead>
          <tbody>
            {snap.topActionRates.length === 0 && (
              <tr>
                <td colSpan={2} style={styles.td}>
                  <em>No actions yet</em>
                </td>
              </tr>
            )}
            {snap.topActionRates.map((rate) => (
              <tr key={rate.type}>
                <td style={styles.td}>
                  <code style={styles.code}>{rate.type}</code>
                </td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(rate.perSec, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <strong>Legend:</strong> Actions/sec = dispatches per second • State Δ/sec = dispatches
        that changed state • Avg/p95 reducer = reducer execution time • FPS = render frame rate
        • Long frames = frames &gt;33ms
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: color ?? 'inherit' }}>{value}</div>
    </div>
  );
}

// ── Inline styles (no CSS module dependency) ──

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 12px',
    fontFamily: 'var(--hc-font-mono, monospace)',
    fontSize: '12px',
    lineHeight: 1.5,
    overflow: 'auto',
    height: '100%',
    boxSizing: 'border-box',
  },
  controls: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  btn: {
    padding: '2px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    border: '1px solid var(--hc-color-border, #888)',
    borderRadius: '3px',
    background: 'var(--hc-color-surface, #fff)',
  },
  label: {
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  select: {
    fontSize: '11px',
    padding: '1px 4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    marginBottom: '10px',
  },
  metric: {
    background: 'var(--hc-color-surface-alt, #f5f5f5)',
    borderRadius: '4px',
    padding: '6px 8px',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: '10px',
    opacity: 0.7,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metricValue: {
    fontSize: '16px',
    fontWeight: 700,
    marginTop: '2px',
  },
  section: {
    marginBottom: '8px',
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '4px',
    opacity: 0.8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '11px',
  },
  th: {
    textAlign: 'left' as const,
    padding: '2px 4px',
    borderBottom: '1px solid var(--hc-color-border, #ccc)',
    fontWeight: 600,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '2px 4px',
    borderBottom: '1px solid var(--hc-color-border-light, #eee)',
  },
  code: {
    fontSize: '10px',
    wordBreak: 'break-all' as const,
  },
  legend: {
    fontSize: '10px',
    opacity: 0.6,
    marginTop: '8px',
    lineHeight: 1.4,
  },
};
