// convex/realestate.ts

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// ── Helper: get current user ──────────────────────────────────────────────────
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  return user;
}

// ── Helper: resolve storage IDs to public URLs ──────────────────────────────
async function resolveImages(ctx: QueryCtx, ids: string[]): Promise<string[]> {
  return await Promise.all(
    ids.map(async (id) => {
      if (id.startsWith("http")) return id;
      try {
        const url = await ctx.storage.getUrl(id as `kg${string}`);
        return url ?? id;
      } catch {
        return id;
      }
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTIES (Immobilier)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère les propriétés de manière paginée.
 * Effectue un filtrage optionnel par propriétaire, ville ou statut,
 * et enrichit chaque élément avec les données du propriétaire.
 * ✅ Résout les URLs des images.
 */
export const listProperties = query({
  args: {
    type: v.optional(v.string()),
    city: v.optional(v.string()),
    status: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let q;

    if (args.ownerId) {
      q = ctx.db
        .query("properties")
        .withIndex("by_owner", (qi) => qi.eq("ownerId", args.ownerId!));
    } else if (args.city) {
      q = ctx.db
        .query("properties")
        .withIndex("by_city", (qi) => qi.eq("city", args.city!));
    } else if (args.status) {
      q = ctx.db
        .query("properties")
        .withIndex("by_status", (qi) =>
          qi.eq(
            "status",
            args.status as "available" | "rented" | "sold" | "archived",
          ),
        );
    } else {
      q = ctx.db.query("properties");
    }

    const page = await q.order("desc").paginate(args.paginationOpts);

    const enrichedPage = await Promise.all(
      page.page.map(async (item) => {
        const owner = await ctx.db.get(item.ownerId);
        // ✅ Résoudre les images
        const resolvedImages = await resolveImages(ctx, item.images || []);

        return {
          ...item,
          images: resolvedImages,
          ownerName: owner?.name ?? "Propriétaire",
          ownerAvatar: owner?.avatar,
          ownerPhone: owner?.phone,
        };
      }),
    );

    return {
      ...page,
      page: enrichedPage,
    };
  },
});

/**
 * Récupère un bien immobilier par son identifiant unique et l'enrichit.
 * ✅ Résout les URLs des images.
 */
export const getProperty = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.id);
    if (!property) return null;
    const owner = await ctx.db.get(property.ownerId);
    // ✅ Résoudre les images
    const resolvedImages = await resolveImages(ctx, property.images || []);

    return {
      ...property,
      images: resolvedImages,
      ownerName: owner?.name,
      ownerAvatar: owner?.avatar,
      ownerPhone: owner?.phone,
    };
  },
});

/**
 * Récupère un bien immobilier avec ses médias associés.
 * ✅ Résout les URLs des images et des médias.
 */
export const getPropertyWithMedia = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.id);
    if (!property) return null;
    const owner = await ctx.db.get(property.ownerId);
    // ✅ Résoudre les images de la propriété
    const resolvedImages = await resolveImages(ctx, property.images || []);

    const media = await ctx.db
      .query("propertyMedia")
      .withIndex("by_property", (q) => q.eq("propertyId", args.id))
      .order("asc")
      .collect();

    // ✅ Résoudre les URLs des médias (si nécessaire)
    const resolvedMedia = await Promise.all(
      media.map(async (m) => ({
        ...m,
        url: await resolveImages(ctx, [m.url]).then((urls) => urls[0] || m.url),
        thumbnail: m.thumbnail
          ? await resolveImages(ctx, [m.thumbnail]).then(
              (urls) => urls[0] || m.thumbnail,
            )
          : undefined,
      })),
    );

    return {
      ...property,
      images: resolvedImages,
      ownerName: owner?.name,
      ownerAvatar: owner?.avatar,
      ownerPhone: owner?.phone,
      media: resolvedMedia,
    };
  },
});

