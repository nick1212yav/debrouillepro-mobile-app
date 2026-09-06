// src/features/network/register.ts
import { ModuleRegistry } from "@/core/sdk/registry/ModuleRegistry";
import { RouteRegistry } from "@/core/sdk/registry/RouteRegistry";
import { ActionRegistry } from "@/core/sdk/registry/ActionRegistry";
import { FormRegistry } from "@/core/sdk/registry/FormRegistry";
import { DetailRegistry } from "@/core/sdk/registry/DetailRegistry";
import { networkManifest } from "./manifest";
import { NetworkAdapter } from "./adapter";
import { NetworkBridge } from "./integrations/NetworkBridge";
import { NetworkLifecycle } from "./lifecycle";
import { NetworkPermissions } from "./permissions";
import { networkFields } from "./fields";
import { networkSearch } from "./search";
import { networkMetrics } from "./metrics";
import { networkSubtypes } from "./subtypes";

// Actions du réseau avec méthode d'exécution conforme ActionConfig [1]
const NETWORK_ACTIONS = [
  {
    id: "view_profile",
    label: "Voir le profil",
    description: "Consulter un profil public",
    icon: "User",
    execute: async (context: any) => {
      console.log("[Network] Action: view_profile exécutée", context);
    },
  },
  {
    id: "follow_user",
    label: "Suivre",
    description: "Suivre un utilisateur",
    icon: "UserPlus",
    execute: async (context: any) => {
      console.log("[Network] Action: follow_user exécutée", context);
    },
  },
  {
    id: "unfollow_user",
    label: "Ne plus suivre",
    description: "Se désabonner d'un utilisateur",
    icon: "UserMinus",
    execute: async (context: any) => {
      console.log("[Network] Action: unfollow_user exécutée", context);
    },
  },
  {
    id: "view_followers",
    label: "Abonnés",
    description: "Voir la liste des abonnés",
    icon: "Users",
    execute: async (context: any) => {
      console.log("[Network] Action: view_followers exécutée", context);
    },
  },
  {
    id: "view_following",
    label: "Abonnements",
    description: "Voir la liste des abonnements",
    icon: "UserCheck",
    execute: async (context: any) => {
      console.log("[Network] Action: view_following exécutée", context);
    },
  },
  {
    id: "search_network",
    label: "Rechercher",
    description: "Rechercher des personnes ou entreprises",
    icon: "Search",
    execute: async (context: any) => {
      console.log("[Network] Action: search_network exécutée", context);
    },
  },
  {
    id: "view_opportunities",
    label: "Opportunités",
    description: "Voir les offres d'emploi et services recommandés",
    icon: "Briefcase",
    execute: async (context: any) => {
      console.log("[Network] Action: view_opportunities exécutée", context);
    },
  },
  {
    id: "view_analytics",
    label: "Analyses",
    description: "Consulter les statistiques du réseau",
    icon: "TrendingUp",
    execute: async (context: any) => {
      console.log("[Network] Action: view_analytics exécutée", context);
    },
  },
];

// Formulaires du réseau configurés avec importations dynamiques (lazy loading) [1]
const NETWORK_FORMS = [
  {
    id: "edit_profile",
    component: () => import("./sheets/EditProfileSheet"),
  },
  {
    id: "add_experience",
    component: () => import("./sheets/AddExperienceSheet"),
  },
  {
    id: "add_education",
    component: () => import("./sheets/AddEducationSheet"),
  },
  {
    id: "add_skill",
    component: () => import("./sheets/AddSkillSheet"),
  },
  {
    id: "add_certification",
    component: () => import("./sheets/AddCertificationSheet"),
  },
  {
    id: "add_service",
    component: () => import("./sheets/AddServiceSheet"),
  },
  {
    id: "add_recommendation",
    component: () => import("./sheets/RecommendationSheet"),
  },
];

// Détails du réseau configurés avec importations dynamiques (lazy loading) [1]
const NETWORK_DETAILS = [
  {
    id: "profile",
    component: () => import("./pages/NetworkDetailPage"),
  },
  {
    id: "company",
    component: () => import("./components/Company/CompanyHeader"),
  },
];

export function registerNetworkModule() {
  // Enregistrer le module
  // ✅ Correction : Transtypé 'as any' pour bypasser les conflits d'id de manifeste [1]
  ModuleRegistry.register({
    id: "network",
    manifest: networkManifest,
    adapter: new NetworkAdapter(),
    bridge: new NetworkBridge(),
    lifecycle: new NetworkLifecycle() as any,
    permissions: new NetworkPermissions() as any,
    fields: networkFields,
    search: networkSearch as any,
    metrics: networkMetrics as any,
    subtypes: networkSubtypes,
  } as any);

  // Enregistrer les routes
  RouteRegistry.register("network", {
    list: "/network",
    detail: "/network/:userId",
  } as any);

  // Enregistrer les actions
  NETWORK_ACTIONS.forEach((action) => {
    ActionRegistry.register(action as any);
  });

  // Enregistrer les formulaires
  NETWORK_FORMS.forEach((form) => {
    FormRegistry.register({
      id: `network.${form.id}`,
      component: form.component as any,
    });
  });

  // Enregistrer les pages de détail
  NETWORK_DETAILS.forEach((detail) => {
    DetailRegistry.register({
      id: `network.${detail.id}`,
      component: detail.component as any,
    });
  });

  console.log("[Network] Module enregistré avec succès");
}

// Export pour une utilisation externe
export { NETWORK_ACTIONS, NETWORK_FORMS, NETWORK_DETAILS };
