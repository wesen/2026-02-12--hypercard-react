import { Act, type CardStackDefinition, defineCardStack, Ev, type FieldConfig, Sel, ui } from '@hypercard/engine';

const TASK_DETAIL_FIELDS: FieldConfig[] = [
  { id: 'id', label: 'ID', type: 'readonly' },
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'status', label: 'Status', type: 'select', options: ['todo', 'doing', 'done'] },
  { id: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
  { id: 'due', label: 'Due Date', type: 'text', placeholder: 'YYYY-MM-DD' },
];

const NEW_TASK_FIELDS: FieldConfig[] = [
  { id: 'title', label: 'Title', type: 'text', placeholder: 'What needs doing?', required: true },
  { id: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
  { id: 'due', label: 'Due Date', type: 'text', placeholder: 'YYYY-MM-DD (optional)' },
];

export const STACK: CardStackDefinition = defineCardStack({
  id: 'todo',
  name: 'My Tasks',
  icon: '✅',
  homeCard: 'home',
  stack: {
    state: {
      defaultPriority: 'medium',
    },
  },
  cards: {
    home: {
      id: 'home',
      type: 'menu',
      title: 'Home',
      icon: '🏠',
      ui: ui.menu({
        key: 'homeMenu',
        icon: '✅',
        labels: [{ value: 'My Tasks' }, { value: 'Get things done', style: 'muted' }],
        buttons: [
          { label: '📋 All Tasks', action: Act('nav.go', { card: 'browse' }) },
          { label: '🔥 In Progress', action: Act('nav.go', { card: 'inProgress' }) },
          { label: '✅ Completed', action: Act('nav.go', { card: 'completed' }) },
          { label: '➕ New Task', action: Act('nav.go', { card: 'newTask' }) },
        ],
      }),
    },

    browse: {
      id: 'browse',
      type: 'list',
      title: 'All Tasks',
      icon: '📋',
      ui: ui.list({
        key: 'browseTasksList',
        items: Sel('tasks.list', undefined, { from: 'shared' }),
        columns: Sel('tasks.columns', undefined, { from: 'shared' }),
        filters: [
          { field: 'status', type: 'select', options: ['All', 'todo', 'doing', 'done'] },
          { field: 'priority', type: 'select', options: ['All', 'low', 'medium', 'high'] },
          { field: '_search', type: 'text', placeholder: 'Search…' },
        ],
        searchFields: ['title'],
        toolbar: [{ label: '➕ New', action: Act('nav.go', { card: 'newTask' }) }],
        rowKey: 'id',
      }),
      bindings: {
        browseTasksList: {
          rowClick: Act('nav.go', { card: 'taskDetail', param: Ev('row.id') }),
        },
      },
    },

    inProgress: {
      id: 'inProgress',
      type: 'list',
      title: 'In Progress',
      icon: '🔥',
      ui: ui.list({
        key: 'inProgressList',
        items: Sel('tasks.inProgress', undefined, { from: 'shared' }),
        columns: Sel('tasks.columns', undefined, { from: 'shared' }),
        rowKey: 'id',
        emptyMessage: 'Nothing in progress — pick something up! 💪',
      }),
      bindings: {
        inProgressList: {
          rowClick: Act('nav.go', { card: 'taskDetail', param: Ev('row.id') }),
        },
      },
    },

    completed: {
      id: 'completed',
      type: 'list',
      title: 'Completed',
      icon: '✅',
      ui: ui.list({
        key: 'completedList',
        items: Sel('tasks.completed', undefined, { from: 'shared' }),
        columns: Sel('tasks.columns', undefined, { from: 'shared' }),
        rowKey: 'id',
        emptyMessage: 'No completed tasks yet. Get to work! 🚀',
      }),
      bindings: {
        completedList: {
          rowClick: Act('nav.go', { card: 'taskDetail', param: Ev('row.id') }),
        },
      },
    },

    taskDetail: {
      id: 'taskDetail',
      type: 'detail',
      title: 'Task Detail',
      icon: '📝',
      state: {
        initial: {
          edits: {},
        },
      },
      ui: ui.detail({
        key: 'taskDetailView',
        record: Sel('tasks.byParam', undefined, { from: 'shared' }),
        fields: TASK_DETAIL_FIELDS,
        edits: Sel('state.edits'),
        actions: [
          {
            label: '▶️ Start',
            action: Act('tasks.setStatus', {
              id: Sel('tasks.paramId', undefined, { from: 'shared' }),
              status: 'doing',
            }),
            variant: 'primary',
          },
          {
            label: '✅ Complete',
            action: Act('tasks.setStatus', { id: Sel('tasks.paramId', undefined, { from: 'shared' }), status: 'done' }),
            variant: 'primary',
          },
          {
            label: '✏️ Save',
            action: Act('tasks.save', {
              id: Sel('tasks.paramId', undefined, { from: 'shared' }),
              edits: Sel('state.edits'),
            }),
            variant: 'primary',
          },
          {
            label: '🗑 Delete',
            action: Act('tasks.delete', { id: Sel('tasks.paramId', undefined, { from: 'shared' }) }),
            variant: 'danger',
          },
        ],
      }),
      bindings: {
        taskDetailView: {
          change: Act('state.setField', {
            scope: 'card',
            path: 'edits',
            key: Ev('field'),
            value: Ev('value'),
          }),
        },
      },
    },

    newTask: {
      id: 'newTask',
      type: 'form',
      title: 'New Task',
      icon: '➕',
      state: {
        initial: {
          formValues: {
            title: '',
            priority: 'medium',
            due: '',
          },
          submitResult: '',
        },
      },
      ui: ui.form({
        key: 'newTaskForm',
        fields: NEW_TASK_FIELDS,
        values: Sel('state.formValues'),
        submitLabel: '➕ Create Task',
        submitResult: Sel('state.submitResult'),
      }),
      bindings: {
        newTaskForm: {
          change: Act('state.setField', {
            scope: 'card',
            path: 'formValues',
            key: Ev('field'),
            value: Ev('value'),
          }),
          submit: Act('tasks.create', { values: Ev('values') }, { to: 'shared' }),
        },
      },
    },
  },
});
