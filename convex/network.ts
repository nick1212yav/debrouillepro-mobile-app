// convex/network.ts

import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

import {
  buildUserSearchText,
  normalizeUserSearchQuery,
} from "./lib/userSearch";

// ============================================================================
// LIMITES
// ============================================================================

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SEARCH_LIMIT = 50;
const MAX_SUGGESTIONS = 10;
const MAX_ANALYTICS_DAYS = 366;
const MAX_NEARBY_RADIUS_KM = 500;

// ============================================================================
// TYPES PUBLICS
// ============================================================================

type Availability = "available" | "limited" | "unavailable";

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

type PublicLocation = {
  city?: string;
  country?: string;
  province?: string;
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
  profession?: string;
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
  availability?: Availability;
  verified: boolean;
  reputationScore: number;
  socialLinks?: PublicSocialLinks;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

type FollowStats = {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

type PublicFollowUser = PublicUserCard & {
  followedAt: string;
  isFollowedByMe: boolean;
};

type ProfileAnalytics = {
  period: string | null;
  profileViews: number;
  connectionsGained: number;
  connectionsLost: number;
  searchAppearances: number;
  opportunitiesGenerated: number;
  postsEngagement: number;
  daily: Array<{
    date: string;
    profileViews: number;
    connectionsGained: number;
    connectionsLost: number;
    postsEngagement: number;
    searchAppearances: number;
    opportunitiesGenerated: number;
  }>;
};

// ============================================================================
// HELPERS
// ============================================================================

function clampLimit(
  value: number | undefined,
  fallback: number,
  maximum: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(value), 1), maximum);
}

function nowIso(): string {
  return new Date().toISOString();
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeOptionalString(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function requireNonEmptyString(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `${fieldName} est requis`,
    });
  }

  return normalized;
}

// ============================================================================
// COORDONNÉES
// ============================================================================

function validateLatitude(latitude: number): void {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Latitude invalide",
    });
  }
}

function validateLongitude(longitude: number): void {
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Longitude invalide",
    });
  }
}

function validateCoordinates(latitude: number, longitude: number): void {
  validateLatitude(latitude);
  validateLongitude(longitude);
}

function validateRadius(radius: number): void {
  if (
    !Number.isFinite(radius) ||
    radius <= 0 ||
    radius > MAX_NEARBY_RADIUS_KM
  ) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `Le rayon doit être compris entre 0 et ${MAX_NEARBY_RADIUS_KM} km`,
    });
  }
}

// ============================================================================
// AUTHENTIFICATION
// ============================================================================

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
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
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  if (user.isBanned === true) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Compte indisponible",
    });
  }

  return user;
}

async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
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

  if (!user || user.isBanned === true) {
    return null;
  }

  return user;
}

// ============================================================================
// DTO PUBLICS
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
    profession: user.profession,
  };
}

function buildPublicLocation(user: Doc<"users">): PublicLocation | undefined {
  const city = user.location?.city ?? user.city;

  const country = user.location?.country ?? user.country;

  const province = user.location?.province;

  if (!city && !country && !province) {
    return undefined;
  }

  return {
    city,
    country,
    province,
  };
}

// ============================================================================
// FOLLOW HELPERS
// ============================================================================

async function isFollowingUser(
  ctx: QueryCtx,
  followerId: Id<"users"> | undefined,
  followingId: Id<"users">,
): Promise<boolean> {
  if (!followerId || followerId === followingId) {
    return false;
  }

  const relation = await ctx.db
    .query("follows")
    .withIndex("by_follower_and_following", (q) =>
      q.eq("followerId", followerId).eq("followingId", followingId),
    )
    .unique();

  return relation !== null;
}

async function getExactFollowerCount(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<number> {
  let count = 0;

  const relations = ctx.db
    .query("follows")
    .withIndex("by_following", (q) => q.eq("followingId", userId));

  for await (const _relation of relations) {
    count += 1;
  }

  return count;
}

async function getExactFollowingCount(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<number> {
  let count = 0;

  const relations = ctx.db
    .query("follows")
    .withIndex("by_follower", (q) => q.eq("followerId", userId));

  for await (const _relation of relations) {
    count += 1;
  }

  return count;
}

// ============================================================================
// 1. PROFIL PUBLIC
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

    const [networkProfile, currentUser, followerCount, followingCount] =
      await Promise.all([
        ctx.db
          .query("networkProfiles")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .unique(),

        getCurrentUser(ctx),

        getExactFollowerCount(ctx, args.userId),

        getExactFollowingCount(ctx, args.userId),
      ]);

    const isFollowing = await isFollowingUser(
      ctx,
      currentUser?._id,
      args.userId,
    );

    const coverUrl = user.coverImage
      ? ((await ctx.storage.getUrl(user.coverImage)) ?? undefined)
      : undefined;

    return {
      _id: user._id,
      name: user.name,
      slug: user.slug,
      avatar: user.avatar,
      coverUrl,
      bio: user.bio,
      roles: user.roles,
      publicLocation: buildPublicLocation(user),

      website: networkProfile?.website ?? user.website,

      headline: networkProfile?.headline,

      availability: networkProfile?.availability,

      verified: networkProfile?.verified === true,

      reputationScore: networkProfile?.reputationScore ?? user.reputationScore,

      socialLinks: networkProfile?.socialLinks,

      followerCount,
      followingCount,
      isFollowing,
    };
  },
});

