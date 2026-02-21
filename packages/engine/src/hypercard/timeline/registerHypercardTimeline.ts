import { registerTimelineRenderer } from '../../chat/renderers/rendererRegistry';
import { registerSem } from '../../chat/sem/semRegistry';
import { stringArray } from '../../chat/sem/semHelpers';
import { timelineSlice } from '../../chat/state/timelineSlice';
import { ASSISTANT_SUGGESTIONS_ENTITY_ID } from '../../chat/state/suggestions';
import { HypercardCardRenderer, registerHypercardCardSemHandlers } from './hypercardCard';
import { HypercardWidgetRenderer, registerHypercardWidgetSemHandlers } from './hypercardWidget';

function suggestionVersionFromSeq(seq: unknown): number | undefined {
  if (typeof seq !== 'number' || !Number.isFinite(seq) || seq <= 0) {
    return undefined;
  }
  return seq;
}

function registerHypercardSuggestionSemHandlers() {
  registerSem('hypercard.suggestions.start', (ev, ctx) => {
    const suggestions = stringArray((ev.data as Record<string, unknown>)?.suggestions);
    if (suggestions.length === 0) return;
    ctx.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: ctx.convId,
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        source: 'assistant',
        suggestions: suggestions,
        replace: false,
        version: suggestionVersionFromSeq(ev.seq),
      })
    );
  });

  registerSem('hypercard.suggestions.update', (ev, ctx) => {
    const suggestions = stringArray((ev.data as Record<string, unknown>)?.suggestions);
    if (suggestions.length === 0) return;
    ctx.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: ctx.convId,
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        source: 'assistant',
        suggestions: suggestions,
        replace: false,
        version: suggestionVersionFromSeq(ev.seq),
      })
    );
  });

  registerSem('hypercard.suggestions.v1', (ev, ctx) => {
    const suggestions = stringArray((ev.data as Record<string, unknown>)?.suggestions);
    if (suggestions.length === 0) return;
    ctx.dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId: ctx.convId,
        entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        source: 'assistant',
        suggestions: suggestions,
        replace: true,
        version: suggestionVersionFromSeq(ev.seq),
      })
    );
  });
}

export function registerHypercardTimelineModule() {
  registerHypercardWidgetSemHandlers();
  registerHypercardCardSemHandlers();
  registerHypercardSuggestionSemHandlers();

  registerTimelineRenderer('hypercard_widget', HypercardWidgetRenderer);
  registerTimelineRenderer('hypercard_card', HypercardCardRenderer);
  registerTimelineRenderer('hypercard.widget.v1', HypercardWidgetRenderer);
  registerTimelineRenderer('hypercard.card.v2', HypercardCardRenderer);
}
