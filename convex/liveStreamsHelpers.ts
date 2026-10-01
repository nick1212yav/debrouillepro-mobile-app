// convex/liveStreamsHelpers.ts
//
// Logique Live canonique, extraite pour être partagée entre :
//   - convex/liveStreams.ts    (point d'entrée principal)
//   - convex/community.ts     (wrapper compatibilité)
//
// RÈGLE : ce fichier ne contient AUCUN check de permission "haut niveau"
// (assertHost, isAdmin). Ces checks restent dans les appelants.
// Les helpers reçoivent donc un `user` déjà authentifié, ou un `streamId`
// déjà autorisé.

import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

type AuthCtx = QueryCtx | MutationCtx;

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5_000;
const MAX_TAGS = 30;
const MAX_TAG_LENGTH = 50;

/* ============================================================================
 * UTILITAIRES LOCAUX (isolés pour éviter les imports croisés)
 * ========================================================================== */

const toIso = (ms: number) => new Date(ms).toISOString();

function normalizeTitle(title: string) {
  const value = title.trim();

  if (!value) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Le titre du live est obligatoire",
    });
  }

  if (value.length > MAX_TITLE_LENGTH) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `Le titre ne peut pas dépasser ${MAX_TITLE_LENGTH} caractères`,
    });
  }

  return value;
}

function normalizeDescription(description?: string) {
  if (description === undefined) return undefined;
  const value = description.trim();
  if (!value) return undefined;

  if (value.length > MAX_DESCRIPTION_LENGTH) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères`,
    });
  }

  return value;
}

function normalizeTags(tags: string[]) {
  if (tags.length > MAX_TAGS) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `Maximum ${MAX_TAGS} tags`,
    });
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, MAX_TAG_LENGTH)),
    ),
  );
}

/* ============================================================================
 * HELPER — Lecture du live actif d'un host
 * ========================================================================== */

/**
 * Retourne le live actif du host, ou `null` si aucun.
 *
 * Corrige le `.unique()` global de l'ancien community.getLiveStatus qui
 * crashait dès que 2 hosts étaient en live simultanément.
 */
export async function getActiveStreamForHost(
  ctx: AuthCtx,
  hostId: Id<"users">,
): Promise<Doc<"liveStreams"> | null> {
  const streams = await ctx.db
    .query("liveStreams")
    .withIndex("by_host", (q) => q.eq("hostId", hostId))
    .order("desc")
    .take(20);

  return (
    streams.find(
      (stream) =>
        stream.status === "live" &&
        stream.isActive === true &&
        stream.isDeleted !== true,
    ) ?? null
  );
}

/* ============================================================================
 * HELPER — Démarrage d'un live
 * ========================================================================== */

export interface StartStreamInternalArgs {
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Logique canonique de démarrage d'un live.
 *
 * - Termine automatiquement les lives actifs du host
 * - Normalise titre / description / tags
 * - Insère le document liveStreams avec TOUS les champs du contrat v2
 * - Insère le message système
 *
 * Ne fait AUCUN check de permission. L'appelant doit avoir validé
 * l'utilisateur et `isBanned`.
 */
export async function startStreamInternal(
  ctx: MutationCtx,
  user: Doc<"users">,
  args: StartStreamInternalArgs,
): Promise<Id<"liveStreams">> {
  // Ferme les lives actifs du host
  const existingStreams = await ctx.db
    .query("liveStreams")
    .withIndex("by_host", (q) => q.eq("hostId", user._id))
    .filter((q) => q.eq(q.field("status"), "live"))
    .take(10);

  const now = Date.now();
  const nowIso = toIso(now);

  for (const stream of existingStreams) {
    await ctx.db.patch(stream._id, {
      status: "ended",
      isActive: false,
      endedAt: nowIso,
      updatedAt: now,
    });
  }

  const title = normalizeTitle(args.title);
  const description = normalizeDescription(args.description);
  const tags = normalizeTags(args.tags ?? []);
  const isPublic = args.isPublic ?? true;
  const category = (args.category ?? "general").trim() || "general";

  const streamId = await ctx.db.insert("liveStreams", {
    hostId: user._id,
    schemaVersion: 1,

    title,
    description,
    category,
    tags,

    thumbnailUrl: args.thumbnailUrl,

    playbackUrl: undefined,
    ingestUrl: undefined,
    replayStorageId: undefined,
    replayUrl: undefined,
    replayDurationMs: undefined,

    status: "live",
    moderationStatus: "approved",
    visibility: isPublic ? "public" : "private",

    isActive: true,
    isDeleted: false,
    isPinned: false,

    isPublic,

    createdAt: now,
    updatedAt: now,

    scheduledAt: undefined,
    startedAt: nowIso,
    endedAt: undefined,

    viewerCount: 0,
    peakViewers: 0,
    likeCount: 0,
    chatCount: 0,
    giftCount: 0,
    shareCount: 0,
    totalViewCount: 0,

    city: undefined,
    languageCode: undefined,
  });

  await ctx.db.insert("liveStreamMessages", {
    streamId,
    userId: user._id,
    text: `${user.name ?? "Quelqu'un"} a lancé le live !`,
    type: "system",

    isDeleted: false,
    isPinned: false,
    moderationStatus: "approved",

    createdAt: now,
    updatedAt: now,
  });

  return streamId;
}

/* ============================================================================
 * HELPER — Fin d'un live
 * ========================================================================== */

/**
 * Logique canonique de fin d'un live.
 *
 * Ne fait AUCUN check de permission. L'appelant doit avoir validé
 * que l'utilisateur est bien le host (ou admin).
 */
export async function endStreamInternal(
  ctx: MutationCtx,
  streamId: Id<"liveStreams">,
): Promise<void> {
  const now = Date.now();

  await ctx.db.patch(streamId, {
    status: "ended",
    isActive: false,
    endedAt: toIso(now),
    updatedAt: now,
    viewerCount: 0,
  });
}
