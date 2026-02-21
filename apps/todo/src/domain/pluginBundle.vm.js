// @ts-check
/// <reference path="./pluginBundle.authoring.d.ts" />
defineStackBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value);
  }

  function domains(globalState) {
    return asRecord(asRecord(globalState).domains);
  }

  function selectTasks(globalState) {
    return asArray(asRecord(domains(globalState).tasks).tasks);
  }

  function navParam(globalState) {
    const param = asRecord(asRecord(globalState).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function statusLabel(status) {
    const v = toText(status);
    if (v === 'done') return '✅ done';
    if (v === 'doing') return '🔥 doing';
    return '◻️ todo';
  }

  function priorityLabel(priority) {
    const v = toText(priority);
    if (v === 'high') return '🔴 high';
    if (v === 'medium') return '🟡 medium';
    return '🟢 low';
  }

  function taskRows(items) {
    return items.map((task) => {
      const row = asRecord(task);
      return [
        toText(row.id),
        toText(row.title),
        statusLabel(row.status),
        priorityLabel(row.priority),
        toText(row.due, '—'),
      ];
    });
  }

  function findTask(globalState, id) {
    const target = toText(id).toLowerCase();
    return selectTasks(globalState).find((task) => toText(asRecord(task).id).toLowerCase() === target) || null;
  }

  function withCardState(cardState) {
    const state = asRecord(cardState);
    return {
      edits: asRecord(state.edits),
      form: asRecord(state.form),
      submitResult: toText(state.submitResult),
    };
  }

  function renderTaskList(title, items, emptyMessage) {
    const quickOpen = items.slice(0, 10).map((task) => {
      const row = asRecord(task);
      const id = toText(row.id);
      return ui.button('Open ' + id, { onClick: { handler: 'openTask', args: { id } } });
    });

    return ui.panel([
      ui.text(title),
      ui.table(taskRows(items), { headers: ['ID', 'Title', 'Status', 'Priority', 'Due'] }),
      items.length === 0 ? ui.badge(emptyMessage) : ui.text('Quick open:'),
      ui.column(quickOpen),
      ui.row([
        ui.button('➕ New Task', { onClick: { handler: 'go', args: { cardId: 'newTask' } } }),
        ui.button('🏠 Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
      ]),
    ]);
  }

  return {
    id: 'todo',
    title: 'My Tasks',
    initialSessionState: {
      defaultPriority: 'medium',
    },
    initialCardState: {
      taskDetail: { edits: {} },
      newTask: { form: { title: '', priority: 'medium', due: '' }, submitResult: '' },
    },
    cards: {
      home: {
        render() {
          return ui.panel([
            ui.text('My Tasks'),
            ui.text('Plugin DSL runtime'),
            ui.button('📋 All Tasks', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
            ui.button('🔥 In Progress', { onClick: { handler: 'go', args: { cardId: 'inProgress' } } }),
            ui.button('✅ Completed', { onClick: { handler: 'go', args: { cardId: 'completed' } } }),
            ui.button('➕ New Task', { onClick: { handler: 'go', args: { cardId: 'newTask' } } }),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', { cardId: toText(asRecord(args).cardId, 'home') });
          },
        },
      },

      browse: {
        render({ globalState }) {
          return renderTaskList('All Tasks', selectTasks(globalState), 'No tasks yet.');
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', { cardId: toText(asRecord(args).cardId, 'home') });
          },
          openTask({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', {
              cardId: 'taskDetail',
              param: toText(asRecord(args).id),
            });
          },
        },
      },

      inProgress: {
        render({ globalState }) {
          const tasks = selectTasks(globalState).filter((task) => toText(asRecord(task).status) === 'doing');
          return renderTaskList('In Progress', tasks, 'Nothing in progress — pick something up! 💪');
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', { cardId: toText(asRecord(args).cardId, 'home') });
          },
          openTask({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', {
              cardId: 'taskDetail',
              param: toText(asRecord(args).id),
            });
          },
        },
      },

      completed: {
        render({ globalState }) {
          const tasks = selectTasks(globalState).filter((task) => toText(asRecord(task).status) === 'done');
          return renderTaskList('Completed', tasks, 'No completed tasks yet. Get to work! 🚀');
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', { cardId: toText(asRecord(args).cardId, 'home') });
          },
          openTask({ dispatchSystemCommand }, args) {
            dispatchSystemCommand('nav.go', {
              cardId: 'taskDetail',
              param: toText(asRecord(args).id),
            });
          },
        },
      },

      taskDetail: {
        render({ cardState, globalState }) {
          const id = navParam(globalState);
          const task = findTask(globalState, id);
          if (!task) {
            return ui.panel([
              ui.text('Task not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const state = withCardState(cardState);
          const current = { ...asRecord(task), ...state.edits };

          return ui.panel([
            ui.text('Task Detail: ' + toText(current.id)),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(current.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(current.status), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Priority:'),
              ui.input(toText(current.priority), { onChange: { handler: 'change', args: { field: 'priority' } } }),
            ]),
            ui.row([
              ui.text('Due:'),
              ui.input(toText(current.due), { onChange: { handler: 'change', args: { field: 'due' } } }),
            ]),
            ui.row([
              ui.button('▶️ Start', { onClick: { handler: 'setStatus', args: { status: 'doing' } } }),
              ui.button('✅ Complete', { onClick: { handler: 'setStatus', args: { status: 'done' } } }),
            ]),
            ui.row([
              ui.button('✏️ Save', { onClick: { handler: 'save' } }),
              ui.button('🗑 Delete', { onClick: { handler: 'remove' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          back({ dispatchSystemCommand }) {
            dispatchSystemCommand('nav.back');
          },
          change({ dispatchCardAction }, args) {
            const field = toText(asRecord(args).field);
            if (!field) return;
            dispatchCardAction('set', {
              path: 'edits.' + field,
              value: asRecord(args).value,
            });
          },
          setStatus({ dispatchDomainAction, globalState }, args) {
            const id = navParam(globalState);
            if (!id) return;
            dispatchDomainAction('tasks', 'setStatus', {
              id,
              status: toText(asRecord(args).status, 'todo'),
            });
          },
          save({ dispatchCardAction, dispatchDomainAction, dispatchSystemCommand, cardState, globalState }) {
            const id = navParam(globalState);
            if (!id) return;
            dispatchDomainAction('tasks', 'saveTask', {
              id,
              edits: asRecord(asRecord(cardState).edits),
            });
            dispatchCardAction('patch', { edits: {} });
            dispatchSystemCommand('notify', { message: 'Saved task ' + id });
          },
          remove({ dispatchDomainAction, dispatchSystemCommand, globalState }) {
            const id = navParam(globalState);
            if (!id) return;
            dispatchDomainAction('tasks', 'deleteTask', { id });
            dispatchSystemCommand('notify', { message: 'Deleted task ' + id });
            dispatchSystemCommand('nav.back');
          },
        },
      },

      newTask: {
        render({ cardState, sessionState }) {
          const state = withCardState(cardState);
          const defaultPriority = toText(asRecord(sessionState).defaultPriority, 'medium');
          const form = {
            title: toText(state.form.title),
            priority: toText(state.form.priority, defaultPriority),
            due: toText(state.form.due),
          };

          return ui.panel([
            ui.text('Create New Task'),
            ui.row([
              ui.text('Title:'),
              ui.input(form.title, { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Priority:'),
              ui.input(form.priority, { onChange: { handler: 'change', args: { field: 'priority' } } }),
            ]),
            ui.row([
              ui.text('Due:'),
              ui.input(form.due, { onChange: { handler: 'change', args: { field: 'due' } } }),
            ]),
            state.submitResult ? ui.badge(state.submitResult) : ui.text(''),
            ui.row([
              ui.button('➕ Create Task', { onClick: { handler: 'submit' } }),
              ui.button('🏠 Home', { onClick: { handler: 'goHome' } }),
            ]),
          ]);
        },
        handlers: {
          change({ dispatchCardAction }, args) {
            const field = toText(asRecord(args).field);
            if (!field) return;
            dispatchCardAction('set', {
              path: 'form.' + field,
              value: toText(asRecord(args).value),
            });
          },
          submit({ dispatchCardAction, dispatchDomainAction, dispatchSystemCommand, cardState, sessionState }) {
            const form = asRecord(asRecord(cardState).form);
            const title = toText(form.title).trim();
            if (!title) {
              dispatchCardAction('set', {
                path: 'submitResult',
                value: '❌ Title is required',
              });
              return;
            }

            const defaultPriority = toText(asRecord(sessionState).defaultPriority, 'medium');
            dispatchDomainAction('tasks', 'createTask', {
              title,
              priority: toText(form.priority, defaultPriority),
              due: toText(form.due).trim() || undefined,
            });

            dispatchCardAction('patch', {
              form: { title: '', priority: defaultPriority, due: '' },
              submitResult: '✅ Task created',
            });
            dispatchSystemCommand('notify', { message: 'Task created' });
          },
          goHome({ dispatchSystemCommand }) {
            dispatchSystemCommand('nav.go', { cardId: 'home' });
          },
        },
      },
    },
  };
});
