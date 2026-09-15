// convex/feed.ts

import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel";

// ─── Constantes de performance ───────────────────────────────────────────────

const RECENT_MIX_LIMIT = 3;
const MAX_IMAGES_PER_ITEM = 3;
const MAX_VIDEOS_PER_ITEM = 1;
const MAX_AUDIO_PER_ITEM = 1;

// ─── Interfaces Strictes ─────────────────────────────────────────────────────

export interface TransportRoute {
  _id: Id<"transportRoutes">;
  _creationTime: number;
  driverId: Id<"users">;
  companyId?: Id<"transportCompanies">;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime?: string;
  vehicleType:
    | "taxi"
    | "bus"
    | "moto"
    | "minibus"
    | "voiture"
    | "camion"
    | "rideshare";
  seats: number;
  seatsAvailable: number;
  pricePerSeat: number;
  currency: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "active";
  description?: string;
  images?: string[];
  vehicleModel?: string;
  vehiclePlate?: string;
  driverName?: string;
  amenities?: string[];
  luggageAllowed?: boolean;
  petsAllowed?: boolean;
  insuranceIncluded?: boolean;
}

export interface AccommodationFeedItem {
  _id: Id<"accommodations">;
  _creationTime: number;
  hostId: Id<"users">;
  title: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  images: string[];
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  maxGuests: number;
  rating?: number;
  reviewCount: number;
  available: boolean;
  createdAt: number;
  status?: "active" | "inactive";
}

export interface TripFeedItem {
  _id: Id<"trips">;
  _creationTime: number;
  operator: string;
  type: "Bus" | "Minibus" | "Avion";
  from: string;
  to: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  price: number;
  currency: string;
  availableSeats: number;
  totalSeats: number;
  amenities: string[];
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  color?: string;
  departureDate: string;
}

// ─── Helpers média ───────────────────────────────────────────────────────────

/**
 * Résout un ID média en URL utilisable côté mobile.
 *
 * Règles STRICTES :
 *  - http(s)          → conservé
 *  - data:image/...   → REFUSÉ (base64 interdit dans le feed)
 *  - blob:            → REFUSÉ (URL locale temporaire)
 *  - storageId Convex → résolu via ctx.storage.getUrl()
 *  - sinon            → refusé
 */
async function resolveMediaId(
  ctx: any,
  id: string | undefined | null,
): Promise<string | null> {
  if (!id || typeof id !== "string") return null;

  if (id.startsWith("http://") || id.startsWith("https://")) {
    return id;
  }

  // ❌ On NE laisse PAS passer le base64 dans le feed.
  if (id.startsWith("data:image")) {
    return null;
  }

  // ❌ Blob URL locale : jamais persistable.
  if (id.startsWith("blob:")) {
    return null;
  }

  try {
    const url = await ctx.storage.getUrl(id as `kg${string}`);
    return url ?? null;
  } catch {
    return null;
  }
}

async function resolveMediaIds(
  ctx: any,
  ids: unknown,
  max: number,
): Promise<string[]> {
  if (!Array.isArray(ids)) return [];

  const sliced = ids.slice(0, max);

  const resolved = await Promise.all(
    sliced.map((id) => resolveMediaId(ctx, id as string)),
  );

  return resolved.filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
}

async function resolveMetaMedia(
  ctx: any,
  metaString: string | undefined,
): Promise<{
  meta: string;
  images: string[];
  videos: string[];
  audio: string[];
}> {
  let meta: any = {};

  if (metaString) {
    try {
      meta = JSON.parse(metaString);
    } catch {
      meta = {};
    }
  }

  if (!meta || typeof meta !== "object") {
    meta = {};
  }

  // Images / vidéos / audio
  const images = await resolveMediaIds(ctx, meta.images, MAX_IMAGES_PER_ITEM);
  meta.images = images;

  const videos = await resolveMediaIds(ctx, meta.videos, MAX_VIDEOS_PER_ITEM);
  meta.videos = videos;

  const audio = await resolveMediaIds(ctx, meta.audio, MAX_AUDIO_PER_ITEM);
  meta.audio = audio;

  // Champs fréquemment utilisés au rendu : cover, gallery, thumbnail
  const gallery = await resolveMediaIds(ctx, meta.gallery, MAX_IMAGES_PER_ITEM);
  meta.gallery = gallery;

  if (typeof meta.coverImage === "string") {
    const resolvedCover = await resolveMediaId(ctx, meta.coverImage);
    if (resolvedCover) meta.coverImage = resolvedCover;
    else delete meta.coverImage;
  }

  if (typeof meta.thumbnail === "string") {
    const resolvedThumb = await resolveMediaId(ctx, meta.thumbnail);
    if (resolvedThumb) meta.thumbnail = resolvedThumb;
    else delete meta.thumbnail;
  }

  return {
    meta: JSON.stringify(meta),
    images,
    videos,
    audio,
  };
}

