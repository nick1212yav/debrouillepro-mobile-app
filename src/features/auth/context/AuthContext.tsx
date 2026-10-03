// src/features/auth/context/AuthContext.tsx

import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

import type { ConvexUser } from "../types/auth.types";

export type AuthContextType = {
  // ── Authentification ───────────────────────────────────────────────
  firebaseUser: User | null;
  convexUser: ConvexUser | null;
  isAuthenticated: boolean;
  loading: boolean;

  // ── Profil ─────────────────────────────────────────────────────────
  name: string | null;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  roles: string[];
  permissions: string[];
  emailVerified: boolean;
  onboardingCompleted: boolean;
  reputationScore: number;

  // ── Permissions ────────────────────────────────────────────────────
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;

  // ── Synchronisation ───────────────────────────────────────────────
  syncUser: (
    roles?: string[],
    extras?: Record<string, unknown>,
  ) => Promise<unknown>;

  // ── Compatibilité legacy ──────────────────────────────────────────
  /** @deprecated Utiliser les rôles/permissions plutôt que ce flag. */
  isAdmin: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
