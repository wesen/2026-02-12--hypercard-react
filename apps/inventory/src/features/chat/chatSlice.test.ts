import { describe, expect, it } from 'vitest';
import {
  applyLLMDelta,
  applyLLMFinal,
  applyLLMStart,
  chatReducer,
  type ConversationState,
  mergeSuggestions,
  queueUserPrompt,
  replaceSuggestions,
  setStreamError,
  upsertHydratedMessage,
  upsertCardPanelItem,
  upsertTimelineItem,
  upsertWidgetPanelItem,
} from './chatSlice';

const C = 'test-conv';

/** Apply a sequence of actions and return the conversation state for the test conversation. */
function reduce(actions: Parameters<typeof chatReducer>[1][]): ConversationState {
  let state = chatReducer(undefined, { type: '__test__/init' });
  for (const action of actions) {
    state = chatReducer(state, action);
  }
  return state.conversations[C] ?? ({} as ConversationState);
}

function findWidgetItems(
  conv: ConversationState,
  messageIdPrefix: string,
): Array<Record<string, unknown>> {
  const msg = conv.messages.find((m) => (m.id ?? '').startsWith(messageIdPrefix));
  if (!msg) return [];
  const widgetBlock = msg.content?.find((entry) => entry.kind === 'widget');
  if (!widgetBlock || widgetBlock.kind !== 'widget') return [];
  const items = (widgetBlock.widget.props as Record<string, unknown>).items;
  return Array.isArray(items) ? (items as Array<Record<string, unknown>>) : [];
}