/**
 * Recherche textuelle de propriétés par titre, avec enrichissement de l'hôte.
 * ✅ Résout les URLs des images.
 */
export const searchProperties = query({
  args: { q: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("properties")
      .withSearchIndex("search_properties", (qi) => qi.search("title", args.q))
      .take(20);

    return Promise.all(
      results.map(async (item) => {
        const owner = await ctx.db.get(item.ownerId);
        const resolvedImages = await resolveImages(ctx, item.images || []);
        return {
          ...item,
          images: resolvedImages,
          ownerName: owner?.name ?? "Propriétaire",
          ownerAvatar: owner?.avatar,
          ownerPhone: owner?.phone,
        };
      }),
    );
  },
});

/**
 * Crée une annonce de propriété immobilière et une publication associée dans le feed.
 */
export const createProperty = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("appartement"),
      v.literal("maison"),
      v.literal("villa"),
      v.literal("studio"),
      v.literal("bureau"),
      v.literal("terrain"),
      v.literal("chambre"),
      v.literal("entrepot"),
    ),
    transactionType: v.union(v.literal("location"), v.literal("vente")),
    price: v.number(),
    currency: v.string(),
    surface: v.optional(v.number()),
    rooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    images: v.array(v.string()),
    videos: v.optional(v.array(v.string())),
    city: v.string(),
    neighborhood: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    amenities: v.array(v.string()),
    phone: v.optional(v.string()),
    virtualTourUrl: v.optional(v.string()),
    floorPlanUrl: v.optional(v.string()),
    tour360Images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const propertyId = await ctx.db.insert("properties", {
      title: args.title,
      description: args.description,
      type: args.type,
      transactionType: args.transactionType,
      price: args.price,
      currency: args.currency,
      surface: args.surface,
      rooms: args.rooms,
      bathrooms: args.bathrooms,
      images: args.images,
      videos: args.videos ?? [],
      city: args.city,
      neighborhood: args.neighborhood,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      amenities: args.amenities,
      phone: args.phone ?? user.phone,
      virtualTourUrl: args.virtualTourUrl,
      floorPlanUrl: args.floorPlanUrl,
      tour360Images: args.tour360Images ?? [],
      ownerId: user._id,
      status: "available",
      featured: false,
    });

    // Créer la publication associée
    await ctx.db.insert("publications", {
      type: "immo",
      title: args.title,
      description: args.description,
      authorId: user._id,
      tags: args.amenities ?? [],
      images: args.images ?? [],
      meta: JSON.stringify({
        propertyId,
        type: args.type,
        transactionType: args.transactionType,
        price: args.price,
        currency: args.currency,
        surface: args.surface,
        rooms: args.rooms,
        bathrooms: args.bathrooms,
        city: args.city,
        neighborhood: args.neighborhood,
        amenities: args.amenities,
        images: args.images,
        videos: args.videos ?? [],
        status: "available",
        phone: args.phone ?? user.phone,
        virtualTourUrl: args.virtualTourUrl,
        floorPlanUrl: args.floorPlanUrl,
        tour360Images: args.tour360Images ?? [],
      }),
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      status: "active",
    });

    return propertyId;
  },
});

/**
 * Met à jour le statut d'occupation d'un bien.
 */
