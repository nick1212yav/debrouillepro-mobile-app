import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FlagPublicationSummary = {
  _id: Id<"publications">;
  title: string;
  type: Doc<"publications">["type"];
  authorId: Id<"users">;
  isHidden?: boolean;
};

type FlagCommentSummary = {
  _id: Id<"comments">;
  text: string;
  authorId: Id<"users">;
  publicationId: Id<"publications">;
};

// ── Helper: assert caller is admin ────────────────────────────────────────────

async function assertAdmin(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
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

  if (!user || !user.isAdmin) {
    throw new ConvexError({
      message: "Accès refusé — réservé aux administrateurs",
      code: "FORBIDDEN",
    });
  }

  return user._id;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getPlatformStats = query({
  args: {},

  handler: async (
    ctx,
  ): Promise<{
    totalUsers: number;
    bannedUsers: number;
    totalPublications: number;
    pendingFlags: number;
    hiddenPublications: number;
    publicationsByType: Record<string, number>;
  }> => {
    await assertAdmin(ctx);

    const [users, publications, flags] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("publications").collect(),
      ctx.db
        .query("contentFlags")
        .withIndex("by_resolved", (q) => q.eq("resolved", false))
        .collect(),
    ]);

    const publicationsByType: Record<string, number> = {};

    for (const pub of publications) {
      publicationsByType[pub.type] = (publicationsByType[pub.type] ?? 0) + 1;
    }

    return {
      totalUsers: users.length,
      bannedUsers: users.filter((u) => u.isBanned).length,
      totalPublications: publications.length,
      pendingFlags: flags.length,
      hiddenPublications: publications.filter((p) => p.isHidden).length,
      publicationsByType,
    };
  },
});

// ── User Management ───────────────────────────────────────────────────────────

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const users = await ctx.db.query("users").collect();

    const filtered = args.search
      ? users.filter(
          (u) =>
            u.name?.toLowerCase().includes(args.search!.toLowerCase()) ||
            u.email?.toLowerCase().includes(args.search!.toLowerCase()),
        )
      : users;

    return filtered
      .slice(-100)
      .reverse()
      .map((u) => ({
        _id: u._id,
        _creationTime: u._creationTime,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        roles: u.roles,
        primaryRole: u.roles?.[0] ?? null,
        city: u.city,
        isAdmin: u.isAdmin ?? false,
        isBanned: u.isBanned ?? false,
        onboardingCompleted: u.onboardingCompleted ?? false,
      }));
  },
});

export const banUser = mutation({
  args: {
    userId: v.id("users"),
    ban: v.boolean(),
  },

  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    await ctx.db.patch(args.userId, {
      isBanned: args.ban,
    });
  },
});

export const setAdminRole = mutation({
  args: {
    userId: v.id("users"),
    isAdmin: v.boolean(),
  },

  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    await ctx.db.patch(args.userId, {
      isAdmin: args.isAdmin,
    });
  },
});

// ── Content Moderation ────────────────────────────────────────────────────────

export const listFlags = query({
  args: {
    contentType: v.optional(
      v.union(v.literal("publication"), v.literal("comment"), v.literal("all")),
    ),
    resolved: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const showResolved = args.resolved ?? false;

    const flags = await ctx.db
      .query("contentFlags")
      .withIndex("by_resolved", (q) => q.eq("resolved", showResolved))
      .collect();

    const filtered =
      args.contentType && args.contentType !== "all"
        ? flags.filter((f) => f.contentType === args.contentType)
        : flags;

    return await Promise.all(
      filtered.map(async (flag) => {
        const reporter = await ctx.db.get(flag.reportedBy);

        let publication: FlagPublicationSummary | null = null;
        let comment: FlagCommentSummary | null = null;

        if (flag.contentType === "publication" && flag.publicationId) {
          const pub = await ctx.db.get(flag.publicationId);

          publication = pub
            ? {
                _id: pub._id,
                title: pub.title,
                type: pub.type,
                authorId: pub.authorId,
                isHidden: pub.isHidden,
              }
            : null;
        } else if (flag.contentType === "comment" && flag.commentId) {
          const c = await ctx.db.get(flag.commentId);

          comment = c
            ? {
                _id: c._id,
                text: c.text,
                authorId: c.authorId,
                publicationId: c.publicationId,
              }
            : null;
        }

        return {
          ...flag,
          publication,
          comment,
          reporter: reporter
            ? {
                name: reporter.name,
                email: reporter.email,
              }
            : null,
        };
      }),
    );
  },
});

