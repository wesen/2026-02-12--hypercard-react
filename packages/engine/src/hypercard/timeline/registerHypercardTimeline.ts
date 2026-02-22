import { registerTimelineRenderer } from '../../chat/renderers/rendererRegistry';
import { HypercardCardRenderer } from './hypercardCard';
import { HypercardWidgetRenderer } from './hypercardWidget';

export function registerHypercardTimelineModule() {
  registerTimelineRenderer('hypercard_widget', HypercardWidgetRenderer);
  registerTimelineRenderer('hypercard_card', HypercardCardRenderer);
  registerTimelineRenderer('hypercard.widget.v1', HypercardWidgetRenderer);
  registerTimelineRenderer('hypercard.card.v2', HypercardCardRenderer);
}
