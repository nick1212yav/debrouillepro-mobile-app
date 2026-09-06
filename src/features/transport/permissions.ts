// src/features/transport/permissions.ts

export type TransportPermission =
  | "route:create"
  | "route:cancel"
  | "booking:create"
  | "booking:cancel"
  | "fleet:manage"
  | "admin:all";

export const permissions = {
  // Passager / Client standard
  passenger: [
    "route:read",
    "booking:create",
    "booking:cancel",
  ] as TransportPermission[],

  // Chauffeur de taxi ou partenaire de covoiturage
  driver: [
    "route:read",
    "route:create",
    "route:cancel",
    "booking:read",
  ] as TransportPermission[],

  // Gérant de coopérative de transport / Gérant de flotte d'entreprise [2]
  fleet_manager: [
    "route:read",
    "route:create",
    "route:cancel",
    "booking:read",
    "fleet:manage",
  ] as TransportPermission[],

  // Administrateur plateforme
  admin: ["admin:all"] as TransportPermission[],
};

/**
 * Helper de vérification de droits d'accès
 */
export function hasTransportPermission(
  userRoles: string[],
  requiredPermission: TransportPermission,
): boolean {
  if (userRoles.includes("admin")) return true;

  return userRoles.some((role) => {
    const rolePermissions = (
      permissions as Record<string, TransportPermission[]>
    )[role];
    return rolePermissions
      ? rolePermissions.includes(requiredPermission)
      : false;
  });
}
