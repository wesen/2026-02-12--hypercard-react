import {
  resetDiagnostics,
  setDiagnosticsWindowMs,
  toggleDiagnosticsPause,
  useDiagnosticsSnapshot,
  type ActionRateHistory,
} from '@hypercard/engine';
import { useCallback } from 'react';

const WINDOW_OPTIONS = [1000, 3000, 5000, 10000];

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

// ── Sparkline ──

const SPARK_W = 60;
const SPARK_H = 16;

/**
 * Tiny inline SVG sparkline.
 * Renders a polyline of rate values scaled to the local max.
 */
function Sparkline({ data, dimmed }: { data: number[]; dimmed?: boolean }) {
  if (data.length < 2) return <span style={{ display: 'inline-block', width: SPARK_W }} />;

  const max = Math.max(...data, 0.01); // avoid div-by-zero
  const step = SPARK_W / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(SPARK_H - (v / max) * SPARK_H).toFixed(1)}`)
    .join(' ');

  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      style={{ verticalAlign: 'middle', opacity: dimmed ? 0.35 : 1 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--hc-color-accent, #3498db)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Live Redux throughput & FPS diagnostics panel.
 *
 * Reads from the module-level diagnostics store via `useDiagnosticsSnapshot`
 * which polls at ~2Hz. No Redux selectors, no store subscriptions.
 * Action types linger in the table for ~15s after they stop firing.
 */
export function ReduxPerfWindow() {
  const { snapshot: snap, paused, windowMs, actionHistory, togglePin } = useDiagnosticsSnapshot(500);

  const handleReset = useCallback(() => resetDiagnostics(), []);
  const handleTogglePause = useCallback(() => toggleDiagnosticsPause(), []);
  const handleWindowChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setDiagnosticsWindowMs(Number(e.target.value));
    },
    [],
  );

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
          <select value={windowMs} onChange={handleWindowChange} style={styles.select}>
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
        <div style={styles.sectionTitle}>Action Types</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thPin}>{/* pin */}</th>
              <th style={styles.th}>Action Type</th>
              <th style={styles.thRight}>Rate/s</th>
              <th style={styles.thCenter}>⌁</th>
              <th style={styles.thRight}>Peak</th>
            </tr>
          </thead>
          <tbody>
            {actionHistory.length === 0 && (
              <tr>
                <td colSpan={5} style={styles.td}>
                  <em>No actions yet</em>
                </td>
              </tr>
            )}
            {actionHistory.map((entry) => (
              <ActionRow key={entry.type} entry={entry} onTogglePin={togglePin} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <strong>Legend:</strong> Actions/sec = dispatches per second • State Δ/sec = dispatches
        that changed state • Avg/p95 reducer = reducer execution time • FPS = render frame rate
        • Long frames = frames &gt;33ms • ⌁ = rate/s each sample • Peak = highest rate seen
      </div>
    </div>
  );
}

function ActionRow({ entry, onTogglePin }: { entry: ActionRateHistory; onTogglePin: (type: string) => void }) {
  const inactive = entry.perSec === 0 && !entry.pinned;
  const rowStyle: React.CSSProperties = inactive ? { opacity: 0.45 } : {};
  const handlePin = useCallback(() => onTogglePin(entry.type), [onTogglePin, entry.type]);
  return (
    <tr style={rowStyle}>
      <td style={styles.tdPin}>
        <button onClick={handlePin} style={styles.pinBtn} title={entry.pinned ? 'Unpin' : 'Pin'}>
          {entry.pinned ? '📌' : '∘'}
        </button>
      </td>
      <td style={styles.td}>
        <code style={styles.code}>{entry.type}</code>
      </td>
      <td style={styles.tdRight}>{entry.perSec === 0 ? '–' : fmt(entry.perSec, 1)}</td>
      <td style={styles.tdCenter}>
        <Sparkline data={entry.sparkline} dimmed={inactive} />
      </td>
      <td style={styles.tdRight}>{fmt(entry.peakPerSec, 1)}</td>
    </tr>
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
  thPin: {
    width: '20px',
    padding: '2px 2px',
    borderBottom: '1px solid var(--hc-color-border, #ccc)',
  },
  thRight: {
    textAlign: 'right' as const,
    padding: '2px 4px',
    borderBottom: '1px solid var(--hc-color-border, #ccc)',
    fontWeight: 600,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
  },
  thCenter: {
    textAlign: 'center' as const,
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
  tdPin: {
    width: '20px',
    padding: '2px 2px',
    borderBottom: '1px solid var(--hc-color-border-light, #eee)',
    textAlign: 'center' as const,
  },
  pinBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontSize: '11px',
    lineHeight: 1,
    opacity: 0.7,
  },
  tdRight: {
    padding: '2px 4px',
    borderBottom: '1px solid var(--hc-color-border-light, #eee)',
    textAlign: 'right' as const,
  },
  tdCenter: {
    padding: '2px 4px',
    borderBottom: '1px solid var(--hc-color-border-light, #eee)',
    textAlign: 'center' as const,
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
