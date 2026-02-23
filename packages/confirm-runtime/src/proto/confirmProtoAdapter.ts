import type { ConfirmRealtimeEvent, ConfirmRequest, ConfirmScriptView, ConfirmWidgetType, SubmitResponsePayload } from '../types';

type RawRecord = Record<string, unknown>;

const KNOWN_WIDGET_TYPES: ConfirmWidgetType[] = ['confirm', 'select', 'form', 'upload', 'table', 'image', 'script'];

function asRecord(value: unknown): RawRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as RawRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry));
}

function isWidgetType(value: unknown): value is ConfirmWidgetType {
  return typeof value === 'string' && KNOWN_WIDGET_TYPES.includes(value as ConfirmWidgetType);
}

function inputFieldForWidgetType(widgetType: ConfirmWidgetType): string {
  switch (widgetType) {
    case 'confirm':
      return 'confirmInput';
    case 'select':
      return 'selectInput';
    case 'form':
      return 'formInput';
    case 'upload':
      return 'uploadInput';
    case 'table':
      return 'tableInput';
    case 'image':
      return 'imageInput';
    case 'script':
      return 'scriptInput';
  }
}

function mapScriptView(raw: unknown): ConfirmScriptView | undefined {
  const view = asRecord(raw);
  if (!view) {
    return undefined;
  }

  const widgetType = isWidgetType(view.widgetType) && view.widgetType !== 'script' ? view.widgetType : 'confirm';
  const sections = Array.isArray(view.sections)
    ? view.sections
        .map((section, index) => {
          const row = asRecord(section);
          if (!row) {
            return null;
          }
          const sectionWidgetType = asString(row.widgetType);
          const kind: 'display' | 'interactive' = sectionWidgetType === 'display' ? 'display' : 'interactive';
          return {
            id: `section-${index}`,
            kind,
            widgetType:
              sectionWidgetType && isWidgetType(sectionWidgetType) && sectionWidgetType !== 'script'
                ? sectionWidgetType
                : undefined,
            input: asRecord(row.input) ?? undefined,
          };
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    : undefined;

  const progress = asRecord(view.progress);
  const toast = asRecord(view.toast);

  return {
    widgetType,
    input: asRecord(view.input) ?? {},
    sections,
    allowBack: view.allowBack === true,
    backLabel: asString(view.backLabel),
    progress: progress
      ? {
          current: typeof progress.current === 'number' ? progress.current : 0,
          total: typeof progress.total === 'number' ? progress.total : 0,
          label: asString(progress.label),
        }
      : undefined,
    toast: toast
      ? {
          message: asString(toast.message) ?? '',
          style:
            toast.style === 'info' || toast.style === 'success' || toast.style === 'warning' || toast.style === 'error'
              ? toast.style
              : undefined,
          durationMs: typeof toast.durationMs === 'number' ? toast.durationMs : undefined,
        }
      : undefined,
  };
}

export function mapUIRequestFromProto(raw: unknown): ConfirmRequest | null {
  const request = asRecord(raw);
  if (!request) {
    return null;
  }
  const requestId = asString(request.id);
  const sessionId = asString(request.sessionId);
  const widgetType = request.type;

  if (!requestId || !sessionId || !isWidgetType(widgetType)) {
    return null;
  }

  const inputField = inputFieldForWidgetType(widgetType);
  const rawInput = asRecord(request[inputField]) ?? {};
  const title = asString(rawInput.title);
  const message = asString(rawInput.message);

  return {
    id: requestId,
    sessionId,
    widgetType,
    title,
    message,
    createdAt: asString(request.createdAt),
    updatedAt: asString(request.updatedAt),
    input: {
      title,
      payload: rawInput,
    },
    scriptView: mapScriptView(request.scriptView),
    metadata: asRecord(request.metadata) ?? undefined,
  };
}

function mapEventType(raw: unknown): ConfirmRealtimeEvent['type'] | null {
  if (raw === 'new_request' || raw === 'request_updated' || raw === 'request_completed') {
    return raw;
  }
  return null;
}

export function mapRealtimeEventFromProto(raw: unknown): ConfirmRealtimeEvent | null {
  const event = asRecord(raw);
  if (!event) {
    return null;
  }

  const type = mapEventType(event.type);
  if (!type) {
    return null;
  }
  const request = mapUIRequestFromProto(event.request);
  const requestRecord = asRecord(event.request);

  return {
    type,
    request: request ?? undefined,
    requestId: asString(event.requestId) ?? request?.id,
    completedAt: asString(event.completedAt) ?? asString(requestRecord?.completedAt),
    output: undefined,
  };
}

function commentField(output: RawRecord): RawRecord {
  const comment = asString(output.comment);
  return comment ? { comment } : {};
}

function mapConfirmResponse(output: RawRecord): RawRecord {
  return {
    confirmOutput: {
      approved: output.approved === true,
      ...commentField(output),
    },
  };
}

function mapSelectResponse(output: RawRecord): RawRecord {
  const selected = asStringArray(output.selectedIds);
  if (selected.length > 1) {
    return {
      selectOutput: {
        selectedMulti: { values: selected },
        ...commentField(output),
      },
    };
  }
  return {
    selectOutput: {
      selectedSingle: selected[0] ?? '',
      ...commentField(output),
    },
  };
}

function mapFormResponse(output: RawRecord): RawRecord {
  const data = asRecord(output.value) ?? asRecord(output.data) ?? output;
  return {
    formOutput: {
      data,
      ...commentField(output),
    },
  };
}

function mapTableResponse(output: RawRecord): RawRecord {
  const selectedRowsRaw = output.selectedRows;
  if (Array.isArray(selectedRowsRaw)) {
    const selectedRows = selectedRowsRaw.map((row) => asRecord(row)).filter((row): row is RawRecord => row !== null);
    if (selectedRows.length > 1) {
      return {
        tableOutput: {
          selectedMulti: { values: selectedRows },
          ...commentField(output),
        },
      };
    }
    if (selectedRows.length === 1) {
      return {
        tableOutput: {
          selectedSingle: selectedRows[0],
          ...commentField(output),
        },
      };
    }
  }

  const keys = asStringArray(output.selectedRowKeys);
  if (keys.length > 1) {
    return {
      tableOutput: {
        selectedMulti: { values: keys.map((id) => ({ id })) },
        ...commentField(output),
      },
    };
  }
  return {
    tableOutput: {
      selectedSingle: { id: keys[0] ?? '' },
      ...commentField(output),
    },
  };
}

function mapImageResponse(output: RawRecord): RawRecord {
  const selected = asStringArray(output.selectedImageIds);
  if (selected.length > 1) {
    return {
      imageOutput: {
        selectedStrings: { values: selected },
        ...commentField(output),
      },
    };
  }
  return {
    imageOutput: {
      selectedString: selected[0] ?? '',
      ...commentField(output),
    },
  };
}

function mapUploadResponse(output: RawRecord): RawRecord {
  const files = Array.isArray(output.files)
    ? output.files
        .map((entry) => asRecord(entry))
        .filter((entry): entry is RawRecord => entry !== null)
        .map((entry) => ({
          name: asString(entry.name) ?? '',
          size: typeof entry.size === 'number' ? entry.size : 0,
          path: asString(entry.path) ?? '',
          mimeType: asString(entry.mimeType) ?? '',
        }))
    : [];

  return {
    uploadOutput: {
      files,
      ...commentField(output),
    },
  };
}

export function mapSubmitResponseToProto(request: ConfirmRequest, payload: SubmitResponsePayload): RawRecord {
  const output = asRecord(payload.output) ?? {};
  switch (request.widgetType) {
    case 'confirm':
      return mapConfirmResponse(output);
    case 'select':
      return mapSelectResponse(output);
    case 'form':
      return mapFormResponse(output);
    case 'table':
      return mapTableResponse(output);
    case 'image':
      return mapImageResponse(output);
    case 'upload':
      return mapUploadResponse(output);
    case 'script':
      return { scriptOutput: asRecord(output) ?? {} };
  }
}
