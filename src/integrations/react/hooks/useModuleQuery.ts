import { BackendProvider } from "../../../core/sdk/providers/BackendProvider";
import { ModuleRegistry } from "../../../core/sdk/registry/ModuleRegistry";

export function useModuleQuery(moduleId: string, queryName: string, args: any) {
  const manifest = ModuleRegistry.get(moduleId);
  const path = manifest?.queries?.[queryName];
  if (!path) {
    console.warn(`Query ${queryName} not found in module ${moduleId}`);
    return null;
  }
  return BackendProvider.useQuery(path, args);
}
