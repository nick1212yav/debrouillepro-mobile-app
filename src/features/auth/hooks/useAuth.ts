import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseUser } from "./useFirebaseUser";
import { useConvexUser } from "./useConvexUser";
import { ConvexUserService } from "../services/convex/user.service";
import { hasPermission } from "../validators/user.validators";

export function useAuth() {
  const { user, loading: firebaseLoading, isAuthenticated } = useFirebaseUser();
  const { convexUser, isLoading: convexLoading } = useConvexUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  const syncUser = useCallback(
    async (
      roles: string[] = ["particulier"],
      extras?: Parameters<typeof ConvexUserService.buildSyncData>[2],
    ) => {
      if (!user) return null;
      const data = ConvexUserService.buildSyncData(user, roles, extras);
      return await createOrUpdateUser(data);
    },
    [user, createOrUpdateUser],
  );

  return {
    // Firebase
    firebaseUser: user,
    isAuthenticated,

    // Convex
    convexUser,
    loading: firebaseLoading || convexLoading,

    // Profil
    name: convexUser?.name || null,
    avatar: convexUser?.avatar || null,
    email: convexUser?.email || null,
    phone: convexUser?.phone || null,
    roles: convexUser?.roles || ["particulier"],
    permissions: convexUser?.permissions || [],
    emailVerified: convexUser?.emailVerified || false,
    onboardingCompleted: convexUser?.onboardingCompleted || false,
    reputationScore: convexUser?.reputationScore || 0,

    // Helpers
    hasPermission: (permission: string) =>
      hasPermission(convexUser, permission),
    hasAnyPermission: (permissions: string[]) =>
      permissions.some((p) => hasPermission(convexUser, p)),

    // Actions
    syncUser,

    // ⚠️ Déprécié – utiliser hasPermission("admin.dashboard") à la place
    isAdmin: convexUser?.isAdmin || false,
  };
}
