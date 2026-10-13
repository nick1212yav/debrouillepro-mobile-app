// convex/services/promotions.ts
//
// Backend Services V1 — promotions.
//
// Un prestataire peut activer une promotion (discount, featured, bundle)
// avec une fenêtre temporelle. Les promotions expirées ne sont plus actives.
//
// Règle 1 : pas plus de 3 promotions "actives ou programmées" simultanées,
//           avec détection de chevauchement temporel réel (pas seulement "now").
//
// Règle 2 : une promotion de type "featured" reste une INTENTION tant qu'elle
//           n'est pas liée à un paiement réel via `servicePayments`.
//           Le champ `paymentIntentId` sera ajouté sur `servicePromotions`
//           lors du commit payments.ts. Ne pas présenter "featured" comme
//           une monétisation validée avant ce lien.

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const MAX_LIMIT = 100;
const MAX_ACTIVE_PROMOS = 3;
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 1000;

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
): Promise<Doc<"serviceProviders">> {
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
  return provider;
}

// ────────────────────────────────────────────────────────────────
// VISIBILITÉ PUBLIQUE
// ────────────────────────────────────────────────────────────────

function isPubliclyVisible(provider: Doc<"serviceProviders">): boolean {
  return provider.status === "active" && provider.isDemo !== true;
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

function validateTitle(raw: string): string {
  const t = raw.trim();
  if (t.length === 0 || t.length > MAX_TITLE) {
    throw new ConvexError({
      code: "INVALID_TITLE",
      message: `Titre requis (max ${MAX_TITLE} caractères).`,
    });
  }
  return t;
}

function validateDescription(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const d = raw.trim();
  if (d.length > MAX_DESCRIPTION) {
    throw new ConvexError({
      code: "INVALID_DESCRIPTION",
      message: `Description trop longue (max ${MAX_DESCRIPTION}).`,
    });
  }
  return d;
}

function validateWindow(startsAt: number, endsAt: number): void {
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
    throw new ConvexError({
      code: "INVALID_WINDOW",
      message: "Les dates doivent être des nombres.",
    });
  }
  if (startsAt >= endsAt) {
    throw new ConvexError({
      code: "INVALID_WINDOW",
      message: "startsAt doit être avant endsAt.",
    });
  }
}

function validateDiscount(percent: number): number {
  if (!Number.isInteger(percent)) {
    throw new ConvexError({
      code: "INVALID_DISCOUNT",
      message: "discountPercent doit être un entier.",
    });
  }
  if (percent < 1 || percent > 99) {
    throw new ConvexError({
      code: "INVALID_DISCOUNT",
      message: "discountPercent doit être compris entre 1 et 99.",
    });
  }
  return percent;
}

// ────────────────────────────────────────────────────────────────
// CHEVAUCHEMENT TEMPOREL — vraie règle
// ────────────────────────────────────────────────────────────────

/**
 * Deux fenêtres [a1, a2[ et [b1, b2[ se chevauchent si a1 < b2 && b1 < a2.
 * On ne regarde PAS "now" — le chevauchement est structurel.
 */
