// src/features/publications/components/PublicationRenderer.tsx
import React from "react";
import type { Publication } from "../types";
import { PublicationCard } from "./PublicationCard";
import { JobCard } from "@/features/job/components/JobCard";
import { PropertyCard } from "@/features/immo/components/PropertyCard";
import { EventCard } from "@/features/events/components/EventCard";
import type { Event } from "@/features/events/types";

// ✅ Imports des cartes dédiées
import { AnnonceCard as AnnonceContent } from "@/features/annonce/components";
import { ServiceCard as ServiceContent } from "@/features/service/components";
import { ProductCard as ProductContent } from "@/features/marketplace/components/ProductCard";
import { CommunityCard } from "@/features/community/components/CommunityCard";
import { SanteCard } from "@/features/sante/components/SanteCard";
import { TransportCard } from "@/features/transport/components/TransportCard";
import { RestaurantCard } from "@/features/restauration/components/RestaurantCard";
import { HebergementCard } from "@/features/hebergement/components/HebergementCard";
import { AgriCard } from "@/features/agri/components/card/AgriCard";
import { NetworkCard } from "@/features/network/components/NetworkCard";
// ✅ Import de la carte Voyages dédiée
// À la ligne 22 de src/features/publications/components/PublicationRenderer.tsx
import { VoyageTripCard as VoyageCard } from "@/features/voyages/components/cards/VoyageTripCard"; // ✅ Corrigé [1]

import type { Annonce } from "@/features/annonce/types";
import type { ProductStatus } from "@/features/marketplace/types";
import type {
  CommunityPost,
  Mood,
  PostType,
  PostStatus,
} from "@/features/community/types";
import type { AgriProduct } from "@/features/agri/types/product.types";
import { Linking } from "react-native";

interface Props {
  publication: Publication;
  index: number;
  onLike: () => void;
  onVote?: (optionId: string) => void;
  onDelete?: () => void;
  onAction: (actionId: string) => void;
  onCTA: () => void;
  actionsSlot?: React.ReactNode;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (typeof url !== "string") return false;
  if (url.startsWith("blob:")) return false;
  if (url.startsWith("http://") || url.startsWith("https://")) return true;
  if (url.startsWith("data:image")) return true;
  if (url.startsWith("kg")) return false;
  if (url.length < 3) return false;
  return true;
}

function extractValidImages(
  raw: string | string[] | undefined | null,
): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    return isValidImageUrl(raw) ? [raw] : [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((url) => isValidImageUrl(url));
  }
  return [];
}

function parseMeta(meta: any): any {
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch {
      return {};
    }
  }
  return meta || {};
}

function transformToAgriProduct(
  publication: Publication,
  meta: any,
): AgriProduct {
  const category = meta?.category || "cereales";
  const unit = meta?.unit || "kg";
  const quality = meta?.quality || "standard";

  return {
    _id: publication._id as any,
    _creationTime: publication._creationTime,
    title: publication.title || "Produit agricole",
    description: publication.description || "",
    category,
    subcategory: meta?.subcategory,
    variety: meta?.variety,
    quality,
    condition: meta?.condition,
    quantity: {
      available: meta?.quantity ?? 0,
      unit,
      minimumOrder: meta?.minimumOrder,
    },
    pricing: {
      price: meta?.price ? parseFloat(meta.price) : 0,
      currency: meta?.currency || "FCFA",
      priceUnit: meta?.priceUnit || unit,
      negotiable: meta?.negotiable ?? false,
    },
    availability: {
      status: meta?.availabilityStatus || "available",
      harvestDate: meta?.harvestDate,
      season: meta?.season,
    },
    media: {
      images: extractValidImages(publication.images),
      videos: meta?.videos,
    },
    location: {
      country: meta?.country || "Congo",
      province: meta?.province,
      city: meta?.city || publication.location || "Inconnu",
      territory: meta?.territory,
      coordinates: meta?.coordinates,
    },
    seller: {
      userId: publication.authorId,
      name: meta?.sellerName || "Vendeur",
      verified: meta?.sellerVerified ?? false,
      rating: meta?.rating ? parseFloat(meta.rating) : 5.0,
      reviewCount: meta?.reviewCount || 0,
      joinedAt: meta?.joinedAt || new Date().toISOString(),
    },
    delivery: {
      available: meta?.deliveryAvailable ?? false,
      radius: meta?.deliveryRadius,
      price: meta?.deliveryPrice,
      pickupAvailable: meta?.pickupAvailable ?? true,
    },
    stats: {
      views: publication.viewCount || 0,
      favorites: publication.likeCount || 0,
      contacts: meta?.contacts || 0,
    },
  };
}

