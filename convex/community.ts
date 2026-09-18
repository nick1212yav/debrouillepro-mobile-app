// convex/community.ts
// Version finale – corrections pour l'affichage des images
// ✅ Gestion des données base64 (data:image/...) sans appeler storage.getUrl
// ✅ Types corrigés (undefined au lieu de null)
// ✅ Ajout de likeCount: 0 dans les insertions de commentaires
// ✅ Option C : deleteStory bornée (.take(500) au lieu de .collect())
// ✅ Batch 2.5 : listStories (sémantique + borne), createStory (durée),
//    viewStory (.first() + expiration), deleteStory (check remaining)
// ✅ Fix TS : postsQuery typé explicitement (Doc<"publications">[])

import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Non connecté" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
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

async function resolveStorageUrl(
  ctx: QueryCtx,
  file: string | undefined | null,
): Promise<string | null> {
  if (!file) return null;
  if (file.startsWith("http://") || file.startsWith("https://")) return file;
  if (
    file.startsWith("data:image") ||
    file.startsWith("data:video") ||
    file.startsWith("data:audio")
  ) {
    return file;
  }
  try {
    return await ctx.storage.getUrl(file as Id<"_storage">);
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// GROUPS
// ══════════════════════════════════════════════════════════════════════════════

export const listGroups = query({
  args: { category: v.optional(v.string()), search: v.optional(v.string()) },
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      _id: string;
      name: string;
      description: string;
      category: string;
      isPrivate: boolean;
      memberCount: number;
      city?: string;
      tags: string[];
      isMember: boolean;
      role?: string;
    }>
  > => {
    const identity = await ctx.auth.getUserIdentity();
    let groupsQuery;
    if (args.search) {
      groupsQuery = await ctx.db
        .query("groups")
        .withSearchIndex("search_groups", (q) => q.search("name", args.search!))
        .take(50);
    } else if (args.category && args.category !== "all") {
      groupsQuery = await ctx.db
        .query("groups")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      groupsQuery = await ctx.db.query("groups").order("desc").take(50);
    }

    let memberMap: Record<string, string> = {};
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (user) {
        const memberships = await ctx.db
          .query("groupMembers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const m of memberships) memberMap[m.groupId] = m.role;
      }
    }
    return groupsQuery.map((g) => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      category: g.category,
      isPrivate: g.isPrivate,
      memberCount: g.memberCount,
      city: g.city,
      tags: g.tags,
      isMember: memberMap[g._id] !== undefined,
      role: memberMap[g._id],
    }));
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    isPrivate: v.boolean(),
    city: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const groupId = await ctx.db.insert("groups", {
      adminId: user._id,
      name: args.name,
      description: args.description,
      category: args.category,
      isPrivate: args.isPrivate,
      memberCount: 1,
      city: args.city,
      tags: args.tags,
    });
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: user._id,
      role: "admin",
      joinedAt: new Date().toISOString(),
      status: "active",
    });
    return groupId;
  },
});

export const joinGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      const group = await ctx.db.get(args.groupId);
      if (group)
        await ctx.db.patch(args.groupId, {
          memberCount: Math.max(0, group.memberCount - 1),
        });
      return { joined: false };
    } else {
      await ctx.db.insert("groupMembers", {
        groupId: args.groupId,
        userId: user._id,
        role: "member",
        joinedAt: new Date().toISOString(),
        status: "active",
      });
      const group = await ctx.db.get(args.groupId);
      if (group)
        await ctx.db.patch(args.groupId, {
          memberCount: group.memberCount + 1,
        });
      return { joined: true };
    }
  },
});

export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    city: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const group = await ctx.db.get(args.groupId);
    if (!group)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Groupe introuvable",
      });
    if (group.adminId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas administrateur",
      });
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.category !== undefined) patch.category = args.category;
    if (args.isPrivate !== undefined) patch.isPrivate = args.isPrivate;
    if (args.city !== undefined) patch.city = args.city;
    if (args.tags !== undefined) patch.tags = args.tags;
    await ctx.db.patch(args.groupId, patch);
    return await ctx.db.get(args.groupId);
  },
});

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const group = await ctx.db.get(args.groupId);
    if (!group)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Groupe introuvable",
      });
    if (group.adminId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas administrateur",
      });
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const m of members) await ctx.db.delete(m._id);
    await ctx.db.delete(args.groupId);
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// COMMUNITY POSTS
// ══════════════════════════════════════════════════════════════════════════════

