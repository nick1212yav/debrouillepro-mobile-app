import type { DetailConfig } from "../types";

const details = new Map<string, DetailConfig>();

export const DetailRegistry = {
  register: (config: DetailConfig) => {
    if (details.has(config.id)) {
      console.warn(`Detail ${config.id} already registered, overwriting`);
    }
    details.set(config.id, config);
  },
  get: (id: string): DetailConfig | undefined => details.get(id),
  has: (id: string): boolean => details.has(id),
};
