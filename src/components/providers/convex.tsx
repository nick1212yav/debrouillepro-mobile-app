// src/components/providers/convex.tsx

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// Vite/Web : import.meta.env.VITE_CONVEX_URL
// Expo/React Native : process.env.EXPO_PUBLIC_CONVEX_URL
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error(
    "[convex] EXPO_PUBLIC_CONVEX_URL manquante. " +
      "Ajoute-la dans .env.local et relance `npx expo start --clear`.",
  );
}

const convex = new ConvexReactClient(CONVEX_URL);

interface ConvexProviderWrapperProps {
  children: ReactNode;
}

export function ConvexProviderWrapper({
  children,
}: ConvexProviderWrapperProps) {
  const auth = useFirebaseAuth();

  return (
    <ConvexProviderWithAuth
      client={convex}
      useAuth={() => ({
        isLoading: auth.loading,
        isAuthenticated: auth.isAuthenticated,
        fetchAccessToken: auth.fetchAccessToken,
      })}
    >
      {children}
    </ConvexProviderWithAuth>
  );
}