export const listFeed = query({
  args: {
    filter: v.optional(
      v.union(v.literal("all"), v.literal("mine"), v.literal("following")),
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const currentUserId = currentUser?._id;
    // Annotation explicite : sans elle, TS infère `any` et la résolution
    // de `ctx.db.get(p.authorId)` retourne l'union de tous les documents.
    let postsQuery: Doc<"publications">[];
    if (args.search) {
      postsQuery = await ctx.db
        .query("publications")
        .withSearchIndex("search_publications", (q) =>
          q.search("title", args.search!),
        )
        .take(50);
    } else if (args.filter === "mine" && currentUserId) {
      postsQuery = await ctx.db
        .query("publications")
        .withIndex("by_author", (q) => q.eq("authorId", currentUserId))
        .order("desc")
        .take(50);
    } else {
      postsQuery = await ctx.db
        .query("publications")
        .withIndex("by_type", (q) => q.eq("type", "community"))
        .order("desc")
        .take(50);
    }

    const enriched = await Promise.all(
      postsQuery.map(async (p) => {
        const author = await ctx.db.get(p.authorId);
        let likedByMe = false,
          bookmarkedByMe = false;
        if (currentUserId) {
          const like = await ctx.db
            .query("publicationLikes")
            .withIndex("by_user_and_publication", (q) =>
              q.eq("userId", currentUserId).eq("publicationId", p._id),
            )
            .unique();
          likedByMe = like !== null;
          const bookmark = await ctx.db
            .query("bookmarks")
            .withIndex("by_user_and_publication", (q) =>
              q.eq("userId", currentUserId).eq("publicationId", p._id),
            )
            .unique();
          bookmarkedByMe = bookmark !== null;
        }

        let meta: any = { postType: "text" };
        if (p.meta) {
          try {
            meta = typeof p.meta === "string" ? JSON.parse(p.meta) : p.meta;
          } catch {}
        }

        const images = (
          await Promise.all(
            (meta.images || []).map((id: string) => resolveStorageUrl(ctx, id)),
          )
        ).filter((url): url is string => url !== null && url !== undefined);

        const videos = (
          await Promise.all(
            (meta.videos || []).map((id: string) => resolveStorageUrl(ctx, id)),
          )
        ).filter((url): url is string => url !== null && url !== undefined);

        const audio = (
          await Promise.all(
            (meta.audio || []).map((id: string) => resolveStorageUrl(ctx, id)),
          )
        ).filter((url): url is string => url !== null && url !== undefined);

        const enrichedMeta = {
          ...meta,
          images,
          videos,
          audio,
        };

        return {
          ...p,
          images,
          authorName: author?.name ?? "Inconnu",
          authorAvatar: author?.avatar ?? undefined,
          likedByMe,
          bookmarkedByMe,
          isMine: currentUserId === p.authorId,
          meta: enrichedMeta,
        };
      }),
    );
    return enriched;
  },
});

export const createPost = mutation({
  args: {
    title: v.optional(v.string()),
    description: v.string(),
    tags: v.array(v.string()),
    meta: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const publicationId = await ctx.db.insert("publications", {
      authorId: user._id,
      type: "community",
      title: args.title ?? "",
      description: args.description,
      tags: args.tags,
      images: [],
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      status: "active",
      meta: args.meta,
    });
    return publicationId;
  },
});

export const updatePost = mutation({
  args: {
    publicationId: v.id("publications"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    meta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.publicationId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });
    if (post.authorId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas l'auteur",
      });
    const patch: any = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.tags !== undefined) patch.tags = args.tags;
    if (args.meta !== undefined) patch.meta = args.meta;
    await ctx.db.patch(args.publicationId, patch);
    return await ctx.db.get(args.publicationId);
  },
});

export const deletePost = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.publicationId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });
    if (post.authorId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas l'auteur",
      });
    const allLikes = await ctx.db.query("publicationLikes").collect();
    const likes = allLikes.filter(
      (l) => l.publicationId === args.publicationId,
    );
    for (const like of likes) await ctx.db.delete(like._id);

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .collect();
    for (const comment of comments) await ctx.db.delete(comment._id);

    const allBookmarks = await ctx.db.query("bookmarks").collect();
    const bookmarks = allBookmarks.filter(
      (b) => b.publicationId === args.publicationId,
    );
    for (const b of bookmarks) await ctx.db.delete(b._id);

    await ctx.db.delete(args.publicationId);
  },
});

