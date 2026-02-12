import {
  createDomainActionHandler,
  defineActionRegistry,
  goBack,
} from '@hypercard/engine';
import { setStatus, saveTask, deleteTask, createTask } from '../features/tasks/tasksSlice';
import type { Task } from '../domain/types';

const todoActionRegistry = defineActionRegistry({
  setStatus: {
    actionCreator: setStatus,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return { id: String(a.id ?? ''), status: a.status as Task['status'] };
    },
    toast: (payload) => `Task -> ${payload.status}`,
  },
  saveTask: {
    actionCreator: saveTask,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return { id: String(a.id ?? ''), edits: (a.edits ?? {}) as Partial<Task> };
    },
    toast: 'Task saved',
  },
  deleteTask: {
    actionCreator: deleteTask,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return { id: String(a.id ?? '') };
    },
    effect: ({ dispatch }) => {
      dispatch(goBack());
    },
    toast: 'Task deleted',
  },
  createTask: {
    actionCreator: createTask,
    mapPayload: (action) => {
      const a = action as Record<string, unknown>;
      return (a.values ?? {}) as { title: string; priority?: string; due?: string };
    },
    toast: 'Task created! ✅',
  },
});

export const todoActionHandler = createDomainActionHandler(todoActionRegistry);
