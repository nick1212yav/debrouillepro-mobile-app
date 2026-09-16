// convex/events.ts

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

type EventStatus = "upcoming" | "ongoing" | "past" | "cancelled";

type EventCategory =
  | "culturel"
  | "sportif"
  | "religieux"
  | "professionnel"
  | "communautaire"
  | "formation"
  | "festival"
  | "autre";

type RSVPStatus = "attending" | "interested" | "not_going";

type EventCommentView = {
  _id: Id<"eventComments">;
  _creationTime: number;
  eventId: Id<"events">;
  authorId: Id<"users">;
  text: string;
  parentId?: Id<"eventComments">;
  likeCount: number;
  authorName: string;
  authorAvatar?: string;
  likedByMe: boolean;
  isMine: boolean;
  replies: EventCommentView[];
};

// ============================================================================
// AUTH
// ============================================================================

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  }

  return user;
}

async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

// ============================================================================
// VALIDATION
// ============================================================================

function assertNonEmpty(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new ConvexError({
      message: `${field} est obligatoire`,
      code: "INVALID_ARGUMENT",
    });
  }

  return normalized;
}

function validateDates(startDate: string, endDate?: string) {
  const start = new Date(startDate);

  if (Number.isNaN(start.getTime())) {
    throw new ConvexError({
      message: "Date de début invalide",
      code: "INVALID_ARGUMENT",
    });
  }

  if (endDate !== undefined) {
    const end = new Date(endDate);

    if (Number.isNaN(end.getTime())) {
      throw new ConvexError({
        message: "Date de fin invalide",
        code: "INVALID_ARGUMENT",
      });
    }

    if (end.getTime() < start.getTime()) {
      throw new ConvexError({
        message: "La date de fin doit être postérieure à la date de début",
        code: "INVALID_ARGUMENT",
      });
    }
  }
}

function computeEventStatus(startDate: string, endDate?: string): EventStatus {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : start;

  if (Number.isNaN(start)) {
    return "upcoming";
  }

  if (now < start) {
    return "upcoming";
  }

  if (now <= end) {
    return "ongoing";
  }

  return "past";
}

// ============================================================================
// STORAGE / IMAGES
// ============================================================================

async function resolveStorageAsset(
  ctx: QueryCtx,
  value: string | undefined,
): Promise<string | undefined> {
  if (!value) {
    return undefined;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image")
  ) {
    return value;
  }

  try {
    return (await ctx.storage.getUrl(value as Id<"_storage">)) ?? undefined;
  } catch {
    return undefined;
  }
}

async function resolveAssetList(
  ctx: QueryCtx,
  values: string[] | undefined,
): Promise<string[]> {
  if (!values || values.length === 0) {
    return [];
  }

  const resolved = await Promise.all(
    values.map((value) => resolveStorageAsset(ctx, value)),
  );

  return resolved.filter((value): value is string => value !== undefined);
}

// ============================================================================
// LIST EVENTS
// ============================================================================

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("upcoming"),
        v.literal("ongoing"),
        v.literal("past"),
        v.literal("cancelled"),
      ),
    ),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const requestedLimit = args.limit ?? 50;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    let events = await ctx.db
      .query("events")
      .withIndex("by_startDate")
      .order("asc")
      .take(100);

    if (args.status) {
      events = events.filter((event) => event.status === args.status);
    }

    if (args.category) {
      events = events.filter((event) => event.category === args.category);
    }

    events = events.slice(0, limit);

    return await Promise.all(
      events.map(async (event) => {
        const author = await ctx.db.get(event.authorId);

        const rsvps = await ctx.db
          .query("eventRsvps")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .take(500);

        const coverImage = await resolveStorageAsset(ctx, event.coverImage);

        const attendingCount = rsvps.filter(
          (rsvp) => rsvp.status === "attending",
        ).length;

        const interestedCount = rsvps.filter(
          (rsvp) => rsvp.status === "interested",
        ).length;

        const likes = await ctx.db
          .query("eventLikes")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .take(500);

        return {
          _id: event._id,
          title: event.title,
          description: event.description,
          category: event.category,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          address: event.address,
          coverImage,
          isFree: event.isFree,
          price: event.price,
          tags: event.tags,
          status: event.status,
          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,
          attendingCount,
          interestedCount,
          likeCount: likes.length,
          viewCount: event.viewCount ?? 0,
          commentCount: event.commentCount ?? 0,
          shareCount: event.shareCount ?? 0,
        };
      }),
    );
  },
});

