import { ActionRegistry } from "../registry/ActionRegistry";
import type { ActionContext } from "../types";

export class ActionExecutor {
  static async execute(actionId: string, context: ActionContext) {
    await ActionRegistry.execute(actionId, context);
  }
}