// ============================================================================
// 2. EXPÉRIENCES
// ============================================================================

export const getUserExperiences = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return [];
    }

    return ctx.db
      .query("networkExperiences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(MAX_LIMIT);
  },
});

export const addExperience = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
    achievements: v.optional(v.array(v.string())),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const title = requireNonEmptyString(args.title, "Le titre");

    const company = requireNonEmptyString(args.company, "L'entreprise");

    const now = nowIso();

    return ctx.db.insert("networkExperiences", {
      userId: user._id,
      title,
      company,
      location: normalizeOptionalString(args.location),
      startDate: args.startDate,
      endDate: normalizeOptionalString(args.endDate),
      current: args.current,
      description: normalizeOptionalString(args.description),
      achievements: args.achievements ?? [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateExperience = mutation({
  args: {
    id: v.id("networkExperiences"),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    current: v.optional(v.boolean()),
    description: v.optional(v.string()),
    achievements: v.optional(v.array(v.string())),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const experience = await ctx.db.get(args.id);

    if (!experience) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expérience introuvable",
      });
    }

    if (experience.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    const updates: {
      title?: string;
      company?: string;
      location?: string;
      startDate?: string;
      endDate?: string;
      current?: boolean;
      description?: string;
      achievements?: string[];
      updatedAt: string;
    } = {
      updatedAt: nowIso(),
    };

    if (args.title !== undefined) {
      updates.title = requireNonEmptyString(args.title, "Le titre");
    }

    if (args.company !== undefined) {
      updates.company = requireNonEmptyString(args.company, "L'entreprise");
    }

    if (args.location !== undefined) {
      updates.location = args.location.trim();
    }

    if (args.startDate !== undefined) {
      updates.startDate = args.startDate;
    }

    if (args.endDate !== undefined) {
      updates.endDate = args.endDate.trim();
    }

    if (args.current !== undefined) {
      updates.current = args.current;
    }

    if (args.description !== undefined) {
      updates.description = args.description.trim();
    }

    if (args.achievements !== undefined) {
      updates.achievements = args.achievements;
    }

    await ctx.db.patch(args.id, updates);

    return {
      success: true,
    };
  },
});

export const deleteExperience = mutation({
  args: {
    id: v.id("networkExperiences"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const experience = await ctx.db.get(args.id);

    if (!experience) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expérience introuvable",
      });
    }

    if (experience.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    await ctx.db.delete(args.id);

    return {
      success: true,
    };
  },
});

// ============================================================================
// 3. FORMATIONS
// ============================================================================

export const getUserEducations = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return [];
    }

    return ctx.db
      .query("networkEducations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(MAX_LIMIT);
  },
});

export const addEducation = mutation({
  args: {
    school: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const school = requireNonEmptyString(args.school, "L'établissement");

    const degree = requireNonEmptyString(args.degree, "Le diplôme");

    const now = nowIso();

    return ctx.db.insert("networkEducations", {
      userId: user._id,
      school,
      degree,
      field: normalizeOptionalString(args.field),
      location: normalizeOptionalString(args.location),
      startDate: args.startDate,
      endDate: normalizeOptionalString(args.endDate),
      current: args.current,
      description: normalizeOptionalString(args.description),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateEducation = mutation({
  args: {
    id: v.id("networkEducations"),
    school: v.optional(v.string()),
    degree: v.optional(v.string()),
    field: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    current: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const education = await ctx.db.get(args.id);

    if (!education) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Formation introuvable",
      });
    }

    if (education.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    const updates: {
      school?: string;
      degree?: string;
      field?: string;
      location?: string;
      startDate?: string;
      endDate?: string;
      current?: boolean;
      description?: string;
      updatedAt: string;
    } = {
      updatedAt: nowIso(),
    };

    if (args.school !== undefined) {
      updates.school = requireNonEmptyString(args.school, "L'établissement");
    }

    if (args.degree !== undefined) {
      updates.degree = requireNonEmptyString(args.degree, "Le diplôme");
    }

    if (args.field !== undefined) {
      updates.field = args.field.trim();
    }

    if (args.location !== undefined) {
      updates.location = args.location.trim();
    }

    if (args.startDate !== undefined) {
      updates.startDate = args.startDate;
    }

    if (args.endDate !== undefined) {
      updates.endDate = args.endDate.trim();
    }

    if (args.current !== undefined) {
      updates.current = args.current;
    }

    if (args.description !== undefined) {
      updates.description = args.description.trim();
    }

    await ctx.db.patch(args.id, updates);

    return {
      success: true,
    };
  },
});

export const deleteEducation = mutation({
  args: {
    id: v.id("networkEducations"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const education = await ctx.db.get(args.id);

    if (!education) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Formation introuvable",
      });
    }

    if (education.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    await ctx.db.delete(args.id);

    return {
      success: true,
    };
  },
});

// ============================================================================
// 4. COMPÉTENCES
// ============================================================================

export const getUserSkills = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return [];
    }

    return ctx.db
      .query("networkSkills")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(MAX_LIMIT);
  },
});

