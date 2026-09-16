import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Paramètres applicatifs actuellement supportés.
 *
 * IMPORTANT :
 * Ne pas ajouter ici des paramètres UI qui ne sont pas encore
 * réellement persistés par le backend.
 */
const DEFAULT_SETTINGS = {
  notifications: true,
  offlineMode: false,
  biometrics: false,
  jobAlerts: true,
  immoAlerts: false,
  paymentAlerts: true,
  language: "Français",
} as const;

/**
 * Résout l'utilisateur actuellement authentifié.
 *
 * La résolution passe par tokenIdentifier afin de ne jamais
 * permettre à un utilisateur de lire/modifier les paramètres
 * d'un autre utilisateur.
 */
async function getUser(ctx: QueryCtx | MutationCtx) {
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

  return user;
}

/**
 * Récupère les paramètres de l'utilisateur connecté.
 *
 * Retour :
 * - null si l'utilisateur n'est pas authentifié ;
 * - les paramètres persistés si un document existe ;
 * - null si aucun document n'a encore été créé.
 */
export const getMySettings = query({
  args: {},

  handler: async (ctx) => {
    const user = await getUser(ctx);

    if (!user) {
      return null;
    }

    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

/**
 * Crée ou met à jour les paramètres de l'utilisateur connecté.
 *
 * Tous les champs sont optionnels afin de permettre des mises à jour
 * partielles depuis l'interface.
 *
 * Le backend reste la source de vérité :
 * - authentification obligatoire ;
 * - recherche par userId ;
 * - aucun userId fourni par le client ;
 * - aucune modification d'un autre compte possible via cette API.
 */
export const upsertSettings = mutation({
  args: {
    notifications: v.optional(v.boolean()),
    offlineMode: v.optional(v.boolean()),
    biometrics: v.optional(v.boolean()),
    jobAlerts: v.optional(v.boolean()),
    immoAlerts: v.optional(v.boolean()),
    paymentAlerts: v.optional(v.boolean()),
    language: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Non authentifié",
      });
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const updatedAt = new Date().toISOString();

    if (existing) {
      /**
       * Mise à jour partielle.
       *
       * Seuls les paramètres réellement envoyés par le client
       * sont modifiés.
       */
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt,
      });

      return await ctx.db.get(existing._id);
    }

    /**
     * Première création du document.
     *
     * Les valeurs par défaut garantissent qu'un compte possède
     * un état cohérent même si le client n'envoie qu'un seul paramètre.
     */
    const settingsId = await ctx.db.insert("userSettings", {
      userId: user._id,

      notifications: args.notifications ?? DEFAULT_SETTINGS.notifications,

      offlineMode: args.offlineMode ?? DEFAULT_SETTINGS.offlineMode,

      biometrics: args.biometrics ?? DEFAULT_SETTINGS.biometrics,

      jobAlerts: args.jobAlerts ?? DEFAULT_SETTINGS.jobAlerts,

      immoAlerts: args.immoAlerts ?? DEFAULT_SETTINGS.immoAlerts,

      paymentAlerts: args.paymentAlerts ?? DEFAULT_SETTINGS.paymentAlerts,

      language: args.language ?? DEFAULT_SETTINGS.language,

      updatedAt,
    });

    return await ctx.db.get(settingsId);
  },
});
