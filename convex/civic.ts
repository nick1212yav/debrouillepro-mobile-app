import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * ============================================================================
 * SÉCURITÉ PUBLIQUE / CIVIC
 * ============================================================================
 *
 * Principes :
 * - Toutes les opérations sensibles passent par l'authentification serveur.
 * - Le client ne choisit jamais userId.
 * - Les entrées sont validées côté serveur.
 * - Les listes sont toujours bornées.
 * - Aucun incident citoyen n'est présenté comme une alerte officielle.
 * - Aucun numéro d'urgence ou canal institutionnel n'est inventé ici.
 * - Le statut d'un incident ne peut pas être modifié par un citoyen.
 * - Protection basique contre le spam au niveau mutation.
 *
 * IMPORTANT :
 * Cette version respecte le schéma actuel de securityIncidents.
 * Les champs non présents dans le schéma ne sont volontairement PAS utilisés.
 */

/* ============================================================================
 * CONSTANTES DE SÉCURITÉ
 * ========================================================================== */

const MAX_JUSTICE_REPORTS = 50;
const MAX_MY_INCIDENTS = 30;
const MAX_PUBLIC_INCIDENTS = 30;
const MAX_DATA_ALERTS = 100;

const MAX_TYPE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_LOCATION_LENGTH = 300;
const MAX_DATASET_NAME_LENGTH = 150;

/**
 * Anti-spam :
 * maximum de signalements de sécurité créés par un utilisateur
 * sur une fenêtre temporelle.
 */
const INCIDENT_RATE_LIMIT_COUNT = 5;
const INCIDENT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Types d'incidents autorisés par DébrouillePro.
 *
 * Le schéma conserve `type` comme string pour compatibilité,
 * mais la validation métier est imposée côté serveur.
 */
const SECURITY_INCIDENT_TYPES = new Set([
  "Accident",
  "Agression",
  "Vol",
  "Incendie",
  "Trouble à l'ordre public",
  "Disparition",
  "Vandalisme",
  "Danger routier",
  "Danger électrique",
  "Catastrophe naturelle",
  "Autre",
]);

/* ============================================================================
 * TYPES INTERNES
 * ========================================================================== */

type Severity = "low" | "medium" | "high";

/* ============================================================================
 * AUTHENTIFICATION
 * ========================================================================== */

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
      code: "USER_NOT_FOUND",
    });
  }

  return user;
}

/* ============================================================================
 * VALIDATION
 * ========================================================================== */

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function requireNonEmptyText(
  value: string,
  field: string,
  maxLength: number,
): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new ConvexError({
      message: `${field} est obligatoire`,
      code: "VALIDATION_ERROR",
    });
  }

  if (normalized.length > maxLength) {
    throw new ConvexError({
      message: `${field} est trop long`,
      code: "VALIDATION_ERROR",
    });
  }

  return normalized;
}

function validateIncidentType(value: string): string {
  const type = requireNonEmptyText(
    value,
    "Le type d'incident",
    MAX_TYPE_LENGTH,
  );

  if (!SECURITY_INCIDENT_TYPES.has(type)) {
    throw new ConvexError({
      message: "Type d'incident non autorisé",
      code: "INVALID_INCIDENT_TYPE",
    });
  }

  return type;
}

function validateSeverity(value: Severity): Severity {
  if (value !== "low" && value !== "medium" && value !== "high") {
    throw new ConvexError({
      message: "Niveau de gravité invalide",
      code: "INVALID_SEVERITY",
    });
  }

  return value;
}

/* ============================================================================
 * JUSTICE
 * ========================================================================== */

export const listMyJusticeReports = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("justiceReports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_JUSTICE_REPORTS);
  },
});

export const createJusticeReport = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    location: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const type = requireNonEmptyText(args.type, "Le type", MAX_TYPE_LENGTH);

    const description = requireNonEmptyText(
      args.description,
      "La description",
      MAX_DESCRIPTION_LENGTH,
    );

    const location =
      args.location === undefined
        ? undefined
        : requireNonEmptyText(
            args.location,
            "La localisation",
            MAX_LOCATION_LENGTH,
          );

    return await ctx.db.insert("justiceReports", {
      userId: user._id,
      type,
      description,
      location,
      status: "En cours",
    });
  },
});

/* ============================================================================
 * SECURITY INCIDENTS — LECTURE PUBLIQUE
 * ========================================================================== */

/**
 * Liste publique des incidents récents.
 *
 * IMPORTANT :
 * - Aucun userId n'est retourné.
 * - Aucun document Convex brut n'est exposé.
 * - Aucun incident n'est présenté comme "officiel".
 * - Le résultat est strictement borné.
 *
 * L'interface peut utiliser `source: "citizen_report"` pour afficher
 * explicitement l'origine citoyenne.
 */
