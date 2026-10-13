import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptServiceProvider } from "../adapter";

export interface UseServiceOptions {
  /**
   * Réservé aux écrans de développement/preview authentifiés.
   * Le backend doit également contrôler les autorisations.
   */
  allowDemo?: boolean;
}

export function useService(
  providerId: Id<"serviceProviders"> | undefined,
  options: UseServiceOptions = {},
) {
  const doc = useQuery(
    api.services.providers.getProviderById,
    providerId
      ? {
          id: providerId,
          ...(options.allowDemo === undefined
            ? {}
            : { allowDemo: options.allowDemo }),
        }
      : "skip",
  );

  if (doc === undefined || doc === null) {
    return doc;
  }

  return adaptServiceProvider(doc);
}
