import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Task } from '../../domain/types';
import { STACK } from '../../domain/stack';

interface TasksState { tasks: Task[] }

const initialState: TasksState = {
  tasks: JSON.parse(JSON.stringify(STACK.data.tasks)),
};

let nextId = initialState.tasks.length + 1;

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<{ id: string; status: Task['status'] }>) {
      const task = state.tasks.find((t) => t.id === action.payload.id);
      if (task) task.status = action.payload.status;
    },
    saveTask(state, action: PayloadAction<{ id: string; edits: Partial<Task> }>) {
      const idx = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.tasks[idx] = { ...state.tasks[idx], ...action.payload.edits };
    },
    deleteTask(state, action: PayloadAction<{ id: string }>) {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload.id);
    },
    createTask(state, action: PayloadAction<{ title: string; priority?: string; due?: string }>) {
      state.tasks.push({
        id: `t${nextId++}`,
        title: action.payload.title,
        status: 'todo',
        priority: (action.payload.priority as Task['priority']) ?? 'medium',
        due: action.payload.due || undefined,
      });
    },
  },
});

export const { setStatus, saveTask, deleteTask, createTask } = tasksSlice.actions;
export const tasksReducer = tasksSlice.reducer;
