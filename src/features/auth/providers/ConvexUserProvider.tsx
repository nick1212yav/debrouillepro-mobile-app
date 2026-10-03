// src/features/auth/providers/ConvexUserProvider.tsx

import type { ReactNode } from "react";

import { AuthContext } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";

interface ConvexUserProviderProps {
  children: ReactNode;
}

/**
 * ConvexUserProvider
 *
 * Expose l'état d'authentification Firebase + Convex
 * via le contexte AuthContext.
 *
 * Toute la logique d'authentification reste centralisée
 * dans `useAuth`.
 */
export function ConvexUserProvider({ children }: ConvexUserProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
