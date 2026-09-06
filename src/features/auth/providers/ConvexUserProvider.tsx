import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { AuthContext } from "../context/AuthContext";

interface ConvexUserProviderProps {
  children: ReactNode;
}

export function ConvexUserProvider({ children }: ConvexUserProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
