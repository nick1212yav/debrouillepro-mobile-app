// src/features/sante/permissions.ts
import type {
  ModulePermissions,
  PermissionRule,
} from "@/core/sdk/types/manifest.types";

// Définition des rôles (exemples)
type Role = "guest" | "user" | "doctor" | "admin";

// Règles de permission : un tableau de rôles ou une fonction (context) => boolean
const allow = (roles: Role[]): PermissionRule => roles;
const allowIf = (fn: (context: any) => boolean): PermissionRule => fn;

export const SANTE_PERMISSIONS: ModulePermissions = {
  // Visualisation : accessible à tous les utilisateurs connectés (et aux invités pour certaines)
  view: ["user", "doctor", "admin"],

  // Création : réservée aux utilisateurs (prendre RDV, commander, etc.)
  create: ["user", "doctor", "admin"],

  // Modification : réservée aux médecins et administrateurs (modifier dossier, etc.)
  edit: ["doctor", "admin"],

  // Suppression : réservée aux administrateurs (annuler RDV, supprimer entité)
  delete: ["admin"],
};

// Export des descriptions pour usage externe (facultatif)
export const SANTE_PERMISSIONS_DESCRIPTIONS: Record<string, string> = {
  view: "Voir les ressources santé (médecins, hôpitaux, pharmacies, etc.)",
  create: "Créer des rendez-vous, commandes, ou téléconsultations",
  edit: "Modifier un dossier médical ou une ordonnance",
  delete: "Annuler un rendez-vous ou supprimer une ressource",
};
