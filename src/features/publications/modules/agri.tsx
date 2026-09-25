// src/features/publications/modules/agri.tsx

import { Linking } from "react-native";

import { AgriCard } from "@/features/agri/components/card/AgriCard";
import type {
  AgriCategory,
  AgriCondition,
  AgriProduct,
  AgriQuality,
  AgriUnit,
} from "@/features/agri/types/product.types";

import type { Id } from "../../../../convex/_generated/dataModel";

import {
  extractValidImages,
  getBoolean,
  getNumber,
  getOptionalNumber,
  getOptionalString,
  getString,
  getStringArray,
  isRecord,
  parseMeta,
  type MetaRecord,
} from "../meta";
import { registerPublicationRenderer } from "../registry";
import type { Publication } from "../types";

/* ── Whitelists + type guards ──────────────────────────────────────────── */

const AGRI_CATEGORIES: readonly AgriCategory[] = [
  "cereales",
  "legumes",
  "fruits",
  "intrants",
  "materiel",
  "conseil",
];

const AGRI_UNITS: readonly AgriUnit[] = [
  "kg",
  "tonne",
  "sac",
  "botte",
  "piece",
  "litre",
  "hectare",
];

const AGRI_QUALITIES: readonly AgriQuality[] = [
  "premium",
  "bonne",
  "standard",
  "recolte",
  "bio",
];

const AGRI_CONDITIONS: readonly AgriCondition[] = [
  "frais",
  "seche",
  "conserve",
  "surgeler",
];

const AGRI_AVAILABILITY_STATUSES = [
  "available",
  "limited",
  "sold_out",
  "pre_order",
] as const;

type AgriAvailabilityStatus = (typeof AGRI_AVAILABILITY_STATUSES)[number];

function isAgriCategory(value: string): value is AgriCategory {
  return (AGRI_CATEGORIES as readonly string[]).includes(value);
}

function isAgriUnit(value: string): value is AgriUnit {
  return (AGRI_UNITS as readonly string[]).includes(value);
}

function isAgriQuality(value: string): value is AgriQuality {
  return (AGRI_QUALITIES as readonly string[]).includes(value);
}

function isAgriCondition(value: string): value is AgriCondition {
  return (AGRI_CONDITIONS as readonly string[]).includes(value);
}

function isAgriAvailabilityStatus(
  value: string,
): value is AgriAvailabilityStatus {
  return (AGRI_AVAILABILITY_STATUSES as readonly string[]).includes(value);
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

/**
 * Les publications de type `agri` et la table `agriProducts` partagent le même
 * identifiant Convex (relation 1-1 applicative). TypeScript ne peut pas le
 * savoir, donc on l'annote explicitement ici, à un seul endroit.
 * À ne PAS propager ailleurs dans le code.
 */
function asAgriProductId(
  publicationId: Publication["_id"],
): Id<"agriProducts"> {
  return publicationId as unknown as Id<"agriProducts">;
}

/**
 * Accepte les deux conventions rencontrées dans `meta` :
 * - `{ lat, lng }` (format attendu par `AgriProduct`)
 * - `{ latitude, longitude }` (format hérité)
 * Retourne `undefined` si aucune paire de nombres finis n'est disponible.
 */
function parseCoordinates(
  value: unknown,
): { lat: number; lng: number } | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const lat =
    typeof value.lat === "number" && Number.isFinite(value.lat)
      ? value.lat
      : typeof value.latitude === "number" && Number.isFinite(value.latitude)
        ? value.latitude
        : undefined;

  const lng =
    typeof value.lng === "number" && Number.isFinite(value.lng)
      ? value.lng
      : typeof value.longitude === "number" && Number.isFinite(value.longitude)
        ? value.longitude
        : undefined;

  if (lat === undefined || lng === undefined) {
    return undefined;
  }

  return { lat, lng };
}

/* ── Transform ─────────────────────────────────────────────────────────── */

