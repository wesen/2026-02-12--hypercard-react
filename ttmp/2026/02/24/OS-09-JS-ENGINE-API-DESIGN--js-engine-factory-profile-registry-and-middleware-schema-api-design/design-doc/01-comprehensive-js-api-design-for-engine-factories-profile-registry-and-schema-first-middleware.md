---
Title: Comprehensive JS API design for engine factories profile registry and schema-first middleware
Ticket: OS-09-JS-ENGINE-API-DESIGN
Status: active
Topics:
    - go-go-os
    - javascript
    - api-design
    - middleware
    - profiles
    - engine
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-go-os/go-inventory-chat/cmd/go-go-os-launcher/inventory_backend_module.go
      Note: API route mounting and middleware schema endpoint registration
    - Path: go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main.go
      Note: In-memory profile registry bootstrap and default middleware usage
    - Path: go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go
      Note: |-
        End-to-end profile version/runtime-key behavior coverage
        Integration coverage for profile/runtime behavior
    - Path: go-go-os/go-inventory-chat/internal/pinoweb/middleware_definitions.go
      Note: Current middleware definition interface and JSON schema registration
    - Path: go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go
      Note: |-
        Runtime override rejection and profile selection resolution chain
        Resolver safety rules and profile selection chain
    - Path: go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go
      Note: |-
        Backend runtime composition and middleware resolution/validation
        Backend runtime composition and middleware validation
    - Path: go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Current profile selector UI integration and per-conversation usage
    - Path: go-go-os/packages/engine/src/chat/runtime/conversationManager.ts
      Note: Current singleton manager pattern and module bootstrap entrypoint
    - Path: go-go-os/packages/engine/src/chat/runtime/profileApi.ts
      Note: |-
        Current JS profile API client surface and schema catalog decoding
        Current frontend profile and schema catalog API
    - Path: go-go-os/packages/engine/src/chat/runtime/profileTypes.ts
      Note: Current frontend profile and middleware schema TypeScript contracts
    - Path: go-go-os/packages/engine/src/chat/runtime/useConversation.ts
      Note: |-
        Current conversation connect/send with profile selection propagation
        Profile selection propagated into conversation transport
    - Path: go-go-os/packages/engine/src/chat/runtime/useProfiles.ts
      Note: Current profile refresh and selection reconciliation logic
    - Path: go-go-os/packages/engine/src/chat/ws/wsManager.ts
      Note: |-
        Current websocket URL profile+registry query serialization
        Profile+registry websocket query serialization
ExternalSources: []
Summary: Proposes an elegant JavaScript API for engine instantiation via profile registries and schema-declared middleware, aligned with current go-go-os frontend/backend behavior and constraints.
LastUpdated: 2026-02-25T22:02:00-05:00
WhatFor: Define a stable, ergonomic, and composable JS API for creating runtime engines, applying profile defaults, and safely overriding middleware/settings.
WhenToUse: Use when implementing new runtime entrypoints, middleware plugins, profile-based assistants, or app-specific engine factories.
---


# Comprehensive JS API design for engine factories profile registry and schema-first middleware

## Executive summary

This document proposes a first-class JavaScript runtime API that makes three workflows straightforward:

1. Instantiate runtime engines from a profile registry.
2. Override middleware/settings per instance without hand-merging JSON.
3. Declare JS middleware using explicit schemas with typed runtime hooks.

The design is intentionally aligned with the current stack:

1. Frontend already has profile CRUD + schema catalog client APIs (`profileApi.ts`) and per-conversation profile selection wiring.
2. Backend already resolves profiles, composes runtime settings, validates middleware config against schemas, and rejects unsafe runtime overrides.
3. What is missing is a coherent, elegant JS abstraction that unifies these capabilities for app developers.

The proposal introduces five core primitives:

1. `createProfileRegistry()` for registry/profile/middleware declaration.
2. `defineMiddleware()` for schema-first middleware authoring.
3. `createEngineFactory()` for constructing runtime engines from profiles plus layered overrides.
4. `middlewarePatch()` fluent builder for per-instance middleware edits.
5. `createProfileClient()` to bridge local runtime and remote profile APIs.

Design outcomes:

1. Common path is one line: `factory.create("inventory")`.
2. Advanced path is explicit and deterministic: `factory.create("inventory", { middleware: ... })`.
3. Schema validation happens before engine execution.
4. Merge order is fixed and observable.
5. API remains composable across launcher modules, standalone apps, and backend-hosted routes.