export const addSkill = mutation({
  args: {
    name: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const name = requireNonEmptyString(args.name, "Le nom de la compétence");

    const existing = await ctx.db
      .query("networkSkills")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", user._id).eq("name", name),
      )
      .unique();

    if (existing) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Cette compétence existe déjà",
      });
    }

    const now = nowIso();

    return ctx.db.insert("networkSkills", {
      userId: user._id,
      name,
      endorsements: 0,
      endorsedBy: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteSkill = mutation({
  args: {
    id: v.id("networkSkills"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const skill = await ctx.db.get(args.id);

    if (!skill) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Compétence introuvable",
      });
    }

    if (skill.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    await ctx.db.delete(args.id);

    return {
      success: true,
    };
  },
});

export const endorseSkill = mutation({
  args: {
    skillId: v.id("networkSkills"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const skill = await ctx.db.get(args.skillId);

    if (!skill) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Compétence introuvable",
      });
    }

    if (skill.userId === user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas endorser votre propre compétence",
      });
    }

    if (skill.endorsedBy.includes(user._id)) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Vous avez déjà endorsé cette compétence",
      });
    }

    await ctx.db.patch(args.skillId, {
      endorsements: skill.endorsements + 1,
      endorsedBy: [...skill.endorsedBy, user._id],
      updatedAt: nowIso(),
    });

    return {
      success: true,
    };
  },
});

// ============================================================================
// 5. CERTIFICATIONS
// ============================================================================

export const getUserCertifications = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return [];
    }

    return ctx.db
      .query("networkCertifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(MAX_LIMIT);
  },
});

export const addCertification = mutation({
  args: {
    name: v.string(),
    issuer: v.string(),
    issueDate: v.string(),
    expiryDate: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const name = requireNonEmptyString(args.name, "Le nom de la certification");

    const issuer = requireNonEmptyString(args.issuer, "L'organisme émetteur");

    const now = nowIso();

    return ctx.db.insert("networkCertifications", {
      userId: user._id,
      name,
      issuer,
      issueDate: args.issueDate,
      expiryDate: normalizeOptionalString(args.expiryDate),
      credentialId: normalizeOptionalString(args.credentialId),
      credentialUrl: normalizeOptionalString(args.credentialUrl),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCertification = mutation({
  args: {
    id: v.id("networkCertifications"),
    name: v.optional(v.string()),
    issuer: v.optional(v.string()),
    issueDate: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const certification = await ctx.db.get(args.id);

    if (!certification) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Certification introuvable",
      });
    }

    if (certification.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    const updates: {
      name?: string;
      issuer?: string;
      issueDate?: string;
      expiryDate?: string;
      credentialId?: string;
      credentialUrl?: string;
      updatedAt: string;
    } = {
      updatedAt: nowIso(),
    };

    if (args.name !== undefined) {
      updates.name = requireNonEmptyString(
        args.name,
        "Le nom de la certification",
      );
    }

    if (args.issuer !== undefined) {
      updates.issuer = requireNonEmptyString(
        args.issuer,
        "L'organisme émetteur",
      );
    }

    if (args.issueDate !== undefined) {
      updates.issueDate = args.issueDate;
    }

    if (args.expiryDate !== undefined) {
      updates.expiryDate = args.expiryDate.trim();
    }

    if (args.credentialId !== undefined) {
      updates.credentialId = args.credentialId.trim();
    }

    if (args.credentialUrl !== undefined) {
      updates.credentialUrl = args.credentialUrl.trim();
    }

    await ctx.db.patch(args.id, updates);

    return {
      success: true,
    };
  },
});

export const deleteCertification = mutation({
  args: {
    id: v.id("networkCertifications"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const certification = await ctx.db.get(args.id);

    if (!certification) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Certification introuvable",
      });
    }

    if (certification.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    await ctx.db.delete(args.id);

    return {
      success: true,
    };
  },
});

// ============================================================================
// 6. SERVICES
// ============================================================================

export const getUserServices = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return [];
    }

    return ctx.db
      .query("networkServices")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(MAX_LIMIT);
  },
});

