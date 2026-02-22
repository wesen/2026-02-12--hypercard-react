import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';
import { handleSem, clearSemHandlers } from '../../chat/sem/semRegistry';
import {
  ensureChatModulesRegistered,
  registerHypercardTimelineChatModule,
  resetChatModulesRegistrationForTest,
} from '../../chat/runtime/registerChatModules';
import { chatSessionSlice } from '../../chat/state/chatSessionSlice';
import { timelineSlice } from '../../chat/state/timelineSlice';
import { createArtifactProjectionMiddleware } from '../artifacts/artifactProjectionMiddleware';
import { hypercardArtifactsReducer } from '../artifacts/artifactsSlice';

function createStore() {
  const artifactProjection = createArtifactProjectionMiddleware();
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      chatSession: chatSessionSlice.reducer,
      hypercardArtifacts: hypercardArtifactsReducer,
    },
    middleware: (getDefault) => getDefault().concat(artifactProjection.middleware),
  });
}

describe('hypercard widget timeline projection', () => {
  beforeEach(() => {
    clearSemHandlers();
    resetChatModulesRegistrationForTest();
    registerHypercardTimelineChatModule();
    ensureChatModulesRegistered();
  });

  it('maps timeline.upsert hypercard.widget.v1 into widget entity and artifact', async () => {
    const store = createStore();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'evt-widget',
          data: {
            convId: 'conv-widget',
            version: '17',
            entity: {
              id: 'evt-widget:result',
              kind: 'hypercard.widget.v1',
              createdAtMs: '1700',
              updatedAtMs: '1701',
              props: {
                itemId: 'widget-123',
                title: 'Low Stock Widget',
                widgetType: 'itemViewer',
                data: {
                  artifact: {
                    id: 'artifact-widget-1',
                    data: { sku: 'WA-100' },
                  },
                },
              },
            },
          },
        },
      },
      { convId: 'conv-widget', dispatch: store.dispatch }
    );
    await Promise.resolve();

    const state = store.getState();
    const entity = state.timeline.byConvId['conv-widget'].byId['widget:widget-123'];
    const artifact = state.hypercardArtifacts.byId['artifact-widget-1'];

    expect(entity).toBeDefined();
    expect(entity.kind).toBe('hypercard_widget');
    expect(entity.props).toEqual(
      expect.objectContaining({
        title: 'Low Stock Widget',
        status: 'success',
        itemId: 'widget-123',
        artifactId: 'artifact-widget-1',
      })
    );

    expect(artifact).toBeDefined();
    expect(artifact.source).toBe('widget');
  });
});
