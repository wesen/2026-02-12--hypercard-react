import type { ConfirmRequest, SubmitResponsePayload, SubmitScriptEventPayload } from '@hypercard/confirm-runtime';
import { ConfirmRequestWindowHost } from '@hypercard/confirm-runtime';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

function cloneRequest(request: ConfirmRequest): ConfirmRequest {
  return JSON.parse(JSON.stringify(request)) as ConfirmRequest;
}

function createScriptRequest(
  id: string,
  scriptView: NonNullable<ConfirmRequest['scriptView']>,
  options?: { title?: string; message?: string },
): ConfirmRequest {
  return {
    id,
    sessionId: 'storybook',
    widgetType: 'script',
    title: options?.title ?? scriptView.title ?? 'Script request',
    message: options?.message,
    scriptView,
    input: {
      title: options?.title ?? scriptView.title ?? 'Script request',
      payload: {},
    },
  };
}

function ScriptHostHarness({
  initialRequest,
  onScriptEvent,
}: {
  initialRequest: ConfirmRequest;
  onScriptEvent?: (request: ConfirmRequest, payload: SubmitScriptEventPayload) => ConfirmRequest;
}) {
  const [request, setRequest] = useState<ConfirmRequest>(() => cloneRequest(initialRequest));
  const [lastResponse, setLastResponse] = useState<SubmitResponsePayload | null>(null);
  const [lastScriptEvent, setLastScriptEvent] = useState<SubmitScriptEventPayload | null>(null);

  return (
    <div style={{ width: 600, display: 'grid', gap: 8 }}>
      <ConfirmRequestWindowHost
        request={request}
        onSubmitResponse={(_requestId, payload) => setLastResponse(payload)}
        onSubmitScriptEvent={(_requestId, payload) => {
          setLastScriptEvent(payload);
          if (!onScriptEvent) {
            return;
          }
          setRequest((current) => onScriptEvent(current, payload));
        }}
      />
      <div data-part="card" style={{ padding: 8, display: 'grid', gap: 6 }}>
        <div data-part="field-label">Harness state</div>
        <div data-part="field-value">stepId: {request.scriptView?.stepId ?? 'n/a'}</div>
        <div data-part="field-value">widgetType: {request.scriptView?.widgetType ?? request.widgetType}</div>
        <div data-part="field-value">last script event:</div>
        <pre data-part="field-value" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(lastScriptEvent, null, 2)}
        </pre>
        <div data-part="field-value">last response payload:</div>
        <pre data-part="field-value" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(lastResponse, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const displaySection = {
  id: 'context',
  kind: 'display' as const,
  widgetType: 'display',
  input: {
    title: 'Operator context',
    format: 'markdown',
    content:
      'Release branch `main` is green.\n\n- staging passed\n- artifact hash: `sha256:example`\n- target window: 22:00 UTC',
  },
};

function firstStepRequest() {
  return createScriptRequest('story-script-step-confirm', {
    stepId: 'confirm',
    title: 'Deploy gate',
    description: 'Confirm whether to continue deployment.',
    widgetType: 'confirm',
    input: {
      title: 'Proceed with production deploy?',
      message: 'This action promotes release 1.2.3.',
      approveText: 'Proceed',
      rejectText: 'Abort',
    },
    sections: [
      displaySection,
      {
        id: 'confirm',
        kind: 'interactive',
        widgetType: 'confirm',
        input: {
          title: 'Proceed with production deploy?',
          message: 'This action promotes release 1.2.3.',
          approveText: 'Proceed',
          rejectText: 'Abort',
        },
      },
    ],
    progress: { current: 1, total: 2, label: 'Step 1 of 2' },
  });
}

function secondStepRequest() {
  return createScriptRequest('story-script-step-rating', {
    stepId: 'rate',
    title: 'Confidence check',
    description: 'Capture rollout confidence before final submit.',
    widgetType: 'rating',
    input: {
      title: 'Rate deployment confidence',
      style: 'stars',
      scale: 5,
      labels: { low: 'Low', high: 'High' },
      defaultValue: 4,
    },
    sections: [
      {
        id: 'context',
        kind: 'display',
        widgetType: 'display',
        input: {
          title: 'Review notes',
          format: 'text',
          content: 'Staging passed. One flaky integration test reran successfully.',
        },
      },
      {
        id: 'rating',
        kind: 'interactive',
        widgetType: 'rating',
        input: {
          title: 'Rate deployment confidence',
          style: 'stars',
          scale: 5,
          labels: { low: 'Low', high: 'High' },
          defaultValue: 4,
        },
      },
    ],
    allowBack: true,
    backLabel: 'Back to confirmation',
    progress: { current: 2, total: 2, label: 'Step 2 of 2' },
  });
}

const meta = {
  title: 'Apps/Inventory/ConfirmRuntime/CompositeScriptSections',
  component: ConfirmRequestWindowHost,
  tags: ['autodocs'],
} satisfies Meta<typeof ConfirmRequestWindowHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DisplayAndConfirmSection: Story = {
  render: () => <ScriptHostHarness initialRequest={firstStepRequest()} />,
};

export const DisplayAndSelectSection: Story = {
  render: () => (
    <ScriptHostHarness
      initialRequest={createScriptRequest('story-script-select', {
        stepId: 'select-targets',
        title: 'Target selection',
        description: 'Choose one or more rollout targets.',
        widgetType: 'select',
        input: {
          title: 'Select rollout targets',
          searchable: true,
          multi: true,
          options: [
            { value: 'staging', label: 'staging', description: 'pre-production' },
            { value: 'prod-us', label: 'prod-us', description: 'US region' },
            { value: 'prod-eu', label: 'prod-eu', description: 'EU region' },
          ],
        },
        sections: [
          displaySection,
          {
            id: 'select',
            kind: 'interactive',
            widgetType: 'select',
            input: {
              title: 'Select rollout targets',
              searchable: true,
              multi: true,
              options: ['staging', 'prod-us', 'prod-eu'],
            },
          },
        ],
        progress: { current: 1, total: 3, label: 'Step 1 of 3' },
      })}
    />
  ),
};

export const DisplayAndFormSection: Story = {
  render: () => (
    <ScriptHostHarness
      initialRequest={createScriptRequest('story-script-form', {
        stepId: 'collect-metadata',
        title: 'Change request details',
        description: 'Capture structured context before approval.',
        widgetType: 'form',
        input: {
          title: 'Release metadata',
          schema: {
            type: 'object',
            required: ['owner', 'window'],
            properties: {
              owner: { type: 'string', title: 'Owner' },
              window: { type: 'string', title: 'Deployment window' },
              risk: { type: 'string', title: 'Risk level', enum: ['low', 'medium', 'high'] },
              rollbackTested: { type: 'boolean', title: 'Rollback tested' },
            },
          },
        },
        sections: [
          displaySection,
          {
            id: 'form',
            kind: 'interactive',
            widgetType: 'form',
            input: {
              title: 'Release metadata',
              schema: {
                type: 'object',
                required: ['owner', 'window'],
                properties: {
                  owner: { type: 'string', title: 'Owner' },
                  window: { type: 'string', title: 'Deployment window' },
                  risk: { type: 'string', title: 'Risk level', enum: ['low', 'medium', 'high'] },
                  rollbackTested: { type: 'boolean', title: 'Rollback tested' },
                },
              },
            },
          },
        ],
        progress: { current: 2, total: 3, label: 'Step 2 of 3' },
      })}
    />
  ),
};

export const DisplayAndTableSection: Story = {
  render: () => (
    <ScriptHostHarness
      initialRequest={createScriptRequest('story-script-table', {
        stepId: 'choose-services',
        title: 'Service selection',
        description: 'Pick services to include in this deploy.',
        widgetType: 'table',
        input: {
          title: 'Service matrix',
          columns: ['id', 'env', 'status'],
          data: [
            { id: 'svc-orders', env: 'prod', status: 'healthy' },
            { id: 'svc-billing', env: 'prod', status: 'degraded' },
            { id: 'svc-fulfillment', env: 'staging', status: 'healthy' },
          ],
          searchable: true,
          multiSelect: true,
        },
        sections: [
          displaySection,
          {
            id: 'table',
            kind: 'interactive',
            widgetType: 'table',
            input: {
              title: 'Service matrix',
              columns: ['id', 'env', 'status'],
              data: [
                { id: 'svc-orders', env: 'prod', status: 'healthy' },
                { id: 'svc-billing', env: 'prod', status: 'degraded' },
                { id: 'svc-fulfillment', env: 'staging', status: 'healthy' },
              ],
              searchable: true,
              multiSelect: true,
            },
          },
        ],
        progress: { current: 2, total: 4, label: 'Step 2 of 4' },
      })}
    />
  ),
};

export const DisplayAndUploadSection: Story = {
  render: () => (
    <ScriptHostHarness
      initialRequest={createScriptRequest('story-script-upload', {
        stepId: 'attach-evidence',
        title: 'Attach evidence',
        description: 'Upload logs before continuing.',
        widgetType: 'upload',
        input: {
          title: 'Upload logs',
          multiple: true,
          maxSize: 10 * 1024 * 1024,
          accept: ['.log', 'text/plain'],
        },
        sections: [
          displaySection,
          {
            id: 'upload',
            kind: 'interactive',
            widgetType: 'upload',
            input: {
              title: 'Upload logs',
              multiple: true,
              maxSize: 10 * 1024 * 1024,
              accept: ['.log', 'text/plain'],
            },
          },
        ],
        progress: { current: 1, total: 2, label: 'Step 1 of 2' },
      })}
    />
  ),
};

export const DisplayAndImageSection: Story = {
  render: () => (
    <ScriptHostHarness
      initialRequest={createScriptRequest('story-script-image', {
        stepId: 'select-artifact',
        title: 'Artifact verification',
        description: 'Select the artifact screenshot that matches the release manifest.',
        widgetType: 'image',
        input: {
          title: 'Choose artifact preview',
          mode: 'select',
          multi: false,
          images: [
            { id: 'img-1', label: 'Artifact A', src: 'https://placehold.co/320x180/png?text=Artifact+A' },
            { id: 'img-2', label: 'Artifact B', src: 'https://placehold.co/320x180/png?text=Artifact+B' },
          ],
        },
        sections: [
          displaySection,
          {
            id: 'image',
            kind: 'interactive',
            widgetType: 'image',
            input: {
              title: 'Choose artifact preview',
              mode: 'select',
              multi: false,
              images: [
                { id: 'img-1', label: 'Artifact A', src: 'https://placehold.co/320x180/png?text=Artifact+A' },
                { id: 'img-2', label: 'Artifact B', src: 'https://placehold.co/320x180/png?text=Artifact+B' },
              ],
            },
          },
        ],
        progress: { current: 3, total: 4, label: 'Step 3 of 4' },
      })}
    />
  ),
};

export const BackAndProgressRating: Story = {
  render: () => (
    <ScriptHostHarness
      initialRequest={createScriptRequest('story-script-rating', {
        stepId: 'confidence',
        title: 'Confidence checkpoint',
        description: 'Validate back/progress affordances with rating control.',
        widgetType: 'rating',
        input: {
          title: 'Rate confidence in this deployment',
          scale: 5,
          style: 'stars',
          labels: { low: 'Not ready', high: 'Very ready' },
          defaultValue: 4,
        },
        allowBack: true,
        backLabel: 'Back to checklist',
        progress: { current: 2, total: 3, label: 'Step 2 of 3' },
      })}
    />
  ),
};

export const TwoStepConfirmThenRating: Story = {
  render: () => (
    <ScriptHostHarness
      initialRequest={firstStepRequest()}
      onScriptEvent={(request, payload) => {
        const stepId = request.scriptView?.stepId;
        if (payload.type === 'back' && stepId === 'rate') {
          return firstStepRequest();
        }
        if (payload.type === 'submit' && stepId === 'confirm') {
          if (payload.data?.approved === true) {
            return secondStepRequest();
          }
          return firstStepRequest();
        }
        if (payload.type === 'submit' && stepId === 'rate') {
          return createScriptRequest('story-script-complete', {
            stepId: 'done',
            title: 'Flow complete',
            description: `Captured rating ${String(payload.data?.value ?? 'n/a')}.`,
            widgetType: 'confirm',
            input: {
              title: 'Flow complete',
              message: 'You can hit Reject to return to rating and adjust.',
              approveText: 'Keep complete',
              rejectText: 'Adjust rating',
            },
            allowBack: true,
            backLabel: 'Back to confidence',
            progress: { current: 2, total: 2, label: 'Step 2 of 2' },
          });
        }
        if (payload.type === 'back' && stepId === 'done') {
          return secondStepRequest();
        }
        if (payload.type === 'submit' && stepId === 'done' && payload.data?.approved !== true) {
          return secondStepRequest();
        }
        return request;
      }}
    />
  ),
};

export const InvalidSectionsContract: Story = {
  render: () => (
    <ScriptHostHarness
      initialRequest={createScriptRequest('story-script-invalid-sections', {
        stepId: 'invalid',
        title: 'Invalid section contract demo',
        description: 'This intentionally contains two interactive sections.',
        widgetType: 'confirm',
        input: { title: 'Invalid' },
        sections: [
          {
            id: 'interactive-a',
            kind: 'interactive',
            widgetType: 'confirm',
            input: { title: 'A', message: 'First interactive section' },
          },
          {
            id: 'interactive-b',
            kind: 'interactive',
            widgetType: 'select',
            input: { title: 'B', options: ['one', 'two'] },
          },
        ],
      })}
    />
  ),
};
