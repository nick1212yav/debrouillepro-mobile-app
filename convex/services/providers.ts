// convex/services/providers.ts
//
// Backend Services V1 — gestion du prestataire (côté propriétaire).
//
// Ne remplace PAS api.serviceProviders.* — coexiste sous api.services.providers.*

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

// ────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────

async function getUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getUser(ctx);
  if (!user) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }
  return user;
}

async function requireOwnedProvider(
  ctx: Ctx,
  providerId: Id<"serviceProviders">,
): Promise<{ user: Doc<"users">; provider: Doc<"serviceProviders"> }> {
  const user = await requireUser(ctx);
  const provider = await ctx.db.get(providerId);
  if (!provider) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Prestataire introuvable",
    });
  }
  if (provider.userId !== user._id) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas le propriétaire de ce profil.",
    });
  }
  return { user, provider };
}

// ────────────────────────────────────────────────────────────────
// IMAGES — validation de préfixe avant cast
// ────────────────────────────────────────────────────────────────

const STORAGE_ID_RE = /^[a-z0-9]{32}$/;

async function resolveImageUrl(ctx: Ctx, imgId: string): Promise<string> {
  if (imgId.startsWith("http://") || imgId.startsWith("https://")) {
    return imgId;
  }
  if (!STORAGE_ID_RE.test(imgId)) {
    return imgId; // format inconnu → on renvoie tel quel, pas d'erreur
  }
  try {
    const url = await ctx.storage.getUrl(imgId as Id<"_storage">);
    return url ?? imgId;
  } catch {
    return imgId;
  }
}

async function resolveImageUrls(
  ctx: Ctx,
  imgIds: string[] | undefined,
): Promise<string[]> {
  if (!imgIds || imgIds.length === 0) return [];
  return Promise.all(imgIds.map((id) => resolveImageUrl(ctx, id)));
}

async function resolveProviderImages(
  ctx: Ctx,
  provider: Doc<"serviceProviders">,
): Promise<
  Doc<"serviceProviders"> & {
    imageUrl?: string;
    coverImage?: string;
    portfolio: string[];
  }
> {
  const [imageUrl, coverImage, portfolio] = await Promise.all([
    provider.imageUrl
      ? resolveImageUrl(ctx, provider.imageUrl)
      : Promise.resolve(undefined),
    provider.coverImage
      ? resolveImageUrl(ctx, provider.coverImage)
      : Promise.resolve(undefined),
    resolveImageUrls(ctx, provider.portfolio),
  ]);

  return { ...provider, imageUrl, coverImage, portfolio };
}

// ────────────────────────────────────────────────────────────────
// VALIDATION
// ────────────────────────────────────────────────────────────────

const ISO_4217 = /^[A-Z]{3}$/;
const MAX_LIMIT = 100;

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

function assertOptionalAmount(amount: number | undefined, label: string): void {
  if (amount === undefined) return;
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ConvexError({
      code: "INVALID_AMOUNT",
      message: `${label} doit être un nombre positif ou nul.`,
    });
  }
}

function assertOptionalCurrency(currency: string | undefined): void {
  if (currency === undefined) return;
  if (!ISO_4217.test(currency)) {
    throw new ConvexError({
      code: "INVALID_CURRENCY",
      message:
        "La devise doit être un code ISO 4217 à trois lettres majuscules.",
    });
  }
}

// ────────────────────────────────────────────────────────────────
// LECTURE — profil du propriétaire
// ────────────────────────────────────────────────────────────────

