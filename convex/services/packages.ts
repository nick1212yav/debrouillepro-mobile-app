// convex/services/packages.ts
//
// Backend Services V1 — offres packagées.
//
// Un package = plusieurs items vendus ensemble à un prix forfaitaire.
// Ex : "Ménage complet 3 pièces — 25 000 CDF"
//
// Règle de prix : totalPrice ≤ somme des lignes.
// Un package peut inclure une remise groupée (total < somme),
// jamais une majoration (total > somme).

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const ISO_4217 = /^[A-Z]{3}$/;
const MAX_LIMIT = 100;
const MAX_ITEMS = 50;
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 2000;

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
// VALIDATION
// ────────────────────────────────────────────────────────────────

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

type PackageItem = {
  label: string;
  qty: number;
  unitPrice: number;
};

function validateItems(items: PackageItem[]): PackageItem[] {
  if (items.length === 0) {
    throw new ConvexError({
      code: "INVALID_ITEMS",
      message: "Au moins un élément est requis.",
    });
  }
  if (items.length > MAX_ITEMS) {
    throw new ConvexError({
      code: "INVALID_ITEMS",
      message: `Maximum ${MAX_ITEMS} éléments par package.`,
    });
  }

  return items.map((item) => {
    const label = item.label.trim();
    if (label.length === 0) {
      throw new ConvexError({
        code: "INVALID_ITEM_LABEL",
        message: "Chaque élément doit avoir un libellé.",
      });
    }
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      throw new ConvexError({
        code: "INVALID_ITEM_QTY",
        message: "La quantité doit être un entier ≥ 1.",
      });
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new ConvexError({
        code: "INVALID_ITEM_PRICE",
        message: "Le prix unitaire doit être positif ou nul.",
      });
    }
    return { label, qty: item.qty, unitPrice: item.unitPrice };
  });
}

function computeItemsSum(items: PackageItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

function validateTotalPrice(totalPrice: number, items: PackageItem[]): number {
  if (!Number.isFinite(totalPrice) || totalPrice < 0) {
    throw new ConvexError({
      code: "INVALID_TOTAL",
      message: "Le prix total doit être positif ou nul.",
    });
  }
  const sum = computeItemsSum(items);
  if (totalPrice > sum) {
    throw new ConvexError({
      code: "TOTAL_EXCEEDS_SUM",
      message: `Le prix total (${totalPrice}) ne peut pas dépasser la somme des lignes (${sum}).`,
    });
  }
  return totalPrice;
}

function validateCurrency(raw: string): string {
  const c = raw.trim().toUpperCase();
  if (!ISO_4217.test(c)) {
    throw new ConvexError({
      code: "INVALID_CURRENCY",
      message: "Devise ISO 4217 requise (3 lettres majuscules).",
    });
  }
  return c;
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

function validateDescription(raw: string): string {
  const d = raw.trim();
  if (d.length > MAX_DESCRIPTION) {
    throw new ConvexError({
      code: "INVALID_DESCRIPTION",
      message: `Description trop longue (max ${MAX_DESCRIPTION}).`,
    });
  }
  return d;
}

// ────────────────────────────────────────────────────────────────
// CRÉATION
// ────────────────────────────────────────────────────────────────

export const createPackage = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    title: v.string(),
    description: v.string(),
    items: v.array(
      v.object({
        label: v.string(),
        qty: v.number(),
        unitPrice: v.number(),
      }),
    ),
    totalPrice: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);

    const title = validateTitle(args.title);
    const description = validateDescription(args.description);
    const items = validateItems(args.items);
    const totalPrice = validateTotalPrice(args.totalPrice, items);
    const currency = validateCurrency(args.currency);

    const packageId = await ctx.db.insert("servicePackages", {
      providerId: args.providerId,
      title,
      description,
      items,
      totalPrice,
      currency,
      active: true,
      createdAt: Date.now(),
    });

    return { packageId };
  },
});

// ────────────────────────────────────────────────────────────────
// MISE À JOUR
// ────────────────────────────────────────────────────────────────

export const updatePackage = mutation({
  args: {
    packageId: v.id("servicePackages"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    items: v.optional(
      v.array(
        v.object({
          label: v.string(),
          qty: v.number(),
          unitPrice: v.number(),
        }),
      ),
    ),
    totalPrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Package introuvable",
      });
    }
    await requireOwnedProvider(ctx, pkg.providerId);

    const patch: Partial<Doc<"servicePackages">> = {};

    if (args.title !== undefined) {
      patch.title = validateTitle(args.title);
    }
    if (args.description !== undefined) {
      patch.description = validateDescription(args.description);
    }

    // Cohérence items + totalPrice : on calcule sur l'état post-patch
    const finalItems =
      args.items !== undefined ? validateItems(args.items) : pkg.items;
    const finalTotal =
      args.totalPrice !== undefined ? args.totalPrice : pkg.totalPrice;

    validateTotalPrice(finalTotal, finalItems);

    if (args.items !== undefined) patch.items = finalItems;
    if (args.totalPrice !== undefined) patch.totalPrice = finalTotal;
    if (args.currency !== undefined)
      patch.currency = validateCurrency(args.currency);
    if (args.active !== undefined) patch.active = args.active;

    await ctx.db.patch(args.packageId, patch);

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// DÉSACTIVATION (soft-delete)
// ────────────────────────────────────────────────────────────────

export const deletePackage = mutation({
  args: { packageId: v.id("servicePackages") },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Package introuvable",
      });
    }
    await requireOwnedProvider(ctx, pkg.providerId);

    // Soft-delete : désactive, ne supprime pas
    await ctx.db.patch(args.packageId, { active: false });

    return { success: true, deactivated: true };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PUBLIQUE (uniquement actifs)
// ────────────────────────────────────────────────────────────────

export const listPackages = query({
  args: {
    providerId: v.id("serviceProviders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = clampLimit(args.limit, 50);

    const packages = await ctx.db
      .query("servicePackages")
      .withIndex("by_provider_and_active", (q) =>
        q.eq("providerId", args.providerId).eq("active", true),
      )
      .take(limit);

    return packages;
  },
});

export const getPackageById = query({
  args: { packageId: v.id("servicePackages") },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) return null;
    if (!pkg.active) return null;
    return pkg;
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PROPRIÉTAIRE (vue complète, inactifs inclus)
// ────────────────────────────────────────────────────────────────

export const listMyPackages = query({
  args: {
    providerId: v.id("serviceProviders"),
  },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);

    return ctx.db
      .query("servicePackages")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .collect();
  },
});
