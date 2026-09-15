// src/features/network/services/matching.service.ts
import type { Id } from "@/convex/_generated/dataModel";
import type {
  NetworkJobMatch,
  NetworkServiceMatch,
  NetworkOpportunityFilters,
} from "../types/opportunity.types";
import type { NetworkUser } from "../types/network.types"; // ✅ Correction : import du type manquant
import { toast } from "sonner";

/**
 * Service pour les recommandations et le matching professionnel.
 * Encapsule la logique de matching pour les emplois, services et connexions.
 */
export class MatchingService {
  /**
   * Récupère les offres d'emploi recommandées pour un utilisateur (Stubbed pour la compilation)
   */
  static useJobMatches(
    userId: Id<"users">,
    filters?: NetworkOpportunityFilters,
    limit: number = 10,
  ) {
    // ✅ Correction : api.matching.* étant absent, renvoie un fallback d'attente pour la compilation
    return {
      jobs: undefined as NetworkJobMatch[] | undefined,
      isLoading: false,
      isEmpty: true,
    };
  }

  /**
   * Récupère les services recommandés pour un utilisateur (Stubbed pour la compilation)
   */
  static useServiceMatches(
    userId: Id<"users">,
    filters?: NetworkOpportunityFilters,
    limit: number = 10,
  ) {
    // ✅ Correction : api.matching.* étant absent, renvoie un fallback d'attente pour la compilation
    return {
      services: undefined as NetworkServiceMatch[] | undefined,
      isLoading: false,
      isEmpty: true,
    };
  }

  /**
   * Postule à une offre d'emploi
   */
  static async applyToJob(jobId: string, applyFn: any): Promise<boolean> {
    // ✅ Correction : Id<"jobs"> -> string
    try {
      await applyFn({ jobId });
      toast.success("Candidature envoyée");
      return true;
    } catch {
      toast.error("Erreur lors de la candidature");
      return false;
    }
  }

  /**
   * Sauvegarde une offre d'emploi ou un service
   */
  static async saveOpportunity(
    id: string,
    type: "job" | "service",
    saveFn: any,
  ): Promise<boolean> {
    try {
      await saveFn({ id, type });
      toast.success("Sauvegardé");
      return true;
    } catch {
      toast.error("Erreur lors de la sauvegarde");
      return false;
    }
  }

  /**
   * Supprime une sauvegarde
   */
  static async unsaveOpportunity(
    id: string,
    type: "job" | "service",
    unsaveFn: any,
  ): Promise<boolean> {
    try {
      await unsaveFn({ id, type });
      toast.success("Retiré des sauvegardes");
      return true;
    } catch {
      toast.error("Erreur lors de la suppression");
      return false;
    }
  }

  /**
   * Récupère les opportunités sauvegardées par un utilisateur (Stubbed pour la compilation)
   */
  static useSavedOpportunities(userId: Id<"users">, type?: "job" | "service") {
    // ✅ Correction : api.matching.* étant absent, renvoie un fallback d'attente pour la compilation
    return {
      opportunities: undefined as
        | Array<{ id: string; type: string; data: any }>
        | undefined,
      isLoading: false,
    };
  }

  /**
   * Récupère les recommandations de connexions professionnelles (Stubbed pour la compilation)
   */
  static useConnectionRecommendations(userId: Id<"users">, limit: number = 10) {
    // ✅ Correction : api.matching.* étant absent, renvoie un fallback d'attente pour la compilation
    return {
      recommendations: undefined as
        | Array<{
            user: NetworkUser;
            matchScore: number;
            reason: string;
            commonConnections: number;
            commonInterests: string[];
          }>
        | undefined,
      isLoading: false,
    };
  }

  /**
   * Demande une recommandation professionnelle pour un utilisateur
   */
  static async requestRecommendation(
    toUserId: Id<"users">,
    context: string,
    requestFn: any,
  ): Promise<boolean> {
    try {
      await requestFn({ toUserId, context });
      toast.success("Demande de recommandation envoyée");
      return true;
    } catch {
      toast.error("Erreur lors de la demande");
      return false;
    }
  }
}