// ============================================================================
// GET EVENT
// ============================================================================

export const get = query({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      return null;
    }

    const currentUser = await getCurrentUser(ctx);
    const author = await ctx.db.get(event.authorId);

    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(500);

    let myRsvp: RSVPStatus | null = null;

    if (currentUser) {
      const existingRsvp = await ctx.db
        .query("eventRsvps")
        .withIndex("by_event_and_user", (q) =>
          q.eq("eventId", args.eventId).eq("userId", currentUser._id),
        )
        .unique();

      myRsvp = existingRsvp?.status ?? null;
    }

    const attendingRsvps = rsvps
      .filter((rsvp) => rsvp.status === "attending")
      .slice(0, 20);

    const attendees = await Promise.all(
      attendingRsvps.map(async (rsvp) => {
        const user = await ctx.db.get(rsvp.userId);

        return {
          userId: user?._id,
          name: user?.name ?? "Anonyme",
          avatar: user?.avatar,
          status: rsvp.status,
          joinedAt: rsvp._creationTime,
        };
      }),
    );

    let likedByMe = false;
    let bookmarkedByMe = false;

    if (currentUser) {
      const like = await ctx.db
        .query("eventLikes")
        .withIndex("by_user_and_event", (q) =>
          q.eq("userId", currentUser._id).eq("eventId", args.eventId),
        )
        .unique();

      likedByMe = like !== null;

      const bookmark = await ctx.db
        .query("eventBookmarks")
        .withIndex("by_user_and_event", (q) =>
          q.eq("userId", currentUser._id).eq("eventId", args.eventId),
        )
        .unique();

      bookmarkedByMe = bookmark !== null;
    }

    const likes = await ctx.db
      .query("eventLikes")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(500);

    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(500);

    const coverImage = await resolveStorageAsset(ctx, event.coverImage);

    const gallery = await resolveAssetList(ctx, event.gallery);

    const videos = await resolveAssetList(ctx, event.videos);

    const attendingCount = rsvps.filter(
      (rsvp) => rsvp.status === "attending",
    ).length;

    const interestedCount = rsvps.filter(
      (rsvp) => rsvp.status === "interested",
    ).length;

    const notGoingCount = rsvps.filter(
      (rsvp) => rsvp.status === "not_going",
    ).length;

    return {
      ...event,

      coverImage,
      gallery,
      videos,

      authorName: author?.name ?? "Anonyme",
      authorAvatar: author?.avatar,

      attendingCount,
      interestedCount,
      notGoingCount,

      likeCount: likes.length,
      commentCount: comments.length,

      isAttending: myRsvp === "attending",
      isInterested: myRsvp === "interested",

      isMine: currentUser?._id === event.authorId,

      likedByMe,
      bookmarkedByMe,

      attendees,
      myRsvp,
    };
  },
});

// ============================================================================
// MY RSVP
// ============================================================================

export const getMyRsvp = query({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args): Promise<RSVPStatus | null> => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const rsvp = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id),
      )
      .unique();

    return rsvp?.status ?? null;
  },
});

// ============================================================================
// MY EVENTS
// ============================================================================

export const listMine = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const events = await ctx.db
      .query("events")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(100);

    return await Promise.all(
      events.map(async (event) => {
        const rsvps = await ctx.db
          .query("eventRsvps")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .take(500);

        const likes = await ctx.db
          .query("eventLikes")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .take(500);

        return {
          ...event,
          attendingCount: rsvps.filter((rsvp) => rsvp.status === "attending")
            .length,
          interestedCount: rsvps.filter((rsvp) => rsvp.status === "interested")
            .length,
          likeCount: likes.length,
          commentCount: event.commentCount ?? 0,
          viewCount: event.viewCount ?? 0,
        };
      }),
    );
  },
});

