// src/hooks/use-publications.ts

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.js";

/* ============================================================================
 * TYPES
 * ========================================================================== */

/**
 * Source de vérité :
 * le type est directement dérivé du schéma Convex.
 *
 * Cela garantit que le frontend reste synchronisé avec :
 *   convex/schema.ts
 *   convex/publications.ts
 *   PublicationCard
 *   LiveFeed
 */
export type PublicationType = Doc<"publications">["type"];

/* ============================================================================
 * PUBLICATION TYPES
 * ========================================================================== */

export const PUBLICATION_TYPES: {
  value: PublicationType | "all";
  label: string;
  color: string;
}[] = [
  {
    value: "all",
    label: "Tout",
    color: "#8B5CF6",
  },
  {
    value: "immo",
    label: "Immo",
    color: "#10B981",
  },
  {
    value: "job",
    label: "Emploi",
    color: "#8B5CF6",
  },
  {
    value: "service",
    label: "Services",
    color: "#F97316",
  },
  {
    value: "evenement",
    label: "Événements",
    color: "#EC4899",
  },
  {
    value: "community",
    label: "Community",
    color: "#3B82F6",
  },
  {
    value: "agri",
    label: "Agri",
    color: "#84CC16",
  },
  {
    value: "sante",
    label: "Santé",
    color: "#EF4444",
  },
  {
    value: "transport",
    label: "Transport",
    color: "#6366F1",
  },
  {
    value: "annonce",
    label: "Annonces",
    color: "#F59E0B",
  },
  {
    value: "restauration",
    label: "Restauration",
    color: "#F97316",
  },
  {
    value: "hebergement",
    label: "Hébergement",
    color: "#10B981",
  },
  {
    value: "energie",
    label: "Énergie",
    color: "#FBBF24",
  },
  {
    value: "ong",
    label: "ONG",
    color: "#10B981",
  },
  {
    value: "video",
    label: "Vidéo",
    color: "#EF4444",
  },
  {
    value: "article",
    label: "Article",
    color: "#06B6D4",
  },
  {
    value: "sondage",
    label: "Sondage",
    color: "#A855F7",
  },
  {
    value: "marketplace",
    label: "Produits",
    color: "#F97316",
  },
  {
    value: "network",
    label: "Réseau",
    color: "#6366F1",
  },
  {
    value: "voyages",
    label: "Voyages",
    color: "#0EA5E9",
  },
];

/* ============================================================================
 * LABELS
 * ========================================================================== */

export const TYPE_LABELS: Record<PublicationType, string> = {
  immo: "Immobilier",
  job: "Emploi",
  service: "Service",
  evenement: "Événement",
  community: "Community",
  agri: "Agriculture",
  sante: "Santé",
  transport: "Transport",
  annonce: "Annonce",
  restauration: "Restauration",
  hebergement: "Hébergement",
  energie: "Énergie",
  ong: "ONG",
  video: "Vidéo",
  article: "Article",
  sondage: "Sondage",
  marketplace: "Produit",
  network: "Réseau",
  voyages: "Voyages",
};

/* ============================================================================
 * COLORS
 * ========================================================================== */

export const TYPE_COLORS: Record<PublicationType, string> = {
  immo: "#10B981",
  job: "#8B5CF6",
  service: "#F97316",
  evenement: "#EC4899",
  community: "#3B82F6",
  agri: "#84CC16",
  sante: "#EF4444",
  transport: "#6366F1",
  annonce: "#F59E0B",
  restauration: "#F97316",
  hebergement: "#10B981",
  energie: "#FBBF24",
  ong: "#10B981",
  video: "#EF4444",
  article: "#06B6D4",
  sondage: "#A855F7",
  marketplace: "#F97316",
  network: "#6366F1",
  voyages: "#0EA5E9",
};

/* ============================================================================
 * FEED
 * ========================================================================== */

export function useFeed(type?: PublicationType) {
  return usePaginatedQuery(api.publications.listFeed, type ? { type } : {}, {
    initialNumItems: 12,
  });
}

/* ============================================================================
 * PUBLICATIONS
 * ========================================================================== */

export function useCreatePublication() {
  return useMutation(api.publications.createPublication);
}

export function useLikePublication() {
  return useMutation(api.publications.likePublication);
}

export function useDeletePublication() {
  return useMutation(api.publications.deletePublication);
}

export function useMyPublications() {
  return useQuery(api.publications.getMyPublications, {});
}

/* ============================================================================
 * JOBS
 * ========================================================================== */

export function useCreateJob() {
  return useMutation(api.employment.createJob);
}

/* ============================================================================
 * DEVELOPMENT / DEMO
 * ========================================================================== */

export function useSeedDemo() {
  return useMutation(api.publications.seedDemoPublications);
}
