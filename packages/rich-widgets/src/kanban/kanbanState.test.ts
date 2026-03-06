import { describe, expect, it } from 'vitest';
import {
  createKanbanStateSeed,
  kanbanActions,
  kanbanReducer,
} from './kanbanState';

describe('kanbanState', () => {
  it('creates a normalized seed', () => {
    const state = createKanbanStateSeed({
      initialTasks: [
        {
          id: 'task-1',
          col: 'todo',
          title: 'Test task',
          desc: '',
          priority: 'medium',
          tags: ['docs'],
        },
      ],
      editingTask: { col: 'todo', title: 'Draft' },
      filterTag: 'docs',
      searchQuery: 'draft',
      collapsedCols: { done: true },
    });

    expect(state).toMatchObject({
      initialized: true,
      filterTag: 'docs',
      searchQuery: 'draft',
      collapsedCols: { done: true },
      editingTask: { col: 'todo', title: 'Draft' },
    });
    expect(state.tasks[0]?.tags).toEqual(['docs']);
  });

  it('upserts tasks and clears filters', () => {
    const seeded = createKanbanStateSeed({
      filterPriority: 'high',
      filterTag: 'bug',
      searchQuery: 'fix',
    });

    const updated = kanbanReducer(
      seeded,
      kanbanActions.upsertTask({
        id: 'task-x',
        col: 'progress',
        title: 'Investigate queue spike',
        desc: 'Look at worker pool saturation',
        priority: 'high',
        tags: ['bug', 'urgent'],
      }),
    );

    const cleared = kanbanReducer(updated, kanbanActions.clearFilters());

    expect(updated.tasks.find((task) => task.id === 'task-x')).toMatchObject({
      col: 'progress',
      priority: 'high',
    });
    expect(cleared).toMatchObject({
      filterTag: null,
      filterPriority: null,
      searchQuery: '',
    });
  });
});
