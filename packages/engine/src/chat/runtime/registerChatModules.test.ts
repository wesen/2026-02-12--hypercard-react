import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatSessionSlice } from '../state/chatSessionSlice';
import {
  clearRegisteredTimelineRenderers,
  registerTimelineRenderer,
  resolveTimelineRenderers,
} from '../renderers/rendererRegistry';
import { readSuggestionsEntityProps, ASSISTANT_SUGGESTIONS_ENTITY_ID } from '../state/suggestions';
import { timelineSlice } from '../state/timelineSlice';
import { clearSemHandlers, handleSem } from '../sem/semRegistry';
import { hypercardArtifactsReducer } from '../../hypercard/artifacts/artifactsSlice';
import {
  ensureChatModulesRegistered,
  registerHypercardTimelineChatModule,
  listChatRuntimeModules,
  registerChatRuntimeModule,
  resetChatModulesRegistrationForTest,
} from './registerChatModules';

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      chatSession: chatSessionSlice.reducer,
      hypercardArtifacts: hypercardArtifactsReducer,
    },
  });
}

describe('registerChatModules', () => {
  beforeEach(() => {
    clearSemHandlers();
    clearRegisteredTimelineRenderers();
    resetChatModulesRegistrationForTest();
  });

  it('registers default handlers and supports late hypercard registration', () => {
    ensureChatModulesRegistered();
    ensureChatModulesRegistered();

    const store = createStore();

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.delta',
          id: 'msg-1',
          data: {
            cumulative: 'hello',
          },
        },
      },
      { convId: 'conv-1', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'hypercard.suggestions.v1',
          id: 'evt-suggestions',
          data: {
            suggestions: ['Open card'],
          },
        },
      },
      { convId: 'conv-1', dispatch: store.dispatch }
    );

    const state = store.getState();
    expect(state.timeline.byConvId['conv-1'].byId['msg-1'].kind).toBe('message');
    expect(state.timeline.byConvId['conv-1'].byId[ASSISTANT_SUGGESTIONS_ENTITY_ID]).toBeUndefined();

    registerHypercardTimelineChatModule();

    handleSem(
      {
        sem: true,
        event: {
          type: 'hypercard.suggestions.v1',
          id: 'evt-suggestions-2',
          data: {
            suggestions: ['Open card now'],
          },
        },
      },
      { convId: 'conv-1', dispatch: store.dispatch }
    );

    const withHypercard = store.getState();
    expect(
      readSuggestionsEntityProps(
        withHypercard.timeline.byConvId['conv-1'].byId[ASSISTANT_SUGGESTIONS_ENTITY_ID]
      )?.items
    ).toEqual(['Open card now']);
  });

  it('exposes module contract registration and applies modules once', () => {
    const beforeEnsure = vi.fn();
    registerChatRuntimeModule({
      id: 'test.before-ensure',
      register: beforeEnsure,
    });

    ensureChatModulesRegistered();
    ensureChatModulesRegistered();
    expect(beforeEnsure).toHaveBeenCalledTimes(1);

    const afterEnsure = vi.fn();
    registerChatRuntimeModule({
      id: 'test.after-ensure',
      register: afterEnsure,
    });
    expect(afterEnsure).toHaveBeenCalledTimes(1);

    const modules = listChatRuntimeModules();
    expect(modules).toContain('chat.default-sem');
    expect(modules).toContain('chat.default-renderers');
    expect(modules).toContain('test.before-ensure');
    expect(modules).toContain('test.after-ensure');
  });

  it('applies renderer modules registered after bootstrap', () => {
    ensureChatModulesRegistered();

    const customRenderer = vi.fn(() => null);
    registerChatRuntimeModule({
      id: 'test.renderer-module',
      register: () => {
        registerTimelineRenderer('custom_kind', customRenderer);
      },
    });

    const renderers = resolveTimelineRenderers();
    expect(renderers.custom_kind).toBe(customRenderer);
  });
});
