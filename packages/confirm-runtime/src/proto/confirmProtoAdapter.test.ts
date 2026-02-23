import { describe, expect, it } from 'vitest';
import { mapRealtimeEventFromProto, mapSubmitResponseToProto, mapUIRequestFromProto } from './confirmProtoAdapter';
import type { ConfirmRequest } from '../types';

describe('confirmProtoAdapter', () => {
  it('maps protojson UIRequest into runtime request', () => {
    const request = mapUIRequestFromProto({
      id: 'req-1',
      type: 'confirm',
      sessionId: 'global',
      confirmInput: {
        title: 'Deploy now?',
        message: 'Release 1.2.3',
      },
      status: 'pending',
    });

    expect(request).not.toBeNull();
    expect(request?.widgetType).toBe('confirm');
    expect(request?.title).toBe('Deploy now?');
    expect(request?.input?.payload?.title).toBe('Deploy now?');
  });

  it('maps websocket event with embedded request', () => {
    const event = mapRealtimeEventFromProto({
      type: 'new_request',
      request: {
        id: 'req-2',
        type: 'select',
        sessionId: 'global',
        selectInput: {
          title: 'Pick env',
          options: ['staging', 'prod'],
        },
        status: 'pending',
      },
    });

    expect(event).not.toBeNull();
    expect(event?.type).toBe('new_request');
    expect(event?.request?.widgetType).toBe('select');
  });

  it('encodes confirm response into proto oneof payload', () => {
    const request: ConfirmRequest = {
      id: 'req-3',
      sessionId: 'global',
      widgetType: 'confirm',
      input: { payload: {} },
    };

    const payload = mapSubmitResponseToProto(request, {
      output: { approved: true, comment: 'ship it' },
    });

    expect(payload).toEqual({
      confirmOutput: {
        approved: true,
        comment: 'ship it',
      },
    });
  });

  it('encodes select multi response into proto oneof payload', () => {
    const request: ConfirmRequest = {
      id: 'req-4',
      sessionId: 'global',
      widgetType: 'select',
      input: { payload: {} },
    };

    const payload = mapSubmitResponseToProto(request, {
      output: { selectedIds: ['staging', 'prod'] },
    });

    expect(payload).toEqual({
      selectOutput: {
        selectedMulti: {
          values: ['staging', 'prod'],
        },
      },
    });
  });
});
