import type { ModuleManifest } from "@/core/sdk/types";

export const annoncesManifest: ModuleManifest = {
  info: {
    id: "annonce",
    label: "Annonces",
    icon: "📦",
    color: "#F97316",
    gradient: "from-orange-500 to-amber-600",
    badge: "Vente",
    description: "Petites annonces, produits neufs et d'occasion",
    version: "1.0.0",
  },
  subtypes: [],
  fields: [],
  actions: [],
  metrics: [],
  queries: {
    list: "publications.listFeed",
    search: "publications.searchAnnonces",
    getById: "publications.getPublication",
  },
  mutations: {
    create: "publications.createPublication",
    update: "publications.updatePublication",
    delete: "publications.deletePublication",
  },
  capabilities: ({ publication, user }) => ({
    call: true,
    chat: true,
    share: true,
    save: true,
    whatsapp: true,
    email: true,
    payment: publication?.isPaid || user?.premium || false,
    booking: false,
  }),
  card: {
    hero: "title",
    sections: ["price", "location"],
    metrics: ["viewCount", "likeCount"],
  },
  permissions: {
    view: ["*"],
    create: ["user"],
    edit: ["user"],
    delete: ["admin"],
  },
  search: {
    filters: [
      {
        key: "type",
        label: "Catégorie",
        type: "select",
        options: [
          { label: "Immobilier", value: "immobilier" },
          { label: "Automobile", value: "automobile" },
          { label: "Téléphones", value: "telephones" },
          { label: "Ordinateurs", value: "ordinateurs" },
          { label: "Mode", value: "mode" },
          { label: "Divers", value: "divers" },
        ],
      },
      {
        key: "minPrice",
        label: "Prix min",
        type: "range",
        min: 0,
        max: 1000000,
      },
      {
        key: "maxPrice",
        label: "Prix max",
        type: "range",
        min: 0,
        max: 1000000,
      },
      {
        key: "condition",
        label: "État",
        type: "select",
        options: [
          { label: "Neuf", value: "neuf" },
          { label: "Bon état", value: "bon" },
          { label: "À rénover", value: "a-renover" },
        ],
      },
      { key: "location", label: "Localisation", type: "text" },
    ],
    sorts: [
      { key: "recent", label: "Plus récents" },
      { key: "price_asc", label: "Prix croissant" },
      { key: "price_desc", label: "Prix décroissant" },
      { key: "popularity", label: "Popularité" },
    ],
    autocomplete: true,
    aiRanking: true,
  },
  dependencies: { required: ["auth"] },
  compatibility: { sdk: "1.0.0" },
  defaults: ({ country = "Congo", currency = "USD" }) => ({
    country,
    currency,
  }),
  featureFlags: { premium: false },
  lifecycle: {},
  // adapter est optionnel – on le retire pour éviter l'erreur
  plugins: ["analytics"],
};