## Problem statement and scope

### Problem

Today, the codebase has strong profile and middleware capabilities, but they are split across multiple layers and exposed to JS in a piecemeal way:

1. Frontend can list/select/create/update profiles and decode middleware schema catalogs.
2. Backend can resolve profile selection, build runtime middleware chains, and apply profile `step_settings_patch`.
3. There is no explicit JS-level “engine factory + profile registry + middleware override” API that developers can use directly.

This creates friction:

1. API consumers must understand backend implementation details to reason about runtime behavior.
2. Per-instance overrides are ad hoc.
3. Middleware authoring conventions are not unified in JS.
4. The concept of “runtime middleware” can be conflated with Redux middleware unless APIs are named and scoped clearly.

### Scope

In scope:

1. JS/TS API surface design.
2. Profile registry declaration model.
3. Middleware declaration model with schema.
4. Engine instantiation and override semantics.
5. Interop contract with existing frontend profile APIs and backend runtime composer.
6. Test strategy and phased implementation plan.

Out of scope:

1. Replacing existing backend resolver/runtime composer logic.
2. Altering profile storage backend semantics.
3. Replacing existing chat timeline and websocket protocols.
4. Building a brand new DSL for card runtime or Redux internals.

## Current-state architecture (evidence-based)

### 1) Frontend already has a profile API client and schema catalog support

`packages/engine/src/chat/runtime/profileApi.ts` already exposes:

1. Profile CRUD and current-profile endpoints.
2. Middleware schema catalog retrieval (`listMiddlewareSchemas`).
3. Extension schema catalog retrieval (`listExtensionSchemas`).

Evidence:

1. `listProfiles`/`getProfile`/`createProfile`/`updateProfile`/`deleteProfile`/`setDefaultProfile` at [profileApi.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/profileApi.ts:237).
2. `getCurrentProfile` and `setCurrentProfile` at [profileApi.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/profileApi.ts:334).
3. `listMiddlewareSchemas` at [profileApi.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/profileApi.ts:356).
4. `listExtensionSchemas` at [profileApi.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/profileApi.ts:364).

### 2) Frontend state and chat runtime already propagate profile selection

Profile selection is stored in Redux and propagated into websocket + POST send flows.

Evidence:

1. `ChatProfilesState` has `selectedProfile` and `selectedRegistry` at [profileSlice.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/state/profileSlice.ts:4).
2. `useProfiles` resolves current selection/fallback/default behavior at [useProfiles.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useProfiles.ts:27).
3. `useConversation` passes selection to `conversationManager.connect/send` at [useConversation.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useConversation.ts:35).
4. websocket URL serializes `profile` and `registry` query params in [wsManager.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/ws/wsManager.ts:71).
5. HTTP send adds `profile`/`registry` fields in [http.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/http.ts:34).

### 3) Launcher inventory integration already uses namespaced API prefixes and profile selector

Evidence:

1. Inventory chat window passes `basePrefix={INVENTORY_API_BASE_PREFIX}` and `profileRegistry="default"` in [renderInventoryApp.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx:473).

This means an engine factory API should preserve namespaced base routing and registry awareness as first-class inputs.

### 4) Backend runtime composition already includes profile middleware resolution + validation

Evidence:

1. Composer applies profile `StepSettingsPatch`, system prompt, tools, and middleware resolution in [runtime_composer.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:69).
2. Resolver normalizes middleware config to object and validates via definition schema pipeline in [runtime_composer.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:155).
3. Runtime override requests are rejected (`runtime overrides are not allowed`) at [runtime_composer.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:77).

### 5) Backend middleware definitions are already schema-first

Evidence:

1. `inventoryMiddlewareDefinition` exposes `ConfigJSONSchema()` and `Build(...)` in [middleware_definitions.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/middleware_definitions.go:14).
2. Example middleware definitions include explicit schemas (`type: object`, properties, additionalProperties) at [middleware_definitions.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/middleware_definitions.go:79).

### 6) Request resolver has clear profile selection precedence and safety guards

Evidence:

1. Chat rejects `overrides` payload in [request_resolver.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go:97).
2. Selection chain considers request body, query params, cookie, and defaults in [request_resolver.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go:147).

