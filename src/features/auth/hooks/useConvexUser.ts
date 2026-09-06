import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseUser } from "./useFirebaseUser";

/**
 * Récupère l'utilisateur Convex à partir de l'identité Firebase.
 * getCurrentUser utilise ctx.auth.getUserIdentity() (args: {}).
 */
export function useConvexUser() {
  const { isAuthenticated } = useFirebaseUser();

  // ✅ getCurrentUser attend {} et utilise ctx.auth.getUserIdentity()
  const convexUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );

  return {
    convexUser: convexUser ?? null,
    isLoading: convexUser === undefined,
  };
}