describe('chatSlice (keyed conversations)', () => {
  it('streams llm.start -> llm.delta -> llm.final into a single ai message', () => {
    const conv = reduce([
      queueUserPrompt({ conversationId: C, text: 'hello' }),
      applyLLMStart({ conversationId: C, messageId: 'm-1' }),
      applyLLMDelta({ conversationId: C, messageId: 'm-1', cumulative: 'Hi there' }),
      applyLLMFinal({ conversationId: C, messageId: 'm-1', text: 'Hi there!' }),
    ]);

    const ai = conv.messages.find((message) => message.id === 'm-1');
    expect(ai).toBeTruthy();
    expect(ai?.role).toBe('ai');
    expect(ai?.text).toBe('Hi there!');
    expect(ai?.status).toBe('complete');
    expect(conv.isStreaming).toBe(false);
  });

  it('prefers cumulative deltas to keep updates idempotent', () => {
    const conv = reduce([
      queueUserPrompt({ conversationId: C, text: 'status?' }),
      applyLLMStart({ conversationId: C, messageId: 'm-2' }),
      applyLLMDelta({ conversationId: C, messageId: 'm-2', cumulative: 'A' }),
      applyLLMDelta({ conversationId: C, messageId: 'm-2', cumulative: 'AB' }),
    ]);

    const ai = conv.messages.find((message) => message.id === 'm-2');
    expect(ai?.text).toBe('AB');
    expect(ai?.status).toBe('streaming');
    expect(conv.isStreaming).toBe(true);
  });

  it('marks active streaming message as error when stream fails', () => {
    const conv = reduce([
      queueUserPrompt({ conversationId: C, text: 'ping' }),
      applyLLMStart({ conversationId: C, messageId: 'm-3' }),
      setStreamError({ conversationId: C, message: 'backend unavailable' }),
    ]);

    const ai = conv.messages.find((message) => message.id === 'm-3');
    expect(ai?.status).toBe('error');
    expect(conv.lastError).toBe('backend unavailable');
    expect(conv.isStreaming).toBe(false);
  });

  it('strips trailing whitespace from ai final messages', () => {
    const conv = reduce([
      queueUserPrompt({ conversationId: C, text: 'trim?' }),
      applyLLMStart({ conversationId: C, messageId: 'm-4' }),
      applyLLMFinal({ conversationId: C, messageId: 'm-4', text: 'Line one   \nLine two\t\t\n\n' }),
    ]);

    const ai = conv.messages.find((message) => message.id === 'm-4');
    expect(ai?.text).toBe('Line one\nLine two');
  });

  it('creates a single timeline widget message per round and upserts items in place', () => {
    const conv = reduce([
      upsertTimelineItem({
        conversationId: C,
        id: 'tool:abc',
        title: 'Tool lookup',
        status: 'running',
        detail: 'started',
        updatedAt: 10,
      }),
      upsertTimelineItem({
        conversationId: C,
        id: 'tool:abc',
        title: 'Tool lookup',
        status: 'success',
        detail: 'done',
        updatedAt: 20,
      }),
    ]);

    const timelineMessages = conv.messages.filter((m) => (m.id ?? '').startsWith('timeline-widget-message-r'));
    expect(timelineMessages).toHaveLength(1);
    const items = findWidgetItems(conv, 'timeline-widget-message-r');
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('tool:abc');
    expect(items[0]?.status).toBe('success');
    expect(items[0]?.detail).toBe('done');
    expect(items[0]?.updatedAt).toBe(20);
  });

  it('creates separate timeline widgets for different rounds', () => {
    const conv = reduce([
      queueUserPrompt({ conversationId: C, text: 'first question' }),
      upsertTimelineItem({
        conversationId: C,
        id: 'tool:r1-1',
        title: 'Tool search',
        status: 'success',
        detail: 'done',
        updatedAt: 10,
      }),
      applyLLMStart({ conversationId: C, messageId: 'ai-1' }),
      applyLLMFinal({ conversationId: C, messageId: 'ai-1', text: 'Answer 1' }),
      queueUserPrompt({ conversationId: C, text: 'second question' }),
      upsertTimelineItem({
        conversationId: C,
        id: 'tool:r2-1',
        title: 'Tool report',
        status: 'success',
        detail: 'done',
        updatedAt: 20,
      }),
    ]);

    const timelineMessages = conv.messages.filter((m) => (m.id ?? '').startsWith('timeline-widget-message-r'));
    expect(timelineMessages).toHaveLength(2);

    const r1Items = findWidgetItems(conv, 'timeline-widget-message-r1');
    expect(r1Items).toHaveLength(1);
    expect(r1Items[0]?.id).toBe('tool:r1-1');

    const r2Items = findWidgetItems(conv, 'timeline-widget-message-r2');
    expect(r2Items).toHaveLength(1);
    expect(r2Items[0]?.id).toBe('tool:r2-1');
  });

  it('preserves timeline metadata when later updates do not re-send it', () => {
    const conv = reduce([
      upsertTimelineItem({
        conversationId: C,
        id: 'card:c1',
        title: 'Detailed Inventory Summary',
        status: 'running',
        kind: 'card',
        template: 'reportViewer',
        artifactId: 'detailed_inventory_summary',
        updatedAt: 10,
      }),
      upsertTimelineItem({
        conversationId: C,
        id: 'card:c1',
        title: 'Detailed Inventory Summary',
        status: 'success',
        detail: 'done',
        updatedAt: 20,
      }),
    ]);

    const items = findWidgetItems(conv, 'timeline-widget-message-r');
    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe('card');
    expect(items[0]?.template).toBe('reportViewer');
    expect(items[0]?.artifactId).toBe('detailed_inventory_summary');
  });

  it('maintains separate card and widget panel messages per round', () => {
    const conv = reduce([
      queueUserPrompt({ conversationId: C, text: 'generate report' }),
      upsertCardPanelItem({
        conversationId: C,
        id: 'card:r1',
        title: 'Detailed Inventory Summary',
        status: 'success',
        template: 'reportViewer',
        artifactId: 'detailed_inventory_summary',
        updatedAt: 50,
      }),
      upsertWidgetPanelItem({
        conversationId: C,
        id: 'widget:r1',
        title: 'Inventory Summary Report',
        status: 'success',
        template: 'report',
        artifactId: 'inventory_summary',
        updatedAt: 60,
      }),
    ]);

    const cardItems = findWidgetItems(conv, 'card-panel-widget-message-r');
    const widgetItems = findWidgetItems(conv, 'widget-panel-widget-message-r');
    expect(cardItems[0]?.title).toBe('Detailed Inventory Summary');
    expect(cardItems[0]?.template).toBe('reportViewer');
    expect(widgetItems[0]?.title).toBe('Inventory Summary Report');
    expect(widgetItems[0]?.template).toBe('report');
  });

  it('fills suggestions incrementally while de-duplicating', () => {
    const conv = reduce([
      queueUserPrompt({ conversationId: C, text: 'help me decide' }),
      mergeSuggestions({ conversationId: C, suggestions: ['Show current inventory status'] }),
      mergeSuggestions({ conversationId: C, suggestions: ['What items are low stock?', 'show current inventory status'] }),
      replaceSuggestions({ conversationId: C, suggestions: ['Summarize today sales', 'Show current inventory status'] }),
    ]);

    expect(conv.suggestions).toEqual(['Summarize today sales', 'Show current inventory status']);
  });

  it('upserts hydrated messages by id without duplicating rows', () => {
    const conv = reduce([
      upsertHydratedMessage({
        conversationId: C,
        id: 'assistant-1',
        role: 'assistant',
        text: '',
        status: 'streaming',
      }),
      upsertHydratedMessage({
        conversationId: C,
        id: 'assistant-1',
        role: 'assistant',
        text: 'Hydrated final text',
        status: 'complete',
      }),
    ]);

    const hydrated = conv.messages.filter((message) => message.id === 'assistant-1');
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.role).toBe('ai');
    expect(hydrated[0]?.text).toBe('Hydrated final text');
    expect(hydrated[0]?.status).toBe('complete');
  });

  it('keeps existing hydrated text when a later hydration frame has empty text', () => {
    const conv = reduce([
      upsertHydratedMessage({
        conversationId: C,
        id: 'assistant-2',
        role: 'assistant',
        text: 'Existing hydrated text',
        status: 'complete',
      }),
      upsertHydratedMessage({
        conversationId: C,
        id: 'assistant-2',
        role: 'assistant',
        text: '',
        status: 'complete',
      }),
    ]);

    const hydrated = conv.messages.filter((message) => message.id === 'assistant-2');
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.text).toBe('Existing hydrated text');
  });

  it('merges hydrated rows with live llm.final frames by message id', () => {
    const conv = reduce([
      upsertHydratedMessage({
        conversationId: C,
        id: 'assistant-3',
        role: 'assistant',
        text: 'Hydrated text',
        status: 'complete',
      }),
      applyLLMFinal({
        conversationId: C,
        messageId: 'assistant-3',
        text: 'Live final text',
      }),
    ]);

    const hydrated = conv.messages.filter((message) => message.id === 'assistant-3');
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.text).toBe('Live final text');
    expect(hydrated[0]?.status).toBe('complete');
  });

  it('uses round 0 for hydrated timeline items and round 1+ for live items', () => {
    const conv = reduce([
      upsertTimelineItem({ conversationId: C, id: 'tool:h1', title: 'Hydrated tool', status: 'success', updatedAt: 5 }),
      queueUserPrompt({ conversationId: C, text: 'q1' }),
      upsertTimelineItem({ conversationId: C, id: 'tool:r1-1', title: 'Live tool', status: 'running', updatedAt: 10 }),
    ]);

    const r0Items = findWidgetItems(conv, 'timeline-widget-message-r0');
    expect(r0Items).toHaveLength(1);
    expect(r0Items[0]?.id).toBe('tool:h1');

    const r1Items = findWidgetItems(conv, 'timeline-widget-message-r1');
    expect(r1Items).toHaveLength(1);
    expect(r1Items[0]?.id).toBe('tool:r1-1');
  });

  it('does not create empty round widgets when no timeline events occur', () => {
    const conv = reduce([
      queueUserPrompt({ conversationId: C, text: 'hello' }),
      applyLLMStart({ conversationId: C, messageId: 'ai-1' }),
      applyLLMFinal({ conversationId: C, messageId: 'ai-1', text: 'Hi!' }),
    ]);

    const timelineMessages = conv.messages.filter((m) => (m.id ?? '').startsWith('timeline-widget-message-r'));
    expect(timelineMessages).toHaveLength(0);
  });

  it('deduplicates backend-echoed user messages by adopting server ID', () => {
    const conv = reduce([
      // User sends a message locally (gets id user-N)
      queueUserPrompt({ conversationId: C, text: 'hello' }),
      // Backend echoes back the same message with a UUID
      upsertHydratedMessage({
        conversationId: C,
        id: 'user-abc123-uuid',
        role: 'user',
        text: 'hello',
        status: 'complete',
      }),
    ]);

    // Should have exactly ONE user message with "hello", not two
    const userMessages = conv.messages.filter((m) => m.role === 'user' && m.text === 'hello');
    expect(userMessages).toHaveLength(1);
    // The ID should be updated to the server-assigned UUID
    expect(userMessages[0].id).toBe('user-abc123-uuid');
  });

  it('isolates separate conversations', () => {
    const C2 = 'test-conv-2';
    let state = chatReducer(undefined, { type: '__test__/init' });
    state = chatReducer(state, queueUserPrompt({ conversationId: C, text: 'hello from conv 1' }));
    state = chatReducer(state, queueUserPrompt({ conversationId: C2, text: 'hello from conv 2' }));

    const conv1 = state.conversations[C]!;
    const conv2 = state.conversations[C2]!;
    expect(conv1.messages.some((m) => m.text === 'hello from conv 1')).toBe(true);
    expect(conv1.messages.some((m) => m.text === 'hello from conv 2')).toBe(false);
    expect(conv2.messages.some((m) => m.text === 'hello from conv 2')).toBe(true);
    expect(conv2.messages.some((m) => m.text === 'hello from conv 1')).toBe(false);
  });
});
