import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { annonceRegistry } from "./AnnonceRegistry";
import type { Annonce } from "../types";
import { adaptAnnonce } from "../adapter";

/**
 * Bridge pour créer automatiquement des annonces à partir d'autres modules
 */
export function useAnnonceBridge(sourceType: string, sourceId: string) {
  const source = annonceRegistry.getSource(sourceType);
  if (!source) return null;

  // Ici on pourrait appeler une query générique selon le type
  // Pour l'exemple, on suppose qu'on a une query générique
  const data = useQuery(api.publications.getBridgeData, {
    type: sourceType,
    id: sourceId,
  });
  if (!data) return null;

  const adapted = source.adapt(data);
  return adapted;
}

/**
 * Publier une annonce depuis une source externe
 */
export function publishFromBridge(sourceType: string, data: any) {
  const source = annonceRegistry.getSource(sourceType);
  if (!source) throw new Error(`Source ${sourceType} non enregistrée`);
  return source.adapt(data);
}