export const likePost = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.publicationId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });
    const existing = await ctx.db
      .query("publicationLikes")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", args.publicationId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.publicationId, {
        likeCount: Math.max(0, post.likeCount - 1),
      });
      return { liked: false };
    } else {
      await ctx.db.insert("publicationLikes", {
        userId: user._id,
        publicationId: args.publicationId,
      });
      await ctx.db.patch(args.publicationId, { likeCount: post.likeCount + 1 });
      return { liked: true };
    }
  },
});

export const votePoll = mutation({
  args: { publicationId: v.id("publications"), optionId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.publicationId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });
    if (!post.meta)
      throw new ConvexError({ code: "INVALID", message: "Pas de meta" });
    let meta;
    try {
      meta = typeof post.meta === "string" ? JSON.parse(post.meta) : post.meta;
    } catch {
      throw new ConvexError({ code: "INVALID", message: "Meta invalide" });
    }
    if (meta.postType !== "poll" || !meta.pollOptions)
      throw new ConvexError({
        code: "INVALID",
        message: "Ce n'est pas un sondage",
      });
    const option = meta.pollOptions.find((o: any) => o.id === args.optionId);
    if (!option)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Option introuvable",
      });
    option.votes += 1;
    await ctx.db.patch(args.publicationId, { meta: JSON.stringify(meta) });
    return { success: true };
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// COMMENTS
// ══════════════════════════════════════════════════════════════════════════════

export const listComments = query({
  args: { postId: v.id("publications") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_publication", (q) => q.eq("publicationId", args.postId))
      .order("asc")
      .collect();
    const enriched = await Promise.all(
      comments.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        return {
          ...c,
          authorName: author?.name ?? "Inconnu",
          authorAvatar: author?.avatar,
          isMine: currentUser?._id === c.authorId,
          replies: [],
        };
      }),
    );
    return enriched.filter((c) => !c.parentId);
  },
});

export const addComment = mutation({
  args: { postId: v.id("publications"), text: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });
    const commentId = await ctx.db.insert("comments", {
      publicationId: args.postId,
      authorId: user._id,
      text: args.text,
      likeCount: 0,
    });
    await ctx.db.patch(args.postId, {
      commentCount: (post.commentCount || 0) + 1,
    });
    return await ctx.db.get(commentId);
  },
});

export const addReply = mutation({
  args: {
    postId: v.id("publications"),
    parentId: v.id("comments"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });
    const parent = await ctx.db.get(args.parentId);
    if (!parent)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commentaire parent introuvable",
      });
    const commentId = await ctx.db.insert("comments", {
      publicationId: args.postId,
      authorId: user._id,
      parentId: args.parentId,
      text: args.text,
      likeCount: 0,
    });
    await ctx.db.patch(args.postId, {
      commentCount: (post.commentCount || 0) + 1,
    });
    return await ctx.db.get(commentId);
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commentaire introuvable",
      });
    if (comment.authorId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas l'auteur",
      });
    const allComments = await ctx.db.query("comments").collect();
    const replies = allComments.filter((c) => c.parentId === args.commentId);
    for (const reply of replies) {
      await ctx.db.delete(reply._id);
      const post = await ctx.db.get(reply.publicationId);
      if (post)
        await ctx.db.patch(post._id, {
          commentCount: Math.max(0, (post.commentCount || 0) - 1),
        });
    }
    const post = await ctx.db.get(comment.publicationId);
    if (post)
      await ctx.db.patch(post._id, {
        commentCount: Math.max(0, (post.commentCount || 0) - 1),
      });
    await ctx.db.delete(args.commentId);
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════════════════════════