### 7) Profile runtime/version behavior has e2e coverage

Evidence:

1. Runtime request includes default middlewares from selected profile in [main_integration_test.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go:435).
2. Profile selection changes reflected in runtime key in [main_integration_test.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go:636).
3. Runtime version increments after profile update in [main_integration_test.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go:917).

### 8) Gap: no first-class JS engine factory/profile registry/middleware authoring API

Repository search for `createEngineFactory`, `createProfileRegistry`, `defineMiddleware`, `EngineFactory` across `packages/engine/src` and `packages/desktop-os/src` returns no results.

Interpretation:

1. The raw primitives exist.
2. The ergonomic JS API requested by product/developers does not yet exist.

## Gap analysis against requested outcomes

Requested outcomes:

1. Elegant API to instantiate new engines from profile registry.
2. Elegant API to overload middleware/settings per call.
3. API to declare JS middleware with schema.
4. Strong composability with current frontend/backend model.

Gaps:

1. Frontend profile APIs are transport-centric, not engine-centric.
2. Profile data shape is exposed, but override semantics are not centralized.
3. Middleware schema catalog is read-only on JS side; authoring contract is implicit.
4. No explicit merge precedence model in JS.
5. No middleware patch builder abstraction for safe overrides.

## Design goals

1. Keep common path short and obvious.
2. Make advanced override behavior explicit and deterministic.
3. Preserve backend safety defaults (e.g., runtime override controls).
4. Separate runtime middleware from Redux middleware by naming and package boundaries.
5. Support both local registries and backend-backed profile catalogs.
6. Be incrementally adoptable by current inventory/launcher integration.

## Proposed architecture

### Package surface

Proposed additions under `packages/engine/src/runtime-factory`:

1. `profiles/registry.ts`
2. `profiles/types.ts`
3. `middleware/defineMiddleware.ts`
4. `middleware/patchBuilder.ts`
5. `factory/createEngineFactory.ts`
6. `factory/types.ts`
7. `factory/errors.ts`
8. `transport/profileClient.ts` (optional bridge wrapper around current `profileApi.ts`)

Public exports from `packages/engine/src/chat/index.ts` or `packages/engine/src/index.ts` (final location is an implementation detail; API shape is the key decision).

### Core concepts

1. `ProfileRegistry`: declarative profile and middleware inventory.
2. `MiddlewareDefinition`: schema + setup hooks.
3. `EngineFactory`: runtime constructor with deterministic merge order.
4. `MiddlewarePatch`: fluent mutation model for per-instance customization.
5. `ProfileClient`: optional HTTP-backed profile source and persistence layer.

## API design

### 1) Profile registry API

```ts
// runtime-factory/profiles/types.ts
export type ProfileId = string;
export type RegistryId = string;

export interface RuntimeProfileSpec {
  id: ProfileId;
  displayName?: string;
  description?: string;
  runtime?: {
    systemPrompt?: string;
    tools?: string[];
    stepSettingsPatch?: Record<string, unknown>;
    middlewares?: MiddlewareUseSpec[];
  };
  policy?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  metadata?: {
    version?: number;
    tags?: string[];
  };
}

export interface MiddlewareUseSpec {
  name: string;
  id?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export interface ProfileRegistry {
  registryId: RegistryId;
  defaultProfileId: ProfileId | null;
  listProfiles(): RuntimeProfileSpec[];
  getProfile(id: ProfileId): RuntimeProfileSpec | undefined;
}
```

```ts
// runtime-factory/profiles/registry.ts
export interface CreateProfileRegistryOptions {
  registryId?: RegistryId;
  defaultProfileId?: ProfileId;
}

export interface MutableProfileRegistry extends ProfileRegistry {
  setDefaultProfile(id: ProfileId): this;
  registerProfile(profile: RuntimeProfileSpec): this;
  upsertProfile(profile: RuntimeProfileSpec): this;
  removeProfile(id: ProfileId): this;
  registerMiddleware(definition: MiddlewareDefinition<any>): this;
  getMiddleware(name: string): MiddlewareDefinition<any> | undefined;
  listMiddlewares(): MiddlewareDefinition<any>[];
}

export function createProfileRegistry(
  options: CreateProfileRegistryOptions = {}
): MutableProfileRegistry;
```

### 2) Engine factory API

