// convex/events.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

// ── Auth helper ────────────────────────────────────────────────────────────────

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  return user;
}

async function getCurrentUser(ctx: QueryCtx) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    return user;
  } catch {
    return null;
  }
}

// ── Helpers de résolution d'images ────────────────────────────────────────────

async function resolveImage(
  ctx: QueryCtx,
  file: string | null | undefined,
): Promise<string | null> {
  if (!file) return null;
  if (file.startsWith("http://") || file.startsWith("https://")) return file;
  if (file.startsWith("data:image")) return file;
  try {
    return await ctx.storage.getUrl(file as Id<"_storage">);
  } catch {
    return null;
  }
}

// ── LIST events (paginated, filterable) ─────────────────────────────────────

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
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      _id: Id<"events">;
      title: string;
      description: string;
      category: string;
      startDate: string;
      endDate?: string;
      location: string;
      coverImage?: string;
      isFree: boolean;
      price?: string;
      tags: string[];
      status: string;
      authorName: string;
      authorAvatar?: string;
      attendingCount: number;
      interestedCount: number;
    }>
  > => {
    const limit = args.limit ?? 50;
    let rows = await ctx.db
      .query("events")
      .withIndex("by_startDate")
      .order("asc")
      .take(200);

    if (args.status) rows = rows.filter((e) => e.status === args.status);
    if (args.category) rows = rows.filter((e) => e.category === args.category);

    rows = rows.slice(0, limit);

    const resolvedRows = await Promise.all(
      rows.map(async (event) => {
        const author = await ctx.db.get(event.authorId);
        const rsvps = await ctx.db
          .query("eventRsvps")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        let coverImage = event.coverImage;
        if (coverImage) {
          coverImage = (await resolveImage(ctx, coverImage)) ?? coverImage;
        }

        return {
          _id: event._id,
          title: event.title,
          description: event.description,
          category: event.category,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          coverImage,
          isFree: event.isFree,
          price: event.price,
          tags: event.tags,
          status: event.status,
          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,
          attendingCount: rsvps.filter((r) => r.status === "attending").length,
          interestedCount: rsvps.filter((r) => r.status === "interested")
            .length,
        };
      }),
    );

    return resolvedRows;
  },
});

// ── GET single event (enriched) ──────────────────────────────────────────────

export const get = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const currentUser = await getCurrentUser(ctx);
    const author = await ctx.db.get(event.authorId);

    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get current user's RSVP status
    let isAttending = false;
    let isInterested = false;
    let myRsvp: "attending" | "interested" | "not_going" | null = null;
    if (currentUser) {
      const myRsvpDoc = rsvps.find((r) => r.userId === currentUser._id);
      if (myRsvpDoc) {
        myRsvp = myRsvpDoc.status as any;
        isAttending = myRsvp === "attending";
        isInterested = myRsvp === "interested";
      }
    }

    // Get attendees (max 20)
    const attendingRsvps = rsvps
      .filter((r) => r.status === "attending")
      .slice(0, 20);
    const attendees = await Promise.all(
      attendingRsvps.map(async (r) => {
        const u = await ctx.db.get(r.userId);
        return {
          userId: u?._id,
          name: u?.name ?? "Anonyme",
          avatar: u?.avatar,
          status: r.status,
          joinedAt: r._creationTime,
        };
      }),
    );

    // Like / bookmark status
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

    // Counts
    const attendingCount = rsvps.filter((r) => r.status === "attending").length;
    const interestedCount = rsvps.filter(
      (r) => r.status === "interested",
    ).length;
    const notGoingCount = rsvps.filter((r) => r.status === "not_going").length;

    // Comments count
    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    const commentCount = comments.length;

    // ✅ RÉSOLUTION DES IMAGES ET VIDÉOS
    // Résoudre coverImage
    let coverImage = event.coverImage;
    if (coverImage) {
      coverImage = (await resolveImage(ctx, coverImage)) ?? coverImage;
    }

    // Résoudre toutes les images de la galerie
    const gallery = await Promise.all(
      (event.gallery ?? []).map(async (img: string) => {
        const resolved = await resolveImage(ctx, img);
        return resolved ?? img;
      }),
    );

    // Résoudre toutes les vidéos
    const videos = await Promise.all(
      (event.videos ?? []).map(async (video: string) => {
        const resolved = await resolveImage(ctx, video);
        return resolved ?? video;
      }),
    );

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
      commentCount,
      isAttending,
      isInterested,
      isMine: currentUser?._id === event.authorId,
      likedByMe,
      bookmarkedByMe,
      attendees,
      myRsvp,
    };
  },
});

