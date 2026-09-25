import type { Doc } from "@/convex/_generated/dataModel";
import type { Annonce, AnnonceCondition, AnnonceType } from "./types";

type JsonRecord = Record<string, unknown>;

type PublicationInput = Omit<Doc<"publications">, "meta"> & {
  meta?: string | JsonRecord;
};

const ANNONCE_TYPES = new Set<AnnonceType>([
  "immobilier",
  "automobile",
  "moto",
  "camion",
  "pieces-auto",
  "telephones",
  "ordinateurs",
  "tablettes",
  "tv",
  "audio",
  "gaming",
  "electromenager",
  "mode",
  "chaussures",
  "beaute",
  "sante",
  "sport",
  "bricolage",
  "construction",
  "agriculture",
  "animaux",
  "emploi",
  "services",
  "formation",
  "livres",
  "musique",
  "art",
  "collection",
  "bebes",
  "maison",
  "meubles",
  "decoration",
  "industrie",
  "mines",
  "materiel-pro",
  "hotellerie",
  "restaurant",
  "voyage",
  "tourisme",
  "evenements",
  "divers",
]);

const ANNONCE_CONDITIONS = new Set<AnnonceCondition>([
  "neuf",
  "comme-neuf",
  "tres-bon",
  "bon",
  "acceptable",
  "a-renover",
]);

function isAnnonceType(value: string): value is AnnonceType {
  return ANNONCE_TYPES.has(value as AnnonceType);
}

function isAnnonceCondition(value: string): value is AnnonceCondition {
  return ANNONCE_CONDITIONS.has(value as AnnonceCondition);
}

function parseMeta(meta: PublicationInput["meta"]): JsonRecord {
  if (!meta) {
    return {};
  }

  if (typeof meta === "object") {
    return meta;
  }

  try {
    const parsed: unknown = JSON.parse(meta);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as JsonRecord;
    }
  } catch {
    // Meta invalide : on revient au contrat sûr.
  }

  return {};
}

function getString(source: JsonRecord, key: string): string | undefined {
  const value = source[key];

  return typeof value === "string" ? value : undefined;
}

function getNumber(source: JsonRecord, key: string): number | undefined {
  const value = source[key];

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function getBoolean(
  source: JsonRecord,
  key: string,
  fallback = false,
): boolean {
  const value = source[key];

  return typeof value === "boolean" ? value : fallback;
}

function getStringArray(source: JsonRecord, key: string): string[] {
  const value = source[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s/g, "").replace(",", ".");

  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveAnnonceType(tags: string[], meta: JsonRecord): AnnonceType {
  const metaType = getString(meta, "type");

  if (metaType && isAnnonceType(metaType)) {
    return metaType;
  }

  const tagType = tags.find(isAnnonceType);

  return tagType ?? "divers";
}

function resolveCondition(meta: JsonRecord): AnnonceCondition | undefined {
  const value = getString(meta, "condition");

  return value && isAnnonceCondition(value) ? value : undefined;
}

export function adaptAnnonce(pub: PublicationInput): Annonce {
  const metaData = parseMeta(pub.meta);

  const tags = pub.tags ?? [];

  const price =
    typeof pub.price === "string" ? parsePrice(pub.price) : undefined;

  const type = resolveAnnonceType(tags, metaData);
  const condition = resolveCondition(metaData);

  return {
    _id: pub._id,
    type,

    title: pub.title,
    description: pub.description ?? "",

    price,

    currency: getString(metaData, "currency") ?? "USD",

    images: pub.images ?? [],

    videos: getStringArray(metaData, "videos"),

    location: pub.location ?? undefined,
    latitude: pub.latitude ?? undefined,
    longitude: pub.longitude ?? undefined,

    condition,

    tags,

    createdAt: pub._creationTime,

    updatedAt: getNumber(metaData, "updatedAt") ?? pub._creationTime,

    ownerId: pub.authorId,

    ownerName: getString(metaData, "authorName"),

    ownerAvatar: getString(metaData, "authorAvatar"),

    ownerPhone: getString(metaData, "authorPhone"),

    viewCount: pub.viewCount ?? 0,

    likeCount: pub.likeCount ?? 0,

    shareCount: getNumber(metaData, "shareCount") ?? 0,

    offerCount: getNumber(metaData, "offerCount") ?? 0,

    isPromoted: getBoolean(metaData, "isPromoted"),

    isPremium: getBoolean(metaData, "isPremium"),

    promotionEnd: getNumber(metaData, "promotionEnd"),

    isReserved: getBoolean(metaData, "isReserved"),

    isSold: getBoolean(metaData, "isSold"),

    warrantyMonths: getNumber(metaData, "warrantyMonths"),

    deliveryAvailable: getBoolean(metaData, "deliveryAvailable"),

    deliveryPrice: getNumber(metaData, "deliveryPrice"),

    paymentMethods: getStringArray(metaData, "paymentMethods"),

    negotiable: getBoolean(metaData, "negotiable"),

    minPrice: getNumber(metaData, "minPrice"),

    avgRating: getNumber(metaData, "avgRating"),

    reviewCount: getNumber(metaData, "reviewCount"),
  };
}
