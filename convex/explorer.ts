// convex/explorer.ts

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * ============================================================
 *
 * Agrégateur principal de l'Explorer.
 *
 * Responsabilités :
 *
 * 🔍 Recherche universelle
 * ✨ Pour vous
 * 📍 À proximité
 * 💼 Opportunités
 * 🎟️ Événements
 * 📰 Publications
 * 👥 Personnes
 * 🛍️ Marketplace
 *
 * Les moteurs spécialisés sont maintenant organisés dans :
 *
 * convex/explorer/
 * ├── index.ts
 * ├── search.ts
 * ├── nearby.ts
 * ├── trending.ts
 * ├── recommendations.ts
 * ├── opportunities.ts
 * ├── universes.ts
 * ├── ranking.ts
 * └── ai.ts
 *
 * IMPORTANT :
 *
 * Ce fichier conserve l'endpoint historique :
 *
 *   api.explorer.getExplorerData
 *
 * afin de ne pas casser le frontend actuel.
 * ============================================================
 */

type AnyRecord = Record<string, any>;

export type ExplorerCard = {
  id: string;

  kind:
    | "job"
    | "immo"
    | "service"
    | "restaurant"
    | "event"
    | "publication"
    | "person"
    | "product";

  title: string;

  description: string;

  subtitle?: string;

  image?: string;

  city?: string;

  location?: string;

  distanceKm?: number;

  price?: number;

  priceLabel?: string;

  currency?: string;

  rating?: number;

  count?: number;

  badge?: string;

  route: string;

  moduleId: string;

  score: number;

  createdAt?: number;

  metadata?: AnyRecord;
};

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const DEFAULT_LIMIT = 8;

const SOURCE_LIMIT = 40;

const DEFAULT_RADIUS_KM = 25;

const MAX_RADIUS_KM = 100;

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/**
 * ============================================================
 * DISTANCE GPS
 * ============================================================
 */

function distanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const deltaLatitude = toRadians(latitude2 - latitude1);

  const deltaLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * ============================================================
 * RECHERCHE TEXTUELLE
 * ============================================================
 */

