import type { EventHandler } from "./event.types"; // ✅ Ajouté

export interface Plugin {
  id: string;
  name: string;
  version: string;
  activate: (context: any) => void | Promise<void>;
  deactivate?: () => void | Promise<void>;
  events?: Record<string, EventHandler>;
}
