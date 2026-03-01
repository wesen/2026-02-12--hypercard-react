defineStackBundle(({ ui }) => {
  return {
    id: 'loop',
    title: 'Loop',
    cards: {
      loop: {
        render() {
          while (true) {}
        },
        handlers: {},
      },
    },
  };
});
