import { useCallback, useState } from "react";

import type { ModuleId } from "@/config/modules/module.types";

import { getModuleRoute } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * DÉBROUILLEPRO — useHomeActions
 * ============================================================
 */

export type HomeActionType =
  | "open_module"
  | "open_item"
  | "refresh"
  | "dismiss"
  | "save"
  | "share";

export interface HomeActionPayload {
  type: HomeActionType;

  moduleId?: ModuleId;

  itemId?: string;

  route?: string;

  metadata?: Record<string, unknown>;
}

export interface UseHomeActionsOptions {
  onAction?: (action: HomeActionPayload) => void | Promise<void>;
}

export function useHomeActions(options: UseHomeActionsOptions = {}) {
  const { onAction } = options;

  const [isExecuting, setIsExecuting] = useState(false);

  const execute = useCallback(
    async (action: HomeActionPayload) => {
      setIsExecuting(true);

      try {
        await onAction?.(action);
      } finally {
        setIsExecuting(false);
      }
    },
    [onAction],
  );

  const openModule = useCallback(
    async (moduleId: ModuleId) => {
      await execute({
        type: "open_module",

        moduleId,

        route: getModuleRoute(moduleId),
      });
    },
    [execute],
  );

  const openItem = useCallback(
    async ({
      moduleId,
      itemId,
    }: {
      moduleId: ModuleId;

      itemId: string;
    }) => {
      await execute({
        type: "open_item",

        moduleId,

        itemId,
      });
    },
    [execute],
  );

  const refresh = useCallback(async () => {
    await execute({
      type: "refresh",
    });
  }, [execute]);

  const dismiss = useCallback(
    async (itemId: string) => {
      await execute({
        type: "dismiss",

        itemId,
      });
    },
    [execute],
  );

  const save = useCallback(
    async (itemId: string) => {
      await execute({
        type: "save",

        itemId,
      });
    },
    [execute],
  );

  const share = useCallback(
    async (itemId: string) => {
      await execute({
        type: "share",

        itemId,
      });
    },
    [execute],
  );

  return {
    execute,

    openModule,

    openItem,

    refresh,

    dismiss,

    save,

    share,

    isExecuting,
  };
}

export default useHomeActions;
