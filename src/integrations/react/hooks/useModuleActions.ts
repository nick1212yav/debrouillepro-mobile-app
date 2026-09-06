import { useCallback } from "react";
import { ActionRegistry } from "../../../core/sdk/registry/ActionRegistry";
import type { ActionContext } from "../../../core/sdk/types";

export function useModuleActions(publication: any) {
  const execute = useCallback(
    async (actionId: string, context?: Partial<ActionContext>) => {
      const fullContext: ActionContext = {
        publication,
        user: context?.user || null,
        services: context?.services || {},
        navigate: context?.navigate || (() => {}),
        ui: context?.ui || {
          openSheet: () => {},
          openModal: () => {},
          openDrawer: () => {},
          openPlayer: () => {},
          openViewer: () => {},
          openToast: () => {},
        },
      };
      await ActionRegistry.execute(actionId, fullContext);
    },
    [publication],
  );

  return { execute };
}
