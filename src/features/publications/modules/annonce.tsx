// src/features/publications/modules/annonce.tsx

import { AnnonceCard as AnnonceContent } from "@/features/annonce/components";
import type {
  Annonce,
  AnnonceCondition,
  AnnonceType,
} from "@/features/annonce/types";

import {
  getBoolean,
  getNumber,
  getOptionalNumber,
  getOptionalString,
  getString,
  getStringArray,
  parseMeta,
} from "../meta";
import { registerPublicationRenderer } from "../registry";

/* ── Whitelists ───────────────────────────────────────────────────────── */

const ANNONCE_TYPES: readonly AnnonceType[] = [
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
];

const ANNONCE_CONDITIONS: readonly AnnonceCondition[] = [
  "neuf",
  "comme-neuf",
  "tres-bon",
  "bon",
  "acceptable",
  "a-renover",
];

function isAnnonceType(value: string): value is AnnonceType {
  return (ANNONCE_TYPES as readonly string[]).includes(value);
}

function isAnnonceCondition(value: string): value is AnnonceCondition {
  return (ANNONCE_CONDITIONS as readonly string[]).includes(value);
}

/* ── Renderer ──────────────────────────────────────────────────────────── */

registerPublicationRenderer(
  "annonce",
  ({ publication, index, onLike, isLiked }) => {
    const meta = parseMeta(publication.meta);

    const typeRaw =
      getString(meta, "type") || publication.tags?.[0] || "divers";
    const type: AnnonceType = isAnnonceType(typeRaw) ? typeRaw : "divers";

    const conditionRaw = getOptionalString(meta, "condition");
    const condition: AnnonceCondition | undefined =
      conditionRaw !== undefined && isAnnonceCondition(conditionRaw)
        ? conditionRaw
        : undefined;

    const annonceData: Annonce = {
      _id: publication._id,
      type,
      title: publication.title || "Annonce",
      description: publication.description || "",
      price: getOptionalNumber(meta, "price"),
      currency: getString(meta, "currency", "USD"),
      images: publication.images || [],
      videos: getStringArray(meta, "videos"),
      location: publication.location || undefined,
      latitude: getOptionalNumber(meta, "latitude"),
      longitude: getOptionalNumber(meta, "longitude"),
      condition,
      tags: publication.tags || [],
      createdAt: publication._creationTime,
      updatedAt: publication._creationTime,
      ownerId: publication.authorId,
      ownerName: getOptionalString(meta, "ownerName"),
      ownerAvatar: getOptionalString(meta, "ownerAvatar"),
      ownerPhone: getOptionalString(meta, "ownerPhone"),
      viewCount: publication.viewCount || 0,
      likeCount: publication.likeCount || 0,
      shareCount: getNumber(meta, "shareCount", 0),
      offerCount: getNumber(meta, "offerCount", 0),
      isPromoted: getBoolean(meta, "isPromoted"),
      isPremium: getBoolean(meta, "isPremium"),
      promotionEnd: getOptionalNumber(meta, "promotionEnd"),
      isReserved: getBoolean(meta, "isReserved"),
      isSold: getBoolean(meta, "isSold"),
      warrantyMonths: getOptionalNumber(meta, "warrantyMonths"),
      deliveryAvailable: getBoolean(meta, "deliveryAvailable"),
      deliveryPrice: getOptionalNumber(meta, "deliveryPrice"),
      paymentMethods: getStringArray(meta, "paymentMethods"),
      negotiable: getBoolean(meta, "negotiable"),
      minPrice: getOptionalNumber(meta, "minPrice"),
      avgRating: getOptionalNumber(meta, "avgRating"),
      reviewCount: getNumber(meta, "reviewCount", 0),
    };

    return (
      <AnnonceContent
        annonce={annonceData}
        index={index}
        onFavorite={() => onLike()}
        isFavorited={isLiked}
      />
    );
  },
);
