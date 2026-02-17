import { useEffect, useRef, useState } from 'react';
import {
  computeSnapshot,
  getDiagnosticsConfig,
  isDiagnosticsPaused,
} from './diagnosticsStore';
import type { ReduxPerfSnapshot } from './types';
import { DEFAULT_DIAGNOSTICS_CONFIG } from './types';

const DEFAULT_POLL_MS = 500;

/** Initial empty snapshot used before the first poll. */
function emptySnapshot(): ReduxPerfSnapshot {
  return {
    windowMs: DEFAULT_DIAGNOSTICS_CONFIG.windowMs,
    actionsPerSec: 0,
    stateChangesPerSec: 0,
    avgReducerMs: 0,
    p95ReducerMs: 0,
    fps: 0,
    longFramesPerSec: 0,
    topActionRates: [],
  };
}

/**
 * React hook that polls the module-level diagnostics store at a fixed
 * interval and returns the latest `ReduxPerfSnapshot`.
 *
 * Completely independent of Redux — no `useSelector`, no store subscription.
 * The only thing that triggers a React render is the `setInterval` tick.
 *
 * @param pollMs  Polling interval in milliseconds. Default: 500.
 */
export function useDiagnosticsSnapshot(pollMs = DEFAULT_POLL_MS): {
  snapshot: ReduxPerfSnapshot;
  paused: boolean;
  windowMs: number;
} {
  const [snapshot, setSnapshot] = useState<ReduxPerfSnapshot>(emptySnapshot);
  const [paused, setPaused] = useState(false);
  const [windowMs, setWindowMs] = useState(DEFAULT_DIAGNOSTICS_CONFIG.windowMs);
  const pausedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const currentPaused = isDiagnosticsPaused();
      pausedRef.current = currentPaused;
      setPaused(currentPaused);
      setWindowMs(getDiagnosticsConfig().windowMs);

      if (!currentPaused) {
        setSnapshot(computeSnapshot());
      }
    }, pollMs);

    return () => clearInterval(id);
  }, [pollMs]);

  return { snapshot, paused, windowMs };
}
