import { useCallback, useMemo } from "react";

import type { ModuleId } from "@/config/modules/module.types";

import type { ModuleDefinition } from "@/config/modules/module.types";

import {
  MODULE_REGISTRY,
  getHomeModules,
  getModule,
  getModuleOptions,
} from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * DÉBROUILLEPRO — useHomeModules
 * ============================================================
 */

export function useHomeModules() {
  const modules = useMemo(() => getHomeModules(), []);

  const options = useMemo(() => getModuleOptions(), []);

  const getModuleById = useCallback(
    (moduleId: ModuleId): ModuleDefinition => getModule(moduleId),
    [],
  );

  const isEnabled = useCallback(
    (moduleId: ModuleId) =>
      MODULE_REGISTRY[moduleId].enabled &&
      MODULE_REGISTRY[moduleId].home.enabled,
    [],
  );

  const getPriority = useCallback(
    (moduleId: ModuleId) => MODULE_REGISTRY[moduleId].home.priority,
    [],
  );

  return {
    modules,

    options,

    count: modules.length,

    getModule: getModuleById,

    isEnabled,

    getPriority,
  };
}

export default useHomeModules;
