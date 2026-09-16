import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_PERMITS_RETURNED = 100;
const MAX_ECO_ITEMS_RETURNED = 100;
const MAX_HOUSING_ITEMS_RETURNED = 100;

const MAX_SOURCES_RETURNED = 100;
const MAX_OPPORTUNITIES_RETURNED = 100;
const MAX_TENDERS_RETURNED = 100;
const MAX_QUALIFICATIONS_RETURNED = 100;
const MAX_DOSSIERS_RETURNED = 100;
const MAX_DOCUMENTS_RETURNED = 100;
const MAX_SUBMISSIONS_RETURNED = 100;
const MAX_WATCHLISTS_RETURNED = 100;
const MAX_EVENTS_RETURNED = 100;

const MAX_PERMIT_TYPE_LENGTH = 80;
const MAX_ADDRESS_LENGTH = 300;

const MAX_ECO_ACTION_ID_LENGTH = 100;
const MAX_LISTING_ID_LENGTH = 120;

const MAX_SOURCE_NAME_LENGTH = 160;
const MAX_ORGANIZATION_LENGTH = 160;
const MAX_COUNTRY_LENGTH = 100;
const MAX_REGION_LENGTH = 120;
const MAX_CITY_LENGTH = 120;
const MAX_URL_LENGTH = 1000;

const MAX_OPPORTUNITY_TITLE_LENGTH = 240;
const MAX_OPPORTUNITY_DESCRIPTION_LENGTH = 5000;
const MAX_SOURCE_REFERENCE_LENGTH = 160;

const MAX_TENDER_REFERENCE_LENGTH = 160;
const MAX_TENDER_TITLE_LENGTH = 240;
const MAX_TENDER_DESCRIPTION_LENGTH = 7000;
const MAX_AUTHORITY_LENGTH = 240;

const MAX_QUALIFICATION_TEXT_LENGTH = 3000;

const MAX_DOSSIER_NAME_LENGTH = 200;
const MAX_DOSSIER_NOTES_LENGTH = 5000;

const MAX_DOCUMENT_NAME_LENGTH = 240;
const MAX_MIME_TYPE_LENGTH = 120;

const MAX_SUBMISSION_REFERENCE_LENGTH = 160;
const MAX_SUBMISSION_NOTES_LENGTH = 5000;

const MAX_WATCHLIST_NAME_LENGTH = 160;
const MAX_KEYWORD_LENGTH = 80;
const MAX_ARRAY_ITEMS = 50;

const MAX_EVENT_MESSAGE_LENGTH = 2000;

const MAX_DOCUMENT_SIZE_BYTES = 100 * 1024 * 1024;

// ============================================================================
// ENUMS
// ============================================================================

const PERMIT_TYPES = [
  "Permis de construire",
  "Permis de démolir",
  "Permis d'aménager",
  "Déclaration préalable",
] as const;

const SOURCE_TYPES = [
  "official_portal",
  "institution",
  "municipality",
  "public_company",
  "partner",
  "manual",
  "other",
] as const;

const OPPORTUNITY_CATEGORIES = [
  "voirie",
  "batiment",
  "assainissement",
  "eau",
  "electricite",
  "transport",
  "amenagement",
  "urbanisme",
  "infrastructure",
  "environnement",
  "etudes",
  "services",
  "autre",
] as const;

const OPPORTUNITY_STATUSES = [
  "new",
  "reviewing",
  "qualified",
  "rejected",
  "converted",
  "closed",
] as const;

const PRIORITIES = ["low", "normal", "high", "critical"] as const;

const PROCEDURE_TYPES = [
  "appel_offres",
  "consultation",
  "demande_de_prix",
  "concours",
  "entente_directe",
  "autre",
] as const;

const TENDER_STATUSES = [
  "draft",
  "open",
  "deadline_passed",
  "under_evaluation",
  "awarded",
  "cancelled",
  "unknown",
] as const;

const QUALIFICATION_DECISIONS = [
  "pending",
  "eligible",
  "not_eligible",
  "needs_review",
] as const;

const DOSSIER_STATUSES = [
  "draft",
  "preparation",
  "ready",
  "submitted",
  "closed",
] as const;

const DOCUMENT_CATEGORIES = [
  "administratif",
  "technique",
  "financier",
  "juridique",
  "experience",
  "certification",
  "offre",
  "autre",
] as const;

const SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "acknowledged",
  "under_evaluation",
  "clarification_requested",
  "awarded",
  "not_selected",
  "cancelled",
] as const;

const EVENT_TYPES = [
  "created",
  "updated",
  "verified",
  "qualified",
  "rejected",
  "dossier_created",
  "document_added",
  "submitted",
  "submission_created",
  "status_changed",
  "deadline_changed",
  "awarded",
  "not_selected",
  "note_added",
] as const;

// ============================================================================
// HELPERS — ERREURS
// ============================================================================

function fail(message: string, code: string): never {
  throw new ConvexError({
    message,
    code,
  });
}

// ============================================================================
// HELPERS — VALIDATION
// ============================================================================

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function validateText(
  value: string,
  fieldName: string,
  maxLength: number,
): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    fail(`${fieldName} est obligatoire`, "INVALID_ARGUMENT");
  }

  if (normalized.length > maxLength) {
    fail(
      `${fieldName} est trop long (maximum ${maxLength} caractères)`,
      "INVALID_ARGUMENT",
    );
  }

  return normalized;
}

function validateOptionalText(
  value: string | undefined,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = normalizeText(value);

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    fail(
      `${fieldName} est trop long (maximum ${maxLength} caractères)`,
      "INVALID_ARGUMENT",
    );
  }

  return normalized;
}

function validateEnum<T extends readonly string[]>(
  value: string,
  allowed: T,
  fieldName: string,
): T[number] {
  const normalized = normalizeText(value);

  if (!allowed.includes(normalized)) {
    fail(`${fieldName} non pris en charge`, "INVALID_ENUM_VALUE");
  }

  return normalized as T[number];
}

function validateOptionalEnum<T extends readonly string[]>(
  value: string | undefined,
  allowed: T,
  fieldName: string,
): T[number] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return validateEnum(value, allowed, fieldName);
}

function validateBoolean(value: boolean): boolean {
  return value;
}

function validateNumber(
  value: number | undefined,
  fieldName: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    fail(`${fieldName} est invalide`, "INVALID_NUMBER");
  }

  return value;
}

function validateNonNegativeNumber(
  value: number | undefined,
  fieldName: string,
): number | undefined {
  const number = validateNumber(value, fieldName);

  if (number !== undefined && number < 0) {
    fail(`${fieldName} ne peut pas être négatif`, "INVALID_NUMBER");
  }

  return number;
}

function validatePercentage(
  value: number | undefined,
  fieldName: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    fail(`${fieldName} doit être compris entre 0 et 100`, "INVALID_PERCENTAGE");
  }

  return value;
}

function validateArray(
  values: string[],
  fieldName: string,
  maxItems = MAX_ARRAY_ITEMS,
  maxItemLength = MAX_KEYWORD_LENGTH,
): string[] {
  if (values.length > maxItems) {
    fail(`${fieldName} contient trop d'éléments`, "ARRAY_TOO_LARGE");
  }

  const normalized = values
    .map((value) => normalizeText(value))
    .filter(Boolean);

  for (const value of normalized) {
    if (value.length > maxItemLength) {
      fail(`Un élément de ${fieldName} est trop long`, "INVALID_ARGUMENT");
    }
  }

  return [...new Set(normalized)];
}