// ── GET my RSVP for an event ──────────────────────────────────────────────────

export const getMyRsvp = query({
  args: { eventId: v.id("events") },
  handler: async (
    ctx,
    args,
  ): Promise<"attending" | "interested" | "not_going" | null> => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const rsvp = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id),
      )
      .unique();
    return rsvp?.status ?? null;
  },
});

// ── LIST my created events ────────────────────────────────────────────────────

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const events = await ctx.db
      .query("events")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();
    // Enrichir avec les compteurs
    return Promise.all(
      events.map(async (e) => {
        const rsvps = await ctx.db
          .query("eventRsvps")
          .withIndex("by_event", (q) => q.eq("eventId", e._id))
          .collect();
        return {
          ...e,
          attendingCount: rsvps.filter((r) => r.status === "attending").length,
          interestedCount: rsvps.filter((r) => r.status === "interested")
            .length,
        };
      }),
    );
  },
});

// ── LIST events I'm attending / interested in ───────────────────────────────

export const listAttending = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const eventIds = rsvps.map((r) => r.eventId);
    const events = await Promise.all(eventIds.map((id) => ctx.db.get(id)));
    return events.filter((e): e is NonNullable<typeof e> => e !== null);
  },
});

// ── CREATE event ──────────────────────────────────────────────────────────────

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
    const now = new Date().toISOString();
    const status = args.startDate > now ? "upcoming" : "ongoing";

    // 1. Créer l'événement dans la table events
    const eventId = await ctx.db.insert("events", {
      authorId: user._id,
      title: args.title,
      description: args.description,
      category: args.category,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      address: args.address,
      coverImage: args.coverImage,
      maxAttendees: args.maxAttendees,
      isFree: args.isFree,
      price: args.price,
      tags: args.tags,
      status,
      gallery: args.gallery ?? [],
      videos: args.videos ?? [],
    });

    // 2. Créer une publication associée dans publications
    const meta = {
      postType: "evenement",
      eventId,
      category: args.category,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      address: args.address,
      coverImage: args.coverImage,
      gallery: args.gallery ?? [],
      videos: args.videos ?? [],
      isFree: args.isFree,
      price: args.price,
      maxAttendees: args.maxAttendees,
    };

    await ctx.db.insert("publications", {
      authorId: user._id,
      type: "evenement",
      title: args.title,
      description: args.description,
      price: args.price,
      location: args.location,
      category: args.category,
      images: args.coverImage ? [args.coverImage] : (args.gallery ?? []),
      tags: args.tags,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      status: "active",
      meta: JSON.stringify(meta),
    });

    return eventId;
  },
});

// ── UPDATE event ──────────────────────────────────────────────────────────────

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
    if (!event)
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    if (event.authorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });

    const patch: any = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.category !== undefined) patch.category = args.category;
    if (args.startDate !== undefined) patch.startDate = args.startDate;
    if (args.endDate !== undefined) patch.endDate = args.endDate;
    if (args.location !== undefined) patch.location = args.location;
    if (args.address !== undefined) patch.address = args.address;
    if (args.coverImage !== undefined) patch.coverImage = args.coverImage;
    if (args.maxAttendees !== undefined) patch.maxAttendees = args.maxAttendees;
    if (args.isFree !== undefined) patch.isFree = args.isFree;
    if (args.price !== undefined) patch.price = args.price;
    if (args.tags !== undefined) patch.tags = args.tags;
    if (args.gallery !== undefined) patch.gallery = args.gallery;
    if (args.videos !== undefined) patch.videos = args.videos;
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(args.eventId, patch);

    // Optionnel : mettre à jour la publication associée si besoin
    // On pourrait chercher la publication liée via meta.eventId, mais on laisse pour l'instant.

    return { success: true };
  },
});

// ── DELETE event ──────────────────────────────────────────────────────────────

