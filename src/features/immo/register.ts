import { ActionRegistry } from "@/core/sdk/registry/ActionRegistry";
import { UIRegistry } from "@/core/sdk/registry/UIRegistry";
import { actions } from "./actions";
import { CreatePropertySheet } from "./components/CreatePropertySheet";
import { UploadMediaSheet } from "./components/UploadMediaSheet";
import { VisitBookingSheet } from "./components/VisitBookingSheet";
import { MortgageSheet } from "./components/MortgageSheet";
import { ContactPlaceholder, VisitPlaceholder } from "./placeholders";

export function registerImmo() {
  // ✅ Enregistrer toutes les actions du module immobilier
  for (const action of actions) {
    ActionRegistry.register(action);
  }

  // ✅ Enregistrer les UI sheets
  UIRegistry.register({
    id: "immo.contact",
    component: ContactPlaceholder,
    type: "sheet",
    size: "lg",
  });

  UIRegistry.register({
    id: "immo.visit",
    component: VisitBookingSheet,
    type: "sheet",
    size: "lg",
  });

  UIRegistry.register({
    id: "immo.create",
    component: CreatePropertySheet,
    type: "sheet",
    size: "full",
  });

  UIRegistry.register({
    id: "immo.upload",
    component: UploadMediaSheet,
    type: "sheet",
    size: "lg",
  });

  UIRegistry.register({
    id: "immo.mortgage",
    component: MortgageSheet,
    type: "sheet",
    size: "lg",
  });

  console.log("✅ Module Immobilier enregistré");
}
