import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  Phone,
  CalendarDays,
  Home,
  Eye,
  TrendingUp,
  ChevronRight,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { useImmoPublication } from "../hooks/useImmoPublication";

type ImmoPublication = any;

interface Props {
  publication: ImmoPublication;
  index?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

const PROPERTY_COLORS: Record<string, string> = {
  vente: "#F97316",
  location: "#3B82F6",
  colocation: "#8B5CF6",
  terrain: "#10B981",
  bureau: "#6366F1",
  commerce: "#EC4899",
};

function PropertyCardComponent({
  publication,
  index = 0,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: Props) {
  const router = useRouter();
  const property = useImmoPublication(publication);

  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [pressed, setPressed] = useState(false);

  const color = PROPERTY_COLORS[property.transactionType] ?? "#8B5CF6";

  const timeAgo = useMemo(() => {
    if (!property.createdAt) {
      return "";
    }

    try {
      return formatDistanceToNow(new Date(property.createdAt), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return "";
    }
  }, [property.createdAt]);

  const formattedPrice = useMemo(() => {
    if (
      property.price === undefined ||
      property.price === null ||
      property.price === ""
    ) {
      return "Prix sur demande";
    }

    const numericPrice = Number(property.price);

    if (!Number.isFinite(numericPrice)) {
      return String(property.price);
    }

    return `${new Intl.NumberFormat("fr-FR").format(numericPrice)} ${
      property.currency || "FCFA"
    }`;
  }, [property.price, property.currency]);

  const imageUri = useMemo(() => {
    const firstImage = property.images?.[0];

    if (typeof firstImage === "string" && /^https?:\/\//i.test(firstImage)) {
      return firstImage;
    }

    return null;
  }, [property.images]);

  const transactionLabel = useMemo(() => {
    switch (property.transactionType) {
      case "location":
        return "📍 À louer";

      case "vente":
        return "💰 À vendre";

      case "colocation":
        return "🏠 Colocation";

      case "terrain":
        return "🌱 Terrain";

      case "bureau":
        return "🏢 Bureau";

      case "commerce":
        return "🏪 Commerce";

      default:
        return property.transactionType || "Immobilier";
    }
  }, [property.transactionType]);

  const handleCardPress = useCallback(() => {
    if (!property.propertyId) {
      return;
    }

    router.push(`/immo/${property.propertyId}` as never);
  }, [property.propertyId, router]);

  const handleLike = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();

      setLiked((previous) => !previous);
      onLike?.();
    },
    [onLike],
  );

  const handleBookmark = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();

      setBookmarked((previous) => !previous);
      onBookmark?.();
    },
    [onBookmark],
  );

  const handleShare = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      onShare?.();
    },
    [onShare],
  );

  const handleComment = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      onComment?.();
    },
    [onComment],
  );

  const handleContact = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();

      if (!property.propertyId) {
        return;
      }

      router.push(`/immo/${property.propertyId}?tab=contact` as never);
    },
    [property.propertyId, router],
  );

  const handleVisit = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();

      if (!property.propertyId) {
        return;
      }

      router.push(`/immo/${property.propertyId}?tab=visit` as never);
    },
    [property.propertyId, router],
  );

  return (
    <Pressable
      onPress={handleCardPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={`Voir le bien ${publication.title || "immobilier"}`}
      className="relative mb-4 overflow-hidden rounded-3xl border border-white/10"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        opacity: pressed ? 0.96 : 1,
        transform: [
          {
            scale: pressed ? 0.985 : 1,
          },
        ],
      }}
    >
      {/* ─────────────────────────────────────────────
          IMAGE
      ───────────────────────────────────────────── */}

      <View className="relative h-52 overflow-hidden">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            accessibilityLabel={publication.title || "Image du bien immobilier"}
            resizeMode="cover"
            className="h-full w-full"
          />
        ) : (
          <View
            className="h-full w-full items-center justify-center"
            style={{
              backgroundColor: `${color}22`,
            }}
          >
            <Home size={48} color={color} strokeWidth={1.5} />
          </View>
        )}

        {/* Overlay */}
        <View
          pointerEvents="none"
          className="absolute inset-0"
          style={{
            backgroundColor: "rgba(0,0,0,0.08)",
          }}
        />

        {/* Transaction badge */}
        <View
          className="absolute left-3 top-3 rounded-full px-3 py-1.5"
          style={{
            backgroundColor: `${color}DD`,
          }}
        >
          <Text className="text-[10px] font-bold text-white">
            {transactionLabel}
          </Text>
        </View>

        {/* Promoted badge */}
        {publication.isPromoted === true ? (
          <View className="absolute left-32 top-3 rounded-full bg-purple-500/90 px-3 py-1.5">
            <Text className="text-[10px] font-bold text-white">⚡ Promu</Text>
          </View>
        ) : null}

        {/* Like */}
        <Pressable
          onPress={handleLike}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            liked ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full border border-white/10"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          <Heart
            size={16}
            color={liked ? "#F43F5E" : "#FFFFFF"}
            fill={liked ? "#F43F5E" : "transparent"}
          />
        </Pressable>

        {/* Price */}
        <View className="absolute bottom-3 left-3">
          <View
            className="rounded-xl border border-white/10 px-3 py-1.5"
            style={{
              backgroundColor: "rgba(0,0,0,0.62)",
            }}
          >
            <Text
              className="text-sm font-bold"
              style={{
                color: "#FCD34D",
              }}
            >
              {formattedPrice}
            </Text>
          </View>
        </View>

        {/* Quick stats */}
        <View className="absolute bottom-3 right-3 flex-row items-center gap-2">
          {property.surface ? (
            <View className="flex-row items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
              <Ruler size={12} color="#FFFFFF" />

              <Text className="text-[10px] font-medium text-white/80">
                {property.surface}m²
              </Text>
            </View>
          ) : null}

          {property.rooms ? (
            <View className="flex-row items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
              <BedDouble size={12} color="#FFFFFF" />

              <Text className="text-[10px] font-medium text-white/80">
                {property.rooms}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ─────────────────────────────────────────────
          CONTENT
      ───────────────────────────────────────────── */}

      <View className="p-4">
        {/* Type + date */}
        <View className="mb-1 flex-row items-center">
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {property.type || "Immobilier"}
          </Text>

          {timeAgo ? (
            <>
              <Text className="mx-2 text-white/20">·</Text>

              <Text className="text-[9px] text-white/30">{timeAgo}</Text>
            </>
          ) : null}
        </View>

        {/* Title */}
        <Text
          numberOfLines={2}
          className="text-base font-bold leading-5 text-white"
        >
          {publication.title || "Bien immobilier"}
        </Text>

        {/* Location */}
        {property.city ? (
          <View className="mt-3 flex-row items-center gap-1.5">
            <MapPin size={12} color="rgba(255,255,255,0.35)" />

            <Text numberOfLines={1} className="flex-1 text-xs text-white/50">
              {property.city}
            </Text>
          </View>
        ) : null}

        {/* Property details */}
        <View className="mt-3 flex-row flex-wrap items-center gap-3">
          {property.surface ? (
            <View className="flex-row items-center gap-1">
              <Ruler size={12} color="rgba(255,255,255,0.35)" />

              <Text className="text-xs text-white/60">
                {property.surface}m²
              </Text>
            </View>
          ) : null}

          {property.rooms ? (
            <View className="flex-row items-center gap-1">
              <BedDouble size={12} color="rgba(255,255,255,0.35)" />

              <Text className="text-xs text-white/60">
                {property.rooms} pièces
              </Text>
            </View>
          ) : null}

          {property.bathrooms ? (
            <View className="flex-row items-center gap-1">
              <Bath size={12} color="rgba(255,255,255,0.35)" />

              <Text className="text-xs text-white/60">
                {property.bathrooms} sdb
              </Text>
            </View>
          ) : null}
        </View>

        {/* Amenities */}
        {Array.isArray(property.amenities) && property.amenities.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {property.amenities
              .slice(0, 4)
              .map((item: string, itemIndex: number) => (
                <View
                  key={`${item}-${itemIndex}`}
                  className="rounded-full px-2 py-1"
                  style={{
                    backgroundColor: `${color}20`,
                  }}
                >
                  <Text className="text-[9px] font-medium" style={{ color }}>
                    {item}
                  </Text>
                </View>
              ))}

            {property.amenities.length > 4 ? (
              <View className="justify-center">
                <Text className="text-[9px] text-white/30">
                  +{property.amenities.length - 4}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Statistics */}
        <View className="mt-4 flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Eye size={11} color="rgba(255,255,255,0.35)" />

            <Text className="text-[10px] text-white/40">
              {publication.viewCount || 0}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Heart size={11} color="rgba(255,255,255,0.35)" />

            <Text className="text-[10px] text-white/40">
              {publication.likeCount || 0}
            </Text>
          </View>

          {publication.shareCount > 0 ? (
            <View className="flex-row items-center gap-1">
              <TrendingUp size={11} color="rgba(255,255,255,0.35)" />

              <Text className="text-[10px] text-white/40">
                {publication.shareCount}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ─────────────────────────────────────────────
            ACTIONS
        ───────────────────────────────────────────── */}

        <View className="mt-4 border-t border-white/5 pt-3">
          <View className="flex-row items-center justify-between">
            {/* Social actions */}
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={handleLike}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Aimer"
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: liked
                    ? "rgba(244,63,94,0.10)"
                    : "transparent",
                }}
              >
                <Heart
                  size={15}
                  color={liked ? "#FB7185" : "rgba(255,255,255,0.45)"}
                  fill={liked ? "#FB7185" : "transparent"}
                />
              </Pressable>

              <Pressable
                onPress={handleComment}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Commenter"
                className="h-9 w-9 items-center justify-center rounded-xl"
              >
                <MessageCircle size={15} color="rgba(255,255,255,0.45)" />
              </Pressable>

              <Pressable
                onPress={handleShare}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Partager"
                className="h-9 w-9 items-center justify-center rounded-xl"
              >
                <Share2 size={15} color="rgba(255,255,255,0.45)" />
              </Pressable>

              <Pressable
                onPress={handleBookmark}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={
                  bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"
                }
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: bookmarked
                    ? "rgba(245,158,11,0.10)"
                    : "transparent",
                }}
              >
                <Bookmark
                  size={15}
                  color={bookmarked ? "#FBBF24" : "rgba(255,255,255,0.45)"}
                  fill={bookmarked ? "#FBBF24" : "transparent"}
                />
              </Pressable>
            </View>

            {/* Contact / Visit */}
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={handleContact}
                accessibilityRole="button"
                accessibilityLabel="Contacter"
                className="flex-row items-center gap-1.5 rounded-xl bg-blue-500/80 px-3 py-2"
              >
                <Phone size={12} color="#FFFFFF" />

                <Text className="text-xs font-medium text-white">
                  Contacter
                </Text>
              </Pressable>

              <Pressable
                onPress={handleVisit}
                accessibilityRole="button"
                accessibilityLabel="Planifier une visite"
                className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
                style={{
                  backgroundColor: `${color}20`,
                  borderWidth: 1,
                  borderColor: `${color}45`,
                }}
              >
                <CalendarDays size={12} color={color} />

                <Text className="text-xs font-bold" style={{ color }}>
                  Visiter
                </Text>

                <ChevronRight size={12} color={color} opacity={0.65} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const PropertyCard = memo(PropertyCardComponent, (previous, next) => {
  return (
    previous.publication?.id === next.publication?.id &&
    previous.isLiked === next.isLiked &&
    previous.isBookmarked === next.isBookmarked &&
    previous.index === next.index
  );
});

PropertyCard.displayName = "PropertyCard";

export default PropertyCard;
