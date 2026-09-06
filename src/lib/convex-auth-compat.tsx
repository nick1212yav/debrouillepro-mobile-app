import React from "react";
import {
  useQuery,
  useMutation,
  useAction,
  usePaginatedQuery,
  useQueries,
  useConvex,
  ConvexProvider,
  ConvexReactClient,
} from "convex/react";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// -----------------------------------------------------------------------------
// Auth compatibility
// -----------------------------------------------------------------------------

export function useConvexAuth() {
  const { loading, isAuthenticated } = useFirebaseAuth();

  return {
    isLoading: loading,
    isAuthenticated,
  };
}

export function Authenticated({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useFirebaseAuth();

  if (loading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function Unauthenticated({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useFirebaseAuth();

  if (loading || isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function AuthLoading({ children }: { children: React.ReactNode }) {
  const { loading } = useFirebaseAuth();

  if (!loading) {
    return null;
  }

  return <>{children}</>;
}

// -----------------------------------------------------------------------------
// Re-exports Convex
// -----------------------------------------------------------------------------

export {
  useQuery,
  useMutation,
  useAction,
  usePaginatedQuery,
  useQueries,
  useConvex,
  ConvexProvider,
  ConvexReactClient,
};
