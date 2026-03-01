import type { AppManifestDocument } from './types';

/**
 * Sort apps: unhealthy first, then required first, then name ascending.
 * This is the default sort order for all apps-browser views.
 */
export function sortApps(apps: AppManifestDocument[]): AppManifestDocument[] {
  return [...apps].sort((a, b) => {
    // Unhealthy first
    if (a.healthy !== b.healthy) return a.healthy ? 1 : -1;
    // Required first
    if (a.required !== b.required) return a.required ? -1 : 1;
    // Name ascending
    return a.name.localeCompare(b.name);
  });
}

export interface AppsSummaryStats {
  mounted: number;
  healthy: number;
  unhealthy: number;
  required: number;
  reflective: number;
}

export function computeSummaryStats(apps: AppManifestDocument[]): AppsSummaryStats {
  let healthy = 0;
  let required = 0;
  let reflective = 0;
  for (const app of apps) {
    if (app.healthy) healthy++;
    if (app.required) required++;
    if (app.reflection?.available) reflective++;
  }
  return {
    mounted: apps.length,
    healthy,
    unhealthy: apps.length - healthy,
    required,
    reflective,
  };
}

export function hasUnhealthyRequired(apps: AppManifestDocument[]): boolean {
  return apps.some((app) => app.required && !app.healthy);
}
