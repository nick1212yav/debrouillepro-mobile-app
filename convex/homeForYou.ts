// convex/homeForYou.ts

import { query, type QueryCtx } from "./_generated/server";

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_PAGE_SIZE = 24;

const HISTORY_DAYS = 30;
const HISTORY_LIMIT = 500;

const FOLLOWING_LIMIT = 200;

const TYPE_SCORE = 45;
const CATEGORY_SCORE = 28;
const MODULE_SCORE = 22;
const TAG_SCORE = 18;
const FOLLOWING_SCORE = 24;
const RECENCY_SCORE = 22;
const ENGAGEMENT_SCORE = 18;
const BEHAVIOR_SCORE = 35;
const EXPLORATION_SCORE = 8;

const DAY_MS = 24 * 60 * 60 * 1000;

const HOME_TYPES = [
  "immo",
  "job",
  "service",
  "evenement",
  "community",
  "agri",
  "sante",
  "transport",
  "annonce",
  "restauration",
  "hebergement",
  "energie",
  "ong",
  "video",
  "article",
  "sondage",
  "marketplace",
  "network",
  "voyages",
] as const;

type HomeType = (typeof HOME_TYPES)[number];

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface PreferenceProfile {
  feedCategories: string[];
  favoriteModules: string[];
}

interface BehaviorSignal {
  itemId?: string;
  itemType?: string;
  moduleId?: string;
  eventType: string;
  timestamp: number;
}

interface InteractionSignal {
  publicationId: Id<"publications">;
  type: string;
}

interface CandidateScore {
  score: number;
  reasons: string[];
}

interface HomeForYouItem {
  _id: Id<"publications">;
  _creationTime: number;

  authorId: Id<"users">;

  type: HomeType;
  title: string;
  description: string;

  price?: string;
  location?: string;
  category?: string;

  images: string[];
  tags: string[];

  likeCount: number;
  viewCount: number;
  commentCount: number;

  status: Doc<"publications">["status"];

  latitude?: number;
  longitude?: number;

  score: number;
  reason: string;

  likedByMe: boolean;
  followedAuthor: boolean;
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Retourne l'utilisateur correspondant à l'identité Convex/Firebase.
 *
 * Architecture du projet :
 *
 * Firebase Auth
 *      ↓
 * Convex identity
 *      ↓
 * users.by_token
 */
async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.tokenIdentifier) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

/**
 * Normalise les chaînes utilisateur avant comparaison.
 */
function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Vérifie si deux valeurs textuelles sont suffisamment proches
 * pour constituer un signal de recommandation.
 */
function textMatches(value: string | undefined, candidates: string[]): boolean {
  if (!value || candidates.length === 0) {
    return false;
  }

  const normalizedValue = normalize(value);

  return candidates.some((candidate) => {
    const normalizedCandidate = normalize(candidate);

    if (!normalizedCandidate) {
      return false;
    }

    return (
      normalizedValue === normalizedCandidate ||
      normalizedValue.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedValue)
    );
  });
}

/**
 * Intersection de deux listes textuelles.
 */
function countMatches(values: string[], candidates: string[]): number {
  if (values.length === 0 || candidates.length === 0) {
    return 0;
  }

  const normalizedCandidates = new Set(candidates.map(normalize));

  return values.reduce((count, value) => {
    return normalizedCandidates.has(normalize(value)) ? count + 1 : count;
  }, 0);
}

/**
 * Score de fraîcheur.
 *
 * Plus la publication est récente, plus elle conserve
 * une partie importante du signal.
 */
function getRecencyScore(creationTime: number, now: number): number {
  const age = Math.max(0, now - creationTime);

  if (age <= DAY_MS) {
    return RECENCY_SCORE;
  }

  if (age <= 3 * DAY_MS) {
    return RECENCY_SCORE * 0.82;
  }

  if (age <= 7 * DAY_MS) {
    return RECENCY_SCORE * 0.62;
  }

  if (age <= 14 * DAY_MS) {
    return RECENCY_SCORE * 0.42;
  }

  if (age <= 30 * DAY_MS) {
    return RECENCY_SCORE * 0.2;
  }

  return 0;
}

/**
 * Score d'engagement public.
 *
 * On utilise uniquement les compteurs métier déjà présents
 * sur publications.
 */
