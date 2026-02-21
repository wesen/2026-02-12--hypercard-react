import { describe, expect, it } from 'vitest';
import type { ChatSessionSliceState } from './chatSessionSlice';
import {
  selectConversationTotalTokens,
  selectRenderableTimelineEntities,
  selectSuggestions,
  type ChatStateSlice,
} from './selectors';
import {
  ASSISTANT_SUGGESTIONS_ENTITY_ID,
  STARTER_SUGGESTIONS_ENTITY_ID,
  SUGGESTIONS_ENTITY_KIND,
} from './suggestions';
import type { TimelineState } from './timelineSlice';

function createState(timeline: TimelineState, chatSession?: ChatSessionSliceState): ChatStateSlice {
  return {
    timeline,
    chatSession: chatSession ?? { byConvId: {} },
  };
}

describe('selectors', () => {
  it('returns starter suggestions only for empty conversations', () => {
    const state = createState({
      byConvId: {
        'conv-1': {
          byId: {
            [STARTER_SUGGESTIONS_ENTITY_ID]: {
              id: STARTER_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 1,
              props: { source: 'starter', items: ['Show status', 'Show revenue'] },
            },
          },
          order: [STARTER_SUGGESTIONS_ENTITY_ID],
        },
      },
    });

    expect(selectSuggestions(state, 'conv-1')).toEqual(['Show status', 'Show revenue']);
    expect(selectRenderableTimelineEntities(state, 'conv-1')).toEqual([]);
  });

  it('suppresses starter suggestions once timeline contains renderable entities', () => {
    const state = createState({
      byConvId: {
        'conv-2': {
          byId: {
            [STARTER_SUGGESTIONS_ENTITY_ID]: {
              id: STARTER_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 1,
              props: { source: 'starter', items: ['Show status'] },
            },
            'msg-1': {
              id: 'msg-1',
              kind: 'message',
              createdAt: 2,
              props: { content: 'hello' },
            },
          },
          order: [STARTER_SUGGESTIONS_ENTITY_ID, 'msg-1'],
        },
      },
    });

    expect(selectSuggestions(state, 'conv-2')).toEqual([]);
    expect(selectRenderableTimelineEntities(state, 'conv-2').map((entity) => entity.id)).toEqual(['msg-1']);
  });

  it('prefers assistant suggestions over starter suggestions', () => {
    const state = createState({
      byConvId: {
        'conv-3': {
          byId: {
            [STARTER_SUGGESTIONS_ENTITY_ID]: {
              id: STARTER_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 1,
              props: { source: 'starter', items: ['starter item'] },
            },
            [ASSISTANT_SUGGESTIONS_ENTITY_ID]: {
              id: ASSISTANT_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 2,
              props: { source: 'assistant', items: ['assistant item'] },
            },
          },
          order: [STARTER_SUGGESTIONS_ENTITY_ID, ASSISTANT_SUGGESTIONS_ENTITY_ID],
        },
      },
    });

    expect(selectSuggestions(state, 'conv-3')).toEqual(['assistant item']);
  });

  it('hides consumed starter suggestions', () => {
    const state = createState({
      byConvId: {
        'conv-4': {
          byId: {
            [STARTER_SUGGESTIONS_ENTITY_ID]: {
              id: STARTER_SUGGESTIONS_ENTITY_ID,
              kind: SUGGESTIONS_ENTITY_KIND,
              createdAt: 1,
              props: { source: 'starter', items: ['show status'], consumedAt: 123 },
            },
          },
          order: [STARTER_SUGGESTIONS_ENTITY_ID],
        },
      },
    });

    expect(selectSuggestions(state, 'conv-4')).toEqual([]);
  });

  it('returns conversation total tokens from chat session state', () => {
    const state = createState(
      { byConvId: {} },
      {
        byConvId: {
          'conv-tokens': {
            connectionStatus: 'connected',
            isStreaming: false,
            modelName: 'gpt-5-mini',
            turnStats: null,
            conversationInputTokens: 250,
            conversationOutputTokens: 70,
            conversationCachedTokens: 12,
            streamStartTime: null,
            streamOutputTokens: 0,
            lastError: null,
            currentError: null,
            errorHistory: [],
          },
        },
      }
    );

    expect(selectConversationTotalTokens(state, 'conv-tokens')).toBe(320);
    expect(selectConversationTotalTokens(state, 'conv-missing')).toBe(0);
  });
});
