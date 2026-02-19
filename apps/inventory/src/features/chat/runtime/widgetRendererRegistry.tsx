import {
  HypercardCardPanelWidget,
  HypercardGeneratedWidgetPanel,
  HypercardTimelineWidget,
  registerInlineWidgetRenderer,
  timelineItemsFromInlineWidget,
  type InlineWidgetRenderContext,
  type TimelineWidgetItem,
} from '@hypercard/engine';

export interface InventoryInlineWidgetRenderContext extends InlineWidgetRenderContext {
  debug?: boolean;
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  onEditCard?: (item: TimelineWidgetItem) => void;
}

let inventoryWidgetRenderersBootstrapped = false;

function itemHandler(
  value: unknown,
): ((item: TimelineWidgetItem) => void) | undefined {
  return typeof value === 'function'
    ? (value as (item: TimelineWidgetItem) => void)
    : undefined;
}

function inventoryContext(context: InlineWidgetRenderContext): InventoryInlineWidgetRenderContext {
  return context as InventoryInlineWidgetRenderContext;
}

export function bootstrapInventoryInlineWidgetRenderers(): void {
  if (inventoryWidgetRenderersBootstrapped) {
    return;
  }
  inventoryWidgetRenderersBootstrapped = true;

  registerInlineWidgetRenderer('inventory.cards', (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = inventoryContext(context);
    return (
      <HypercardCardPanelWidget
        items={items}
        onOpenArtifact={itemHandler(ctx.onOpenArtifact)}
        onEditCard={itemHandler(ctx.onEditCard)}
        debug={ctx.debug === true}
      />
    );
  });

  registerInlineWidgetRenderer('inventory.widgets', (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = inventoryContext(context);
    return (
      <HypercardGeneratedWidgetPanel
        items={items}
        onOpenArtifact={itemHandler(ctx.onOpenArtifact)}
        debug={ctx.debug === true}
      />
    );
  });

  registerInlineWidgetRenderer('inventory.timeline', (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = inventoryContext(context);
    return <HypercardTimelineWidget items={items} debug={ctx.debug === true} />;
  });
}
