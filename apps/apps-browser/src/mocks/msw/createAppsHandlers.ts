import { HttpResponse, http } from 'msw';
import type { AppManifestDocument, ModuleReflectionDocument } from '../../domain/types';

export interface AppsHandlerData {
  apps: AppManifestDocument[];
  reflections: Record<string, ModuleReflectionDocument>;
  unsupportedReflection: string[];
}

export interface CreateAppsHandlersOptions {
  data: AppsHandlerData;
  delayMs?: number;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createAppsHandlers(options: CreateAppsHandlersOptions) {
  const { data, delayMs = 0 } = options;

  return [
    http.get('/api/os/apps', async () => {
      if (delayMs > 0) await wait(delayMs);
      return HttpResponse.json({ apps: data.apps });
    }),

    http.get('/api/os/apps/:appId/reflection', async ({ params }) => {
      if (delayMs > 0) await wait(delayMs);
      const appId = String(params.appId);

      if (!data.apps.some((a) => a.app_id === appId)) {
        return HttpResponse.text('app not found', { status: 404 });
      }

      if (data.unsupportedReflection.includes(appId)) {
        return HttpResponse.text('reflection not implemented', { status: 501 });
      }

      const doc = data.reflections[appId];
      if (!doc) {
        return HttpResponse.text('reflection not implemented', { status: 501 });
      }
      return HttpResponse.json(doc);
    }),
  ];
}
