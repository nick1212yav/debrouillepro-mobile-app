// src/features/auth/hooks/useAuthRedirect.ts

import { useEffect } from "react";

import { useFirebaseUser } from "./useFirebaseUser";

interface UseAuthRedirectOptions {
  redirectTo?: string;
  onRedirect?: (path: string) => void;
}

/**
 * useAuthRedirect
 *
 * Déclenche une redirection lorsque l'utilisateur est authentifié.
 *
 * Le hook ne dépend volontairement d'aucun routeur web :
 * la navigation est déléguée au composant appelant via `onRedirect`.
 *
 * Exemple :
 * useAuthRedirect({
 *   redirectTo: "/",
 *   onRedirect: navigate,
 * });
 */
export function useAuthRedirect({
  redirectTo = "/",
  onRedirect,
}: UseAuthRedirectOptions = {}) {
  const { isAuthenticated, loading } = useFirebaseUser();

  useEffect(() => {
    if (loading || !isAuthenticated || !onRedirect) {
      return;
    }

    onRedirect(redirectTo);
  }, [isAuthenticated, loading, onRedirect, redirectTo]);
}
