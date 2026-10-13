// convex/services/recurring.ts
//
// Backend Services V1 — réservations récurrentes.
//
// RÈGLE TEMPORELLE UNIQUE :
//   - le client fournit `startDate` (YYYY-MM-DD) + `timeSlot` (HH:MM)
//   - le serveur calcule `nextOccurrence` = startDate à timeSlot UTC
//   - `anchorDayOfMonth` est persisté pour préserver l'intention
//     mensuelle (31 janv → 28 févr → 31 mars, jamais 28 mars)
//
// MODÈLE D'ACCÈS :
//   - `generateNextBooking` : client-callable, self-only, idempotent.
//     Ne fait rien si `nextOccurrence > now` → pas de doublon possible.
//   - `processDueRecurrings` : admin-only, batch, pour worker/cron.

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const RECURRENCE_PATTERN = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("biweekly"),
  v.literal("monthly"),
);

type Pattern = "daily" | "weekly" | "biweekly" | "monthly";

const MAX_ACTIVE_PER_USER = 20;
const MAX_LIMIT = 100;
const MIN_MESSAGE = 3;
const MAX_MESSAGE = 2000;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

async function requireProvider(
  ctx: Ctx,
  providerId: Id<"serviceProviders">,
): Promise<Doc<"serviceProviders">> {
  const provider = await ctx.db.get(providerId);
  if (!provider) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Prestataire introuvable",
    });
  }
  return provider;
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

function validateTimeSlot(raw: string): string {
  const t = raw.trim();
  if (!TIME_RE.test(t)) {
    throw new ConvexError({
      code: "INVALID_TIME_SLOT",
      message: "timeSlot doit être au format HH:MM (24h).",
    });
  }
  return t;
}

function validateMessage(raw: string): string {
  const m = raw.trim();
  if (m.length < MIN_MESSAGE) {
    throw new ConvexError({
      code: "INVALID_MESSAGE",
      message: `Message trop court (min ${MIN_MESSAGE} caractères).`,
    });
  }
  if (m.length > MAX_MESSAGE) {
    throw new ConvexError({
      code: "INVALID_MESSAGE",
      message: `Message trop long (max ${MAX_MESSAGE} caractères).`,
    });
  }
  return m;
}

function validatePatternDayOfWeek(
  pattern: Pattern,
  dayOfWeek: number | undefined,
): void {
  if (pattern === "daily" && dayOfWeek !== undefined) {
    throw new ConvexError({
      code: "UNEXPECTED_DAY_OF_WEEK",
      message: "dayOfWeek ne doit pas être fourni pour une récurrence daily.",
    });
  }
  if (
    (pattern === "weekly" || pattern === "biweekly") &&
    dayOfWeek === undefined
  ) {
    throw new ConvexError({
      code: "MISSING_DAY_OF_WEEK",
      message: "dayOfWeek est requis pour une récurrence weekly ou biweekly.",
    });
  }
  if (
    dayOfWeek !== undefined &&
    (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)
  ) {
    throw new ConvexError({
      code: "INVALID_DAY_OF_WEEK",
      message:
        "dayOfWeek doit être un entier entre 0 (dimanche) et 6 (samedi).",
    });
  }
}

function parseUTCDate(dateStr: string): { y: number; m: number; d: number } {
  if (!DATE_RE.test(dateStr)) {
    throw new ConvexError({
      code: "INVALID_DATE",
      message: "startDate doit être au format YYYY-MM-DD.",
    });
  }
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new ConvexError({
      code: "INVALID_DATE",
      message: `La date "${dateStr}" n'existe pas dans le calendrier.`,
    });
  }
  return { y, m, d };
}

function composeOccurrence(startDate: string, timeSlot: string): number {
  const { y, m, d } = parseUTCDate(startDate);
  const [hh, mm] = timeSlot.split(":").map((n) => parseInt(n, 10));
  return Date.UTC(y, m - 1, d, hh, mm, 0, 0);
}