// ============================================================================
// EVENTS USER IS ATTENDING / INTERESTED IN
// ============================================================================

export const listAttending = query({
  args: {},

  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return [];
    }

    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200);

    const relevantRsvps = rsvps.filter(
      (rsvp) => rsvp.status === "attending" || rsvp.status === "interested",
    );

    const events = await Promise.all(
      relevantRsvps.map((rsvp) => ctx.db.get(rsvp.eventId)),
    );

    return events.filter(
      (event): event is NonNullable<typeof event> => event !== null,
    );
  },
});

// ============================================================================
// CREATE EVENT
// ============================================================================

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),

    category: v.union(
      v.literal("culturel"),
      v.literal("sportif"),
      v.literal("religieux"),
      v.literal("professionnel"),
      v.literal("communautaire"),
      v.literal("formation"),
      v.literal("festival"),
      v.literal("autre"),
    ),

    startDate: v.string(),
    endDate: v.optional(v.string()),

    location: v.string(),
    address: v.optional(v.string()),

    coverImage: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),

    isFree: v.boolean(),
    price: v.optional(v.string()),

    tags: v.array(v.string()),

    gallery: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const title = assertNonEmpty(args.title, "Le titre");
    const description = assertNonEmpty(args.description, "La description");
    const location = assertNonEmpty(args.location, "Le lieu");

    validateDates(args.startDate, args.endDate);

    if (args.maxAttendees !== undefined) {
      if (!Number.isInteger(args.maxAttendees) || args.maxAttendees <= 0) {
        throw new ConvexError({
          message:
            "Le nombre maximal de participants doit être supérieur à zéro",
          code: "INVALID_ARGUMENT",
        });
      }
    }

    if (!args.isFree && !args.price?.trim()) {
      throw new ConvexError({
        message: "Un prix est obligatoire pour un événement payant",
        code: "INVALID_ARGUMENT",
      });
    }

    const status = computeEventStatus(args.startDate, args.endDate);

    const eventId = await ctx.db.insert("events", {
      authorId: user._id,

      title,
      description,
      category: args.category,

      startDate: args.startDate,
      endDate: args.endDate,

      location,
      address: args.address,

      coverImage: args.coverImage,
      maxAttendees: args.maxAttendees,

      isFree: args.isFree,
      price: args.price,

      tags: args.tags,

      status,

      viewCount: 0,
      commentCount: 0,
      shareCount: 0,

      gallery: args.gallery ?? [],
      videos: args.videos ?? [],
    });

    // Publication dans le feed.
    // L'événement reste la source de vérité métier.
    await ctx.db.insert("publications", {
      authorId: user._id,
      type: "evenement",
      title,
      description,
      price: args.price,
      location,
      category: args.category,
      images: args.coverImage ? [args.coverImage] : (args.gallery ?? []),
      tags: args.tags,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      status: "active",

      meta: JSON.stringify({
        postType: "evenement",
        eventId,
        category: args.category,
        startDate: args.startDate,
        endDate: args.endDate,
        location,
        address: args.address,
        coverImage: args.coverImage,
        gallery: args.gallery ?? [],
        videos: args.videos ?? [],
        isFree: args.isFree,
        price: args.price,
        maxAttendees: args.maxAttendees,
      }),
    });

    return eventId;
  },
});

// ============================================================================
// UPDATE EVENT
// ============================================================================

