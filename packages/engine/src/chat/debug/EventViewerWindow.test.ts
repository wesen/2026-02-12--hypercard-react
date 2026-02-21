import { describe, expect, it } from 'vitest';
import { isNearBottom } from './EventViewerWindow';

describe('EventViewerWindow auto-scroll threshold', () => {
  it('treats exact bottom as near-bottom', () => {
    expect(
      isNearBottom({
        scrollTop: 700,
        clientHeight: 300,
        scrollHeight: 1000,
      }),
    ).toBe(true);
  });

  it('treats positions within the threshold as near-bottom', () => {
    expect(
      isNearBottom({
        scrollTop: 672,
        clientHeight: 300,
        scrollHeight: 1000,
      }),
    ).toBe(true);
  });

  it('treats positions beyond the threshold as not near-bottom', () => {
    expect(
      isNearBottom({
        scrollTop: 667,
        clientHeight: 300,
        scrollHeight: 1000,
      }),
    ).toBe(false);
  });

  it('supports custom thresholds', () => {
    expect(
      isNearBottom({
        scrollTop: 650,
        clientHeight: 300,
        scrollHeight: 1000,
        thresholdPx: 60,
      }),
    ).toBe(true);

    expect(
      isNearBottom({
        scrollTop: 650,
        clientHeight: 300,
        scrollHeight: 1000,
        thresholdPx: 40,
      }),
    ).toBe(false);
  });
});