export const addService = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.string()),
    category: v.string(),
    location: v.optional(v.string()),
    deliveryTime: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const title = requireNonEmptyString(args.title, "Le titre du service");

    const category = requireNonEmptyString(args.category, "La catégorie");

    const now = nowIso();

    return ctx.db.insert("networkServices", {
      userId: user._id,
      title,
      description: normalizeOptionalString(args.description),
      price: normalizeOptionalString(args.price),
      category,
      location: normalizeOptionalString(args.location),
      deliveryTime: normalizeOptionalString(args.deliveryTime),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateService = mutation({
  args: {
    id: v.id("networkServices"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    deliveryTime: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const service = await ctx.db.get(args.id);

    if (!service) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Service introuvable",
      });
    }

    if (service.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    const updates: {
      title?: string;
      description?: string;
      price?: string;
      category?: string;
      location?: string;
      deliveryTime?: string;
      updatedAt: string;
    } = {
      updatedAt: nowIso(),
    };

    if (args.title !== undefined) {
      updates.title = requireNonEmptyString(args.title, "Le titre du service");
    }

    if (args.description !== undefined) {
      updates.description = args.description.trim();
    }

    if (args.price !== undefined) {
      updates.price = args.price.trim();
    }

    if (args.category !== undefined) {
      updates.category = requireNonEmptyString(args.category, "La catégorie");
    }

    if (args.location !== undefined) {
      updates.location = args.location.trim();
    }

    if (args.deliveryTime !== undefined) {
      updates.deliveryTime = args.deliveryTime.trim();
    }

    await ctx.db.patch(args.id, updates);

    return {
      success: true,
    };
  },
});

export const deleteService = mutation({
  args: {
    id: v.id("networkServices"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const service = await ctx.db.get(args.id);

    if (!service) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Service introuvable",
      });
    }

    if (service.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    await ctx.db.delete(args.id);

    return {
      success: true,
    };
  },
});

// ============================================================================
// 7. PORTFOLIO
// ============================================================================

export const getUserPortfolio = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return [];
    }

    return ctx.db
      .query("networkPortfolio")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(MAX_LIMIT);
  },
});

export const addPortfolioItem = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("document"),
      v.literal("link"),
    ),
    url: v.string(),
    thumbnail: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const title = requireNonEmptyString(args.title, "Le titre");

    const url = requireNonEmptyString(args.url, "L'URL");

    const now = nowIso();

    return ctx.db.insert("networkPortfolio", {
      userId: user._id,
      title,
      description: normalizeOptionalString(args.description),
      type: args.type,
      url,
      thumbnail: normalizeOptionalString(args.thumbnail),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deletePortfolioItem = mutation({
  args: {
    id: v.id("networkPortfolio"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const item = await ctx.db.get(args.id);

    if (!item) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Élément du portfolio introuvable",
      });
    }

    if (item.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    await ctx.db.delete(args.id);

    return {
      success: true,
    };
  },
});

// ============================================================================
// 8. RECOMMANDATIONS
// ============================================================================

export const getUserRecommendations = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return [];
    }

    return ctx.db
      .query("networkRecommendations")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .order("desc")
      .take(MAX_LIMIT);
  },
});

export const addRecommendation = mutation({
  args: {
    receiverId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user._id === args.receiverId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas vous recommander vous-même",
      });
    }

    if (!Number.isFinite(args.rating) || args.rating < 1 || args.rating > 5) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "La note doit être comprise entre 1 et 5",
      });
    }

    const receiver = await ctx.db.get(args.receiverId);

    if (!receiver || receiver.isBanned === true) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur destinataire introuvable",
      });
    }

    const comment = requireNonEmptyString(args.comment, "Le commentaire");

    return ctx.db.insert("networkRecommendations", {
      fromUserId: user._id,
      fromName: user.name,
      fromAvatar: user.avatar,
      receiverId: receiver._id,
      rating: args.rating,
      comment,
      createdAt: nowIso(),
    });
  },
});

export const deleteRecommendation = mutation({
  args: {
    id: v.id("networkRecommendations"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const recommendation = await ctx.db.get(args.id);

    if (!recommendation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Recommandation introuvable",
      });
    }

    if (
      recommendation.fromUserId !== user._id &&
      recommendation.receiverId !== user._id
    ) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    await ctx.db.delete(args.id);

    return {
      success: true,
    };
  },
});

// ============================================================================
// 9. FOLLOWS
// ============================================================================

