import { View } from "react-native";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useFirebaseUser } from "../hooks/useFirebaseUser";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: string;
  requireEmailVerified?: boolean;
}

export function AuthGuard({
  children,
  fallback = "/auth",
  requireEmailVerified = false,
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useFirebaseUser();

  if (loading) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-[#020617]">
        <View className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallback} replace />;
  }

  // Optionnel : vérifier que l'email est vérifié
  // (à implémenter avec useAuthContext)

  return <>{children}</>;
}
