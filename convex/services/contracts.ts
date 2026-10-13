// convex/services/contracts.ts
//
// Backend Services V1 — contrats.
//
// Cycle :
//   draft → pending_signature → signed
//                            ↘ cancelled
//
// Règles de permission :
//   - LECTURE  : client OU propriétaire du prestataire OU admin
//   - ÉCRITURE : client OU propriétaire du prestataire (jamais admin seul)
//   - SIGNATURE : strictement la partie concernée (client OU provider)
//
// Règles métier :
//   - un contrat par réservation
//   - terms modifiables uniquement en draft
//   - documentUrl modifiable uniquement en draft
//   - documentUrl : storage ID Convex vérifié via ctx.storage.getUrl()
//   - annulation enregistrée dans l'historique, jamais dans terms
//   - passage à pending_signature refusé si terms invalides
//   - lecture minimale : métadonnées, pas les docs complets

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const CONTRACT_STATUS = v.union(
  v.literal("draft"),
  v.literal("pending_signature"),
  v.literal("signed"),
  v.literal("cancelled"),
);

type ContractStatus = "draft" | "pending_signature" | "signed" | "cancelled";

const MAX_LIMIT = 100;
const MIN_TERMS = 20;
const MAX_TERMS = 10000;
const MAX_CANCEL_REASON = 500;

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

function isAdmin(user: Doc<"users">): boolean {
  return user.isAdmin === true || user.roles?.includes("admin") === true;
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

function validateTerms(raw: string): string {
  const t = raw.trim();
  if (t.length < MIN_TERMS) {
    throw new ConvexError({
      code: "INVALID_TERMS",
      message: `Le contrat doit contenir au moins ${MIN_TERMS} caractères.`,
    });
  }
  if (t.length > MAX_TERMS) {
    throw new ConvexError({
      code: "INVALID_TERMS",
      message: `Contrat trop long (max ${MAX_TERMS} caractères).`,
    });
  }
  return t;
}

function validateCancelReason(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const r = raw.trim();
  if (r.length === 0) return undefined;
  if (r.length > MAX_CANCEL_REASON) {
    throw new ConvexError({
      code: "INVALID_REASON",
      message: `Motif trop long (max ${MAX_CANCEL_REASON} caractères).`,
    });
  }
  return r;
}

/**
 * Vérifie qu'un identifiant de stockage Convex est réel et résolvable.
 * Pas de confiance à un format de chaîne : appel réel à getUrl() avec
 * gestion d'erreur explicite. Rejette les URL publiques.
 */
async function resolveStorageId(
  ctx: Ctx,
  raw: string | undefined,
): Promise<string | undefined> {
  if (raw === undefined) return undefined;
  const id = raw.trim();
  if (id.length === 0) return undefined;

  if (id.startsWith("http://") || id.startsWith("https://")) {
    throw new ConvexError({
      code: "INVALID_DOCUMENT_URL",
      message:
        "Les documents contractuels doivent être stockés dans Convex Storage, pas via URL publique.",
    });
  }

  let url: string | null = null;
  try {
    url = await ctx.storage.getUrl(id as Id<"_storage">);
  } catch {
    throw new ConvexError({
      code: "INVALID_STORAGE_ID",
      message: "Identifiant de stockage invalide.",
    });
  }

  if (url === null) {
    throw new ConvexError({
      code: "INVALID_STORAGE_ID",
      message: "Identifiant de stockage introuvable.",
    });
  }

  return id;
}

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users">,
  bookingId?: Id<"serviceBookings">,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId,
    bookingId,
    type: event,
    metadata,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// CHARGEMENT — lecture vs écriture
// ────────────────────────────────────────────────────────────────

type ContractParty = {
  isClient: boolean;
  isProvider: boolean;
  isAdmin: boolean;
};

async function getContractParty(
  ctx: Ctx,
  contract: Doc<"serviceContracts">,
  user: Doc<"users">,
): Promise<ContractParty> {
  const isClient = contract.clientId === user._id;
  let isProvider = false;
  if (!isClient) {
    const provider = await ctx.db.get(contract.providerId);
    if (provider && provider.userId === user._id) isProvider = true;
  }
  return { isClient, isProvider, isAdmin: isAdmin(user) };
}

/**
 * Lecture : autorise client, provider ou admin.
 */
async function loadReadableContract(
  ctx: Ctx,
  contractId: Id<"serviceContracts">,
  user: Doc<"users">,
): Promise<Doc<"serviceContracts">> {
  const contract = await ctx.db.get(contractId);
  if (!contract) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Contrat introuvable",
    });
  }

  const {
    isClient,
    isProvider,
    isAdmin: admin,
  } = await getContractParty(ctx, contract, user);

  if (!isClient && !isProvider && !admin) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
  }

  return contract;
}

/**
 * Écriture : client OU provider uniquement. L'admin N'A PAS de privilège
 * d'écriture sur un contrat dont il n'est pas partie.
 */
