import { MOCK_APPS_DEFAULT, MOCK_GEPA_REFLECTION } from '../fixtures/apps';
import { type AppsHandlerData, createAppsHandlers } from './createAppsHandlers';

export const defaultAppsHandlerData: AppsHandlerData = {
  apps: MOCK_APPS_DEFAULT,
  reflections: { gepa: MOCK_GEPA_REFLECTION },
  unsupportedReflection: ['inventory'],
};

export function createDefaultAppsHandlers(
  dataOverrides: Partial<AppsHandlerData> = {},
  options: { delayMs?: number } = {},
) {
  return createAppsHandlers({
    data: { ...defaultAppsHandlerData, ...dataOverrides },
    delayMs: options.delayMs,
  });
}

export const defaultHandlers = createDefaultAppsHandlers();
