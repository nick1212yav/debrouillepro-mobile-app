// src/features/auth/providers/AuthProvider.tsx

import type { ReactNode } from "react";

import { ConvexUserProvider } from "./ConvexUserProvider";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider
 *
 * Couche d'orchestration du module Auth.
 *
 * Le provider Firebase est fourni par la couche globale
 * de l'application (`src/components/providers/`).
 * Ici, on ajoute uniquement la synchronisation/utilisation
 * de l'utilisateur côté Convex.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <ConvexUserProvider>{children}</ConvexUserProvider>;
}
