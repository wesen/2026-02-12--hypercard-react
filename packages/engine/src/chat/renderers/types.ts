import type React from 'react';

export interface RenderEntity {
  id: string;
  kind: string;
  props: Record<string, unknown>;
  createdAt: number;
  updatedAt?: number;
}

export type TimelineRenderer = React.ComponentType<{ e: RenderEntity }>;

export type ChatWidgetRenderers = Record<string, TimelineRenderer> & {
  default: TimelineRenderer;
};
