// convex/services/verification.ts
//
// Backend Services V1 — vérification KYC.
//
// Workflow :
//   1. Prestataire uploade des documents via Convex Storage (IDs, pas URL)
//   2. Documents en statut "pending"
//   3. Admin approuve ou rejette individuellement
//   4. Quand tous les documents requis sont approuvés ET non expirés
//      → provider.verified = true
//
// Sécurité :
//   - documentUrl doit être un storage ID Convex (préfixe "kg")
//   - jamais une URL http(s) publique
//   - documents expirés ne comptent pas dans le calcul de "verified"
//   - un doc approuvé ne peut pas être supprimé par le propriétaire

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const DOC_TYPES = v.union(
  v.literal("identity"),
  v.literal("certificate"),
  v.literal("insurance"),
  v.literal("license"),
);

const DOC_STATUS = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("expired"),
);

type DocType = "identity" | "certificate" | "insurance" | "license";
type DocStatus = "pending" | "approved" | "rejected" | "expired";

// ────────────────────────────────────────────────────────────────
// RÈGLES KYC
// ────────────────────────────────────────────────────────────────

// Doit posséder un document "identity" approuvé + non expiré.
// Doit posséder AU MOINS UN document de qualification : certificate OU license.
// "insurance" est optionnel (certains prestataires n'en ont pas).
const REQUIRED_ALWAYS: DocType[] = ["identity"];
const REQUIRED_AT_LEAST_ONE: DocType[][] = [["certificate", "license"]];

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

async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  const isAdmin = user.isAdmin === true || user.roles?.includes("admin");
  if (!isAdmin) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Réservé aux administrateurs.",
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
// HELPERS
// ────────────────────────────────────────────────────────────────

const MAX_LIMIT = 100;
const STORAGE_ID_RE = /^kg[a-z0-9]{20,}$/;

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

/**
 * Refuse les URL publiques. Exige un storage ID Convex valide.
 * Un document KYC ne doit JAMAIS être accessible via une URL publique.
 */
function assertStorageId(raw: string): string {
  const id = raw.trim();
  if (id.startsWith("http://") || id.startsWith("https://")) {
    throw new ConvexError({
      code: "INVALID_DOCUMENT_URL",
      message:
        "Les documents KYC doivent être stockés dans Convex Storage, pas via une URL publique.",
    });
  }
  if (!STORAGE_ID_RE.test(id)) {
    throw new ConvexError({
      code: "INVALID_STORAGE_ID",
      message: "Identifiant de stockage invalide.",
    });
  }
  return id;
}

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users">,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId,
    type: event,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// RECALCUL DE verified — ignore les documents expirés
// ────────────────────────────────────────────────────────────────

async function recomputeProviderVerified(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
): Promise<boolean> {
  const docs = await ctx.db
    .query("serviceVerificationDocuments")
    .withIndex("by_provider", (q) => q.eq("providerId", providerId))
    .collect();

  const now = Date.now();
  const validApproved = docs.filter(
    (d) =>
      d.status === "approved" &&
      (d.expiresAt === undefined || d.expiresAt > now),
  );

  const approvedTypes = new Set(validApproved.map((d) => d.type));

  const hasAllRequired = REQUIRED_ALWAYS.every((t) => approvedTypes.has(t));
  const hasOneOfEachGroup = REQUIRED_AT_LEAST_ONE.every((group) =>
    group.some((t) => approvedTypes.has(t)),
  );

  const verified = hasAllRequired && hasOneOfEachGroup;

  await ctx.db.patch(providerId, { verified });

  return verified;
}

/**
 * Marque tous les documents approuvés mais expirés en "expired".
 * Appelable par admin ou en tâche planifiée. Idempotent.
 */
export const expireOldDocuments = mutation({
  args: {
    providerId: v.optional(v.id("serviceProviders")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    let scanned = 0;
    let expired = 0;
    const touchedProviders = new Set<Id<"serviceProviders">>();

    const candidates = args.providerId
      ? await ctx.db
          .query("serviceVerificationDocuments")
          .withIndex("by_provider", (q) => q.eq("providerId", args.providerId!))
          .collect()
      : await ctx.db
          .query("serviceVerificationDocuments")
          .withIndex("by_status", (q) => q.eq("status", "approved"))
          .collect();

    for (const doc of candidates) {
      scanned++;
      if (doc.status === "approved" && doc.expiresAt && doc.expiresAt <= now) {
        await ctx.db.patch(doc._id, { status: "expired" });
        touchedProviders.add(doc.providerId);
        expired++;
      }
    }

    for (const providerId of touchedProviders) {
      await recomputeProviderVerified(ctx, providerId);
    }

    return { scanned, expired, providersUpdated: touchedProviders.size };
  },
});

// ────────────────────────────────────────────────────────────────
// UPLOAD — PROPRIÉTAIRE
// ────────────────────────────────────────────────────────────────

export const uploadDocument = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    type: DOC_TYPES,
    documentUrl: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOwnedProvider(ctx, args.providerId);

    const storageId = assertStorageId(args.documentUrl);

    if (args.expiresAt !== undefined && args.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "INVALID_EXPIRY",
        message: "La date d'expiration est déjà passée.",
      });
    }

    // Refus : un document du même type déjà en attente ou approuvé (non expiré)
    const existing = await ctx.db
      .query("serviceVerificationDocuments")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    if (
      existing &&
      existing.status !== "rejected" &&
      existing.status !== "expired"
    ) {
      throw new ConvexError({
        code: "DOC_ALREADY_EXISTS",
        message: "Un document de ce type est déjà en cours de traitement.",
      });
    }

    const now = Date.now();
    const documentId = await ctx.db.insert("serviceVerificationDocuments", {
      providerId: args.providerId,
      type: args.type,
      documentUrl: storageId,
      status: "pending",
      expiresAt: args.expiresAt,
      uploadedAt: now,
    });

    await logHistory(
      ctx,
      args.providerId,
      `verification.uploaded.${args.type}`,
      user._id,
    );

    return { documentId, status: "pending" as const };
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.id("serviceVerificationDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Document introuvable",
      });
    }
    await requireOwnedProvider(ctx, doc.providerId);

    if (doc.status !== "pending" && doc.status !== "rejected") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Un document approuvé ne peut pas être supprimé.",
      });
    }

    await ctx.db.delete(args.documentId);
    await recomputeProviderVerified(ctx, doc.providerId);

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PROPRIÉTAIRE (URL signées)
// ────────────────────────────────────────────────────────────────

