import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useAppUser() {
  const { isAuthenticated } = useFirebaseAuth();

  const convexUser = useCurrentUser();

  const isAdmin =
    useQuery(api.admin.isAdmin, isAuthenticated ? {} : "skip") ?? false;

  // À connecter plus tard
  const isPremium = false;

  const isVerified = convexUser?.onboardingCompleted ?? false;

  // ✅ Nouveau schéma : roles[]
  const role = convexUser?.roles?.[0] ?? "particulier";

  return {
    user: convexUser,
    isAuthenticated,
    isAdmin,
    isPremium,
    isVerified,
    role,
  };
}
