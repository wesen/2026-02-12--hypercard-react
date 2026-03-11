defineRuntimeBundle(({ ui }) => {
  return {
    id: 'loop',
    title: 'Loop',
    packageIds: ["ui"],
    surfaces: {
      loop: {
        render() {
          while (true) {}
        },
        handlers: {},
      },
    },
  };
});
