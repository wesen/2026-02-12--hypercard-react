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

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function domains(globalState) {
    return asRecord(asRecord(globalState).domains);
  }

  function selectBooks(globalState) {
    return asArray(asRecord(domains(globalState).books).items);
  }

  function navParam(globalState) {
    const param = asRecord(asRecord(globalState).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function findBook(globalState, id) {
    const target = toText(id).toLowerCase();
    if (!target) return null;
    return selectBooks(globalState).find((book) => toText(asRecord(book).id).toLowerCase() === target) || null;
  }

  function statusLabel(status) {
    const v = toText(status);
    if (v === 'read') return '✅ read';
    if (v === 'reading') return '🔥 reading';
    return '◻️ to-read';
  }

  function progressLabel(status) {
    const v = toText(status);
    if (v === 'read') return 'Finished';
    if (v === 'reading') return 'In Progress';
    return 'Queued';
  }

  function reportRows(globalState) {
    const items = selectBooks(globalState);
    const total = items.length;
    const toRead = items.filter((book) => toText(asRecord(book).status) === 'to-read').length;
    const reading = items.filter((book) => toText(asRecord(book).status) === 'reading').length;
    const read = items.filter((book) => toText(asRecord(book).status) === 'read').length;
    const avgRating =
      total === 0
        ? '0.0'
        : (
            items.reduce((sum, book) => sum + toNumber(asRecord(book).rating, 0), 0) /
            total
          ).toFixed(1);

    return [
      ['Total Books', String(total)],
      ['To Read', String(toRead)],
      ['Reading', String(reading)],
      ['Read', String(read)],
      ['Average Rating', avgRating],
    ];
  }

  function booksRows(items) {
    return items.map((book) => {
      const row = asRecord(book);
      return [
        toText(row.id),
        toText(row.title),
        toText(row.author),
        statusLabel(row.status),
        String(toNumber(row.rating, 0)),
      ];
    });
  }

  function readingNow(globalState) {
    return selectBooks(globalState).filter((book) => toText(asRecord(book).status) === 'reading');
  }

  function withCardState(cardState) {
    const state = asRecord(cardState);
    return {
      edits: asRecord(state.edits),
      formValues: asRecord(state.formValues),
      submitResult: toText(state.submitResult),
    };
  }

  function goTo(dispatchSystemCommand, cardId, param) {
    const payload = param ? { cardId, param: toText(param) } : { cardId };
    dispatchSystemCommand('nav.go', payload);
  }

  function quickOpenButtons(items) {
    return items.slice(0, 10).map((book) => {
      const row = asRecord(book);
      const id = toText(row.id);
      const title = toText(row.title, id);
      return ui.button('Open ' + title, { onClick: { handler: 'openBook', args: { id } } });
    });
  }

  return {
    id: 'bookTrackerDebug',
    title: 'Book Tracker',
    initialCardState: {
      bookDetail: { edits: {} },
      addBook: {
        formValues: { title: '', author: '', status: 'to-read', rating: 0 },
        submitResult: '',
      },
    },
    cards: {
      home: {
        render() {
          return ui.panel([
            ui.text('Book Tracker'),
            ui.text('Plugin runtime'),
            ui.button('📋 Browse Books', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
            ui.button('🔥 Reading Now', { onClick: { handler: 'go', args: { cardId: 'readingNow' } } }),
            ui.button('📊 Reading Report', { onClick: { handler: 'go', args: { cardId: 'readingReport' } } }),
            ui.button('➕ Add Book', { onClick: { handler: 'go', args: { cardId: 'addBook' } } }),
            ui.row([
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('🔄 Reset Demo Data', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            goTo(dispatchSystemCommand, toText(asRecord(args).cardId, 'home'));
          },
          markAllRead({ dispatchDomainAction, dispatchSystemCommand }) {
            dispatchDomainAction('books', 'markAllRead');
            dispatchSystemCommand('notify', { message: 'All books marked read' });
          },
          resetDemo({ dispatchDomainAction, dispatchSystemCommand }) {
            dispatchDomainAction('books', 'resetDemo');
            dispatchSystemCommand('notify', { message: 'Book demo data reset' });
          },
        },
      },

      browse: {
        render({ globalState }) {
          const items = selectBooks(globalState);
          return ui.panel([
            ui.text('Browse Books (' + items.length + ')'),
            ui.table(booksRows(items), {
              headers: ['ID', 'Title', 'Author', 'Status', 'Rating'],
            }),
            items.length ? ui.text('Quick open:') : ui.badge('No books found.'),
            ui.column(quickOpenButtons(items)),
            ui.row([
              ui.button('➕ Add', { onClick: { handler: 'go', args: { cardId: 'addBook' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('🔄 Reset', { onClick: { handler: 'resetDemo' } }),
              ui.button('🏠 Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            goTo(dispatchSystemCommand, toText(asRecord(args).cardId, 'home'));
          },
          openBook({ dispatchSystemCommand }, args) {
            goTo(dispatchSystemCommand, 'bookDetail', toText(asRecord(args).id));
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
          resetDemo({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'resetDemo');
          },
        },
      },

      readingNow: {
        render({ globalState }) {
          const items = readingNow(globalState);
          return ui.panel([
            ui.text('Reading Now (' + items.length + ')'),
            ui.table(booksRows(items), {
              headers: ['ID', 'Title', 'Author', 'Status', 'Rating'],
            }),
            items.length ? ui.text('Quick open:') : ui.badge('No active reading books right now.'),
            ui.column(quickOpenButtons(items)),
            ui.row([
              ui.button('📋 Browse All', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            goTo(dispatchSystemCommand, toText(asRecord(args).cardId, 'home'));
          },
          openBook({ dispatchSystemCommand }, args) {
            goTo(dispatchSystemCommand, 'bookDetail', toText(asRecord(args).id));
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
        },
      },

      bookDetail: {
        render({ cardState, globalState }) {
          const id = navParam(globalState);
          const record = findBook(globalState, id);
          if (!record) {
            return ui.panel([
              ui.text('Book not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const state = withCardState(cardState);
          const current = { ...asRecord(record), ...state.edits };

          return ui.panel([
            ui.text('Book Detail: ' + toText(current.title, id)),
            ui.text('Progress: ' + progressLabel(current.status)),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(current.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Author:'),
              ui.input(toText(current.author), { onChange: { handler: 'change', args: { field: 'author' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(current.status), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Rating:'),
              ui.input(toText(current.rating), { onChange: { handler: 'change', args: { field: 'rating' } } }),
            ]),
            ui.row([
              ui.button('💾 Save', { onClick: { handler: 'save' } }),
              ui.button('🔥 Mark Reading', { onClick: { handler: 'setStatus', args: { status: 'reading' } } }),
              ui.button('✅ Mark Read', { onClick: { handler: 'setStatus', args: { status: 'read' } } }),
            ]),
            ui.row([
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
          save({ dispatchCardAction, dispatchDomainAction, dispatchSystemCommand, cardState, globalState }) {
            const id = navParam(globalState);
            if (!id) return;
            const edits = { ...asRecord(asRecord(cardState).edits) };
            if (edits.rating !== undefined) {
              edits.rating = toNumber(edits.rating, 0);
            }
            dispatchDomainAction('books', 'saveBook', { id, edits });
            dispatchCardAction('patch', { edits: {} });
            dispatchSystemCommand('notify', { message: 'Saved book ' + id });
          },
          setStatus({ dispatchCardAction, dispatchDomainAction, globalState }, args) {
            const id = navParam(globalState);
            if (!id) return;
            const status = toText(asRecord(args).status);
            if (!status) return;
            dispatchDomainAction('books', 'setStatus', { id, status });
            dispatchCardAction('patch', { edits: {} });
          },
          remove({ dispatchDomainAction, dispatchSystemCommand, globalState }) {
            const id = navParam(globalState);
            if (!id) return;
            dispatchDomainAction('books', 'deleteBook', { id });
            dispatchSystemCommand('notify', { message: 'Deleted book ' + id });
            dispatchSystemCommand('nav.back');
          },
        },
      },

      addBook: {
        render({ cardState }) {
          const state = withCardState(cardState);
          const form = {
            title: toText(state.formValues.title),
            author: toText(state.formValues.author),
            status: toText(state.formValues.status, 'to-read'),
            rating: toText(state.formValues.rating, '0'),
          };

          return ui.panel([
            ui.text('Add Book'),
            ui.row([
              ui.text('Title:'),
              ui.input(form.title, { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Author:'),
              ui.input(form.author, { onChange: { handler: 'change', args: { field: 'author' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(form.status, { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Rating:'),
              ui.input(form.rating, { onChange: { handler: 'change', args: { field: 'rating' } } }),
            ]),
            state.submitResult ? ui.badge(state.submitResult) : ui.text(''),
            ui.row([
              ui.button('Add Book', { onClick: { handler: 'submit' } }),
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
              path: 'formValues.' + field,
              value: asRecord(args).value,
            });
          },
          submit({ dispatchCardAction, dispatchDomainAction, dispatchSystemCommand, cardState }) {
            const values = asRecord(asRecord(cardState).formValues);
            const title = toText(values.title).trim();
            const author = toText(values.author).trim();
            if (!title || !author) {
              dispatchCardAction('patch', { submitResult: 'Title and Author are required' });
              return;
            }

            dispatchDomainAction('books', 'createBook', {
              title,
              author,
              status: toText(values.status, 'to-read'),
              rating: toNumber(values.rating, 0),
            });

            dispatchCardAction('patch', {
              submitResult: 'Book added',
              formValues: { title: '', author: '', status: 'to-read', rating: 0 },
            });
            dispatchSystemCommand('notify', { message: 'Book added: ' + title });
          },
        },
      },

      readingReport: {
        render({ globalState }) {
          return ui.panel([
            ui.text('Reading Report'),
            ui.table(reportRows(globalState), { headers: ['Metric', 'Value'] }),
            ui.row([
              ui.button('📋 Browse', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('🔄 Reset Demo', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            goTo(dispatchSystemCommand, toText(asRecord(args).cardId, 'home'));
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
          resetDemo({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'resetDemo');
          },
        },
      },
    },
  };
});