export const update = mutation({
  args: {
    eventId: v.id("events"),

    title: v.optional(v.string()),
    description: v.optional(v.string()),

    category: v.optional(
      v.union(
        v.literal("culturel"),
        v.literal("sportif"),
        v.literal("religieux"),
        v.literal("professionnel"),
        v.literal("communautaire"),
        v.literal("formation"),
        v.literal("festival"),
        v.literal("autre"),
      ),
    ),

    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),

    location: v.optional(v.string()),
    address: v.optional(v.string()),

    coverImage: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),

    isFree: v.optional(v.boolean()),
    price: v.optional(v.string()),

    tags: v.optional(v.array(v.string())),
    gallery: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),

    status: v.optional(
      v.union(
        v.literal("upcoming"),
        v.literal("ongoing"),
        v.literal("past"),
        v.literal("cancelled"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    if (event.authorId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    if (args.title !== undefined && !args.title.trim()) {
      throw new ConvexError({
        message: "Le titre ne peut pas être vide",
        code: "INVALID_ARGUMENT",
      });
    }

    if (args.description !== undefined && !args.description.trim()) {
      throw new ConvexError({
        message: "La description ne peut pas être vide",
        code: "INVALID_ARGUMENT",
      });
    }

    if (args.location !== undefined && !args.location.trim()) {
      throw new ConvexError({
        message: "Le lieu ne peut pas être vide",
        code: "INVALID_ARGUMENT",
      });
    }

    const effectiveStartDate = args.startDate ?? event.startDate;

    const effectiveEndDate =
      args.endDate !== undefined ? args.endDate : event.endDate;

    validateDates(effectiveStartDate, effectiveEndDate);

    const effectiveIsFree = args.isFree ?? event.isFree;

    const effectivePrice = args.price !== undefined ? args.price : event.price;

    if (!effectiveIsFree && !effectivePrice?.trim()) {
      throw new ConvexError({
        message: "Un prix est obligatoire pour un événement payant",
        code: "INVALID_ARGUMENT",
      });
    }

    if (args.maxAttendees !== undefined) {
      if (!Number.isInteger(args.maxAttendees) || args.maxAttendees <= 0) {
        throw new ConvexError({
          message:
            "Le nombre maximal de participants doit être supérieur à zéro",
          code: "INVALID_ARGUMENT",
        });
      }
    }

    const patch: {
      title?: string;
      description?: string;
      category?: EventCategory;
      startDate?: string;
      endDate?: string;
      location?: string;
      address?: string;
      coverImage?: string;
      maxAttendees?: number;
      isFree?: boolean;
      price?: string;
      tags?: string[];
      gallery?: string[];
      videos?: string[];
      status?: EventStatus;
    } = {};

    if (args.title !== undefined) {
      patch.title = args.title.trim();
    }

    if (args.description !== undefined) {
      patch.description = args.description.trim();
    }

    if (args.category !== undefined) {
      patch.category = args.category;
    }

    if (args.startDate !== undefined) {
      patch.startDate = args.startDate;
    }

    if (args.endDate !== undefined) {
      patch.endDate = args.endDate;
    }

    if (args.location !== undefined) {
      patch.location = args.location.trim();
    }

    if (args.address !== undefined) {
      patch.address = args.address;
    }

    if (args.coverImage !== undefined) {
      patch.coverImage = args.coverImage;
    }

    if (args.maxAttendees !== undefined) {
      patch.maxAttendees = args.maxAttendees;
    }

    if (args.isFree !== undefined) {
      patch.isFree = args.isFree;
    }

    if (args.price !== undefined) {
      patch.price = args.price;
    }

    if (args.tags !== undefined) {
      patch.tags = args.tags;
    }

    if (args.gallery !== undefined) {
      patch.gallery = args.gallery;
    }

    if (args.videos !== undefined) {
      patch.videos = args.videos;
    }

    patch.status =
      args.status ?? computeEventStatus(effectiveStartDate, effectiveEndDate);

    await ctx.db.patch(args.eventId, patch);

    return {
      success: true,
      eventId: args.eventId,
    };
  },
});

// ============================================================================
// DELETE EVENT
// ============================================================================

export const remove = mutation({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    if (event.authorId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    for (const rsvp of rsvps) {
      await ctx.db.delete(rsvp._id);
    }

    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    for (const comment of comments) {
      const commentLikes = await ctx.db
        .query("eventCommentLikes")
        .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
        .take(1000);

      for (const like of commentLikes) {
        await ctx.db.delete(like._id);
      }

      await ctx.db.delete(comment._id);
    }

    const eventLikes = await ctx.db
      .query("eventLikes")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    for (const like of eventLikes) {
      await ctx.db.delete(like._id);
    }

    const bookmarks = await ctx.db
      .query("eventBookmarks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    const tickets = await ctx.db
      .query("eventTickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    for (const ticket of tickets) {
      await ctx.db.delete(ticket._id);
    }

    // Les publications utilisent actuellement meta comme JSON.
    // On ne supprime donc pas une publication par une correspondance
    // approximative qui pourrait supprimer le mauvais contenu.
    // La publication reste traçable dans le feed.

    await ctx.db.delete(args.eventId);

    return {
      success: true,
      eventId: args.eventId,
    };
  },
});

// ============================================================================
// RSVP
// ============================================================================

export const rsvp = mutation({
  args: {
    eventId: v.id("events"),

    status: v.union(
      v.literal("attending"),
      v.literal("interested"),
      v.literal("not_going"),
    ),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    if (event.status === "cancelled") {
      throw new ConvexError({
        message: "Impossible de participer à un événement annulé",
        code: "EVENT_CANCELLED",
      });
    }

    const existing = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id),
      )
      .unique();

    if (existing) {
      if (existing.status === args.status) {
        await ctx.db.delete(existing._id);

        return {
          status: null,
        };
      }

      if (args.status === "attending" && event.maxAttendees !== undefined) {
        const attending = await ctx.db
          .query("eventRsvps")
          .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
          .take(1000);

        const attendingCount = attending.filter(
          (rsvp) => rsvp.status === "attending",
        ).length;

        if (attendingCount >= event.maxAttendees) {
          throw new ConvexError({
            message: "Plus de places disponibles",
            code: "FULL",
          });
        }
      }

      await ctx.db.patch(existing._id, {
        status: args.status,
      });

      return {
        status: args.status,
      };
    }

    if (args.status === "attending" && event.maxAttendees !== undefined) {
      const attending = await ctx.db
        .query("eventRsvps")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .take(1000);

      const attendingCount = attending.filter(
        (rsvp) => rsvp.status === "attending",
      ).length;

      if (attendingCount >= event.maxAttendees) {
        throw new ConvexError({
          message: "Plus de places disponibles",
          code: "FULL",
        });
      }
    }

    await ctx.db.insert("eventRsvps", {
      eventId: args.eventId,
      userId: user._id,
      status: args.status,
    });

    return {
      status: args.status,
    };
  },
});