// ── Legacy alias for backward compatibility ───────────────────────────────────

export const listPendingFlags = query({
  args: {},

  handler: async (ctx) => {
    await assertAdmin(ctx);

    const flags = await ctx.db
      .query("contentFlags")
      .withIndex("by_resolved", (q) => q.eq("resolved", false))
      .collect();

    return await Promise.all(
      flags.map(async (flag) => {
        const [reporter] = await Promise.all([ctx.db.get(flag.reportedBy)]);

        let publication: FlagPublicationSummary | null = null;

        if (flag.publicationId) {
          const pub = await ctx.db.get(flag.publicationId);

          publication = pub
            ? {
                _id: pub._id,
                title: pub.title,
                type: pub.type,
                authorId: pub.authorId,
              }
            : null;
        }

        return {
          ...flag,
          publication,
          reporter: reporter
            ? {
                name: reporter.name,
                email: reporter.email,
              }
            : null,
        };
      }),
    );
  },
});

export const resolveFlag = mutation({
  args: {
    flagId: v.id("contentFlags"),

    action: v.union(
      v.literal("dismiss"),
      v.literal("remove_publication"),
      v.literal("hide_publication"),
      v.literal("remove_comment"),
    ),
  },

  handler: async (ctx, args) => {
    const adminId = await assertAdmin(ctx);

    const flag = await ctx.db.get(args.flagId);

    if (!flag) {
      throw new ConvexError({
        message: "Signalement introuvable",
        code: "NOT_FOUND",
      });
    }

    if (args.action === "remove_publication" && flag.publicationId) {
      await ctx.db.delete(flag.publicationId);
    } else if (args.action === "hide_publication" && flag.publicationId) {
      await ctx.db.patch(flag.publicationId, {
        isHidden: true,
      });
    } else if (args.action === "remove_comment" && flag.commentId) {
      await ctx.db.delete(flag.commentId);
    }

    await ctx.db.patch(args.flagId, {
      resolved: true,
      resolvedBy: adminId,
      resolvedAt: new Date().toISOString(),
    });
  },
});

// ── Bulk Actions ──────────────────────────────────────────────────────────────

export const bulkResolveFlags = mutation({
  args: {
    flagIds: v.array(v.id("contentFlags")),

    action: v.union(
      v.literal("dismiss"),
      v.literal("remove_publication"),
      v.literal("hide_publication"),
    ),
  },

  handler: async (ctx, args) => {
    const adminId = await assertAdmin(ctx);

    for (const flagId of args.flagIds) {
      const flag = await ctx.db.get(flagId);

      if (!flag || flag.resolved) {
        continue;
      }

      if (args.action === "remove_publication" && flag.publicationId) {
        await ctx.db.delete(flag.publicationId);
      } else if (args.action === "hide_publication" && flag.publicationId) {
        await ctx.db.patch(flag.publicationId, {
          isHidden: true,
        });
      }

      await ctx.db.patch(flagId, {
        resolved: true,
        resolvedBy: adminId,
        resolvedAt: new Date().toISOString(),
      });
    }
  },
});

export const bulkBanAuthors = mutation({
  args: {
    flagIds: v.array(v.id("contentFlags")),
  },

  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    const bannedIds = new Set<string>();

    for (const flagId of args.flagIds) {
      const flag = await ctx.db.get(flagId);

      if (!flag) {
        continue;
      }

      let authorId: Id<"users"> | null = null;

      if (flag.publicationId) {
        const pub = await ctx.db.get(flag.publicationId);

        if (pub) {
          authorId = pub.authorId;
        }
      } else if (flag.commentId) {
        const comment = await ctx.db.get(flag.commentId);

        if (comment) {
          authorId = comment.authorId;
        }
      }

      if (authorId && !bannedIds.has(authorId)) {
        await ctx.db.patch(authorId, {
          isBanned: true,
        });

        bannedIds.add(authorId);
      }
    }

    return bannedIds.size;
  },
});