function dayOfWeekOfDate(dateStr: string): number {
  const { y, m, d } = parseUTCDate(dateStr);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function assertDateMatchesDayOfWeek(
  startDate: string,
  dayOfWeek: number | undefined,
): void {
  if (dayOfWeek === undefined) return;
  const actual = dayOfWeekOfDate(startDate);
  if (actual !== dayOfWeek) {
    throw new ConvexError({
      code: "DAY_OF_WEEK_MISMATCH",
      message: `La date ${startDate} ne tombe pas sur le jour de la semaine indiqué (attendu ${dayOfWeek}, obtenu ${actual}).`,
    });
  }
}

function validateNextOccurrence(ts: number): number {
  if (!Number.isFinite(ts)) {
    throw new ConvexError({
      code: "INVALID_OCCURRENCE",
      message: "nextOccurrence doit être un timestamp.",
    });
  }
  if (ts <= Date.now()) {
    throw new ConvexError({
      code: "INVALID_OCCURRENCE",
      message: "nextOccurrence doit être dans le futur.",
    });
  }
  return ts;
}

function validateEndsAt(
  endsAt: number | undefined,
  nextOccurrence: number,
): void {
  if (endsAt === undefined) return;
  if (!Number.isFinite(endsAt)) {
    throw new ConvexError({
      code: "INVALID_ENDS_AT",
      message: "endsAt doit être un timestamp.",
    });
  }
  if (endsAt <= nextOccurrence) {
    throw new ConvexError({
      code: "INVALID_ENDS_AT",
      message: "endsAt doit être après la première occurrence.",
    });
  }
}

/**
 * Avance d'une période.
 * - daily/weekly/biweekly : arithmétique fixe (le jour de semaine est
 *   déjà garanti par la validation à la création)
 * - monthly : utilise `anchorDay` (jour originel) borné au dernier jour
 *   du mois cible. Ex : anchor=31 → 31 janv, 28 févr, 31 mars, 30 avr.
 *   Jamais 28 mars après un 28 février.
 */
function advance(
  ts: number,
  pattern: Pattern,
  anchorDay: number | null,
): number {
  if (pattern === "daily") return ts + 24 * 60 * 60 * 1000;
  if (pattern === "weekly") return ts + 7 * 24 * 60 * 60 * 1000;
  if (pattern === "biweekly") return ts + 14 * 24 * 60 * 60 * 1000;

  // monthly
  const d = new Date(ts);
  const month = d.getUTCMonth();
  const year = d.getUTCFullYear();
  const currentDay = d.getUTCDate();
  const targetDayOfMonth = anchorDay ?? currentDay;

  // Dernier jour du mois cible (mois + 1)
  const lastOfNextMonth = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  const finalDay = Math.min(targetDayOfMonth, lastOfNextMonth);

  return Date.UTC(
    d.getUTCFullYear(),
    month + 1,
    finalDay,
    d.getUTCHours(),
    d.getUTCMinutes(),
    0,
    0,
  );
}

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users">,
  bookingId?: Id<"serviceBookings">,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId,
    bookingId,
    type: event,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// CRÉATION
// ────────────────────────────────────────────────────────────────

export const createRecurringBooking = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    pattern: RECURRENCE_PATTERN,
    dayOfWeek: v.optional(v.number()),
    timeSlot: v.string(),
    message: v.string(),
    startDate: v.string(),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await requireProvider(ctx, args.providerId);

    if (provider.status !== "active") {
      throw new ConvexError({
        code: "PROVIDER_NOT_ACTIVE",
        message: "Ce prestataire n'accepte pas de réservations actuellement.",
      });
    }
    if (provider.userId === user._id) {
      throw new ConvexError({
        code: "SELF_BOOKING",
        message:
          "Vous ne pouvez pas planifier une récurrence sur votre propre profil.",
      });
    }

    validatePatternDayOfWeek(args.pattern, args.dayOfWeek);
    const timeSlot = validateTimeSlot(args.timeSlot);
    const message = validateMessage(args.message);

    // Cohérence date ↔ dayOfWeek (weekly/biweekly)
    assertDateMatchesDayOfWeek(args.startDate, args.dayOfWeek);

    const nextOccurrence = validateNextOccurrence(
      composeOccurrence(args.startDate, timeSlot),
    );
    validateEndsAt(args.endsAt, nextOccurrence);

    const anchorDayOfMonth = parseUTCDate(args.startDate).d;

    const existing = await ctx.db
      .query("serviceRecurringBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const activeCount = existing.filter((r) => r.active).length;
    if (activeCount >= MAX_ACTIVE_PER_USER) {
      throw new ConvexError({
        code: "TOO_MANY_RECURRING",
        message: `Maximum ${MAX_ACTIVE_PER_USER} récurrences actives.`,
      });
    }

    const now = Date.now();
    const recurringId = await ctx.db.insert("serviceRecurringBookings", {
      providerId: args.providerId,
      userId: user._id,
      pattern: args.pattern,
      dayOfWeek: args.dayOfWeek,
      timeSlot,
      message,
      active: true,
      nextOccurrence,
      endsAt: args.endsAt,
      anchorDayOfMonth,
      createdAt: now,
    });

    await logHistory(ctx, args.providerId, "recurring.created", user._id);

    return { recurringId, nextOccurrence, anchorDayOfMonth };
  },
});

