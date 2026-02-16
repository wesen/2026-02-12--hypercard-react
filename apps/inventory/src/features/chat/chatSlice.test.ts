import { describe, expect, it } from 'vitest';
import {
  applyLLMDelta,
  applyLLMFinal,
  applyLLMStart,
  chatReducer,
  mergeSuggestions,
  queueUserPrompt,
  replaceSuggestions,
  setStreamError,
  upsertHydratedMessage,
  upsertCardPanelItem,
  upsertTimelineItem,
  upsertWidgetPanelItem,
} from './chatSlice';

function reduce(actions: Parameters<typeof chatReducer>[1][]) {
  let state = chatReducer(undefined, { type: '__test__/init' });
  for (const action of actions) {
    state = chatReducer(state, action);
  }
  return state;
}

function findWidgetItems(
  state: ReturnType<typeof chatReducer>,
  messageIdPrefix: string,
): Array<Record<string, unknown>> {
  const msg = state.messages.find((m) => (m.id ?? '').startsWith(messageIdPrefix));
  if (!msg) return [];
  const widgetBlock = msg.content?.find((entry) => entry.kind === 'widget');
  if (!widgetBlock || widgetBlock.kind !== 'widget') return [];
  const items = (widgetBlock.widget.props as Record<string, unknown>).items;
  return Array.isArray(items) ? (items as Array<Record<string, unknown>>) : [];
}

function countMessagesWithIdPrefix(
  state: ReturnType<typeof chatReducer>,
  prefix: string,
): number {
  return state.messages.filter((m) => (m.id ?? '').startsWith(prefix)).length;
}

