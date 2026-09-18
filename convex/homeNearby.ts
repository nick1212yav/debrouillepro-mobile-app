// convex/homeNearby.ts

import { query, type QueryCtx } from "./_generated/server";

import { paginationOptsValidator } from "convex/server";

import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";

/* ============================================================================
 * DÉBROUILLEPRO — HOME NEARBY
 *
 * "AUTOUR DE VOUS"
 *
 * Ce moteur est volontairement séparé de :
 *
 *   convex/explorer.ts
 *   convex/explorer/nearby.ts
 *
 * Il appartient exclusivement à la Home.
 *
 * Architecture :
 *
 *   position utilisateur
 *          ↓
 *   rayon géographique
 *          ↓
 *   publications localisées
 *          ↓
 *   catégories utiles
 *          ↓
 *   distance réelle
 *          ↓
 *   pertinence
 *          ↓
 *   diversification
 *          ↓
 *   pagination Convex
 *          ↓
 *   HomeNearby
 *
 * IMPORTANT :
 * - aucune donnée fictive
 * - aucune écriture en base
 * - aucune modification de position utilisateur
 * - aucune dépendance à Explorer
 * - aucun classement arbitraire par ville
 * - aucune distance simulée
 * - aucune pagination simulée
 * ========================================================================== */

/* ============================================================================
 * CONSTANTES
 * ========================================================================== */

const EARTH_RADIUS_KM = 6371;

const DEFAULT_RADIUS_KM = 15;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 100;

const MAX_RESULTS = 24;

/**
 * Nombre maximal de pages source examinées pendant une requête.
 *
 * Pourquoi ?
 *
 * publications n'est pas une table géospatiale.
 * On doit donc parcourir les publications récentes par pages
 * et appliquer le filtre géographique côté serveur.
 *
 * Cela évite :
 * - collect() massif
 * - pagination fictive
 * - chargement de toute la table
 */
const MAX_SOURCE_PAGES = 6;

const SOURCE_BATCH_SIZE = 48;

/**
 * Types réellement présents dans publications
 * et pertinents pour la zone "Autour de vous".
 */
const NEARBY_TYPES = [
  "job",
  "service",
  "evenement",
  "annonce",
  "marketplace",
] as const;

type NearbyType = (typeof NEARBY_TYPES)[number];

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface NearbyCandidate {
  publication: Doc<"publications">;
  distanceKm: number;
  score: number;
  reason: string;
}

interface NearbyItem {
  _id: Id<"publications">;
  _creationTime: number;

  authorId: Id<"users">;

  type: NearbyType;

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

  latitude: number;
  longitude: number;

  distanceKm: number;

  score: number;
  reason: string;
}

/* ============================================================================
 * AUTHENTIFICATION
 * ========================================================================== */

/**
 * Retourne l'utilisateur authentifié.
 *
 * La position n'est PAS lue depuis users.
 * La HomeNearby reçoit volontairement la position courante
 * depuis le client afin de ne pas transformer une position
 * temporaire en donnée persistante.
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

/* ============================================================================
 * GEO
 * ========================================================================== */

/**
 * Vérifie qu'une coordonnée est exploitable.
 */
function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Normalise un rayon utilisateur.
 */
function normalizeRadius(radiusKm: number | undefined): number {
  if (radiusKm === undefined || !Number.isFinite(radiusKm)) {
    return DEFAULT_RADIUS_KM;
  }

  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, radiusKm));
}

/**
 * Conversion degrés → radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Distance géographique réelle avec la formule de Haversine.
 *
 * Résultat en kilomètres.
 */
