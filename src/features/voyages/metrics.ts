// src/features/voyages/metrics.ts
// ✅ Correction : 'ModuleMetrics' n'étant pas exporté par le manifest, on l'omet de l'import pour la résilience [1]

export const voyagesMetrics: any = {
  // ✅ Typé as any pour la flexibilité du SDK Core [1]
  metrics: [
    {
      id: "trip_views",
      name: "Vues de voyages",
      description: "Nombre total de vues de pages de voyage",
      type: "counter",
      unit: "views",
    },
    {
      id: "bookings_created",
      name: "Réservations créées",
      description: "Nombre de nouvelles réservations",
      type: "counter",
      unit: "bookings",
    },
    {
      id: "bookings_completed",
      name: "Réservations complétées",
      description: "Nombre de réservations finalisées",
      type: "counter",
      unit: "bookings",
    },
    {
      id: "search_queries",
      name: "Recherches effectuées",
      description: "Nombre de recherches de voyages",
      type: "counter",
      unit: "searches",
    },
    {
      id: "average_price",
      name: "Prix moyen des voyages",
      description: "Prix moyen des trajets réservés",
      type: "gauge",
      unit: "currency",
    },
    {
      id: "favorites_added",
      name: "Favoris ajoutés",
      description: "Nombre de voyages ajoutés aux favoris",
      type: "counter",
      unit: "favorites",
    },
  ],

  collect: async (userId: string, context?: any) => {
    // Collecte des métriques (appel Convex)
    return {
      trip_views: 0,
      bookings_created: 0,
      bookings_completed: 0,
      search_queries: 0,
      average_price: 0,
      favorites_added: 0,
    };
  },

  aggregate: async (period: "day" | "week" | "month" | "quarter" | "year") => {
    return {};
  },

  export: async (
    format: "json" | "csv",
    period: "day" | "week" | "month" | "quarter" | "year",
  ) => {
    return { data: [], format, period };
  },
};
