// src/features/publications/modules/service.tsx

import { Linking } from "react-native";

import { ServiceCard as ServiceContent } from "@/features/service/components";
import type {
  ServiceCategory,
  ServiceProvider,
} from "@/features/service/types";

import type { Id } from "../../../../convex/_generated/dataModel";

import {
  getBoolean,
  getNumber,
  getOptionalString,
  getString,
  getStringArray,
  parseMeta,
} from "../meta";
import { registerPublicationRenderer } from "../registry";
import type { Publication } from "../types";

/* ── Whitelists ───────────────────────────────────────────────────────── */

const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  "Dépannage",
  "Beauté",
  "Livraison",
  "Éducation",
  "Photo",
  "Bien-être",
  "Événementiel",
  "Ménage",
  "Jardinage",
  "Informatique",
  "Plomberie",
  "Électricité",
  "Construction",
  "Transport",
  "Autre",
];

function isServiceCategory(value: string): value is ServiceCategory {
  return (SERVICE_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Une publication `service` et un `serviceProvider` Convex partagent le
 * même identifiant applicatif (relation 1-1).
 */
function asServiceProviderId(
  publicationId: Publication["_id"],
): Id<"serviceProviders"> {
  return publicationId as unknown as Id<"serviceProviders">;
}

/* ── Renderer ──────────────────────────────────────────────────────────── */

registerPublicationRenderer(
  "service",
  ({
    publication,
    index,
    onLike,
    onComment,
    onShare,
    onBookmark,
    isLiked,
    isBookmarked,
  }) => {
    const meta = parseMeta(publication.meta);

    const categoryRaw = getString(meta, "category", "Autre");
    const category: ServiceCategory = isServiceCategory(categoryRaw)
      ? categoryRaw
      : "Autre";

    const provider: ServiceProvider = {
      _id: asServiceProviderId(publication._id),
      userId: publication.authorId,
      name: publication.title,
      category,
      specialty: getString(meta, "specialty"),
      location: publication.location || "",
      description: publication.description || "",
      price: getString(meta, "price", publication.price || ""),
      currency: getString(meta, "currency", "USD"),
      responseTime: getString(meta, "responseTime", "Sur demande"),
      imageUrl: publication.images?.[0],
      coverImage: getOptionalString(meta, "coverImage"),
      rating: getNumber(meta, "rating", 4.5),
      reviewCount: getNumber(meta, "reviewCount", 0),
      skills: getStringArray(meta, "skills"),
      verified: getBoolean(meta, "verified"),
      available: getBoolean(meta, "available", true),
      urgent: getBoolean(meta, "urgent"),
      languages: getStringArray(meta, "languages"),
      experience: getOptionalString(meta, "experience"),
      certificates: getStringArray(meta, "certificates"),
      portfolio: getStringArray(meta, "portfolio"),
      createdAt: publication._creationTime,
      updatedAt: publication._creationTime,
      insurance: getBoolean(meta, "insurance"),
      warranty: getBoolean(meta, "warranty"),
      distance: undefined,
      online: getBoolean(meta, "online"),
      lastActive: getNumber(meta, "lastActive", Date.now()),
    };

    const phone = getString(meta, "phone");

    const handleCall = (value: string) => {
      if (!value) {
        return;
      }
      void Linking.openURL(`tel:${value}`);
    };

    const handleBook = () => {
      const providerId = getOptionalString(meta, "providerId");
      if (!providerId) {
        return;
      }
      void Linking.openURL(`/service/${providerId}`);
    };

    return (
      <ServiceContent
        service={provider}
        index={index}
        phone={phone}
        onCall={handleCall}
        onBook={handleBook}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />
    );
  },
);