export const listMyDocuments = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);

    const docs = await ctx.db
      .query("serviceVerificationDocuments")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .collect();

    return Promise.all(
      docs.map(async (d) => {
        let signedUrl: string | null = null;
        if (STORAGE_ID_RE.test(d.documentUrl)) {
          try {
            signedUrl = await ctx.storage.getUrl(
              d.documentUrl as Id<"_storage">,
            );
          } catch {
            signedUrl = null;
          }
        }
        return { ...d, signedUrl };
      }),
    );
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — ADMIN
// ────────────────────────────────────────────────────────────────

export const listPendingDocuments = query({
  args: {
    status: v.optional(DOC_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = clampLimit(args.limit, 50);

    const docs = await ctx.db
      .query("serviceVerificationDocuments")
      .withIndex("by_status", (q) =>
        q.eq("status", (args.status as DocStatus) ?? "pending"),
      )
      .order("desc")
      .take(limit);

    return Promise.all(
      docs.map(async (d) => {
        const provider = await ctx.db.get(d.providerId);
        const reviewer = d.reviewedBy ? await ctx.db.get(d.reviewedBy) : null;

        let signedUrl: string | null = null;
        if (STORAGE_ID_RE.test(d.documentUrl)) {
          try {
            signedUrl = await ctx.storage.getUrl(
              d.documentUrl as Id<"_storage">,
            );
          } catch {
            signedUrl = null;
          }
        }

        return {
          ...d,
          signedUrl,
          providerName: provider?.name ?? "Inconnu",
          reviewerName: reviewer?.name ?? null,
        };
      }),
    );
  },
});

export const getDocumentById = query({
  args: { documentId: v.id("serviceVerificationDocuments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const doc = await ctx.db.get(args.documentId);
    if (!doc) return null;

    const provider = await ctx.db.get(doc.providerId);
    if (!provider) return null;

    const isOwner = provider.userId === user._id;
    const isAdmin = user.isAdmin === true || user.roles?.includes("admin");

    if (!isOwner && !isAdmin) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    let signedUrl: string | null = null;
    if (STORAGE_ID_RE.test(doc.documentUrl)) {
      try {
        signedUrl = await ctx.storage.getUrl(doc.documentUrl as Id<"_storage">);
      } catch {
        signedUrl = null;
      }
    }

    return { ...doc, signedUrl, provider };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — ÉTAT DE VÉRIFICATION (public, sans documents)
// ────────────────────────────────────────────────────────────────

export const getVerificationStatus = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return null;

    const docs = await ctx.db
      .query("serviceVerificationDocuments")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    const now = Date.now();
    const approvedValid = docs.filter(
      (d) =>
        d.status === "approved" &&
        (d.expiresAt === undefined || d.expiresAt > now),
    );

    return {
      verified: provider.verified,
      approvedTypes: approvedValid.map((d) => d.type),
      pendingCount: docs.filter((d) => d.status === "pending").length,
      expiredCount: docs.filter(
        (d) =>
          d.status === "expired" ||
          (d.expiresAt !== undefined && d.expiresAt <= now),
      ).length,
    };
  },
});

// ────────────────────────────────────────────────────────────────
// ACTIONS ADMIN
// ────────────────────────────────────────────────────────────────

export const approveDocument = mutation({
  args: { documentId: v.id("serviceVerificationDocuments") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Document introuvable",
      });
    }
    if (doc.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Approbation impossible depuis le statut "${doc.status}".`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.documentId, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: now,
      rejectionReason: undefined,
    });

    const isVerified = await recomputeProviderVerified(ctx, doc.providerId);
    await logHistory(ctx, doc.providerId, "verification.approved", admin._id);

    return { success: true, providerVerified: isVerified };
  },
});

export const rejectDocument = mutation({
  args: {
    documentId: v.id("serviceVerificationDocuments"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Document introuvable",
      });
    }
    if (doc.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Rejet impossible depuis le statut "${doc.status}".`,
      });
    }

    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 500) {
      throw new ConvexError({
        code: "INVALID_REASON",
        message: "Le motif doit contenir entre 5 et 500 caractères.",
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.documentId, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedAt: now,
      rejectionReason: reason,
    });

    const isVerified = await recomputeProviderVerified(ctx, doc.providerId);
    await logHistory(ctx, doc.providerId, "verification.rejected", admin._id);

    return { success: true, providerVerified: isVerified };
  },
});
