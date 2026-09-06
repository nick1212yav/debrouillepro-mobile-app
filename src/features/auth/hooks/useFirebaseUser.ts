import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

/**
 * Hook simple pour accéder à l'utilisateur Firebase.
 * Ne contient aucune logique Convex.
 */
export function useFirebaseUser() {
  const { user, loading, isAuthenticated } = useFirebaseAuth();
  return { user, loading, isAuthenticated };
}
