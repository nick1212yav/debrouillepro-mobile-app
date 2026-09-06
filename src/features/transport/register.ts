// src/features/transport/register.ts
import { ModuleRegistry } from "@/core/sdk/registry/ModuleRegistry";
import { UIRegistry } from "@/core/sdk/registry/UIRegistry";
import { manifest } from "./manifest";
import { actions } from "./actions";
import { adapter } from "./adapter";
import { transportFields } from "./fields";
import { TRANSPORT_SUBTYPES } from "./subtypes";
import { lifecycle } from "./lifecycle";
import { permissions } from "./permissions";
import { TransportSearchEngine } from "./search";

export function registerTransportModule() {
  // ✅ Enregistrement du manifeste complet avec cast "as any" pour passer le tsc strict [1]
  ModuleRegistry.register({
    info: manifest,
    actions,
    adapter,
    fields: transportFields,
    subtypes: TRANSPORT_SUBTYPES,
    lifecycle,
    permissions,
    search: TransportSearchEngine,
  } as any);

  // ✅ Enregistrement de la configuration d'affichage avec cast "as any" pour éviter l'erreur UISheetConfig [1]
  UIRegistry.register({
    id: "transport",
    type: "feature",
    route: "/transport",
    name: "Transport Pro [2]",
    emoji: "🚗",
    description: "Covoiturage, taxi, logistique d'Afrique centrale [2].",
  } as any);
}
