import type { ReactNode } from 'react';
import { validateUINode } from '../plugin-runtime/uiSchema';
import { PluginCardRenderer } from '../runtime-host/PluginCardRenderer';
import { KanbanV1Renderer, validateKanbanV1Node, type KanbanV1Node } from './kanbanV1Pack';
import type { UINode } from '../plugin-runtime/uiTypes';

export const DEFAULT_RUNTIME_SURFACE_TYPE_ID = 'ui.card.v1' as const;
export const KANBAN_V1_SURFACE_TYPE_ID = 'kanban.v1' as const;

export type RuntimeSurfaceTypeId = typeof DEFAULT_RUNTIME_SURFACE_TYPE_ID | typeof KANBAN_V1_SURFACE_TYPE_ID | string;
export type RuntimeSurfaceTree = UINode | KanbanV1Node;

export interface RuntimeSurfaceTypeRendererProps<TTree> {
  tree: TTree;
  onEvent: (handler: string, args?: unknown) => void;
}

export interface RuntimeSurfaceTypeDefinition<TTree> {
  packId: RuntimeSurfaceTypeId;
  validateTree: (value: unknown) => TTree;
  render: (props: RuntimeSurfaceTypeRendererProps<TTree>) => ReactNode;
}

const runtimeSurfaceTypes = new Map<string, RuntimeSurfaceTypeDefinition<unknown>>();

export function registerRuntimeSurfaceType<TTree>(definition: RuntimeSurfaceTypeDefinition<TTree>): void {
  runtimeSurfaceTypes.set(definition.packId, definition as RuntimeSurfaceTypeDefinition<unknown>);
}

export function normalizeRuntimeSurfaceTypeId(packId?: string | null): string {
  if (typeof packId !== 'string') {
    return DEFAULT_RUNTIME_SURFACE_TYPE_ID;
  }

  const trimmed = packId.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_RUNTIME_SURFACE_TYPE_ID;
}

export function getRuntimeSurfaceTypeOrThrow(packId?: string | null): RuntimeSurfaceTypeDefinition<unknown> {
  const normalized = normalizeRuntimeSurfaceTypeId(packId);
  const surfaceType = runtimeSurfaceTypes.get(normalized);
  if (!surfaceType) {
    throw new Error(`Unknown runtime surface type: ${normalized}`);
  }
  return surfaceType;
}

export function listRuntimeSurfaceTypes(): string[] {
  return Array.from(runtimeSurfaceTypes.keys()).sort();
}

export function validateRuntimeSurfaceTree<TTree = RuntimeSurfaceTree>(packId: string | undefined, value: unknown): TTree {
  return getRuntimeSurfaceTypeOrThrow(packId).validateTree(value) as TTree;
}

export function renderRuntimeSurfaceTree(packId: string | undefined, value: unknown, onEvent: (handler: string, args?: unknown) => void): ReactNode {
  const surfaceType = getRuntimeSurfaceTypeOrThrow(packId);
  const tree = surfaceType.validateTree(value);
  return surfaceType.render({ tree, onEvent });
}

registerRuntimeSurfaceType<UINode>({
  packId: DEFAULT_RUNTIME_SURFACE_TYPE_ID,
  validateTree: validateUINode,
  render: ({ tree, onEvent }) => <PluginCardRenderer tree={tree} onEvent={onEvent} />,
});

registerRuntimeSurfaceType<KanbanV1Node>({
  packId: KANBAN_V1_SURFACE_TYPE_ID,
  validateTree: validateKanbanV1Node,
  render: ({ tree, onEvent }) => <KanbanV1Renderer tree={tree} onEvent={onEvent} />,
});
