// src/features/auth/guards/AuthGuard.tsx

import type { ReactNode } from "react";
import { View } from "react-native";

import { useFirebaseUser } from "../hooks/useFirebaseUser";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AuthGuard
 *
 * Garde réutilisable pour protéger un écran ou une section
 * nécessitant une authentification Firebase.
 *
 * Le composant reste indépendant du système de routing :
 * aucune dépendance à react-router-dom ou à une API DOM.
 *
 * `fallback` permet au parent de fournir son propre écran
 * lorsque l'utilisateur n'est pas authentifié.
 */
export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const { isAuthenticated, loading } = useFirebaseUser();

  if (loading) {
    return (
      <View className="min-h-screen flex-1 items-center justify-center bg-[#020617]">
        <View className="h-8 w-8 rounded-full border-2 border-violet-400 border-t-transparent" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
