// src/features/auth/hooks/useConvexUser.ts

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";

import { useFirebaseUser } from "./useFirebaseUser";

/**
 * Récupère l'utilisateur Convex correspondant
 * à l'identité Firebase actuellement authentifiée.
 *
 * `api.users.getCurrentUser` utilise
 * `ctx.auth.getUserIdentity()` côté Convex
 * et n'accepte donc aucun argument métier.
 */
export function useConvexUser() {
  const { isAuthenticated } = useFirebaseUser();

  const convexUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );

  return {
    convexUser: convexUser ?? null,
    isLoading: isAuthenticated && convexUser === undefined,
  };
}
