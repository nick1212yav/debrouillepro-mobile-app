import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useFirebaseUser } from "./useFirebaseUser";

export function useAuthRedirect(redirectTo = "/") {
  const router = useRouter();
  const { isAuthenticated, loading } = useFirebaseUser();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);
}
