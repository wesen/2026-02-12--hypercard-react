import type { UINode } from '../plugin-runtime/uiTypes';
import { validateUINode } from '../plugin-runtime/uiSchema';
import { PluginCardRenderer } from '../runtime-host/PluginCardRenderer';
import { KanbanV1Renderer, type KanbanV1Node, validateKanbanV1Node } from './kanbanV1Pack';
import {
  DEFAULT_RUNTIME_SURFACE_TYPE_ID,
  KANBAN_V1_SURFACE_TYPE_ID,
  registerRuntimeSurfaceType,
  type RuntimeSurfaceTypeDefinition,
} from './runtimeSurfaceTypeRegistry';

export const UI_CARD_V1_SURFACE_TYPE: RuntimeSurfaceTypeDefinition<UINode> = {
  packId: DEFAULT_RUNTIME_SURFACE_TYPE_ID,
  validateTree: validateUINode,
  render: ({ tree, onEvent }) => <PluginCardRenderer tree={tree} onEvent={onEvent} />,
};

export const KANBAN_V1_SURFACE_TYPE: RuntimeSurfaceTypeDefinition<KanbanV1Node> = {
  packId: KANBAN_V1_SURFACE_TYPE_ID,
  validateTree: validateKanbanV1Node,
  render: ({ tree, onEvent }) => <KanbanV1Renderer tree={tree} onEvent={onEvent} />,
};

export function registerBuiltInRuntimeSurfaceTypes(): void {
  registerRuntimeSurfaceType(UI_CARD_V1_SURFACE_TYPE);
  registerRuntimeSurfaceType(KANBAN_V1_SURFACE_TYPE);
}
