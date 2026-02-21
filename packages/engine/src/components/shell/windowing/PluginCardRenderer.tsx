import type { ReactNode } from 'react';
import { Btn } from '../../widgets/Btn';
import type { UIEventRef, UINode } from '../../../plugin-runtime/uiTypes';

export interface PluginCardRendererProps {
  tree: UINode;
  onEvent: (handler: string, args?: unknown) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeArgs(eventArgs: unknown, payload: Record<string, unknown>): unknown {
  if (!isRecord(eventArgs)) {
    return payload;
  }

  return {
    ...eventArgs,
    ...payload,
  };
}

function eventHandler(ref: UIEventRef | undefined, onEvent: PluginCardRendererProps['onEvent'], payload?: unknown) {
  if (!ref) {
    return;
  }

  if (payload && isRecord(payload)) {
    onEvent(ref.handler, mergeArgs(ref.args, payload));
    return;
  }

  onEvent(ref.handler, ref.args);
}

export function PluginCardRenderer({ tree, onEvent }: PluginCardRendererProps) {
  function renderNode(node: UINode, keyHint: string): ReactNode {
    if (node.kind === 'panel') {
      return (
        <div key={keyHint} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12 }}>
          {(node.children ?? []).map((child, index) => renderNode(child, `${keyHint}:panel:${index}`))}
        </div>
      );
    }

    if (node.kind === 'column') {
      return (
        <div key={keyHint} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(node.children ?? []).map((child, index) => renderNode(child, `${keyHint}:column:${index}`))}
        </div>
      );
    }

    if (node.kind === 'row') {
      return (
        <div key={keyHint} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(node.children ?? []).map((child, index) => renderNode(child, `${keyHint}:row:${index}`))}
        </div>
      );
    }

    if (node.kind === 'text') {
      return <span key={keyHint}>{node.text}</span>;
    }

    if (node.kind === 'badge') {
      return (
        <span
          key={keyHint}
          style={{
            display: 'inline-flex',
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--hc-accent, #d0e7ff)',
            fontSize: 12,
          }}
        >
          {node.text}
        </span>
      );
    }

    if (node.kind === 'button') {
      return (
        <Btn key={keyHint} onClick={() => eventHandler(node.props.onClick, onEvent)}>
          {node.props.label}
        </Btn>
      );
    }

    if (node.kind === 'input') {
      return (
        <input
          key={keyHint}
          value={node.props.value}
          placeholder={node.props.placeholder}
          onChange={(event) =>
            eventHandler(node.props.onChange, onEvent, {
              value: event.target.value,
            })
          }
        />
      );
    }

    if (node.kind === 'counter') {
      return (
        <div key={keyHint} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Btn onClick={() => eventHandler(node.props.onDecrement, onEvent)}>-</Btn>
          <span>{node.props.value}</span>
          <Btn onClick={() => eventHandler(node.props.onIncrement, onEvent)}>+</Btn>
        </div>
      );
    }

    if (node.kind === 'table') {
      return (
        <table key={keyHint} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {node.props.headers.map((header: string, index: number) => (
                <th key={`${keyHint}:h:${index}`} style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {node.props.rows.map((row: unknown[], rowIndex: number) => (
              <tr key={`${keyHint}:r:${rowIndex}`}>
                {row.map((value: unknown, colIndex: number) => (
                  <td key={`${keyHint}:r:${rowIndex}:c:${colIndex}`} style={{ padding: '4px 0' }}>
                    {String(value ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  }

  return <>{renderNode(tree, 'plugin-root')}</>;
}
