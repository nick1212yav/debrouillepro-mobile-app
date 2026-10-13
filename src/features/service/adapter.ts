// src/features/service/adapter.ts
//
// Adaptateurs Services V1.
//
// Sémantique :
//   - Doc<serviceProviders> → ServiceProviderV1 (type frontend étendu)
//   - compatibilité V0 : `price: string` reste exposé
//   - champs V1 exposés : basePrice, priceCurrency, pricingModel, status…
//   - publication "service" → vue dégradée, sans cast d'ID non vérifié
//
// NOTE : deux limitations structurelles assumées et documentées —
//   (a) `meta` provient d'un champ Convex `v.optional(v.any())` côté
//       publication, sans validator runtime. On type `unknown` puis
//       on extrait prudemment, sans cast en bloc.
//   (b) `providerId` issu de meta ne peut pas être prouvé
//       `Id<"serviceProviders">` au runtime. On marque la vue publication
//       comme non authoritative via un flag `fromPublication: true`.

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ServiceProvider, ServiceCategory } from "./types";

// ────────────────────────────────────────────────────────────────
// TYPES V1
// ────────────────────────────────────────────────────────────────

export type ServicePricingModel =
  | "fixed"
  | "hourly"
  | "daily"
  | "quote_only"
  | "package";

export type ServiceStatus =
  | "draft"
  | "active"
  | "paused"
  | "suspended"
  | "archived";

export type ServiceProviderV1 = ServiceProvider & {
  basePrice?: number;
  priceCurrency?: string;
  pricingModel?: ServicePricingModel;
  billingUnit?: string;
  minPrice?: number;
  maxPrice?: number;
  depositPercent?: number;

  status?: ServiceStatus;
  isDemo?: boolean;

  phone?: string;
  whatsapp?: string;
  website?: string;
  businessEmail?: string;

  serviceAreas?: string[];
  serviceRadiusKm?: number;
  intervenesAtClientAddress?: boolean;
  intervenesAtProviderAddress?: boolean;
  intervenesOnline?: boolean;

  cancellationPolicy?: string;
  cancellationWindowHours?: number;
  paymentMethodsAccepted?: ("cash" | "mobile_money" | "card" | "wallet")[];

  /** Vrai si la source est une publication, pas un doc `serviceProviders`. */
  fromPublication?: boolean;
};

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

const KNOWN_CATEGORIES: ServiceCategory[] = [
  "Dépannage",
  "Éducation",
  "Beauté",
  "Bien-être",
  "Livraison",
  "Photo",
];

/**
 * Résout une catégorie :
 *   - match case-insensitive sur les 6 canoniques → renvoie le libellé exact
 *   - sinon → renvoie la chaîne brute (pas de fallback trompeur)
 */
function resolveCategory(raw: string): ServiceCategory {
  if (!raw) return "Services" as ServiceCategory;
  const found = KNOWN_CATEGORIES.find(
    (c) => c.toLowerCase() === raw.toLowerCase(),
  );
  return (found ?? raw) as ServiceCategory;
}

/**
 * Priorité : basePrice + priceCurrency (V1) > price legacy (V0).
 * Formate une chaîne courte, avec suffixe si pricingModel est horaire/journalier.
 */
function resolvePriceLabel(doc: Doc<"serviceProviders">): string {
  if (doc.basePrice !== undefined && doc.priceCurrency) {
    const suffix =
      doc.pricingModel === "hourly"
        ? "/h"
        : doc.pricingModel === "daily"
          ? "/j"
          : "";
    return `${doc.basePrice} ${doc.priceCurrency}${suffix}`;
  }
  return doc.price;
}

/**
 * Extrait un champ string d'un objet meta non typé.
 * Retourne undefined si absent ou de type incorrect.
 */
function metaString(
  meta: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = meta[key];
  return typeof v === "string" ? v : undefined;
}

