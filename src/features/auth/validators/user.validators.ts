import type { ConvexUser } from "../types/auth.types";

/**
 * Vérifie qu'une valeur possède la structure minimale
 * attendue pour un utilisateur Convex.
 */
export function isValidConvexUser(user: unknown): user is ConvexUser {
  if (typeof user !== "object" || user === null) {
    return false;
  }

  const candidate = user as Record<string, unknown>;

  return (
    typeof candidate.uid === "string" &&
    typeof candidate.tokenIdentifier === "string" &&
    typeof candidate.name === "string" &&
    Array.isArray(candidate.roles) &&
    candidate.roles.every((role) => typeof role === "string") &&
    (candidate.permissions === undefined ||
      (Array.isArray(candidate.permissions) &&
        candidate.permissions.every(
          (permission) => typeof permission === "string",
        ))) &&
    typeof candidate.emailVerified === "boolean"
  );
}

/**
 * Vérifie si l'utilisateur possède une permission donnée.
 */
export function hasPermission(
  user: ConvexUser | null,
  permission: string,
): boolean {
  if (!user || !permission.trim()) {
    return false;
  }

  return user.permissions?.includes(permission) ?? false;
}

/**
 * Vérifie si l'utilisateur possède au moins une
 * des permissions demandées.
 */
export function hasAnyPermission(
  user: ConvexUser | null,
  permissions: string[],
): boolean {
  if (!user || permissions.length === 0) {
    return false;
  }

  return permissions.some((permission) => hasPermission(user, permission));
}
