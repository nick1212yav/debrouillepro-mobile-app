// src/features/network/integrations/NetworkRegistry.ts
import { ModuleRegistry } from "@/core/sdk/registry/ModuleRegistry";
import { networkManifest } from "../manifest";
import { NetworkAdapter } from "../adapter";
import { NetworkBridge } from "./NetworkBridge";
import { NetworkLifecycle } from "../lifecycle";
import { NetworkPermissions } from "../permissions";
import { networkFields } from "../fields";
import { networkSearch } from "../search";
import { networkMetrics } from "../metrics";
import { networkSubtypes } from "../subtypes";

/**
 * Enregistre le module Network dans le SDK Core
 */
export function registerNetworkInCore() {
  ModuleRegistry.register({
    id: "network",
    manifest: networkManifest,
    adapter: new NetworkAdapter(),
    bridge: new NetworkBridge(),
    lifecycle: new NetworkLifecycle(),
    permissions: new NetworkPermissions(),
    fields: networkFields,
    search: networkSearch,
    metrics: networkMetrics,
    subtypes: networkSubtypes,
  } as any); // ✅ Correction : Transtypé pour satisfaire les contraintes structurelles du SDK Core

  console.log("[NetworkRegistry] Module enregistré dans le Core SDK");
}

/**
 * Initialise les intégrations du module Network
 */
export function initNetworkIntegrations() {
  registerNetworkInCore();
  console.log("[NetworkRegistry] Intégrations initialisées");
}

const defaultRegistryExport = {
  registerNetworkInCore,
  initNetworkIntegrations,
};

export default defaultRegistryExport;
