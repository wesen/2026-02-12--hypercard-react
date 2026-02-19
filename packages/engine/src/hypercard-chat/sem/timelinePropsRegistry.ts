export type TimelineProps = Record<string, unknown>;
export type TimelinePropsNormalizer = (props: TimelineProps) => TimelineProps;

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

const builtinNormalizers: Record<string, TimelinePropsNormalizer> = {
  tool_result: (props) => {
    const customKind = asString(props.customKind);
    const result = typeof props.result === 'undefined' ? props.resultText ?? '' : props.result;
    const resultText = asString(props.resultText) || asString(result);
    return {
      ...props,
      customKind,
      result,
      resultText,
    };
  },
};

const extensionNormalizers = new Map<string, TimelinePropsNormalizer>();

export function registerTimelinePropsNormalizer(kind: string, normalizer: TimelinePropsNormalizer): void {
  const key = String(kind || '').trim();
  if (!key) return;
  extensionNormalizers.set(key, normalizer);
}

export function unregisterTimelinePropsNormalizer(kind: string): void {
  const key = String(kind || '').trim();
  if (!key) return;
  extensionNormalizers.delete(key);
}

export function clearRegisteredTimelinePropsNormalizers(): void {
  extensionNormalizers.clear();
}

export function normalizeTimelineProps(kind: string, props: TimelineProps): TimelineProps {
  const key = String(kind || '').trim();
  if (!key) return props;
  const normalizer = extensionNormalizers.get(key) ?? builtinNormalizers[key];
  if (!normalizer) return props;
  return normalizer(props);
}
