import { describe, expect, it, vi } from 'vitest';
import { createSemRegistry } from '../sem/registry';
import { createConversationRuntime } from './runtime';
import type {
  ConversationRuntimeClient,
  ConversationRuntimeClientFactory,
  ConversationRuntimeClientHandlers,
} from './types';

interface RuntimeHarness {
  createClient: ConversationRuntimeClientFactory;
  client: ConversationRuntimeClient & {
    connect: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };
  getHandlers: () => ConversationRuntimeClientHandlers;
}

function createRuntimeHarness(): RuntimeHarness {
  let handlers: ConversationRuntimeClientHandlers | null = null;
  const client = {
    connect: vi.fn(),
    close: vi.fn(),
  };

  return {
    client,
    createClient: (nextHandlers) => {
      handlers = nextHandlers;
      return client;
    },
    getHandlers: () => {
      if (!handlers) {
        throw new Error('Runtime client handlers not initialized');
      }
      return handlers;
    },
  };
}

describe('createConversationRuntime', () => {
  it('opens exactly one connection for two claims and closes on last release', () => {
    const harness = createRuntimeHarness();
    const runtime = createConversationRuntime({
      conversationId: 'conv-1',
      semRegistry: createSemRegistry(),
      createClient: harness.createClient,
    });

    const releaseA = runtime.claimConnection();
    const releaseB = runtime.claimConnection();

    expect(harness.client.connect).toHaveBeenCalledTimes(1);
    expect(runtime.getState().connection.status).toBe('connecting');

    releaseA();
    expect(harness.client.close).not.toHaveBeenCalled();

    releaseB();
    expect(harness.client.close).toHaveBeenCalledTimes(1);
    expect(runtime.getState().connection.status).toBe('closed');
  });

  it('buffers envelopes until hydration and replays in stream/seq order', () => {
    const harness = createRuntimeHarness();
    const runtime = createConversationRuntime({
      conversationId: 'conv-1',
      semRegistry: createSemRegistry(),
      createClient: harness.createClient,
      waitForHydration: true,
    });

    runtime.ingestEnvelope({
      sem: true,
      event: {
        type: 'llm.delta',
        id: 'm1',
        seq: 2,
        data: { cumulative: 'second' },
      },
    });
    runtime.ingestEnvelope({
      sem: true,
      event: {
        type: 'llm.delta',
        id: 'm1',
        seq: 1,
        data: { cumulative: 'first' },
      },
    });

    expect(runtime.getState().timeline.ids).toEqual([]);

    runtime.hydrateSnapshot({
      version: '11',
      entities: [],
    });

    const entity = runtime.getState().timeline.byId.m1;
    expect(entity).toBeDefined();
    expect(entity?.props.content).toBe('second');
    expect(runtime.getState().connection.hydratedVersion).toBe('11');
  });

  it('keeps duplicate buffered replay idempotent', () => {
    const harness = createRuntimeHarness();
    const runtime = createConversationRuntime({
      conversationId: 'conv-1',
      semRegistry: createSemRegistry(),
      createClient: harness.createClient,
      waitForHydration: true,
    });

    const duplicateEnvelope = {
      sem: true as const,
      event: {
        type: 'llm.start',
        id: 'm1',
        seq: 1,
        data: { role: 'assistant' },
      },
    };
    runtime.ingestEnvelope(duplicateEnvelope);
    runtime.ingestEnvelope(duplicateEnvelope);
    expect(runtime.getState().timeline.ids).toEqual([]);

    runtime.hydrateSnapshot({
      version: '12',
      entities: [],
    });

    expect(runtime.getState().timeline.ids).toEqual(['m1']);
  });

  it('routes transport events through runtime-owned handlers', () => {
    const harness = createRuntimeHarness();
    const runtime = createConversationRuntime({
      conversationId: 'conv-1',
      semRegistry: createSemRegistry(),
      createClient: harness.createClient,
    });

    runtime.claimConnection();
    const handlers = harness.getHandlers();
    handlers.onStatus?.('connected');
    handlers.onEnvelope({
      sem: true,
      event: {
        type: 'llm.start',
        id: 'm1',
        data: { role: 'assistant' },
      },
    });

    expect(runtime.getState().connection.status).toBe('connected');
    expect(runtime.getState().timeline.ids).toContain('m1');
  });
});
