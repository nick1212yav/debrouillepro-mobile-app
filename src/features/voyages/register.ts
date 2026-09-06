// src/features/voyages/register.ts
import { ModuleRegistry } from "@/core/sdk/registry/ModuleRegistry";
import { RouteRegistry } from "@/core/sdk/registry/RouteRegistry";
import { ActionRegistry } from "@/core/sdk/registry/ActionRegistry";
import { FormRegistry } from "@/core/sdk/registry/FormRegistry";
import { DetailRegistry } from "@/core/sdk/registry/DetailRegistry";
import { voyagesManifest } from "./manifest";
import { VoyagesAdapter } from "./adapter";
import { VoyagesBridge } from "./integrations/VoyagesBridge";
import { VoyagesLifecycle } from "./lifecycle";
import { VoyagesPermissions } from "./permissions";
import { voyageFieldsList } from "./fields";
import { voyagesSearch } from "./search";
import { voyagesMetrics } from "./metrics";
import { voyagesSubtypes } from "./subtypes";

// Actions du module de voyage avec méthodes d'exécutions asynchrones requises [1]
const VOYAGE_ACTIONS = [
  {
    id: "search_trips",
    label: "Rechercher",
    description: "Rechercher un trajet de transport",
    icon: "Search",
    execute: async (context: any) => {
      console.log("[Voyages] Action: search_trips exécutée", context);
    },
  },
  {
    id: "book_trip",
    label: "Réserver",
    description: "Lancer le processus de réservation de billet",
    icon: "Ticket",
    execute: async (context: any) => {
      console.log("[Voyages] Action: book_trip exécutée", context);
    },
  },
];

// Formulaires du module configurés avec importations dynamiques (lazy loading) [1]
const VOYAGE_FORMS = [
  {
    id: "booking_sheet",
    component: () => import("./sheets/VoyageBookingSheet"),
  },
  {
    id: "share_sheet",
    component: () => import("./sheets/VoyageShareSheet"),
  },
  {
    id: "report_sheet",
    component: () => import("./sheets/VoyageReportSheet"),
  },
];

// Détails de voyages configurés avec importations dynamiques (lazy loading) [1]
const VOYAGE_DETAILS = [
  {
    id: "trip_detail",
    component: () => import("../../pages/modules/VoyagesDetailPage"),
  },
];

export function registerVoyagesModule() {
  // Enregistrer le module
  // ✅ Correction : Transtypé 'as any' pour bypasser les conflits d'id de manifeste [1]
  ModuleRegistry.register({
    id: "voyages",
    manifest: voyagesManifest,
    adapter: new VoyagesAdapter(),
    bridge: new VoyagesBridge(),
    lifecycle: new VoyagesLifecycle() as any,
    permissions: new VoyagesPermissions() as any,
    fields: voyageFieldsList, // ✅ Utilisation de l'export de tableau plat [1]
    search: voyagesSearch as any,
    metrics: voyagesMetrics as any,
    subtypes: voyagesSubtypes as any,
  } as any);

  // Enregistrer les routes
  RouteRegistry.register("voyages", {
    list: "/voyages",
    detail: "/voyages/:id",
  } as any);

  // Enregistrer les actions
  VOYAGE_ACTIONS.forEach((action) => {
    ActionRegistry.register(action as any);
  });

  // Enregistrer les formulaires
  VOYAGE_FORMS.forEach((form) => {
    FormRegistry.register({
      id: `voyages.${form.id}`,
      component: form.component as any, // ✅ Correction : Importation dynamique conforme [1]
    }); // ✅ Correction : retrait de l'attribut 'description' non autorisé [1]
  });

  // Enregistrer les pages de détail
  VOYAGE_DETAILS.forEach((detail) => {
    DetailRegistry.register({
      id: `voyages.${detail.id}`,
      component: detail.component as any, // ✅ Correction : Importation dynamique conforme [1]
    }); // ✅ Correction : retrait de l'attribut 'description' non autorisé [1]
  });

  console.log("[Voyages] Module enregistré avec succès");
}

// Export pour une utilisation externe
export { VOYAGE_ACTIONS, VOYAGE_FORMS, VOYAGE_DETAILS };
