// --- API response types (match live /api/os/apps payloads) ---

export interface AppsManifestResponse {
  apps: AppManifestDocument[];
}

export interface AppManifestDocument {
  app_id: string;
  name: string;
  description?: string;
  required: boolean;
  capabilities?: string[];
  reflection?: {
    available: boolean;
    url?: string;
    version?: string;
  };
  healthy: boolean;
  health_error?: string;
}

// --- Reflection response (GET /api/os/apps/{id}/reflection) ---

export interface ModuleReflectionDocument {
  app_id: string;
  name: string;
  version?: string;
  summary?: string;
  capabilities?: ReflectionCapability[];
  docs?: ReflectionDocLink[];
  apis?: ReflectionAPI[];
  schemas?: ReflectionSchemaRef[];
}

export interface ReflectionCapability {
  id: string;
  stability?: string;
  description?: string;
}

export interface ReflectionDocLink {
  id: string;
  title: string;
  url?: string;
  path?: string;
  description?: string;
}

export interface ReflectionAPI {
  id: string;
  method: string;
  path: string;
  summary?: string;
  request_schema?: string;
  response_schema?: string;
  error_schema?: string;
  tags?: string[];
}

export interface ReflectionSchemaRef {
  id: string;
  format: string;
  uri?: string;
  embedded?: unknown;
}

// --- Reflection response with unsupported sentinel ---

export type ReflectionResult =
  | (ModuleReflectionDocument & { _unsupported?: false })
  | { _unsupported: true; app_id: string };
