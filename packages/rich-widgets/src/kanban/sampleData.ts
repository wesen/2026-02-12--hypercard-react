import type { Task, Column } from './types';

export const INITIAL_COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', icon: '📥' },
  { id: 'todo', title: 'To Do', icon: '📋' },
  { id: 'progress', title: 'In Progress', icon: '⚡' },
  { id: 'review', title: 'Review', icon: '👀' },
  { id: 'done', title: 'Done', icon: '✅' },
];

export const INITIAL_TASKS: Task[] = [
  { id: 'task-1', col: 'backlog', title: 'Research competitor pricing', tags: ['feature'], priority: 'low', desc: 'Compile a comparison sheet' },
  { id: 'task-2', col: 'backlog', title: 'Write API documentation', tags: ['docs'], priority: 'medium', desc: 'Cover all endpoints' },
  { id: 'task-3', col: 'todo', title: 'Fix login redirect loop', tags: ['bug', 'urgent'], priority: 'high', desc: 'Users stuck on OAuth callback' },
  { id: 'task-4', col: 'todo', title: 'Design onboarding flow', tags: ['design'], priority: 'medium', desc: '3-step wizard mockup' },
  { id: 'task-5', col: 'todo', title: 'Add dark mode support', tags: ['feature', 'design'], priority: 'low', desc: '' },
  { id: 'task-6', col: 'progress', title: 'Implement search indexing', tags: ['feature'], priority: 'high', desc: 'Elasticsearch integration' },
  { id: 'task-7', col: 'progress', title: 'Fix memory leak in worker', tags: ['bug'], priority: 'high', desc: 'OOM after 24h uptime' },
  { id: 'task-8', col: 'review', title: 'Update privacy policy', tags: ['docs'], priority: 'medium', desc: 'Legal team reviewed draft' },
  { id: 'task-9', col: 'done', title: 'Set up CI/CD pipeline', tags: ['feature'], priority: 'medium', desc: 'GitHub Actions + deploy' },
  { id: 'task-10', col: 'done', title: 'Fix date picker timezone bug', tags: ['bug'], priority: 'low', desc: '' },
];