// ────────────────────────────────────────────────────────────────
// MISE À JOUR
// ────────────────────────────────────────────────────────────────

export const updateRecurringBooking = mutation({
  args: {
    recurringId: v.id("serviceRecurringBookings"),
    pattern: v.optional(RECURRENCE_PATTERN),
    dayOfWeek: v.optional(v.number()),
    timeSlot: v.optional(v.string()),
    message: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const recurring = await ctx.db.get(args.recurringId);
    if (!recurring) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Récurrence introuvable",
      });
    }
    if (recurring.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le client peut modifier sa récurrence.",
      });
    }

    const finalPattern = args.pattern ?? recurring.pattern;
    const finalDayOfWeek =
      args.dayOfWeek !== undefined ? args.dayOfWeek : recurring.dayOfWeek;
    const finalTimeSlot =
      args.timeSlot !== undefined
        ? validateTimeSlot(args.timeSlot)
        : recurring.timeSlot;

    validatePatternDayOfWeek(finalPattern, finalDayOfWeek);

    // Recalcule nextOccurrence + anchor si startDate ou timeSlot change
    let finalNextOccurrence = recurring.nextOccurrence;
    let finalAnchor = recurring.anchorDayOfMonth ?? null;

    if (args.startDate !== undefined || args.timeSlot !== undefined) {
      const dateStr =
        args.startDate ??
        new Date(recurring.nextOccurrence).toISOString().slice(0, 10);

      assertDateMatchesDayOfWeek(dateStr, finalDayOfWeek);

      finalNextOccurrence = validateNextOccurrence(
        composeOccurrence(dateStr, finalTimeSlot),
      );
      finalAnchor = parseUTCDate(dateStr).d;
    } else {
      // Aucun changement de startDate/timeSlot :
      // si dayOfWeek OU pattern a changé, on valide contre la date courante.
      const finalNeedsCheck =
        args.dayOfWeek !== undefined || args.pattern !== undefined;

      if (finalNeedsCheck) {
        const currentDateStr = new Date(recurring.nextOccurrence)
          .toISOString()
          .slice(0, 10);
        assertDateMatchesDayOfWeek(currentDateStr, finalDayOfWeek);
      }

      // Initialise l'anchor si absent (legacy)
      if (
        finalPattern === "monthly" &&
        recurring.anchorDayOfMonth === undefined
      ) {
        finalAnchor = new Date(recurring.nextOccurrence).getUTCDate();
      }
    }

    const finalEndsAt =
      args.endsAt !== undefined ? args.endsAt : recurring.endsAt;
    validateEndsAt(finalEndsAt, finalNextOccurrence);

    const patch: Partial<Doc<"serviceRecurringBookings">> = {};

    if (args.pattern !== undefined) patch.pattern = finalPattern;
    if (args.dayOfWeek !== undefined) patch.dayOfWeek = finalDayOfWeek;
    if (args.timeSlot !== undefined) patch.timeSlot = finalTimeSlot;
    if (args.message !== undefined)
      patch.message = validateMessage(args.message);
    if (finalNextOccurrence !== recurring.nextOccurrence) {
      patch.nextOccurrence = finalNextOccurrence;
    }
    if (args.endsAt !== undefined) patch.endsAt = args.endsAt;
    if (finalAnchor !== null && finalAnchor !== recurring.anchorDayOfMonth) {
      patch.anchorDayOfMonth = finalAnchor;
    }

    await ctx.db.patch(args.recurringId, patch);

    return {
      success: true,
      nextOccurrence: finalNextOccurrence,
      anchorDayOfMonth: finalAnchor,
    };
  },
});

