import { manifest } from "./manifest";
import { subtypes } from "./subtypes";
import { fields } from "./fields";
import { actions } from "./actions";

export const register = {
  initialize: () => {
    console.log(`[HebergementModule] Registering manifest metadata...`);
    const globalContext =
      typeof window !== "undefined" ? (window as any) : null;
    if (globalContext && globalContext.__DebrouilleProRegistry__) {
      globalContext.__DebrouilleProRegistry__.registerModule("hebergement", {
        manifest,
        subtypes,
        fields,
        actions,
      });
    }
  },
};