function validateEnumArray<T extends readonly string[]>(
  values: string[],
  allowed: T,
  fieldName: string,
): T[number][] {
  if (values.length > MAX_ARRAY_ITEMS) {
    fail(`${fieldName} contient trop d'éléments`, "ARRAY_TOO_LARGE");
  }

  return [
    ...new Set(values.map((value) => validateEnum(value, allowed, fieldName))),
  ];
}

function validateUrl(
  value: string | undefined,
  fieldName: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const url = value.trim();

  if (!url) {
    return undefined;
  }

  if (url.length > MAX_URL_LENGTH) {
    fail(`${fieldName} est trop longue`, "INVALID_URL");
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      fail(`${fieldName} doit utiliser HTTP ou HTTPS`, "INVALID_URL");
    }
  } catch {
    fail(`${fieldName} est invalide`, "INVALID_URL");
  }

  return url;
}

function now(): number {
  return Date.now();
}

// ============================================================================
// AUTHENTIFICATION
// ============================================================================

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    fail("Non authentifié", "UNAUTHENTICATED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    fail("Utilisateur introuvable", "NOT_FOUND");
  }

  return user;
}

async function getOptionalUser(ctx: QueryCtx) {
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
// OWNERSHIP
// ============================================================================

async function requireOwnedDossier(
  ctx: MutationCtx,
  dossierId: Id<"urbanTenderDossiers">,
  userId: Id<"users">,
) {
  const dossier = await ctx.db.get(dossierId);

  if (!dossier) {
    fail("Dossier introuvable", "NOT_FOUND");
  }

  if (dossier.ownerId !== userId) {
    fail("Accès au dossier refusé", "FORBIDDEN");
  }

  return dossier;
}

async function requireOwnedQualification(
  ctx: MutationCtx,
  qualificationId: Id<"urbanTenderQualifications">,
  userId: Id<"users">,
) {
  const qualification = await ctx.db.get(qualificationId);

  if (!qualification) {
    fail("Qualification introuvable", "NOT_FOUND");
  }

  if (qualification.userId !== userId) {
    fail("Accès à la qualification refusé", "FORBIDDEN");
  }

  return qualification;
}

async function requireOwnedWatchlist(
  ctx: MutationCtx,
  watchlistId: Id<"urbanWatchlists">,
  userId: Id<"users">,
) {
  const watchlist = await ctx.db.get(watchlistId);

  if (!watchlist) {
    fail("Veille introuvable", "NOT_FOUND");
  }

  if (watchlist.userId !== userId) {
    fail("Accès à cette veille refusé", "FORBIDDEN");
  }

  return watchlist;
}

async function requireOwnedSubmission(
  ctx: MutationCtx,
  submissionId: Id<"urbanTenderSubmissions">,
  userId: Id<"users">,
) {
  const submission = await ctx.db.get(submissionId);

  if (!submission) {
    fail("Soumission introuvable", "NOT_FOUND");
  }

  if (submission.submittedBy !== userId) {
    fail("Accès à cette soumission refusé", "FORBIDDEN");
  }

  return submission;
}

// ============================================================================
// AUDIT INTERNE
// ============================================================================

async function createTenderAuditEvent(
  ctx: MutationCtx,
  args: {
    tenderId: Id<"urbanTenders">;
    actorId?: Id<"users">;
    type: string;
    fromStatus?: string;
    toStatus?: string;
    message?: string;
    metadata?: Record<string, string>;
  },
) {
  const tender = await ctx.db.get(args.tenderId);

  if (!tender) {
    fail("Marché introuvable", "TENDER_NOT_FOUND");
  }

  const type = validateEnum(args.type, EVENT_TYPES, "Type d'événement");

  const fromStatus =
    args.fromStatus !== undefined
      ? validateEnum(args.fromStatus, TENDER_STATUSES, "Statut précédent")
      : undefined;

  const toStatus =
    args.toStatus !== undefined
      ? validateEnum(args.toStatus, TENDER_STATUSES, "Nouveau statut")
      : undefined;

  const message = validateOptionalText(
    args.message,
    "Message",
    MAX_EVENT_MESSAGE_LENGTH,
  );

  return await ctx.db.insert("urbanTenderEvents", {
    tenderId: args.tenderId,
    actorId: args.actorId,
    type,
    fromStatus,
    toStatus,
    message,
    metadata: args.metadata,
    createdAt: now(),
  });
}

// ============================================================================
// ECO ACTIONS — ENVIRONNEMENT
// ============================================================================

export const getEcoProgress = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return null;
    }

    return await ctx.db
      .query("ecoProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(MAX_ECO_ITEMS_RETURNED);
  },
});

export const toggleEcoAction = mutation({
  args: {
    actionId: v.string(),
    points: v.number(),
    done: v.boolean(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const actionId = validateText(
      args.actionId,
      "Identifiant de l'action",
      MAX_ECO_ACTION_ID_LENGTH,
    );

    if (
      !Number.isFinite(args.points) ||
      args.points < 0 ||
      args.points > 10000
    ) {
      fail("Nombre de points invalide", "INVALID_POINTS");
    }

    const existing = await ctx.db
      .query("ecoProgress")
      .withIndex("by_user_action", (q) =>
        q.eq("userId", user._id).eq("actionId", actionId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        done: args.done,
      });

      return {
        success: true,
        progressId: existing._id,
      };
    }

    const progressId = await ctx.db.insert("ecoProgress", {
      userId: user._id,
      actionId,
      points: args.points,
      done: args.done,
    });

    return {
      success: true,
      progressId,
    };
  },
});

// ============================================================================
// PERMIS — ADMINISTRATION URBAINE PERSONNELLE
// ============================================================================

export const listMyPermits = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("urbanPermits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_PERMITS_RETURNED);
  },
});

export const submitPermit = mutation({
  args: {
    type: v.string(),
    address: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const type = validateEnum(args.type, PERMIT_TYPES, "Type de permis");

    const address = validateText(args.address, "Adresse", MAX_ADDRESS_LENGTH);

    const timestamp = now();

    const permitId = `PC-${new Date(timestamp).getFullYear()}-${timestamp}`;

    const permitDbId = await ctx.db.insert("urbanPermits", {
      userId: user._id,
      permitId,
      type,
      address,
      status: "En attente",
      date: new Date(timestamp).toISOString(),
    });

    return {
      success: true,
      permitId,
      permitDbId,
    };
  },
});

// ============================================================================
// SOURCES URBAINES
// ============================================================================

export const listActiveSources = query({
  args: {},

  handler: async (ctx) => {
    return await ctx.db
      .query("urbanSources")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .take(MAX_SOURCES_RETURNED);
  },
});

export const listVerifiedSources = query({
  args: {},

  handler: async (ctx) => {
    return await ctx.db
      .query("urbanSources")
      .withIndex("by_verified", (q) => q.eq("verified", true))
      .order("desc")
      .take(MAX_SOURCES_RETURNED);
  },
});

export const getSource = query({
  args: {
    sourceId: v.id("urbanSources"),
  },

  handler: async (ctx, args) => {
    return await ctx.db.get(args.sourceId);
  },
});

/**
 * Source officielle alimentée uniquement par ingestion interne.
 *
 * Le frontend ne peut pas créer ou modifier une source officielle.
 */