// ────────────────────────────────────────────────────────────────
// CYCLE DE VIE
// ────────────────────────────────────────────────────────────────

export const pauseRecurringBooking = mutation({
  args: { recurringId: v.id("serviceRecurringBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const recurring = await ctx.db.get(args.recurringId);
    if (!recurring) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Récurrence introuvable",
      });
    }
    if (recurring.userId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }
    if (!recurring.active) {
      return { success: true, active: false, alreadyPaused: true };
    }

    await ctx.db.patch(args.recurringId, { active: false });
    await logHistory(ctx, recurring.providerId, "recurring.paused", user._id);

    return { success: true, active: false };
  },
});

export const resumeRecurringBooking = mutation({
  args: { recurringId: v.id("serviceRecurringBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const recurring = await ctx.db.get(args.recurringId);
    if (!recurring) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Récurrence introuvable",
      });
    }
    if (recurring.userId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }
    if (recurring.active) {
      return { success: true, active: true, alreadyActive: true };
    }

    if (
      recurring.endsAt !== undefined &&
      recurring.nextOccurrence >= recurring.endsAt
    ) {
      throw new ConvexError({
        code: "RECURRING_ENDED",
        message:
          "La date de fin est atteinte. Modifiez endsAt ou nextOccurrence avant de reprendre.",
      });
    }

    if (recurring.nextOccurrence <= Date.now()) {
      throw new ConvexError({
        code: "STALE_OCCURRENCE",
        message:
          "La prochaine occurrence est dans le passé. Modifiez-la avant de reprendre.",
      });
    }

    await ctx.db.patch(args.recurringId, { active: true });
    await logHistory(ctx, recurring.providerId, "recurring.resumed", user._id);

    return { success: true, active: true };
  },
});

