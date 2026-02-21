import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearSemHandlers, handleSem } from '../../chat/sem/semRegistry';
import {
  ensureChatModulesRegistered,
  registerHypercardTimelineChatModule,
  resetChatModulesRegistrationForTest,
} from '../../chat/runtime/registerChatModules';
import { chatSessionSlice } from '../../chat/state/chatSessionSlice';
import { timelineSlice } from '../../chat/state/timelineSlice';
import { clearRuntimeCardRegistry, hasRuntimeCard } from '../../plugin-runtime/runtimeCardRegistry';
import { createArtifactProjectionMiddleware } from '../artifacts/artifactProjectionMiddleware';
import { hypercardArtifactsReducer } from '../artifacts/artifactsSlice';
import { ASSISTANT_SUGGESTIONS_ENTITY_ID, readSuggestionsEntityProps } from '../../chat/state/suggestions';

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

describe('hypercard card handlers', () => {
  beforeEach(() => {
    clearRuntimeCardRegistry();
    clearSemHandlers();
    resetChatModulesRegistrationForTest();
    registerHypercardTimelineChatModule();
    ensureChatModulesRegistered();
  });

  it('upserts hypercard_card entity and registers runtime card for hypercard.card.v2', async () => {
    const store = createStore();

    handleSem(
      {
        sem: true,
        event: {
          type: 'hypercard.card.v2',
          id: 'evt-card',
          data: {
            itemId: 'card-123',
            name: 'Low Stock Card',
            data: {
              artifact: {
                id: 'artifact-card-1',
                data: { sku: 'WA-100' },
              },
              card: {
                id: 'runtime-low-stock',
                code: '({ ui }) => ({ render() { return ui.text("low stock"); } })',
              },
            },
          },
        },
      },
      { convId: 'conv-card', dispatch: store.dispatch }
    );
    await Promise.resolve();

    const state = store.getState();
    const entity = state.timeline.byConvId['conv-card'].byId['card:card-123'];
    const artifact = state.hypercardArtifacts.byId['artifact-card-1'];

    expect(entity).toBeDefined();
    expect(entity.kind).toBe('hypercard_card');
    expect(entity.props).toEqual(
      expect.objectContaining({
        title: 'Low Stock Card',
        status: 'success',
        itemId: 'card-123',
        artifactId: 'artifact-card-1',
      })
    );

    expect(artifact).toBeDefined();
    expect(artifact.source).toBe('card');
    expect(hasRuntimeCard('runtime-low-stock')).toBe(true);
  });

  it('projects suggestions from hypercard.suggestions.v1 into timeline', () => {
    const store = createStore();

    handleSem(
      {
        sem: true,
        event: {
          type: 'hypercard.suggestions.v1',
          id: 'evt-suggestions',
          data: {
            suggestions: ['Open low stock card', 'Show margin report'],
          },
        },
      },
      { convId: 'conv-card', dispatch: store.dispatch }
    );

    expect(
      readSuggestionsEntityProps(
        store.getState().timeline.byConvId['conv-card'].byId[ASSISTANT_SUGGESTIONS_ENTITY_ID]
      )?.items
    ).toEqual(['Open low stock card', 'Show margin report']);
  });
});