export const upsertSource = internalMutation({
  args: {
    sourceId: v.optional(v.id("urbanSources")),
    name: v.string(),
    type: v.string(),
    organization: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    url: v.optional(v.string()),
    verified: v.boolean(),
    active: v.boolean(),
    lastCheckedAt: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const name = validateText(
      args.name,
      "Nom de la source",
      MAX_SOURCE_NAME_LENGTH,
    );

    const type = validateEnum(args.type, SOURCE_TYPES, "Type de source");

    const organization = validateOptionalText(
      args.organization,
      "Organisation",
      MAX_ORGANIZATION_LENGTH,
    );

    const country = validateOptionalText(
      args.country,
      "Pays",
      MAX_COUNTRY_LENGTH,
    );

    const region = validateOptionalText(
      args.region,
      "Région",
      MAX_REGION_LENGTH,
    );

    const city = validateOptionalText(args.city, "Ville", MAX_CITY_LENGTH);

    const url = validateUrl(args.url, "URL de la source");

    const lastCheckedAt = validateNumber(
      args.lastCheckedAt,
      "Date de dernière vérification",
    );

    const timestamp = now();

    if (args.sourceId) {
      const existing = await ctx.db.get(args.sourceId);

      if (!existing) {
        fail("Source introuvable", "NOT_FOUND");
      }

      await ctx.db.patch(args.sourceId, {
        name,
        type,
        organization,
        country,
        region,
        city,
        url,
        verified: args.verified,
        active: args.active,
        lastCheckedAt,
        updatedAt: timestamp,
      });

      return {
        sourceId: args.sourceId,
        created: false,
      };
    }

    const sourceId = await ctx.db.insert("urbanSources", {
      name,
      type,
      organization,
      country,
      region,
      city,
      url,
      verified: args.verified,
      active: args.active,
      lastCheckedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      sourceId,
      created: true,
    };
  },
});

// ============================================================================
// OPPORTUNITÉS
// ============================================================================

export const listOpportunities = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    country: v.optional(v.string()),
    priority: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    if (args.category) {
      const category = validateEnum(
        args.category,
        OPPORTUNITY_CATEGORIES,
        "Catégorie",
      );

      return await ctx.db
        .query("urbanOpportunities")
        .withIndex("by_category", (q) => q.eq("category", category))
        .order("desc")
        .take(MAX_OPPORTUNITIES_RETURNED);
    }

    if (args.status) {
      const status = validateEnum(args.status, OPPORTUNITY_STATUSES, "Statut");

      return await ctx.db
        .query("urbanOpportunities")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(MAX_OPPORTUNITIES_RETURNED);
    }

    if (args.country) {
      const country = validateText(args.country, "Pays", MAX_COUNTRY_LENGTH);

      return await ctx.db
        .query("urbanOpportunities")
        .withIndex("by_country", (q) => q.eq("country", country))
        .order("desc")
        .take(MAX_OPPORTUNITIES_RETURNED);
    }

    if (args.priority) {
      const priority = validateEnum(args.priority, PRIORITIES, "Priorité");

      return await ctx.db
        .query("urbanOpportunities")
        .withIndex("by_priority", (q) => q.eq("priority", priority))
        .order("desc")
        .take(MAX_OPPORTUNITIES_RETURNED);
    }

    return await ctx.db
      .query("urbanOpportunities")
      .order("desc")
      .take(MAX_OPPORTUNITIES_RETURNED);
  },
});

export const getOpportunity = query({
  args: {
    opportunityId: v.id("urbanOpportunities"),
  },

  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);

    if (!opportunity) {
      return null;
    }

    const source = await ctx.db.get(opportunity.sourceId);

    return {
      opportunity,
      source,
    };
  },
});

/**
 * Ingestion interne.
 *
 * Le frontend ne peut pas fabriquer une opportunité officielle.
 */
export const upsertOpportunity = internalMutation({
  args: {
    opportunityId: v.optional(v.id("urbanOpportunities")),
    sourceId: v.id("urbanSources"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    country: v.string(),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
    currency: v.optional(v.string()),
    sourceReference: v.string(),
    sourceUrl: v.string(),
    discoveredAt: v.number(),
    publishedAt: v.optional(v.number()),
    deadlineAt: v.optional(v.number()),
    status: v.string(),
    priority: v.string(),
  },

  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);

    if (!source) {
      fail("Source introuvable", "SOURCE_NOT_FOUND");
    }

    if (!source.active) {
      fail("La source est inactive", "SOURCE_INACTIVE");
    }

    const title = validateText(
      args.title,
      "Titre",
      MAX_OPPORTUNITY_TITLE_LENGTH,
    );

    const description = validateText(
      args.description,
      "Description",
      MAX_OPPORTUNITY_DESCRIPTION_LENGTH,
    );

    const category = validateEnum(
      args.category,
      OPPORTUNITY_CATEGORIES,
      "Catégorie",
    );

    const country = validateText(args.country, "Pays", MAX_COUNTRY_LENGTH);

    const region = validateOptionalText(
      args.region,
      "Région",
      MAX_REGION_LENGTH,
    );

    const city = validateOptionalText(args.city, "Ville", MAX_CITY_LENGTH);

    const sourceReference = validateText(
      args.sourceReference,
      "Référence source",
      MAX_SOURCE_REFERENCE_LENGTH,
    );

    const sourceUrl = validateUrl(args.sourceUrl, "URL source");

    if (!sourceUrl) {
      fail("Une URL source est obligatoire", "SOURCE_URL_REQUIRED");
    }

    const discoveredAt = validateNumber(
      args.discoveredAt,
      "Date de découverte",
    );

    if (discoveredAt === undefined) {
      fail("La date de découverte est obligatoire", "INVALID_ARGUMENT");
    }

    const publishedAt = validateNumber(args.publishedAt, "Date de publication");

    const deadlineAt = validateNumber(args.deadlineAt, "Date limite");

    const status = validateEnum(args.status, OPPORTUNITY_STATUSES, "Statut");

    const priority = validateEnum(args.priority, PRIORITIES, "Priorité");

    const estimatedValue = validateNonNegativeNumber(
      args.estimatedValue,
      "Valeur estimée",
    );

    const currency = validateOptionalText(args.currency, "Devise", 20);

    const existing = await ctx.db
      .query("urbanOpportunities")
      .withIndex("by_source_reference", (q) =>
        q.eq("sourceId", args.sourceId).eq("sourceReference", sourceReference),
      )
      .unique();

    const timestamp = now();

    const payload = {
      sourceId: args.sourceId,
      title,
      description,
      category,
      country,
      region,
      city,
      estimatedValue,
      currency,
      sourceReference,
      sourceUrl,
      discoveredAt,
      publishedAt,
      deadlineAt,
      status,
      priority,
      updatedAt: timestamp,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);

      return {
        opportunityId: existing._id,
        created: false,
      };
    }

    const opportunityId = await ctx.db.insert("urbanOpportunities", {
      ...payload,
      createdAt: timestamp,
    });

    return {
      opportunityId,
      created: true,
    };
  },
});

/**
 * Mutation historique conservée pour compatibilité.
 *
 * Les statuts officiels provenant normalement des sources,
 * les états critiques sont interdits ici.
 */
export const updateOpportunityStatus = mutation({
  args: {
    opportunityId: v.id("urbanOpportunities"),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const status = validateEnum(args.status, OPPORTUNITY_STATUSES, "Statut");

    const opportunity = await ctx.db.get(args.opportunityId);

    if (!opportunity) {
      fail("Opportunité introuvable", "NOT_FOUND");
    }

    await ctx.db.patch(args.opportunityId, {
      status,
      updatedAt: now(),
    });

    return {
      success: true,
      opportunityId: args.opportunityId,
      status,
      actorId: user._id,
    };
  },
});

// ============================================================================
// TENDERS / MARCHÉS
// ============================================================================