// ============================================================================
// TRACK VIEW
// ============================================================================

export const trackView = mutation({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      return {
        success: false,
      };
    }

    await ctx.db.patch(args.eventId, {
      viewCount: (event.viewCount ?? 0) + 1,
    });

    return {
      success: true,
    };
  },
});

// ============================================================================
// LIKE / UNLIKE EVENT
// ============================================================================

export const like = mutation({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    const existing = await ctx.db
      .query("eventLikes")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      return {
        liked: false,
      };
    }

    await ctx.db.insert("eventLikes", {
      userId: user._id,
      eventId: args.eventId,
    });

    return {
      liked: true,
    };
  },
});

// ============================================================================
// BOOKMARK / UNBOOKMARK EVENT
// ============================================================================

export const bookmark = mutation({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    const existing = await ctx.db
      .query("eventBookmarks")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      return {
        bookmarked: false,
      };
    }

    await ctx.db.insert("eventBookmarks", {
      userId: user._id,
      eventId: args.eventId,
    });

    return {
      bookmarked: true,
    };
  },
});

// ============================================================================
// COMMENTS
// ============================================================================

export const listComments = query({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args): Promise<EventCommentView[]> => {
    const currentUser = await getCurrentUser(ctx);

    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("asc")
      .take(500);

    const enriched: EventCommentView[] = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);

        let likedByMe = false;

        if (currentUser) {
          const like = await ctx.db
            .query("eventCommentLikes")
            .withIndex("by_user_and_comment", (q) =>
              q.eq("userId", currentUser._id).eq("commentId", comment._id),
            )
            .unique();

          likedByMe = like !== null;
        }

        return {
          _id: comment._id,
          _creationTime: comment._creationTime,
          eventId: comment.eventId,
          authorId: comment.authorId,
          text: comment.text,
          parentId: comment.parentId,
          likeCount: comment.likeCount,

          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,

          likedByMe,
          isMine: currentUser?._id === comment.authorId,

          replies: [],
        };
      }),
    );

    const commentMap = new Map<Id<"eventComments">, EventCommentView>();

    for (const comment of enriched) {
      commentMap.set(comment._id, comment);
    }

    const topLevel: EventCommentView[] = [];

    for (const comment of enriched) {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);

        if (parent) {
          parent.replies.push(comment);
        } else {
          topLevel.push(comment);
        }
      } else {
        topLevel.push(comment);
      }
    }

    return topLevel;
  },
});