export const deleteRecurringBooking = mutation({
  args: { recurringId: v.id("serviceRecurringBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const recurring = await ctx.db.get(args.recurringId);
    if (!recurring) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Récurrence introuvable",
      });
    }
    if (recurring.userId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    await ctx.db.delete(args.recurringId);
    await logHistory(ctx, recurring.providerId, "recurring.deleted", user._id);

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// POLITIQUE DE RATTRAPAGE
// ────────────────────────────────────────────────────────────────
//
// Si une occurrence est manquée depuis plus de GRACE_MS, on ne crée
// PAS de booking rétroactif. On avance nextOccurrence jusqu'à la
// prochaine occurrence FUTURE, sans générer.
//
// Exemple : client disparaît 3 mois sur une récurrence daily.
// On ne crée pas 90 bookings. On avance au prochain jour futur.
//
// Dans la fenêtre de grâce (< GRACE_MS en retard), on génère la
// booking due normalement.

const MISSED_OCCURRENCE_GRACE_MS = 48 * 60 * 60 * 1000; // 48h

async function generateForRecurring(
  ctx: MutationCtx,
  recurring: Doc<"serviceRecurringBookings">,
  actorId: Id<"users">,
): Promise<{
  generated: boolean;
  reason?:
    | "not_due_yet"
    | "ended"
    | "provider_inactive"
    | "inactive"
    | "skipped_missed";
  bookingId?: Id<"serviceBookings">;
  nextOccurrence: number;
  active: boolean;
  skippedCount?: number;
}> {
  if (!recurring.active) {
    return {
      generated: false,
      reason: "inactive",
      nextOccurrence: recurring.nextOccurrence,
      active: false,
    };
  }

  const now = Date.now();

  if (recurring.nextOccurrence > now) {
    return {
      generated: false,
      reason: "not_due_yet",
      nextOccurrence: recurring.nextOccurrence,
      active: recurring.active,
    };
  }

  // Fin de récurrence déjà atteinte
  if (
    recurring.endsAt !== undefined &&
    recurring.nextOccurrence >= recurring.endsAt
  ) {
    await ctx.db.patch(recurring._id, { active: false });
    await logHistory(ctx, recurring.providerId, "recurring.ended", actorId);
    return {
      generated: false,
      reason: "ended",
      nextOccurrence: recurring.nextOccurrence,
      active: false,
    };
  }

  const provider = await ctx.db.get(recurring.providerId);
  if (!provider || provider.status !== "active") {
    return {
      generated: false,
      reason: "provider_inactive",
      nextOccurrence: recurring.nextOccurrence,
      active: recurring.active,
    };
  }

  // ── Politique de rattrapage : skip si trop en retard
  const latenessMs = now - recurring.nextOccurrence;
  let scheduledOccurrence = recurring.nextOccurrence;

  if (latenessMs > MISSED_OCCURRENCE_GRACE_MS) {
    // Avance nextOccurrence jusqu'à la première occurrence future,
    // sans générer de booking pour les occurrences manquées.
    let cursor = recurring.nextOccurrence;
    let skipped = 0;
    const MAX_SKIP = 500; // borne de sécurité (daily sur ~1 an et demi)

    while (cursor <= now && skipped < MAX_SKIP) {
      const next = advance(
        cursor,
        recurring.pattern,
        recurring.anchorDayOfMonth ?? null,
      );
      if (next === cursor) break; // garde-fou anti-boucle
      cursor = next;
      skipped++;

      if (recurring.endsAt !== undefined && cursor >= recurring.endsAt) {
        await ctx.db.patch(recurring._id, {
          nextOccurrence: cursor,
          active: false,
        });
        await logHistory(ctx, recurring.providerId, "recurring.ended", actorId);
        return {
          generated: false,
          reason: "ended",
          nextOccurrence: cursor,
          active: false,
          skippedCount: skipped,
        };
      }
    }

    if (skipped >= MAX_SKIP) {
      // Trop d'occurrences manquées : on désactive plutôt que boucler.
      await ctx.db.patch(recurring._id, {
        active: false,
        nextOccurrence: cursor,
      });
      await logHistory(
        ctx,
        recurring.providerId,
        "recurring.abandoned",
        actorId,
      );
      return {
        generated: false,
        reason: "skipped_missed",
        nextOccurrence: cursor,
        active: false,
        skippedCount: skipped,
      };
    }

    // cursor > now : nouvelle date valide, pas de booking pour le skip
    await ctx.db.patch(recurring._id, {
      nextOccurrence: cursor,
      lastCreatedAt: now,
    });
    await logHistory(
      ctx,
      recurring.providerId,
      "recurring.skipped_missed",
      actorId,
    );

    return {
      generated: false,
      reason: "skipped_missed",
      nextOccurrence: cursor,
      active: true,
      skippedCount: skipped,
    };
  }

  // ── Fenêtre de grâce : on génère normalement
  const scheduledAt = new Date(scheduledOccurrence).toISOString();

  const bookingId = await ctx.db.insert("serviceBookings", {
    providerId: recurring.providerId,
    userId: recurring.userId,
    message: recurring.message,
    status: "pending",
    scheduledAt,
    createdAt: now,
  });

  const next = advance(
    recurring.nextOccurrence,
    recurring.pattern,
    recurring.anchorDayOfMonth ?? null,
  );
  const newActive =
    recurring.endsAt === undefined ? true : next < recurring.endsAt;

  await ctx.db.patch(recurring._id, {
    lastCreatedAt: now,
    nextOccurrence: next,
    active: newActive,
  });

  await logHistory(
    ctx,
    recurring.providerId,
    "recurring.generated",
    actorId,
    bookingId,
  );

  return {
    generated: true,
    bookingId,
    nextOccurrence: next,
    active: newActive,
  };
}

// ────────────────────────────────────────────────────────────────
// GÉNÉRATION — client (self-only, idempotent)
// ────────────────────────────────────────────────────────────────

export const generateNextBooking = mutation({
  args: { recurringId: v.id("serviceRecurringBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const recurring = await ctx.db.get(args.recurringId);
    if (!recurring) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Récurrence introuvable",
      });
    }
    if (recurring.userId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    return generateForRecurring(ctx, recurring, user._id);
  },
});

// ────────────────────────────────────────────────────────────────
// GÉNÉRATION AUTOMATIQUE — worker / cron (admin)
// ────────────────────────────────────────────────────────────────
//
// Utilise l'index composite by_active_and_next → plus de starvation.
// Idempotent : chaque appel avance nextOccurrence ou désactive la récurrence.

export const processDueRecurrings = mutation({
  args: {
    maxBatch: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const maxBatch = clampLimit(args.maxBatch, 50);

    const now = Date.now();

    // Index composite : active=true AND nextOccurrence <= now
    const dueActive = await ctx.db
      .query("serviceRecurringBookings")
      .withIndex("by_active_and_next", (q) =>
        q.eq("active", true).lte("nextOccurrence", now),
      )
      .take(maxBatch);

    let generated = 0;
    let ended = 0;
    let skipped = 0;
    const results: Array<{
      recurringId: Id<"serviceRecurringBookings">;
      generated: boolean;
      reason?: string;
    }> = [];

    for (const recurring of dueActive) {
      const res = await generateForRecurring(ctx, recurring, admin._id);
      results.push({
        recurringId: recurring._id,
        generated: res.generated,
        reason: res.reason,
      });
      if (res.generated) generated++;
      else if (res.reason === "ended") ended++;
      else skipped++;
    }

    return {
      processed: dueActive.length,
      generated,
      ended,
      skipped,
      results,
    };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — CLIENT
// ────────────────────────────────────────────────────────────────

export const listMyRecurringBookings = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    const recurrings = await ctx.db
      .query("serviceRecurringBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    const filtered =
      args.includeInactive === true
        ? recurrings
        : recurrings.filter((r) => r.active);

    return Promise.all(
      filtered.map(async (r) => {
        const provider = await ctx.db.get(r.providerId);
        return { ...r, provider };
      }),
    );
  },
});

export const getRecurringBookingById = query({
  args: { recurringId: v.id("serviceRecurringBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const recurring = await ctx.db.get(args.recurringId);
    if (!recurring) return null;

    const provider = await ctx.db.get(recurring.providerId);
    if (!provider) return null;

    const isOwner = recurring.userId === user._id;
    const isProvider = provider.userId === user._id;
    const isAdmin = user.isAdmin === true || user.roles?.includes("admin");

    if (!isOwner && !isProvider && !isAdmin) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    return { ...recurring, provider };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PRESTATAIRE
// ────────────────────────────────────────────────────────────────

export const listProviderRecurringBookings = query({
  args: {
    providerId: v.id("serviceProviders"),
    includeInactive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await requireProvider(ctx, args.providerId);
    if (provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas le propriétaire de ce profil.",
      });
    }

    const limit = clampLimit(args.limit, 50);

    const recurrings = await ctx.db
      .query("serviceRecurringBookings")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .take(limit);

    const filtered =
      args.includeInactive === true
        ? recurrings
        : recurrings.filter((r) => r.active);

    return Promise.all(
      filtered.map(async (r) => {
        const client = await ctx.db.get(r.userId);
        return { ...r, client };
      }),
    );
  },
});