export const remove = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event)
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    if (event.authorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });

    // Supprimer les RSVP
    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const r of rsvps) await ctx.db.delete(r._id);

    // Supprimer les commentaires
    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);

    // Supprimer les billets
    const tickets = await ctx.db
      .query("eventTickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const t of tickets) await ctx.db.delete(t._id);

    // Supprimer les likes
    const likes = await ctx.db
      .query("eventLikes")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);

    // Supprimer les bookmarks
    const bookmarks = await ctx.db
      .query("eventBookmarks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const b of bookmarks) await ctx.db.delete(b._id);

    // Supprimer la publication associée si elle existe
    const publications = await ctx.db
      .query("publications")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "evenement"),
          q.eq(q.field("meta"), JSON.stringify({ eventId: args.eventId })),
        ),
      )
      .collect();
    // Comme le meta est un JSON string, on ne peut pas filtrer facilement.
    // On va plutôt supprimer toutes les publications qui ont un meta contenant eventId.
    // Pour simplifier, on cherche via une requête brute (moins efficace).
    // Alternative : on stocke eventId dans un champ dédié ? On peut ajouter un champ eventId dans publications plus tard.
    // Pour l'instant, on ne supprime pas automatiquement la publication, car il faudrait une recherche par meta.
    // L'utilisateur pourra supprimer manuellement la publication si nécessaire.

    await ctx.db.delete(args.eventId);
  },
});

// ── RSVP ──────────────────────────────────────────────────────────────────────

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
    if (!event)
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });

    const existing = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id),
      )
      .unique();

    if (existing) {
      // Si même statut, on peut le retirer (toggle)
      if (existing.status === args.status) {
        await ctx.db.delete(existing._id);
        return { status: null };
      } else {
        await ctx.db.patch(existing._id, { status: args.status });
      }
    } else {
      await ctx.db.insert("eventRsvps", {
        eventId: args.eventId,
        userId: user._id,
        status: args.status,
      });
    }
    return { status: args.status };
  },
});

// ── TRACK VIEW ────────────────────────────────────────────────────────────────

export const trackView = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return;
    await ctx.db.patch(args.eventId, { viewCount: (event.viewCount || 0) + 1 });
  },
});

// ── LIKE / UNLIKE event ──────────────────────────────────────────────────────

export const like = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event)
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });

    const existing = await ctx.db
      .query("eventLikes")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("eventLikes", {
        userId: user._id,
        eventId: args.eventId,
      });
      return { liked: true };
    }
  },
});

// ── BOOKMARK / UNBOOKMARK event ──────────────────────────────────────────────

export const bookmark = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event)
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });

    const existing = await ctx.db
      .query("eventBookmarks")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    } else {
      await ctx.db.insert("eventBookmarks", {
        userId: user._id,
        eventId: args.eventId,
      });
      return { bookmarked: true };
    }
  },
});

// ── COMMENTS ──────────────────────────────────────────────────────────────────

export const listComments = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("asc")
      .collect();

    const enriched = await Promise.all(
      comments.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        let likedByMe = false;
        if (currentUser) {
          const like = await ctx.db
            .query("eventCommentLikes")
            .withIndex("by_user_and_comment", (q) =>
              q.eq("userId", currentUser._id).eq("commentId", c._id),
            )
            .unique();
          likedByMe = like !== null;
        }
        return {
          ...c,
          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,
          likedByMe,
          isMine: currentUser?._id === c.authorId,
          replies: [],
        };
      }),
    );

    // Construire l'arbre (top-level uniquement)
    const commentMap = new Map<string, any>();
    const topLevel: any[] = [];
    for (const c of enriched) {
      commentMap.set(c._id, c);
    }
    for (const c of enriched) {
      if (c.parentId) {
        const parent = commentMap.get(c.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(c);
        }
      } else {
        topLevel.push(c);
      }
    }
    return topLevel;
  },
});

export const addComment = mutation({
  args: { eventId: v.id("events"), text: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event)
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });

    const commentId = await ctx.db.insert("eventComments", {
      eventId: args.eventId,
      authorId: user._id,
      text: args.text,
      likeCount: 0,
    });
    // Mettre à jour le compteur de commentaires sur l'événement
    await ctx.db.patch(args.eventId, {
      commentCount: (event.commentCount || 0) + 1,
    });
    return await ctx.db.get(commentId);
  },
});

