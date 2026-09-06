export const manifest = {
  id: "hebergement",
  name: "Hébergement",
  version: "1.0.0",
  description: "Gestion de logements, appartements, villas et réservations.",
  icon: "Home",
  category: "local-service",
  capabilities: [
    "accommodation-listing",
    "accommodation-booking",
    "accommodation-payment",
    "accommodation-reviews",
  ],
  routes: [
    { path: "/hebergement", component: "HebergementPage" },
    { path: "/hebergement/:id", component: "HebergementDetailPage" },
  ],
};