export const listEvents = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    let events;
    if (args.category && args.category !== "all") {
      events = await ctx.db.query("events").collect();
      events = events.filter((e) => e.category === args.category);
    } else {
      events = await ctx.db.query("events").order("desc").take(50);
    }
    const enriched = await Promise.all(
      events.map(async (e) => {
        let isAttending = false;
        if (currentUser) {
          const rsvp = await ctx.db
            .query("eventRsvps")
            .withIndex("by_event_and_user", (q) =>
              q.eq("eventId", e._id).eq("userId", currentUser._id),
            )
            .unique();
          isAttending = rsvp !== null && rsvp.status === "attending";
        }
        let coverImage: string | undefined = e.coverImage;
        if (
          coverImage &&
          !coverImage.startsWith("http") &&
          !coverImage.startsWith("data:")
        ) {
          try {
            const url = await ctx.storage.getUrl(coverImage as Id<"_storage">);
            coverImage = url ?? undefined;
          } catch {
            coverImage = undefined;
          }
        }
        return { ...e, coverImage, isAttending };
      }),
    );
    return enriched;
  },
});

export const createEvent = mutation({
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
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
    isFree: v.boolean(),
    price: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const eventId = await ctx.db.insert("events", {
      authorId: user._id,
      title: args.title,
      description: args.description,
      category: args.category,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      coverImage: args.coverImage,
      maxAttendees: args.maxAttendees,
      isFree: args.isFree,
      price: args.price,
      tags: args.tags,
      status: "upcoming",
    });
    await ctx.db.insert("publications", {
      authorId: user._id,
      type: "community",
      title: `📅 ${args.title}`,
      description: args.description,
      tags: args.tags,
      images: args.coverImage ? [args.coverImage] : [],
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      status: "active",
      meta: JSON.stringify({
        postType: "event",
        eventDate: args.startDate,
        eventLocation: args.location,
        emoji: "📅",
        eventId,
      }),
    });
    return eventId;
  },
});

export const updateEvent = mutation({
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
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
    isFree: v.optional(v.boolean()),
    price: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
        code: "NOT_FOUND",
        message: "Événement introuvable",
      });
    if (event.authorId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas l'auteur",
      });
    const patch: any = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.category !== undefined) patch.category = args.category;
    if (args.startDate !== undefined) patch.startDate = args.startDate;
    if (args.endDate !== undefined) patch.endDate = args.endDate;
    if (args.location !== undefined) patch.location = args.location;
    if (args.address !== undefined) patch.address = args.address;
    if (args.latitude !== undefined) patch.latitude = args.latitude;
    if (args.longitude !== undefined) patch.longitude = args.longitude;
    if (args.coverImage !== undefined) patch.coverImage = args.coverImage;
    if (args.maxAttendees !== undefined) patch.maxAttendees = args.maxAttendees;
    if (args.isFree !== undefined) patch.isFree = args.isFree;
    if (args.price !== undefined) patch.price = args.price;
    if (args.tags !== undefined) patch.tags = args.tags;
    if (args.status !== undefined) patch.status = args.status;
    await ctx.db.patch(args.eventId, patch);
    return await ctx.db.get(args.eventId);
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Événement introuvable",
      });
    if (event.authorId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas l'auteur",
      });
    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const r of rsvps) await ctx.db.delete(r._id);
    await ctx.db.delete(args.eventId);
  },
});

export const attendEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Événement introuvable",
      });
    const existing = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { attending: false };
    }
    await ctx.db.insert("eventRsvps", {
      eventId: args.eventId,
      userId: user._id,
      status: "attending",
    });
    return { attending: true };
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// STORIES
// ══════════════════════════════════════════════════════════════════════════════

export const listStories = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    // Une story active est une story dont expiresAt est strictement postérieur
    // à maintenant. `now - 24h` réintroduirait des stories déjà expirées.
    const now = new Date().toISOString();
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(200);
    const enriched = await Promise.all(
      stories.map(async (s) => {
        const author = await ctx.db.get(s.authorId);
        let isViewed = false;
        if (currentUser) {
          const view = await ctx.db
            .query("storyViews")
            .withIndex("by_story", (q) => q.eq("storyId", s._id))
            .filter((q) => q.eq(q.field("viewerId"), currentUser._id))
            .first();
          isViewed = view !== null;
        }
        let mediaUrl: string | undefined = s.mediaUrl;
        if (
          mediaUrl &&
          !mediaUrl.startsWith("http") &&
          !mediaUrl.startsWith("data:")
        ) {
          try {
            const url = await ctx.storage.getUrl(mediaUrl as Id<"_storage">);
            mediaUrl = url ?? undefined;
          } catch {
            mediaUrl = undefined;
          }
        }
        return {
          ...s,
          mediaUrl,
          authorName: author?.name ?? "Inconnu",
          authorAvatar: author?.avatar,
          isViewed,
        };
      }),
    );
    return enriched;
  },
});