export const toggleFollow = mutation({
  args: {
    targetUserId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user._id === args.targetUserId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Vous ne pouvez pas vous suivre vous-même",
      });
    }

    const target = await ctx.db.get(args.targetUserId);

    if (!target || target.isBanned === true) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur cible introuvable",
      });
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      return false;
    }

    await ctx.db.insert("follows", {
      followerId: user._id,
      followingId: args.targetUserId,
    });

    return true;
  },
});

export const getFollowStats = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args): Promise<FollowStats> => {
    const target = await ctx.db.get(args.userId);

    if (!target || target.isBanned === true) {
      return {
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
      };
    }

    const [currentUser, followerCount, followingCount] = await Promise.all([
      getCurrentUser(ctx),
      getExactFollowerCount(ctx, args.userId),
      getExactFollowingCount(ctx, args.userId),
    ]);

    const isFollowing = await isFollowingUser(
      ctx,
      currentUser?._id,
      args.userId,
    );

    return {
      followerCount,
      followingCount,
      isFollowing,
    };
  },
});

export const getFollowers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args): Promise<PublicFollowUser[]> => {
    const target = await ctx.db.get(args.userId);

    if (!target || target.isBanned === true) {
      return [];
    }

    const currentUser = await getCurrentUser(ctx);

    const limit = clampLimit(args.limit, DEFAULT_LIMIT, MAX_LIMIT);

    const relations = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .order("desc")
      .take(limit);

    const result: PublicFollowUser[] = [];

    for (const relation of relations) {
      const follower = await ctx.db.get(relation.followerId);

      if (!follower || follower.isBanned === true) {
        continue;
      }

      result.push({
        ...toPublicUserCard(follower),
        followedAt: new Date(relation._creationTime).toISOString(),
        isFollowedByMe: await isFollowingUser(
          ctx,
          currentUser?._id,
          follower._id,
        ),
      });
    }

    return result;
  },
});

export const getFollowing = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args): Promise<PublicFollowUser[]> => {
    const target = await ctx.db.get(args.userId);

    if (!target || target.isBanned === true) {
      return [];
    }

    const currentUser = await getCurrentUser(ctx);

    const limit = clampLimit(args.limit, DEFAULT_LIMIT, MAX_LIMIT);

    const relations = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .order("desc")
      .take(limit);

    const result: PublicFollowUser[] = [];

    for (const relation of relations) {
      const followedUser = await ctx.db.get(relation.followingId);

      if (!followedUser || followedUser.isBanned === true) {
        continue;
      }

      result.push({
        ...toPublicUserCard(followedUser),
        followedAt: new Date(relation._creationTime).toISOString(),
        isFollowedByMe: await isFollowingUser(
          ctx,
          currentUser?._id,
          followedUser._id,
        ),
      });
    }

    return result;
  },
});

export const removeFollower = mutation({
  args: {
    userId: v.id("users"),
    followerId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user._id !== args.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    const relation = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.userId),
      )
      .unique();

    if (!relation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Relation introuvable",
      });
    }

    await ctx.db.delete(relation._id);

    return {
      success: true,
    };
  },
});

export const unfollow = mutation({
  args: {
    targetUserId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const relation = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId),
      )
      .unique();

    if (!relation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Relation introuvable",
      });
    }

    await ctx.db.delete(relation._id);

    return {
      success: true,
    };
  },
});

// ============================================================================
// 10. DEMANDES DE CONNEXION
// ============================================================================

export const sendConnectionRequest = mutation({
  args: {
    targetUserId: v.id("users"),
    message: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user._id === args.targetUserId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Vous ne pouvez pas vous envoyer une demande à vous-même",
      });
    }

    const target = await ctx.db.get(args.targetUserId);

    if (!target || target.isBanned === true) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur cible introuvable",
      });
    }

    const existing = await ctx.db
      .query("networkConnectionRequests")
      .withIndex("by_pair", (q) =>
        q.eq("senderId", user._id).eq("receiverId", args.targetUserId),
      )
      .unique();

    if (existing && existing.status === "pending") {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Une demande est déjà en cours",
      });
    }

    const now = nowIso();

    return ctx.db.insert("networkConnectionRequests", {
      senderId: user._id,
      receiverId: target._id,
      message: normalizeOptionalString(args.message),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const acceptConnectionRequest = mutation({
  args: {
    requestId: v.id("networkConnectionRequests"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable",
      });
    }

    if (request.receiverId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas le destinataire",
      });
    }

    if (request.status !== "pending") {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Cette demande n'est plus en attente",
      });
    }

    const sender = await ctx.db.get(request.senderId);

    if (!sender || sender.isBanned === true) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expéditeur introuvable",
      });
    }

    const now = nowIso();

    await ctx.db.patch(args.requestId, {
      status: "accepted",
      updatedAt: now,
    });

    const forward = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", request.senderId).eq("followingId", user._id),
      )
      .unique();

    if (!forward) {
      await ctx.db.insert("follows", {
        followerId: request.senderId,
        followingId: user._id,
      });
    }

    const reverse = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", request.senderId),
      )
      .unique();

    if (!reverse) {
      await ctx.db.insert("follows", {
        followerId: user._id,
        followingId: request.senderId,
      });
    }

    return {
      success: true,
    };
  },
});