export const listRecentIncidents = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    /**
     * On ne publie pas de signalements à un utilisateur non authentifié.
     * Cela évite de transformer cette query en endpoint public non contrôlé.
     */
    if (!identity) {
      return [];
    }

    const incidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_status", (q) => q.eq("status", "Signalé"))
      .order("desc")
      .take(MAX_PUBLIC_INCIDENTS);

    return incidents.map((incident) => ({
      _id: incident._id,
      _creationTime: incident._creationTime,

      type: incident.type,
      location: incident.location,
      severity: incident.severity,
      status: incident.status,

      /**
       * Contrat explicite :
       * ceci est un signalement citoyen, pas une confirmation officielle.
       */
      source: "citizen_report" as const,
      verified: false as const,
    }));
  },
});

/* ============================================================================
 * SECURITY INCIDENTS — MES INCIDENTS
 * ========================================================================== */

export const listMyIncidents = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const incidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_MY_INCIDENTS);

    return incidents.map((incident) => ({
      _id: incident._id,
      _creationTime: incident._creationTime,
      type: incident.type,
      location: incident.location,
      severity: incident.severity,
      status: incident.status,
      source: "citizen_report" as const,
      verified: false as const,
    }));
  },
});

/* ============================================================================
 * SECURITY INCIDENTS — CRÉATION
 * ========================================================================== */

export const createSecurityIncident = mutation({
  args: {
    type: v.string(),
    location: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const type = validateIncidentType(args.type);

    const location = requireNonEmptyText(
      args.location,
      "La localisation",
      MAX_LOCATION_LENGTH,
    );

    const severity = validateSeverity(args.severity);

    /* ------------------------------------------------------------------------
     * ANTI-SPAM SERVEUR
     * ---------------------------------------------------------------------- */

    const now = Date.now();
    const windowStart = now - INCIDENT_RATE_LIMIT_WINDOW_MS;

    /**
     * On utilise l'index utilisateur et `_creationTime`,
     * qui est disponible nativement sur tous les documents Convex.
     *
     * On ne dépend donc pas d'un champ createdAt absent du schéma actuel.
     */
    const recentIncidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(INCIDENT_RATE_LIMIT_COUNT);

    const recentCount = recentIncidents.filter(
      (incident) => incident._creationTime >= windowStart,
    ).length;

    if (recentCount >= INCIDENT_RATE_LIMIT_COUNT) {
      throw new ConvexError({
        message:
          "Trop de signalements en peu de temps. Veuillez réessayer plus tard.",
        code: "RATE_LIMITED",
      });
    }

    /* ------------------------------------------------------------------------
     * INSERTION
     * ---------------------------------------------------------------------- */

    const incidentId = await ctx.db.insert("securityIncidents", {
      userId: user._id,
      type,
      location,
      severity,

      /**
       * Le statut initial est imposé par le serveur.
       * Le client ne peut pas créer directement un incident "Résolu"
       * ou "Pris en charge".
       */
      status: "Signalé",
    });

    return {
      incidentId,

      /**
       * Contrat explicite pour le frontend :
       * la plateforme confirme uniquement l'enregistrement du signalement.
       *
       * Elle ne prétend PAS avoir alerté la police, les pompiers,
       * les services médicaux ou une autre autorité.
       */
      accepted: true,
      source: "citizen_report" as const,
      officialAlertSent: false as const,
      status: "Signalé" as const,
    };
  },
});

/* ============================================================================
 * DATA ALERTS
 * ========================================================================== */

export const listMyDataAlerts = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("dataAlerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_DATA_ALERTS);
  },
});

export const toggleDataAlert = mutation({
  args: {
    datasetId: v.number(),
    datasetName: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!Number.isSafeInteger(args.datasetId) || args.datasetId < 0) {
      throw new ConvexError({
        message: "Identifiant de dataset invalide",
        code: "VALIDATION_ERROR",
      });
    }

    const datasetName = requireNonEmptyText(
      args.datasetName,
      "Le nom du dataset",
      MAX_DATASET_NAME_LENGTH,
    );

    const existing = await ctx.db
      .query("dataAlerts")
      .withIndex("by_user_dataset", (q) =>
        q.eq("userId", user._id).eq("datasetId", args.datasetId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      return {
        enabled: false,
        datasetId: args.datasetId,
      };
    }

    await ctx.db.insert("dataAlerts", {
      userId: user._id,
      datasetId: args.datasetId,
      datasetName,
    });

    return {
      enabled: true,
      datasetId: args.datasetId,
    };
  },
});
