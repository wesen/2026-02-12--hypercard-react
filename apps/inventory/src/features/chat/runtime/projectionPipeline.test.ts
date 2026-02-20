import {
  artifactsReducer,
  createSemRegistry,
  hydrateTimelineSnapshot,
  projectSemEnvelope,
  selectTimelineEntityById,
  timelineReducer,
} from '@hypercard/engine';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { createInventoryArtifactProjectionAdapter } from './projectionAdapters';

function createProjectionTestStore() {
  return configureStore({
    reducer: {
      timeline: timelineReducer,
      artifacts: artifactsReducer,
    },
  });
}

describe('projection pipeline adapters', () => {
  it('projects llm envelopes into timeline entities', () => {
    const store = createProjectionTestStore();
    const registry = createSemRegistry();
    const convId = 'conv-proj-1';
    const adapters: ReturnType<
      typeof createInventoryArtifactProjectionAdapter
    >[] = [];

    projectSemEnvelope({
      conversationId: convId,
      dispatch: store.dispatch,
      semRegistry: registry,
      adapters,
      envelope: {
        sem: true,
        event: {
          type: 'llm.start',
          id: 'msg-1',
          data: {},
          metadata: { model: 'gpt-5' },
        },
      },
    });

    projectSemEnvelope({
      conversationId: convId,
      dispatch: store.dispatch,
      semRegistry: registry,
      adapters,
      envelope: {
        sem: true,
        event: {
          type: 'llm.delta',
          id: 'msg-1',
          data: { cumulative: 'Hello' },
          metadata: { usage: { outputTokens: 3 } },
        },
      },
    });

    projectSemEnvelope({
      conversationId: convId,
      dispatch: store.dispatch,
      semRegistry: registry,
      adapters,
      envelope: {
        sem: true,
        event: {
          type: 'llm.final',
          id: 'msg-1',
          data: { text: 'Hello world' },
          metadata: {
            model: 'gpt-5',
            durationMs: 1000,
            usage: { inputTokens: 10, outputTokens: 8 },
          },
        },
      },
    });

    const state = store.getState();
    const messageEntity = selectTimelineEntityById(state, convId, 'msg-1');
    expect(messageEntity?.kind).toBe('message');
    expect(messageEntity?.props.content).toBe('Hello world');
    expect(messageEntity?.props.streaming).toBe(false);
  });

  it('hydrates snapshot entities and drives artifact index through adapter', () => {
    const store = createProjectionTestStore();
    const registry = createSemRegistry();
    const convId = 'conv-proj-2';
    const adapters = [createInventoryArtifactProjectionAdapter()];

    hydrateTimelineSnapshot({
      conversationId: convId,
      dispatch: store.dispatch,
      semRegistry: registry,
      adapters,
      snapshot: {
        version: '42',
        entities: [
          {
            id: 'card-low-stock:card',
            kind: 'hypercard_card',
            createdAtMs: '100',
            updatedAtMs: '120',
            props: {
              itemId: 'card-low-stock',
              title: 'Low Stock Card',
              name: 'reportViewer',
              phase: 'ready',
              data: {
                title: 'Low Stock Card',
                artifact: {
                  id: 'artifact-low-stock',
                  data: { low: ['SKU-1', 'SKU-2'] },
                },
                card: {
                  id: 'runtime.low.stock.card',
                  code: 'export default {}',
                },
              },
            },
          },
        ],
      },
    });

    const state = store.getState();
    const entity = selectTimelineEntityById(state, convId, 'card-low-stock:card');
    expect(entity?.kind).toBe('hypercard_card');
    expect(entity?.version).toBe('42');

    const artifact = state.artifacts.byId['artifact-low-stock'];
    expect(artifact).toBeTruthy();
    expect(artifact?.source).toBe('card');
    expect(artifact?.template).toBe('reportViewer');
    expect(artifact?.runtimeCardId).toBe('runtime.low.stock.card');
    expect(artifact?.runtimeCardCode).toContain('export default');
  });
});