export const createStory = mutation({
  args: {
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const storyId = await ctx.db.insert("stories", {
      authorId: user._id,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      caption: args.caption,
      duration: args.duration, // champ optionnel — aucune valeur inventée
      viewCount: 0,
      expiresAt,
      isHighlight: false,
    });
    return storyId;
  },
});

export const viewStory = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const story = await ctx.db.get(args.storyId);
    if (!story)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Story introuvable",
      });

    // Refuser une vue sur une story expirée.
    const now = new Date().toISOString();
    if (story.expiresAt <= now) return;

    // .first() : ne crash pas si deux vues existent (double-tap rapide avant insert).
    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.eq(q.field("viewerId"), user._id))
      .first();

    if (existing) return;

    await ctx.db.insert("storyViews", {
      storyId: args.storyId,
      viewerId: user._id,
      viewedAt: now,
    });

    // viewCount est v.number() non-optionnel : aucun fallback `|| 0`.
    await ctx.db.patch(args.storyId, {
      viewCount: story.viewCount + 1,
    });
  },
});

export const deleteStory = mutation({
  args: {
    storyId: v.id("stories"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const story = await ctx.db.get(args.storyId);

    if (!story) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Story introuvable",
      });
    }

    if (story.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas l'auteur",
      });
    }

    // Suppression bornée : une mutation ne doit jamais collecter
    // toutes les vues d'une Story sans limite.
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .take(500);

    for (const view of views) {
      await ctx.db.delete(view._id);
    }

    // Après suppression du batch, on vérifie qu'il ne reste PLUS aucune vue.
    // Sans ce check, une story avec exactement 500 vues retournerait
    // pendingCleanup: true alors que tout est supprimé → boucle infinie client.
    if (views.length === 500) {
      const remaining = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
        .take(1);

      if (remaining.length > 0) {
        return {
          success: false,
          pendingCleanup: true,
          deletedViews: views.length,
        };
      }
    }

    await ctx.db.delete(args.storyId);

    return {
      success: true,
      pendingCleanup: false,
      deletedViews: views.length,
    };
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// LIVE
// ══════════════════════════════════════════════════════════════════════════════

export const getLiveStatus = query({
  args: {},
  handler: async (ctx) => {
    const live = await ctx.db
      .query("liveStreams")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .unique();
    if (!live) return { isLive: false, streamUrl: null };
    return { isLive: true, streamUrl: live.streamUrl };
  },
});

export const startLive = mutation({
  args: { title: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("liveStreams")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .filter((q) => q.eq(q.field("status"), "live"))
      .unique();
    if (existing)
      throw new ConvexError({
        code: "CONFLICT",
        message: "Vous avez déjà un live en cours",
      });
    // streamUrl est v.optional(v.string()) dans le schéma.
    // Aucune URL de flux n'est générée : la vraie URL RTMP/HLS dépend
    // d'un pipeline CDN qui n'existe pas encore (décision produit).
    // CommunityLive.tsx affiche un placeholder quand streamUrl est absent.
    await ctx.db.insert("liveStreams", {
      hostId: user._id,
      title: args.title,
      description: args.description,
      // streamUrl: volontairement non renseigné
      status: "live",
      startedAt: new Date().toISOString(),
      viewerCount: 0,
      likeCount: 0,
      peakViewers: 0,
      category: "general",
      isPublic: true,
      tags: [],
    });
    await ctx.db.insert("publications", {
      authorId: user._id,
      type: "community",
      title: `🔴 ${args.title}`,
      description: args.description || "Live en direct",
      tags: ["#Live"],
      images: [],
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      status: "active",
      meta: JSON.stringify({
        postType: "live",
        emoji: "🔴",
      }),
    });
    // useCommunityLive.ts lit `result.streamUrl` puis appelle
    // setStreamUrl(string | null). On retourne `null` — la forme du contrat
    // client est préservée, aucune URL fabriquée n'est exposée.
    return { streamUrl: null };
  },
});

export const endLive = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const live = await ctx.db
      .query("liveStreams")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .filter((q) => q.eq(q.field("status"), "live"))
      .unique();
    if (!live)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Aucun live en cours",
      });
    await ctx.db.patch(live._id, {
      status: "ended",
      endedAt: new Date().toISOString(),
    });
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════════════════════════════