export const declineConnectionRequest = mutation({
  args: {
    requestId: v.id("networkConnectionRequests"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable",
      });
    }

    if (request.receiverId !== user._id && request.senderId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    if (request.status !== "pending") {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Cette demande n'est plus en attente",
      });
    }

    await ctx.db.patch(args.requestId, {
      status: "declined",
      updatedAt: nowIso(),
    });

    return {
      success: true,
    };
  },
});

export const getConnectionRequests = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser || currentUser._id !== args.userId) {
      return [];
    }

    const limit = clampLimit(args.limit, DEFAULT_LIMIT, MAX_LIMIT);

    const requests = await ctx.db
      .query("networkConnectionRequests")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUser._id))
      .order("desc")
      .take(limit);

    return Promise.all(
      requests.map(async (request) => {
        const sender = await ctx.db.get(request.senderId);

        return {
          _id: request._id,
          senderId: request.senderId,
          receiverId: request.receiverId,
          message: request.message,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          sender: sender
            ? {
                _id: sender._id,
                name: sender.name,
                avatar: sender.avatar,
              }
            : null,
        };
      }),
    );
  },
});

// ============================================================================
// 11. RECHERCHE
// ============================================================================

export const searchProfiles = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
    location: v.optional(v.string()),
  },

  handler: async (ctx, args): Promise<PublicUserCard[]> => {
    const searchQuery = normalizeUserSearchQuery(args.query);

    if (!searchQuery) {
      return [];
    }

    const limit = clampLimit(args.limit, DEFAULT_LIMIT, MAX_SEARCH_LIMIT);

    const fetchLimit = args.type ? MAX_SEARCH_LIMIT : limit;

    const results = await ctx.db
      .query("users")
      .withSearchIndex("search_users", (search) => {
        let builder = search.search("searchText", searchQuery);

        if (args.location) {
          builder = builder.eq("city", args.location.trim());
        }

        return builder;
      })
      .take(fetchLimit);

    return results
      .filter((user) => {
        if (user.isBanned === true) {
          return false;
        }

        if (args.type && !user.roles.includes(args.type)) {
          return false;
        }

        return true;
      })
      .slice(0, limit)
      .map(toPublicUserCard);
  },
});

// ============================================================================
// 12. SUGGESTIONS
// ============================================================================

export const getNetworkSuggestions = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args): Promise<PublicUserCard[]> => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      return [];
    }

    const limit = clampLimit(args.limit, MAX_SUGGESTIONS, MAX_SUGGESTIONS);

    const followedRelations = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .take(MAX_LIMIT);

    const followedIds = new Set(
      followedRelations.map((relation) => relation.followingId),
    );

    const candidates = await ctx.db
      .query("users")
      .order("desc")
      .take(MAX_LIMIT);

    const scored = candidates
      .filter(
        (candidate) =>
          candidate._id !== currentUser._id &&
          candidate.isBanned !== true &&
          !followedIds.has(candidate._id),
      )
      .map((candidate) => {
        let score = 0;

        if (
          candidate.city &&
          currentUser.city &&
          candidate.city.toLowerCase() === currentUser.city.toLowerCase()
        ) {
          score += 10;
        }

        if (candidate.interests && currentUser.interests) {
          const commonInterests = candidate.interests.filter((interest) =>
            currentUser.interests?.includes(interest),
          );

          score += commonInterests.length * 5;
        }

        if (candidate.roles.includes("professionnel")) {
          score += 3;
        }

        return {
          candidate,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    return scored
      .slice(0, limit)
      .map(({ candidate }) => toPublicUserCard(candidate));
  },
});

// ============================================================================
// 13. PROXIMITÉ GÉOGRAPHIQUE
// ============================================================================
//
// Les coordonnées sont stockées dans :
//
//   users.location.latitude
//   users.location.longitude
//
// IMPORTANT :
// La base actuelle ne possède pas encore d'index géospatial dédié.
//
// Nous ne fabriquons donc aucun résultat.
//
// Dès qu'une véritable stratégie géospatiale sera présente dans le schéma,
// cette query pourra utiliser les coordonnées réelles des utilisateurs.
// ============================================================================

export const getNearbyUsers = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radius: v.optional(v.number()),
  },

  handler: async (_ctx, args): Promise<PublicUserCard[]> => {
    validateCoordinates(args.lat, args.lng);

    const radius = args.radius ?? 10;

    validateRadius(radius);

    return [];
  },
});