export const addReply = mutation({
  args: {
    eventId: v.id("events"),
    parentId: v.id("eventComments"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const parent = await ctx.db.get(args.parentId);
    if (!parent)
      throw new ConvexError({
        message: "Commentaire parent introuvable",
        code: "NOT_FOUND",
      });

    const commentId = await ctx.db.insert("eventComments", {
      eventId: args.eventId,
      authorId: user._id,
      parentId: args.parentId,
      text: args.text,
      likeCount: 0,
    });
    // Incrémenter le compteur de l'événement
    const event = await ctx.db.get(args.eventId);
    if (event) {
      await ctx.db.patch(args.eventId, {
        commentCount: (event.commentCount || 0) + 1,
      });
    }
    return await ctx.db.get(commentId);
  },
});

export const likeComment = mutation({
  args: { commentId: v.id("eventComments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment)
      throw new ConvexError({
        message: "Commentaire introuvable",
        code: "NOT_FOUND",
      });

    const existing = await ctx.db
      .query("eventCommentLikes")
      .withIndex("by_user_and_comment", (q) =>
        q.eq("userId", user._id).eq("commentId", args.commentId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.commentId, {
        likeCount: Math.max(0, (comment.likeCount || 0) - 1),
      });
      return { liked: false };
    } else {
      await ctx.db.insert("eventCommentLikes", {
        userId: user._id,
        commentId: args.commentId,
      });
      await ctx.db.patch(args.commentId, {
        likeCount: (comment.likeCount || 0) + 1,
      });
      return { liked: true };
    }
  },
});

// ── TICKETS ────────────────────────────────────────────────────────────────────

export const listTickets = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const tickets = await ctx.db
      .query("eventTickets")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .collect();
    return tickets;
  },
});

export const purchaseTicket = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event)
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });

    // Vérifier la capacité si définie
    if (event.maxAttendees) {
      const existingTickets = await ctx.db
        .query("eventTickets")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();
      if (existingTickets.length >= event.maxAttendees) {
        throw new ConvexError({
          message: "Plus de places disponibles",
          code: "FULL",
        });
      }
    }

    // Vérifier que l'utilisateur n'a pas déjà un billet
    const existing = await ctx.db
      .query("eventTickets")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .unique();
    if (existing) {
      throw new ConvexError({
        message: "Vous avez déjà un billet",
        code: "ALREADY_PURCHASED",
      });
    }

    const ticketNumber = `TICKET-${args.eventId.slice(0, 6)}-${Date.now().toString().slice(-6)}`;
    const qrCode = `QR-${ticketNumber}`;

    const ticketId = await ctx.db.insert("eventTickets", {
      eventId: args.eventId,
      userId: user._id,
      ticketNumber,
      qrCode,
      status: "valid",
      purchasedAt: Date.now(),
    });

    // Auto-RSVP en "attending"
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
      await ctx.db.patch(existingRsvp._id, { status: "attending" });
    }

    return await ctx.db.get(ticketId);
  },
});

export const validateTicket = mutation({
  args: { ticketId: v.id("eventTickets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket)
      throw new ConvexError({
        message: "Billet introuvable",
        code: "NOT_FOUND",
      });

    const event = await ctx.db.get(ticket.eventId);
    if (!event)
      throw new ConvexError({
        message: "Événement introuvable",
        code: "NOT_FOUND",
      });
    if (event.authorId !== user._id)
      throw new ConvexError({
        message: "Seul l'organisateur peut valider les billets",
        code: "FORBIDDEN",
      });

    if (ticket.status !== "valid") {
      throw new ConvexError({
        message: "Ce billet n'est pas valide",
        code: "INVALID",
      });
    }

    await ctx.db.patch(args.ticketId, { status: "used", usedAt: Date.now() });
    return { success: true };
  },
});

// ── ANALYTICS (pour l'organisateur) ─────────────────────────────────────────

export const getAnalytics = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const tickets = await ctx.db
      .query("eventTickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const totalViews = event.viewCount || 0;
    const totalAttending = rsvps.filter((r) => r.status === "attending").length;
    const totalInterested = rsvps.filter(
      (r) => r.status === "interested",
    ).length;
    const totalNotGoing = rsvps.filter((r) => r.status === "not_going").length;
    const totalComments = comments.length;
    const totalTickets = tickets.length;

    return {
      totalViews,
      totalAttending,
      totalInterested,
      totalNotGoing,
      totalComments,
      totalTickets,
      // Taux de conversion (vues → participants)
      conversionRate: totalViews > 0 ? (totalAttending / totalViews) * 100 : 0,
      // Jours restants
      daysUntilStart: Math.max(
        0,
        Math.ceil(
          (new Date(event.startDate).getTime() - Date.now()) / 86400000,
        ),
      ),
    };
  },
});

// ── SEED ───────────────────────────────────────────────────────────────────────

