import { beforeEach, describe, expect, it } from 'vitest';
import type { InlineWidget } from '../../components/widgets';
import {
  clearRegisteredInlineWidgetRenderers,
  registerInlineWidgetRenderer,
  renderInlineWidget,
  resolveInlineWidgetRenderer,
  unregisterInlineWidgetRenderer,
} from './inlineWidgetRegistry';

function sampleWidget(type = 'inventory.timeline'): InlineWidget {
  return {
    id: 'w-1',
    type,
    props: { items: [] },
  };
}

describe('inlineWidgetRegistry', () => {
  beforeEach(() => {
    clearRegisteredInlineWidgetRenderers();
  });

  it('registers and resolves a renderer by widget type', () => {
    registerInlineWidgetRenderer('inventory.timeline', (widget) => `rendered:${widget.id}`);
    const renderer = resolveInlineWidgetRenderer('inventory.timeline');
    expect(renderer).toBeDefined();
    expect(renderInlineWidget(sampleWidget(), {})).toBe('rendered:w-1');
  });

  it('supports temporary overrides', () => {
    registerInlineWidgetRenderer('inventory.timeline', () => 'base');
    const rendered = renderInlineWidget(sampleWidget(), {}, {
      'inventory.timeline': () => 'override',
    });
    expect(rendered).toBe('override');
  });

  it('returns null when no renderer is registered', () => {
    expect(renderInlineWidget(sampleWidget('missing.widget'))).toBeNull();
  });

  it('can unregister renderers', () => {
    registerInlineWidgetRenderer('inventory.timeline', () => 'base');
    unregisterInlineWidgetRenderer('inventory.timeline');
    expect(resolveInlineWidgetRenderer('inventory.timeline')).toBeUndefined();
  });
});