export const listTenders = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    country: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    if (args.status) {
      const status = validateEnum(args.status, TENDER_STATUSES, "Statut");

      return await ctx.db
        .query("urbanTenders")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(MAX_TENDERS_RETURNED);
    }

    if (args.category) {
      const category = validateEnum(
        args.category,
        OPPORTUNITY_CATEGORIES,
        "Catégorie",
      );

      return await ctx.db
        .query("urbanTenders")
        .withIndex("by_category", (q) => q.eq("category", category))
        .order("desc")
        .take(MAX_TENDERS_RETURNED);
    }

    if (args.country) {
      const country = validateText(args.country, "Pays", MAX_COUNTRY_LENGTH);

      return await ctx.db
        .query("urbanTenders")
        .withIndex("by_country", (q) => q.eq("country", country))
        .order("desc")
        .take(MAX_TENDERS_RETURNED);
    }

    return await ctx.db
      .query("urbanTenders")
      .order("desc")
      .take(MAX_TENDERS_RETURNED);
  },
});

export const getTender = query({
  args: {
    tenderId: v.id("urbanTenders"),
  },

  handler: async (ctx, args) => {
    const tender = await ctx.db.get(args.tenderId);

    if (!tender) {
      return null;
    }

    const source = await ctx.db.get(tender.sourceId);

    const opportunity = await ctx.db.get(tender.opportunityId);

    return {
      tender,
      source,
      opportunity,
    };
  },
});

/**
 * Ingestion interne des marchés.
 *
 * La source externe est responsable de fournir
 * les données réellement publiées.
 */
export const upsertTenderFromSource = internalMutation({
  args: {
    tenderId: v.optional(v.id("urbanTenders")),
    opportunityId: v.id("urbanOpportunities"),
    sourceId: v.id("urbanSources"),
    reference: v.string(),
    title: v.string(),
    description: v.string(),
    procedureType: v.string(),
    category: v.string(),
    contractingAuthority: v.string(),
    country: v.string(),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    estimatedAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    clarificationDeadlineAt: v.optional(v.number()),
    submissionDeadlineAt: v.optional(v.number()),
    openingDateAt: v.optional(v.number()),
    sourceReference: v.string(),
    sourceUrl: v.string(),
    status: v.string(),
    verifiedAt: v.optional(v.number()),
    lastSourceCheckAt: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);

    if (!source) {
      fail("Source introuvable", "SOURCE_NOT_FOUND");
    }

    if (!source.active) {
      fail("La source est inactive", "SOURCE_INACTIVE");
    }

    const opportunity = await ctx.db.get(args.opportunityId);

    if (!opportunity) {
      fail("Opportunité introuvable", "OPPORTUNITY_NOT_FOUND");
    }

    if (opportunity.sourceId !== args.sourceId) {
      fail(
        "La source du marché ne correspond pas à celle de l'opportunité",
        "SOURCE_OPPORTUNITY_MISMATCH",
      );
    }

    const reference = validateText(
      args.reference,
      "Référence",
      MAX_TENDER_REFERENCE_LENGTH,
    );

    const title = validateText(args.title, "Titre", MAX_TENDER_TITLE_LENGTH);

    const description = validateText(
      args.description,
      "Description",
      MAX_TENDER_DESCRIPTION_LENGTH,
    );

    const procedureType = validateEnum(
      args.procedureType,
      PROCEDURE_TYPES,
      "Type de procédure",
    );

    const category = validateEnum(
      args.category,
      OPPORTUNITY_CATEGORIES,
      "Catégorie",
    );

    const contractingAuthority = validateText(
      args.contractingAuthority,
      "Autorité contractante",
      MAX_AUTHORITY_LENGTH,
    );

    const country = validateText(args.country, "Pays", MAX_COUNTRY_LENGTH);

    const region = validateOptionalText(
      args.region,
      "Région",
      MAX_REGION_LENGTH,
    );

    const city = validateOptionalText(args.city, "Ville", MAX_CITY_LENGTH);

    const sourceReference = validateText(
      args.sourceReference,
      "Référence source",
      MAX_SOURCE_REFERENCE_LENGTH,
    );

    const sourceUrl = validateUrl(args.sourceUrl, "URL source");

    if (!sourceUrl) {
      fail("Une URL source est obligatoire", "SOURCE_URL_REQUIRED");
    }

    const estimatedAmount = validateNonNegativeNumber(
      args.estimatedAmount,
      "Montant estimé",
    );

    const currency = validateOptionalText(args.currency, "Devise", 20);

    const publishedAt = validateNumber(args.publishedAt, "Date de publication");

    const clarificationDeadlineAt = validateNumber(
      args.clarificationDeadlineAt,
      "Date limite de clarification",
    );

    const submissionDeadlineAt = validateNumber(
      args.submissionDeadlineAt,
      "Date limite de soumission",
    );

    const openingDateAt = validateNumber(
      args.openingDateAt,
      "Date d'ouverture",
    );

    const verifiedAt = validateNumber(args.verifiedAt, "Date de vérification");

    const lastSourceCheckAt = validateNumber(
      args.lastSourceCheckAt,
      "Date de dernière vérification",
    );

    const status = validateEnum(args.status, TENDER_STATUSES, "Statut");

    const existing = await ctx.db
      .query("urbanTenders")
      .withIndex("by_source_reference", (q) =>
        q.eq("sourceId", args.sourceId).eq("reference", reference),
      )
      .unique();

    const timestamp = now();

    const payload = {
      opportunityId: args.opportunityId,
      sourceId: args.sourceId,
      reference,
      title,
      description,
      procedureType,
      category,
      contractingAuthority,
      country,
      region,
      city,
      estimatedAmount,
      currency,
      publishedAt,
      clarificationDeadlineAt,
      submissionDeadlineAt,
      openingDateAt,
      sourceReference,
      sourceUrl,
      status,
      verifiedAt,
      lastSourceCheckAt,
      updatedAt: timestamp,
    };

    if (existing) {
      const previousStatus = existing.status;

      await ctx.db.patch(existing._id, payload);

      if (previousStatus !== status) {
        await ctx.db.insert("urbanTenderEvents", {
          tenderId: existing._id,
          type: "status_changed",
          fromStatus: previousStatus,
          toStatus: status,
          message: "Statut mis à jour depuis la source officielle.",
          createdAt: timestamp,
        });
      }

      return {
        tenderId: existing._id,
        created: false,
      };
    }

    const tenderId = await ctx.db.insert("urbanTenders", {
      ...payload,
      createdAt: timestamp,
    });

    await ctx.db.insert("urbanTenderEvents", {
      tenderId,
      type: "created",
      message: "Marché importé depuis sa source.",
      createdAt: timestamp,
    });

    return {
      tenderId,
      created: true,
    };
  },
});

/**
 * Mutation conservée pour compatibilité de migration.
 *
 * Les statuts officiels doivent normalement être fournis
 * par l'ingestion interne.
 */
export const updateTenderStatus = mutation({
  args: {
    tenderId: v.id("urbanTenders"),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const status = validateEnum(args.status, TENDER_STATUSES, "Statut");

    const tender = await ctx.db.get(args.tenderId);

    if (!tender) {
      fail("Marché introuvable", "NOT_FOUND");
    }

    /**
     * Les états officiels ne peuvent pas être fabriqués
     * par l'utilisateur.
     */
    if (
      status === "awarded" ||
      status === "cancelled" ||
      status === "deadline_passed" ||
      status === "under_evaluation"
    ) {
      fail(
        "Ce statut doit provenir de la source officielle",
        "OFFICIAL_STATUS_REQUIRED",
      );
    }

    const previousStatus = tender.status;

    if (previousStatus === status) {
      return {
        success: true,
        tenderId: args.tenderId,
        status,
        unchanged: true,
      };
    }

    await ctx.db.patch(args.tenderId, {
      status,
      updatedAt: now(),
    });

    await createTenderAuditEvent(ctx, {
      tenderId: args.tenderId,
      actorId: user._id,
      type: "status_changed",
      fromStatus: previousStatus,
      toStatus: status,
      message: "Statut modifié par l'utilisateur.",
    });

    return {
      success: true,
      tenderId: args.tenderId,
      status,
    };
  },
});

