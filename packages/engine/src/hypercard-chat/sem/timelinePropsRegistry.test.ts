import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearRegisteredTimelinePropsNormalizers,
  normalizeTimelineProps,
  registerTimelinePropsNormalizer,
  unregisterTimelinePropsNormalizer,
} from './timelinePropsRegistry';

describe('timelinePropsRegistry', () => {
  beforeEach(() => {
    clearRegisteredTimelinePropsNormalizers();
  });

  it('normalizes built-in tool_result props', () => {
    const props = normalizeTimelineProps('tool_result', {
      customKind: 42,
      resultText: 'ready',
    });
    expect(props.customKind).toBe('');
    expect(props.result).toBe('ready');
    expect(props.resultText).toBe('ready');
  });

  it('registers and unregisters extension normalizers', () => {
    registerTimelinePropsNormalizer('hypercard_widget', (props) => ({
      ...props,
      normalized: true,
    }));

    const normalized = normalizeTimelineProps('hypercard_widget', { a: 1 });
    expect(normalized.normalized).toBe(true);

    unregisterTimelinePropsNormalizer('hypercard_widget');
    const passthrough = normalizeTimelineProps('hypercard_widget', { a: 1 });
    expect(passthrough.normalized).toBeUndefined();
    expect(passthrough.a).toBe(1);
  });
});