export const updatePropertyStatus = mutation({
  args: {
    id: v.id("properties"),
    status: v.union(
      v.literal("available"),
      v.literal("rented"),
      v.literal("sold"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const property = await ctx.db.get(args.id);
    if (!property)
      throw new ConvexError({ code: "NOT_FOUND", message: "Bien introuvable" });
    if (property.ownerId !== user._id && !user.isAdmin)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await ctx.db.patch(args.id, { status: args.status });
  },
});

/**
 * Met à jour les informations d'une propriété.
 */
export const updateProperty = mutation({
  args: {
    id: v.id("properties"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("appartement"),
        v.literal("maison"),
        v.literal("villa"),
        v.literal("studio"),
        v.literal("bureau"),
        v.literal("terrain"),
        v.literal("chambre"),
        v.literal("entrepot"),
      ),
    ),
    transactionType: v.optional(
      v.union(v.literal("location"), v.literal("vente")),
    ),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    surface: v.optional(v.number()),
    rooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    amenities: v.optional(v.array(v.string())),
    phone: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("rented"),
        v.literal("sold"),
        v.literal("archived"),
      ),
    ),
    virtualTourUrl: v.optional(v.string()),
    floorPlanUrl: v.optional(v.string()),
    tour360Images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const property = await ctx.db.get(args.id);
    if (!property)
      throw new ConvexError({ code: "NOT_FOUND", message: "Bien introuvable" });
    if (property.ownerId !== user._id && !user.isAdmin)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...patch } = args;
    await ctx.db.patch(args.id, patch);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY MEDIA (Photos, vidéos, 360°, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export const addPropertyMedia = mutation({
  args: {
    propertyId: v.id("properties"),
    type: v.union(
      v.literal("photo"),
      v.literal("video"),
      v.literal("drone"),
      v.literal("360"),
      v.literal("plan"),
      v.literal("pdf"),
    ),
    url: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    size: v.optional(v.number()),
    isCover: v.boolean(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const existing = await ctx.db
      .query("propertyMedia")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();
    const order = existing.length;
    return ctx.db.insert("propertyMedia", {
      propertyId: args.propertyId,
      type: args.type,
      url: args.url,
      thumbnail: args.thumbnail,
      duration: args.duration,
      width: args.width,
      height: args.height,
      size: args.size,
      isCover: args.isCover,
      order,
      title: args.title,
      description: args.description,
    });
  },
});

export const getPropertyMedia = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("propertyMedia")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .order("asc")
      .collect();
    // ✅ Résoudre les URLs
    const resolved = await Promise.all(
      media.map(async (m) => ({
        ...m,
        url: await resolveImages(ctx, [m.url]).then((urls) => urls[0] || m.url),
        thumbnail: m.thumbnail
          ? await resolveImages(ctx, [m.thumbnail]).then(
              (urls) => urls[0] || m.thumbnail,
            )
          : undefined,
      })),
    );
    return resolved;
  },
});

