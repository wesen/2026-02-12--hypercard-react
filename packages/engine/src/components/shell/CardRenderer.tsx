import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { Btn } from '../widgets/Btn';
import { ChatView } from '../widgets/ChatView';
import { DataTable } from '../widgets/DataTable';
import { DetailView } from '../widgets/DetailView';
import { FormView } from '../widgets/FormView';
import { ListView } from '../widgets/ListView';
import { MenuGrid } from '../widgets/MenuGrid';
import { ReportView } from '../widgets/ReportView';
import type { ActionDescriptor, CardDefinition, UINode } from '../../cards/types';

function isActionDescriptor(value: unknown): value is ActionDescriptor {
  return !!value && typeof value === 'object' && (value as { $?: unknown }).$ === 'act';
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

export interface CardRendererRuntime {
  mode: 'interactive' | 'preview';
  resolve: (expr: unknown, event?: { name: string; payload: unknown }) => unknown;
  emit: (nodeKey: string, eventName: string, payload: unknown) => void;
  execute: (action: ActionDescriptor, event?: { name: string; payload: unknown }) => void;
}

export interface CardRendererProps {
  cardId: string;
  cardDef: CardDefinition;
  runtime: CardRendererRuntime;
}

export function CardRenderer({ cardId, cardDef, runtime }: CardRendererProps) {
  function runNodeAction(action: unknown, event?: { name: string; payload: unknown }) {
    if (runtime.mode === 'preview') return;
    if (isActionDescriptor(action)) {
      runtime.execute(action, event);
    }
  }

  function emit(node: UINode, eventName: string, payload: unknown) {
    if (runtime.mode === 'preview') return;
    if (!node.key) return;
    runtime.emit(node.key, eventName, payload);
  }

  function renderNode(node: UINode | null | undefined, keyHint?: string): ReactNode {
    if (!node) return null;

    switch (node.t) {
      case 'screen': {
        const header = node.header as UINode | undefined;
        const body = toArray(node.body);
        return (
          <div key={keyHint} data-part="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {header ? renderNode(header, `${keyHint ?? node.key ?? 'screen'}:header`) : null}
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {body.map((child, i) => renderNode(child as UINode, `${keyHint ?? node.key ?? 'screen'}:body:${i}`))}
            </div>
          </div>
        );
      }

      case 'toolbar': {
        const left = toArray(runtime.resolve(node.left));
        const right = runtime.resolve(node.right);
        return (
          <div key={keyHint} data-part="nav-bar" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {left.map((child, i) => renderNode(child as UINode, `${keyHint ?? node.key ?? 'toolbar'}:left:${i}`))}
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.8 }}>
              {typeof right === 'string' ? right : (right ? renderNode(right as UINode, `${keyHint ?? node.key ?? 'toolbar'}:right`) : null)}
            </span>
          </div>
        );
      }

      case 'row': {
        const children = toArray(node.children);
        return (
          <div key={keyHint} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {children.map((child, i) => renderNode(child as UINode, `${keyHint ?? node.key ?? 'row'}:${i}`))}
          </div>
        );
      }

      case 'spacer':
        return <span key={keyHint} style={{ flex: 1 }} />;

      case 'text': {
        const value = runtime.resolve(node.value);
        return <span key={keyHint}>{String(value ?? '')}</span>;
      }

      case 'button':
      case 'iconButton': {
        const label = runtime.resolve(node.label) ?? runtime.resolve(node.icon) ?? '';
        const disabled = Boolean(runtime.resolve(node.disabled));
        return (
          <Btn
            key={keyHint}
            disabled={disabled}
            onClick={() => emit(node, 'press', {})}
          >
            {String(label)}
          </Btn>
        );
      }

      case 'select': {
        const options = toArray(runtime.resolve(node.options));
        const value = runtime.resolve(node.value);
        return (
          <select
            key={keyHint}
            data-part="field-select"
            value={String(value ?? '')}
            onChange={(e) => emit(node, 'change', { value: e.target.value })}
          >
            {options.map((opt, i) => {
              if (typeof opt === 'string' || typeof opt === 'number') {
                return <option key={i} value={String(opt)}>{String(opt)}</option>;
              }
              const o = (opt ?? {}) as Record<string, unknown>;
              const ov = String(o.value ?? '');
              const ol = String(o.label ?? ov);
              return <option key={i} value={ov}>{ol}</option>;
            })}
          </select>
        );
      }

      case 'table': {
        const items = toArray(runtime.resolve(node.rows));
        const columns = toArray(runtime.resolve(node.columns));
        return (
          <DataTable
            key={keyHint}
            items={items as Record<string, unknown>[]}
            columns={columns as any}
            rowKey={(runtime.resolve(node.rowKey) as string | undefined) ?? 'id'}
            emptyMessage={String(runtime.resolve(node.emptyMessage) ?? 'No items')}
            onRowClick={(row) => emit(node, 'rowClick', { row })}
          />
        );
      }

      case 'menu': {
        const icon = runtime.resolve(node.icon);
        const labels = toArray(runtime.resolve(node.labels));
        const buttons = toArray(runtime.resolve(node.buttons));
        return (
          <MenuGrid
            key={keyHint}
            icon={typeof icon === 'string' ? icon : undefined}
            labels={labels as Array<{ value: string; style?: string }>}
            buttons={buttons as any}
            onAction={(action) => {
              if (isActionDescriptor(action)) {
                runNodeAction(action, { name: 'action', payload: { action } });
                return;
              }
              emit(node, 'action', { action });
            }}
          />
        );
      }

      case 'list': {
        const items = toArray(runtime.resolve(node.items));
        const columns = toArray(runtime.resolve(node.columns));
        const filters = runtime.resolve(node.filters);
        const toolbar = runtime.resolve(node.toolbar);
        const searchFields = runtime.resolve(node.searchFields);
        const footer = runtime.resolve(node.footer);
        const emptyMessage = runtime.resolve(node.emptyMessage);
        const rowKey = runtime.resolve(node.rowKey) as string | undefined;

        return (
          <ListView
            key={keyHint}
            items={items as Record<string, unknown>[]}
            columns={columns as any}
            filters={filters as any}
            searchFields={searchFields as string[] | undefined}
            toolbar={toolbar as any}
            footer={footer as any}
            emptyMessage={typeof emptyMessage === 'string' ? emptyMessage : undefined}
            rowKey={rowKey ?? 'id'}
            onRowClick={(row) => emit(node, 'rowClick', { row })}
            onAction={(action) => {
              if (isActionDescriptor(action)) {
                runNodeAction(action, { name: 'action', payload: { action } });
                return;
              }
              emit(node, 'action', { action });
            }}
          />
        );
      }

      case 'detail': {
        const record = (runtime.resolve(node.record) ?? {}) as Record<string, unknown>;
        const fields = (runtime.resolve(node.fields) ?? []) as unknown[];
        const computed = (runtime.resolve(node.computed) ?? undefined) as unknown;
        const edits = (runtime.resolve(node.edits) ?? {}) as Record<string, unknown>;
        const actions = (runtime.resolve(node.actions) ?? undefined) as unknown;

        return (
          <DetailView
            key={keyHint}
            record={record}
            fields={fields as any}
            computed={computed as any}
            edits={edits}
            onEdit={(id, value) => emit(node, 'change', { field: id, value })}
            actions={actions as any}
            onAction={(action) => {
              if (isActionDescriptor(action)) {
                runNodeAction(action, { name: 'action', payload: { action } });
                return;
              }
              emit(node, 'action', { action });
            }}
          />
        );
      }

      case 'form': {
        const fields = (runtime.resolve(node.fields) ?? []) as unknown[];
        const values = (runtime.resolve(node.values) ?? {}) as Record<string, unknown>;
        const submitLabel = runtime.resolve(node.submitLabel);
        const submitResult = runtime.resolve(node.submitResult);

        return (
          <FormView
            key={keyHint}
            fields={fields as any}
            values={values}
            onChange={(id, value) => emit(node, 'change', { field: id, value })}
            onSubmit={(v) => emit(node, 'submit', { values: v })}
            submitLabel={typeof submitLabel === 'string' ? submitLabel : undefined}
            submitResult={typeof submitResult === 'string' ? submitResult : null}
          />
        );
      }

      case 'report': {
        const sections = (runtime.resolve(node.sections) ?? []) as unknown[];
        const actions = (runtime.resolve(node.actions) ?? undefined) as unknown;

        return (
          <ReportView
            key={keyHint}
            sections={sections as any}
            actions={actions as any}
            onAction={(action) => {
              if (isActionDescriptor(action)) {
                runNodeAction(action, { name: 'action', payload: { action } });
                return;
              }
              emit(node, 'action', { action });
            }}
          />
        );
      }

      case 'chat': {
        const messages = (runtime.resolve(node.messages) ?? []) as unknown[];
        const suggestions = (runtime.resolve(node.suggestions) ?? undefined) as unknown;
        const placeholder = runtime.resolve(node.placeholder);
        const renderResults = runtime.resolve(node.renderResults);

        return (
          <ChatView
            key={keyHint}
            messages={messages as any}
            suggestions={suggestions as string[] | undefined}
            placeholder={typeof placeholder === 'string' ? placeholder : undefined}
            renderResults={typeof renderResults === 'function' ? (renderResults as any) : undefined}
            onSend={(text) => emit(node, 'send', { text })}
            onAction={(action) => {
              if (isActionDescriptor(action)) {
                runNodeAction(action, { name: 'action', payload: { action } });
                return;
              }
              emit(node, 'action', { action });
            }}
          />
        );
      }

      default:
        return (
          <Fragment key={keyHint}>
            <div data-part="card" style={{ padding: 16 }}>
              Unsupported node type "{node.t}" (card: {cardId})
            </div>
          </Fragment>
        );
    }
  }

  return <>{renderNode(cardDef.ui, `${cardId}:root`)}</>;
}
