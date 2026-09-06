// src/features/sante/register.ts
import type { ModuleManifest } from "@/core/sdk/types/manifest.types";
import { SANTE_MODULE_MANIFEST } from "./manifest";
import { SANTE_LIFECYCLE } from "./lifecycle";
import { SANTE_PERMISSIONS } from "./permissions";
import { SANTE_ACTIONS } from "./actions";
import { SANTE_FIELDS } from "./fields";
import { SANTE_SEARCH_CONFIG } from "./search";
import { SANTE_SUBTYPES } from "./subtypes";
import { SANTE_ADAPTER } from "./adapter";
import { SANTE_METRICS } from "./metrics";

// Définition locale du type ModuleRegistry (si non exporté par le SDK)
// Adapte selon l'interface réelle de ton SDK
export interface ModuleRegistry {
  registerModule: (module: {
    manifest: ModuleManifest;
    lifecycle?: any;
    permissions?: any;
    actions?: any;
    fields?: any;
    search?: any;
    subtypes?: any;
    adapter?: any;
    metrics?: any;
  }) => void;
  // Ajoute d'autres méthodes si nécessaire
}

export function registerSanteModule(registry: ModuleRegistry): void {
  registry.registerModule({
    manifest: SANTE_MODULE_MANIFEST,
    lifecycle: SANTE_LIFECYCLE,
    permissions: SANTE_PERMISSIONS,
    actions: SANTE_ACTIONS,
    fields: SANTE_FIELDS,
    search: SANTE_SEARCH_CONFIG,
    subtypes: SANTE_SUBTYPES,
    adapter: SANTE_ADAPTER,
    metrics: SANTE_METRICS,
  });
}