function metaNumber(
  meta: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = meta[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function metaBool(
  meta: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const v = meta[key];
  return typeof v === "boolean" ? v : undefined;
}

function metaStringArray(
  meta: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const v = meta[key];
  if (!Array.isArray(v)) return undefined;
  return v.every((x) => typeof x === "string") ? (v as string[]) : undefined;
}

function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

// ────────────────────────────────────────────────────────────────
// ADAPTATEUR PRINCIPAL — Doc<serviceProviders> → ServiceProviderV1
// ────────────────────────────────────────────────────────────────

export function adaptServiceProvider(
  doc: Doc<"serviceProviders">,
): ServiceProviderV1 {
  return {
    // ── Champs V0
    _id: doc._id,
    userId: doc.userId,
    name: doc.name,
    category: resolveCategory(doc.category),
    specialty: doc.specialty,
    location: doc.location,
    description: doc.description,
    price: resolvePriceLabel(doc),
    currency: doc.currency ?? "USD",
    responseTime: doc.responseTime,
    imageUrl: doc.imageUrl,
    coverImage: doc.coverImage,
    rating: doc.rating ?? 0,
    reviewCount: doc.reviewCount ?? 0,
    skills: doc.skills ?? [],
    verified: doc.verified ?? false,
    available: doc.available ?? false,
    urgent: doc.urgent ?? false,
    languages: doc.languages ?? [],
    experience: doc.experience ?? "",
    certificates: doc.certificates ?? [],
    portfolio: doc.portfolio ?? [],
    updatedAt: doc.updatedAt ?? doc._creationTime,
    insurance: doc.insurance ?? false,
    warranty: doc.warranty ?? false,
    online: doc.online ?? false,
    lastActive: doc.lastActive ?? Date.now(),
    createdAt: doc.createdAt ?? doc._creationTime,

    // ── V1
    basePrice: doc.basePrice,
    priceCurrency: doc.priceCurrency,
    pricingModel: doc.pricingModel as ServicePricingModel | undefined,
    billingUnit: doc.billingUnit,
    minPrice: doc.minPrice,
    maxPrice: doc.maxPrice,
    depositPercent: doc.depositPercent,
    status: doc.status as ServiceStatus | undefined,
    isDemo: doc.isDemo,

    phone: doc.phone,
    whatsapp: doc.whatsapp,
    website: doc.website,
    businessEmail: doc.businessEmail,

    serviceAreas: doc.serviceAreas,
    serviceRadiusKm: doc.serviceRadiusKm,
    intervenesAtClientAddress: doc.intervenesAtClientAddress,
    intervenesAtProviderAddress: doc.intervenesAtProviderAddress,
    intervenesOnline: doc.intervenesOnline,

    cancellationPolicy: doc.cancellationPolicy,
    cancellationWindowHours: doc.cancellationWindowHours,
    paymentMethodsAccepted: doc.paymentMethodsAccepted,
  };
}

// ────────────────────────────────────────────────────────────────
// ADAPTATEUR PUBLICATION — vue dégradée, flag `fromPublication`
// ────────────────────────────────────────────────────────────────

/**
 * Adapte une publication de type "service" en vue dégradée.
 *
 * ATTENTION : cette fonction ne produit PAS un ServiceProvider authoritative.
 * Le champ `_id` peut être un ID de publication si `meta.providerId` est absent
 * ou invalide. Le flag `fromPublication: true` permet aux composants de
 * router différemment (page détail publication vs page détail prestataire).
 *
 * Retourne null si la publication n'est pas de type "service".
 */
export function adaptServiceFromPublication(
  publication: Doc<"publications">,
): ServiceProviderV1 | null {
  if (publication.type !== "service") return null;

  const meta = parseMeta(publication.meta);

  const portfolio: string[] =
    publication.images && publication.images.length > 0
      ? publication.images
      : (metaStringArray(meta, "portfolio") ?? []);

  // `providerId` : si absent, on utilise `publication._id` en le marquant
  // comme non-authoritative via `fromPublication: true`.
  const providerIdFromMeta = metaString(meta, "providerId");
  const resolvedId = (providerIdFromMeta ??
    publication._id) as Id<"serviceProviders">;

  return {
    // ── V0
    _id: resolvedId,
    userId: publication.authorId,
    name: publication.title,
    category: resolveCategory(metaString(meta, "category") ?? "Services"),
    specialty: metaString(meta, "specialty") ?? "",
    location: publication.location ?? "",
    description: publication.description ?? "",
    price: metaString(meta, "price") ?? publication.price ?? "",
    currency: metaString(meta, "currency") ?? "USD",
    responseTime: metaString(meta, "responseTime") ?? "Sur demande",
    imageUrl: publication.images?.[0] ?? metaString(meta, "imageUrl"),
    coverImage: metaString(meta, "coverImage"),
    rating: metaNumber(meta, "rating") ?? 0,
    reviewCount: metaNumber(meta, "reviewCount") ?? 0,
    skills: metaStringArray(meta, "skills") ?? [],
    verified: metaBool(meta, "verified") ?? false,
    available: metaBool(meta, "available") ?? true,
    urgent: metaBool(meta, "urgent") ?? false,
    languages: metaStringArray(meta, "languages") ?? [],
    experience: metaString(meta, "experience") ?? "",
    certificates: metaStringArray(meta, "certificates") ?? [],
    portfolio,
    updatedAt: publication._creationTime,
    insurance: metaBool(meta, "insurance") ?? false,
    warranty: metaBool(meta, "warranty") ?? false,
    online: metaBool(meta, "online") ?? false,
    lastActive: metaNumber(meta, "lastActive") ?? Date.now(),
    createdAt: publication._creationTime,

    // ── Marqueur de source
    fromPublication: true,
  };
}