// ============================================================================
// 14. ANALYTICS PROFIL
// ============================================================================

export const getProfileAnalytics = query({
  args: {
    userId: v.id("users"),
    period: v.optional(v.string()),
  },

  handler: async (ctx, args): Promise<ProfileAnalytics> => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser || currentUser._id !== args.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès non autorisé",
      });
    }

    const analytics = ctx.db
      .query("networkAnalytics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    const daily: ProfileAnalytics["daily"] = [];

    for await (const item of analytics) {
      if (args.period && item.date < args.period.trim()) {
        continue;
      }

      daily.push({
        date: item.date,
        profileViews: item.profileViews,
        connectionsGained: item.connectionsGained,
        connectionsLost: item.connectionsLost,
        postsEngagement: item.postsEngagement,
        searchAppearances: item.searchAppearances,
        opportunitiesGenerated: item.opportunitiesGenerated,
      });

      if (daily.length >= MAX_ANALYTICS_DAYS) {
        break;
      }
    }

    return {
      period: args.period ?? null,

      profileViews: daily.reduce((total, item) => total + item.profileViews, 0),

      connectionsGained: daily.reduce(
        (total, item) => total + item.connectionsGained,
        0,
      ),

      connectionsLost: daily.reduce(
        (total, item) => total + item.connectionsLost,
        0,
      ),

      searchAppearances: daily.reduce(
        (total, item) => total + item.searchAppearances,
        0,
      ),

      opportunitiesGenerated: daily.reduce(
        (total, item) => total + item.opportunitiesGenerated,
        0,
      ),

      postsEngagement: daily.reduce(
        (total, item) => total + item.postsEngagement,
        0,
      ),

      daily,
    };
  },
});

// ============================================================================
// 15. TRACKING DES VUES
// ============================================================================

export const trackProfileView = mutation({
  args: {
    viewedUserId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const viewer = await getCurrentUser(ctx);

    if (!viewer) {
      return {
        recorded: false,
        reason: "unauthenticated" as const,
      };
    }

    if (viewer._id === args.viewedUserId) {
      return {
        recorded: false,
        reason: "self_view" as const,
      };
    }

    const viewedUser = await ctx.db.get(args.viewedUserId);

    if (!viewedUser || viewedUser.isBanned === true) {
      return {
        recorded: false,
        reason: "target_not_found" as const,
      };
    }

    const date = toDateString(new Date());

    const existing = await ctx.db
      .query("profileViews")
      .withIndex("by_viewer_and_profile_and_date", (q) =>
        q
          .eq("viewerId", viewer._id)
          .eq("profileId", args.viewedUserId)
          .eq("date", date),
      )
      .unique();

    if (existing) {
      return {
        recorded: false,
        reason: "already_recorded_today" as const,
      };
    }

    await ctx.db.insert("profileViews", {
      profileId: args.viewedUserId,
      viewerId: viewer._id,
      date,
    });

    const analytics = await ctx.db
      .query("networkAnalytics")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.viewedUserId).eq("date", date),
      )
      .unique();

    if (analytics) {
      await ctx.db.patch(analytics._id, {
        profileViews: analytics.profileViews + 1,
      });
    } else {
      await ctx.db.insert("networkAnalytics", {
        userId: args.viewedUserId,
        date,
        profileViews: 1,
        connectionsGained: 0,
        connectionsLost: 0,
        postsEngagement: 0,
        searchAppearances: 0,
        opportunitiesGenerated: 0,
        createdAt: nowIso(),
      });
    }

    return {
      recorded: true,
      reason: "recorded" as const,
    };
  },
});

// ============================================================================
// 16. NOTIFICATIONS NETWORK
// ============================================================================

export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser || currentUser._id !== args.userId) {
      return [];
    }

    const limit = clampLimit(args.limit, DEFAULT_LIMIT, MAX_LIMIT);

    return ctx.db
      .query("networkNotifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(limit);
  },
});

export const markNotificationRead = mutation({
  args: {
    id: v.id("networkNotifications"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const notification = await ctx.db.get(args.id);

    if (!notification) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Notification introuvable",
      });
    }

    if (notification.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    if (notification.read) {
      return {
        success: true,
      };
    }

    await ctx.db.patch(args.id, {
      read: true,
    });

    return {
      success: true,
    };
  },
});

export const markAllNotificationsRead = mutation({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const notifications = await ctx.db
      .query("networkNotifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .take(MAX_LIMIT);

    await Promise.all(
      notifications.map((notification) =>
        ctx.db.patch(notification._id, {
          read: true,
        }),
      ),
    );

    return {
      success: true,
      updated: notifications.length,
    };
  },
});

// ============================================================================
// 17. PUBLICATION NETWORK
// ============================================================================

