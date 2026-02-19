import type { TimelineWidgetItem } from '../types';
import { HypercardCardPanelWidget, HypercardGeneratedWidgetPanel } from './HypercardArtifactPanels';
import { HypercardTimelineWidget, timelineItemsFromInlineWidget } from './HypercardTimelinePanel';
import {
  type InlineWidgetRenderContext,
  registerInlineWidgetRenderer,
  unregisterInlineWidgetRenderer,
} from './inlineWidgetRegistry';

export interface HypercardWidgetPackRenderContext extends InlineWidgetRenderContext {
  debug?: boolean;
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  onEditCard?: (item: TimelineWidgetItem) => void;
}

export interface RegisterHypercardWidgetPackOptions {
  namespace?: string;
}

export interface HypercardWidgetPackRegistration {
  namespace: string;
  unregister: () => void;
}

const registrationCounts = new Map<string, number>();

function asItemHandler(value: unknown): ((item: TimelineWidgetItem) => void) | undefined {
  return typeof value === 'function' ? (value as (item: TimelineWidgetItem) => void) : undefined;
}

function asContext(context: InlineWidgetRenderContext): HypercardWidgetPackRenderContext {
  return context as HypercardWidgetPackRenderContext;
}

function normalizeNamespace(namespace: string | undefined): string {
  const key = String(namespace ?? '').trim();
  return key.length > 0 ? key : 'hypercard';
}

function registerRenderersForNamespace(namespace: string): void {
  registerInlineWidgetRenderer(`${namespace}.cards`, (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = asContext(context);
    return (
      <HypercardCardPanelWidget
        items={items}
        onOpenArtifact={asItemHandler(ctx.onOpenArtifact)}
        onEditCard={asItemHandler(ctx.onEditCard)}
        debug={ctx.debug === true}
      />
    );
  });

  registerInlineWidgetRenderer(`${namespace}.widgets`, (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = asContext(context);
    return (
      <HypercardGeneratedWidgetPanel
        items={items}
        onOpenArtifact={asItemHandler(ctx.onOpenArtifact)}
        debug={ctx.debug === true}
      />
    );
  });

  registerInlineWidgetRenderer(`${namespace}.timeline`, (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = asContext(context);
    return <HypercardTimelineWidget items={items} debug={ctx.debug === true} />;
  });
}

function unregisterRenderersForNamespace(namespace: string): void {
  unregisterInlineWidgetRenderer(`${namespace}.cards`);
  unregisterInlineWidgetRenderer(`${namespace}.widgets`);
  unregisterInlineWidgetRenderer(`${namespace}.timeline`);
}

export function unregisterHypercardWidgetPack(options: RegisterHypercardWidgetPackOptions = {}): void {
  const namespace = normalizeNamespace(options.namespace);
  unregisterRenderersForNamespace(namespace);
  registrationCounts.delete(namespace);
}

export function registerHypercardWidgetPack(
  options: RegisterHypercardWidgetPackOptions = {},
): HypercardWidgetPackRegistration {
  const namespace = normalizeNamespace(options.namespace);
  const count = registrationCounts.get(namespace) ?? 0;

  if (count === 0) {
    registerRenderersForNamespace(namespace);
  }
  registrationCounts.set(namespace, count + 1);

  let unregistered = false;
  return {
    namespace,
    unregister: () => {
      if (unregistered) {
        return;
      }
      unregistered = true;

      const currentCount = registrationCounts.get(namespace) ?? 0;
      if (currentCount <= 1) {
        unregisterRenderersForNamespace(namespace);
        registrationCounts.delete(namespace);
        return;
      }

      registrationCounts.set(namespace, currentCount - 1);
    },
  };
}