```ts
// runtime-factory/factory/types.ts
export interface EngineFactoryDefaults {
  transport?: {
    baseUrl?: string;
    wsUrl?: string;
    headers?: Record<string, string>;
  };
  runtime?: {
    model?: string;
    systemPrompt?: string;
    tools?: string[];
    stepSettings?: Record<string, unknown>;
    middlewares?: MiddlewareUseSpec[];
  };
}

export interface CreateEngineFactoryOptions {
  registry: ProfileRegistry;
  defaults?: EngineFactoryDefaults;
  resolver?: ProfileResolver;
  middlewareResolver?: MiddlewareResolver;
}

export type CreateEngineInput =
  | ProfileId
  | {
      profile: ProfileId;
      registry?: RegistryId;
      variant?: string;
      runtime?: Partial<EngineFactoryDefaults["runtime"]>;
      middleware?: MiddlewarePatchInput;
      context?: Record<string, unknown>;
      allowRuntimeOverrides?: boolean;
    };

export interface EngineFactory {
  create(input: CreateEngineInput, overrides?: Omit<Exclude<CreateEngineInput, string>, "profile">): Promise<ComposedEngine>;
  warm(profile: ProfileId): Promise<void>;
  listProfiles(): RuntimeProfileSpec[];
}
```

```ts
// runtime-factory/factory/createEngineFactory.ts
export function createEngineFactory(options: CreateEngineFactoryOptions): EngineFactory;
```

### 3) Middleware declaration API (schema-first)

```ts
// runtime-factory/middleware/defineMiddleware.ts
export interface MiddlewareContext {
  logger: {
    debug(msg: string, data?: Record<string, unknown>): void;
    warn(msg: string, data?: Record<string, unknown>): void;
    error(msg: string, data?: Record<string, unknown>): void;
  };
  profile?: RuntimeProfileSpec;
  conversation?: {
    id: string;
  };
}

export interface RuntimeMiddlewareHooks {
  onRequest?: (ctx: MiddlewareExecutionContext, next: () => Promise<void>) => Promise<void>;
  onResponse?: (ctx: MiddlewareExecutionContext, next: () => Promise<void>) => Promise<void>;
  onError?: (ctx: MiddlewareExecutionContext, error: unknown, next: () => Promise<void>) => Promise<void>;
}

export interface MiddlewareDefinition<TConfig extends Record<string, unknown>> {
  name: string;
  version: number;
  displayName?: string;
  description?: string;
  schema: Record<string, unknown>;
  defaults?: Partial<TConfig>;
  setup(args: { config: TConfig; ctx: MiddlewareContext }): RuntimeMiddlewareHooks;
}

export function defineMiddleware<TConfig extends Record<string, unknown>>(
  definition: MiddlewareDefinition<TConfig>
): MiddlewareDefinition<TConfig>;
```

### 4) Middleware patch builder API

```ts
// runtime-factory/middleware/patchBuilder.ts
export interface MiddlewarePatchBuilder {
  append(use: MiddlewareUseSpec): this;
  prepend(use: MiddlewareUseSpec): this;
  replace(nameOrId: string, use: MiddlewareUseSpec): this;
  configure(nameOrId: string, partialConfig: Record<string, unknown>): this;
  enable(nameOrId: string): this;
  disable(nameOrId: string): this;
  remove(nameOrId: string): this;
  build(): MiddlewarePatch;
}

export type MiddlewarePatchInput =
  | MiddlewarePatch
  | ((builder: MiddlewarePatchBuilder) => MiddlewarePatchBuilder);

export interface MiddlewarePatch {
  operations: Array<
    | { op: "append"; use: MiddlewareUseSpec }
    | { op: "prepend"; use: MiddlewareUseSpec }
    | { op: "replace"; target: string; use: MiddlewareUseSpec }
    | { op: "configure"; target: string; partialConfig: Record<string, unknown> }
    | { op: "enable"; target: string }
    | { op: "disable"; target: string }
    | { op: "remove"; target: string }
  >;
}

export function middlewarePatch(): MiddlewarePatchBuilder;
```

## Merge and precedence model

Deterministic merge order:

1. Factory defaults.
2. Registry profile defaults.
3. Variant defaults (if resolver provides variant).
4. Per-call runtime overrides.
5. Middleware patch operations.
6. Final schema validation and normalization.

Rules:

