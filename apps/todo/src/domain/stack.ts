import type { Stack } from '@hypercard/engine';
import type { TodoData, TodoSettings } from './types';

export const STACK: Stack<TodoData, TodoSettings> = {
  name: 'My Tasks',
  icon: '✅',
  homeCard: 'home',
  settings: {
    defaultPriority: 'medium',
  },
  data: {
    tasks: [
      { id: 't1', title: 'Buy groceries',       status: 'todo',  priority: 'high',   due: '2026-02-13' },
      { id: 't2', title: 'Write blog post',      status: 'doing', priority: 'medium', due: '2026-02-14' },
      { id: 't3', title: 'Fix leaky faucet',     status: 'todo',  priority: 'low' },
      { id: 't4', title: 'Read chapter 5',        status: 'done',  priority: 'medium', due: '2026-02-10' },
      { id: 't5', title: 'Call dentist',           status: 'todo',  priority: 'high',   due: '2026-02-12' },
      { id: 't6', title: 'Update resume',          status: 'doing', priority: 'high' },
      { id: 't7', title: 'Organize desk',          status: 'done',  priority: 'low' },
    ],
  },
  cards: {
    home: {
      type: 'menu',
      title: 'Home',
      icon: '🏠',
      fields: [
        { id: 'welcome', type: 'label', value: 'My Tasks' },
        { id: 'sub', type: 'label', value: 'Get things done', style: 'muted' },
      ],
      buttons: [
        { label: '📋 All Tasks',     action: { type: 'navigate', card: 'browse' } },
        { label: '🔥 In Progress',   action: { type: 'navigate', card: 'inProgress' } },
        { label: '✅ Completed',      action: { type: 'navigate', card: 'completed' } },
        { label: '➕ New Task',       action: { type: 'navigate', card: 'newTask' } },
      ],
    },
    browse: {
      type: 'list',
      title: 'All Tasks',
      icon: '📋',
      dataSource: 'tasks',
      columns: ['id', 'title', 'status', 'priority', 'due'],
      filters: [
        { field: 'status', type: 'select', options: ['All', 'todo', 'doing', 'done'] },
        { field: 'priority', type: 'select', options: ['All', 'low', 'medium', 'high'] },
        { field: '_search', type: 'text', placeholder: 'Search…' },
      ],
      rowAction: { type: 'navigate', card: 'taskDetail', param: 'id' },
      toolbar: [
        { label: '➕ New', action: { type: 'navigate', card: 'newTask' } },
      ],
    },
    inProgress: {
      type: 'list',
      title: 'In Progress',
      icon: '🔥',
      dataSource: 'tasks',
      columns: ['id', 'title', 'priority', 'due'],
      dataFilter: { field: 'status', op: '==', value: 'doing' },
      emptyMessage: 'Nothing in progress — pick something up! 💪',
      rowAction: { type: 'navigate', card: 'taskDetail', param: 'id' },
    },
    completed: {
      type: 'list',
      title: 'Completed',
      icon: '✅',
      dataSource: 'tasks',
      columns: ['id', 'title', 'priority', 'due'],
      dataFilter: { field: 'status', op: '==', value: 'done' },
      emptyMessage: 'No completed tasks yet. Get to work! 🚀',
      rowAction: { type: 'navigate', card: 'taskDetail', param: 'id' },
    },
    taskDetail: {
      type: 'detail',
      title: 'Task: {{title}}',
      icon: '📝',
      dataSource: 'tasks',
      keyField: 'id',
      fields: [
        { id: 'id', label: 'ID', type: 'readonly' },
        { id: 'title', label: 'Title', type: 'text' },
        { id: 'status', label: 'Status', type: 'select', options: ['todo', 'doing', 'done'] },
        { id: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
        { id: 'due', label: 'Due Date', type: 'text', placeholder: 'YYYY-MM-DD' },
      ],
      buttons: [
        { label: '▶️ Start',   action: { type: 'setStatus', status: 'doing' }, style: 'primary' },
        { label: '✅ Complete', action: { type: 'setStatus', status: 'done' }, style: 'primary' },
        { label: '✏️ Save',    action: { type: 'saveTask' }, style: 'primary' },
        { label: '🗑 Delete',  action: { type: 'deleteTask' }, style: 'danger' },
      ],
    },
    newTask: {
      type: 'form',
      title: 'New Task',
      icon: '➕',
      fields: [
        { id: 'title', label: 'Title', type: 'text', placeholder: 'What needs doing?', required: true },
        { id: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
        { id: 'due', label: 'Due Date', type: 'text', placeholder: 'YYYY-MM-DD (optional)' },
      ],
      submitAction: { type: 'createTask' },
      submitLabel: '➕ Create Task',
    },
  },
};
