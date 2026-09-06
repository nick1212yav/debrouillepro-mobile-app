import { createContext, useContext } from "react";
import type { User } from "firebase/auth";
import type { ConvexUser } from "../types/auth.types";

export type AuthContextType = {
  firebaseUser: User | null;
  convexUser: ConvexUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  // Profil
  name: string | null;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  roles: string[];
  permissions: string[];
  emailVerified: boolean;
  onboardingCompleted: boolean;
  reputationScore: number;
  // Helpers
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  // Actions
  syncUser: (roles?: string[], extras?: any) => Promise<any>;
  // ⚠️ déprécié
  isAdmin: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