export const search = query({
  args: {
    query: v.string(),
    type: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    dateRange: v.optional(v.object({ from: v.number(), to: v.number() })),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const results = await ctx.db
      .query("publications")
      .withSearchIndex("search_publications", (q) =>
        q.search("title", args.query),
      )
      .take(30);
    return await Promise.all(
      results.map(async (p) => {
        const author = await ctx.db.get(p.authorId);
        let likedByMe = false;
        if (currentUser) {
          const like = await ctx.db
            .query("publicationLikes")
            .withIndex("by_user_and_publication", (q) =>
              q.eq("userId", currentUser._id).eq("publicationId", p._id),
            )
            .unique();
          likedByMe = like !== null;
        }
        let meta: any = { postType: "text" };
        if (p.meta) {
          try {
            meta = typeof p.meta === "string" ? JSON.parse(p.meta) : p.meta;
          } catch {}
        }
        const images = (
          await Promise.all(
            (meta.images || []).map((id: string) => resolveStorageUrl(ctx, id)),
          )
        ).filter((url): url is string => url !== null && url !== undefined);

        const enrichedMeta = { ...meta, images };
        return {
          ...p,
          images,
          authorName: author?.name ?? "Inconnu",
          authorAvatar: author?.avatar,
          likedByMe,
          isMine: currentUser?._id === p.authorId,
          meta: enrichedMeta,
        };
      }),
    );
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const getRecommendations = query({
  args: { postId: v.optional(v.id("publications")) },
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("publications")
      .withIndex("by_type", (q) => q.eq("type", "community"))
      .order("desc")
      .take(10);
    const currentUser = await getCurrentUser(ctx);
    return await Promise.all(
      posts.map(async (p) => {
        const author = await ctx.db.get(p.authorId);
        let likedByMe = false;
        if (currentUser) {
          const like = await ctx.db
            .query("publicationLikes")
            .withIndex("by_user_and_publication", (q) =>
              q.eq("userId", currentUser._id).eq("publicationId", p._id),
            )
            .unique();
          likedByMe = like !== null;
        }
        let meta: any = { postType: "text" };
        if (p.meta) {
          try {
            meta = typeof p.meta === "string" ? JSON.parse(p.meta) : p.meta;
          } catch {}
        }
        const images = (
          await Promise.all(
            (meta.images || []).map((id: string) => resolveStorageUrl(ctx, id)),
          )
        ).filter((url): url is string => url !== null && url !== undefined);

        const enrichedMeta = { ...meta, images };
        return {
          ...p,
          images,
          authorName: author?.name ?? "Inconnu",
          authorAvatar: author?.avatar,
          likedByMe,
          isMine: currentUser?._id === p.authorId,
          meta: enrichedMeta,
        };
      }),
    );
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

export const getAnalytics = query({
  args: { postId: v.id("publications") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    return {
      views: post.viewCount || 0,
      likes: post.likeCount || 0,
      comments: post.commentCount || 0,
      shares: 0,
      bookmarks: 0,
    };
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// BOOKMARKS
// ══════════════════════════════════════════════════════════════════════════════

export const listBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const enriched = await Promise.all(
      bookmarks.map(async (b) => {
        const post = await ctx.db.get(b.publicationId);
        if (!post) return null;
        const author = await ctx.db.get(post.authorId);
        let meta: any = { postType: "text" };
        if (post.meta) {
          try {
            meta =
              typeof post.meta === "string" ? JSON.parse(post.meta) : post.meta;
          } catch {}
        }
        const images = (
          await Promise.all(
            (meta.images || []).map((id: string) => resolveStorageUrl(ctx, id)),
          )
        ).filter((url): url is string => url !== null && url !== undefined);

        const enrichedMeta = { ...meta, images };
        return {
          ...post,
          images,
          authorName: author?.name ?? "Inconnu",
          authorAvatar: author?.avatar,
          likedByMe: false,
          bookmarkedByMe: true,
          isMine: user._id === post.authorId,
          meta: enrichedMeta,
        };
      }),
    );
    return enriched.filter(Boolean);
  },
});

export const toggleBookmark = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.publicationId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", args.publicationId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }
    await ctx.db.insert("bookmarks", {
      userId: user._id,
      publicationId: args.publicationId,
    });
    return { bookmarked: true };
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// AI PLACEHOLDERS
// ══════════════════════════════════════════════════════════════════════════════

export const translateText = mutation({
  args: { text: v.string(), targetLang: v.string() },
  handler: async (ctx, args) => ({
    translatedText: `[TRADUCTION ${args.targetLang}] ${args.text}`,
  }),
});
export const summarizeText = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const words = args.text.split(" ");
    return {
      summary: words.slice(0, Math.min(10, words.length)).join(" ") + "...",
    };
  },
});
export const moderateText = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const badWords = ["spam", "violence", "hate"];
    const found = badWords.some((w) => args.text.toLowerCase().includes(w));
    return { flagged: found, confidence: found ? 0.9 : 0.1 };
  },
});
export const suggestHashtags = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const words = args.text.split(" ");
    return {
      hashtags: words
        .filter((w) => w.length > 4)
        .slice(0, 5)
        .map((w) => `#${w}`),
    };
  },
});
export const generateReply = mutation({
  args: { commentId: v.id("comments"), context: v.string() },
  handler: async (ctx, args) => ({
    reply: `Réponse générée pour le commentaire ${args.commentId}: ${args.context}`,
  }),
});

