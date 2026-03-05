export type Priority = 'high' | 'medium' | 'low';
export type TagId = 'bug' | 'feature' | 'urgent' | 'design' | 'docs';

export interface Task {
  id: string;
  col: string;
  title: string;
  tags: TagId[];
  priority: Priority;
  desc: string;
}

export interface Column {
  id: string;
  title: string;
  icon: string;
}

export const TAG_LABELS: Record<TagId, string> = {
  bug: 'Bug',
  feature: 'Feature',
  urgent: 'Urgent',
  design: 'Design',
  docs: 'Docs',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '▲ High',
  medium: '● Medium',
  low: '▽ Low',
};

export const ALL_TAGS: TagId[] = ['bug', 'feature', 'urgent', 'design', 'docs'];
export const ALL_PRIORITIES: Priority[] = ['high', 'medium', 'low'];
