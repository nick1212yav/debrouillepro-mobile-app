import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

const MAX_URL_LENGTH = 2048;

const SOCIAL_NETWORKS = [
  "facebook",
  "twitter",
  "linkedin",
  "instagram",
  "youtube",
  "tiktok",
  "whatsapp",
  "telegram",
] as const;

type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

type SocialLinks = {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
  telegram?: string;
};

const ALLOWED_HOSTS: Record<SocialNetwork, readonly string[]> = {
  facebook: ["facebook.com", "www.facebook.com"],
  twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  instagram: ["instagram.com", "www.instagram.com"],
  youtube: ["youtube.com", "www.youtube.com", "youtu.be", "www.youtu.be"],
  tiktok: ["tiktok.com", "www.tiktok.com"],
  whatsapp: ["wa.me", "www.wa.me", "whatsapp.com", "www.whatsapp.com"],
  telegram: ["t.me", "www.t.me", "telegram.me", "www.telegram.me"],
};

function normalizeSocialUrl(value: string): string | undefined {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  if (normalized.length > MAX_URL_LENGTH) {
    throw new ConvexError({
      code: "VALIDATION_ERROR",
      message: "L'URL du réseau social est trop longue",
    });
  }

  let url: URL;

  try {
    url = new URL(normalized);
  } catch {
    throw new ConvexError({
      code: "VALIDATION_ERROR",
      message: "URL de réseau social invalide",
    });
  }

  if (url.protocol !== "https:") {
    throw new ConvexError({
      code: "VALIDATION_ERROR",
      message: "Les liens sociaux doivent utiliser HTTPS",
    });
  }

  /*
   * Les credentials et fragments ne font pas partie
   * d'un lien social public exploitable.
   */
  url.username = "";
  url.password = "";
  url.hash = "";

  return url.toString();
}

function validateSocialUrl(
  network: SocialNetwork,
  value: string,
): string | undefined {
  const normalized = normalizeSocialUrl(value);

  if (normalized === undefined) {
    return undefined;
  }

  const url = new URL(normalized);
  const hostname = url.hostname.toLowerCase();

  if (!ALLOWED_HOSTS[network].includes(hostname)) {
    throw new ConvexError({
      code: "VALIDATION_ERROR",
      message: `L'URL fournie ne correspond pas à ${network}`,
    });
  }

  return normalized;
}

function normalizePatch(
  args: Record<SocialNetwork, string | undefined>,
): SocialLinks {
  const result: SocialLinks = {};

  for (const network of SOCIAL_NETWORKS) {
    const value = args[network];

    if (value === undefined) {
      continue;
    }

    const validated = validateSocialUrl(network, value);

    if (validated !== undefined) {
      result[network] = validated;
    }
  }

  return result;
}

function hasSocialLinks(links: SocialLinks): boolean {
  return SOCIAL_NETWORKS.some((network) => links[network] !== undefined);
}

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

async function getNetworkProfile(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"networkProfiles"> | null> {
  const profiles = await ctx.db
    .query("networkProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(2);

  if (profiles.length > 1) {
    throw new ConvexError({
      code: "DATA_INTEGRITY_ERROR",
      message: "Plusieurs profils réseau existent pour cet utilisateur",
    });
  }

  return profiles[0] ?? null;
}

/**
 * Liens sociaux de l'utilisateur connecté.
 *
 * Aucun champ privé du profil utilisateur n'est exposé.
 */
export const getMySocialLinks = query({
  args: {},

  handler: async (ctx): Promise<SocialLinks> => {
    const user = await requireUser(ctx);
    const profile = await getNetworkProfile(ctx, user._id);

    return profile?.socialLinks ?? {};
  },
});

/**
 * Liens sociaux publics d'un utilisateur.
 *
 * Retourne uniquement socialLinks.
 */
export const getSocialLinks = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args): Promise<SocialLinks> => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.isBanned === true) {
      return {};
    }

    const profile = await getNetworkProfile(ctx, args.userId);

    return profile?.socialLinks ?? {};
  },
});

/**
 * Mise à jour partielle des liens sociaux.
 *
 * undefined = ne rien modifier
 * ""         = supprimer le lien
 * URL        = remplacer le lien après validation
 */
export const updateSocialLinks = mutation({
  args: {
    facebook: v.optional(v.string()),
    twitter: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    instagram: v.optional(v.string()),
    youtube: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    telegram: v.optional(v.string()),
  },

  handler: async (ctx, args): Promise<SocialLinks> => {
    const user = await requireUser(ctx);

    const profile = await getNetworkProfile(ctx, user._id);

    const currentLinks: SocialLinks = profile?.socialLinks ?? {};

    const patch = normalizePatch({
      facebook: args.facebook,
      twitter: args.twitter,
      linkedin: args.linkedin,
      instagram: args.instagram,
      youtube: args.youtube,
      tiktok: args.tiktok,
      whatsapp: args.whatsapp,
      telegram: args.telegram,
    });

    const nextLinks: SocialLinks = {
      ...currentLinks,
    };

    for (const network of SOCIAL_NETWORKS) {
      const requestedValue = args[network];

      if (requestedValue === undefined) {
        continue;
      }

      const validatedValue = patch[network];

      if (validatedValue === undefined) {
        delete nextLinks[network];
      } else {
        nextLinks[network] = validatedValue;
      }
    }

    const updatedAt = new Date().toISOString();

    if (profile) {
      await ctx.db.patch(profile._id, {
        socialLinks: hasSocialLinks(nextLinks) ? nextLinks : undefined,
        updatedAt,
      });
    } else if (hasSocialLinks(nextLinks)) {
      await ctx.db.insert("networkProfiles", {
        userId: user._id,
        socialLinks: nextLinks,
        updatedAt,
      });
    }

    return nextLinks;
  },
});
