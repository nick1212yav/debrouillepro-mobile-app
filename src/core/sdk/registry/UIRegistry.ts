import type { UISheetConfig } from "../types";

const sheets = new Map<string, UISheetConfig>();

export const UIRegistry = {
  register: (config: UISheetConfig) => {
    if (sheets.has(config.id)) {
      console.warn(`UI ${config.id} already registered, overwriting`);
    }
    sheets.set(config.id, config);
  },
  get: (id: string): UISheetConfig | undefined => sheets.get(id),
  has: (id: string): boolean => sheets.has(id),
  getAll: (): UISheetConfig[] => Array.from(sheets.values()),
};
