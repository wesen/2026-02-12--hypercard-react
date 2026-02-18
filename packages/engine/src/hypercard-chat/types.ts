export type TimelineItemStatus = 'running' | 'success' | 'error' | 'info';

export interface TimelineWidgetItem {
  id: string;
  title: string;
  status: TimelineItemStatus;
  detail?: string;
  kind?: 'tool' | 'widget' | 'card' | 'timeline';
  template?: string;
  artifactId?: string;
  updatedAt: number;
  rawData?: Record<string, unknown>;
}

export interface SemEventEnvelope {
  sem?: boolean;
  event?: {
    type?: string;
    id?: string;
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    seq?: number | string;
    stream_id?: string;
  };
}

export interface TimelineItemUpdate {
  id: string;
  title: string;
  status: TimelineItemStatus;
  detail?: string;
  kind?: 'tool' | 'widget' | 'card' | 'timeline';
  template?: string;
  artifactId?: string;
  rawData?: Record<string, unknown>;
}
