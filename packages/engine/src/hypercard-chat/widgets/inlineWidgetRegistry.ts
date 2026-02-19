import type { ReactNode } from 'react';
import type { InlineWidget } from '../../components/widgets';

export type InlineWidgetRenderContext = Record<string, unknown>;
export type InlineWidgetRenderer = (
  widget: InlineWidget,
  context: InlineWidgetRenderContext,
) => ReactNode;

export type InlineWidgetRendererOverrides = Record<string, InlineWidgetRenderer>;

const extensionRenderers = new Map<string, InlineWidgetRenderer>();

export function registerInlineWidgetRenderer(type: string, renderer: InlineWidgetRenderer): void {
  const key = String(type || '').trim();
  if (!key) return;
  extensionRenderers.set(key, renderer);
}

export function unregisterInlineWidgetRenderer(type: string): void {
  const key = String(type || '').trim();
  if (!key) return;
  extensionRenderers.delete(key);
}

export function clearRegisteredInlineWidgetRenderers(): void {
  extensionRenderers.clear();
}

export function resolveInlineWidgetRenderer(
  type: string,
  overrides?: InlineWidgetRendererOverrides,
): InlineWidgetRenderer | undefined {
  const key = String(type || '').trim();
  if (!key) return undefined;
  return overrides?.[key] ?? extensionRenderers.get(key);
}

export function renderInlineWidget(
  widget: InlineWidget,
  context: InlineWidgetRenderContext = {},
  overrides?: InlineWidgetRendererOverrides,
): ReactNode {
  const renderer = resolveInlineWidgetRenderer(widget.type, overrides);
  if (!renderer) {
    return null;
  }
  return renderer(widget, context);
}
