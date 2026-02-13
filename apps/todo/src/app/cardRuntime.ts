import type { SharedActionRegistry, SharedSelectorRegistry } from '@hypercard/engine';
import { taskColumns } from '../domain/columnConfigs';
import type { Task } from '../domain/types';
import { selectTasks, type TasksStateSlice } from '../features/tasks/selectors';
import { createTask, deleteTask, saveTask, setStatus } from '../features/tasks/tasksSlice';

export type TodoRootState = TasksStateSlice;

export const todoSharedSelectors: SharedSelectorRegistry<TodoRootState> = {
  'tasks.list': (state) => selectTasks(state),
  'tasks.columns': () => taskColumns(),
  'tasks.inProgress': (state) => selectTasks(state).filter((t) => t.status === 'doing'),
  'tasks.completed': (state) => selectTasks(state).filter((t) => t.status === 'done'),
  'tasks.paramId': (_state, _args, ctx) => String(ctx.params.param ?? ''),
  'tasks.byParam': (state, _args, ctx) => {
    const id = String(ctx.params.param ?? '');
    return selectTasks(state).find((t) => t.id === id) ?? null;
  },
};

export const todoSharedActions: SharedActionRegistry<TodoRootState> = {
  'tasks.setStatus': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(
      setStatus({
        id: String(data.id ?? ''),
        status: (data.status as Task['status']) ?? 'todo',
      }),
    );
  },

  'tasks.save': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(
      saveTask({
        id: String(data.id ?? ''),
        edits: (data.edits ?? {}) as Partial<Task>,
      }),
    );
    ctx.patchScopedState('card', { edits: {} });
  },

  'tasks.delete': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(deleteTask({ id: String(data.id ?? '') }));
    ctx.nav.back();
  },

  'tasks.create': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const title = String(values.title ?? '').trim();
    if (!title) {
      ctx.patchScopedState('card', { submitResult: '❌ Title is required' });
      return;
    }

    ctx.dispatch(
      createTask({
        title,
        priority: String(values.priority ?? 'medium'),
        due: values.due ? String(values.due) : undefined,
      }),
    );

    ctx.patchScopedState('card', {
      submitResult: '✅ Task created',
      formValues: {
        title: '',
        priority: 'medium',
        due: '',
      },
    });
  },
};
