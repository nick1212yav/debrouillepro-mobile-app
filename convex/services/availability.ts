// convex/services/availability.ts
//
// Backend Services V1 — disponibilité.
//
// Comble un trou fonctionnel critique :
// jusqu'ici, serviceAvailability était lue par le frontend mais JAMAIS écrite.
//
// Portée :
//   - CRUD complet sur serviceAvailability (créneaux par date)
//   - exceptions (congés, jours fériés)
//   - lecture par jour / par plage de dates
//   - validation stricte (dates calendaires réelles, créneaux ordonnés,
//     chevauchements interdits)

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { isPubliclyVisible } from "./_shared";

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
// VALIDATION — dates calendaires réelles
// ────────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Valide une date ISO 8601 ET son existence calendaire réelle.
 * Rejette 2026-02-30, 2026-99-99, 2026-13-01, etc.
 */
function assertDate(date: string): string {
  if (!DATE_RE.test(date)) {
    throw new ConvexError({
      code: "INVALID_DATE",
      message: "La date doit être au format YYYY-MM-DD.",
    });
  }
  const [y, m, d] = date.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));

  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new ConvexError({
      code: "INVALID_DATE",
      message: `La date "${date}" n'existe pas dans le calendrier.`,
    });
  }
  return date;
}

function assertTime(time: string, label: string): string {
  if (!TIME_RE.test(time)) {
    throw new ConvexError({
      code: "INVALID_TIME",
      message: `${label} doit être au format HH:MM (24h).`,
    });
  }
  return time;
}

function assertRange(from: string | undefined, to: string | undefined): void {
  if (from !== undefined) assertDate(from);
  if (to !== undefined) assertDate(to);
  if (from !== undefined && to !== undefined && from > to) {
    throw new ConvexError({
      code: "INVALID_RANGE",
      message: "fromDate ne peut pas être supérieur à toDate.",
    });
  }
}

type Slot = { start: string; end: string };

function validateSlots(slots: Slot[]): Slot[] {
  if (slots.length === 0) {
    throw new ConvexError({
      code: "INVALID_SLOTS",
      message: "Au moins un créneau doit être fourni.",
    });
  }
  if (slots.length > 50) {
    throw new ConvexError({
      code: "INVALID_SLOTS",
      message: "Maximum 50 créneaux par jour.",
    });
  }

  const validated: Slot[] = slots.map((s) => ({
    start: assertTime(s.start, "start"),
    end: assertTime(s.end, "end"),
  }));

  for (const s of validated) {
    if (s.start >= s.end) {
      throw new ConvexError({
        code: "INVALID_SLOT_RANGE",
        message: `Le créneau ${s.start}-${s.end} est invalide (start doit être avant end).`,
      });
    }
  }

  validated.sort((a, b) => a.start.localeCompare(b.start));

  for (let i = 1; i < validated.length; i++) {
    const prev = validated[i - 1];
    const curr = validated[i];
    if (curr.start < prev.end) {
      throw new ConvexError({
        code: "OVERLAPPING_SLOTS",
        message: `Les créneaux ${prev.start}-${prev.end} et ${curr.start}-${curr.end} se chevauchent.`,
      });
    }
  }

  return validated;
}

// ────────────────────────────────────────────────────────────────
// ÉCRITURE — CRÉNEAUX PAR DATE
// ────────────────────────────────────────────────────────────────

export const setAvailability = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    date: v.string(),
    slots: v.array(v.object({ start: v.string(), end: v.string() })),
    timezone: v.optional(v.string()),
    slotDurationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);

    const date = assertDate(args.date);
    const slots = validateSlots(args.slots);

    if (
      args.slotDurationMinutes !== undefined &&
      (args.slotDurationMinutes < 5 || args.slotDurationMinutes > 480)
    ) {
      throw new ConvexError({
        code: "INVALID_DURATION",
        message: "La durée d'un créneau doit être entre 5 et 480 minutes.",
      });
    }

    const existing = await ctx.db
      .query("serviceAvailability")
      .withIndex("by_provider_and_date", (q) =>
        q.eq("providerId", args.providerId).eq("date", date),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        slots,
        timezone: args.timezone ?? existing.timezone,
        slotDurationMinutes:
          args.slotDurationMinutes ?? existing.slotDurationMinutes,
        blocked: false,
      });
      return { availabilityId: existing._id, created: false };
    }

    const availabilityId = await ctx.db.insert("serviceAvailability", {
      providerId: args.providerId,
      date,
      slots,
      timezone: args.timezone,
      slotDurationMinutes: args.slotDurationMinutes,
      blocked: false,
      isRecurring: false,
    });

    return { availabilityId, created: true };
  },
});

