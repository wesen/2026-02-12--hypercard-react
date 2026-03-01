import type { ReflectionAPI, ReflectionResult, ReflectionSchemaRef } from './types';

/**
 * Given a selected API, return the set of schema IDs it references
 * via request_schema, response_schema, and error_schema.
 */
export function getCrossRefSchemaIds(api: ReflectionAPI | undefined): Set<string> {
  const ids = new Set<string>();
  if (!api) return ids;
  if (api.request_schema) ids.add(api.request_schema);
  if (api.response_schema) ids.add(api.response_schema);
  if (api.error_schema) ids.add(api.error_schema);
  return ids;
}

/**
 * Find an API by id within a reflection result.
 */
export function findApi(
  reflection: ReflectionResult | undefined,
  apiId: string | undefined,
): ReflectionAPI | undefined {
  if (!reflection || reflection._unsupported || !apiId) return undefined;
  return reflection.apis?.find((a) => a.id === apiId);
}

/**
 * Find a schema by id within a reflection result.
 */
export function findSchema(
  reflection: ReflectionResult | undefined,
  schemaId: string | undefined,
): ReflectionSchemaRef | undefined {
  if (!reflection || reflection._unsupported || !schemaId) return undefined;
  return reflection.schemas?.find((s) => s.id === schemaId);
}

/**
 * Check if a reflection result represents "unsupported" (501).
 */
export function isReflectionUnsupported(reflection: ReflectionResult | undefined): boolean {
  return reflection?._unsupported === true;
}