// ============================================================================
// ADD COMMENT
// ============================================================================

export const addComment = mutation({
  args: {
    eventId: v.id("events"),
    text: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    const text = args.text.trim();

    if (!text) {
      throw new ConvexError({
        message: "Le commentaire ne peut pas être vide",
        code: "INVALID_ARGUMENT",
      });
    }

    if (text.length > 5000) {
      throw new ConvexError({
        message: "Le commentaire ne peut pas dépasser 5000 caractères",
        code: "INVALID_ARGUMENT",
      });
    }

    const commentId = await ctx.db.insert("eventComments", {
      eventId: args.eventId,
      authorId: user._id,
      text,
      likeCount: 0,
    });

    await ctx.db.patch(args.eventId, {
      commentCount: (event.commentCount ?? 0) + 1,
    });

    return await ctx.db.get(commentId);
  },
});

// ============================================================================
// ADD REPLY
// ============================================================================

export const addReply = mutation({
  args: {
    eventId: v.id("events"),
    parentId: v.id("eventComments"),
    text: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    const parent = await ctx.db.get(args.parentId);

    if (!parent) {
      throw new ConvexError({
        message: "Commentaire parent introuvable",
        code: "NOT_FOUND",
      });
    }

    if (parent.eventId !== args.eventId) {
      throw new ConvexError({
        message: "Le commentaire parent appartient à un autre événement",
        code: "INVALID_ARGUMENT",
      });
    }

    const text = args.text.trim();

    if (!text) {
      throw new ConvexError({
        message: "La réponse ne peut pas être vide",
        code: "INVALID_ARGUMENT",
      });
    }

    if (text.length > 5000) {
      throw new ConvexError({
        message: "La réponse ne peut pas dépasser 5000 caractères",
        code: "INVALID_ARGUMENT",
      });
    }

    const commentId = await ctx.db.insert("eventComments", {
      eventId: args.eventId,
      authorId: user._id,
      parentId: args.parentId,
      text,
      likeCount: 0,
    });

    await ctx.db.patch(args.eventId, {
      commentCount: (event.commentCount ?? 0) + 1,
    });

    return await ctx.db.get(commentId);
  },
});

// ============================================================================
// LIKE / UNLIKE COMMENT
// ============================================================================

export const likeComment = mutation({
  args: {
    commentId: v.id("eventComments"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new ConvexError({
        message: "Commentaire introuvable",
        code: "NOT_FOUND",
      });
    }

    const existing = await ctx.db
      .query("eventCommentLikes")
      .withIndex("by_user_and_comment", (q) =>
        q.eq("userId", user._id).eq("commentId", args.commentId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      await ctx.db.patch(args.commentId, {
        likeCount: Math.max(0, comment.likeCount - 1),
      });

      return {
        liked: false,
      };
    }

    await ctx.db.insert("eventCommentLikes", {
      userId: user._id,
      commentId: args.commentId,
    });

    await ctx.db.patch(args.commentId, {
      likeCount: comment.likeCount + 1,
    });

    return {
      liked: true,
    };
  },
});

// ============================================================================
// TICKETS — USER TICKETS
// ============================================================================

export const listTickets = query({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("eventTickets")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .take(20);
  },
});

// ============================================================================
// TICKET PURCHASE
// ============================================================================

