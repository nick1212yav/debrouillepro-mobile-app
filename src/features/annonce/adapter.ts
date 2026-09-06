import type { Doc } from "@/convex/_generated/dataModel";
import type { Annonce, AnnonceCondition } from "./types";

export function adaptAnnonce(pub: Doc<"publications">): Annonce {
  // On extrait les champs depuis `meta` si présents (string JSON)
  let metaData: any = {};
  if (pub.meta) {
    try {
      metaData = typeof pub.meta === "string" ? JSON.parse(pub.meta) : pub.meta;
    } catch {
      metaData = {};
    }
  }

  // Le type de l'annonce est soit le premier tag (si c'est une annonce) ou on utilise "divers"
  const type = (pub.tags?.[0] as any) || "divers";

  return {
    _id: pub._id,
    type,
    title: pub.title,
    description: pub.description,
    price: pub.price ? parseFloat(pub.price) : undefined,
    currency: metaData.currency || "USD",
    images: pub.images || [],
    videos: metaData.videos || [],
    location: pub.location || undefined,
    latitude: pub.latitude,
    longitude: pub.longitude,
    condition: (metaData.condition as AnnonceCondition) || undefined,
    tags: pub.tags || [],
    createdAt: pub._creationTime,
    updatedAt: metaData.updatedAt || pub._creationTime,
    ownerId: pub.authorId,
    ownerName: metaData.authorName,
    ownerAvatar: metaData.authorAvatar,
    ownerPhone: metaData.authorPhone,
    viewCount: pub.viewCount || 0,
    likeCount: pub.likeCount || 0,
    shareCount: metaData.shareCount || 0,
    offerCount: metaData.offerCount || 0,
    isPromoted: metaData.isPromoted || false,
    isPremium: metaData.isPremium || false,
    promotionEnd: metaData.promotionEnd,
    isReserved: metaData.isReserved || false,
    isSold: metaData.isSold || false,
    warrantyMonths: metaData.warrantyMonths,
    deliveryAvailable: metaData.deliveryAvailable || false,
    deliveryPrice: metaData.deliveryPrice,
    paymentMethods: metaData.paymentMethods || [],
    negotiable: metaData.negotiable || false,
    minPrice: metaData.minPrice,
    avgRating: metaData.avgRating,
    reviewCount: metaData.reviewCount,
  };
}
