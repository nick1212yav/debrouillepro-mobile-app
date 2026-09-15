import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

// ── Helper pour résoudre les URLs des images ──────────────────────────────
async function resolveImageUrls(
  ctx: QueryCtx | MutationCtx,
  imgIds: string[] | undefined,
): Promise<string[]> {
  if (!imgIds || imgIds.length === 0) return [];
  return await Promise.all(
    imgIds.map(async (imgId) => {
      if (imgId.startsWith("http")) return imgId;
      try {
        return (await ctx.storage.getUrl(imgId as `kg${string}`)) ?? imgId;
      } catch {
        return imgId;
      }
    }),
  );
}

// ── Helper pour résoudre les champs image d'un provider ──────────────────
async function resolveProviderImages(
  ctx: QueryCtx | MutationCtx,
  provider: any,
) {
  if (!provider) return provider;

  const [imageUrl, coverImage, portfolio] = await Promise.all([
    provider.imageUrl
      ? resolveImageUrls(ctx, [provider.imageUrl]).then((urls) => urls[0])
      : Promise.resolve(undefined),
    provider.coverImage
      ? resolveImageUrls(ctx, [provider.coverImage]).then((urls) => urls[0])
      : Promise.resolve(undefined),
    resolveImageUrls(ctx, provider.portfolio),
  ]);

  return {
    ...provider,
    imageUrl,
    coverImage,
    portfolio,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export const list = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const q =
      args.category && args.category !== "Tout"
        ? ctx.db
            .query("serviceProviders")
            .withIndex("by_category", (q) => q.eq("category", args.category!))
        : ctx.db.query("serviceProviders");

    const providers = await q.collect();
    return await Promise.all(
      providers.map((p) => resolveProviderImages(ctx, p)),
    );
  },
});

// ✅ get : résout les URLs des images
export const get = query({
  args: { id: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    if (!provider) return null;
    return await resolveProviderImages(ctx, provider);
  },
});

export const search = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    urgent: v.optional(v.boolean()),
    available: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("serviceProviders");
    if (args.category && args.category !== "Tout") {
      q = q.filter((qi) => qi.eq(qi.field("category"), args.category));
    }
    const results = await q.collect();
    const filtered = results.filter((s) => {
      if (args.urgent && !s.urgent) return false;
      if (args.available && !s.available) return false;
      if (args.minRating && s.rating < args.minRating) return false;
      if (args.maxPrice && parseFloat(s.price) > args.maxPrice) return false;
      if (
        args.search &&
        !s.name.includes(args.search) &&
        !s.specialty.includes(args.search)
      )
        return false;
      return true;
    });
    return await Promise.all(
      filtered.map((p) => resolveProviderImages(ctx, p)),
    );
  },
});

export const getAvailability = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("serviceAvailability")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
  },
});

export const getReviews = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("serviceReviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
    const withNames = await Promise.all(
      reviews.map(async (r) => {
        const user = await ctx.db.get(r.reviewerId);
        return { ...r, reviewerName: user?.name || "Anonyme" };
      }),
    );
    return withNames;
  },
});

export const getQuestions = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("serviceQuestions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
    const withNames = await Promise.all(
      questions.map(async (q) => {
        const user = await ctx.db.get(q.askerId);
        return { ...q, askerName: user?.name || "Anonyme" };
      }),
    );
    return withNames;
  },
});

export const getPortfolio = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider?.portfolio) return [];
    return await resolveImageUrls(ctx, provider.portfolio);
  },
});

export const getPricing = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    return { price: provider?.price, currency: provider?.currency };
  },
});

export const getHistory = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("serviceHistory")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
  },
});

export const recommend = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return [];
    const results = await ctx.db
      .query("serviceProviders")
      .filter((q) => q.eq(q.field("category"), provider.category))
      .take(6);
    return await Promise.all(results.map((p) => resolveProviderImages(ctx, p)));
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    specialty: v.string(),
    description: v.string(),
    price: v.string(),
    currency: v.optional(v.string()),
    category: v.string(),
    location: v.string(),
    responseTime: v.string(),
    skills: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    portfolio: v.optional(v.array(v.string())),
    available: v.boolean(),
    verified: v.boolean(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user)
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    return ctx.db.insert("serviceProviders", {
      ...args,
      userId: user._id,
      rating: 0,
      reviewCount: 0,
      urgent: false,
      currency: args.currency || "USD",
      latitude: args.latitude,
      longitude: args.longitude,
    });
  },
});

export const trackView = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return;
    const viewCount = (provider as any).viewCount || 0;
    await ctx.db.patch(args.providerId, { viewCount: viewCount + 1 } as any);
  },
});

export const toggleFavorite = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user)
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    const existing = await ctx.db
      .query("serviceFavorites")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", user._id).eq("providerId", args.providerId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    } else {
      await ctx.db.insert("serviceFavorites", {
        userId: user._id,
        providerId: args.providerId,
        createdAt: Date.now(),
      });
      return { favorited: true };
    }
  },
});

