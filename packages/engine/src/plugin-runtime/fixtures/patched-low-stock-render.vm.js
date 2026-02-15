({ cardState }) =>
  ui.panel([
    ui.text('Patched limit: ' + String(cardState?.limit ?? 0)),
    ui.button('Reserve', { onClick: { handler: 'reserve', args: { sku: 'A-1' } } }),
  ])
