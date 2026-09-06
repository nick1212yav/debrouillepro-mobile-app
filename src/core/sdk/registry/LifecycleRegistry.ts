import type { ModuleLifecycle } from "../types";

const lifecycles = new Map<string, ModuleLifecycle>();

export const LifecycleRegistry = {
  register: (moduleId: string, lifecycle: ModuleLifecycle) => {
    lifecycles.set(moduleId, lifecycle);
  },
  get: (moduleId: string): ModuleLifecycle | undefined =>
    lifecycles.get(moduleId),
  has: (moduleId: string): boolean => lifecycles.has(moduleId),
};