1. Objects merge shallow by default, with explicit deep merge only for `stepSettings` and middleware config objects.
2. Arrays are replace-on-write except middleware list, which is patch-driven.
3. If `allowRuntimeOverrides` is false, runtime-level overrides except middleware patch are rejected.
4. If patch references unknown middleware, throw structured error.

## Error model

```ts
export class EngineFactoryError extends Error {
  code:
    | "PROFILE_NOT_FOUND"
    | "MIDDLEWARE_NOT_FOUND"
    | "SCHEMA_VALIDATION_FAILED"
    | "OVERRIDE_NOT_ALLOWED"
    | "MERGE_CONFLICT"
    | "TRANSPORT_ERROR";
  details?: Record<string, unknown>;
}
```

Example error payload:

```json
{
  "code": "SCHEMA_VALIDATION_FAILED",
  "message": "middleware retry config invalid at /maxAttempts",
  "details": {
    "middleware": "retry",
    "path": "/maxAttempts",
    "expected": "integer >= 1"
  }
}
```

## End-to-end usage examples

### Example A: simplest path

```ts
const registry = createProfileRegistry({ registryId: "default" })
  .registerProfile({
    id: "inventory",
    displayName: "Inventory",
    runtime: {
      systemPrompt: "You are an inventory assistant.",
      tools: ["inventory.list", "inventory.search"],
      middlewares: [
        { name: "inventory_artifact_policy", id: "artifact-policy" },
        { name: "inventory_suggestions_policy", id: "suggestions-policy" },
      ],
    },
  })
  .setDefaultProfile("inventory");

const factory = createEngineFactory({ registry });
const engine = await factory.create("inventory");
```

### Example B: app-scoped factory with namespaced transport

```ts
const inventoryFactory = createEngineFactory({
  registry,
  defaults: {
    transport: {
      baseUrl: "/api/apps/inventory",
      wsUrl: "/api/apps/inventory/ws",
    },
  },
});

const engine = await inventoryFactory.create({
  profile: "analyst",
  context: { convId: "conv-123" },
});
```

### Example C: middleware override with fluent patch

```ts
const engine = await inventoryFactory.create("inventory", {
  middleware: (m) =>
    m
      .configure("inventory_artifact_policy", {
        instructions: "Prefer concise inventory summary bullets."
      })
      .append({
        name: "telemetry",
        id: "trace-1",
        config: { level: "debug", includePrompt: false }
      }),
});
```

### Example D: temporary hardened mode for one request

```ts
const engine = await inventoryFactory.create({
  profile: "inventory",
  allowRuntimeOverrides: true,
  runtime: {
    systemPrompt: "You are in strict validation mode.",
    tools: ["inventory.list"],
  },
  middleware: (m) =>
    m
      .disable("inventory_suggestions_policy")
      .append({
        name: "guardrails",
        config: { maxTokens: 800, disallowMarkdownTables: true },
      }),
});
```

### Example E: direct profile variant selection

```ts
const engine = await inventoryFactory.create({
  profile: "inventory",
  variant: "fast",
});
```

Where resolver semantics could map `variant: fast` to:

1. model: lightweight model.
2. reduced middleware chain.
3. shorter max output.

### Example F: create-from-remote profile then locally patch

```ts
const client = createProfileClient({ basePrefix: "/api/apps/inventory" });
const remoteRegistry = await client.fetchRegistry("default");

const factory = createEngineFactory({ registry: remoteRegistry });

const engine = await factory.create("planner", {
  middleware: (m) => m.configure("inventory_suggestions_policy", {
    instructions: "Favor operational next steps."
  }),
});
```

### Example G: explicit no-runtime-overrides policy

```ts
const factory = createEngineFactory({
  registry,
  defaults: {
    runtime: {
      middlewares: [{ name: "policy-lock" }],
    },
  },
});

await factory.create({
  profile: "inventory",
  allowRuntimeOverrides: false,
  runtime: {
    systemPrompt: "try override",
  },
});
// throws EngineFactoryError(code="OVERRIDE_NOT_ALLOWED")
```

### Example H: deterministic middleware order preview (for debug tooling)

```ts
const plan = await factory.create({
  profile: "inventory",
  middleware: (m) =>
    m
      .prepend({ name: "request-id" })
      .replace("inventory_artifact_policy", {
        name: "inventory_artifact_policy",
        id: "artifact-policy-v2",
      }),
});

console.log(plan.debug.resolvedMiddlewares);
```