export const deletePropertyMedia = mutation({
  args: { id: v.id("propertyMedia") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY FAVORITES
// ─────────────────────────────────────────────────────────────────────────────

export const toggleFavorite = mutation({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("propertyFavorites")
      .withIndex("by_user_and_property", (q) =>
        q.eq("userId", user._id).eq("propertyId", args.propertyId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    } else {
      await ctx.db.insert("propertyFavorites", {
        propertyId: args.propertyId,
        userId: user._id,
      });
      return { favorited: true };
    }
  },
});

export const getFavorites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    const favorites = await ctx.db
      .query("propertyFavorites")
      .withIndex("by_user_and_property", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      favorites.map(async (f) => {
        const property = await ctx.db.get(f.propertyId);
        if (!property) return { ...f, property: null };
        // Résoudre les images pour le favori
        const resolvedImages = await resolveImages(ctx, property.images || []);
        return {
          ...f,
          property: { ...property, images: resolvedImages },
        };
      }),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY VIEWS (Analytics)
// ─────────────────────────────────────────────────────────────────────────────

export const trackPropertyView = mutation({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_token", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier),
          )
          .unique()
      : null;
    await ctx.db.insert("propertyViews", {
      propertyId: args.propertyId,
      userId: userId?._id,
      viewedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY REQUESTS (Demandes de visites)
// ─────────────────────────────────────────────────────────────────────────────

export const createPropertyRequest = mutation({
  args: {
    propertyId: v.id("properties"),
    message: v.string(),
    visitDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("propertyRequests", {
      propertyId: args.propertyId,
      userId: user._id,
      message: args.message,
      visitDate: args.visitDate,
      status: "pending",
    });
  },
});

export const getPropertyRequests = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("propertyRequests")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();
    return Promise.all(
      requests.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return {
          ...r,
          userName: user?.name,
          userAvatar: user?.avatar,
          userPhone: user?.phone,
        };
      }),
    );
  },
});

export const updatePropertyRequest = mutation({
  args: {
    id: v.id("propertyRequests"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL HOUSING (Logement social)
// ─────────────────────────────────────────────────────────────────────────────

export const submitSocialHousingRequest = mutation({
  args: {
    householdSize: v.number(),
    monthlyIncome: v.optional(v.number()),
    currentSituation: v.string(),
    preferredCity: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("socialHousingRequests", {
      ...args,
      userId: user._id,
      status: "pending",
      submittedAt: new Date().toISOString(),
    });
  },
});

export const getMySocialHousingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    return ctx.db
      .query("socialHousingRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ACCOMMODATIONS (Hébergement)
// ─────────────────────────────────────────────────────────────────────────────

export const listAccommodations = query({
  args: {
    city: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.city) {
      return ctx.db
        .query("accommodations")
        .withIndex("by_city", (q) => q.eq("city", args.city!))
        .paginate(args.paginationOpts);
    }
    // Parcours par création temporelle avec filtre manuel sur le statut d'hébergement
    return ctx.db
      .query("accommodations")
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getAccommodation = query({
  args: { id: v.id("accommodations") },
  handler: async (ctx, args) => {
    const acc = await ctx.db.get(args.id);
    if (!acc) return null;
    const host = await ctx.db.get(acc.hostId);
    const resolvedImages = await resolveImages(ctx, acc.images || []);
    return {
      ...acc,
      images: resolvedImages,
      hostName: host?.name,
      hostAvatar: host?.avatar,
    };
  },
});

export const createAccommodation = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("hotel"),
      v.literal("villa"),
      v.literal("auberge"),
      v.literal("appartement"),
      v.literal("chambre_hote"),
      v.literal("camping"),
    ),
    pricePerNight: v.number(),
    currency: v.string(),
    images: v.array(v.string()),
    city: v.string(),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    amenities: v.array(v.string()),
    maxGuests: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { pricePerNight, ...rest } = args;
    return ctx.db.insert("accommodations", {
      hostId: user._id,
      rating: undefined,
      reviewCount: 0,
      status: "active",
      price: pricePerNight, // Mappage vers l'attribut réel price de la table
      createdAt: Date.now(), // Attribut obligatoire du schéma
      available: true, // Attribut obligatoire du schéma
      ...rest,
    });
  },
});

export const bookAccommodation = mutation({
  args: {
    accommodationId: v.id("accommodations"),
    checkIn: v.string(),
    checkOut: v.string(),
    guests: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const acc = await ctx.db.get(args.accommodationId);
    if (!acc)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hébergement introuvable",
      });
    const checkIn = new Date(args.checkIn);
    const checkOut = new Date(args.checkOut);
    const nights = Math.max(
      1,
      Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const totalAmount = acc.price * nights; // Mappage correct vers acc.price
    return ctx.db.insert("accommodationBookings", {
      accommodationId: args.accommodationId,
      userId: user._id,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests,
      totalAmount,
      currency: acc.currency,
      status: "pending",
      message: args.message,
    });
  },
});

export const getMyAccommodationBookings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    const bookings = await ctx.db
      .query("accommodationBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
    return Promise.all(
      bookings.map(async (b) => {
        const acc = await ctx.db.get(b.accommodationId);
        if (!acc)
          return {
            ...b,
            accommodationTitle: undefined,
            accommodationImages: [],
          };
        const resolvedImages = await resolveImages(ctx, acc.images || []);
        return {
          ...b,
          accommodationTitle: acc.title,
          accommodationImages: resolvedImages,
        };
      }),
    );
  },
});
