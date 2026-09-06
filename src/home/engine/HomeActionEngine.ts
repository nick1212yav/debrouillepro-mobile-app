import type { ModuleId } from "@/config/modules/moduleRegistry";

import { MODULE_REGISTRY } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * HomeActionEngine
 * ============================================================
 */

export type HomeActionType =
  | "open_module"
  | "open_item"
  | "refresh"
  | "dismiss"
  | "save"
  | "share";

export interface HomeAction {
  type: HomeActionType;

  moduleId?: ModuleId;

  itemId?: string;

  route?: string;

  metadata?: Record<string, unknown>;
}

export interface HomeActionContext {
  navigate?: (route: string) => void | Promise<void>;

  onRefresh?: () => void | Promise<void>;

  onDismiss?: (itemId: string) => void | Promise<void>;

  onSave?: (itemId: string) => void | Promise<void>;

  onShare?: (itemId: string) => void | Promise<void>;
}

export class HomeActionEngine {
  private readonly context: HomeActionContext;

  constructor(context: HomeActionContext = {}) {
    this.context = context;
  }

  /**
   * Exécute une action Home.
   */
  async execute(action: HomeAction): Promise<void> {
    switch (action.type) {
      case "open_module":
        await this.openModule(action.moduleId, action.route);
        return;

      case "open_item":
        await this.openItem(action.moduleId, action.itemId, action.route);
        return;

      case "refresh":
        await this.context.onRefresh?.();
        return;

      case "dismiss":
        if (action.itemId) {
          await this.context.onDismiss?.(action.itemId);
        }
        return;

      case "save":
        if (action.itemId) {
          await this.context.onSave?.(action.itemId);
        }
        return;

      case "share":
        if (action.itemId) {
          await this.context.onShare?.(action.itemId);
        }
        return;
    }
  }

  /**
   * Ouvre un module.
   */
  async openModule(moduleId?: ModuleId, route?: string): Promise<void> {
    if (!moduleId) {
      return;
    }

    const module = MODULE_REGISTRY[moduleId];

    if (!module) {
      return;
    }

    const targetRoute = route ?? module.route ?? `/${String(moduleId)}`;

    await this.context.navigate?.(targetRoute);
  }

  /**
   * Ouvre un élément.
   */
  async openItem(
    moduleId?: ModuleId,
    itemId?: string,
    route?: string,
  ): Promise<void> {
    if (!itemId) {
      return;
    }

    let targetRoute = route;

    if (!targetRoute && moduleId) {
      const module = MODULE_REGISTRY[moduleId];

      if (module) {
        targetRoute = `${module.route ?? `/${String(moduleId)}`}/${itemId}`;
      }
    }

    if (!targetRoute) {
      targetRoute = `/${itemId}`;
    }

    await this.context.navigate?.(targetRoute);
  }

  /**
   * Génère une action pour un module.
   */
  createModuleAction(moduleId: ModuleId): HomeAction {
    return {
      type: "open_module",

      moduleId,

      route: MODULE_REGISTRY[moduleId]?.route,
    };
  }

  /**
   * Génère une action pour un item.
   */
  createItemAction(moduleId: ModuleId, itemId: string): HomeAction {
    return {
      type: "open_item",

      moduleId,

      itemId,
    };
  }
}

export default HomeActionEngine;
