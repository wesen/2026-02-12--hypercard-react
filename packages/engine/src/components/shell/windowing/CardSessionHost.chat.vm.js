defineStackBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  return {
    id: 'chat-demo',
    title: 'Chat Demo',
    initialCardState: {
      chat: {
        draft: '',
        messages: [
          'Hello! How can I help you today?',
          'Try asking about report export or low stock alerts.',
        ],
      },
    },
    cards: {
      chat: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const messages = Array.isArray(state.messages) ? state.messages : [];
          const draft = String(state.draft || '');

          return ui.panel([
            ui.text('Assistant'),
            ui.column(messages.map((message) => ui.text('• ' + String(message)))),
            ui.input(draft, { onChange: { handler: 'changeDraft' } }),
            ui.row([
              ui.button('Send', { onClick: { handler: 'send' } }),
              ui.button('Clear', { onClick: { handler: 'clear' } }),
            ]),
          ]);
        },
        handlers: {
          changeDraft({ dispatchCardAction }, args) {
            dispatchCardAction('set', { path: 'draft', value: asRecord(args).value });
          },
          send({ cardState, dispatchCardAction }) {
            const state = asRecord(cardState);
            const draft = String(state.draft || '').trim();
            if (!draft) return;
            const messages = Array.isArray(state.messages) ? state.messages : [];
            dispatchCardAction('patch', {
              draft: '',
              messages: messages.concat(['You: ' + draft, 'Assistant: Thanks, received.']).slice(-10),
            });
          },
          clear({ dispatchCardAction }) {
            dispatchCardAction('patch', { draft: '', messages: [] });
          },
        },
      },
    },
  };
});
