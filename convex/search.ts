import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { normalizeUserSearchQuery } from "./lib/userSearch";

/**
 * ============================================================================
 * SEARCH — DébrouillePro
 * ============================================================================
 *
 * Principes :
 * - Recherche publique rapide et prévisible
 * - Aucun `any`
 * - Requêtes bornées
 * - Entrées normalisées
 * - Filtres compatibles avec les Search Index Convex
 * - Pas de pagination simulée
 * - Aucun fallback fictif
 *
 * ============================================================================
 */

const PUBLICATION_SEARCH_LIMIT = 20;
const USER_SEARCH_LIMIT = 20;
const SMART_SEARCH_LIMIT = 4;
const TRENDING_PUBLICATION_LIMIT = 200;
const TRENDING_TAG_LIMIT = 12;
const MAX_QUERY_LENGTH = 100;

const PUBLICATION_TYPES = [
  "immo",
  "job",
  "service",
  "evenement",
  "community",
  "agri",
  "sante",
  "transport",
  "annonce",
] as const;

type PublicationType = (typeof PUBLICATION_TYPES)[number];

type PublicationSearchResult = {
  _id: Id<"publications">;
  title: string;
  description: string;
  type: string;
  location: string | undefined;
  price: string | undefined;
  author: {
    name: string | undefined;
  } | null;
};

type UserSearchResult = {
  _id: Id<"users">;
  name: string;
  bio: string | undefined;
  city: string | undefined;
  avatar: string | undefined;
};

type TrendingTag = {
  tag: string;
  count: number;
};

type PublicationResult = {
  _id: Id<"publications">;
  title: string;
  type: string;
  price: string | undefined;
  location: string | undefined;
};

type JobResult = {
  _id: Id<"jobListings">;
  title: string;
  company: string;
  city: string;
  contractType: string;
};

type PropertyResult = {
  _id: Id<"properties">;
  title: string;
  type: string;
  price: number;
  city: string;
};

type CourseResult = {
  _id: Id<"courses">;
  title: string;
  category: string;
  isFree: boolean;
  price: number;
};

type SmartSearchResult = {
  publications: PublicationResult[];
  jobs: JobResult[];
  properties: PropertyResult[];
  courses: CourseResult[];
};

/**
 * ============================================================================
 * HELPERS
 * ============================================================================
 */

/**
 * Normalise une requête utilisateur.
 *
 * Objectifs :
 * - supprimer les espaces inutiles ;
 * - éviter les recherches vides ;
 * - limiter les entrées excessivement longues.
 */
function normalizeSearchQuery(value: string): string {
  return value.trim().slice(0, MAX_QUERY_LENGTH);
}

/**
 * Résultat vide de smartSearch.
 */
function emptySmartSearchResult(): SmartSearchResult {
  return {
    publications: [],
    jobs: [],
    properties: [],
    courses: [],
  };
}

/**
 * ============================================================================
 * PUBLICATIONS
 * ============================================================================
 */

export const searchPublications = query({
  args: {
    q: v.string(),

    type: v.optional(
      v.union(
        v.literal("immo"),
        v.literal("job"),
        v.literal("service"),
        v.literal("evenement"),
        v.literal("community"),
        v.literal("agri"),
        v.literal("sante"),
        v.literal("transport"),
        v.literal("annonce"),
      ),
    ),
  },

  handler: async (ctx, args): Promise<PublicationSearchResult[]> => {
    const q = normalizeSearchQuery(args.q);

    if (!q) {
      return [];
    }

    /**
     * Le filtre `type` est appliqué directement au Search Index.
     *
     * Avant :
     *   search → take(20) → filter(type)
     *
     * Maintenant :
     *   search → filtre indexé → take(20)
     *
     * Cela permet d'obtenir jusqu'à 20 résultats du type demandé
     * lorsque suffisamment de publications correspondantes existent.
     */
    const results = await ctx.db
      .query("publications")
      .withSearchIndex("search_publications", (search) => {
        const base = search.search("title", q).eq("status", "active");

        return args.type ? base.eq("type", args.type) : base;
      })
      .take(PUBLICATION_SEARCH_LIMIT);

    /**
     * Évite le N+1 inutile lorsque plusieurs publications appartiennent
     * au même auteur.
     */
    const authorIds = [
      ...new Set(results.map((publication) => publication.authorId)),
    ];

    const authors = await Promise.all(
      authorIds.map((authorId) => ctx.db.get(authorId)),
    );

    const authorsById = new Map<
      string,
      {
        name: string | undefined;
      }
    >();

    for (const author of authors) {
      if (author) {
        authorsById.set(String(author._id), {
          name: author.name,
        });
      }
    }

    return results.map((publication) => ({
      _id: publication._id,
      title: publication.title,
      description: publication.description,
      type: publication.type,
      location: publication.location,
      price: publication.price,
      author: authorsById.get(String(publication.authorId)) ?? null,
    }));
  },
});