// ── User report (public) ──────────────────────────────────────────────────────

export const flagPublication = mutation({
  args: {
    publicationId: v.id("publications"),

    reason: v.union(
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("fake"),
      v.literal("harassment"),
      v.literal("other"),
    ),

    note: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
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

    // Prevent duplicate flags from same user
    const existing = await ctx.db
      .query("contentFlags")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .collect();

    if (existing.some((f) => f.reportedBy === user._id && !f.resolved)) {
      throw new ConvexError({
        message: "Vous avez déjà signalé cette publication",
        code: "CONFLICT",
      });
    }

    await ctx.db.insert("contentFlags", {
      publicationId: args.publicationId,
      contentType: "publication",
      reportedBy: user._id,
      reason: args.reason,
      note: args.note,
      resolved: false,
    });

    // Increment flagCount and auto-hide at 3+
    const pub = await ctx.db.get(args.publicationId);

    if (pub) {
      const newCount = (pub.flagCount ?? 0) + 1;
      const shouldHide = newCount >= 3;

      await ctx.db.patch(args.publicationId, {
        flagCount: newCount,
        ...(shouldHide ? { isHidden: true } : {}),
      });
    }
  },
});

export const flagComment = mutation({
  args: {
    commentId: v.id("comments"),

    reason: v.union(
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("fake"),
      v.literal("harassment"),
      v.literal("other"),
    ),

    note: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
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

    // Prevent duplicate flags
    const existing = await ctx.db
      .query("contentFlags")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();

    if (existing.some((f) => f.reportedBy === user._id && !f.resolved)) {
      throw new ConvexError({
        message: "Vous avez déjà signalé ce commentaire",
        code: "CONFLICT",
      });
    }

    await ctx.db.insert("contentFlags", {
      commentId: args.commentId,
      contentType: "comment",
      reportedBy: user._id,
      reason: args.reason,
      note: args.note,
      resolved: false,
    });
  },
});

// ── Hide / Unhide publication ────────────────────────────────────────────────

export const hidePublication = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    await ctx.db.patch(args.publicationId, {
      isHidden: true,
    });
  },
});

export const unhidePublication = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    await assertAdmin(ctx);

    await ctx.db.patch(args.publicationId, {
      isHidden: false,
    });
  },
});

// ── List Publications (admin content tab) ────────────────────────────────────

export const listPublications = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      _id: Id<"publications">;
      _creationTime: number;
      title: string;
      type: string;
      status: string;
      likeCount: number;
      viewCount: number;
      flagCount: number;
      isHidden: boolean;
    }>
  > => {
    await assertAdmin(ctx);

    const pubs = await ctx.db
      .query("publications")
      .order("desc")
      .take(args.limit ?? 50);

    return pubs.map((p) => ({
      _id: p._id,
      _creationTime: p._creationTime,
      title: p.title,
      type: p.type,
      status: p.status,
      likeCount: p.likeCount,
      viewCount: p.viewCount,
      flagCount: p.flagCount ?? 0,
      isHidden: p.isHidden ?? false,
    }));
  },
});

// ── Check if current user is admin ───────────────────────────────────────────

export const isAdmin = query({
  args: {},

  handler: async (ctx): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    return user?.isAdmin === true;
  },
});

// ── Internal: auto-hide via scheduled job ────────────────────────────────────

export const autoHidePublication = internalMutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    const pub = await ctx.db.get(args.publicationId);

    if (pub && (pub.flagCount ?? 0) >= 3 && !pub.isHidden) {
      await ctx.db.patch(args.publicationId, {
        isHidden: true,
      });
    }
  },
});
