import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export type CurrentUser = Doc<"users">;

/**
 * Retourne l'utilisateur actuellement authentifié.
 * - undefined : chargement
 * - null : non connecté ou utilisateur introuvable
 * - Doc<"users"> : utilisateur connecté
 */
export function useCurrentUser(): CurrentUser | null | undefined {
  return useQuery(api.users.getCurrentUser, {});
}

/** Nom à afficher */
export function getDisplayName(user: CurrentUser | null | undefined): string {
  if (user?.name) return user.name;
  if (user?.email) return user.email.split("@")[0];
  return "Utilisateur";
}

/** Initiales pour l'avatar */
export function getInitials(user: CurrentUser | null | undefined): string {
  const name = getDisplayName(user);
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}