// ══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE
// ══════════════════════════════════════════════════════════════════════════════

export const addToCart = mutation({
  args: { productId: v.id("products"), quantity: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId),
      )
      .unique();
    if (existing)
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
      });
    else
      await ctx.db.insert("cartItems", {
        userId: user._id,
        productId: args.productId,
        quantity: args.quantity,
      });
  },
});
export const removeFromCart = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
export const buyProduct = mutation({
  args: { productId: v.id("products"), paymentMethod: v.string() },
  handler: async (ctx, args) => ({
    success: true,
    orderId: `ORD_${Date.now()}`,
  }),
});
export const listProduct = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    images: v.array(v.string()),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const productId = await ctx.db.insert("products", {
      sellerId: user._id,
      title: args.title,
      description: args.description,
      price: args.price,
      currency: args.currency,
      images: args.images,
      category: args.category,
      tags: args.tags || [],
      stock: args.stock,
      status: "active",
      isDigital: false,
      deliveryAvailable: false,
    });
    await ctx.db.insert("publications", {
      authorId: user._id,
      type: "community",
      title: `🛒 ${args.title}`,
      description: args.description,
      tags: args.tags || ["#Marketplace"],
      images: args.images,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      status: "active",
      meta: JSON.stringify({
        postType: "marketplace",
        marketplaceId: productId,
        price: args.price,
        currency: args.currency,
        emoji: "🛒",
      }),
    });
    return productId;
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════════════════════