function transformToAgriProduct(
  publication: Publication,
  meta: MetaRecord,
): AgriProduct {
  const categoryRaw = getString(meta, "category", "cereales");
  const category: AgriCategory = isAgriCategory(categoryRaw)
    ? categoryRaw
    : "cereales";

  const unitRaw = getString(meta, "unit", "kg");
  const unit: AgriUnit = isAgriUnit(unitRaw) ? unitRaw : "kg";

  const qualityRaw = getString(meta, "quality", "standard");
  const quality: AgriQuality = isAgriQuality(qualityRaw)
    ? qualityRaw
    : "standard";

  const conditionRaw = getOptionalString(meta, "condition");
  const condition: AgriCondition | undefined =
    conditionRaw !== undefined && isAgriCondition(conditionRaw)
      ? conditionRaw
      : undefined;

  const availabilityStatusRaw = getString(
    meta,
    "availabilityStatus",
    "available",
  );
  const availabilityStatus: AgriAvailabilityStatus = isAgriAvailabilityStatus(
    availabilityStatusRaw,
  )
    ? availabilityStatusRaw
    : "available";

  const priceUnitRaw = getString(meta, "priceUnit", unit);
  const priceUnit: AgriUnit = isAgriUnit(priceUnitRaw) ? priceUnitRaw : unit;

  return {
    _id: asAgriProductId(publication._id),
    _creationTime: publication._creationTime,

    title: publication.title || "Produit agricole",
    description: publication.description || "",
    category,
    subcategory: getOptionalString(meta, "subcategory"),
    variety: getOptionalString(meta, "variety"),
    quality,
    condition,

    quantity: {
      available: getNumber(meta, "quantity", 0),
      unit,
      minimumOrder: getOptionalNumber(meta, "minimumOrder"),
    },

    pricing: {
      price: getNumber(meta, "price", 0),
      currency: getString(meta, "currency", "FCFA"),
      priceUnit,
      negotiable: getBoolean(meta, "negotiable", false),
    },

    availability: {
      status: availabilityStatus,
      harvestDate: getOptionalString(meta, "harvestDate"),
      season: getOptionalString(meta, "season"),
    },

    media: {
      images: extractValidImages(publication.images),
      videos: getStringArray(meta, "videos"),
    },

    location: {
      country: getString(meta, "country", "Congo"),
      province: getOptionalString(meta, "province"),
      city: getString(meta, "city", publication.location || "Inconnu"),
      territory: getOptionalString(meta, "territory"),
      coordinates: parseCoordinates(meta.coordinates),
    },

    seller: {
      userId: publication.authorId,
      name: getString(meta, "sellerName", "Vendeur"),
      verified: getBoolean(meta, "sellerVerified", false),
      rating: getNumber(meta, "rating", 5),
      reviewCount: getNumber(meta, "reviewCount", 0),
      joinedAt: getString(meta, "joinedAt", new Date().toISOString()),
    },

    delivery: {
      available: getBoolean(meta, "deliveryAvailable", false),
      radius: getOptionalNumber(meta, "deliveryRadius"),
      price: getOptionalNumber(meta, "deliveryPrice"),
      pickupAvailable: getBoolean(meta, "pickupAvailable", true),
    },

    stats: {
      views: publication.viewCount || 0,
      favorites: publication.likeCount || 0,
      contacts: getNumber(meta, "contacts", 0),
    },
  };
}

registerPublicationRenderer("agri", ({ publication, isLiked, onLike }) => {
  const meta = parseMeta(publication.meta);
  const product = transformToAgriProduct(publication, meta);

  const handleToggleFavorite = () => {
    onLike();
  };

  const handleClick = () => {
    void Linking.openURL(`/agri/${publication._id}`);
  };

  return (
    <AgriCard
      product={product}
      isFavorite={isLiked}
      onToggleFavorite={handleToggleFavorite}
      onClick={handleClick}
    />
  );
});
