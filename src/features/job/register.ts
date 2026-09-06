import { ActionRegistry } from "../../core/sdk/registry/ActionRegistry";
import { UIRegistry } from "../../core/sdk/registry/UIRegistry";
import { FormRegistry } from "../../core/sdk/registry/FormRegistry";
import { DetailRegistry } from "../../core/sdk/registry/DetailRegistry";
import { actions } from "./actions";
// ✅ Importer le vrai composant ApplySheet
import ApplySheet from "./components/ApplySheet";
import { JobFormPlaceholder, JobDetailPlaceholder } from "./placeholders";

export function registerJob() {
  // 1. Enregistrer les actions
  for (const action of actions) {
    ActionRegistry.register(action);
  }

  // 2. Enregistrer la UI avec le vrai composant
  UIRegistry.register({
    id: "job.apply",
    component: ApplySheet, // ✅ vrai composant
    type: "sheet",
    size: "lg",
  });

  // 3. Enregistrer le formulaire
  FormRegistry.register({
    id: "job",
    component: JobFormPlaceholder,
  });

  // 4. Enregistrer la page détail
  DetailRegistry.register({
    id: "job",
    component: JobDetailPlaceholder,
  });

  console.log("✅ Module Job enregistré");
}
