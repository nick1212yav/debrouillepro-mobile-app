// src/features/agri/manifest.ts
export const agriManifest = {
  id: "agri",
  name: "Agriculture & Exploitations",
  version: "1.0.0",
  description:
    "Marché local des récoltes, intrants, matériel et conseils agronomiques.",
  entryRoute: "/agri",
  capabilities: [
    "search",
    "filter_multicriteria",
    "geolocation",
    "favorites",
    "reviews",
    "direct_negotiation",
  ],
  defaultSort: "recent",
};
