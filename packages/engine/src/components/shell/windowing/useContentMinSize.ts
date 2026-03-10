import { type RefObject, useLayoutEffect, useRef } from 'react';

export interface ContentMinSize {
  minW: number;
  minH: number;
}

/**
 * Measures the intrinsic minimum size of a container by temporarily setting
 * its width/height to 0 and reading scrollWidth/scrollHeight.
 *
 * Runs in useLayoutEffect (before paint) so the user never sees the 0-size state.
 * Uses key-based dedup to avoid redundant callbacks.
 */
export function useContentMinSize(
  onMinSize?: (size: ContentMinSize) => void,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const lastReportedRef = useRef('');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const savedWidth = el.style.width;
    el.style.width = '0px';
    const minW = el.scrollWidth;
    el.style.width = savedWidth;

    const savedHeight = el.style.height;
    el.style.height = '0px';
    const minH = el.scrollHeight;
    el.style.height = savedHeight;

    const key = `${minW}:${minH}`;
    if (key !== lastReportedRef.current) {
      lastReportedRef.current = key;
      onMinSize?.({ minW, minH });
    }
  });

  return ref;
}