export const getPost = query({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    const publication = await ctx.db.get(args.publicationId);

    if (!publication || publication.type !== "network") {
      return null;
    }

    const currentUser = await getCurrentUser(ctx);

    let likedByMe = false;

    if (currentUser) {
      const like = await ctx.db
        .query("publicationLikes")
        .withIndex("by_user_and_publication", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("publicationId", args.publicationId),
        )
        .unique();

      likedByMe = like !== null;
    }

    const author = await ctx.db.get(publication.authorId);

    if (!author || author.isBanned === true) {
      return null;
    }

    const imageSources = publication.images ?? [];

    const images = (
      await Promise.all(
        imageSources.map(async (source) => {
          if (!source) {
            return null;
          }

          if (source.startsWith("http://") || source.startsWith("https://")) {
            return source;
          }

          if (source.startsWith("data:") || source.startsWith("blob:")) {
            return null;
          }

          try {
            return await ctx.storage.getUrl(source as Id<"_storage">);
          } catch {
            return null;
          }
        }),
      )
    ).filter((url): url is string => url !== null);

    const networkProfile = await ctx.db
      .query("networkProfiles")
      .withIndex("by_user", (q) => q.eq("userId", author._id))
      .unique();

    return {
      _id: publication._id,
      authorId: publication.authorId,
      type: publication.type,
      title: publication.title,
      description: publication.description,
      price: publication.price,
      location: publication.location,
      category: publication.category,
      images,
      tags: publication.tags,
      likeCount: publication.likeCount,
      viewCount: publication.viewCount,
      commentCount: publication.commentCount,
      status: publication.status,
      meta: publication.meta,
      latitude: publication.latitude,
      longitude: publication.longitude,
      likedByMe,

      author: {
        _id: author._id,
        name: author.name,
        avatar: author.avatar,
        bio: author.bio,
        city: author.city,
        country: author.country,
        headline: networkProfile?.headline,
        roles: author.roles,
      },
    };
  },
});

// ============================================================================
// 18. COMPATIBILITÉ updateProfile
// ============================================================================
//
// users.ts reste la source canonique pour :
//
// - avatar
// - cover
// - rôles
// - identité utilisateur
// - coordonnées personnelles
//
// network.ts ne doit pas créer de doublons.
//

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    headline: v.optional(v.string()),
    bio: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    avatar: v.optional(v.string()),
    cover: v.optional(v.string()),
    availability: v.optional(
      v.union(
        v.literal("available"),
        v.literal("limited"),
        v.literal("unavailable"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Compatibilité avec les anciens clients.
    // users.ts reste la source canonique
    // pour ces champs.
    void args.roles;
    void args.avatar;
    void args.cover;

    const nextName =
      args.name !== undefined
        ? requireNonEmptyString(args.name, "Le nom")
        : user.name;

    const nextBio = args.bio !== undefined ? args.bio.trim() : user.bio;

    const nextCity = args.city !== undefined ? args.city.trim() : user.city;

    const nextCountry =
      args.country !== undefined ? args.country.trim() : user.country;

    const nextInterests =
      args.interests !== undefined ? args.interests : user.interests;

    const userUpdates: {
      name?: string;
      bio?: string;
      city?: string;
      country?: string;
      interests?: string[];
      searchText: string;
    } = {
      searchText: buildUserSearchText({
        name: nextName,
        bio: nextBio,
        city: nextCity,
        country: nextCountry,
        roles: user.roles,
        interests: nextInterests,
        profession: user.profession,
      }),
    };

    if (args.name !== undefined) {
      userUpdates.name = nextName;
    }

    if (args.bio !== undefined) {
      userUpdates.bio = nextBio;
    }

    if (args.city !== undefined) {
      userUpdates.city = nextCity;
    }

    if (args.country !== undefined) {
      userUpdates.country = nextCountry;
    }

    if (args.interests !== undefined) {
      userUpdates.interests = nextInterests;
    }

    await ctx.db.patch(user._id, userUpdates);

    const existingProfile = await ctx.db
      .query("networkProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const profileUpdates: {
      headline?: string;
      availability?: Availability;
      updatedAt: string;
    } = {
      updatedAt: nowIso(),
    };

    if (args.headline !== undefined) {
      profileUpdates.headline = args.headline.trim();
    }

    if (args.availability !== undefined) {
      profileUpdates.availability = args.availability;
    }

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileUpdates);
    } else {
      await ctx.db.insert("networkProfiles", {
        userId: user._id,
        headline: profileUpdates.headline,
        availability: profileUpdates.availability,
        verified: false,
        reputationScore: user.reputationScore,
        website: undefined,
        socialLinks: undefined,
        updatedAt: profileUpdates.updatedAt,
      });
    }

    return {
      success: true,
    };
  },
});