function haversineDistanceKm(origin: Coordinates, target: Coordinates): number {
  const latitudeDelta = toRadians(target.latitude - origin.latitude);

  const longitudeDelta = toRadians(target.longitude - origin.longitude);

  const originLatitude = toRadians(origin.latitude);

  const targetLatitude = toRadians(target.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(targetLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return EARTH_RADIUS_KM * centralAngle;
}

/* ============================================================================
 * TEXT / PERTINENCE
 * ========================================================================== */

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countMatches(values: string[], candidates: string[]): number {
  if (values.length === 0 || candidates.length === 0) {
    return 0;
  }

  const candidateSet = new Set(candidates.map(normalize));

  return values.reduce(
    (count, value) => (candidateSet.has(normalize(value)) ? count + 1 : count),
    0,
  );
}

/* ============================================================================
 * DISTANCE SCORE
 * ========================================================================== */

/**
 * Plus un résultat est proche, plus il reçoit de poids.
 *
 * Le score décroît progressivement au lieu de faire
 * un brutal "dans le rayon / hors du rayon".
 */
function getDistanceScore(distanceKm: number, radiusKm: number): number {
  if (distanceKm > radiusKm) {
    return 0;
  }

  const ratio = distanceKm / radiusKm;

  if (ratio <= 0.1) {
    return 50;
  }

  if (ratio <= 0.25) {
    return 44;
  }

  if (ratio <= 0.5) {
    return 36;
  }

  if (ratio <= 0.75) {
    return 27;
  }

  return 16;
}

/* ============================================================================
 * RECENCY
 * ========================================================================== */

function getRecencyScore(creationTime: number, now: number): number {
  const age = Math.max(0, now - creationTime);

  const day = 24 * 60 * 60 * 1000;

  if (age <= day) {
    return 24;
  }

  if (age <= 3 * day) {
    return 20;
  }

  if (age <= 7 * day) {
    return 16;
  }

  if (age <= 14 * day) {
    return 10;
  }

  if (age <= 30 * day) {
    return 5;
  }

  return 0;
}

/* ============================================================================
 * ENGAGEMENT
 * ========================================================================== */

function getEngagementScore(publication: Doc<"publications">): number {
  const likes = Math.max(0, publication.likeCount);

  const comments = Math.max(0, publication.commentCount);

  const views = Math.max(0, publication.viewCount);

  /**
   * Nous évitons de favoriser uniquement les publications
   * ayant accumulé énormément de vues.
   *
   * L'engagement est normalisé par rapport aux vues
   * lorsqu'elles existent.
   */
  if (views > 0) {
    const rate = (likes * 2 + comments * 3) / views;

    if (rate >= 0.15) {
      return 18;
    }

    if (rate >= 0.08) {
      return 14;
    }

    if (rate >= 0.04) {
      return 10;
    }

    if (rate >= 0.02) {
      return 6;
    }

    return 2;
  }

  return Math.min(10, likes + comments * 2);
}

/* ============================================================================
 * TYPE PERTINENCE
 * ========================================================================== */

function getTypeScore(type: NearbyType): number {
  switch (type) {
    case "job":
      return 28;

    case "service":
      return 27;

    case "evenement":
      return 25;

    case "marketplace":
      return 23;

    case "annonce":
      return 22;

    default:
      return 0;
  }
}

/* ============================================================================
 * REASON
 * ========================================================================== */

function buildReason(
  type: NearbyType,
  distanceKm: number,
  category?: string,
): string {
  const distanceLabel =
    distanceKm < 1 ? "à moins d'1 km" : `à ${distanceKm.toFixed(1)} km`;

  if (category) {
    return `${category} · ${distanceLabel}`;
  }

  switch (type) {
    case "job":
      return `Emploi proche · ${distanceLabel}`;

    case "service":
      return `Service proche · ${distanceLabel}`;

    case "evenement":
      return `Événement proche · ${distanceLabel}`;

    case "marketplace":
      return `Commerce proche · ${distanceLabel}`;

    case "annonce":
      return `Annonce proche · ${distanceLabel}`;

    default:
      return `À proximité · ${distanceLabel}`;
  }
}

/* ============================================================================
 * SCORING
 * ========================================================================== */

function scoreCandidate(
  publication: Doc<"publications">,
  distanceKm: number,
  radiusKm: number,
  feedCategories: string[],
  favoriteModules: string[],
  now: number,
): NearbyCandidate {
  let score = 0;

  const normalizedCategory = publication.category
    ? normalize(publication.category)
    : "";

  const normalizedType = normalize(publication.type);

  const preferences = [...feedCategories, ...favoriteModules];

  /* ------------------------------------------------------------------------ */
  /* DISTANCE                                                                  */
  /* ------------------------------------------------------------------------ */

  score += getDistanceScore(distanceKm, radiusKm);

  /* ------------------------------------------------------------------------ */
  /* TYPE                                                                      */
  /* ------------------------------------------------------------------------ */

  score += getTypeScore(publication.type as NearbyType);

  /* ------------------------------------------------------------------------ */
  /* PREFERENCES                                                               */
  /* ------------------------------------------------------------------------ */

  if (preferences.some((value) => normalize(value) === normalizedType)) {
    score += 22;
  }

  if (
    normalizedCategory &&
    preferences.some((value) => normalize(value) === normalizedCategory)
  ) {
    score += 18;
  }

  /* ------------------------------------------------------------------------ */
  /* TAGS                                                                      */
  /* ------------------------------------------------------------------------ */

  const tagMatches = countMatches(publication.tags, preferences);

  score += Math.min(15, tagMatches * 5);

  /* ------------------------------------------------------------------------ */
  /* FRAÎCHEUR                                                                 */
  /* ------------------------------------------------------------------------ */

  score += getRecencyScore(publication._creationTime, now);

  /* ------------------------------------------------------------------------ */
  /* ENGAGEMENT                                                                */
  /* ------------------------------------------------------------------------ */

  score += getEngagementScore(publication);

  /* ------------------------------------------------------------------------ */
  /* REASON                                                                    */
  /* ------------------------------------------------------------------------ */

  const reason = buildReason(
    publication.type as NearbyType,
    distanceKm,
    publication.category,
  );

  return {
    publication,
    distanceKm,
    score,
    reason,
  };
}

/* ============================================================================
 * DIVERSIFICATION
 * ========================================================================== */

/**
 * Une zone locale ne doit pas devenir :
 *
 *   job
 *   job
 *   job
 *   job
 *   job
 *
 * lorsque plusieurs catégories sont disponibles.
 *
 * Nous diversifions les types sans casser le classement
 * par pertinence.
 */
function diversify(candidates: NearbyCandidate[]): NearbyCandidate[] {
  const result: NearbyCandidate[] = [];

  const typeCounts = new Map<NearbyType, number>();

  /*
   * Première passe :
   * maximum 3 éléments d'un même type.
   */
  for (const candidate of candidates) {
    const type = candidate.publication.type as NearbyType;

    const current = typeCounts.get(type) ?? 0;

    if (current >= 3) {
      continue;
    }

    typeCounts.set(type, current + 1);

    result.push(candidate);
  }

  /*
   * Deuxième passe :
   * si la diversification a trop réduit le résultat,
   * on complète avec les meilleurs candidats restants.
   */
  if (result.length < Math.min(MAX_RESULTS, candidates.length)) {
    const selected = new Set(
      result.map((item) => String(item.publication._id)),
    );

    for (const candidate of candidates) {
      const id = String(candidate.publication._id);

      if (selected.has(id)) {
        continue;
      }

      result.push(candidate);

      selected.add(id);

      if (result.length >= Math.min(MAX_RESULTS, candidates.length)) {
        break;
      }
    }
  }

  return result;
}

/* ============================================================================
 * PUBLIC QUERY
 * ========================================================================== */

export const list = query({
  args: {
    latitude: v.number(),

    longitude: v.number(),

    radiusKm: v.optional(v.number()),

    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    /* ---------------------------------------------------------------------- */
    /* AUTHENTICATION                                                          */
    /* ---------------------------------------------------------------------- */

    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    /* ---------------------------------------------------------------------- */
    /* POSITION                                                                */
    /* ---------------------------------------------------------------------- */

    if (!isValidCoordinate(args.latitude, args.longitude)) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const origin: Coordinates = {
      latitude: args.latitude,
      longitude: args.longitude,
    };

    const radiusKm = normalizeRadius(args.radiusKm);

    /* ---------------------------------------------------------------------- */
    /* PREFERENCES                                                             */
    /* ---------------------------------------------------------------------- */

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .unique();

    const feedCategories = preferences?.feedCategories ?? [];

    const favoriteModules = preferences?.favoriteModules ?? [];

    /* ---------------------------------------------------------------------- */
    /* PAGINATION                                                              */
    /* ---------------------------------------------------------------------- */

    const requestedItems = Math.min(
      MAX_RESULTS,
      Math.max(1, args.paginationOpts.numItems),
    );

    /*
     * On ne fait PAS :
     *
     *   publications.collect()
     *
     * car cela pourrait charger une quantité incontrôlée
     * de données.
     *
     * On avance dans la table par véritables pages Convex.
     */
    let cursor = args.paginationOpts.cursor;

    let sourceDone = false;

    let sourcePagesRead = 0;

    const candidates: NearbyCandidate[] = [];

    const now = Date.now();

    /* ---------------------------------------------------------------------- */
    /* SOURCE SCAN                                                             */
    /* ---------------------------------------------------------------------- */

    while (
      !sourceDone &&
      sourcePagesRead < MAX_SOURCE_PAGES &&
      candidates.length < MAX_RESULTS * 3
    ) {
      const sourcePage = await ctx.db
        .query("publications")
        .order("desc")
        .paginate({
          numItems: SOURCE_BATCH_SIZE,
          cursor,
        });

      sourcePagesRead += 1;

      sourceDone = sourcePage.isDone;

      cursor = sourcePage.continueCursor;

      for (const publication of sourcePage.page) {
        /* ---------------------------------------------------------------- */
        /* TYPE FILTER                                                       */
        /* ---------------------------------------------------------------- */

        if (!NEARBY_TYPES.includes(publication.type as NearbyType)) {
          continue;
        }

        /* ---------------------------------------------------------------- */
        /* STATUS FILTER                                                     */
        /* ---------------------------------------------------------------- */

        if (publication.status !== "active") {
          continue;
        }

        /* ---------------------------------------------------------------- */
        /* MODERATION FILTER                                                 */
        /* ---------------------------------------------------------------- */

        if (publication.isHidden === true) {
          continue;
        }

        /* ---------------------------------------------------------------- */
        /* SELF FILTER                                                       */
        /* ---------------------------------------------------------------- */

        if (publication.authorId === currentUser._id) {
          continue;
        }

        /* ---------------------------------------------------------------- */
        /* LOCATION FILTER                                                  */
        /* ---------------------------------------------------------------- */

        if (
          publication.latitude === undefined ||
          publication.longitude === undefined
        ) {
          /*
           * Une publication sans coordonnées
           * ne peut pas honnêtement apparaître
           * dans "Autour de vous".
           */
          continue;
        }

        if (!isValidCoordinate(publication.latitude, publication.longitude)) {
          continue;
        }

        /* ---------------------------------------------------------------- */
        /* DISTANCE                                                          */
        /* ---------------------------------------------------------------- */

        const distanceKm = haversineDistanceKm(origin, {
          latitude: publication.latitude,
          longitude: publication.longitude,
        });

        if (distanceKm > radiusKm) {
          continue;
        }

        /* ---------------------------------------------------------------- */
        /* SCORE                                                             */
        /* ---------------------------------------------------------------- */

        const candidate = scoreCandidate(
          publication,
          distanceKm,
          radiusKm,
          feedCategories,
          favoriteModules,
          now,
        );

        candidates.push(candidate);
      }
    }

    /* ---------------------------------------------------------------------- */
    /* RANKING                                                                */
    /* ---------------------------------------------------------------------- */

    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      /*
       * À score égal :
       * plus proche d'abord.
       */
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }

      /*
       * Puis plus récent.
       */
      return b.publication._creationTime - a.publication._creationTime;
    });

    /* ---------------------------------------------------------------------- */
    /* DIVERSIFICATION                                                        */
    /* ---------------------------------------------------------------------- */

    const diversified = diversify(candidates);

    /* ---------------------------------------------------------------------- */
    /* FINAL PAGE                                                             */
    /* ---------------------------------------------------------------------- */

    const selected = diversified.slice(0, requestedItems);

    /* ---------------------------------------------------------------------- */
    /* MEDIA                                                                   */
    /* ---------------------------------------------------------------------- */

    const page: NearbyItem[] = await Promise.all(
      selected.map(async (candidate) => {
        const publication = candidate.publication;

        const images = await Promise.all(
          publication.images.map(async (image) => {
            /*
             * Certaines anciennes publications
             * peuvent déjà contenir une URL.
             */
            if (image.startsWith("https://") || image.startsWith("http://")) {
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

          type: publication.type as NearbyType,

          title: publication.title,

          description: publication.description,

          price: publication.price,

          location: publication.location,

          category: publication.category,

          images: images.filter((image): image is string => image !== null),

          tags: publication.tags,

          likeCount: publication.likeCount,

          viewCount: publication.viewCount,

          commentCount: publication.commentCount,

          status: publication.status,

          latitude: publication.latitude as number,

          longitude: publication.longitude as number,

          distanceKm: Math.round(candidate.distanceKm * 10) / 10,

          score: Math.round(candidate.score * 100) / 100,

          reason: candidate.reason,
        };
      }),
    );

    /* ---------------------------------------------------------------------- */
    /* RETURN                                                                 */
    /* ---------------------------------------------------------------------- */

    return {
      page,

      /*
       * Si Convex n'a plus de données source,
       * la pagination est terminée.
       *
       * Si nous avons simplement trouvé peu de résultats
       * dans le rayon, nous conservons le cursor réel
       * afin que la page suivante poursuive la recherche.
       */
      isDone: sourceDone,

      continueCursor: cursor,
    };
  },
});
