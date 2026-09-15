// src/features/sante/lifecycle.ts
import type { ModuleLifecycle } from "@/core/sdk/types/manifest.types";
import { toast } from "sonner";

export const SANTE_LIFECYCLE: ModuleLifecycle = {
  // Appelé avant la création d'une entité
  beforeCreate: async (data) => {
    console.log("[Sante] beforeCreate:", data);
    // Validation ou enrichissement des données
    return data;
  },

  // Appelé après la création
  afterCreate: async (data) => {
    console.log("[Sante] afterCreate:", data);
    toast.success("Entité créée avec succès");
  },

  // Avant mise à jour
  beforeUpdate: async (data, existing) => {
    console.log("[Sante] beforeUpdate:", data, existing);
    return data;
  },

  // Après mise à jour
  afterUpdate: async (data) => {
    console.log("[Sante] afterUpdate:", data);
    toast.success("Entité mise à jour");
  },

  // Avant suppression
  beforeDelete: async (data) => {
    console.log("[Sante] beforeDelete:", data);
    // Vérifier si on peut supprimer
    return true;
  },

  // Après suppression
  afterDelete: async (data) => {
    console.log("[Sante] afterDelete:", data);
    toast.success("Entité supprimée");
  },

  // Avant affichage (view)
  beforeView: async (data) => {
    console.log("[Sante] beforeView:", data);
  },

  // Après affichage
  afterView: async (data) => {
    console.log("[Sante] afterView:", data);
  },

  // Avant partage
  beforeShare: async (data) => {
    console.log("[Sante] beforeShare:", data);
  },

  // Après partage
  afterShare: async (data) => {
    console.log("[Sante] afterShare:", data);
    toast.success("Partagé avec succès");
  },
};

// Fonction d'initialisation séparée (appelée depuis un point d'entrée approprié)
export const initSanteModule = () => {
  console.log("[Sante] Module initialized");
  // Initialisation des sous‑modules (services, AI, etc.)
};

// Fonctions mount/unmount si besoin (à appeler manuellement)
export const mountSanteModule = () => {
  console.log("[Sante] Module mounted");
  // Chargement des données initiales si nécessaire
};

export const unmountSanteModule = () => {
  console.log("[Sante] Module unmounted");
  // Nettoyage des ressources
};
