// src/features/sante/manifest.ts
import type { ModuleManifest } from "@/core/sdk/types/manifest.types";
import { SANTE_FIELDS } from "./fields";
import { SANTE_ACTIONS } from "./actions";
import { SANTE_SUBTYPES } from "./subtypes";
import { SANTE_METRICS } from "./metrics";
import { SANTE_LIFECYCLE } from "./lifecycle";
import { SANTE_ADAPTER } from "./adapter";

export const SANTE_MODULE_MANIFEST: ModuleManifest = {
  info: {
    id: "sante",
    label: "Santé",
    icon: "🏥",
    color: "#EF4444",
    gradient: "from-red-500 to-blue-500",
    description:
      "Plateforme e-santé : médecins, hôpitaux, pharmacies, laboratoires, urgences",
    version: "1.0.0",
    badge: "Bêta",
  },

  subtypes: SANTE_SUBTYPES as any,

  fields: SANTE_FIELDS,

  actions: SANTE_ACTIONS,

  metrics: SANTE_METRICS,

  routes: {
    detail: "/sante/:id",
    list: "/sante",
  },

  capabilities: {} as any, // Ajuste selon la définition réelle de ModuleCapabilities

  card: {
    hero: "hero",
    sections: ["info", "actions", "metrics"],
    metrics: ["rating", "reviews", "appointments"],
    footer: ["share", "actions"],
  },

  permissions: {
    view: ["user", "admin"],
    create: ["admin"],
    edit: ["admin"],
    delete: ["admin"],
  },

  ai: {
    category: "healthcare",
    matchingFields: ["name", "specialty", "description"],
    embeddingFields: ["bio", "services"],
    promptTemplate: "Vous êtes un assistant médical…",
  },

  seo: {
    shareTitle: (data) => `Santé - ${data?.name || "Détails"}`,
    shareDescription: (data) => data?.description || "Plateforme e-santé",
    shareImage: (data) => data?.image || "/images/sante-share.png",
  },

  analytics: {
    trackView: true,
    trackCTA: true,
    trackShare: true,
    trackContact: true,
    trackSave: true,
    customEvents: {
      bookAppointment: (data) => console.log("RDV pris", data),
      emergencyCall: (data) => console.log("Appel d'urgence", data),
    },
  },

  search: {
    filters: [
      { key: "specialty", label: "Spécialité", type: "select", options: [] },
      { key: "city", label: "Ville", type: "text" },
      { key: "online", label: "En ligne", type: "checkbox" },
      { key: "rating", label: "Note minimum", type: "range", min: 0, max: 5 },
    ],
    sorts: [
      { key: "rating", label: "Meilleure note" },
      { key: "name", label: "Nom" },
    ],
    boosts: [
      { field: "name", weight: 3 },
      { field: "specialty", weight: 2 },
    ],
    facets: [
      { key: "specialty", label: "Spécialité", aggregation: "count" },
      { key: "city", label: "Ville", aggregation: "count" },
    ],
    suggestions: ["médecin", "hôpital", "pharmacie", "urgence"],
    autocomplete: true,
    ranking: ["rating", "distance"],
  },

  dependencies: {
    required: ["core", "auth"],
    optional: ["payment", "notifications"],
    recommended: ["ai", "analytics"],
  },

  compatibility: {
    sdk: ">=1.0.0",
    database: "convex",
    api: "rest",
  },

  defaults: {
    currency: "EUR",
    country: "FR",
    timezone: "Europe/Paris",
  },

  featureFlags: {
    enableTelemedicine: true,
    enableAI: false,
    enablePayments: true,
  },

  lifecycle: SANTE_LIFECYCLE,

  adapter: SANTE_ADAPTER,
};
