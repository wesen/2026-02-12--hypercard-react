defineRuntimeBundle(({ ui }) => {
  return {
    id: 'column-demo',
    title: 'Column Demo',
    packageIds: ["ui"],
    surfaces: {
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