export const seedEvents = mutation({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const user = await requireUser(ctx);
    const existing = await ctx.db.query("events").take(1);
    if (existing.length > 0) return false;

    const demoEvents: Array<{
      title: string;
      description: string;
      category:
        | "culturel"
        | "sportif"
        | "religieux"
        | "professionnel"
        | "communautaire"
        | "formation"
        | "festival"
        | "autre";
      startDate: string;
      endDate?: string;
      location: string;
      coverImage: string;
      maxAttendees: number;
      isFree: boolean;
      price?: string;
      tags: string[];
      status: "upcoming" | "ongoing";
      gallery?: string[];
      videos?: string[];
    }> = [
      {
        title: "Afro Nation Kinshasa 2025",
        description:
          "Le plus grand festival de musique africaine revient à Kinshasa pour une nuit inoubliable. 4 scènes, 20 artistes, 80 000 festivaliers attendus dans le mythique Stade des Martyrs.",
        category: "festival",
        startDate: "2025-07-14T18:00:00Z",
        location: "Stade des Martyrs, Kinshasa",
        coverImage:
          "https://images.unsplash.com/photo-1506157786151-b8491531f063?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
        maxAttendees: 80000,
        isFree: false,
        price: "15 000 FCFA",
        tags: ["Afrobeat", "Rumba", "Ndombolo", "Festival"],
        status: "upcoming",
      },
      {
        title: "CAN 2025 — Phase de Groupes",
        description:
          "Le choc des lions ! Sénégal vs Côte d'Ivoire en phase de groupes de la Coupe d'Afrique des Nations. Un match au sommet entre deux nations favorites du tournoi.",
        category: "sportif",
        startDate: "2025-07-15T20:00:00Z",
        location: "Stade Léopold Sédar Senghor, Dakar",
        coverImage:
          "https://images.unsplash.com/photo-1556816214-6d16c62fbbf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
        maxAttendees: 60000,
        isFree: false,
        price: "5 000 FCFA",
        tags: ["Football", "CAN 2025", "Dakar"],
        status: "upcoming",
      },
      {
        title: "Nuit Jazz & Soul Abidjan",
        description:
          "Une soirée jazz et soul exceptionnelle avec les plus grandes voix du continent. Ambiance feutrée et élégante dans le cadre magnifique du Palais de la Culture d'Abidjan.",
        category: "culturel",
        startDate: "2025-07-20T21:00:00Z",
        location: "Palais de la Culture, Abidjan",
        coverImage:
          "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
        maxAttendees: 2000,
        isFree: false,
        price: "8 000 FCFA",
        tags: ["Jazz", "Soul", "Live Music"],
        status: "upcoming",
      },
      {
        title: "TED × Dakar — Innovation Africaine",
        description:
          "12 conférenciers africains visionnaires partageront leurs idées qui méritent d'être diffusées. Technologie, entrepreneuriat, santé, agriculture — la renaissance africaine en marche.",
        category: "professionnel",
        startDate: "2025-07-21T09:00:00Z",
        location: "Hôtel King Fahd Palace, Dakar",
        coverImage:
          "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
        maxAttendees: 500,
        isFree: false,
        price: "12 000 FCFA",
        tags: ["Tech", "Innovation", "Business"],
        status: "upcoming",
      },
      {
        title: "Soirée Rooftop — Sunset Kinshasa",
        description:
          "La soirée rooftop la plus exclusive de Kinshasa. Vue panoramique sur le fleuve Congo, cocktails premium, DJ sets international. Tenue de soirée exigée.",
        category: "communautaire",
        startDate: "2025-07-27T19:00:00Z",
        location: "Pullman Hotel Rooftop, Kinshasa",
        coverImage:
          "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
        maxAttendees: 300,
        isFree: false,
        price: "20 000 FCFA",
        tags: ["DJ", "Rooftop", "Exclusif"],
        status: "upcoming",
      },
      {
        title: "Festival Panafricain des Arts",
        description:
          "3 jours de célébration des arts visuels, de la musique et de la danse africaine. Entrée gratuite pour tous. Expositions, performances live, ateliers pour enfants.",
        category: "festival",
        startDate: "2025-07-21T10:00:00Z",
        endDate: "2025-07-23T22:00:00Z",
        location: "Parc de la Victoire, Abidjan",
        coverImage:
          "https://images.unsplash.com/photo-1556340346-5e30da977c4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
        maxAttendees: 50000,
        isFree: true,
        tags: ["Arts", "Culture", "Gratuit"],
        status: "upcoming",
      },
    ];

    for (const event of demoEvents) {
      await ctx.db.insert("events", {
        authorId: user._id,
        ...event,
        gallery: event.gallery ?? [],
        videos: event.videos ?? [],
      });
    }
    return true;
  },
});
