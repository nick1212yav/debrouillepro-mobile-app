import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseUser } from "./useFirebaseUser";

export function useAuthRedirect(redirectTo = "/") {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useFirebaseUser();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);
}