// ============================================================================
// QUALIFICATION
// ============================================================================

export const getMyQualification = query({
  args: {
    tenderId: v.id("urbanTenders"),
  },

  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return null;
    }

    return await ctx.db
      .query("urbanTenderQualifications")
      .withIndex("by_tender_and_user", (q) =>
        q.eq("tenderId", args.tenderId).eq("userId", user._id),
      )
      .unique();
  },
});

export const listMyQualifications = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("urbanTenderQualifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_QUALIFICATIONS_RETURNED);
  },
});

export const saveTenderQualification = mutation({
  args: {
    tenderId: v.id("urbanTenders"),
    decision: v.string(),
    technicalFit: v.optional(v.number()),
    financialFit: v.optional(v.number()),
    geographicFit: v.optional(v.number()),
    experienceFit: v.optional(v.number()),
    requiredExperience: v.optional(v.string()),
    requiredDocuments: v.optional(v.string()),
    missingDocuments: v.optional(v.string()),
    notes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const tender = await ctx.db.get(args.tenderId);

    if (!tender) {
      fail("Marché introuvable", "NOT_FOUND");
    }

    const decision = validateEnum(
      args.decision,
      QUALIFICATION_DECISIONS,
      "Décision",
    );

    const technicalFit = validatePercentage(
      args.technicalFit,
      "Adéquation technique",
    );

    const financialFit = validatePercentage(
      args.financialFit,
      "Adéquation financière",
    );

    const geographicFit = validatePercentage(
      args.geographicFit,
      "Adéquation géographique",
    );

    const experienceFit = validatePercentage(
      args.experienceFit,
      "Adéquation expérience",
    );

    const requiredExperience = validateOptionalText(
      args.requiredExperience,
      "Expérience requise",
      MAX_QUALIFICATION_TEXT_LENGTH,
    );

    const requiredDocuments = validateOptionalText(
      args.requiredDocuments,
      "Documents requis",
      MAX_QUALIFICATION_TEXT_LENGTH,
    );

    const missingDocuments = validateOptionalText(
      args.missingDocuments,
      "Documents manquants",
      MAX_QUALIFICATION_TEXT_LENGTH,
    );

    const notes = validateOptionalText(
      args.notes,
      "Notes",
      MAX_QUALIFICATION_TEXT_LENGTH,
    );

    const existing = await ctx.db
      .query("urbanTenderQualifications")
      .withIndex("by_tender_and_user", (q) =>
        q.eq("tenderId", args.tenderId).eq("userId", user._id),
      )
      .unique();

    const timestamp = now();

    const payload = {
      tenderId: args.tenderId,
      userId: user._id,
      decision,
      technicalFit,
      financialFit,
      geographicFit,
      experienceFit,
      requiredExperience,
      requiredDocuments,
      missingDocuments,
      notes,
      reviewedAt: timestamp,
      updatedAt: timestamp,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);

      await createTenderAuditEvent(ctx, {
        tenderId: args.tenderId,
        actorId: user._id,
        type: "qualified",
        message: `Qualification mise à jour : ${decision}.`,
      });

      return {
        qualificationId: existing._id,
        created: false,
      };
    }

    const qualificationId = await ctx.db.insert(
      "urbanTenderQualifications",
      payload,
    );

    await createTenderAuditEvent(ctx, {
      tenderId: args.tenderId,
      actorId: user._id,
      type: "qualified",
      message: `Qualification créée : ${decision}.`,
    });

    return {
      qualificationId,
      created: true,
    };
  },
});

// ============================================================================
// DOSSIERS
// ============================================================================

export const listMyTenderDossiers = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("urbanTenderDossiers")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(MAX_DOSSIERS_RETURNED);
  },
});

export const getTenderDossier = query({
  args: {
    dossierId: v.id("urbanTenderDossiers"),
  },

  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return null;
    }

    const dossier = await ctx.db.get(args.dossierId);

    if (!dossier || dossier.ownerId !== user._id) {
      return null;
    }

    const tender = await ctx.db.get(dossier.tenderId);

    const documents = await ctx.db
      .query("urbanTenderDocuments")
      .withIndex("by_dossier", (q) => q.eq("dossierId", dossier._id))
      .order("desc")
      .take(MAX_DOCUMENTS_RETURNED);

    return {
      dossier,
      tender,
      documents,
    };
  },
});

