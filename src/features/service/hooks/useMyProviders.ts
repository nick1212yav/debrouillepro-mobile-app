import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptServiceProvider } from "../adapter";

/**
 * Liste des providers créés par l'utilisateur connecté.
 * Inclut les brouillons, les pausés et les archivés.
 */
export function useMyProviders() {
  const docs = useQuery(api.services.providers.getMyProviderProfile);

  if (docs === undefined) {
    return { providers: [], loading: true };
  }

  return {
    providers: docs.map(adaptServiceProvider),
    loading: false,
  };
}
