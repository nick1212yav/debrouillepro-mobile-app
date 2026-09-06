import type { ConvexUser } from "../types/auth.types";

export function isValidConvexUser(user: unknown): user is ConvexUser {
  return (
    typeof user === "object" &&
    user !== null &&
    "uid" in user &&
    "tokenIdentifier" in user &&
    "name" in user &&
    "roles" in user &&
    "permissions" in user &&
    "emailVerified" in user
  );
}

export function hasPermission(
  user: ConvexUser | null,
  permission: string,
): boolean {
  if (!user) return false;
  return user.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(
  user: ConvexUser | null,
  permissions: string[],
): boolean {
  if (!user) return false;
  return permissions.some((p) => user.permissions?.includes(p) ?? false);
}
