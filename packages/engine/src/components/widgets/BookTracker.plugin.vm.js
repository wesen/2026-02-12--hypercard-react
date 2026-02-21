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

  function selectBooks(globalState) {
    const domains = asRecord(asRecord(globalState).domains);
    return asArray(asRecord(domains.books).items);
  }

  function navParam(globalState) {
    const param = asRecord(asRecord(globalState).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function findBook(globalState, id) {
    const target = toText(id).toLowerCase();
    return selectBooks(globalState).find((book) => toText(asRecord(book).id).toLowerCase() === target) || null;
  }

  function statusLabel(status) {
    const value = toText(status);
    if (value === 'read') return '✅ read';
    if (value === 'reading') return '🔥 reading';
    return '◻️ to-read';
  }

  function rows(items) {
    return items.map((book) => {
      const row = asRecord(book);
      return [toText(row.id), toText(row.title), toText(row.author), statusLabel(row.status), String(toNumber(row.rating, 0))];
    });
  }

  function readingNow(globalState) {
    return selectBooks(globalState).filter((book) => toText(asRecord(book).status) === 'reading');
  }

  function reportRows(globalState) {
    const items = selectBooks(globalState);
    const total = items.length;
    const toRead = items.filter((book) => toText(asRecord(book).status) === 'to-read').length;
    const reading = items.filter((book) => toText(asRecord(book).status) === 'reading').length;
    const read = items.filter((book) => toText(asRecord(book).status) === 'read').length;
    const avgRating = total ? (items.reduce((sum, book) => sum + toNumber(asRecord(book).rating, 0), 0) / total).toFixed(1) : '0.0';

    return [
      ['Total Books', String(total)],
      ['To Read', String(toRead)],
      ['Reading', String(reading)],
      ['Read', String(read)],
      ['Average Rating', avgRating],
    ];
  }

  function quickOpen(items) {
    return items.slice(0, 10).map((book) => {
      const row = asRecord(book);
      const id = toText(row.id);
      const label = toText(row.title, id);
      return ui.button('Open ' + label, { onClick: { handler: 'openBook', args: { id } } });
    });
  }

  function go(dispatchSystemCommand, cardId, param) {
    dispatchSystemCommand('nav.go', param ? { cardId: String(cardId), param: String(param) } : { cardId: String(cardId) });
  }

  return {
    id: 'bookTracker',
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
            ui.button('📋 Browse Books', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
            ui.button('🔥 Reading Now', { onClick: { handler: 'go', args: { cardId: 'readingNow' } } }),
            ui.button('📊 Reading Report', { onClick: { handler: 'go', args: { cardId: 'readingReport' } } }),
            ui.button('➕ Add Book', { onClick: { handler: 'go', args: { cardId: 'addBook' } } }),
            ui.row([
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('♻️ Reset Demo Data', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
          resetDemo({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'resetDemo');
          },
        },
      },

      browse: {
        render({ globalState }) {
          const items = selectBooks(globalState);
          return ui.panel([
            ui.text('Browse Books (' + items.length + ')'),
            ui.table(rows(items), { headers: ['ID', 'Title', 'Author', 'Status', 'Rating'] }),
            ui.column(quickOpen(items)),
            ui.row([
              ui.button('➕ Add', { onClick: { handler: 'go', args: { cardId: 'addBook' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('♻️ Reset', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          openBook({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, 'bookDetail', asRecord(args).id);
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
            ui.table(rows(items), { headers: ['ID', 'Title', 'Author', 'Status', 'Rating'] }),
            ui.column(quickOpen(items)),
            ui.row([
              ui.button('📋 Browse All', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
          },
          openBook({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, 'bookDetail', asRecord(args).id);
          },
          markAllRead({ dispatchDomainAction }) {
            dispatchDomainAction('books', 'markAllRead');
          },
        },
      },

      bookDetail: {
        render({ cardState, globalState }) {
          const state = asRecord(cardState);
          const edits = asRecord(state.edits);
          const id = navParam(globalState);
          const record = findBook(globalState, id);

          if (!record) {
            return ui.panel([
              ui.text('Book not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const current = { ...asRecord(record), ...edits };

          return ui.panel([
            ui.text('Book Detail: ' + toText(current.title, id)),
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
              ui.button('✏️ Save', { onClick: { handler: 'save' } }),
              ui.button('📖 Mark Reading', { onClick: { handler: 'setStatus', args: { status: 'reading' } } }),
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
            const payload = asRecord(args);
            const field = String(payload.field || '');
            if (!field) return;
            dispatchCardAction('set', { path: 'edits.' + field, value: payload.value });
          },
          save({ cardState, dispatchCardAction, dispatchDomainAction, globalState }) {
            const id = navParam(globalState);
            if (!id) return;
            const edits = { ...asRecord(asRecord(cardState).edits) };
            if (edits.rating !== undefined) {
              edits.rating = toNumber(edits.rating, 0);
            }
            dispatchDomainAction('books', 'saveBook', { id, edits });
            dispatchCardAction('patch', { edits: {} });
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
            dispatchSystemCommand('nav.back');
          },
        },
      },

      addBook: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const form = asRecord(state.formValues);
          const submitResult = toText(state.submitResult);

          return ui.panel([
            ui.text('Add Book'),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(form.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Author:'),
              ui.input(toText(form.author), { onChange: { handler: 'change', args: { field: 'author' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(form.status, 'to-read'), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Rating:'),
              ui.input(toText(form.rating, '0'), { onChange: { handler: 'change', args: { field: 'rating' } } }),
            ]),
            submitResult ? ui.badge(submitResult) : ui.text(''),
            ui.row([
              ui.button('📚 Add Book', { onClick: { handler: 'submit' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          back({ dispatchSystemCommand }) {
            dispatchSystemCommand('nav.back');
          },
          change({ dispatchCardAction }, args) {
            const payload = asRecord(args);
            const field = String(payload.field || '');
            if (!field) return;
            dispatchCardAction('set', { path: 'formValues.' + field, value: payload.value });
          },
          submit({ cardState, dispatchCardAction, dispatchDomainAction }) {
            const values = asRecord(asRecord(cardState).formValues);
            const title = toText(values.title).trim();
            const author = toText(values.author).trim();
            if (!title || !author) {
              dispatchCardAction('patch', { submitResult: '❌ Title and Author are required' });
              return;
            }

            dispatchDomainAction('books', 'createBook', {
              title,
              author,
              status: toText(values.status, 'to-read'),
              rating: toNumber(values.rating, 0),
            });

            dispatchCardAction('patch', {
              submitResult: '✅ Book added',
              formValues: { title: '', author: '', status: 'to-read', rating: 0 },
            });
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
              ui.button('♻️ Reset Demo', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go({ dispatchSystemCommand }, args) {
            go(dispatchSystemCommand, asRecord(args).cardId || 'home');
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
