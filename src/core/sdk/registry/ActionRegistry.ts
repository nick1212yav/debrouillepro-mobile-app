import type { ActionConfig, ActionContext } from "../types";

const actions = new Map<string, ActionConfig>();

export const ActionRegistry = {
  register(config: ActionConfig) {
    if (actions.has(config.id)) {
      console.warn(
        `[ActionRegistry] ${config.id} already registered, overwriting.`,
      );
    }

    actions.set(config.id, config);
  },

  get(id: string): ActionConfig | undefined {
    return actions.get(id);
  },

  has(id: string): boolean {
    return actions.has(id);
  },

  list(): ActionConfig[] {
    return [...actions.values()];
  },

  canExecute(id: string, context: ActionContext) {
    const action = actions.get(id);

    if (!action) {
      return {
        ok: false,
        reason: "NOT_FOUND" as const,
      };
    }

    if (action.visible && !action.visible(context)) {
      return {
        ok: false,
        reason: "NOT_VISIBLE" as const,
      };
    }

    if (action.enabled && !action.enabled(context)) {
      return {
        ok: false,
        reason: "NOT_ENABLED" as const,
      };
    }

    return {
      ok: true,
      reason: "OK" as const,
    };
  },

  async execute(id: string, context: ActionContext) {
    const action = actions.get(id);

    if (!action) {
      console.warn(`[ActionRegistry] Action "${id}" not found.`);
      return false;
    }

    const state = this.canExecute(id, context);

    if (!state.ok) {
      console.warn(
        `[ActionRegistry] Action "${id}" blocked (${state.reason}).`,
      );
      return false;
    }

    try {
      await action.execute(context);
      return true;
    } catch (error) {
      console.error(`[ActionRegistry] Action "${id}" failed.`, error);
      throw error;
    }
  },

  unregister(id: string) {
    actions.delete(id);
  },

  clear() {
    actions.clear();
  },
};
