// src/features/marketplace/metrics.ts

export const METRICS = {
  totalProducts: {
    label: "Produits totaux",
    key: "marketplace:products:total",
  },
  activeProducts: {
    label: "Produits actifs",
    key: "marketplace:products:active",
  },
  totalOrders: {
    label: "Commandes totales",
    key: "marketplace:orders:total",
  },
  totalRevenue: {
    label: "Chiffre d'affaires",
    key: "marketplace:revenue:total",
  },
  totalSellers: {
    label: "Vendeurs actifs",
    key: "marketplace:sellers:total",
  },
  conversionRate: {
    label: "Taux de conversion",
    key: "marketplace:conversion:rate",
  },
  averageOrderValue: {
    label: "Panier moyen",
    key: "marketplace:order:average",
  },
  totalReviews: {
    label: "Avis totaux",
    key: "marketplace:reviews:total",
  },
  averageRating: {
    label: "Note moyenne",
    key: "marketplace:rating:average",
  },
} as const;

export type MetricKey = (typeof METRICS)[keyof typeof METRICS]["key"];