export const createReview = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user)
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    const reviewId = await ctx.db.insert("serviceReviews", {
      providerId: args.providerId,
      reviewerId: user._id,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });
    // Mettre à jour la note moyenne
    const reviews = await ctx.db
      .query("serviceReviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
    const total = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = total / reviews.length;
    await ctx.db.patch(args.providerId, {
      rating: avg,
      reviewCount: reviews.length,
    });
    return reviewId;
  },
});

export const askQuestion = mutation({
  args: { providerId: v.id("serviceProviders"), question: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user)
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    return ctx.db.insert("serviceQuestions", {
      providerId: args.providerId,
      askerId: user._id,
      question: args.question,
      createdAt: Date.now(),
    });
  },
});

export const answerQuestion = mutation({
  args: { questionId: v.id("serviceQuestions"), answer: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user)
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    const question = await ctx.db.get(args.questionId);
    if (!question)
      throw new ConvexError({
        message: "Question introuvable",
        code: "NOT_FOUND",
      });
    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      answererId: user._id,
      answeredAt: Date.now(),
    });
    return { success: true };
  },
});

export const requestQuote = mutation({
  args: { providerId: v.id("serviceProviders"), message: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user)
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    return ctx.db.insert("serviceQuotes", {
      providerId: args.providerId,
      clientId: user._id,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const book = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    message: v.string(),
    scheduledAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user)
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    return ctx.db.insert("serviceBookings", {
      providerId: args.providerId,
      userId: user._id,
      message: args.message,
      status: "pending",
      scheduledAt: args.scheduledAt,
      createdAt: Date.now(),
    });
  },
});

export const getMyBookings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const bookings = await ctx.db
      .query("serviceBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      bookings.map(async (b) => {
        const provider = await ctx.db.get(b.providerId);
        return {
          ...b,
          provider: provider
            ? await resolveProviderImages(ctx, provider)
            : null,
        };
      }),
    );
  },
});

// ── Seed ──────────────────────────────────────────────────────────────────────

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("serviceProviders").take(1);
    if (existing.length > 0) return;
    const samples = [
      {
        name: "Express Dépannage CI",
        category: "Dépannage",
        specialty: "Plomberie, électricité, serrurerie",
        location: "Abidjan (tous quartiers)",
        rating: 4.9,
        reviewCount: 847,
        price: "Dès 10k FCFA",
        currency: "USD",
        responseTime: "< 30 min",
        imageUrl:
          "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80",
        skills: ["Plomberie", "Électricité", "Serrurerie"],
        description: "Service de dépannage d'urgence disponible 24h/24.",
        verified: true,
        available: true,
        urgent: true,
      },
      {
        name: "Salon Glam Cocody",
        category: "Beauté",
        specialty: "Coiffure, manucure, maquillage",
        location: "Cocody, Abidjan",
        rating: 4.8,
        reviewCount: 512,
        price: "Dès 5k FCFA",
        currency: "USD",
        responseTime: "Sur rdv",
        imageUrl:
          "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&q=80",
        skills: ["Coiffure", "Manucure", "Maquillage"],
        description: "Salon de beauté haut de gamme.",
        verified: true,
        available: true,
        urgent: false,
      },
      {
        name: "QuickDeliver CI",
        category: "Livraison",
        specialty: "Courses, colis, documents",
        location: "Grand Abidjan",
        rating: 4.7,
        reviewCount: 1204,
        price: "Dès 2k FCFA",
        currency: "USD",
        responseTime: "< 45 min",
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
        skills: ["Courses", "Documents", "Colis"],
        description: "Service de livraison express.",
        verified: true,
        available: true,
        urgent: false,
      },
      {
        name: "Prof à Domicile CI",
        category: "Éducation",
        specialty: "Maths, physique, langues",
        location: "Abidjan",
        rating: 4.8,
        reviewCount: 389,
        price: "Dès 8k/h FCFA",
        currency: "USD",
        responseTime: "Planifié",
        imageUrl:
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80",
        skills: ["Maths", "Physique", "Anglais"],
        description: "Réseau de professeurs qualifiés.",
        verified: false,
        available: true,
        urgent: false,
      },
      {
        name: "Studio Photo Lumière",
        category: "Photo",
        specialty: "Portrait, événements, produits",
        location: "Plateau, Abidjan",
        rating: 4.9,
        reviewCount: 267,
        price: "Dès 50k FCFA",
        currency: "USD",
        responseTime: "Sur rdv",
        imageUrl:
          "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=500&q=80",
        skills: ["Portrait", "Événement", "Produit"],
        description: "Photographe professionnel.",
        verified: true,
        available: true,
        urgent: false,
      },
      {
        name: "Zen & Bien-être",
        category: "Bien-être",
        specialty: "Massage, yoga, méditation",
        location: "Cocody, Abidjan",
        rating: 4.7,
        reviewCount: 145,
        price: "Dès 15k FCFA",
        currency: "USD",
        responseTime: "Sur rdv",
        imageUrl:
          "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&q=80",
        skills: ["Massage", "Yoga", "Méditation"],
        description: "Centre de bien-être holistique.",
        verified: true,
        available: false,
        urgent: false,
      },
    ];
    for (const s of samples) {
      await ctx.db.insert("serviceProviders", s);
    }
  },
});