export const getMyProviderProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const providers = await ctx.db
      .query("serviceProviders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(providers.map((p) => resolveProviderImages(ctx, p)));
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE PUBLIQUE — exclusions strictes
// ────────────────────────────────────────────────────────────────

export const listProvidersPublic = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = clampLimit(args.limit, 50);

    let results;
    if (args.category) {
      results = await ctx.db
        .query("serviceProviders")
        .withIndex("by_category_and_status", (q) =>
          q.eq("category", args.category!).eq("status", "active"),
        )
        .take(limit * 3);
    } else {
      results = await ctx.db
        .query("serviceProviders")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .take(limit * 3);
    }

    const filtered = results
      .filter((p) => p.isDemo !== true && p.status === "active")
      .slice(0, limit);

    return Promise.all(filtered.map((p) => resolveProviderImages(ctx, p)));
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — détail public d'un provider
// ────────────────────────────────────────────────────────────────

export const getProviderById = query({
  args: { id: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    if (!provider) return null;

    // Exclusion stricte : démo / archivé / suspendu / pause / brouillon
    if (provider.isDemo === true) return null;
    if (provider.status !== "active") return null;

    return await resolveProviderImages(ctx, provider);
  },
});

// ────────────────────────────────────────────────────────────────
// MISE À JOUR — patch construit explicitement, aucun cast
// ────────────────────────────────────────────────────────────────

export const updateProvider = mutation({
  args: {
    providerId: v.id("serviceProviders"),

    name: v.optional(v.string()),
    specialty: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    categoryId: v.optional(v.id("serviceCategories")),

    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    website: v.optional(v.string()),
    businessEmail: v.optional(v.string()),

    basePrice: v.optional(v.number()),
    priceCurrency: v.optional(v.string()),
    pricingModel: v.optional(
      v.union(
        v.literal("fixed"),
        v.literal("hourly"),
        v.literal("daily"),
        v.literal("quote_only"),
        v.literal("package"),
      ),
    ),
    billingUnit: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    depositPercent: v.optional(v.number()),

    skills: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    experience: v.optional(v.string()),
    certificates: v.optional(v.array(v.string())),
    portfolio: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),

    serviceAreas: v.optional(v.array(v.string())),
    serviceRadiusKm: v.optional(v.number()),
    intervenesAtClientAddress: v.optional(v.boolean()),
    intervenesAtProviderAddress: v.optional(v.boolean()),
    intervenesOnline: v.optional(v.boolean()),

    cancellationPolicy: v.optional(v.string()),
    cancellationWindowHours: v.optional(v.number()),
    paymentMethodsAccepted: v.optional(
      v.array(
        v.union(
          v.literal("cash"),
          v.literal("mobile_money"),
          v.literal("card"),
          v.literal("wallet"),
        ),
      ),
    ),

    available: v.optional(v.boolean()),
    urgent: v.optional(v.boolean()),
    insurance: v.optional(v.boolean()),
    warranty: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { provider } = await requireOwnedProvider(ctx, args.providerId);

    if (provider.status === "archived") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Un profil archivé ne peut plus être modifié.",
      });
    }

    assertOptionalAmount(args.basePrice, "basePrice");
    assertOptionalAmount(args.minPrice, "minPrice");
    assertOptionalAmount(args.maxPrice, "maxPrice");
    assertOptionalAmount(args.depositPercent, "depositPercent");
    assertOptionalCurrency(args.priceCurrency);

    if (
      args.minPrice !== undefined &&
      args.maxPrice !== undefined &&
      args.minPrice > args.maxPrice
    ) {
      throw new ConvexError({
        code: "INVALID_RANGE",
        message: "minPrice ne peut pas être supérieur à maxPrice.",
      });
    }

    if (
      args.depositPercent !== undefined &&
      (args.depositPercent < 0 || args.depositPercent > 100)
    ) {
      throw new ConvexError({
        code: "INVALID_DEPOSIT",
        message: "depositPercent doit être compris entre 0 et 100.",
      });
    }

    // Patch construit explicitement — aucun cast
    const patch: Partial<Doc<"serviceProviders">> = {};

    if (args.name !== undefined) patch.name = args.name;
    if (args.specialty !== undefined) patch.specialty = args.specialty;
    if (args.description !== undefined) patch.description = args.description;
    if (args.location !== undefined) patch.location = args.location;
    if (args.category !== undefined) patch.category = args.category;
    if (args.categoryId !== undefined) patch.categoryId = args.categoryId;

    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.whatsapp !== undefined) patch.whatsapp = args.whatsapp;
    if (args.website !== undefined) patch.website = args.website;
    if (args.businessEmail !== undefined)
      patch.businessEmail = args.businessEmail;

    if (args.basePrice !== undefined) patch.basePrice = args.basePrice;
    if (args.priceCurrency !== undefined)
      patch.priceCurrency = args.priceCurrency;
    if (args.pricingModel !== undefined) patch.pricingModel = args.pricingModel;
    if (args.billingUnit !== undefined) patch.billingUnit = args.billingUnit;
    if (args.minPrice !== undefined) patch.minPrice = args.minPrice;
    if (args.maxPrice !== undefined) patch.maxPrice = args.maxPrice;
    if (args.depositPercent !== undefined)
      patch.depositPercent = args.depositPercent;

    if (args.skills !== undefined) patch.skills = args.skills;
    if (args.languages !== undefined) patch.languages = args.languages;
    if (args.experience !== undefined) patch.experience = args.experience;
    if (args.certificates !== undefined) patch.certificates = args.certificates;
    if (args.portfolio !== undefined) patch.portfolio = args.portfolio;
    if (args.imageUrl !== undefined) patch.imageUrl = args.imageUrl;
    if (args.coverImage !== undefined) patch.coverImage = args.coverImage;

    if (args.serviceAreas !== undefined) patch.serviceAreas = args.serviceAreas;
    if (args.serviceRadiusKm !== undefined)
      patch.serviceRadiusKm = args.serviceRadiusKm;
    if (args.intervenesAtClientAddress !== undefined)
      patch.intervenesAtClientAddress = args.intervenesAtClientAddress;
    if (args.intervenesAtProviderAddress !== undefined)
      patch.intervenesAtProviderAddress = args.intervenesAtProviderAddress;
    if (args.intervenesOnline !== undefined)
      patch.intervenesOnline = args.intervenesOnline;

    if (args.cancellationPolicy !== undefined)
      patch.cancellationPolicy = args.cancellationPolicy;
    if (args.cancellationWindowHours !== undefined)
      patch.cancellationWindowHours = args.cancellationWindowHours;
    if (args.paymentMethodsAccepted !== undefined)
      patch.paymentMethodsAccepted = args.paymentMethodsAccepted;

    if (args.available !== undefined) patch.available = args.available;
    if (args.urgent !== undefined) patch.urgent = args.urgent;
    if (args.insurance !== undefined) patch.insurance = args.insurance;
    if (args.warranty !== undefined) patch.warranty = args.warranty;

    patch.updatedAt = Date.now();

    await ctx.db.patch(args.providerId, patch);

    return { success: true, providerId: args.providerId };
  },
});