async function loadWritableContract(
  ctx: Ctx,
  contractId: Id<"serviceContracts">,
  user: Doc<"users">,
): Promise<Doc<"serviceContracts">> {
  const contract = await ctx.db.get(contractId);
  if (!contract) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Contrat introuvable",
    });
  }

  const { isClient, isProvider } = await getContractParty(ctx, contract, user);

  if (!isClient && !isProvider) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Seules les parties du contrat peuvent le modifier.",
    });
  }

  return contract;
}

// ────────────────────────────────────────────────────────────────
// CRÉATION
// ────────────────────────────────────────────────────────────────

export const createContract = mutation({
  args: {
    bookingId: v.id("serviceBookings"),
    terms: v.string(),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }

    const provider = await ctx.db.get(booking.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isClient = booking.userId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isClient && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seuls le client ou le prestataire peuvent créer un contrat.",
      });
    }

    if (booking.status === "cancelled" || booking.status === "done") {
      throw new ConvexError({
        code: "INVALID_BOOKING_STATUS",
        message: `Impossible de créer un contrat pour une réservation en statut "${booking.status}".`,
      });
    }

    const existing = await ctx.db
      .query("serviceContracts")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "CONTRACT_EXISTS",
        message: "Un contrat existe déjà pour cette réservation.",
      });
    }

    const terms = validateTerms(args.terms);
    const documentUrl = await resolveStorageId(ctx, args.documentUrl);

    const now = Date.now();
    const contractId = await ctx.db.insert("serviceContracts", {
      bookingId: args.bookingId,
      providerId: booking.providerId,
      clientId: booking.userId,
      terms,
      documentUrl,
      status: "draft",
      createdAt: now,
    });

    await logHistory(
      ctx,
      booking.providerId,
      "contract.created",
      user._id,
      args.bookingId,
    );

    return { contractId, status: "draft" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// MISE À JOUR — draft uniquement
// ────────────────────────────────────────────────────────────────

export const updateTerms = mutation({
  args: {
    contractId: v.id("serviceContracts"),
    terms: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const contract = await loadWritableContract(ctx, args.contractId, user);

    if (contract.status !== "draft") {
      throw new ConvexError({
        code: "IMMUTABLE",
        message: "Les termes ne sont modifiables qu'en statut draft.",
      });
    }

    const terms = validateTerms(args.terms);
    await ctx.db.patch(args.contractId, { terms });

    await logHistory(
      ctx,
      contract.providerId,
      "contract.terms_updated",
      user._id,
      contract.bookingId,
    );

    return { success: true };
  },
});

/**
 * Document modifiable UNIQUEMENT en draft.
 * Dès qu'une partie a envoyé pour signature, le document ne bouge plus.
 */
export const setDocumentUrl = mutation({
  args: {
    contractId: v.id("serviceContracts"),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const contract = await loadWritableContract(ctx, args.contractId, user);

    if (contract.status !== "draft") {
      throw new ConvexError({
        code: "IMMUTABLE",
        message:
          "Le document ne peut être modifié qu'en statut draft (avant l'envoi pour signature).",
      });
    }

    const documentUrl = await resolveStorageId(ctx, args.documentUrl);
    await ctx.db.patch(args.contractId, { documentUrl });

    await logHistory(
      ctx,
      contract.providerId,
      "contract.document_updated",
      user._id,
      contract.bookingId,
    );

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// TRANSITIONS
// ────────────────────────────────────────────────────────────────

/**
 * Envoi pour signature : refuse si les préconditions métier ne sont pas
 * remplies (terms valides, document résolvable si présent).
 */
export const sendForSignature = mutation({
  args: { contractId: v.id("serviceContracts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const contract = await loadWritableContract(ctx, args.contractId, user);

    if (contract.status !== "draft") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Envoi impossible depuis le statut "${contract.status}".`,
      });
    }

    // Précondition 1 : terms valides
    if (contract.terms.trim().length < MIN_TERMS) {
      throw new ConvexError({
        code: "INVALID_TERMS",
        message:
          "Les termes du contrat sont invalides ou trop courts pour être signés.",
      });
    }

    // Précondition 2 : si un document est référencé, il doit être résolvable
    if (contract.documentUrl) {
      let url: string | null = null;
      try {
        url = await ctx.storage.getUrl(contract.documentUrl as Id<"_storage">);
      } catch {
        url = null;
      }
      if (url === null) {
        throw new ConvexError({
          code: "INVALID_DOCUMENT",
          message:
            "Le document référencé n'est plus disponible. Retirez-le ou remplacez-le avant l'envoi.",
        });
      }
    }

    await ctx.db.patch(args.contractId, { status: "pending_signature" });

    await logHistory(
      ctx,
      contract.providerId,
      "contract.sent",
      user._id,
      contract.bookingId,
    );

    return { success: true, status: "pending_signature" as const };
  },
});

export const signAsClient = mutation({
  args: { contractId: v.id("serviceContracts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Contrat introuvable",
      });
    }

    if (contract.clientId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le client peut signer côté client.",
      });
    }

    if (contract.status !== "pending_signature") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Signature impossible depuis le statut "${contract.status}".`,
      });
    }

    if (contract.signedByClientAt !== undefined) {
      throw new ConvexError({
        code: "ALREADY_SIGNED",
        message: "Vous avez déjà signé ce contrat.",
      });
    }

    const now = Date.now();
    const bothSigned = contract.signedByProviderAt !== undefined;

    await ctx.db.patch(args.contractId, {
      signedByClientAt: now,
      status: bothSigned ? "signed" : "pending_signature",
    });

    await logHistory(
      ctx,
      contract.providerId,
      bothSigned ? "contract.signed" : "contract.client_signed",
      user._id,
      contract.bookingId,
    );

    return {
      success: true,
      status: bothSigned ? ("signed" as const) : ("pending_signature" as const),
    };
  },
});

export const signAsProvider = mutation({
  args: { contractId: v.id("serviceContracts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Contrat introuvable",
      });
    }

    const provider = await ctx.db.get(contract.providerId);
    if (!provider || provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message:
          "Seul le propriétaire du prestataire peut signer côté prestataire.",
      });
    }

    if (contract.status !== "pending_signature") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Signature impossible depuis le statut "${contract.status}".`,
      });
    }

    if (contract.signedByProviderAt !== undefined) {
      throw new ConvexError({
        code: "ALREADY_SIGNED",
        message: "Vous avez déjà signé ce contrat.",
      });
    }

    const now = Date.now();
    const bothSigned = contract.signedByClientAt !== undefined;

    await ctx.db.patch(args.contractId, {
      signedByProviderAt: now,
      status: bothSigned ? "signed" : "pending_signature",
    });

    await logHistory(
      ctx,
      contract.providerId,
      bothSigned ? "contract.signed" : "contract.provider_signed",
      user._id,
      contract.bookingId,
    );

    return {
      success: true,
      status: bothSigned ? ("signed" as const) : ("pending_signature" as const),
    };
  },
});

export const cancelContract = mutation({
  args: {
    contractId: v.id("serviceContracts"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const contract = await loadWritableContract(ctx, args.contractId, user);

    if (contract.status === "signed") {
      throw new ConvexError({
        code: "IMMUTABLE",
        message: "Un contrat signé ne peut plus être annulé.",
      });
    }
    if (contract.status === "cancelled") {
      return { success: true, alreadyCancelled: true };
    }

    const reason = validateCancelReason(args.reason);

    // terms reste INTACT. Le motif est enregistré dans l'historique.
    await ctx.db.patch(args.contractId, { status: "cancelled" });

    await logHistory(
      ctx,
      contract.providerId,
      "contract.cancelled",
      user._id,
      contract.bookingId,
      reason ? { reason } : undefined,
    );

    return { success: true, status: "cancelled" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE
// ────────────────────────────────────────────────────────────────

export const getContractById = query({
  args: { contractId: v.id("serviceContracts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const contract = await loadReadableContract(ctx, args.contractId, user);

    let signedUrl: string | null = null;
    if (contract.documentUrl) {
      try {
        signedUrl = await ctx.storage.getUrl(
          contract.documentUrl as Id<"_storage">,
        );
      } catch {
        signedUrl = null;
      }
    }

    const provider = await ctx.db.get(contract.providerId);
    const client = await ctx.db.get(contract.clientId);

    return {
      ...contract,
      signedUrl,
      provider: provider
        ? {
            _id: provider._id,
            name: provider.name,
            imageUrl: provider.imageUrl,
            category: provider.category,
            verified: provider.verified,
          }
        : null,
      client: client
        ? {
            _id: client._id,
            name: client.name,
            avatar: client.avatar,
          }
        : null,
    };
  },
});

export const getContractByBooking = query({
  args: { bookingId: v.id("serviceBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const provider = await ctx.db.get(booking.providerId);
    if (!provider) return null;

    const isClient = booking.userId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isClient && !isProvider && !isAdmin(user)) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    return ctx.db
      .query("serviceContracts")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();
  },
});

export const listMyContracts = query({
  args: {
    status: v.optional(CONTRACT_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    const contracts = await ctx.db
      .query("serviceContracts")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? contracts.filter((c) => c.status === (args.status as ContractStatus))
      : contracts;

    return Promise.all(
      filtered.map(async (c) => {
        const provider = await ctx.db.get(c.providerId);
        return {
          ...c,
          provider: provider
            ? {
                _id: provider._id,
                name: provider.name,
                imageUrl: provider.imageUrl,
              }
            : null,
        };
      }),
    );
  },
});

export const listProviderContracts = query({
  args: {
    providerId: v.id("serviceProviders"),
    status: v.optional(CONTRACT_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isOwner = provider.userId === user._id;
    if (!isOwner && !isAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas autorisé à consulter ces contrats.",
      });
    }

    const limit = clampLimit(args.limit, 50);

    const contracts = await ctx.db
      .query("serviceContracts")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? contracts.filter((c) => c.status === (args.status as ContractStatus))
      : contracts;

    return Promise.all(
      filtered.map(async (c) => {
        const client = await ctx.db.get(c.clientId);
        return {
          ...c,
          client: client
            ? { _id: client._id, name: client.name, avatar: client.avatar }
            : null,
        };
      }),
    );
  },
});
