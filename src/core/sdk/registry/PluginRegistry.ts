import type { Plugin } from "../types";

const plugins = new Map<string, Plugin>();

export const PluginRegistry = {
  register: (plugin: Plugin) => {
    plugins.set(plugin.id, plugin);
  },
  get: (id: string): Plugin | undefined => plugins.get(id),
  getAll: (): Plugin[] => Array.from(plugins.values()),
  activate: async (id: string, context: any) => {
    const plugin = plugins.get(id);
    if (plugin) await plugin.activate(context);
  },
};
