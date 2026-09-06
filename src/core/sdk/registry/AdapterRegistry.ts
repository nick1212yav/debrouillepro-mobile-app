import type { DataAdapter } from "../adapters/DataAdapter";

const adapters = new Map<string, DataAdapter>();

export const AdapterRegistry = {
  register: (moduleId: string, adapter: DataAdapter) => {
    adapters.set(moduleId, adapter);
  },
  get: (moduleId: string): DataAdapter | undefined => adapters.get(moduleId),
  has: (moduleId: string): boolean => adapters.has(moduleId),
};