describe('chatSlice', () => {
  it('streams llm.start -> llm.delta -> llm.final into a single ai message', () => {
    const state = reduce([
      queueUserPrompt({ text: 'hello' }),
      applyLLMStart({ messageId: 'm-1' }),
      applyLLMDelta({ messageId: 'm-1', cumulative: 'Hi there' }),
      applyLLMFinal({ messageId: 'm-1', text: 'Hi there!' }),
    ]);

    const ai = state.messages.find((message) => message.id === 'm-1');
    expect(ai).toBeTruthy();
    expect(ai?.role).toBe('ai');
    expect(ai?.text).toBe('Hi there!');
    expect(ai?.status).toBe('complete');
    expect(state.isStreaming).toBe(false);
  });

  it('prefers cumulative deltas to keep updates idempotent', () => {
    const state = reduce([
      queueUserPrompt({ text: 'status?' }),
      applyLLMStart({ messageId: 'm-2' }),
      applyLLMDelta({ messageId: 'm-2', cumulative: 'A' }),
      applyLLMDelta({ messageId: 'm-2', cumulative: 'AB' }),
    ]);

    const ai = state.messages.find((message) => message.id === 'm-2');
    expect(ai?.text).toBe('AB');
    expect(ai?.status).toBe('streaming');
    expect(state.isStreaming).toBe(true);
  });

  it('marks active streaming message as error when stream fails', () => {
    const state = reduce([
      queueUserPrompt({ text: 'ping' }),
      applyLLMStart({ messageId: 'm-3' }),
      setStreamError({ message: 'backend unavailable' }),
    ]);

    const ai = state.messages.find((message) => message.id === 'm-3');
    expect(ai?.status).toBe('error');
    expect(state.lastError).toBe('backend unavailable');
    expect(state.isStreaming).toBe(false);
  });

  it('strips trailing whitespace from ai final messages', () => {
    const state = reduce([
      queueUserPrompt({ text: 'trim?' }),
      applyLLMStart({ messageId: 'm-4' }),
      applyLLMFinal({ messageId: 'm-4', text: 'Line one   \nLine two\t\t\n\n' }),
    ]);

    const ai = state.messages.find((message) => message.id === 'm-4');
    expect(ai?.text).toBe('Line one\nLine two');
  });

  it('creates a single timeline widget message per round and upserts items in place', () => {
    // Round 0 (before any user prompt) — used for hydration
    const state = reduce([
      upsertTimelineItem({
        id: 'tool:abc',
        title: 'Tool lookup',
        status: 'running',
        detail: 'started',
        updatedAt: 10,
      }),
      upsertTimelineItem({
        id: 'tool:abc',
        title: 'Tool lookup',
        status: 'success',
        detail: 'done',
        updatedAt: 20,
      }),
    ]);

    const timelineMessages = state.messages.filter((m) => (m.id ?? '').startsWith('timeline-widget-message-r'));
    expect(timelineMessages).toHaveLength(1);
    const items = findWidgetItems(state, 'timeline-widget-message-r');
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('tool:abc');
    expect(items[0]?.status).toBe('success');
    expect(items[0]?.detail).toBe('done');
    expect(items[0]?.updatedAt).toBe(20);
  });

  it('creates separate timeline widgets for different rounds', () => {
    const state = reduce([
      // Round 1
      queueUserPrompt({ text: 'first question' }),
      upsertTimelineItem({
        id: 'tool:r1-1',
        title: 'Tool search',
        status: 'success',
        detail: 'done',
        updatedAt: 10,
      }),
      applyLLMStart({ messageId: 'ai-1' }),
      applyLLMFinal({ messageId: 'ai-1', text: 'Answer 1' }),
      // Round 2
      queueUserPrompt({ text: 'second question' }),
      upsertTimelineItem({
        id: 'tool:r2-1',
        title: 'Tool report',
        status: 'success',
        detail: 'done',
        updatedAt: 20,
      }),
    ]);

    // Should have two distinct timeline widget messages
    const timelineMessages = state.messages.filter((m) => (m.id ?? '').startsWith('timeline-widget-message-r'));
    expect(timelineMessages).toHaveLength(2);

    // Round 1 widget should have r1 items
    const r1Items = findWidgetItems(state, 'timeline-widget-message-r1');
    expect(r1Items).toHaveLength(1);
    expect(r1Items[0]?.id).toBe('tool:r1-1');

    // Round 2 widget should have r2 items
    const r2Items = findWidgetItems(state, 'timeline-widget-message-r2');
    expect(r2Items).toHaveLength(1);
    expect(r2Items[0]?.id).toBe('tool:r2-1');
  });

  it('preserves timeline metadata when later updates do not re-send it', () => {
    const state = reduce([
      upsertTimelineItem({
        id: 'card:c1',
        title: 'Detailed Inventory Summary',
        status: 'running',
        kind: 'card',
        template: 'reportViewer',
        artifactId: 'detailed_inventory_summary',
        updatedAt: 10,
      }),
      upsertTimelineItem({
        id: 'card:c1',
        title: 'Detailed Inventory Summary',
        status: 'success',
        detail: 'done',
        updatedAt: 20,
      }),
    ]);

    const items = findWidgetItems(state, 'timeline-widget-message-r');
    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe('card');
    expect(items[0]?.template).toBe('reportViewer');
    expect(items[0]?.artifactId).toBe('detailed_inventory_summary');
  });

  it('maintains separate card and widget panel messages per round', () => {
    const state = reduce([
      queueUserPrompt({ text: 'generate report' }),
      upsertCardPanelItem({
        id: 'card:r1',
        title: 'Detailed Inventory Summary',
        status: 'success',
        template: 'reportViewer',
        artifactId: 'detailed_inventory_summary',
        updatedAt: 50,
      }),
      upsertWidgetPanelItem({
        id: 'widget:r1',
        title: 'Inventory Summary Report',
        status: 'success',
        template: 'report',
        artifactId: 'inventory_summary',
        updatedAt: 60,
      }),
    ]);

    const cardItems = findWidgetItems(state, 'card-panel-widget-message-r');
    const widgetItems = findWidgetItems(state, 'widget-panel-widget-message-r');
    expect(cardItems[0]?.title).toBe('Detailed Inventory Summary');
    expect(cardItems[0]?.template).toBe('reportViewer');
    expect(widgetItems[0]?.title).toBe('Inventory Summary Report');
    expect(widgetItems[0]?.template).toBe('report');
  });

  it('fills suggestions incrementally while de-duplicating', () => {
    const state = reduce([
      queueUserPrompt({ text: 'help me decide' }),
      mergeSuggestions({ suggestions: ['Show current inventory status'] }),
      mergeSuggestions({ suggestions: ['What items are low stock?', 'show current inventory status'] }),
      replaceSuggestions({ suggestions: ['Summarize today sales', 'Show current inventory status'] }),
    ]);

    expect(state.suggestions).toEqual(['Summarize today sales', 'Show current inventory status']);
  });

  it('upserts hydrated messages by id without duplicating rows', () => {
    const state = reduce([
      upsertHydratedMessage({
        id: 'assistant-1',
        role: 'assistant',
        text: '',
        status: 'streaming',
      }),
      upsertHydratedMessage({
        id: 'assistant-1',
        role: 'assistant',
        text: 'Hydrated final text',
        status: 'complete',
      }),
    ]);

    const hydrated = state.messages.filter((message) => message.id === 'assistant-1');
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.role).toBe('ai');
    expect(hydrated[0]?.text).toBe('Hydrated final text');
    expect(hydrated[0]?.status).toBe('complete');
  });

  it('keeps existing hydrated text when a later hydration frame has empty text', () => {
    const state = reduce([
      upsertHydratedMessage({
        id: 'assistant-2',
        role: 'assistant',
        text: 'Existing hydrated text',
        status: 'complete',
      }),
      upsertHydratedMessage({
        id: 'assistant-2',
        role: 'assistant',
        text: '',
        status: 'complete',
      }),
    ]);

    const hydrated = state.messages.filter((message) => message.id === 'assistant-2');
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.text).toBe('Existing hydrated text');
  });

  it('merges hydrated rows with live llm.final frames by message id', () => {
    const state = reduce([
      upsertHydratedMessage({
        id: 'assistant-3',
        role: 'assistant',
        text: 'Hydrated text',
        status: 'complete',
      }),
      applyLLMFinal({
        messageId: 'assistant-3',
        text: 'Live final text',
      }),
    ]);

    const hydrated = state.messages.filter((message) => message.id === 'assistant-3');
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.text).toBe('Live final text');
    expect(hydrated[0]?.status).toBe('complete');
  });

  it('uses round 0 for hydrated timeline items and round 1+ for live items', () => {
    const state = reduce([
      // Hydration (round 0)
      upsertTimelineItem({ id: 'tool:h1', title: 'Hydrated tool', status: 'success', updatedAt: 5 }),
      // Round 1 (after first user prompt)
      queueUserPrompt({ text: 'q1' }),
      upsertTimelineItem({ id: 'tool:r1-1', title: 'Live tool', status: 'running', updatedAt: 10 }),
    ]);

    // Hydrated items in round 0 widget
    const r0Items = findWidgetItems(state, 'timeline-widget-message-r0');
    expect(r0Items).toHaveLength(1);
    expect(r0Items[0]?.id).toBe('tool:h1');

    // Live items in round 1 widget
    const r1Items = findWidgetItems(state, 'timeline-widget-message-r1');
    expect(r1Items).toHaveLength(1);
    expect(r1Items[0]?.id).toBe('tool:r1-1');
  });

  it('does not create empty round widgets when no timeline events occur', () => {
    const state = reduce([
      queueUserPrompt({ text: 'hello' }),
      applyLLMStart({ messageId: 'ai-1' }),
      applyLLMFinal({ messageId: 'ai-1', text: 'Hi!' }),
    ]);

    const timelineMessages = state.messages.filter((m) => (m.id ?? '').startsWith('timeline-widget-message-r'));
    expect(timelineMessages).toHaveLength(0);
  });
});
