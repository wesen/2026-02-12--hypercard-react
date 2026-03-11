import { registerBuiltInRuntimePackages } from './runtime-packages';
import { registerBuiltInRuntimeSurfaceTypes } from './runtime-packs';

let builtInRuntimeRegistered = false;

export function registerBuiltInHypercardRuntime(): void {
  if (builtInRuntimeRegistered) {
    return;
  }

  registerBuiltInRuntimePackages();
  registerBuiltInRuntimeSurfaceTypes();
  builtInRuntimeRegistered = true;
}

export function resetBuiltInHypercardRuntimeRegistrationForTest(): void {
  builtInRuntimeRegistered = false;
}
