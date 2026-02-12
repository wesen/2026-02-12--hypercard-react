import type { Task } from '../../domain/types';

export interface TasksStateSlice { tasks: { tasks: Task[] } }

export const selectTasks = (state: TasksStateSlice) => state.tasks.tasks;
