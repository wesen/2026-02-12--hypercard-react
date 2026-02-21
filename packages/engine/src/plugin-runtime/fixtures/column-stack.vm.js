defineStackBundle(({ ui }) => {
  return {
    id: 'column-demo',
    title: 'Column Demo',
    cards: {
      main: {
        render() {
          return ui.column([
            ui.text('top'),
            ui.text('bottom'),
          ]);
        },
        handlers: {},
      },
    },
  };
});