async function resolveDirectImages(
  ctx: any,
  imageIds: string[] | undefined,
): Promise<string[]> {
  return await resolveMediaIds(ctx, imageIds, MAX_IMAGES_PER_ITEM);
}

async function resolveAccommodationImages(
  ctx: any,
  images?: string[],
): Promise<string[]> {
  return await resolveMediaIds(ctx, images, MAX_IMAGES_PER_ITEM);
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

async function mapRouteToFeedItem(ctx: any, route: TransportRoute) {
  const author = (await ctx.db.get(route.driverId)) as Doc<"users"> | null;

  const transportMeta = {
    origin: route.origin,
    destination: route.destination,
    departureTime: route.departureTime,
    arrivalTime: route.arrivalTime || undefined,
    pricePerSeat: route.pricePerSeat || 0,
    currency: route.currency || "FCFA",
    seatsAvailable: route.seatsAvailable || 0,
    vehicleType: route.vehicleType || "voiture",
    amenities: route.amenities || [],
    luggageAllowed: route.luggageAllowed ?? false,
    petsAllowed: route.petsAllowed ?? false,
    insuranceIncluded: route.insuranceIncluded ?? false,
    driverName: route.driverName || author?.name || "Chauffeur",
    status: route.status || "active",
  };

  const resolvedImages = await resolveMediaIds(
    ctx,
    route.images,
    MAX_IMAGES_PER_ITEM,
  );

  return {
    _id: route._id,
    _creationTime: route._creationTime,
    authorId: route.driverId,
    type: "transport" as const,
    content: `${route.origin} → ${route.destination} (${route.departureTime})`,
    meta: JSON.stringify(transportMeta),
    images: resolvedImages,
    author: author ? { name: author.name, avatar: author.avatar } : null,
    likedByMe: false,
    // ❌ plus de `routeData: route`
  };
}

async function mapAccommodationToFeedItem(
  ctx: any,
  accommodation: AccommodationFeedItem,
  currentUserId?: Id<"users"> | null,
) {
  const host = (await ctx.db.get(accommodation.hostId)) as Doc<"users"> | null;

  const resolvedImages = await resolveAccommodationImages(
    ctx,
    accommodation.images,
  );

  let likedByMe = false;

  if (currentUserId) {
    try {
      const favorite = await ctx.db
        .query("accommodationFavorites")
        .withIndex("by_user_and_accommodation", (q: any) =>
          q
            .eq("userId", currentUserId)
            .eq("accommodationId", accommodation._id),
        )
        .unique();

      likedByMe = favorite !== null;
    } catch {
      likedByMe = false;
    }
  }

  const accommodationMeta = {
    accommodationId: accommodation._id,
    type: accommodation.type,
    price: accommodation.price,
    currency: accommodation.currency,
    city: accommodation.city,
    address: accommodation.address,
    latitude: accommodation.latitude,
    longitude: accommodation.longitude,
    amenities: accommodation.amenities || [],
    maxGuests: accommodation.maxGuests,
    rating: accommodation.rating ?? 0,
    reviewCount: accommodation.reviewCount ?? 0,
    available: accommodation.available,
    status: accommodation.status ?? "active",
    hostId: accommodation.hostId,
    bookingEnabled: true,
    module: "hebergement",
  };

  return {
    _id: accommodation._id,
    _creationTime: accommodation._creationTime,
    authorId: accommodation.hostId,
    type: "hebergement" as const,
    title: accommodation.title,
    content: accommodation.description,
    description: accommodation.description,
    price: `${accommodation.price} ${accommodation.currency}`,
    location: accommodation.city,
    category: accommodation.type,
    images: resolvedImages,
    tags: ["#Hébergement", `#${accommodation.type}`, `#${accommodation.city}`],
    meta: JSON.stringify(accommodationMeta),
    author: host ? { name: host.name, avatar: host.avatar } : null,
    likedByMe,
    // ❌ plus de `accommodationData: accommodation`
  };
}

async function mapTripToFeedItem(ctx: any, trip: TripFeedItem) {
  const imageUrl = trip.imageUrl
    ? await resolveMediaId(ctx, trip.imageUrl)
    : null;

  const voyageMeta = {
    operator: trip.operator,
    transportType: trip.type,
    from: trip.from,
    to: trip.to,
    departure: trip.departure,
    arrival: trip.arrival,
    duration: trip.durationMinutes,
    price: trip.price,
    currency: trip.currency,
    availableSeats: trip.availableSeats,
    totalSeats: trip.totalSeats,
    amenities: trip.amenities,
    rating: trip.rating,
    reviewCount: trip.reviewCount,
    color: trip.color,
    departureDate: trip.departureDate,
  };

  return {
    _id: trip._id,
    _creationTime: trip._creationTime,
    authorId: null,
    type: "voyages" as const,
    title: `${trip.from} → ${trip.to}`,
    content: `${trip.operator} • ${trip.type} • ${trip.departure} → ${trip.arrival}`,
    description:
      `${trip.operator} propose un voyage en ${trip.type} ` +
      `de ${trip.from} à ${trip.to} le ${trip.departureDate}. ` +
      `Départ à ${trip.departure}, arrivée à ${trip.arrival}.`,
    price: `${trip.price} ${trip.currency}`,
    location: `${trip.from} → ${trip.to}`,
    category: trip.type,
    images: imageUrl ? [imageUrl] : [],
    tags: [`#${trip.type}`, `#${trip.from}`, `#${trip.to}`],
    meta: JSON.stringify(voyageMeta),
    author: {
      name: trip.operator || "Opérateur",
      avatar: null,
    },
    likedByMe: false,
    // ❌ plus de `tripData: trip`
  };
}

// ─── Types internes ──────────────────────────────────────────────────────────

export type PersonalizedFeedType =
  | "immo"
  | "job"
  | "service"
  | "evenement"
  | "community"
  | "agri"
  | "sante"
  | "transport"
  | "annonce"
  | "restauration"
  | "hebergement"
  | "energie"
  | "ong"
  | "video"
  | "article"
  | "sondage"
  | "marketplace"
  | "network"
  | "voyages";

export interface PersonalizedFeedArgs {
  paginationOpts: {
    numItems: number;
    cursor: string | null;
  };
  type?: PersonalizedFeedType;
}

// ─── Moteur partagé du Fil d'actualité ───────────────────────────────────────

export async function buildPersonalizedFeed(
  ctx: any,
  args: PersonalizedFeedArgs,
) {
  let currentUser: Doc<"users"> | null = null;
  let preferredTypes: string[] = [];
  let favoriteModules: string[] = [];

  try {
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();

      if (user) {
        currentUser = user;

        const prefs = await ctx.db
          .query("userPreferences")
          .withIndex("by_user", (q: any) => q.eq("userId", user._id))
          .unique();

        preferredTypes = prefs?.feedCategories ?? [];
        favoriteModules = prefs?.favoriteModules ?? [];
      }
    }
  } catch {
    // non authentifié
  }

  const isTransportFilter = args.type === "transport";
  const isAccommodationFilter = args.type === "hebergement";
  const isVoyageFilter = args.type === "voyages";

  let results: any;
  let recentRoutes: TransportRoute[] = [];
  let recentAccommodations: AccommodationFeedItem[] = [];
  let recentTrips: TripFeedItem[] = [];

  if (isTransportFilter) {
    results = await ctx.db
      .query("transportRoutes")
      .order("desc")
      .paginate(args.paginationOpts);
  } else if (isAccommodationFilter) {
    results = await ctx.db
      .query("accommodations")
      .order("desc")
      .paginate(args.paginationOpts);
  } else if (isVoyageFilter) {
    results = await ctx.db
      .query("trips")
      .order("desc")
      .paginate(args.paginationOpts);
  } else {
    if (args.type) {
      results = await ctx.db
        .query("publications")
        .withIndex("by_type", (q: any) => q.eq("type", args.type!))
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db
        .query("publications")
        .order("desc")
        .paginate(args.paginationOpts);

      const isFirstPage = !args.paginationOpts.cursor;

      if (isFirstPage) {
        recentRoutes = await ctx.db
          .query("transportRoutes")
          .order("desc")
          .take(RECENT_MIX_LIMIT);

        recentAccommodations = (await ctx.db
          .query("accommodations")
          .order("desc")
          .take(RECENT_MIX_LIMIT)) as unknown as AccommodationFeedItem[];

        recentTrips = (await ctx.db
          .query("trips")
          .order("desc")
          .take(RECENT_MIX_LIMIT)) as unknown as TripFeedItem[];
      }
    }
  }

  const currentUserId = currentUser?._id ?? null;
  let enrichedPage: any[] = [];

  if (isTransportFilter) {
    enrichedPage = await Promise.all(
      results.page.map((item: any) =>
        mapRouteToFeedItem(ctx, item as TransportRoute),
      ),
    );
  } else if (isAccommodationFilter) {
    enrichedPage = await Promise.all(
      results.page.map((item: any) =>
        mapAccommodationToFeedItem(
          ctx,
          item as AccommodationFeedItem,
          currentUserId,
        ),
      ),
    );
  } else if (isVoyageFilter) {
    enrichedPage = await Promise.all(
      results.page.map((item: any) =>
        mapTripToFeedItem(ctx, item as TripFeedItem),
      ),
    );
  } else {
    // ─── Publications normales ────────────────────────────────────────────
    enrichedPage = await Promise.all(
      results.page.map(async (item: any) => {
        const author = (await ctx.db.get(item.authorId)) as Doc<"users"> | null;

        let likedByMe = false;

        if (currentUser) {
          const like = await ctx.db
            .query("publicationLikes")
            .withIndex("by_user_and_publication", (q: any) =>
              q.eq("userId", currentUser!._id).eq("publicationId", item._id),
            )
            .unique();

          likedByMe = like !== null;
        }

        const { meta, images: metaImages } = await resolveMetaMedia(
          ctx,
          item.meta,
        );

        const directImages = await resolveDirectImages(ctx, item.images);

        const imageSet = new Set<string>([...metaImages, ...directImages]);
        const finalImages = Array.from(imageSet);

        // ✅ DTO LÉGER — plus de `...item`
        return {
          _id: item._id,
          _creationTime: item._creationTime,
          authorId: item.authorId,
          type: item.type,
          title: item.title,
          description: item.description,
          price: item.price,
          location: item.location,
          category: item.category,
          images: finalImages,
          tags: item.tags,
          likeCount: item.likeCount,
          viewCount: item.viewCount,
          commentCount: item.commentCount,
          status: item.status,
          latitude: item.latitude,
          longitude: item.longitude,
          shareCount: item.shareCount,
          offerCount: item.offerCount,
          isPromoted: item.isPromoted,
          isPremium: item.isPremium,
          isReserved: item.isReserved,
          isSold: item.isSold,
          negotiable: item.negotiable,
          minPrice: item.minPrice,
          avgRating: item.avgRating,
          reviewCount: item.reviewCount,
          meta,
          author: author ? { name: author.name, avatar: author.avatar } : null,
          likedByMe,
        };
      }),
    );
  }

  // ─── Fusion + raccord récents ────────────────────────────────────────────
  let mergedPage = enrichedPage;

  if (!args.type) {
    const additionalItems: any[] = [];

    if (recentRoutes.length > 0) {
      const mappedRoutes = await Promise.all(
        recentRoutes.map((route) => mapRouteToFeedItem(ctx, route)),
      );
      additionalItems.push(...mappedRoutes);
    }

    if (recentAccommodations.length > 0) {
      const mappedAccommodations = await Promise.all(
        recentAccommodations.map((acc) =>
          mapAccommodationToFeedItem(ctx, acc, currentUserId),
        ),
      );
      additionalItems.push(...mappedAccommodations);
    }

    if (recentTrips.length > 0) {
      const mappedTrips = await Promise.all(
        recentTrips.map((trip) => mapTripToFeedItem(ctx, trip)),
      );
      additionalItems.push(...mappedTrips);
    }

    mergedPage = [...enrichedPage, ...additionalItems];
  }

  // ─── Déduplication ───────────────────────────────────────────────────────
  const uniquePageMap = new Map<string, any>();

  mergedPage.forEach((item) => {
    const key = `${item.type}_${item._id}`;
    if (!uniquePageMap.has(key)) {
      uniquePageMap.set(key, item);
    }
  });

  const uniquePage = Array.from(uniquePageMap.values());

  // ─── Tri chronologique ───────────────────────────────────────────────────
  const sortedPage = uniquePage.sort(
    (a, b) => b._creationTime - a._creationTime,
  );

  // ─── Tri préférentiel ────────────────────────────────────────────────────
  const finalPage =
    preferredTypes.length > 0
      ? [
          ...sortedPage.filter((p) => preferredTypes.includes(p.type)),
          ...sortedPage.filter((p) => !preferredTypes.includes(p.type)),
        ]
      : sortedPage;

  // ─── Limitation finale stricte ───────────────────────────────────────────
  const limitedPage = finalPage.slice(
    0,
    Math.max(0, args.paginationOpts.numItems),
  );

  return {
    ...results,
    page: limitedPage,
    preferredTypes,
    favoriteModules,
  };
}