function overlaps(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

/**
 * Vérifie qu'une nouvelle fenêtre (ou modifiée) ne fait pas dépasser
 * la limite de promotions simultanées, en tenant compte des fenêtres
 * futures ET actuelles (toute promo `active` compte, quelle que soit sa date).
 */
async function assertPromoCapacity(
  ctx: Ctx,
  providerId: Id<"serviceProviders">,
  newStart: number,
  newEnd: number,
  excludePromoId?: Id<"servicePromotions">,
): Promise<void> {
  const all = await ctx.db
    .query("servicePromotions")
    .withIndex("by_provider", (q) => q.eq("providerId", providerId))
    .collect();

  // On ne compte que les promos actives (non désactivées)
  const relevant = all.filter((p) => p.active && p._id !== excludePromoId);

  // Combien d'actives ou de programmées chevauchent la nouvelle fenêtre ?
  const overlappingCount = relevant.filter((p) =>
    overlaps(p.startsAt, p.endsAt, newStart, newEnd),
  ).length;

  // La nouvelle promo compte pour +1
  if (overlappingCount + 1 > MAX_ACTIVE_PROMOS) {
    throw new ConvexError({
      code: "TOO_MANY_ACTIVE",
      message: `Maximum ${MAX_ACTIVE_PROMOS} promotions qui se chevauchent dans le temps.`,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// CRÉATION
// ────────────────────────────────────────────────────────────────

export const createPromotion = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    type: v.union(
      v.literal("discount"),
      v.literal("featured"),
      v.literal("bundle"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    discountPercent: v.optional(v.number()),
    startsAt: v.number(),
    endsAt: v.number(),
  },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);

    const title = validateTitle(args.title);
    const description = validateDescription(args.description);
    validateWindow(args.startsAt, args.endsAt);

    let discountPercent: number | undefined;

    if (args.type === "discount") {
      if (args.discountPercent === undefined) {
        throw new ConvexError({
          code: "MISSING_DISCOUNT",
          message:
            "discountPercent est requis pour une promotion de type discount.",
        });
      }
      discountPercent = validateDiscount(args.discountPercent);
    } else if (args.discountPercent !== undefined) {
      throw new ConvexError({
        code: "UNEXPECTED_DISCOUNT",
        message: "discountPercent n'est autorisé que pour le type discount.",
      });
    }

    await assertPromoCapacity(ctx, args.providerId, args.startsAt, args.endsAt);

    const now = Date.now();
    const promotionId = await ctx.db.insert("servicePromotions", {
      providerId: args.providerId,
      type: args.type,
      title,
      description,
      discountPercent,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      active: true,
      createdAt: now,
    });

    return { promotionId };
  },
});

// ────────────────────────────────────────────────────────────────
// MISE À JOUR
// ────────────────────────────────────────────────────────────────

export const updatePromotion = mutation({
  args: {
    promotionId: v.id("servicePromotions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    discountPercent: v.optional(v.number()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const promo = await ctx.db.get(args.promotionId);
    if (!promo) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Promotion introuvable",
      });
    }
    await requireOwnedProvider(ctx, promo.providerId);

    const patch: Partial<Doc<"servicePromotions">> = {};

    if (args.title !== undefined) patch.title = validateTitle(args.title);
    if (args.description !== undefined)
      patch.description = validateDescription(args.description);

    const finalStart = args.startsAt ?? promo.startsAt;
    const finalEnd = args.endsAt ?? promo.endsAt;
    validateWindow(finalStart, finalEnd);

    if (args.startsAt !== undefined) patch.startsAt = finalStart;
    if (args.endsAt !== undefined) patch.endsAt = finalEnd;

    if (args.discountPercent !== undefined) {
      if (promo.type !== "discount") {
        throw new ConvexError({
          code: "UNEXPECTED_DISCOUNT",
          message: "discountPercent n'est autorisé que pour le type discount.",
        });
      }
      patch.discountPercent = validateDiscount(args.discountPercent);
    }

    // Réactivation ou déplacement de fenêtre → re-vérifier la capacité
    const isReactivating = args.active === true && !promo.active;
    const isMovingWindow =
      args.startsAt !== undefined || args.endsAt !== undefined;

    if (isReactivating || isMovingWindow) {
      await assertPromoCapacity(
        ctx,
        promo.providerId,
        finalStart,
        finalEnd,
        args.promotionId,
      );
    }

    if (args.active !== undefined) patch.active = args.active;

    await ctx.db.patch(args.promotionId, patch);

    return { success: true };
  },
});

export const deletePromotion = mutation({
  args: { promotionId: v.id("servicePromotions") },
  handler: async (ctx, args) => {
    const promo = await ctx.db.get(args.promotionId);
    if (!promo) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Promotion introuvable",
      });
    }
    await requireOwnedProvider(ctx, promo.providerId);

    // Soft-delete
    await ctx.db.patch(args.promotionId, { active: false });

    return { success: true, deactivated: true };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PUBLIQUE
// ────────────────────────────────────────────────────────────────

export const listActivePromotions = query({
  args: {
    providerId: v.id("serviceProviders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return [];
    if (!isPubliclyVisible(provider)) return [];

    const limit = clampLimit(args.limit, 20);
    const now = Date.now();

    const promos = await ctx.db
      .query("servicePromotions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    return promos
      .filter((p) => p.active && p.startsAt <= now && p.endsAt > now)
      .slice(0, limit);
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PROPRIÉTAIRE
// ────────────────────────────────────────────────────────────────

export const listMyPromotions = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);

    return ctx.db
      .query("servicePromotions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .collect();
  },
});