export function PublicationRenderer({
  publication,
  index,
  onLike,
  onVote,
  onDelete,
  onAction,
  onCTA,
  actionsSlot,
  isLiked = false,
  isBookmarked = false,
  onComment,
  onShare,
  onBookmark,
}: Props) {
  const meta = parseMeta(publication.meta);

  // ===== 1. Emploi =====
  if (publication.type === "job") {
    return (
      <JobCard
        publication={publication as any}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />
    );
  }

  // ===== 2. Immobilier =====
  if (publication.type === "immo") {
    return (
      <PropertyCard
        publication={publication as any}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />
    );
  }

  // ===== 3. Événements =====
  if (publication.type === "evenement") {
    const eventId = meta.eventId || publication._id;

    let images = extractValidImages(publication.images);
    if (images.length === 0) {
      const fallbackImages =
        extractValidImages(meta.gallery) || extractValidImages(meta.coverImage);
      images = fallbackImages;
    }

    const authorName =
      (publication as any).authorName || meta.authorName || "Anonyme";
    const authorAvatar = (publication as any).authorAvatar || meta.authorAvatar;
    const bookmarkedByMe = (publication as any).bookmarkedByMe ?? false;

    const event: Event = {
      _id: eventId,
      _creationTime: publication._creationTime,
      authorId: publication.authorId as any,
      authorName,
      authorAvatar,
      title: publication.title || "",
      description: publication.description || "",
      category: meta.category || "autre",
      startDate: meta.startDate || new Date().toISOString(),
      endDate: meta.endDate,
      location: meta.location || publication.location || "",
      address: meta.address,
      coverImage: images.length > 0 ? images[0] : undefined,
      gallery: images,
      videos: meta.videos || [],
      maxAttendees: meta.maxAttendees,
      isFree: meta.isFree ?? true,
      price: meta.price || publication.price,
      tags: publication.tags || meta.tags || [],
      status: meta.status || "upcoming",
      attendingCount: meta.attendingCount ?? 0,
      interestedCount: meta.interestedCount ?? 0,
      notGoingCount: meta.notGoingCount ?? 0,
      viewCount: publication.viewCount || 0,
      shareCount: publication.shareCount || 0,
      commentCount: publication.commentCount || 0,
      isAttending: meta.isAttending ?? false,
      isInterested: meta.isInterested ?? false,
      isMine: publication.isMine ?? false,
      likedByMe: publication.likedByMe ?? false,
      bookmarkedByMe,
      attendees: meta.attendees || [],
      comments: meta.comments || [],
      tickets: meta.tickets || [],
    };

    return (
      <EventCard
        event={event}
        index={index}
        onLike={onLike}
        onBookmark={onBookmark}
        onShare={onShare}
      />
    );
  }

  // ===== 4. Annonce =====
  if (publication.type === "annonce") {
    const annonceData: Annonce = {
      _id: publication._id,
      type: meta?.type || publication.tags?.[0] || "divers",
      title: publication.title || "Annonce",
      description: publication.description || "",
      price: meta?.price ? parseFloat(meta.price) : undefined,
      currency: meta?.currency || "USD",
      images: publication.images || [],
      videos: meta?.videos || [],
      location: publication.location || undefined,
      latitude: meta?.latitude,
      longitude: meta?.longitude,
      condition: meta?.condition,
      tags: publication.tags || [],
      createdAt: publication._creationTime,
      updatedAt: publication._creationTime,
      ownerId: publication.authorId,
      ownerName: meta?.ownerName,
      ownerAvatar: meta?.ownerAvatar,
      ownerPhone: meta?.ownerPhone,
      viewCount: publication.viewCount || 0,
      likeCount: publication.likeCount || 0,
      shareCount: meta?.shareCount || 0,
      offerCount: meta?.offerCount || 0,
      isPromoted: meta?.isPromoted || false,
      isPremium: meta?.isPremium || false,
      promotionEnd: meta?.promotionEnd,
      isReserved: meta?.isReserved || false,
      isSold: meta?.isSold || false,
      warrantyMonths: meta?.warrantyMonths,
      deliveryAvailable: meta?.deliveryAvailable || false,
      deliveryPrice: meta?.deliveryPrice,
      paymentMethods: meta?.paymentMethods || [],
      negotiable: meta?.negotiable || false,
      minPrice: meta?.minPrice,
      avgRating: meta?.avgRating,
      reviewCount: meta?.reviewCount,
    };

    return (
      <AnnonceContent
        annonce={annonceData}
        index={index}
        onFavorite={(id, favorited) => {
          console.log("Favori:", id, favorited);
        }}
        isFavorited={isLiked}
      />
    );
  }

  // ===== 5. Service =====
  if (publication.type === "service") {
    const serviceData = {
      _id: meta?.providerId || publication._id,
      userId: publication.authorId,
      name: publication.title,
      category: meta?.category || "Services",
      specialty: meta?.specialty || "",
      location: publication.location || "",
      description: publication.description || "",
      price: meta?.price || publication.price || "",
      currency: meta?.currency || "USD",
      responseTime: meta?.responseTime || "Sur demande",
      imageUrl: publication.images?.[0],
      rating: meta?.rating || 4.5,
      reviewCount: meta?.reviewCount || 0,
      skills: meta?.skills || [],
      verified: meta?.verified || false,
      available: meta?.available !== false,
      urgent: meta?.urgent || false,
      phone: meta?.phone || "",
      languages: meta?.languages || [],
      experience: meta?.experience || "",
      certificates: meta?.certificates || [],
      portfolio: meta?.portfolio || [],
      insurance: meta?.insurance || false,
      warranty: meta?.warranty || false,
      online: meta?.online || false,
      lastActive: meta?.lastActive || Date.now(),
      createdAt: publication._creationTime,
      updatedAt: publication._creationTime,
      likeCount: publication.likeCount || 0,
      shareCount: publication.shareCount || 0,
      viewCount: publication.viewCount || 0,
    };

    const handleCall = (phone: string) => {
      if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleBook = () => {
      const providerId = meta?.providerId;
      if (providerId) Linking.openURL(`/service/${providerId}`);
    };

    return (
      <ServiceContent
        service={serviceData}
        index={index}
        phone={serviceData.phone}
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
  }

  // ===== 6. Marketplace =====
  if (publication.type === "marketplace") {
    const status: ProductStatus =
      publication.status === "active" ? "active" : "archived";

    const product = {
      _id: meta?.productId || publication._id,
      title: publication.title,
      description: publication.description,
      price: parseFloat(publication.price || "0"),
      currency: meta?.currency || "XAF",
      category: meta?.category || "",
      images: publication.images || [],
      stock: meta?.stock ?? 0,
      tags: publication.tags || [],
      isDigital: meta?.isDigital || false,
      deliveryAvailable: meta?.deliveryAvailable || false,
      sellerId: publication.authorId,
      sellerName: meta?.sellerName || (publication as any).author?.name,
      sellerAvatar: meta?.sellerAvatar || (publication as any).author?.avatar,
      sellerVerified: meta?.sellerVerified || false,
      status,
      isLiked: publication.likedByMe || false,
      isInCart: false,
      rating: meta?.avgRating,
      reviewCount: meta?.reviewCount || 0,
      createdAt: publication._creationTime,
      updatedAt: publication._creationTime,
      likeCount: publication.likeCount || 0,
      viewCount: publication.viewCount || 0,
    };

    const handlePress = () => {
      const productId = meta?.productId || publication._id;
      Linking.openURL(`/marketplace/${productId}`);
    };

    return (
      <ProductContent
        product={product}
        index={index}
        onPress={handlePress}
        onLike={onLike}
        onAddToCart={() => {
          console.log("Ajouter au panier:", product._id);
        }}
      />
    );
  }

  // ===== 7. Community =====
  if (publication.type === "community") {
    const authorName =
      (publication as any).author?.name || meta.authorName || "Anonyme";
    const authorAvatar =
      (publication as any).author?.avatar || meta.authorAvatar || undefined;

    const postType: PostType = meta.postType || "text";

    const statusMapping: Record<string, PostStatus> = {
      active: "active",
      sold: "archived",
      closed: "archived",
      cancelled: "archived",
      completed: "archived",
      archived: "archived",
    };
    const status = statusMapping[publication.status || "active"] || "active";

    const votedOptionId = publication.votedOptionId ?? undefined;
    const bookmarkCount =
      (publication as any).bookmarkCount || meta.bookmarkCount || 0;

    const communityPost: CommunityPost = {
      _id: publication._id as any,
      _creationTime: publication._creationTime,
      authorId: publication.authorId,
      authorName,
      authorAvatar,
      title: publication.title || "",
      description: publication.description || "",
      images: extractValidImages(publication.images),
      tags: publication.tags || [],
      likeCount: publication.likeCount || 0,
      commentCount: publication.commentCount || 0,
      shareCount: publication.shareCount || 0,
      bookmarkCount,
      likedByMe: publication.likedByMe || false,
      bookmarkedByMe: (publication as any).bookmarkedByMe || false,
      meta: {
        postType,
        mood: meta.mood as Mood | undefined,
        audience: meta.audience || "public",
        location: meta.location || publication.location,
        mentions: meta.mentions || [],
        pollOptions: meta.pollOptions || [],
        videos: meta.videos || [],
        audio: meta.audio || [],
        images: extractValidImages(meta.images),
      },
      comments: meta.comments || [],
      type: "community",
      status,
      viewCount: publication.viewCount || 0,
      votedOptionId,
      isMine: publication.isMine || false,
    };

    const handleLike = () => onLike();
    const handleComment = () => (onComment ? onComment() : onCTA());
    const handleShare = () =>
      onShare ? onShare() : console.log("Partager:", communityPost._id);
    const handleBookmark = () =>
      onBookmark ? onBookmark() : console.log("Bookmark:", communityPost._id);
    const handleVote = (optionId: string) => onVote?.(optionId);
    const handleNavigate = () => {
      Linking.openURL(`/community/${communityPost._id}`);
    };

    return (
      <CommunityCard
        post={communityPost}
        index={index}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onBookmark={handleBookmark}
        onVote={handleVote}
        onNavigate={handleNavigate}
      />
    );
  }

  // ===== 8. Santé =====
  if (publication.type === "sante") {
    return (
      <SanteCard
        publication={publication}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />
    );
  }

  // ===== 9. Transport =====
  if (publication.type === "transport") {
    return (
      <TransportCard
        publication={publication}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />
    );
  }

  // ===== 10. Restauration =====
  if (publication.type === "restauration") {
    return (
      <RestaurantCard
        publication={publication}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />
    );
  }

  // ===== 11. Hébergement =====
  if (publication.type === "hebergement") {
    return (
      <HebergementCard
        publication={publication}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />
    );
  }

  // ===== 12. Agriculture =====
  if (publication.type === "agri") {
    const agriProduct = transformToAgriProduct(publication, meta);

    const handleToggleFavorite = () => {
      onLike();
    };

    const handleClick = () => {
      Linking.openURL(`/agri/${publication._id}`);
    };

    return (
      <AgriCard
        product={agriProduct}
        isFavorite={isLiked}
        onToggleFavorite={handleToggleFavorite}
        onPress={handleClick}
      />
    );
  }

  // ===== 13. Network (carte dédiée) =====
  if (publication.type === "network") {
    const handleNetworkAction = (action: string) => {
      onAction(action);
    };

    return (
      <NetworkCard
        publication={publication}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        onNavigate={onAction}
        onActionClick={handleNetworkAction}
      />
    );
  }

  // ===== 14. Voyages (carte dédiée) =====
  if (publication.type === "voyages") {
    return (
      <VoyageCard
        publication={publication}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />
    );
  }

  // ===== Fallback générique =====
  // Pour tous les autres types (energie, ong, video, article, sondage, etc.)
  return (
    <PublicationCard
      publication={publication}
      index={index}
      onLike={onLike}
      onVote={onVote}
      onDelete={onDelete}
      onAction={onAction}
      onCTA={onCTA}
      actionsSlot={actionsSlot}
    />
  );
}
