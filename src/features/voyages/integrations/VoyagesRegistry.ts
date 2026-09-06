// src/features/voyages/integrations/VoyagesRegistry.ts
import { ModuleRegistry } from "@/core/sdk/registry/ModuleRegistry";
import { voyagesManifest } from "../manifest";
import { VoyagesAdapter } from "../adapter";
import { VoyagesBridge } from "./VoyagesBridge";
import { VoyagesLifecycle } from "../lifecycle";
import { VoyagesPermissions } from "../permissions";
import { voyageFieldsList } from "../fields";
import { voyagesSearch } from "../search";
import { voyagesMetrics } from "../metrics";
import { voyagesSubtypes } from "../subtypes";

/**
 * Enregistre le module Voyages dans le SDK Core.
 */
export function registerVoyagesInCore() {
  ModuleRegistry.register({
    id: "voyages",
    manifest: voyagesManifest,
    adapter: new VoyagesAdapter(),
    bridge: new VoyagesBridge(),
    lifecycle: new VoyagesLifecycle(),
    permissions: new VoyagesPermissions(),
    fields: voyageFieldsList,
    search: voyagesSearch,
    metrics: voyagesMetrics,
    subtypes: voyagesSubtypes,
  } as any);

  console.log("[VoyagesRegistry] Module enregistré dans le Core SDK");
}

/**
 * Initialise les intégrations du module Voyages.
 */
// ✅ Correction : Renommé en initVoyagesIntegrations [1]
export function initVoyagesIntegrations() {
  registerVoyagesInCore();
  console.log("[VoyagesRegistry] Intégrations initialisées");
}

const defaultRegistryExport = {
  registerVoyagesInCore,
  initVoyagesIntegrations,
};

export default defaultRegistryExport;
