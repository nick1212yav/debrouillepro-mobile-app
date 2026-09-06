import type { FormConfig } from "../types";

const forms = new Map<string, FormConfig>();

export const FormRegistry = {
  register: (config: FormConfig) => {
    if (forms.has(config.id)) {
      console.warn(`Form ${config.id} already registered, overwriting`);
    }
    forms.set(config.id, config);
  },
  get: (id: string): FormConfig | undefined => forms.get(id),
  has: (id: string): boolean => forms.has(id),
};
