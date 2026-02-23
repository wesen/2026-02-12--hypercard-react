import {
  DataTable,
  ImageChoiceGrid,
  RequestActionBar,
  SchemaFormRenderer,
  SelectableList,
  SelectableDataTable,
  type ColumnConfig,
} from '@hypercard/engine';
import { useMemo, useState } from 'react';
import type { ConfirmRequest, SubmitResponsePayload, SubmitScriptEventPayload } from '../types';
import type { JsonSchemaNode } from '@hypercard/engine';

export interface ConfirmRequestWindowHostProps {
  request: ConfirmRequest;
  onSubmitResponse: (requestId: string, payload: SubmitResponsePayload) => void;
  onSubmitScriptEvent: (requestId: string, payload: SubmitScriptEventPayload) => void;
}

function renderPlaceholder(message: string) {
  return <div data-part="table-empty">{message}</div>;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry));
}

export function ConfirmRequestWindowHost({ request, onSubmitResponse, onSubmitScriptEvent }: ConfirmRequestWindowHostProps) {
  const payload = request.input?.payload ?? {};
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [selectedTableRows, setSelectedTableRows] = useState<string[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  const selectOptions = useMemo(() => {
    const options = payload.options;
    if (!Array.isArray(options)) {
      return [];
    }
    return options.map((option, index) => {
      if (typeof option === 'string') {
        return { id: `opt-${index}`, label: option };
      }
      if (typeof option === 'object' && option !== null) {
        const row = option as Record<string, unknown>;
        return {
          id: String(row.id ?? `opt-${index}`),
          label: String(row.label ?? row.title ?? `Option ${index + 1}`),
          description: typeof row.description === 'string' ? row.description : undefined,
          meta: typeof row.meta === 'string' ? row.meta : undefined,
        };
      }
      return { id: `opt-${index}`, label: String(option) };
    });
  }, [payload.options]);

  const tableRows = useMemo(() => {
    const rows = payload.rows;
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.filter((row) => typeof row === 'object' && row !== null) as Array<Record<string, unknown>>;
  }, [payload.rows]);

  const tableColumns = useMemo<ColumnConfig<Record<string, unknown>>[]>(() => {
    if (Array.isArray(payload.columns) && payload.columns.length > 0) {
      return payload.columns
        .map((entry) => (typeof entry === 'string' ? { key: entry, label: entry } : entry))
        .filter((entry): entry is ColumnConfig<Record<string, unknown>> => typeof entry === 'object' && entry !== null)
        .map((entry) => ({ key: String(entry.key), label: String(entry.label ?? entry.key) }));
    }

    if (tableRows.length > 0) {
      return Object.keys(tableRows[0]).map((key) => ({ key, label: key }));
    }
    return [];
  }, [payload.columns, tableRows]);

  const imageItems = useMemo<Array<{ id: string; src: string; label?: string; badge?: string }>>(() => {
    const images = payload.images;
    if (!Array.isArray(images)) {
      return [];
    }
    const rows: Array<{ id: string; src: string; label?: string; badge?: string }> = [];
    images.forEach((entry, index) => {
      if (typeof entry === 'string') {
        rows.push({ id: `img-${index}`, src: entry, label: `Image ${index + 1}` });
        return;
      }
      if (typeof entry !== 'object' || entry === null) {
        return;
      }
      const row = entry as Record<string, unknown>;
      if (typeof row.src !== 'string') {
        return;
      }
      rows.push({
        id: String(row.id ?? `img-${index}`),
        src: row.src,
        label: typeof row.label === 'string' ? row.label : undefined,
        badge: typeof row.badge === 'string' ? row.badge : undefined,
      });
    });
    return rows;
  }, [payload.images]);

  if (request.widgetType === 'confirm') {
    return (
      <RequestActionBar
        primaryLabel={typeof payload.approveText === 'string' ? payload.approveText : 'Approve'}
        secondaryLabel={typeof payload.rejectText === 'string' ? payload.rejectText : 'Reject'}
        commentEnabled
        onPrimary={(comment: string | undefined) => onSubmitResponse(request.id, { output: { approved: true, comment } })}
        onSecondary={(comment: string | undefined) => onSubmitResponse(request.id, { output: { approved: false, comment } })}
      />
    );
  }

  if (request.widgetType === 'select') {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <SelectableList
          items={selectOptions}
          mode={payload.multi === true ? 'multiple' : 'single'}
          searchable={payload.searchable === true}
          selectedIds={selectedListIds}
          onSelectionChange={setSelectedListIds}
        />
        <RequestActionBar
          primaryLabel="Submit"
          onPrimary={(comment: string | undefined) =>
            onSubmitResponse(request.id, { output: { selectedIds: selectedListIds, comment } })
          }
          commentEnabled
        />
      </div>
    );
  }

  if (request.widgetType === 'form') {
    const schema = (payload.schema ?? {}) as Record<string, unknown>;
    if (typeof schema !== 'object' || schema === null) {
      return renderPlaceholder('Form schema missing');
    }
    return (
      <SchemaFormRenderer
        schema={schema as JsonSchemaNode}
        onSubmit={(value: Record<string, unknown>) => onSubmitResponse(request.id, { output: { value } })}
        submitLabel="Submit"
      />
    );
  }

  if (request.widgetType === 'table') {
    if (tableColumns.length === 0) {
      return renderPlaceholder('No table columns available');
    }

    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <SelectableDataTable
          items={tableRows}
          columns={tableColumns}
          rowKey={typeof payload.rowKey === 'string' ? payload.rowKey : 'id'}
          selectedRowKeys={selectedTableRows}
          onSelectionChange={setSelectedTableRows}
          mode={payload.multiSelect === true ? 'multiple' : 'single'}
          searchable={payload.searchable === true}
        />
        <RequestActionBar
          primaryLabel="Submit"
          onPrimary={(comment: string | undefined) =>
            onSubmitResponse(request.id, {
              output: {
                selectedRowKeys: selectedTableRows,
                comment,
              },
            })
          }
          commentEnabled
        />
      </div>
    );
  }

  if (request.widgetType === 'image') {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <ImageChoiceGrid
          items={imageItems}
          selectedIds={selectedImageIds}
          onSelectionChange={setSelectedImageIds}
          mode={payload.multi === true ? 'multi' : payload.mode === 'confirm' ? 'confirm' : 'select'}
        />
        <RequestActionBar
          primaryLabel="Submit"
          onPrimary={(comment: string | undefined) =>
            onSubmitResponse(request.id, { output: { selectedImageIds: selectedImageIds, comment } })
          }
          commentEnabled
        />
      </div>
    );
  }

  if (request.widgetType === 'script') {
    const scriptView = request.scriptView;
    if (!scriptView) {
      return renderPlaceholder('Script view unavailable');
    }

    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div data-part="field-value">Script widget: {scriptView.widgetType}</div>
        <RequestActionBar
          primaryLabel="Next"
          secondaryLabel={scriptView.allowBack ? (scriptView.backLabel ?? 'Back') : undefined}
          onPrimary={() => onSubmitScriptEvent(request.id, { type: 'next' })}
          onSecondary={
            scriptView.allowBack
              ? () => onSubmitScriptEvent(request.id, { type: 'back' })
              : undefined
          }
        />
      </div>
    );
  }

  if (request.widgetType === 'upload') {
    return renderPlaceholder(`Upload accept: ${toStringArray(payload.accept).join(', ') || 'any'}`);
  }

  return (
    <DataTable
      items={[{ detail: `Unsupported widget type: ${request.widgetType}` }]}
      columns={[{ key: 'detail', label: 'Detail' }]}
    />
  );
}