// ────────────────────────────────────────────────────────────────
// CYCLE DE VIE
// ────────────────────────────────────────────────────────────────

export const publishProvider = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const { provider } = await requireOwnedProvider(ctx, args.providerId);

    if (provider.status === "archived") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Un profil archivé ne peut pas être republié.",
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.providerId, {
      status: "active",
      publishedAt: provider.publishedAt ?? now,
      updatedAt: now,
    });

    return { success: true, status: "active" as const };
  },
});

export const pauseProvider = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);
    const now = Date.now();
    await ctx.db.patch(args.providerId, {
      status: "paused",
      available: false,
      updatedAt: now,
    });
    return { success: true, status: "paused" as const };
  },
});

export const archiveProvider = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);
    const now = Date.now();
    await ctx.db.patch(args.providerId, {
      status: "archived",
      available: false,
      archivedAt: now,
      updatedAt: now,
    });
    return { success: true, status: "archived" as const };
  },
});

export const deleteProvider = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);
    const now = Date.now();
    await ctx.db.patch(args.providerId, {
      status: "archived",
      available: false,
      archivedAt: now,
      updatedAt: now,
    });
    return { success: true, softDeleted: true };
  },
});

// ────────────────────────────────────────────────────────────────
// VIEW TRACKING — atomique sous Convex OCC
// ────────────────────────────────────────────────────────────────

export const trackView = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return { tracked: false };
    if (provider.status !== "active") return { tracked: false };
    if (provider.isDemo === true) return { tracked: false };

    const current = provider.viewCount ?? 0;
    await ctx.db.patch(args.providerId, { viewCount: current + 1 });

    return { tracked: true };
  },
});

// ────────────────────────────────────────────────────────────────
// RECOMMANDATIONS — bornée, exclusions strictes
// ────────────────────────────────────────────────────────────────

export const recommend = query({
  args: {
    providerId: v.id("serviceProviders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = clampLimit(args.limit, 6);
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return [];

    const results = await ctx.db
      .query("serviceProviders")
      .withIndex("by_category_and_status", (q) =>
        q.eq("category", provider.category).eq("status", "active"),
      )
      .take(limit * 3 + 1);

    const filtered = results
      .filter((p) => p._id !== args.providerId && p.isDemo !== true)
      .slice(0, limit);

    return Promise.all(filtered.map((p) => resolveProviderImages(ctx, p)));
  },
});
