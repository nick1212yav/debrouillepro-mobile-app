import type { UserPermissions } from "../navigation.types";

type PermissionRule = (perms: UserPermissions) => boolean;

export const NavigationPermissions: Record<string, PermissionRule> = {
  // Admin uniquement
  admin: (p) => p.isAdmin,
  adminUsers: (p) => p.isAdmin,
  adminModules: (p) => p.isAdmin,
  adminAnalytics: (p) => p.isAdmin,
  adminSecurity: (p) => p.isAdmin,
  adminData: (p) => p.isAdmin,

  // Premium
  premium: (p) => p.isPremium || p.isAdmin,
  businesshub: (p) => p.isPremium || p.isAdmin,

  // Vérifié
  marketplacepro: (p) => p.isVerified || p.isAdmin,

  // Par défaut : tous les autres items sont accessibles
};

export function hasPermission(itemId: string, perms: UserPermissions): boolean {
  const rule = NavigationPermissions[itemId];
  if (!rule) return true;
  return rule(perms);
}
