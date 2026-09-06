import { ModuleRegistry } from "@/core/sdk/registry";
import { serviceManifest } from "./manifest";

export function registerServiceModule() {
  ModuleRegistry.register(serviceManifest);
}
