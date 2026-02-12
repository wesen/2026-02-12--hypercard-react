export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  due?: string;
  [key: string]: unknown;
}

export interface TodoSettings {
  defaultPriority: string;
  [key: string]: unknown;
}

export interface TodoData {
  tasks: Task[];
  [tableName: string]: Record<string, unknown>[];
}
