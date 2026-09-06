import { ModuleRegistry } from "@/core/sdk/registry";
import { ActionRegistry } from "@/core/sdk/registry/ActionRegistry";
import { annoncesManifest } from "./manifest";
import { annonceActions } from "./actions";

export function registerAnnoncesModule() {
  // 1. Enregistrer le manifeste
  ModuleRegistry.register(annoncesManifest);

  // 2. Enregistrer les actions SDK
  annonceActions.forEach((action) => ActionRegistry.register(action));
}
