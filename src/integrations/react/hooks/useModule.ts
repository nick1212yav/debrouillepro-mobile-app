import { useMemo } from "react";
import { ModuleRegistry } from "../../../core/sdk/registry/ModuleRegistry";

export function useModule(moduleId: string) {
  const manifest = useMemo(() => ModuleRegistry.get(moduleId), [moduleId]);
  return manifest;
}
