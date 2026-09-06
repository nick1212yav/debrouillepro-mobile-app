export interface ModuleCapability {
  id: string;
  name: string;
  description: string;
  requiredPermissions: string[];
}

export interface RestaurationManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  category: "food_and_beverage" | "utility" | "logistics";
  status: "active" | "maintenance" | "disabled";
  dependencies: string[];
  capabilities: ModuleCapability[];
  routes: {
    basePath: string;
    views: Record<string, string>;
  };
}

export const manifest: RestaurationManifest = {
  id: "restauration-engine",
  name: "Restauration, Maquis & Chef à Domicile",
  version: "1.4.2",
  description:
    "Module intelligent de commande de repas, réservation de table, gestion de maquis et chef à domicile.",
  icon: "Utensils",
  category: "food_and_beverage",
  status: "active",
  dependencies: ["core-sdk", "payment-engine", "tracking-engine"],
  capabilities: [
    {
      id: "ordering",
      name: "Prise de commande en ligne",
      description:
        "Permet aux utilisateurs de commander de la nourriture en livraison ou à emporter.",
      requiredPermissions: ["RESTAURANT_ORDER"],
    },
    {
      id: "table_reservation",
      name: "Réservation de table interactive",
      description:
        "Permet de bloquer une table en terrasse, salle principale ou espace VIP.",
      requiredPermissions: ["RESTAURANT_BOOK"],
    },
    {
      id: "chef_booking",
      name: "Chef à domicile",
      description:
        "Permet de louer les services d'un chef professionnel à domicile.",
      requiredPermissions: ["CHEF_HIRE"],
    },
  ],
  routes: {
    basePath: "/modules/restauration",
    views: {
      home: "RestaurationPage",
      detail: "RestaurationDetailPage",
      search: "RestaurationSearchPage",
      cart: "RestaurationCartPage",
      dashboard: "RestaurationDashboardPage",
    },
  },
};