export const createTenderDossier = mutation({
  args: {
    tenderId: v.id("urbanTenders"),
    name: v.string(),
    responsibleUserId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const tender = await ctx.db.get(args.tenderId);

    if (!tender) {
      fail("Marché introuvable", "NOT_FOUND");
    }

    const name = validateText(
      args.name,
      "Nom du dossier",
      MAX_DOSSIER_NAME_LENGTH,
    );

    const notes = validateOptionalText(
      args.notes,
      "Notes",
      MAX_DOSSIER_NOTES_LENGTH,
    );

    if (args.responsibleUserId) {
      const responsibleUser = await ctx.db.get(args.responsibleUserId);

      if (!responsibleUser) {
        fail("Responsable introuvable", "RESPONSIBLE_USER_NOT_FOUND");
      }
    }

    const timestamp = now();

    const dossierId = await ctx.db.insert("urbanTenderDossiers", {
      tenderId: args.tenderId,
      ownerId: user._id,
      name,
      status: "draft",
      responsibleUserId: args.responsibleUserId,
      notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await createTenderAuditEvent(ctx, {
      tenderId: args.tenderId,
      actorId: user._id,
      type: "dossier_created",
      message: `Dossier « ${name} » créé.`,
    });

    return {
      dossierId,
    };
  },
});

export const updateTenderDossier = mutation({
  args: {
    dossierId: v.id("urbanTenderDossiers"),
    name: v.optional(v.string()),
    status: v.optional(v.string()),
    responsibleUserId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const dossier = await requireOwnedDossier(ctx, args.dossierId, user._id);

    const name =
      args.name !== undefined
        ? validateText(args.name, "Nom du dossier", MAX_DOSSIER_NAME_LENGTH)
        : undefined;

    const requestedStatus = validateOptionalEnum(
      args.status,
      DOSSIER_STATUSES,
      "Statut du dossier",
    );

    /**
     * Workflow strict.
     *
     * draft
     *   → preparation
     *   → ready
     *   → submitted
     *
     * "submitted" n'est jamais produit par cette mutation.
     */
    const DOSSIER_TRANSITIONS: Record<
      (typeof DOSSIER_STATUSES)[number],
      readonly (typeof DOSSIER_STATUSES)[number][]
    > = {
      draft: ["preparation", "ready", "closed"],
      preparation: ["draft", "ready", "closed"],
      ready: ["preparation", "closed"],
      submitted: ["closed"],
      closed: [],
    };

    if (requestedStatus !== undefined && requestedStatus !== dossier.status) {
      if (requestedStatus === "submitted") {
        fail(
          "Le dossier passe à « submitted » uniquement lors de l'envoi de la soumission",
          "INVALID_DOSSIER_TRANSITION",
        );
      }

      const allowedTransitions = DOSSIER_TRANSITIONS[dossier.status];

      if (!allowedTransitions.includes(requestedStatus)) {
        fail(
          `Transition de dossier interdite : ${dossier.status} → ${requestedStatus}`,
          "INVALID_DOSSIER_TRANSITION",
        );
      }
    }

    const notes =
      args.notes !== undefined
        ? validateOptionalText(args.notes, "Notes", MAX_DOSSIER_NOTES_LENGTH)
        : undefined;

    if (args.responsibleUserId !== undefined) {
      const responsibleUser = await ctx.db.get(args.responsibleUserId);

      if (!responsibleUser) {
        fail("Responsable introuvable", "RESPONSIBLE_USER_NOT_FOUND");
      }
    }

    const timestamp = now();

    await ctx.db.patch(args.dossierId, {
      ...(name !== undefined ? { name } : {}),
      ...(requestedStatus !== undefined
        ? {
            status: requestedStatus,
          }
        : {}),
      ...(args.responsibleUserId !== undefined
        ? {
            responsibleUserId: args.responsibleUserId,
          }
        : {}),
      ...(args.notes !== undefined ? { notes } : {}),
      updatedAt: timestamp,
    });

    if (requestedStatus !== undefined && requestedStatus !== dossier.status) {
      await createTenderAuditEvent(ctx, {
        tenderId: dossier.tenderId,
        actorId: user._id,
        type: "updated",
        message: `Statut du dossier modifié : ${dossier.status} → ${requestedStatus}.`,
        metadata: {
          dossierId: dossier._id,
          fromStatus: dossier.status,
          toStatus: requestedStatus,
        },
      });
    }

    return {
      success: true,
      dossierId: dossier._id,
      status: requestedStatus ?? dossier.status,
    };
  },
});

// ============================================================================
// DOCUMENTS — STORAGE
// ============================================================================

/**
 * Génère une URL d'upload Convex Storage.
 *
 * Le fichier n'est PAS encore enregistré comme document.
 *
 * Workflow :
 *
 * 1. frontend → generateTenderDocumentUploadUrl()
 * 2. frontend → upload du fichier vers l'URL retournée
 * 3. Convex Storage → retourne un storageId
 * 4. frontend → addTenderDocument(storageId)
 */
export const generateTenderDocumentUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    await requireUser(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

export const listDossierDocuments = query({
  args: {
    dossierId: v.id("urbanTenderDossiers"),
  },

  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return [];
    }

    const dossier = await ctx.db.get(args.dossierId);

    if (!dossier || dossier.ownerId !== user._id) {
      return [];
    }

    const documents = await ctx.db
      .query("urbanTenderDocuments")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .order("desc")
      .take(MAX_DOCUMENTS_RETURNED);

    return await Promise.all(
      documents.map(async (document) => ({
        ...document,
        resolvedUrl: document.storageId
          ? await ctx.storage.getUrl(document.storageId)
          : document.url,
      })),
    );
  },
});

export const addTenderDocument = mutation({
  args: {
    dossierId: v.id("urbanTenderDossiers"),
    name: v.string(),
    category: v.string(),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    required: v.boolean(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const dossier = await requireOwnedDossier(ctx, args.dossierId, user._id);

    if (dossier.status === "submitted") {
      fail(
        "Impossible d'ajouter un document à un dossier déjà soumis",
        "DOSSIER_LOCKED",
      );
    }

    if (dossier.status === "closed") {
      fail(
        "Impossible d'ajouter un document à un dossier fermé",
        "DOSSIER_LOCKED",
      );
    }

    const name = validateText(
      args.name,
      "Nom du document",
      MAX_DOCUMENT_NAME_LENGTH,
    );

    const category = validateEnum(
      args.category,
      DOCUMENT_CATEGORIES,
      "Catégorie du document",
    );

    const mimeType = validateOptionalText(
      args.mimeType,
      "Type MIME",
      MAX_MIME_TYPE_LENGTH,
    );

    const url = validateUrl(args.url, "URL du document");

    if (!args.storageId && !url) {
      fail(
        "Un document doit disposer d'un fichier ou d'une URL",
        "DOCUMENT_SOURCE_REQUIRED",
      );
    }

    if (args.storageId) {
      const storageUrl = await ctx.storage.getUrl(args.storageId);

      if (!storageUrl) {
        fail("Fichier Convex Storage introuvable", "STORAGE_FILE_NOT_FOUND");
      }
    }

    const sizeBytes = validateNonNegativeNumber(
      args.sizeBytes,
      "Taille du document",
    );

    if (sizeBytes !== undefined && sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
      fail(
        "Le document dépasse la taille maximale autorisée",
        "DOCUMENT_TOO_LARGE",
      );
    }

    const timestamp = now();

    const documentId = await ctx.db.insert("urbanTenderDocuments", {
      dossierId: dossier._id,
      uploadedBy: user._id,
      name,
      category,
      storageId: args.storageId,
      url,
      mimeType,
      sizeBytes,
      required: args.required,
      verified: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await createTenderAuditEvent(ctx, {
      tenderId: dossier.tenderId,
      actorId: user._id,
      type: "document_added",
      message: `Document ajouté : ${name}.`,
      metadata: {
        documentId,
        dossierId: dossier._id,
        category,
      },
    });

    return {
      documentId,
    };
  },
});

// ============================================================================
// SOUMISSIONS
// ============================================================================

export const listMySubmissions = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("urbanTenderSubmissions")
      .withIndex("by_submitter", (q) => q.eq("submittedBy", user._id))
      .order("desc")
      .take(MAX_SUBMISSIONS_RETURNED);
  },
});

/**
 * Retourne la soumission de l'utilisateur
 * associée à un dossier précis.
 *
 * Requiert dans schema.ts :
 *
 * .index("by_dossier_and_submitter", [
 *   "dossierId",
 *   "submittedBy",
 * ])
 */
export const getMyTenderSubmission = query({
  args: {
    dossierId: v.id("urbanTenderDossiers"),
  },

  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return null;
    }

    /**
     * Protection d'accès au dossier.
     */
    const dossier = await ctx.db.get(args.dossierId);

    if (!dossier || dossier.ownerId !== user._id) {
      return null;
    }

    /**
     * Lecture directement indexée.
     *
     * Aucun collect() global.
     * Aucun filtrage client.
     */
    return await ctx.db
      .query("urbanTenderSubmissions")
      .withIndex("by_dossier_and_submitter", (q) =>
        q.eq("dossierId", args.dossierId).eq("submittedBy", user._id),
      )
      .order("desc")
      .first();
  },
});

