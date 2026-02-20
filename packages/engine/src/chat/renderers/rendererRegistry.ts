import { GenericRenderer } from './builtin/GenericRenderer';
import { LogRenderer } from './builtin/LogRenderer';
import { MessageRenderer } from './builtin/MessageRenderer';
import { StatusRenderer } from './builtin/StatusRenderer';
import { ToolCallRenderer } from './builtin/ToolCallRenderer';
import { ToolResultRenderer } from './builtin/ToolResultRenderer';
import type { ChatWidgetRenderers, TimelineRenderer } from './types';

const builtinRenderers: Record<string, TimelineRenderer> = {
  message: MessageRenderer,
  tool_call: ToolCallRenderer,
  tool_result: ToolResultRenderer,
  status: StatusRenderer,
  log: LogRenderer,
};

const extensionRenderers = new Map<string, TimelineRenderer>();

export function registerTimelineRenderer(kind: string, renderer: TimelineRenderer) {
  const key = String(kind || '').trim();
  if (!key) return;
  extensionRenderers.set(key, renderer);
}

export function unregisterTimelineRenderer(kind: string) {
  const key = String(kind || '').trim();
  if (!key) return;
  extensionRenderers.delete(key);
}

export function clearRegisteredTimelineRenderers() {
  extensionRenderers.clear();
}

export function registerDefaultTimelineRenderers() {
  for (const [kind, renderer] of Object.entries(builtinRenderers)) {
    registerTimelineRenderer(kind, renderer);
  }
}

export function resolveTimelineRenderers(overrides?: Partial<ChatWidgetRenderers>): ChatWidgetRenderers {
  const resolved: ChatWidgetRenderers = {
    ...builtinRenderers,
    ...Object.fromEntries(extensionRenderers.entries()),
    ...(overrides ?? {}),
    default: GenericRenderer,
  };

  if (overrides?.default) {
    resolved.default = overrides.default;
  }

  return resolved;
}