export const processPayment = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    source: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const paymentId = `PAY_${Date.now()}`;
    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      amount: args.amount,
      currency: args.currency,
      description: args.description || "Paiement",
      type: "payment",
      status: "completed",
      referenceId: paymentId,
      completedAt: new Date().toISOString(),
    });
    return { id: paymentId, status: "succeeded" };
  },
});
export const createPaymentIntent = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async () => ({
    id: `PI_${Date.now()}`,
    clientSecret: `secret_${Date.now()}`,
  }),
});
export const confirmPayment = mutation({
  args: { paymentIntentId: v.string() },
  handler: async (ctx, args) => ({
    id: args.paymentIntentId,
    status: "succeeded",
  }),
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const listNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});
export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Notification introuvable",
      });
    if (notification.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await ctx.db.patch(args.notificationId, { read: true });
  },
});
export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();
    for (const n of notifications) await ctx.db.patch(n._id, { read: true });
  },
});
export const sendNotification = mutation({
  args: {
    recipientId: v.id("users"),
    type: v.union(
      v.literal("message"),
      v.literal("job"),
      v.literal("immo"),
      v.literal("payment"),
      v.literal("system"),
      v.literal("delivery"),
      v.literal("sante"),
      v.literal("agri"),
      v.literal("transport"),
      v.literal("community"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("boost"),
      v.literal("event"),
      v.literal("streak"),
      v.literal("digest"),
      v.literal("annonce"),
    ),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.recipientId,
      type: args.type,
      title: args.title,
      body: args.body,
      read: false,
      pinned: false,
      priority: "normal",
      module: "community",
    });
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// ONG / NGO
// ══════════════════════════════════════════════════════════════════════════════

export const listNGOs = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category)
      return await ctx.db
        .query("ngoProfiles")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(30);
    return await ctx.db.query("ngoProfiles").order("desc").take(30);
  },
});
export const getNGOCampaigns = query({
  args: { ngoId: v.id("ngoProfiles") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("ngoCampaigns")
      .withIndex("by_ngo", (q) => q.eq("ngoId", args.ngoId))
      .collect(),
});
export const listActiveCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("ngoCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(20);
    return await Promise.all(
      campaigns.map(async (c) => {
        const ngo = await ctx.db.get(c.ngoId);
        return { ...c, ngoName: ngo?.name ?? "ONG", ngoLogo: ngo?.logo };
      }),
    );
  },
});
export const createNGO = mutation({
  args: {
    name: v.string(),
    mission: v.string(),
    description: v.string(),
    category: v.string(),
    city: v.string(),
    country: v.string(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("ngoProfiles", {
      userId: user._id,
      name: args.name,
      mission: args.mission,
      description: args.description,
      category: args.category,
      city: args.city,
      country: args.country,
      website: args.website,
      phone: args.phone,
      verified: false,
      totalDonations: 0,
      donorCount: 0,
    });
  },
});
export const createCampaign = mutation({
  args: {
    ngoId: v.id("ngoProfiles"),
    title: v.string(),
    description: v.string(),
    goal: v.number(),
    currency: v.string(),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.insert("ngoCampaigns", {
      ngoId: args.ngoId,
      title: args.title,
      description: args.description,
      goal: args.goal,
      currency: args.currency,
      raised: 0,
      donorCount: 0,
      deadline: args.deadline,
      status: "active",
    });
  },
});
export const donate = mutation({
  args: {
    campaignId: v.id("ngoCampaigns"),
    amount: v.number(),
    currency: v.string(),
    anonymous: v.boolean(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Campagne introuvable",
      });
    await ctx.db.insert("donations", {
      campaignId: args.campaignId,
      donorId: user._id,
      amount: args.amount,
      currency: args.currency,
      anonymous: args.anonymous,
      message: args.message,
      paidAt: new Date().toISOString(),
    });
    await ctx.db.patch(args.campaignId, {
      raised: campaign.raised + args.amount,
      donorCount: campaign.donorCount + 1,
    });
    const ngo = await ctx.db.get(campaign.ngoId);
    if (ngo)
      await ctx.db.patch(campaign.ngoId, {
        totalDonations: ngo.totalDonations + args.amount,
        donorCount: ngo.donorCount + 1,
      });
    return true;
  },
});
export const getDonations = query({
  args: { campaignId: v.id("ngoCampaigns") },
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .take(20);
    return await Promise.all(
      donations.map(async (d) => {
        if (d.anonymous) return { ...d, donorName: "Anonyme" };
        const donor = await ctx.db.get(d.donorId);
        return { ...d, donorName: donor?.name ?? "Inconnu" };
      }),
    );
  },
});
export const getMyNGO = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;
    return await ctx.db
      .query("ngoProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

// ─── DRAFTS ──────────────────────────────────────────────────────────────────
export const saveDraft = mutation({
  args: {
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    meta: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
    audio: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    scheduleDate: v.optional(v.string()),
    audience: v.optional(
      v.union(v.literal("public"), v.literal("friends"), v.literal("private")),
    ),
    mood: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("drafts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        meta: args.meta,
        images: args.images,
        videos: args.videos,
        audio: args.audio,
        tags: args.tags,
        location: args.location,
        scheduleDate: args.scheduleDate,
        audience: args.audience,
        mood: args.mood,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      const draftId = await ctx.db.insert("drafts", {
        userId: user._id,
        title: args.title || "",
        description: args.description || "",
        meta: args.meta || "",
        images: args.images || [],
        videos: args.videos || [],
        audio: args.audio || [],
        tags: args.tags || [],
        location: args.location,
        scheduleDate: args.scheduleDate,
        audience: args.audience || "public",
        mood: args.mood as any,
        updatedAt: new Date().toISOString(),
      });
      return draftId;
    }
  },
});

export const getDraft = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (!user) return null;
      const draft = await ctx.db
        .query("drafts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      return draft || null;
    } catch {
      return null;
    }
  },
});

export const deleteDraft = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (draft) await ctx.db.delete(draft._id);
  },
});

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
