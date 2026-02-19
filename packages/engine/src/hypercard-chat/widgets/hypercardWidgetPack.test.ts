import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerHypercardWidgetPack, unregisterHypercardWidgetPack } from './hypercardWidgetPack';
import {
  clearRegisteredInlineWidgetRenderers,
  renderInlineWidget,
  resolveInlineWidgetRenderer,
} from './inlineWidgetRegistry';

describe('registerHypercardWidgetPack', () => {
  beforeEach(() => {
    clearRegisteredInlineWidgetRenderers();
  });

  it('registers timeline/cards/widgets renderers for a namespace', () => {
    const registration = registerHypercardWidgetPack({ namespace: 'inventory' });
    expect(resolveInlineWidgetRenderer('inventory.timeline')).toBeDefined();
    expect(resolveInlineWidgetRenderer('inventory.cards')).toBeDefined();
    expect(resolveInlineWidgetRenderer('inventory.widgets')).toBeDefined();
    registration.unregister();
  });

  it('keeps renderers active until the final registration is unregistered', () => {
    const first = registerHypercardWidgetPack({ namespace: 'inventory' });
    const second = registerHypercardWidgetPack({ namespace: 'inventory' });

    first.unregister();
    expect(resolveInlineWidgetRenderer('inventory.timeline')).toBeDefined();

    second.unregister();
    expect(resolveInlineWidgetRenderer('inventory.timeline')).toBeUndefined();
  });

  it('supports explicit namespace-level unregistration', () => {
    registerHypercardWidgetPack({ namespace: 'inventory' });
    unregisterHypercardWidgetPack({ namespace: 'inventory' });
    expect(resolveInlineWidgetRenderer('inventory.timeline')).toBeUndefined();
  });

  it('renders a card panel with host callbacks from context', () => {
    const registration = registerHypercardWidgetPack({ namespace: 'inventory' });
    const onOpenArtifact = vi.fn();
    const onEditCard = vi.fn();
    const rendered = renderInlineWidget(
      {
        id: 'w-card',
        type: 'inventory.cards',
        props: {
          items: [
            {
              id: 'card:restock',
              title: 'Restock',
              status: 'success',
              kind: 'card',
              updatedAt: 1,
              artifactId: 'artifact-1',
            },
          ],
        },
      },
      { onOpenArtifact, onEditCard, debug: true },
    );
    expect(rendered).toBeTruthy();
    registration.unregister();
  });
});
