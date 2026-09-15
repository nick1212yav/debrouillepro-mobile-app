import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Tu dois être connecté.",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "USER_NOT_FOUND",
      message: "Utilisateur introuvable.",
    });
  }

  return user;
}

// ──────────────────────────────────────────────────────────────────────────────
// QUERY — PRÉFÉRENCES DE CONFIDENTIALITÉ
// ──────────────────────────────────────────────────────────────────────────────

export const getPrivacySettings = query({
  args: {},

  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();

    /*
     * Valeurs par défaut compatibles avec l'ancienne PrivacyPage.
     *
     * Les nouveaux champs sont optionnels dans le schema afin de
     * ne pas casser les documents existants.
     */

    return {
      profilePublic: preferences?.profilePublic ?? true,

      showEmail: preferences?.showEmail ?? false,

      shareActivity: preferences?.shareActivity ?? true,

      analyticsConsent: preferences?.analyticsConsent ?? true,

      locationServices: preferences?.locationServices ?? true,

      thirdPartyAds: preferences?.thirdPartyAds ?? false,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// MUTATION — METTRE À JOUR UNE PRÉFÉRENCE
// ──────────────────────────────────────────────────────────────────────────────

export const updatePrivacySetting = mutation({
  args: {
    key: v.union(
      v.literal("profilePublic"),
      v.literal("showEmail"),
      v.literal("shareActivity"),
      v.literal("analyticsConsent"),
      v.literal("locationServices"),
      v.literal("thirdPartyAds"),
    ),

    value: v.boolean(),
  },

  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    let preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();

    // ────────────────────────────────────────────────────────────────────────
    // Création des préférences si elles n'existent pas encore
    // ────────────────────────────────────────────────────────────────────────

    if (!preferences) {
      const defaults = {
        theme: "dark" as const,
        language: "fr" as const,

        notifMessages: true,
        notifPublications: true,
        notifSystem: true,
        notifSounds: true,

        feedCategories: [],
        favoriteModules: [],

        profilePublic: true,
        showEmail: false,

        shareActivity: true,
        analyticsConsent: true,
        locationServices: true,
        thirdPartyAds: false,

        reducedMotion: false,
        compactMode: false,
      };

      const preferenceId = await ctx.db.insert("userPreferences", {
        userId: user._id,
        ...defaults,
        [args.key]: args.value,
      });

      return {
        success: true,
        preferenceId,
        key: args.key,
        value: args.value,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // Mise à jour
    // ────────────────────────────────────────────────────────────────────────

    await ctx.db.patch(preferences._id, {
      [args.key]: args.value,
    });

    return {
      success: true,
      preferenceId: preferences._id,
      key: args.key,
      value: args.value,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// MUTATION — EXPORT DES DONNÉES
// ──────────────────────────────────────────────────────────────────────────────

export const requestDataExport = mutation({
  args: {},

  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Évite de créer plusieurs demandes d'export simultanées.
    const existing = await ctx.db
      .query("privacyRequests")
      .withIndex("by_user_and_type", (q: any) =>
        q.eq("userId", user._id).eq("type", "export"),
      )
      .collect();

    const activeRequest = existing.find(
      (request: any) =>
        request.status === "pending" || request.status === "processing",
    );

    if (activeRequest) {
      return {
        success: true,
        requestId: activeRequest._id,
        alreadyRequested: true,
      };
    }

    const requestId = await ctx.db.insert("privacyRequests", {
      userId: user._id,
      type: "export",
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      success: true,
      requestId,
      alreadyRequested: false,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// MUTATION — DEMANDE DE SUPPRESSION
// ──────────────────────────────────────────────────────────────────────────────

export const requestAccountDeletion = mutation({
  args: {
    confirmation: v.literal("DELETE_ACCOUNT"),
  },

  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (args.confirmation !== "DELETE_ACCOUNT") {
      throw new ConvexError({
        code: "INVALID_CONFIRMATION",
        message: "Confirmation de suppression invalide.",
      });
    }

    const existing = await ctx.db
      .query("privacyRequests")
      .withIndex("by_user_and_type", (q: any) =>
        q.eq("userId", user._id).eq("type", "deletion"),
      )
      .collect();

    const activeRequest = existing.find(
      (request: any) =>
        request.status === "pending" || request.status === "processing",
    );

    if (activeRequest) {
      return {
        success: true,
        requestId: activeRequest._id,
        alreadyRequested: true,
      };
    }

    const requestId = await ctx.db.insert("privacyRequests", {
      userId: user._id,
      type: "deletion",
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      success: true,
      requestId,
      alreadyRequested: false,
    };
  },
});
