// src/features/marketplace/manifest.ts
import type { ModuleManifest } from "@/core/sdk/types/manifest.types";
import { ACTION_CONFIG } from "./actions";
import { MARKETPLACE_FIELDS } from "./fields";
import { searchConfig } from "./search";

export const manifest: ModuleManifest = {
  info: {
    id: "marketplace",
    label: "Marketplace",
    icon: "ShoppingBag",
    color: "#F97316",
    description: "Achetez et vendez des produits en ligne",
    version: "1.0.0",
  },
  subtypes: [
    {
      value: "product",
      label: "Produit",
      icon: "Package",
    },
    {
      value: "service",
      label: "Service",
      icon: "Wrench",
    },
  ],
  fields: MARKETPLACE_FIELDS,
  actions: ACTION_CONFIG.map((action) => ({
    ...action,
    execute: async (context) => {
      console.log(`Action ${action.id} executed with context:`, context);
    },
  })),
  metrics: [
    { key: "totalSales", label: "Ventes totales", icon: "DollarSign" },
    { key: "averageRating", label: "Note moyenne", icon: "Star" },
    { key: "totalReviews", label: "Nombre d'avis", icon: "MessageSquare" },
  ],
  routes: {
    detail: "/marketplace/:id",
    list: "/marketplace",
  },
  capabilities: {
    chat: true,
    call: true,
    payment: true,
    share: true,
    save: true,
    report: true,
    review: true,
    booking: true,
  },
  card: {
    hero: "images",
    sections: ["title", "price", "rating", "description"],
    metrics: ["totalSales", "averageRating", "totalReviews"],
    footer: ["actions"],
  },
  search: searchConfig,
  // ✅ Correction : PermissionRule = [] ou ["role"]
  permissions: {
    view: [],
    create: [],
    edit: [],
    delete: [],
  },
  dependencies: {
    required: ["core", "community", "payments"],
    optional: ["analytics", "notifications"],
  },
  compatibility: {
    sdk: "1.0.0",
  },
  defaults: {
    currency: "XAF",
    status: "active",
  },
  featureFlags: {
    enableAI: false,
    enableLiveChat: false,
    enableAR: false,
  },
  lifecycle: {
    beforeCreate: async (data) => {
      console.log("[Marketplace] beforeCreate:", data);
      return data;
    },
  },
};
