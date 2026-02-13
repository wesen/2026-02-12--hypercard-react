import type { StreamHandlers } from '../chatApi';
import { defaultResponseMatcher, type FakeResponse, type ResponseMatcher, tokenize } from './fakeResponses';

export interface FakeStreamConfig {
  /** Delay before first token (ms) */
  thinkingDelay?: number;
  /** Min delay between tokens (ms) */
  minTokenDelay?: number;
  /** Max delay between tokens (ms) */
  maxTokenDelay?: number;
  /** Error rate (0-1) for simulating failures */
  errorRate?: number;
  /** Custom response matcher */
  responseMatcher?: ResponseMatcher;
}

const DEFAULT_CONFIG: Required<FakeStreamConfig> = {
  thinkingDelay: 400,
  minTokenDelay: 20,
  maxTokenDelay: 60,
  errorRate: 0,
  responseMatcher: defaultResponseMatcher,
};

/**
 * Simulate a streaming response using setTimeout.
 * Works everywhere — no WebSocket or MSW required.
 * Returns a cancel function.
 */
export function fakeStream(userMessage: string, handlers: StreamHandlers, config: FakeStreamConfig = {}): () => void {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let cancelled = false;
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  function schedule(fn: () => void, delay: number) {
    const t = setTimeout(() => {
      if (!cancelled) fn();
    }, delay);
    timeouts.push(t);
  }

  // Simulate error
  if (cfg.errorRate > 0 && Math.random() < cfg.errorRate) {
    schedule(() => {
      handlers.onError('Model temporarily unavailable. Please try again.');
    }, cfg.thinkingDelay);
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }

  // Get response
  const response: FakeResponse = cfg.responseMatcher(userMessage) ?? {
    text: "I'm not sure how to help with that. Could you rephrase?",
  };

  const tokens = tokenize(response.text);
  let elapsed = cfg.thinkingDelay;

  // Stream tokens
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const delay = cfg.minTokenDelay + Math.random() * (cfg.maxTokenDelay - cfg.minTokenDelay);
    elapsed += delay;
    schedule(() => {
      handlers.onToken(token);
    }, elapsed);
  }

  // Done
  elapsed += 50;
  schedule(() => {
    handlers.onDone({ actions: response.actions });
  }, elapsed);

  return () => {
    cancelled = true;
    timeouts.forEach(clearTimeout);
  };
}
