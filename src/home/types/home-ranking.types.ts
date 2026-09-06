import type { ModuleId } from "@/config/modules/module.types";

/**
 * ============================================================
 * DÉBROUILLEPRO — HOME
 * RANKING TYPES
 * ============================================================
 *
 * Contrats TypeScript du moteur de classement Home.
 *
 * IMPORTANT :
 * - aucune logique métier ici
 * - aucun accès Convex
 * - aucun calcul
 * - uniquement les contrats partagés
 * ============================================================
 */

/**
 * ============================================================
 * RANKING STRATEGY
 * ============================================================
 *
 * Stratégie utilisée pour produire le classement.
 */
export type RankingStrategy =
  | "default"
  | "personalized"
  | "contextual"
  | "engagement"
  | "recency"
  | "proximity"
  | "hybrid"
  | "home";

/**
 * ============================================================
 * RANKING CONFIDENCE
 * ============================================================
 *
 * Niveau de confiance du score calculé.
 */
export type RankingConfidence = "very_high" | "high" | "medium" | "low";

/**
 * ============================================================
 * RANKING INPUT
 * ============================================================
 *
 * Entrée générique envoyée au moteur de ranking.
 *
 * Le moteur Home peut classer différents types de contenus :
 * - publications
 * - jobs
 * - immobilier
 * - services
 * - événements
 * - annonces
 * - recommandations
 * - etc.
 *
 * Le champ `type` reste donc volontairement générique.
 */
export interface RankingInput {
  /**
   * Identifiant stable de l'élément.
   */
  id: string;

  /**
   * Module propriétaire.
   */
  moduleId?: ModuleId;

  /**
   * Type fonctionnel de l'élément.
   */
  type?: string;

  /**
   * Titre.
   */
  title?: string;

  /**
   * Description.
   */
  description?: string;

  /**
   * Image principale.
   */
  image?: string;

  /**
   * Route de destination.
   */
  route?: string;

  /**
   * Catégorie.
   */
  category?: string;

  /**
   * Score initial éventuel.
   */
  score?: number;

  /**
   * Pertinence.
   */
  relevance?: number;

  /**
   * Score d'engagement.
   */
  engagementScore?: number;

  /**
   * Popularité.
   */
  popularityScore?: number;

  /**
   * Fraîcheur.
   */
  recencyScore?: number;

  /**
   * Proximité.
   */
  proximityScore?: number;

  /**
   * Personnalisation.
   */
  personalizationScore?: number;

  /**
   * Date de création.
   */
  createdAt?: number | Date;

  /**
   * Date de mise à jour.
   */
  updatedAt?: number | Date;

  /**
   * Données additionnelles.
   */
  metadata?: Record<string, unknown>;

  /**
   * Facteurs supplémentaires utilisés par
   * HomeRankingEngine.
   */
  relevanceScore?: number;

  freshness?: number;

  freshnessScore?: number;

  proximity?: number;

  engagement?: number;

  social?: number;

  socialScore?: number;

  urgency?: number;

  urgencyScore?: number;

  quality?: number;

  qualityScore?: number;

  promotion?: number;

  promotionScore?: number;

  /**
   * Timestamp générique.
   */
  timestamp?: number;
}

/**
 * ============================================================
 * RANKING WEIGHTS
 * ============================================================
 */
export interface RankingWeights {
  relevance: number;

  engagement: number;

  popularity: number;

  recency: number;

  proximity: number;

  personalization: number;
}

/**
 * ============================================================
 * RANKING CONTEXT
 * ============================================================
 */
export interface RankingContext {
  /**
   * Utilisateur courant.
   */
  userId?: string;

  /**
   * Module courant.
   */
  moduleId?: ModuleId;

  /**
   * Position géographique.
   */
  location?: {
    latitude?: number;

    longitude?: number;

    city?: string;

    country?: string;
  };

  /**
   * Intérêts.
   */
  interests?: string[];

  /**
   * Catégories préférées.
   */
  categories?: string[];

  /**
   * Modules favoris.
   */
  favoriteModules?: ModuleId[];

  /**
   * Heure/date courante.
   */
  currentTime?: number | Date;

  /**
   * Données additionnelles.
   */
  metadata?: Record<string, unknown>;
}

/**
 * ============================================================
 * RANKING OPTIONS
 * ============================================================
 */
export interface RankingOptions {
  /**
   * Stratégie demandée.
   */
  strategy?: RankingStrategy;

  /**
   * Nombre maximum de résultats.
   */
  limit?: number;

  /**
   * Poids personnalisés.
   */
  weights?: Partial<RankingWeights>;

  /**
   * Score minimum accepté.
   */
  minimumScore?: number;

  /**
   * IDs à exclure.
   */
  excludeIds?: string[];

  /**
   * Diversification du résultat.
   */
  diversify?: boolean;

  /**
   * Inclure les raisons du classement.
   */
  includeReasons?: boolean;

  /**
   * Timestamp utilisé pour les calculs.
   */
  now?: number;
}

/**
 * ============================================================
 * RANKED ITEM
 * ============================================================
 *
 * Élément individuel après classement.
 *
 * IMPORTANT :
 *
 * Ce type NE DOIT PAS étendre RecommendationItem.
 *
 * Le moteur Home classe plusieurs types de contenus et pas
 * uniquement des recommandations.
 */
export interface RankedItem extends RankingInput {
  /**
   * Position finale dans le classement.
   */
  rank: number;

  /**
   * Score final calculé.
   */
  rankingScore: number;

  /**
   * Alias du score utilisé par HomeRankingEngine.
   */
  score: number;

  /**
   * Index original avant classement.
   */
  originalIndex?: number;

  /**
   * Niveau de confiance.
   */
  confidence?: RankingConfidence;

  /**
   * Stratégie ayant produit le classement.
   */
  rankingStrategy?: RankingStrategy;

  /**
   * Décomposition du score.
   */
  rankingBreakdown?: {
    relevance?: number;

    engagement?: number;

    popularity?: number;

    recency?: number;

    proximity?: number;

    personalization?: number;

    freshness?: number;

    social?: number;

    urgency?: number;

    quality?: number;

    promotion?: number;

    final?: number;
  };
}

/**
 ============================================================
 * RANKING RESULT
 * ============================================================
 *
 * Résultat GLOBAL du moteur.
 */
export interface RankingResult {
  /**
   * Éléments classés.
   */
  items: RankedItem[];

  /**
   * Stratégie utilisée.
   */
  strategy: RankingStrategy;

  /**
   * Date de génération.
   */
  generatedAt: Date;

  /**
   * Nombre total de candidats avant limitation.
   */
  totalCandidates: number;

  /**
   * Poids effectivement utilisés.
   */
  weights?: RankingWeights;
}

/**
 * ============================================================
 * BATCH RANKING INPUT
 * ============================================================
 */
export interface BatchRankingInput {
  /**
   * Éléments à classer.
   */
  items: RankingInput[];

  /**
   * Contexte optionnel.
   */
  context?: RankingContext;

  /**
   * Options.
   */
  options?: RankingOptions;
}

/**
 * ============================================================
 * BATCH RANKING RESULT
 * ============================================================
 */
export interface BatchRankingResult {
  /**
   * Éléments classés.
   */
  items: RankedItem[];

  /**
   * Date de génération.
   */
  generatedAt: Date;

  /**
   * Stratégie utilisée.
   */
  strategy: RankingStrategy;

  /**
   * Nombre de candidats.
   */
  totalCandidates: number;
}
