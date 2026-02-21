export type UIEventRef = { handler: string; args?: unknown };

export type UINode =
  | {
      kind: 'panel' | 'row' | 'column';
      props?: Record<string, unknown>;
      children?: UINode[];
    }
  | {
      kind: 'text' | 'badge';
      props?: Record<string, unknown>;
      text: string;
    }
  | {
      kind: 'button';
      props: {
        label: string;
        onClick?: UIEventRef;
        variant?: string;
      };
    }
  | {
      kind: 'input';
      props: {
        value: string;
        placeholder?: string;
        onChange?: UIEventRef;
      };
    }
  | {
      kind: 'counter';
      props: {
        value: number;
        onIncrement?: UIEventRef;
        onDecrement?: UIEventRef;
      };
    }
  | {
      kind: 'table';
      props: {
        headers: string[];
        rows: unknown[][];
      };
    };