## Declaring JS middleware with schema

### Baseline middleware

```ts
import { defineMiddleware } from "@hypercard/engine/runtime-factory";

type RetryConfig = {
  maxAttempts: number;
  baseDelayMs: number;
  retryOn: number[];
};

export const retryMiddleware = defineMiddleware<RetryConfig>({
  name: "retry",
  version: 1,
  displayName: "Retry",
  description: "Retries transient transport failures.",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      maxAttempts: { type: "integer", minimum: 1, maximum: 10, default: 3 },
      baseDelayMs: { type: "integer", minimum: 0, default: 200 },
      retryOn: {
        type: "array",
        items: { type: "integer" },
        default: [408, 429, 500, 502, 503, 504],
      },
    },
  },
  defaults: {
    maxAttempts: 3,
    baseDelayMs: 200,
    retryOn: [408, 429, 500, 502, 503, 504],
  },
  setup({ config, ctx }) {
    return {
      async onRequest(reqCtx, next) {
        let attempt = 0;
        while (true) {
          try {
            await next();
            return;
          } catch (err: any) {
            attempt += 1;
            const status = Number(err?.status ?? 0);
            const canRetry = attempt < config.maxAttempts && config.retryOn.includes(status);
            if (!canRetry) throw err;
            await new Promise((r) => setTimeout(r, config.baseDelayMs * attempt));
            ctx.logger.debug("retry", { attempt, status });
          }
        }
      },
    };
  },
});
```

### Middleware with extension schema export

```ts
type SuggestionsConfig = {
  instructions?: string;
  fallbackItems?: string[];
};

export const suggestionsPolicy = defineMiddleware<SuggestionsConfig>({
  name: "inventory_suggestions_policy",
  version: 1,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      instructions: { type: "string" },
      fallbackItems: {
        type: "array",
        items: { type: "string" },
        default: [],
      },
    },
  },
  setup({ config }) {
    return {
      async onResponse(ctx, next) {
        await next();
        ctx.extensions["inventory.starter_suggestions@v1"] = {
          items: config.fallbackItems ?? [],
        };
      },
    };
  },
});
```

### Schema validation behavior example

```ts
await factory.create("inventory", {
  middleware: (m) =>
    m.configure("retry", {
      maxAttempts: "many", // invalid type
    }),
});

// throws EngineFactoryError {
//   code: "SCHEMA_VALIDATION_FAILED",
//   details: { middleware: "retry", path: "/maxAttempts" }
// }
```

### Middleware composition example

```ts
registry
  .registerMiddleware(retryMiddleware)
  .registerMiddleware(suggestionsPolicy)
  .registerProfile({
    id: "inventory",
    runtime: {
      middlewares: [
        { name: "retry", config: { maxAttempts: 2 } },
        { name: "inventory_suggestions_policy", config: { fallbackItems: ["Show low stock"] } },
      ],
    },
  });
```

## Backend interoperability mapping

### Mapping table

| JS API concept | Current backend concept | Evidence |
|---|---|---|
| `ProfileRegistry` | `gepprofiles.Registry` | [main.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main.go:245) |
| `MiddlewareDefinition` | `middlewarecfg.Definition` | [middleware_definitions.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/middleware_definitions.go:14) |
| Runtime compose | `RuntimeComposer.Compose` | [runtime_composer.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:69) |
| Selection chain | strict resolver + cookie/query/body/default | [request_resolver.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go:147) |
| Schema catalog endpoints | `RegisterProfileAPIHandlers` with middleware definitions | [inventory_backend_module.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/inventory_backend_module.go:89) |

### Compatibility constraints

1. The JS factory should not bypass backend resolver policies by default.
2. If backend forbids runtime overrides, JS should mirror that via `allowRuntimeOverrides` default false.
3. Middleware names/versions must remain stable for profile persistence and e2e assertions.

## Proposed transport-facing API (optional but recommended)

