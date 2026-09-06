import { ModuleRegistry } from "../registry/ModuleRegistry";
import type { ModuleManifest } from "../types";

export const ModuleLoader = {
  load: (manifests: ModuleManifest[]) => {
    for (const manifest of manifests) {
      ModuleRegistry.register(manifest);
    }
  },
};