export const createTenderSubmission = mutation({
  args: {
    tenderId: v.id("urbanTenders"),
    dossierId: v.id("urbanTenderDossiers"),
    submissionReference: v.string(),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const tender = await ctx.db.get(args.tenderId);

    if (!tender) {
      fail("Marché introuvable", "TENDER_NOT_FOUND");
    }

    const dossier = await requireOwnedDossier(ctx, args.dossierId, user._id);

    /**
     * Un dossier ne peut appartenir qu'au marché
     * auquel il a été associé lors de sa création.
     */
    if (dossier.tenderId !== args.tenderId) {
      fail("Le dossier ne correspond pas au marché", "DOSSIER_TENDER_MISMATCH");
    }

    if (dossier.status === "submitted" || dossier.status === "closed") {
      fail(
        "Ce dossier n'accepte plus de nouvelle soumission",
        "DOSSIER_LOCKED",
      );
    }

    /**
     * Une nouvelle soumission ne peut être créée
     * que pour un marché officiellement ouvert.
     */
    if (tender.status !== "open") {
      fail(
        "Ce marché n'est pas actuellement ouvert aux soumissions",
        "TENDER_NOT_OPEN",
      );
    }

    const timestamp = now();

    /**
     * Vérification serveur de la deadline.
     */
    if (
      tender.submissionDeadlineAt !== undefined &&
      tender.submissionDeadlineAt <= timestamp
    ) {
      fail(
        "La date limite de soumission est dépassée",
        "TENDER_DEADLINE_PASSED",
      );
    }

    const submissionReference = validateText(
      args.submissionReference,
      "Référence de soumission",
      MAX_SUBMISSION_REFERENCE_LENGTH,
    );

    const amount = validateNonNegativeNumber(args.amount, "Montant");

    const currency = validateOptionalText(args.currency, "Devise", 20);

    const notes = validateOptionalText(
      args.notes,
      "Notes",
      MAX_SUBMISSION_NOTES_LENGTH,
    );

    /**
     * Une seule soumission active pour le couple :
     *
     * dossier + utilisateur.
     *
     * La lecture utilise l'index composite.
     */
    const existing = await ctx.db
      .query("urbanTenderSubmissions")
      .withIndex("by_dossier_and_submitter", (q) =>
        q.eq("dossierId", args.dossierId).eq("submittedBy", user._id),
      )
      .order("desc")
      .first();

    if (
      existing &&
      (existing.status === "draft" ||
        existing.status === "submitted" ||
        existing.status === "acknowledged" ||
        existing.status === "under_evaluation" ||
        existing.status === "clarification_requested")
    ) {
      fail(
        "Une soumission active existe déjà pour ce dossier",
        "SUBMISSION_ALREADY_EXISTS",
      );
    }

    const submissionId = await ctx.db.insert("urbanTenderSubmissions", {
      tenderId: args.tenderId,
      dossierId: args.dossierId,
      submittedBy: user._id,
      submissionReference,
      amount,
      currency,
      status: "draft",
      notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await createTenderAuditEvent(ctx, {
      tenderId: args.tenderId,
      actorId: user._id,
      type: "submission_created",
      message: "Projet de soumission créé.",
      metadata: {
        submissionId,
        dossierId: args.dossierId,
      },
    });

    return {
      submissionId,
    };
  },
});

export const submitTenderSubmission = mutation({
  args: {
    submissionId: v.id("urbanTenderSubmissions"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const submission = await requireOwnedSubmission(
      ctx,
      args.submissionId,
      user._id,
    );

    const tender = await ctx.db.get(submission.tenderId);

    if (!tender) {
      fail("Marché introuvable", "TENDER_NOT_FOUND");
    }

    const dossier = await ctx.db.get(submission.dossierId);

    if (!dossier) {
      fail("Dossier introuvable", "DOSSIER_NOT_FOUND");
    }

    if (dossier.ownerId !== user._id) {
      fail("Accès au dossier refusé", "FORBIDDEN");
    }

    /**
     * Protection contre une association frauduleuse
     * entre soumission, dossier et marché.
     */
    if (dossier.tenderId !== submission.tenderId) {
      fail(
        "Le dossier et la soumission ne correspondent pas au même marché",
        "DOSSIER_TENDER_MISMATCH",
      );
    }

    /**
     * Une soumission ne peut être envoyée
     * qu'une seule fois depuis draft.
     */
    if (submission.status !== "draft") {
      fail(
        "Cette soumission ne peut plus être envoyée",
        "INVALID_SUBMISSION_STATE",
      );
    }

    /**
     * Le dossier doit être explicitement prêt.
     */
    if (dossier.status !== "ready") {
      fail(
        "Le dossier doit être au statut « ready » avant l'envoi",
        "DOSSIER_NOT_READY",
      );
    }

    /**
     * Le marché doit être officiellement ouvert.
     */
    if (tender.status !== "open") {
      fail(
        "Le marché n'est pas actuellement ouvert aux soumissions",
        "TENDER_NOT_OPEN",
      );
    }

    const timestamp = now();

    /**
     * Deadline contrôlée au moment exact de l'envoi.
     */
    if (
      tender.submissionDeadlineAt !== undefined &&
      tender.submissionDeadlineAt <= timestamp
    ) {
      fail(
        "La date limite de soumission est dépassée",
        "TENDER_DEADLINE_PASSED",
      );
    }

    /**
     * Récupération bornée des documents.
     */
    const documents = await ctx.db
      .query("urbanTenderDocuments")
      .withIndex("by_dossier", (q) => q.eq("dossierId", dossier._id))
      .take(MAX_DOCUMENTS_RETURNED);

    /**
     * Un dossier vide ne peut jamais être soumis.
     */
    if (documents.length === 0) {
      fail(
        "Le dossier doit contenir au moins un document avant l'envoi",
        "DOSSIER_DOCUMENTS_REQUIRED",
      );
    }

    /**
     * Chaque document doit avoir une vraie source.
     */
    const invalidDocument = documents.find(
      (document) => !document.storageId && !document.url,
    );

    if (invalidDocument) {
      fail(
        "Un ou plusieurs documents du dossier ne disposent pas d'une source exploitable",
        "INVALID_DOCUMENT_SOURCE",
      );
    }

    /**
     * Transition métier atomique :
     *
     * submission : draft → submitted
     * dossier     : ready  → submitted
     */
    await ctx.db.patch(args.submissionId, {
      status: "submitted",
      submittedAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.patch(submission.dossierId, {
      status: "submitted",
      updatedAt: timestamp,
    });

    await createTenderAuditEvent(ctx, {
      tenderId: submission.tenderId,
      actorId: user._id,
      type: "submitted",
      toStatus: "submitted",
      message: "Soumission envoyée.",
      metadata: {
        submissionId: args.submissionId,
        dossierId: submission.dossierId,
      },
    });

    return {
      success: true,
      submissionId: args.submissionId,
      dossierId: submission.dossierId,
      status: "submitted",
      submittedAt: timestamp,
    };
  },
});

// ============================================================================
// WATCHLISTS — VEILLE
// ============================================================================

export const listMyWatchlists = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("urbanWatchlists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_WATCHLISTS_RETURNED);
  },
});

export const createWatchlist = mutation({
  args: {
    name: v.string(),
    keywords: v.array(v.string()),
    categories: v.array(v.string()),
    countries: v.array(v.string()),
    regions: v.array(v.string()),
    cities: v.array(v.string()),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    active: v.boolean(),
    notifyNewOpportunity: v.boolean(),
    notifyDeadline: v.boolean(),
    notifyStatusChange: v.boolean(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const name = validateText(
      args.name,
      "Nom de la veille",
      MAX_WATCHLIST_NAME_LENGTH,
    );

    const keywords = validateArray(args.keywords, "Mots-clés");

    const categories = validateEnumArray(
      args.categories,
      OPPORTUNITY_CATEGORIES,
      "Catégorie",
    );

    const countries = validateArray(
      args.countries,
      "Pays",
      MAX_ARRAY_ITEMS,
      MAX_COUNTRY_LENGTH,
    );

    const regions = validateArray(
      args.regions,
      "Régions",
      MAX_ARRAY_ITEMS,
      MAX_REGION_LENGTH,
    );

    const cities = validateArray(
      args.cities,
      "Villes",
      MAX_ARRAY_ITEMS,
      MAX_CITY_LENGTH,
    );

    const minAmount = validateNonNegativeNumber(
      args.minAmount,
      "Montant minimum",
    );

    const maxAmount = validateNonNegativeNumber(
      args.maxAmount,
      "Montant maximum",
    );

    if (
      minAmount !== undefined &&
      maxAmount !== undefined &&
      minAmount > maxAmount
    ) {
      fail("Le montant minimum dépasse le maximum", "INVALID_AMOUNT_RANGE");
    }

    const currency = validateOptionalText(args.currency, "Devise", 20);

    const timestamp = now();

    const watchlistId = await ctx.db.insert("urbanWatchlists", {
      userId: user._id,
      name,
      keywords,
      categories,
      countries,
      regions,
      cities,
      minAmount,
      maxAmount,
      currency,
      active: validateBoolean(args.active),
      notifyNewOpportunity: validateBoolean(args.notifyNewOpportunity),
      notifyDeadline: validateBoolean(args.notifyDeadline),
      notifyStatusChange: validateBoolean(args.notifyStatusChange),
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      watchlistId,
    };
  },
});

export const updateWatchlist = mutation({
  args: {
    watchlistId: v.id("urbanWatchlists"),
    name: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    categories: v.optional(v.array(v.string())),
    countries: v.optional(v.array(v.string())),
    regions: v.optional(v.array(v.string())),
    cities: v.optional(v.array(v.string())),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    active: v.optional(v.boolean()),
    notifyNewOpportunity: v.optional(v.boolean()),
    notifyDeadline: v.optional(v.boolean()),
    notifyStatusChange: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const watchlist = await requireOwnedWatchlist(
      ctx,
      args.watchlistId,
      user._id,
    );

    const patch: Record<string, unknown> = {};

    if (args.name !== undefined) {
      patch.name = validateText(
        args.name,
        "Nom de la veille",
        MAX_WATCHLIST_NAME_LENGTH,
      );
    }

    if (args.keywords !== undefined) {
      patch.keywords = validateArray(args.keywords, "Mots-clés");
    }

    if (args.categories !== undefined) {
      patch.categories = validateEnumArray(
        args.categories,
        OPPORTUNITY_CATEGORIES,
        "Catégorie",
      );
    }

    if (args.countries !== undefined) {
      patch.countries = validateArray(
        args.countries,
        "Pays",
        MAX_ARRAY_ITEMS,
        MAX_COUNTRY_LENGTH,
      );
    }

    if (args.regions !== undefined) {
      patch.regions = validateArray(
        args.regions,
        "Régions",
        MAX_ARRAY_ITEMS,
        MAX_REGION_LENGTH,
      );
    }

    if (args.cities !== undefined) {
      patch.cities = validateArray(
        args.cities,
        "Villes",
        MAX_ARRAY_ITEMS,
        MAX_CITY_LENGTH,
      );
    }

    if (args.minAmount !== undefined) {
      if (!Number.isFinite(args.minAmount) || args.minAmount < 0) {
        fail("Montant minimum invalide", "INVALID_AMOUNT");
      }

      patch.minAmount = args.minAmount;
    }

    if (args.maxAmount !== undefined) {
      if (!Number.isFinite(args.maxAmount) || args.maxAmount < 0) {
        fail("Montant maximum invalide", "INVALID_AMOUNT");
      }

      patch.maxAmount = args.maxAmount;
    }

    const effectiveMin = args.minAmount ?? watchlist.minAmount;

    const effectiveMax = args.maxAmount ?? watchlist.maxAmount;

    if (
      effectiveMin !== undefined &&
      effectiveMax !== undefined &&
      effectiveMin > effectiveMax
    ) {
      fail("Le montant minimum dépasse le maximum", "INVALID_AMOUNT_RANGE");
    }

    if (args.currency !== undefined) {
      patch.currency = validateOptionalText(args.currency, "Devise", 20);
    }

    if (args.active !== undefined) {
      patch.active = validateBoolean(args.active);
    }

    if (args.notifyNewOpportunity !== undefined) {
      patch.notifyNewOpportunity = validateBoolean(args.notifyNewOpportunity);
    }

    if (args.notifyDeadline !== undefined) {
      patch.notifyDeadline = validateBoolean(args.notifyDeadline);
    }

    if (args.notifyStatusChange !== undefined) {
      patch.notifyStatusChange = validateBoolean(args.notifyStatusChange);
    }

    await ctx.db.patch(args.watchlistId, {
      ...patch,
      updatedAt: now(),
    });

    return {
      success: true,
      watchlistId: args.watchlistId,
    };
  },
});

export const deleteWatchlist = mutation({
  args: {
    watchlistId: v.id("urbanWatchlists"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireOwnedWatchlist(ctx, args.watchlistId, user._id);

    await ctx.db.delete(args.watchlistId);

    return {
      success: true,
      watchlistId: args.watchlistId,
    };
  },
});

// ============================================================================
// HISTORIQUE / AUDIT
// ============================================================================

export const listTenderEvents = query({
  args: {
    tenderId: v.id("urbanTenders"),
  },

  handler: async (ctx, args) => {
    const tender = await ctx.db.get(args.tenderId);

    if (!tender) {
      return [];
    }

    return await ctx.db
      .query("urbanTenderEvents")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .take(MAX_EVENTS_RETURNED);
  },
});

/**
 * Journal interne.
 *
 * Le frontend ne peut pas fabriquer arbitrairement
 * des événements d'audit.
 */
export const recordTenderEvent = internalMutation({
  args: {
    tenderId: v.id("urbanTenders"),
    actorId: v.optional(v.id("users")),
    type: v.string(),
    fromStatus: v.optional(v.string()),
    toStatus: v.optional(v.string()),
    message: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
  },

  handler: async (ctx, args) => {
    return await createTenderAuditEvent(ctx, {
      tenderId: args.tenderId,
      actorId: args.actorId,
      type: args.type,
      fromStatus: args.fromStatus,
      toStatus: args.toStatus,
      message: args.message,
      metadata: args.metadata,
    });
  },
});

// ============================================================================
// ÉNERGIE — PARAMÈTRES
// ============================================================================

export const getEnergySettings = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return null;
    }

    return await ctx.db
      .query("energySettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const saveEnergySettings = mutation({
  args: {
    autoSave: v.boolean(),
    solarAlerts: v.boolean(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const autoSave = validateBoolean(args.autoSave);

    const solarAlerts = validateBoolean(args.solarAlerts);

    const existing = await ctx.db
      .query("energySettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        autoSave,
        solarAlerts,
      });

      return {
        success: true,
        settingsId: existing._id,
      };
    }

    const settingsId = await ctx.db.insert("energySettings", {
      userId: user._id,
      autoSave,
      solarAlerts,
    });

    return {
      success: true,
      settingsId,
    };
  },
});

// ============================================================================
// LOGEMENT — FAVORIS & VISITES
// ============================================================================

export const getHousingData = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return {
        favorites: [],
        bookings: [],
      };
    }

    const favorites = await ctx.db
      .query("housingFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_HOUSING_ITEMS_RETURNED);

    const bookings = await ctx.db
      .query("visitBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_HOUSING_ITEMS_RETURNED);

    return {
      favorites: favorites.map((favorite) => favorite.listingId),
      bookings: bookings.map((booking) => booking.listingId),
    };
  },
});

export const toggleHousingFavorite = mutation({
  args: {
    listingId: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const listingId = validateText(
      args.listingId,
      "Identifiant du bien",
      MAX_LISTING_ID_LENGTH,
    );

    const existing = await ctx.db
      .query("housingFavorites")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", user._id).eq("listingId", listingId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      return {
        success: true,
        favorited: false,
      };
    }

    await ctx.db.insert("housingFavorites", {
      userId: user._id,
      listingId,
    });

    return {
      success: true,
      favorited: true,
    };
  },
});

export const toggleVisitBooking = mutation({
  args: {
    listingId: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const listingId = validateText(
      args.listingId,
      "Identifiant du bien",
      MAX_LISTING_ID_LENGTH,
    );

    const existing = await ctx.db
      .query("visitBookings")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", user._id).eq("listingId", listingId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      return {
        success: true,
        booked: false,
      };
    }

    await ctx.db.insert("visitBookings", {
      userId: user._id,
      listingId,
    });

    return {
      success: true,
      booked: true,
    };
  },
});