// ─── Query du Fil d'actualité personnalisé ───────────────────────────────────

export const listPersonalizedFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,

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
        v.literal("restauration"),
        v.literal("hebergement"),
        v.literal("energie"),
        v.literal("ong"),
        v.literal("video"),
        v.literal("article"),
        v.literal("sondage"),
        v.literal("marketplace"),
        v.literal("network"),
        v.literal("voyages"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    return await buildPersonalizedFeed(ctx, args);
  },
});

// ─── Query pour le fil "suivi" ────────────────────────────────────────────────

export const listFollowingFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q: any) => q.eq("followerId", currentUser._id))
      .take(200);

    const followedIds = new Set(follows.map((f) => f.followingId));

    if (followedIds.size === 0) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const results = await ctx.db
      .query("publications")
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page
        .filter((pub) => followedIds.has(pub.authorId))
        .map(async (pub) => {
          const author = (await ctx.db.get(
            pub.authorId,
          )) as Doc<"users"> | null;

          const like = await ctx.db
            .query("publicationLikes")
            .withIndex("by_user_and_publication", (q: any) =>
              q.eq("userId", currentUser._id).eq("publicationId", pub._id),
            )
            .unique();

          const { meta, images } = await resolveMetaMedia(ctx, pub.meta);

          const directImages = await resolveDirectImages(ctx, pub.images);

          const imageSet = new Set<string>([...images, ...directImages]);
          const finalImages = Array.from(imageSet);

          // ✅ DTO LÉGER ici aussi
          return {
            _id: pub._id,
            _creationTime: pub._creationTime,
            authorId: pub.authorId,
            type: pub.type,
            title: pub.title,
            description: pub.description,
            price: pub.price,
            location: pub.location,
            category: pub.category,
            images: finalImages,
            tags: pub.tags,
            likeCount: pub.likeCount,
            viewCount: pub.viewCount,
            commentCount: pub.commentCount,
            status: pub.status,
            latitude: pub.latitude,
            longitude: pub.longitude,
            shareCount: pub.shareCount,
            meta,
            author: author
              ? { name: author.name, avatar: author.avatar }
              : null,
            likedByMe: like !== null,
          };
        }),
    );

    return { ...results, page };
  },
});