```ts
export interface ProfileClient {
  listProfiles(registry?: string): Promise<ChatProfileListItem[]>;
  getProfile(slug: string, registry?: string): Promise<ChatProfileDocument>;
  createProfile(doc: Record<string, unknown>): Promise<ChatProfileDocument>;
  updateProfile(slug: string, doc: Record<string, unknown>): Promise<ChatProfileDocument>;
  deleteProfile(slug: string, opts?: { registry?: string; expectedVersion?: number }): Promise<void>;
  getCurrentProfile(): Promise<ChatCurrentProfilePayload>;
  setCurrentProfile(slug: string): Promise<ChatCurrentProfilePayload>;
  listMiddlewareSchemas(): Promise<ChatMiddlewareSchemaDocument[]>;
  listExtensionSchemas(): Promise<ChatExtensionSchemaDocument[]>;
  fetchRegistry(registry: string): Promise<ProfileRegistry>;
}

export function createProfileClient(opts: { basePrefix: string; fetchImpl?: typeof fetch }): ProfileClient;
```

This can be implemented as a thin facade on existing `profileApi.ts` exports.

## Observability and debugging contract

Factory output should include optional debug metadata:

```ts
export interface ComposedEngine {
  engine: unknown;
  runtimeKey: string;
  runtimeFingerprint: string;
  debug?: {
    profileId: string;
    registryId: string;
    profileVersion?: number;
    resolvedSystemPrompt: string;
    resolvedTools: string[];
    resolvedMiddlewares: MiddlewareUseSpec[];
    mergeLayers: Array<{ layer: string; applied: boolean; details?: string }>;
  };
}
```

Rationale:

1. Mirrors backend runtime fingerprint concept.
2. Simplifies parity checks between frontend selection and backend runtime state.
3. Improves incident triage when middleware chains differ from expectation.

## Security and policy considerations

1. Do not execute arbitrary middleware config logic before schema validation.
2. Treat schema defaults as non-authoritative for policy-sensitive fields; allow policy layer to enforce hard caps.
3. Enforce read-only profile policy in transport client path, preserving backend behavior.
4. Keep profile mutation endpoints opt-in in UI contexts that should be read-only.

## Testing and validation strategy

### Unit tests

1. Registry behavior:
   - register/upsert/remove/default profile semantics.
2. Middleware builder:
   - operation ordering and determinism.
3. Merge precedence:
   - defaults/profile/variant/overrides/patch final result.
4. Validation:
   - schema success/failure path details.

### Integration tests

1. Build engine from local registry and verify resolved middleware config.
2. Build engine from remote profile client and verify parity with `listProfiles` and `getProfile`.
3. Verify `allowRuntimeOverrides=false` rejects runtime fields but allows safe patch operations if policy permits.

### E2E parity tests (existing stack)

1. Assert runtime key selection still matches profile changes (same intent as current e2e tests).
2. Assert version increments rebuild runtime.
3. Assert middleware schema mismatch errors are surfaced with path context.

## Phased implementation plan

### Phase 1: contracts and local registry

1. Add TS contracts for registry, middleware definition, factory inputs/outputs.
2. Implement in-memory `createProfileRegistry`.
3. Add basic `defineMiddleware` helper with schema validation hook.

### Phase 2: engine factory and patch builder

1. Implement merge pipeline with deterministic layer ordering.
2. Implement `middlewarePatch()` fluent builder.
3. Add structured error model (`EngineFactoryError`).

### Phase 3: transport bridge

1. Add `createProfileClient` facade around existing `profileApi.ts`.
2. Add `fetchRegistry` adapter that turns profile docs + schema catalogs into a `ProfileRegistry` instance.

### Phase 4: launcher/inventory adoption slice

1. Integrate factory in inventory chat launcher runtime path.
2. Keep existing profile selector UX unchanged while moving composition responsibilities to new factory.
3. Add debug output and compare to backend runtime keys/fingerprint expectations.

### Phase 5: docs and examples

1. Publish API reference and migration examples.
2. Add cookbook samples for common patterns.
3. Add policy guidance: runtime override rules, schema evolution/versioning.

## Migration guidance

### Current style

1. UI directly calls profile endpoints.
2. Conversation manager passes selected profile.
3. Backend composes runtime with profile/middleware definitions.

### Target style

1. UI still uses profile endpoints for CRUD/selection, but engine instantiation uses `EngineFactory` as the single entrypoint.
2. Middleware customization is done through patch builder instead of ad hoc JSON edits.
3. Middleware declaration in JS uses `defineMiddleware` and schema object, mirroring backend model.

### Incremental migration pattern

