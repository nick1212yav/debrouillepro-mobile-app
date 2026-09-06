import type { ModuleManifest } from "@/core/sdk/types";
import { actions } from "./actions";
import { fields } from "./fields";
import { metrics } from "./metrics";
import { permissions } from "./permissions";
import { searchConfig } from "./search";
import { subtypes } from "./subtypes";
import { lifecycle } from "./lifecycle";

export const immoManifest: ModuleManifest = {
  info: {
    id: "immo",
    label: "Immobilier",
    icon: "🏠",
    color: "#F97316",
    gradient: "from-orange-500 to-red-500",
    badge: "Immobilier",
    description: "Trouvez ou publiez des biens immobiliers",
    version: "1.0.0",
  },
  subtypes,
  fields,
  actions,
  metrics,
  permissions,
  lifecycle,
  search: searchConfig,
  queries: {
    list: "realestate.listProperties",
    search: "realestate.searchProperties",
    getById: "realestate.getProperty",
  },
  mutations: {
    create: "realestate.createProperty",
  },
  capabilities: ({ publication, user }) => ({
    call: true,
    chat: true,
    share: true,
    save: true,
    whatsapp: true,
    email: true,
    booking: true,
    payment: false,
  }),
  card: {
    hero: "title",
    sections: ["city", "price"],
    metrics: ["price", "surface", "rooms"],
  },
  dependencies: { required: ["auth"] },
  compatibility: { sdk: "1.0.0" },
  defaults: ({ country = "Congo", currency = "USD" }) => ({
    country,
    currency,
  }),
  featureFlags: { premium: false },
  plugins: ["analytics", "ai"],
};
