import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api.js";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

// ============================================================================
// Types publics
// ============================================================================

type PublicLocation = {
  city?: string;
  country?: string;
  province?: string;
};

type PublicSocialLinks = {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
  telegram?: string;
};

type PublicProfileStats = {
  followerCount: number;
  followingCount: number;
  publicationCount: number;
};

type PublicProfile = {
  _id: Id<"users">;
  name: string;
  slug?: string;
  avatar?: string;
  coverUrl?: string;
  bio?: string;
  roles: string[];
  publicLocation?: PublicLocation;
  website?: string;
  headline?: string;
  availability?: "available" | "limited" | "unavailable";
  verified: boolean;
  reputationScore: number;
  socialLinks?: PublicSocialLinks;
  stats: PublicProfileStats;
  isFollowedByMe: boolean;
};

type PublicUserCard = {
  _id: Id<"users">;
  name: string;
  slug?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  country?: string;
  province?: string;
};

type FollowStats = {
  followerCount: number;
  followingCount: number;
};

// ============================================================================
// Constantes
// ============================================================================

const MAX_LIST_LIMIT = 100;
const DEFAULT_LIST_LIMIT = 50;

const MAX_SUGGESTION_CANDIDATES = 50;
const MAX_SUGGESTIONS = 10;

const MAX_PUBLIC_PUBLICATIONS = 20;
const MAX_COUNT_SCAN = 1000;

// ============================================================================
// Helpers
// ============================================================================

function toPublicUserCard(user: Doc<"users">): PublicUserCard {
  return {
    _id: user._id,
    name: user.name,
    slug: user.slug,
    avatar: user.avatar,
    bio: user.bio,
    city: user.city,
    country: user.country,
    province: user.location?.province,
  };
}

async function resolveStorageUrl(
  ctx: {
    storage: {
      getUrl: (storageId: Id<"_storage">) => Promise<string | null>;
    };
  },
  storageId: Id<"_storage"> | undefined,
): Promise<string | undefined> {
  if (!storageId) {
    return undefined;
  }

  return (await ctx.storage.getUrl(storageId)) ?? undefined;
}

// ============================================================================
// PUBLIC PROFILE
// ============================================================================

export const getPublicProfile = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args): Promise<PublicProfile | null> => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return null;
    }

    const [networkProfile, followers, following, publications] =
      await Promise.all([
        ctx.db
          .query("networkProfiles")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .unique(),

        ctx.db
          .query("follows")
          .withIndex("by_following", (q) => q.eq("followingId", args.userId))
          .take(MAX_COUNT_SCAN),

        ctx.db
          .query("follows")
          .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
          .take(MAX_COUNT_SCAN),

        ctx.db
          .query("publications")
          .withIndex("by_author", (q) => q.eq("authorId", args.userId))
          .take(MAX_COUNT_SCAN),
      ]);

    const identity = await ctx.auth.getUserIdentity();

    let isFollowedByMe = false;

    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();

      if (currentUser && currentUser._id !== args.userId) {
        // Important:
        // Une relation "follows" peut avoir des doublons historiques.
        // first() ne lève pas d'erreur dans ce cas.
        const existingFollow = await ctx.db
          .query("follows")
          .withIndex("by_follower_and_following", (q) =>
            q.eq("followerId", currentUser._id).eq("followingId", args.userId),
          )
          .first();

        isFollowedByMe = existingFollow !== null;
      }
    }

    const coverUrl = await resolveStorageUrl(ctx, user.coverImage);

    const publicLocation: PublicLocation | undefined =
      user.location?.city || user.location?.country || user.location?.province
        ? {
            city: user.location?.city,
            country: user.location?.country,
            province: user.location?.province,
          }
        : user.city || user.country
          ? {
              city: user.city,
              country: user.country,
              province: user.location?.province,
            }
          : undefined;

    const publicationCount =
      publications.length === MAX_COUNT_SCAN
        ? MAX_COUNT_SCAN
        : publications.length;

    return {
      _id: user._id,
      name: user.name,
      slug: user.slug,
      avatar: user.avatar,
      coverUrl,
      bio: user.bio,
      roles: user.roles,
      publicLocation,
      website: networkProfile?.website ?? user.website,
      headline: networkProfile?.headline,
      availability: networkProfile?.availability,
      verified: networkProfile?.verified === true,
      reputationScore: networkProfile?.reputationScore ?? user.reputationScore,
      socialLinks: networkProfile?.socialLinks,
      stats: {
        followerCount: followers.length,
        followingCount: following.length,
        publicationCount,
      },
      isFollowedByMe,
    };
  },
});

// ============================================================================
// PUBLICATIONS PUBLIQUES
// ============================================================================

export const getPublicPublications = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args): Promise<Doc<"publications">[]> => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return [];
    }

    return ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .take(MAX_PUBLIC_PUBLICATIONS);
  },
});

// ============================================================================
// FOLLOW / UNFOLLOW
// ============================================================================