```ts
// Step 1: wrap existing profileApi
const profileClient = createProfileClient({ basePrefix: "/api/apps/inventory" });

// Step 2: fetch registry and create factory
const registry = await profileClient.fetchRegistry("default");
const factory = createEngineFactory({ registry });

// Step 3: replace custom composition call-sites
const engine = await factory.create(currentProfileSlug, {
  middleware: (m) => m.configure("inventory_artifact_policy", { instructions: "concise" }),
});
```

## Alternatives considered

### Alternative A: keep transport-only API and no engine factory

Pros:

1. Minimal new code.

Cons:

1. Leaves merge/override semantics scattered.
2. No elegant composable API as requested.
3. Higher long-term maintenance cost.

Decision: rejected.

### Alternative B: expose only a giant `composeRuntime(config)` function

Pros:

1. Fewer types.

Cons:

1. Low discoverability.
2. Easy to misuse.
3. Hard to enforce policy and merge precedence consistency.

Decision: rejected.

### Alternative C: backend-only middleware declaration, no JS middleware authoring

Pros:

1. Strong central control.

Cons:

1. Blocks frontend/runtime extension use cases.
2. Does not meet request for JS middleware declaration API with schema.

Decision: rejected.

### Alternative D: class-heavy API only

Pros:

1. Familiar OO style.

Cons:

1. Harder to tree-shake.
2. More boilerplate than functional factory approach.

Decision: partially rejected. We use light factory + builders with optional classes behind the scenes.

## Risks and mitigations

1. Risk: profile/runtime policy drift between JS and backend.
   - Mitigation: centralize merge precedence and maintain parity tests against backend e2e behavior.
2. Risk: schema tooling divergence.
   - Mitigation: standardize on JSON Schema dialect and shared validation utility.
3. Risk: confusion with Redux middleware.
   - Mitigation: use naming `runtime middleware` consistently; keep APIs in runtime-factory namespace.
4. Risk: over-flexible overrides weakening safety.
   - Mitigation: default `allowRuntimeOverrides=false` and explicit opt-in flags.

## Open questions

1. Should JS middleware definitions be executable only client-side, or can they be serialized and executed in backend sandbox contexts later?
2. Should registry IDs be single-tenant (`default`) in launcher, or first-class multi-registry in UI now?
3. Should middleware schema include UI metadata (`ui:widget`, descriptions, categories) for dynamic profile editors?
4. Should `variant` be formalized in profile documents, or kept as resolver-only concern initially?
5. Do we need explicit optimistic concurrency fields (`expectedVersion`) in `createProfileClient.updateProfile` wrapper defaults?

## File-level implementation sketch

Suggested new files:

1. `packages/engine/src/runtime-factory/profiles/types.ts`
2. `packages/engine/src/runtime-factory/profiles/registry.ts`
3. `packages/engine/src/runtime-factory/middleware/defineMiddleware.ts`
4. `packages/engine/src/runtime-factory/middleware/patchBuilder.ts`
5. `packages/engine/src/runtime-factory/factory/types.ts`
6. `packages/engine/src/runtime-factory/factory/errors.ts`
7. `packages/engine/src/runtime-factory/factory/createEngineFactory.ts`
8. `packages/engine/src/runtime-factory/transport/profileClient.ts`
9. `packages/engine/src/runtime-factory/index.ts`

Suggested touched files:

1. `packages/engine/src/chat/index.ts` (exports)
2. `apps/inventory/src/launcher/renderInventoryApp.tsx` (adoption path)
3. `packages/engine/src/chat/runtime/profileApi.ts` (optional facade integration only)

## References

Primary evidence files:

1. [profileApi.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/profileApi.ts)
2. [profileTypes.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/profileTypes.ts)
3. [useProfiles.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useProfiles.ts)
4. [ChatConversationWindow.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx)
5. [useConversation.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useConversation.ts)
6. [conversationManager.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/conversationManager.ts)
7. [wsManager.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/ws/wsManager.ts)
8. [renderInventoryApp.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx)
9. [runtime_composer.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go)
10. [middleware_definitions.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/middleware_definitions.go)
11. [request_resolver.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go)
12. [inventory_backend_module.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/inventory_backend_module.go)
13. [main.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main.go)
14. [main_integration_test.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go)
15. [request_resolver_test.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/request_resolver_test.go)
16. [runtime_composer_test.go](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer_test.go)

