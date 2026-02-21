import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';
import { timelineSlice, type TimelineEntity } from '../../chat/state/timelineSlice';
import { clearRuntimeCardRegistry, hasRuntimeCard } from '../../plugin-runtime';
import { createArtifactProjectionMiddleware } from './artifactProjectionMiddleware';
import { hypercardArtifactsReducer } from './artifactsSlice';

function createStore() {
  const artifactProjection = createArtifactProjectionMiddleware();
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      hypercardArtifacts: hypercardArtifactsReducer,
    },
    middleware: (getDefault) => getDefault().concat(artifactProjection.middleware),
  });
}

function flushListeners() {
  return Promise.resolve();
}

describe('artifactProjectionMiddleware', () => {
  beforeEach(() => {
    clearRuntimeCardRegistry();
  });

  it('projects artifact upsert from hypercard_widget timeline entity', async () => {
    const store = createStore();
    const entity: TimelineEntity = {
      id: 'widget:widget-123',
      kind: 'hypercard_widget',
      createdAt: 1,
      props: {
        title: 'Inventory Snapshot',
        rawData: {
          title: 'Inventory Snapshot',
          widgetType: 'report',
          data: {
            artifact: {
              id: '"inventory-snapshot-1"',
              data: { totalSkus: 12 },
            },
          },
        },
      },
    };

    store.dispatch(timelineSlice.actions.upsertEntity({ convId: 'conv-1', entity }));
    await flushListeners();

    const artifact = store.getState().hypercardArtifacts.byId['inventory-snapshot-1'];
    expect(artifact).toBeDefined();
    expect(artifact.source).toBe('widget');
    expect(artifact.template).toBe('report');
    expect(artifact.data).toEqual({ totalSkus: 12 });
  });

  it('projects artifacts from snapshot entities and registers runtime cards', async () => {
    const store = createStore();
    const entities: TimelineEntity[] = [
      {
        id: 'card:card-123',
        kind: 'hypercard_card',
        createdAt: 2,
        props: {
          title: 'Low Stock Card',
          rawData: {
            title: 'Low Stock Card',
            data: {
              artifact: {
                id: 'low-stock-drilldown',
                data: { threshold: 5 },
              },
              card: {
                id: 'runtime-low-stock',
                code: '({ ui }) => ({ render() { return ui.text("hi"); } })',
              },
            },
          },
        },
      },
    ];

    store.dispatch(timelineSlice.actions.applySnapshot({ convId: 'conv-1', entities }));
    await flushListeners();

    const artifact = store.getState().hypercardArtifacts.byId['low-stock-drilldown'];
    expect(artifact).toBeDefined();
    expect(artifact.runtimeCardId).toBe('runtime-low-stock');
    expect(artifact.injectionStatus).toBe('pending');
    expect(hasRuntimeCard('runtime-low-stock')).toBe(true);
  });
});