export const purchaseTicket = mutation({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    if (event.status === "cancelled") {
      throw new ConvexError({
        message: "Impossible d'acheter un billet pour un événement annulé",
        code: "EVENT_CANCELLED",
      });
    }

    /*
     * IMPORTANT :
     * Aucun paiement réel n'est implémenté ici.
     *
     * Pour un événement payant, on refuse donc l'émission
     * du billet au lieu de prétendre qu'un paiement a réussi.
     */
    if (!event.isFree) {
      throw new ConvexError({
        message:
          "Le paiement des billets n'est pas encore connecté au système de paiement.",
        code: "PAYMENT_REQUIRED",
      });
    }

    const existing = await ctx.db
      .query("eventTickets")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .unique();

    if (existing) {
      throw new ConvexError({
        message: "Vous avez déjà un billet pour cet événement",
        code: "ALREADY_PURCHASED",
      });
    }

    if (event.maxAttendees !== undefined) {
      const attendingRsvps = await ctx.db
        .query("eventRsvps")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .take(1000);

      const attendingCount = attendingRsvps.filter(
        (rsvp) => rsvp.status === "attending",
      ).length;

      if (attendingCount >= event.maxAttendees) {
        throw new ConvexError({
          message: "Plus de places disponibles",
          code: "FULL",
        });
      }
    }

    const now = Date.now();

    const ticketNumber = `TICKET-${args.eventId}-${user._id}-${now}`;

    const qrCode = ticketNumber;

    const ticketId = await ctx.db.insert("eventTickets", {
      eventId: args.eventId,
      userId: user._id,
      ticketNumber,
      qrCode,
      status: "valid",
      purchasedAt: now,
    });

    const existingRsvp = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id),
      )
      .unique();

    if (!existingRsvp) {
      await ctx.db.insert("eventRsvps", {
        eventId: args.eventId,
        userId: user._id,
        status: "attending",
      });
    } else if (existingRsvp.status !== "attending") {
      await ctx.db.patch(existingRsvp._id, {
        status: "attending",
      });
    }

    return await ctx.db.get(ticketId);
  },
});

// ============================================================================
// VALIDATE TICKET
// ============================================================================

export const validateTicket = mutation({
  args: {
    ticketId: v.id("eventTickets"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const ticket = await ctx.db.get(args.ticketId);

    if (!ticket) {
      throw new ConvexError({
        message: "Billet introuvable",
        code: "NOT_FOUND",
      });
    }

    const event = await ctx.db.get(ticket.eventId);

    if (!event) {
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    }

    if (event.authorId !== user._id) {
      throw new ConvexError({
        message: "Seul l'organisateur peut valider les billets",
        code: "FORBIDDEN",
      });
    }

    if (ticket.status !== "valid") {
      throw new ConvexError({
        message: "Ce billet n'est pas valide",
        code: "INVALID",
      });
    }

    await ctx.db.patch(args.ticketId, {
      status: "used",
      usedAt: Date.now(),
    });

    return {
      success: true,
    };
  },
});

// ============================================================================
// ANALYTICS
// ============================================================================

export const getAnalytics = query({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      return null;
    }

    if (event.authorId !== user._id) {
      throw new ConvexError({
        message: "Seul l'organisateur peut consulter les statistiques",
        code: "FORBIDDEN",
      });
    }

    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    const tickets = await ctx.db
      .query("eventTickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    const likes = await ctx.db
      .query("eventLikes")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    const totalViews = event.viewCount ?? 0;

    const totalAttending = rsvps.filter(
      (rsvp) => rsvp.status === "attending",
    ).length;

    const totalInterested = rsvps.filter(
      (rsvp) => rsvp.status === "interested",
    ).length;

    const totalNotGoing = rsvps.filter(
      (rsvp) => rsvp.status === "not_going",
    ).length;

    const totalComments = comments.length;

    const totalTickets = tickets.length;

    const totalLikes = likes.length;

    const conversionRate =
      totalViews > 0 ? (totalAttending / totalViews) * 100 : 0;

    const startTime = new Date(event.startDate).getTime();

    const daysUntilStart = Number.isNaN(startTime)
      ? null
      : Math.max(0, Math.ceil((startTime - Date.now()) / 86_400_000));

    return {
      totalViews,
      totalAttending,
      totalInterested,
      totalNotGoing,
      totalComments,
      totalTickets,
      totalLikes,
      conversionRate,
      daysUntilStart,
    };
  },
});