function getEngagementScore(publication: Doc<"publications">): number {
  const likes = Math.max(0, publication.likeCount);
  const comments = Math.max(0, publication.commentCount);
  const views = Math.max(0, publication.viewCount);

  if (views <= 0) {
    return Math.min(ENGAGEMENT_SCORE, likes * 1.5 + comments * 2);
  }

  const engagementRate = (likes * 2 + comments * 3) / views;

  if (engagementRate >= 0.2) {
    return ENGAGEMENT_SCORE;
  }

  if (engagementRate >= 0.1) {
    return ENGAGEMENT_SCORE * 0.8;
  }

  if (engagementRate >= 0.05) {
    return ENGAGEMENT_SCORE * 0.6;
  }

  if (engagementRate >= 0.02) {
    return ENGAGEMENT_SCORE * 0.35;
  }

  return ENGAGEMENT_SCORE * 0.15;
}

/**
 * Retourne une petite raison humaine et déterministe.
 *
 * Aucun texte inventé à partir de données absentes.
 */
function buildReason(reasons: string[]): string {
  if (reasons.length === 0) {
    return "Sélection récente de DébrouillePro";
  }

  return reasons.slice(0, 2).join(" · ");
}

/**
 * Score comportemental basé sur les signaux Home.
 */
function getBehaviorScore(
  publication: Doc<"publications">,
  signals: BehaviorSignal[],
): number {
  const publicationId = String(publication._id);

  const related = signals.filter((signal) => signal.itemId === publicationId);

  if (related.length === 0) {
    return 0;
  }

  let score = 0;

  for (const signal of related) {
    const age = Math.max(0, Date.now() - signal.timestamp);

    const recencyMultiplier =
      age <= 7 * DAY_MS ? 1 : age <= 30 * DAY_MS ? 0.55 : 0.2;

    switch (signal.eventType) {
      case "click":
        score += 12 * recencyMultiplier;
        break;

      case "save":
        score += 20 * recencyMultiplier;
        break;

      case "like":
        score += 18 * recencyMultiplier;
        break;

      case "share":
        score += 24 * recencyMultiplier;
        break;

      case "comment":
        score += 22 * recencyMultiplier;
        break;

      case "item_impression":
        score += 3 * recencyMultiplier;
        break;

      case "search":
        score += 8 * recencyMultiplier;
        break;

      default:
        break;
    }
  }

  return Math.min(BEHAVIOR_SCORE, score);
}

/**
 * Score basé sur les interactions métier.
 */
function getInteractionScore(
  publicationId: Id<"publications">,
  interactions: InteractionSignal[],
): number {
  const related = interactions.filter(
    (interaction) => interaction.publicationId === publicationId,
  );

  if (related.length === 0) {
    return 0;
  }

  let score = 0;

  for (const interaction of related) {
    switch (interaction.type) {
      case "save":
        score += 12;
        break;

      case "like":
        score += 10;
        break;

      case "share":
        score += 15;
        break;

      case "comment":
        score += 14;
        break;

      case "view":
        score += 4;
        break;

      case "click":
        score += 7;
        break;

      default:
        break;
    }
  }

  return Math.min(BEHAVIOR_SCORE, score);
}

/**
 * Calcule la pertinence d'une publication.
 */