function matchesQuery(item: AnyRecord, queryText: string): boolean {
  if (!queryText) {
    return true;
  }

  const haystack = [
    item.title,
    item.name,
    item.description,
    item.company,
    item.category,
    item.specialty,
    item.location,
    item.city,
    item.neighborhood,
    item.cuisine,
    item.speciality,

    ...(Array.isArray(item.tags) ? item.tags : []),

    ...(Array.isArray(item.skills) ? item.skills : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(queryText);
}

/**
 * ============================================================
 * LECTURE ROBUSTE D'UNE TABLE
 * ============================================================
 *
 * L'Explorer ne doit pas planter si une table optionnelle
 * n'est pas encore disponible.
 */

async function safeCollect(
  db: any,
  table: string,
  limit = SOURCE_LIMIT,
): Promise<AnyRecord[]> {
  try {
    return await db.query(table).order("desc").take(limit);
  } catch {
    return [];
  }
}

/**
 * ============================================================
 * IMAGES STORAGE
 * ============================================================
 */

async function resolveStorageImage(
  ctx: any,
  value: unknown,
): Promise<string | undefined> {
  const raw = text(value);

  if (!raw) {
    return undefined;
  }

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  try {
    return (await ctx.storage.getUrl(raw)) ?? undefined;
  } catch {
    return undefined;
  }
}

async function firstImage(
  ctx: any,
  values: unknown[],
): Promise<string | undefined> {
  for (const value of values) {
    const resolved = await resolveStorageImage(ctx, value);

    if (resolved) {
      return resolved;
    }
  }

  return undefined;
}

/**
 * ============================================================
 * VILLE
 * ============================================================
 */

function cityMatch(item: AnyRecord, city?: string): boolean {
  if (!city) {
    return false;
  }

  const target = normalize(city);

  return [item.city, item.location, item.address, item.neighborhood]
    .filter(Boolean)
    .some((value) => {
      const normalized = normalize(value);

      return normalized.includes(target) || target.includes(normalized);
    });
}

/**
 * ============================================================
 * PROXIMITÉ
 * ============================================================
 */

function addDistance(
  card: ExplorerCard,
  item: AnyRecord,
  latitude?: number,
  longitude?: number,
  radiusKm = DEFAULT_RADIUS_KM,
  city?: string,
): ExplorerCard | null {
  const itemLatitude = numberOrUndefined(item.latitude);

  const itemLongitude = numberOrUndefined(item.longitude);

  /**
   * GPS prioritaire.
   */
  if (
    latitude !== undefined &&
    longitude !== undefined &&
    itemLatitude !== undefined &&
    itemLongitude !== undefined
  ) {
    const distance = distanceKm(
      latitude,
      longitude,
      itemLatitude,
      itemLongitude,
    );

    if (distance > radiusKm) {
      return null;
    }

    return {
      ...card,
      distanceKm: Number(distance.toFixed(1)),
    };
  }

  /**
   * Fallback ville.
   */
  if (city && cityMatch(item, city)) {
    return {
      ...card,
      distanceKm: undefined,
    };
  }

  return null;
}

/**
 * ============================================================
 * SCORE PERSONNALISÉ
 * ============================================================
 */

function scoreForUser(card: ExplorerCard, user: AnyRecord | null): number {
  let score = card.score;

  const city = normalize(user?.city);

  const interests = Array.isArray(user?.interests)
    ? user.interests.map((value: unknown) => normalize(value))
    : [];

  const searchable = normalize(
    [
      card.title,
      card.description,
      card.subtitle ?? "",
      card.moduleId,
      card.metadata?.category ?? "",
    ].join(" "),
  );

  if (city && normalize(card.city).includes(city)) {
    score += 12;
  }

  if (
    interests.some(
      (interest: string) => interest && searchable.includes(interest),
    )
  ) {
    score += 18;
  }

  if (card.distanceKm !== undefined) {
    score += Math.max(0, 16 - card.distanceKm);
  }

  if (card.rating !== undefined) {
    score += Math.min(8, card.rating);
  }

  return Math.min(100, score);
}

/**
 * ============================================================
 * EXPLORER DATA
 * ============================================================
 */

export const getExplorerData = query({
  args: {
    q: v.optional(v.string()),

    latitude: v.optional(v.number()),

    longitude: v.optional(v.number()),

    radiusKm: v.optional(v.number()),

    city: v.optional(v.string()),

    limit: v.optional(v.number()),
  },

  handler: async (
    ctx,
    args,
  ): Promise<{
    version: string;
    generatedAt: number;

    location: {
      latitude: number | null;
      longitude: number | null;
      city: string | null;
      radiusKm: number;
      hasCoordinates: boolean;
    };

    search: {
      query: string;
      results: ExplorerCard[];
      count: number;
    };

    forYou: ExplorerCard[];

    nearby: ExplorerCard[];

    opportunities: ExplorerCard[];

    events: ExplorerCard[];

    publications: ExplorerCard[];

    people: ExplorerCard[];

    marketplace: ExplorerCard[];

    counts: {
      jobs: number;
      immo: number;
      services: number;
      restaurants: number;
      events: number;
      products: number;
      publications: number;
      people: number;
      nearby: number;
    };
  }> => {
    const db = ctx.db as any;

    const identity = await ctx.auth.getUserIdentity();

    /**
     * --------------------------------------------------------
     * UTILISATEUR
     * --------------------------------------------------------
     */

    const currentUser = identity
      ? await db
          .query("users")
          .withIndex("by_token", (q: any) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier),
          )
          .unique()
          .catch(() => null)
      : null;

    const effectiveCity =
      text(args.city) || text(currentUser?.city) || undefined;

    const queryText = normalize(args.q);

    const radius = Math.max(
      1,
      Math.min(args.radiusKm ?? DEFAULT_RADIUS_KM, MAX_RADIUS_KM),
    );

    const take = Math.max(1, Math.min(args.limit ?? DEFAULT_LIMIT, 20));

    /**
     * --------------------------------------------------------
     * SOURCES
     * --------------------------------------------------------
     */

    const [
      jobs,
      properties,
      services,
      restaurants,
      events,
      products,
      publications,
      users,
    ] = await Promise.all([
      safeCollect(db, "jobListings"),

      safeCollect(db, "properties"),

      safeCollect(db, "serviceProviders"),

      safeCollect(db, "restaurants"),

      safeCollect(db, "events"),

      safeCollect(db, "products"),

      safeCollect(db, "publications"),

      safeCollect(db, "users"),
    ]);

    const now = Date.now();

    const activeJobs = jobs.filter((item) => item.status === "open");

    const availableProperties = properties.filter(
      (item) => item.status === "available",
    );

    const availableServices = services.filter(
      (item) => item.available !== false,
    );

    const activeProducts = products.filter((item) => item.status === "active");

    const activePublications = publications.filter(
      (item) => item.status === "active" || !item.status,
    );

    const upcomingEvents = events.filter((item) => {
      if (item.status && !["upcoming", "ongoing"].includes(item.status)) {
        return false;
      }

      const timestamp = Date.parse(text(item.startDate));

      return (
        !Number.isFinite(timestamp) || timestamp >= now - 24 * 60 * 60 * 1000
      );
    });

    /**
     * --------------------------------------------------------
     * JOBS
     * --------------------------------------------------------
     */

    const jobCards = await Promise.all(
      activeJobs
        .filter((item) => matchesQuery(item, queryText))
        .map(async (item) => {
          const employer = item.employerId
            ? await db.get(item.employerId).catch(() => null)
            : null;

          return {
            id: String(item._id),

            kind: "job" as const,

            title: text(item.title, "Opportunité professionnelle"),

            description: text(
              item.description,
              "Une nouvelle opportunité est disponible.",
            ),

            subtitle: text(item.company, text(employer?.name, "Entreprise")),

            image:
              text(item.companyLogo) || text(employer?.avatar) || undefined,

            city: text(item.city),

            location: text(item.city),

            priceLabel:
              item.salaryMin !== undefined || item.salaryMax !== undefined
                ? `${item.salaryMin ?? ""}${item.salaryMin !== undefined || item.salaryMax !== undefined ? " – " : ""}${item.salaryMax ?? ""} ${text(item.currency)}`.trim()
                : item.remote
                  ? "Télétravail"
                  : undefined,

            badge: item.remote ? "Remote" : text(item.contractType),

            route: "jobs",

            moduleId: "jobs",

            score: 86,

            createdAt: item._creationTime,

            metadata: {
              category: item.category,

              contractType: item.contractType,
            },
          };
        }),
    );

    /**
     * --------------------------------------------------------
     * IMMOBILIER
     * --------------------------------------------------------
     */

    const propertyCards = await Promise.all(
      availableProperties
        .filter((item) => matchesQuery(item, queryText))
        .map(async (item) => ({
          id: String(item._id),

          kind: "immo" as const,

          title: text(item.title, "Bien immobilier"),

          description: text(
            item.description,
            "Annonce immobilière disponible.",
          ),

          subtitle: `${text(item.type)} · ${text(item.transactionType)}`,

          image: await firstImage(
            ctx,
            Array.isArray(item.images) ? item.images : [],
          ),

          city: text(item.city),

          location: text(item.neighborhood) || text(item.city),

          price: numberOrUndefined(item.price),

          priceLabel:
            item.price !== undefined
              ? `${item.price.toLocaleString("fr-FR")} ${text(item.currency)}`
              : undefined,

          currency: text(item.currency),

          badge: item.featured ? "À la une" : text(item.transactionType),

          route: "immo",

          moduleId: "immo",

          score: item.featured ? 92 : 82,

          createdAt: item._creationTime,

          metadata: {
            type: item.type,

            transactionType: item.transactionType,

            surface: item.surface,

            rooms: item.rooms,

            bathrooms: item.bathrooms,

            latitude: item.latitude,

            longitude: item.longitude,
          },
        })),
    );

    /**
     * --------------------------------------------------------
     * SERVICES
     * --------------------------------------------------------
     */

    const serviceCards = await Promise.all(
      availableServices
        .filter((item) => matchesQuery(item, queryText))
        .map(async (item) => ({
          id: String(item._id),

          kind: "service" as const,

          title: text(item.name, "Service local"),

          description: text(
            item.description,
            text(item.specialty, "Service disponible près de vous."),
          ),

          subtitle: text(item.category),

          image: await resolveStorageImage(ctx, item.imageUrl),

          location: text(item.location),

          rating: numberOrUndefined(item.rating),

          count: numberOrUndefined(item.reviewCount),

          priceLabel: text(item.price),

          badge: item.verified ? "Vérifié" : item.urgent ? "Urgent" : undefined,

          route: "services",

          moduleId: "services",

          score: item.verified ? 87 : 78,

          createdAt: item._creationTime,

          metadata: {
            category: item.category,

            specialty: item.specialty,
          },
        })),
    );

    /**
     * --------------------------------------------------------
     * RESTAURANTS
     * --------------------------------------------------------
     */

    const restaurantCards = await Promise.all(
      restaurants
        .filter((item) => matchesQuery(item, queryText))
        .map(async (item) => ({
          id: String(item._id),

          kind: "restaurant" as const,

          title: text(item.name, "Restaurant"),

          description: text(
            item.description,
            text(item.speciality, "Restaurant près de vous."),
          ),

          subtitle: text(item.cuisine, text(item.speciality)),

          image: await firstImage(ctx, [
            item.image,

            ...(Array.isArray(item.gallery) ? item.gallery : []),
          ]),

          location: text(item.location),

          rating: numberOrUndefined(item.rating),

          count: numberOrUndefined(item.reviewsCount ?? item.reviewCount),

          badge: item.open ? "Ouvert" : undefined,

          route: "restauration",

          moduleId: "restauration",

          score: item.open ? 82 : 70,

          createdAt: item._creationTime,

          metadata: {
            cuisine: item.cuisine,

            priceRange: item.priceRange,
          },
        })),
    );

    /**
     * --------------------------------------------------------
     * ÉVÉNEMENTS
     * --------------------------------------------------------
     */

    const eventCards = await Promise.all(
      upcomingEvents
        .filter((item) => matchesQuery(item, queryText))
        .map(async (item) => ({
          id: String(item._id),

          kind: "event" as const,

          title: text(item.title, "Événement"),

          description: text(item.description, "Un événement à découvrir."),

          subtitle: text(item.category),

          image: await resolveStorageImage(ctx, item.coverImage),

          city: text(item.location),

          location: text(item.address) || text(item.location),

          priceLabel: item.isFree ? "Gratuit" : text(item.price),

          badge: item.status === "ongoing" ? "En cours" : "À venir",

          route: "evenements",

          moduleId: "evenements",

          score: item.status === "ongoing" ? 94 : 84,

          createdAt: item._creationTime,

          metadata: {
            category: item.category,

            startDate: item.startDate,

            endDate: item.endDate,

            latitude: item.latitude,

            longitude: item.longitude,
          },
        })),
    );

    /**
     * --------------------------------------------------------
     * MARKETPLACE
     * --------------------------------------------------------
     */

    const productCards = await Promise.all(
      activeProducts
        .filter((item) => matchesQuery(item, queryText))
        .map(async (item) => ({
          id: String(item._id),

          kind: "product" as const,

          title: text(item.title, "Produit"),

          description: text(item.description, "Produit disponible à l'achat."),

          subtitle: text(item.category),

          image: await firstImage(
            ctx,
            Array.isArray(item.images) ? item.images : [],
          ),

          location: text(item.location),

          price: numberOrUndefined(item.price),

          priceLabel:
            item.price !== undefined
              ? `${item.price.toLocaleString("fr-FR")} ${text(item.currency)}`
              : undefined,

          currency: text(item.currency),

          badge: item.deliveryAvailable ? "Livraison" : undefined,

          route: "marketplace",

          moduleId: "marketplace",

          score: 80,

          createdAt: item._creationTime,

          metadata: {
            category: item.category,

            stock: item.stock,

            sellerId: item.sellerId,
          },
        })),
    );

    /**
     * --------------------------------------------------------
     * PUBLICATIONS
     * --------------------------------------------------------
     */

    const publicationCards = await Promise.all(
      activePublications
        .filter((item) => matchesQuery(item, queryText))
        .sort(
          (a, b) =>
            Number(b.likeCount ?? 0) +
            Number(b.viewCount ?? 0) / 10 -
            (Number(a.likeCount ?? 0) + Number(a.viewCount ?? 0) / 10),
        )
        .slice(0, SOURCE_LIMIT)
        .map(async (item) => {
          const author = item.authorId
            ? await db.get(item.authorId).catch(() => null)
            : null;

          return {
            id: String(item._id),

            kind: "publication" as const,

            title: text(item.title, "Publication"),

            description: text(item.description, "Découvrez cette publication."),

            subtitle: text(author?.name, "Communauté"),

            image: await firstImage(
              ctx,
              Array.isArray(item.images) ? item.images : [],
            ),

            location: text(item.location),

            count: Number(item.likeCount ?? 0),

            badge: text(item.type),

            route: "decouverte",

            moduleId: "decouverte",

            score: Math.min(
              95,
              60 +
                Number(item.likeCount ?? 0) / 4 +
                Number(item.viewCount ?? 0) / 100,
            ),

            createdAt: item._creationTime,

            metadata: {
              type: item.type,

              authorId: item.authorId,

              authorName: author?.name,

              authorAvatar: author?.avatar,

              tags: item.tags,

              commentCount: item.commentCount,

              viewCount: item.viewCount,
            },
          };
        }),
    );

    /**
     * --------------------------------------------------------
     * PERSONNES
     * --------------------------------------------------------
     */

    const people: ExplorerCard[] = users
      .filter((user) => !currentUser || user._id !== currentUser._id)
      .filter((user) => !queryText || matchesQuery(user, queryText))
      .map((user) => ({
        id: String(user._id),

        kind: "person" as const,

        title: text(user.name, "Utilisateur"),

        description: text(user.profession, "Membre de DébrouillePro"),

        subtitle: text(user.city, text(user.country)),

        image: text(user.avatar) || undefined,

        city: text(user.city),

        badge: user.role === "professionnel" ? "Pro" : undefined,

        route: "profile",

        moduleId: "network",

        score: 64 + (numberOrUndefined(user.reputationScore) ?? 0) / 10,

        createdAt: user._creationTime,

        metadata: {
          profession: user.profession,

          interests: user.interests,
        },
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, SOURCE_LIMIT);

    /**
     * --------------------------------------------------------
     * AGRÉGATION
     * --------------------------------------------------------
     */

    const allCards: ExplorerCard[] = [
      ...jobCards,
      ...propertyCards,
      ...serviceCards,
      ...restaurantCards,
      ...eventCards,
      ...productCards,
      ...publicationCards,
    ];

    /**
     * --------------------------------------------------------
     * PERSONNALISATION
     * --------------------------------------------------------
     */

    const withUserScores = allCards.map((card) => ({
      ...card,

      score: scoreForUser(card, currentUser),
    }));

    /**
     * --------------------------------------------------------
     * PROXIMITÉ
     * --------------------------------------------------------
     */

    const nearby: ExplorerCard[] = [];

    const sourceById = new Map<string, AnyRecord>();

    for (const source of [
      ...availableProperties,
      ...availableServices,
      ...restaurants,
      ...upcomingEvents,
      ...activeProducts,
      ...activeJobs,
    ]) {
      if (source?._id) {
        sourceById.set(String(source._id), source);
      }
    }

    const nearbyCandidates = allCards
      .filter((card) =>
        ["immo", "service", "restaurant", "event", "product", "job"].includes(
          card.kind,
        ),
      )
      .map((card) => ({
        card,
        source: sourceById.get(card.id),
      }))
      .filter(
        (
          entry,
        ): entry is {
          card: ExplorerCard;
          source: AnyRecord;
        } => Boolean(entry.source),
      );

    for (const candidate of nearbyCandidates) {
      const enriched = addDistance(
        candidate.card,
        candidate.source,
        args.latitude,
        args.longitude,
        radius,
        effectiveCity,
      );

      if (enriched) {
        nearby.push(enriched);
      }
    }

    nearby.sort((a, b) => {
      const distanceA = a.distanceKm ?? 999;

      const distanceB = b.distanceKm ?? 999;

      return distanceA - distanceB || b.score - a.score;
    });

    /**
     * --------------------------------------------------------
     * OPPORTUNITÉS
     * --------------------------------------------------------
     */

    const opportunities = withUserScores
      .filter((card) =>
        ["job", "service", "product", "immo", "event"].includes(card.kind),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, take);

    /**
     * --------------------------------------------------------
     * POUR VOUS
     * --------------------------------------------------------
     */

    const forYou = withUserScores
      .filter((card) => card.kind !== "person")
      .sort((a, b) => b.score - a.score)
      .slice(0, take);

    /**
     * --------------------------------------------------------
     * RECHERCHE
     * --------------------------------------------------------
     */

    const searchResults = queryText
      ? withUserScores.sort((a, b) => b.score - a.score).slice(0, 20)
      : [];

    /**
     * --------------------------------------------------------
     * ÉVÉNEMENTS
     * --------------------------------------------------------
     */

    const upcoming = [...eventCards]
      .sort((a, b) =>
        String(a.metadata?.startDate).localeCompare(
          String(b.metadata?.startDate),
        ),
      )
      .slice(0, take);

    /**
     * --------------------------------------------------------
     * MARKETPLACE
     * --------------------------------------------------------
     */

    const marketplace = [...productCards]
      .sort((a, b) => b.score - a.score)
      .slice(0, take);

    /**
     * --------------------------------------------------------
     * PUBLICATIONS
     * --------------------------------------------------------
     */

    const publicationsTop = publicationCards.slice(0, take);

    /**
     * ========================================================
     * RÉSULTAT FINAL
     * ========================================================
     */

    return {
      version: "2.0",

      generatedAt: Date.now(),

      location: {
        latitude: args.latitude ?? null,

        longitude: args.longitude ?? null,

        city: effectiveCity ?? null,

        radiusKm: radius,

        hasCoordinates:
          args.latitude !== undefined && args.longitude !== undefined,
      },

      search: {
        query: args.q ?? "",

        results: searchResults,

        count: searchResults.length,
      },

      forYou,

      nearby: nearby.slice(0, 20),

      opportunities,

      events: upcoming,

      publications: publicationsTop,

      people: people.slice(0, take),

      marketplace,

      counts: {
        jobs: jobCards.length,

        immo: propertyCards.length,

        services: serviceCards.length,

        restaurants: restaurantCards.length,

        events: eventCards.length,

        products: productCards.length,

        publications: publicationCards.length,

        people: people.length,

        nearby: nearby.length,
      },
    };
  },
});