export const deleteAvailability = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);
    const date = assertDate(args.date);

    const existing = await ctx.db
      .query("serviceAvailability")
      .withIndex("by_provider_and_date", (q) =>
        q.eq("providerId", args.providerId).eq("date", date),
      )
      .unique();

    if (!existing) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Aucune disponibilité pour cette date.",
      });
    }

    await ctx.db.delete(existing._id);
    return { success: true };
  },
});

export const blockDay = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    date: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);
    const date = assertDate(args.date);

    const existing = await ctx.db
      .query("serviceAvailability")
      .withIndex("by_provider_and_date", (q) =>
        q.eq("providerId", args.providerId).eq("date", date),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { blocked: true, slots: [] });
      return { availabilityId: existing._id, blocked: true };
    }

    const availabilityId = await ctx.db.insert("serviceAvailability", {
      providerId: args.providerId,
      date,
      slots: [],
      blocked: true,
      isRecurring: false,
    });

    return { availabilityId, blocked: true };
  },
});

// ────────────────────────────────────────────────────────────────
// EXCEPTIONS
// ────────────────────────────────────────────────────────────────

export const addException = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    date: v.string(),
    reason: v.optional(v.string()),
    allDay: v.boolean(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);
    const date = assertDate(args.date);

    if (!args.allDay) {
      if (!args.startTime || !args.endTime) {
        throw new ConvexError({
          code: "INVALID_EXCEPTION",
          message: "startTime et endTime sont requis si allDay est false.",
        });
      }
      assertTime(args.startTime, "startTime");
      assertTime(args.endTime, "endTime");
      if (args.startTime >= args.endTime) {
        throw new ConvexError({
          code: "INVALID_EXCEPTION_RANGE",
          message: "startTime doit être avant endTime.",
        });
      }
    }

    const exceptionId = await ctx.db.insert("serviceAvailabilityExceptions", {
      providerId: args.providerId,
      date,
      reason: args.reason,
      allDay: args.allDay,
      startTime: args.allDay ? undefined : args.startTime,
      endTime: args.allDay ? undefined : args.endTime,
    });

    return { exceptionId };
  },
});

export const removeException = mutation({
  args: { exceptionId: v.id("serviceAvailabilityExceptions") },
  handler: async (ctx, args) => {
    const exception = await ctx.db.get(args.exceptionId);
    if (!exception) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Exception introuvable.",
      });
    }
    await requireOwnedProvider(ctx, exception.providerId);
    await ctx.db.delete(args.exceptionId);
    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PUBLIC
// ────────────────────────────────────────────────────────────────

export const getAvailability = query({
  args: {
    providerId: v.id("serviceProviders"),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
    allowDemo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return [];
    if (!isPubliclyVisible(provider, args.allowDemo === true)) return [];

    assertRange(args.fromDate, args.toDate);

    if (!args.fromDate && !args.toDate) {
      return ctx.db
        .query("serviceAvailability")
        .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
        .collect();
    }

    const from = args.fromDate ?? "0000-00-00";
    const to = args.toDate ?? "9999-99-99";

    const results = await ctx.db
      .query("serviceAvailability")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    return results.filter((a) => a.date >= from && a.date <= to);
  },
});

export const getExceptions = query({
  args: {
    providerId: v.id("serviceProviders"),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
    allowDemo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return [];
    if (!isPubliclyVisible(provider, args.allowDemo === true)) return [];

    assertRange(args.fromDate, args.toDate);

    const all = await ctx.db
      .query("serviceAvailabilityExceptions")
      .withIndex("by_provider_and_date", (q) =>
        q.eq("providerId", args.providerId),
      )
      .collect();

    if (!args.fromDate && !args.toDate) return all;

    const from = args.fromDate ?? "0000-00-00";
    const to = args.toDate ?? "9999-99-99";

    return all.filter((e) => e.date >= from && e.date <= to);
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PROPRIÉTAIRE (vue complète)
// ────────────────────────────────────────────────────────────────

export const getMyAvailability = query({
  args: {
    providerId: v.id("serviceProviders"),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);
    assertRange(args.fromDate, args.toDate);

    const from = args.fromDate ?? "0000-00-00";
    const to = args.toDate ?? "9999-99-99";

    const [availabilityAll, exceptionsAll] = await Promise.all([
      ctx.db
        .query("serviceAvailability")
        .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
        .collect(),
      ctx.db
        .query("serviceAvailabilityExceptions")
        .withIndex("by_provider_and_date", (q) =>
          q.eq("providerId", args.providerId),
        )
        .collect(),
    ]);

    return {
      availability: availabilityAll.filter(
        (a) => a.date >= from && a.date <= to,
      ),
      exceptions: exceptionsAll.filter((e) => e.date >= from && e.date <= to),
    };
  },
});