function scorePublication(
  publication: Doc<"publications">,
  preferences: PreferenceProfile,
  behaviorSignals: BehaviorSignal[],
  interactions: InteractionSignal[],
  followedAuthor: boolean,
  now: number,
): CandidateScore {
  let score = 0;

  const reasons: string[] = [];

  const normalizedType = normalize(publication.type);

  const normalizedCategory = publication.category
    ? normalize(publication.category)
    : "";

  const preferenceTypes = preferences.feedCategories.map(normalize);

  const favoriteModules = preferences.favoriteModules.map(normalize);

  /* ---------------------------------------------------------------------- */
  /* Type                                                                     */
  /* ---------------------------------------------------------------------- */

  if (preferenceTypes.includes(normalizedType)) {
    score += TYPE_SCORE;

    reasons.push("correspond à vos préférences");
  }

  /* ---------------------------------------------------------------------- */
  /* Category                                                                 */
  /* ---------------------------------------------------------------------- */

  if (normalizedCategory && preferenceTypes.includes(normalizedCategory)) {
    score += CATEGORY_SCORE;

    if (reasons.length === 0) {
      reasons.push("dans une catégorie que vous consultez");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Favorite modules                                                        */
  /* ---------------------------------------------------------------------- */

  if (favoriteModules.includes(normalizedType)) {
    score += MODULE_SCORE;

    if (reasons.length < 2) {
      reasons.push("lié à un module favori");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Tags                                                                     */
  /* ---------------------------------------------------------------------- */

  const tagMatches = countMatches(publication.tags, [
    ...preferences.feedCategories,
    ...preferences.favoriteModules,
  ]);

  if (tagMatches > 0) {
    score += Math.min(TAG_SCORE, tagMatches * 6);

    if (reasons.length < 2) {
      reasons.push("proche de vos centres d'intérêt");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Follow graph                                                             */
  /* ---------------------------------------------------------------------- */

  if (followedAuthor) {
    score += FOLLOWING_SCORE;

    if (reasons.length < 2) {
      reasons.push("publié par une personne que vous suivez");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Behavioral signals                                                      */
  /* ---------------------------------------------------------------------- */

  const behaviorScore = getBehaviorScore(publication, behaviorSignals);

  score += behaviorScore;

  if (behaviorScore > 0 && reasons.length < 2) {
    reasons.push("proche de votre activité récente");
  }

  /* ---------------------------------------------------------------------- */
  /* Direct interactions                                                     */
  /* ---------------------------------------------------------------------- */

  const interactionScore = getInteractionScore(publication._id, interactions);

  score += interactionScore;

  /* ---------------------------------------------------------------------- */
  /* Recency                                                                  */
  /* ---------------------------------------------------------------------- */

  score += getRecencyScore(publication._creationTime, now);

  /* ---------------------------------------------------------------------- */
  /* Public engagement                                                       */
  /* ---------------------------------------------------------------------- */

  score += getEngagementScore(publication);

  /* ---------------------------------------------------------------------- */
  /* Exploration                                                             */
  /* ---------------------------------------------------------------------- */

  /*
   * Une personnalisation sérieuse ne doit pas enfermer l'utilisateur
   * dans son historique.
   *
   * Le signal d'exploration reste volontairement faible.
   */
  if (reasons.length === 0) {
    score += EXPLORATION_SCORE;
  }

  return {
    score,
    reasons,
  };
}

/* -------------------------------------------------------------------------- */
/* DIVERSIFICATION                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Évite que la Home affiche une longue série du même type.
 *
 * La diversification intervient APRÈS le scoring.
 */
function diversify(
  items: Array<{
    publication: Doc<"publications">;
    score: number;
    reasons: string[];
    followedAuthor: boolean;
  }>,
): typeof items {
  const result: typeof items = [];

  const typeCounts = new Map<string, number>();

  for (const item of items) {
    const type = item.publication.type;

    const count = typeCounts.get(type) ?? 0;

    /*
     * Autorise plusieurs éléments d'un même type,
     * mais évite une domination totale.
     */
    const limit = count === 0 ? 3 : count === 1 ? 2 : 1;

    if (count >= limit) {
      continue;
    }

    typeCounts.set(type, count + 1);

    result.push(item);
  }

  /*
   * Si le filtre de diversification a retiré trop d'éléments,
   * on complète avec les meilleurs candidats restants.
   */
  if (result.length < Math.min(6, items.length)) {
    const selectedIds = new Set(
      result.map((item) => String(item.publication._id)),
    );

    for (const item of items) {
      if (selectedIds.has(String(item.publication._id))) {
        continue;
      }

      result.push(item);

      if (result.length >= Math.min(6, items.length)) {
        break;
      }
    }
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* PUBLIC QUERY                                                               */
/* -------------------------------------------------------------------------- */

/**
 * DébrouillePro — Home / Pour Vous
 *
 * Source de vérité :
 *
 *   users
 *      +
 *   userPreferences
 *      +
 *   homeEvents
 *      +
 *   interactions
 *      +
 *   follows
 *      +
 *   publications
 *
 * La pagination reste native à Convex.
 *
 * IMPORTANT :
 * Cette query ne crée aucune donnée.
 * Elle ne modifie aucun compteur.
 * Elle ne modifie aucune préférence.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    /*
     * HomeForYou est un espace personnalisé.
     *
     * Sans identité authentifiée,
     * aucune personnalisation privée ne doit
     * être calculée.
     */
    if (!currentUser) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const now = Date.now();

    /* -------------------------------------------------------------------- */
    /* USER PREFERENCES                                                     */
    /* -------------------------------------------------------------------- */

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .unique();

    const preferenceProfile: PreferenceProfile = preferences
      ? {
          feedCategories: preferences.feedCategories,
          favoriteModules: preferences.favoriteModules,
        }
      : {
          feedCategories: [],
          favoriteModules: [],
        };

    /* -------------------------------------------------------------------- */
    /* FOLLOW GRAPH                                                         */
    /* -------------------------------------------------------------------- */

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .take(FOLLOWING_LIMIT);

    const followedIds = new Set<Id<"users">>(
      follows.map((follow) => follow.followingId),
    );

    /* -------------------------------------------------------------------- */
    /* HOME BEHAVIOR                                                        */
    /* -------------------------------------------------------------------- */

    const historySince = now - HISTORY_DAYS * DAY_MS;

    const homeEvents = await ctx.db
      .query("homeEvents")
      .withIndex("by_user_and_timestamp", (q) =>
        q.eq("userId", currentUser._id).gte("timestamp", historySince),
      )
      .order("desc")
      .take(HISTORY_LIMIT);

    const behaviorSignals: BehaviorSignal[] = homeEvents.map((event) => ({
      itemId: event.itemId,
      itemType: event.itemType,
      moduleId: event.moduleId,
      eventType: event.eventType,
      timestamp: event.timestamp,
    }));

    /* -------------------------------------------------------------------- */
    /* BUSINESS INTERACTIONS                                                */
    /* -------------------------------------------------------------------- */

    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .take(HISTORY_LIMIT);

    const interactionSignals: InteractionSignal[] = interactions.map(
      (interaction) => ({
        publicationId: interaction.publicationId,
        type: interaction.type,
      }),
    );

    /* -------------------------------------------------------------------- */
    /* CANDIDATE PUBLICATIONS                                               */
    /* -------------------------------------------------------------------- */

    const candidatePage = await ctx.db
      .query("publications")
      .order("desc")
      .paginate(args.paginationOpts);

    /* -------------------------------------------------------------------- */
    /* FILTER + SCORE                                                       */
    /* -------------------------------------------------------------------- */

    const scored = candidatePage.page
      .filter((publication) =>
        HOME_TYPES.includes(publication.type as HomeType),
      )
      .filter((publication) => publication.status === "active")
      .filter((publication) => publication.isHidden !== true)
      .filter((publication) => publication.authorId !== currentUser._id)
      .map((publication) => {
        const followedAuthor = followedIds.has(publication.authorId);

        const result = scorePublication(
          publication,
          preferenceProfile,
          behaviorSignals,
          interactionSignals,
          followedAuthor,
          now,
        );

        return {
          publication,
          score: result.score,
          reasons: result.reasons,
          followedAuthor,
        };
      });

    /* -------------------------------------------------------------------- */
    /* RANKING                                                              */
    /* -------------------------------------------------------------------- */

    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.publication._creationTime - a.publication._creationTime;
    });

    /* -------------------------------------------------------------------- */
    /* DIVERSIFICATION                                                      */
    /* -------------------------------------------------------------------- */

    const diversified = diversify(scored);

    /* -------------------------------------------------------------------- */
    /* LIMIT                                                                 */
    /* -------------------------------------------------------------------- */

    const requestedLimit = Math.min(
      args.paginationOpts.numItems,
      MAX_PAGE_SIZE,
    );

    const selected = diversified.slice(0, requestedLimit);

    /* -------------------------------------------------------------------- */
    /* ENRICHMENT                                                            */
    /* -------------------------------------------------------------------- */

    const page: HomeForYouItem[] = await Promise.all(
      selected.map(async (item) => {
        const publication = item.publication;

        const like = await ctx.db
          .query("publicationLikes")
          .withIndex("by_user_and_publication", (q) =>
            q
              .eq("userId", currentUser._id)
              .eq("publicationId", publication._id),
          )
          .unique();

        const imageUrls = await Promise.all(
          publication.images.map(async (image) => {
            /*
             * Les publications historiques
             * peuvent contenir une URL directe.
             *
             * Pour une référence Storage,
             * Convex renvoie son URL publique.
             */
            if (image.startsWith("http://") || image.startsWith("https://")) {
              return image;
            }

            try {
              const url = await ctx.storage.getUrl(image as Id<"_storage">);

              return url;
            } catch {
              return null;
            }
          }),
        );

        return {
          _id: publication._id,
          _creationTime: publication._creationTime,

          authorId: publication.authorId,

          type: publication.type as HomeType,

          title: publication.title,

          description: publication.description,

          price: publication.price,

          location: publication.location,

          category: publication.category,

          images: imageUrls.filter((image): image is string => image !== null),

          tags: publication.tags,

          likeCount: publication.likeCount,

          viewCount: publication.viewCount,

          commentCount: publication.commentCount,

          status: publication.status,

          latitude: publication.latitude,

          longitude: publication.longitude,

          score: Math.round(item.score * 100) / 100,

          reason: buildReason(item.reasons),

          likedByMe: like !== null,

          followedAuthor: item.followedAuthor,
        };
      }),
    );

    /* -------------------------------------------------------------------- */
    /* RETURN                                                               */
    /* -------------------------------------------------------------------- */

    return {
      page,
      isDone: candidatePage.isDone || page.length < requestedLimit,

      continueCursor: candidatePage.continueCursor,
    };
  },
});