/**
 * ============================================================================
 * USERS
 * ============================================================================
 *
 * Recherche des profils utilisateurs via le Search Index `search_users`.
 *
 * Architecture :
 *
 *   query
 *      ↓
 *   normalizeUserSearchQuery
 *      ↓
 *   Convex Search Index
 *      ↓
 *   filtres indexés éventuels
 *      ↓
 *   take(20)
 *
 * Aucun scan global de la table `users`.
 */
export const searchUsers = query({
  args: {
    q: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },

  handler: async (ctx, args): Promise<UserSearchResult[]> => {
    const q = normalizeUserSearchQuery(args.q);

    if (!q) {
      return [];
    }

    const users = await ctx.db
      .query("users")
      .withSearchIndex("search_users", (search) => {
        let builder = search.search("searchText", q);

        if (args.city) {
          builder = builder.eq("city", args.city);
        }

        if (args.country) {
          builder = builder.eq("country", args.country);
        }

        return builder;
      })
      .take(USER_SEARCH_LIMIT);

    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      bio: user.bio,
      city: user.city,
      avatar: user.avatar,
    }));
  },
});

/**
 * ============================================================================
 * TRENDING TAGS
 * ============================================================================
 */

export const getTrendingTags = query({
  args: {},

  handler: async (ctx): Promise<TrendingTag[]> => {
    /**
     * On ne compte que les publications actives.
     *
     * Le `by_status` index permet de sélectionner directement les contenus
     * publics/actifs avant de prendre les publications récentes.
     */
    const recent = await ctx.db
      .query("publications")
      .withIndex("by_status", (indexQuery) => indexQuery.eq("status", "active"))
      .order("desc")
      .take(TRENDING_PUBLICATION_LIMIT);

    const tagCounts = new Map<string, number>();

    for (const publication of recent) {
      for (const rawTag of publication.tags) {
        const tag = rawTag.trim();

        if (!tag) {
          continue;
        }

        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    return [...tagCounts.entries()]
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, TRENDING_TAG_LIMIT)
      .map(([tag, count]) => ({
        tag,
        count,
      }));
  },
});

/**
 * ============================================================================
 * SMART SEARCH
 * ============================================================================
 *
 * Cette fonction est volontairement une recherche "preview".
 *
 * Elle retourne au maximum :
 * - 4 publications
 * - 4 jobs
 * - 4 propriétés
 * - 4 cours
 *
 * Les écrans spécialisés restent responsables de leurs recherches complètes
 * et de leur pagination.
 */
export const smartSearch = query({
  args: {
    query: v.string(),
  },

  handler: async (ctx, args): Promise<SmartSearchResult> => {
    const q = normalizeSearchQuery(args.query);

    if (!q) {
      return emptySmartSearchResult();
    }

    /**
     * Les quatre recherches sont indépendantes.
     * Promise.all évite de les exécuter séquentiellement.
     */
    const [publications, jobs, properties, courses] = await Promise.all([
      ctx.db
        .query("publications")
        .withSearchIndex("search_publications", (search) =>
          search.search("title", q).eq("status", "active"),
        )
        .take(SMART_SEARCH_LIMIT),

      ctx.db
        .query("jobListings")
        .withSearchIndex("search_jobs", (search) =>
          search.search("title", q).eq("status", "open"),
        )
        .take(SMART_SEARCH_LIMIT),

      ctx.db
        .query("properties")
        .withSearchIndex("search_properties", (search) =>
          search.search("title", q).eq("status", "available"),
        )
        .take(SMART_SEARCH_LIMIT),

      ctx.db
        .query("courses")
        .withSearchIndex("search_courses", (search) =>
          search.search("title", q).eq("status", "published"),
        )
        .take(SMART_SEARCH_LIMIT),
    ]);

    return {
      publications: publications.map((publication) => ({
        _id: publication._id,
        title: publication.title,
        type: publication.type,
        price: publication.price,
        location: publication.location,
      })),

      jobs: jobs.map((job) => ({
        _id: job._id,
        title: job.title,
        company: job.company,
        city: job.city,
        contractType: job.contractType,
      })),

      properties: properties.map((property) => ({
        _id: property._id,
        title: property.title,
        type: property.type,
        price: property.price,
        city: property.city,
      })),

      courses: courses.map((course) => ({
        _id: course._id,
        title: course.title,
        category: course.category,
        isFree: course.isFree,
        price: course.price,
      })),
    };
  },
});
