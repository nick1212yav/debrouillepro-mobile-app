import type { ReactNode } from "react";
import { ConvexUserProvider } from "./ConvexUserProvider";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Le provider Firebase est déjà en place dans src/components/providers/
  // On ajoute juste la couche Convex par-dessus.
  return <ConvexUserProvider>{children}</ConvexUserProvider>;
}