export const toggleFollow = mutation({
  args: {
    targetUserId: v.id("users"),
  },

  handler: async (ctx, args): Promise<boolean> => {
    // ------------------------------------------------------------------------
    // Authentification canonique Convex
    // ------------------------------------------------------------------------

    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Connexion requise",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    // ------------------------------------------------------------------------
    // Validation cible
    // ------------------------------------------------------------------------

    if (currentUser._id === args.targetUserId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Vous ne pouvez pas vous suivre vous-même",
      });
    }

    const targetUser = await ctx.db.get(args.targetUserId);

    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur cible introuvable",
      });
    }

    if (targetUser.isBanned === true) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Ce profil n'est pas disponible",
      });
    }

    // ------------------------------------------------------------------------
    // Recherche relation(s) existante(s)
    //
    // On utilise collect() volontairement :
    // - aucun crash si des doublons historiques existent ;
    // - tous les doublons sont supprimés lors de l'unfollow ;
    // - la relation revient ainsi progressivement à un état propre.
    // ------------------------------------------------------------------------

    const existingFollows = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q
          .eq("followerId", currentUser._id)
          .eq("followingId", args.targetUserId),
      )
      .collect();

    // ------------------------------------------------------------------------
    // UNFOLLOW
    // ------------------------------------------------------------------------

    if (existingFollows.length > 0) {
      for (const follow of existingFollows) {
        await ctx.db.delete(follow._id);
      }

      return false;
    }

    // ------------------------------------------------------------------------
    // FOLLOW
    // ------------------------------------------------------------------------

    await ctx.db.insert("follows", {
      followerId: currentUser._id,
      followingId: args.targetUserId,
    });

    // ------------------------------------------------------------------------
    // Notification
    // ------------------------------------------------------------------------

    await ctx.scheduler.runAfter(0, internal.notifications.createSocial, {
      toUserId: args.targetUserId,
      fromUserId: currentUser._id,
      type: "follow",
      fromUserName: currentUser.name,
      fromUserAvatar: currentUser.avatar,
      title: `${currentUser.name || "Quelqu'un"} vous suit`,
      body: "Un nouvel abonné a rejoint votre réseau.",
      actionPage: "profile",
    });

    return true;
  },
});

// ============================================================================
// FOLLOWERS
// ============================================================================

export const getFollowers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args): Promise<PublicUserCard[]> => {
    const requestedLimit = args.limit ?? DEFAULT_LIST_LIMIT;

    const limit = Math.min(
      Math.max(Math.floor(requestedLimit), 1),
      MAX_LIST_LIMIT,
    );

    const targetUser = await ctx.db.get(args.userId);

    if (!targetUser || targetUser.isBanned === true) {
      return [];
    }

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .order("desc")
      .take(limit);

    const users = await Promise.all(
      follows.map((follow) => ctx.db.get(follow.followerId)),
    );

    return users
      .filter(
        (user): user is Doc<"users"> => user !== null && user.isBanned !== true,
      )
      .map(toPublicUserCard);
  },
});

// ============================================================================
// FOLLOWING
// ============================================================================

export const getFollowing = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args): Promise<PublicUserCard[]> => {
    const requestedLimit = args.limit ?? DEFAULT_LIST_LIMIT;

    const limit = Math.min(
      Math.max(Math.floor(requestedLimit), 1),
      MAX_LIST_LIMIT,
    );

    const targetUser = await ctx.db.get(args.userId);

    if (!targetUser || targetUser.isBanned === true) {
      return [];
    }

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .order("desc")
      .take(limit);

    const users = await Promise.all(
      follows.map((follow) => ctx.db.get(follow.followingId)),
    );

    return users
      .filter(
        (user): user is Doc<"users"> => user !== null && user.isBanned !== true,
      )
      .map(toPublicUserCard);
  },
});

// ============================================================================
// SUGGESTIONS
// ============================================================================

export const getSuggestedUsers = query({
  args: {},

  handler: async (ctx): Promise<PublicUserCard[]> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      return [];
    }

    const candidates = await ctx.db
      .query("users")
      .order("desc")
      .take(MAX_SUGGESTION_CANDIDATES);

    const suggestions: PublicUserCard[] = [];

    for (const candidate of candidates) {
      if (suggestions.length >= MAX_SUGGESTIONS) {
        break;
      }

      if (candidate._id === currentUser._id) {
        continue;
      }

      if (candidate.isBanned === true) {
        continue;
      }

      // first() au lieu de unique() :
      // les doublons historiques ne peuvent plus faire tomber la query.
      const existingFollow = await ctx.db
        .query("follows")
        .withIndex("by_follower_and_following", (q) =>
          q.eq("followerId", currentUser._id).eq("followingId", candidate._id),
        )
        .first();

      if (existingFollow) {
        continue;
      }

      suggestions.push(toPublicUserCard(candidate));
    }

    return suggestions;
  },
});

// ============================================================================
// MES STATISTIQUES
// ============================================================================

export const getMyFollowStats = query({
  args: {},

  handler: async (ctx): Promise<FollowStats | null> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null;
    }

    const [followers, following] = await Promise.all([
      ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", user._id))
        .take(MAX_COUNT_SCAN),

      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", user._id))
        .take(MAX_COUNT_SCAN),
    ]);

    return {
      followerCount: followers.length,
      followingCount: following.length,
    };
  },
});
