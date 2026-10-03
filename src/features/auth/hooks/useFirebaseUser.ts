// src/features/auth/hooks/useFirebaseUser.ts

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

/**
 * Hook d'accès à l'utilisateur Firebase.
 *
 * Responsabilité unique :
 * - exposer l'utilisateur Firebase courant ;
 * - exposer l'état de chargement ;
 * - exposer l'état d'authentification.
 *
 * Aucune logique Convex n'est exécutée ici.
 */
export function useFirebaseUser() {
  const { user, loading, isAuthenticated } = useFirebaseAuth();

  return {
    user,
    loading,
    isAuthenticated,
  };
}
