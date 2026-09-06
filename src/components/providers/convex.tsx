import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

interface ConvexProviderWrapperProps {
  children: ReactNode;
}

export function ConvexProviderWrapper({
  children,
}: ConvexProviderWrapperProps) {
  return (
    <ConvexProviderWithAuth
      client={convex}
      useAuth={() => {
        const auth = useFirebaseAuth();

        return {
          isLoading: auth.loading,
          isAuthenticated: auth.isAuthenticated,
          fetchAccessToken: auth.fetchAccessToken,
        };
      }}
    >
      {children}
    </ConvexProviderWithAuth>
  );
}
