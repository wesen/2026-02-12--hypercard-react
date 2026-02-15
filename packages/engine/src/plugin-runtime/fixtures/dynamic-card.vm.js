({ ui }) => ({
  render({ cardState }) {
    return ui.panel([
      ui.text('Dynamic card: ' + String(cardState?.name ?? 'n/a')),
      ui.button('Back', { onClick: { handler: 'back' } }),
    ]);
  },
  handlers: {
    back({ dispatchSystemCommand }) {
      dispatchSystemCommand('nav.back');
    },
  },
})
