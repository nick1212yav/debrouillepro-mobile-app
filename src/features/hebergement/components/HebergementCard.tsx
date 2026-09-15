import {
  View,
  Pressable,
  Image,
  Text,
  GestureResponderEvent,
} from "react-native";

// src/features/hebergement/components/HebergementCard.tsx
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import {
  MapPin,
  Star,
  Bed,
  Bath,
  Square,
  Home,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  CheckCircle,
  Sparkles,
  Eye,
  TrendingUp,
  ChevronRight,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { PublicationHeader } from "@/features/publications/components/PublicationHeader";
import { PublicationGallery } from "@/features/publications/components/PublicationGallery";
import { getModuleEmoji } from "@/features/publications/utils/format.utils";
import type { Publication } from "@/features/publications/types";

interface Props {
  publication: Publication;
  index: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// Couleurs par type d'hébergement
const TYPE_COLORS: Record<string, string> = {
  appartement: "#3B82F6",
  studio: "#8B5CF6",
  maison: "#10B981",
  villa: "#F59E0B",
  hotel: "#EF4444",
  auberge: "#F97316",
  guesthouse: "#EC4899",
  residence: "#6366F1",
  colocation: "#14B8A6",
  chambre: "#06B6D4",
  lodge: "#F472B6",
  bungalow: "#34D399",
  camping: "#84CC16",
  resort: "#7C3AED",
  hostel: "#FBBF24",
};

export function HebergementCard({
  publication,
  index,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: Props) {
  const navigate = useNavigate();
  const meta = parseMeta(publication.meta);
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  // Extraction des données de l'hébergement
  const title = publication.title || "Logement";
  const type = meta.type || "";
  const location = meta.location || publication.location || "";
  const price = meta.price ? parseFloat(meta.price) : 0;
  const currency = meta.currency || "FCFA";
  const period = meta.period || "nuit";
  const bedrooms = meta.bedrooms || 0;
  const bathrooms = meta.bathrooms || 0;
  const area = meta.area || 0;
  const rating = meta.rating ? parseFloat(meta.rating) : 0;
  const reviewCount = meta.reviewCount || 0;
  const isAvailable = meta.available !== false;
  const isVerified = meta.verified || false;
  const isPromoted = meta.isPromoted || false;
  const description = meta.description || publication.description || "";
  const createdAt = publication._creationTime || Date.now();
  const images = publication.images || [];

  // Couleur dynamique selon le type
  const color = TYPE_COLORS[type.toLowerCase()] || "#3B82F6";

  // Formatage du temps
  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: fr,
  });

  // Gestionnaires
  const handleCardClick = useCallback(() => {
    navigate(`/hebergement/${publication._id}`);
  }, [navigate, publication._id]);

  const handleLike = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    onLike?.();
  };

  const handleBookmark = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  const handleShare = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onShare?.();
  };

  const handleComment = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onComment?.();
  };

  const handleCTA = (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    navigate(`/hebergement/${publication._id}`);
  };

  // Rendu des badges — les conteneurs sont des <View>, seul le texte est dans <Text>
  const renderBadges = () => {
    const badges = [];

    if (isAvailable) {
      badges.push(
        <View
          key="available"
          className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/90 border border-emerald-400/30"
        >
          <View className="w-1.5 h-1.5 rounded-full bg-white" />
          <Text className="text-[10px] font-bold text-white">Disponible</Text>
        </View>,
      );
    } else {
      badges.push(
        <View
          key="unavailable"
          className="px-2.5 py-1 rounded-lg bg-red-500/90 border border-red-400/30"
        >
          <Text className="text-[10px] font-bold text-white">Indisponible</Text>
        </View>,
      );
    }

    if (isVerified) {
      badges.push(
        <View
          key="verified"
          className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/90 border border-blue-400/30"
        >
          <CheckCircle size={10} color="#FFFFFF" />
          <Text className="text-[10px] font-bold text-white">Vérifié</Text>
        </View>,
      );
    }

    if (isPromoted) {
      badges.push(
        <View
          key="promoted"
          className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/90 border border-purple-400/30"
        >
          <Sparkles size={10} color="#FFFFFF" />
          <Text className="text-[10px] font-bold text-white">Promu</Text>
        </View>,
      );
    }

    return badges.slice(0, 3);
  };

  const badges = renderBadges();

  // Affichage des étoiles (max 5)
  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={14} color="#FBBF24" fill="#FBBF24" />);
    }

    if (hasHalfStar) {
      stars.push(
        <View key="half" className="relative">
          <Star size={14} color="#FBBF24" />
          <View className="absolute inset-0 overflow-hidden w-1/2">
            <Star size={14} color="#FBBF24" fill="#FBBF24" />
          </View>
        </View>,
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={14} color="rgba(255,255,255,0.2)" />,
      );
    }

    return stars;
  };

  return (
    <View
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      onStartShouldSetResponder={() => true}
      onResponderRelease={handleCardClick}
      className="relative rounded-3xl overflow-hidden"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderStyle: "solid",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: isHovered ? 20 : 4 },
        shadowOpacity: isHovered ? 0.3 : 0.1,
        shadowRadius: isHovered ? 30 : 10,
        elevation: isHovered ? 12 : 4,
        transform: isHovered ? [{ scale: 1.015 }] : [{ scale: 1 }],
      }}
    >
      {/* Images */}
      <View
        className="relative overflow-hidden bg-black/20"
        style={{ height: 192 }}
      >
        {images && images.length > 0 ? (
          <Image
            source={{ uri: images[0] }}
            accessibilityLabel={title}
            className="w-full h-full"
            style={{
              transform: isHovered ? [{ scale: 1.05 }] : [{ scale: 1 }],
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-full h-full items-center justify-center"
            style={{ backgroundColor: `${color}22` }}
          >
            <Home size={48} color={color} />
          </View>
        )}

        {/* Overlay */}
        <View
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
        />

        {/* Badges */}
        <View className="absolute top-3 left-3 flex-row flex-wrap gap-1.5">
          {badges}
        </View>

        {/* Bookmark */}
        <Pressable
          onPress={handleBookmark}
          className="absolute top-3 right-3 w-9 h-9 rounded-full items-center justify-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            borderStyle: "solid",
          }}
        >
          <Bookmark
            size={16}
            color={bookmarked ? "#FBBF24" : "rgba(255,255,255,0.8)"}
            fill={bookmarked ? "#FBBF24" : "transparent"}
          />
        </Pressable>

        {/* Price */}
        {price > 0 && (
          <View className="absolute bottom-3 left-3">
            <Text
              className="px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "#FCD34D",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                borderStyle: "solid",
              }}
            >
              {price.toLocaleString()}
              {currency}/ {period}
            </Text>
          </View>
        )}

        {/* Type badge */}
        <View
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl"
          style={{ backgroundColor: `${color}cc` }}
        >
          <Text className="text-[10px] font-bold text-white">
            {type || "Hébergement"}
          </Text>
        </View>
      </View>

      {/* Contenu */}
      <View className="p-4 gap-3">
        {/* Titre + rating */}
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2 mb-0.5">
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color }}
              >
                {type || "Hébergement"}
              </Text>
              <Text className="text-white/20">·</Text>
              <Text className="text-[9px] text-white/30">{timeAgo}</Text>
            </View>
            <Text className="text-white font-bold text-base leading-tight">
              {title}
            </Text>
          </View>

          <View className="flex-row items-center gap-1 flex-shrink-0">
            <View className="flex-row items-center gap-0.5">
              {renderStars()}
            </View>
            {reviewCount > 0 && (
              <Text className="text-white/40 text-xs ml-1">
                ({reviewCount})
              </Text>
            )}
          </View>
        </View>

        {/* Location */}
        {location ? (
          <View className="flex-row items-center gap-1.5">
            <MapPin size={12} color="rgba(255,255,255,0.3)" />
            <Text className="text-xs text-white/50 flex-1" numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}

        {/* Détails (chambres, sdb, surface) */}
        <View className="flex-row items-center gap-3 flex-wrap">
          {bedrooms > 0 && (
            <View className="flex-row items-center gap-1">
              <Bed size={12} color="rgba(255,255,255,0.3)" />
              <Text className="text-xs text-white/60">{bedrooms} ch.</Text>
            </View>
          )}
          {bathrooms > 0 && (
            <View className="flex-row items-center gap-1">
              <Bath size={12} color="rgba(255,255,255,0.3)" />
              <Text className="text-xs text-white/60">{bathrooms} sdb</Text>
            </View>
          )}
          {area > 0 && (
            <View className="flex-row items-center gap-1">
              <Square size={12} color="rgba(255,255,255,0.3)" />
              <Text className="text-xs text-white/60">{area}m²</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {description ? (
          <Text
            className="text-sm text-white/60 leading-relaxed"
            numberOfLines={3}
          >
            {description}
          </Text>
        ) : null}

        {/* Stats */}
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Eye size={11} color="rgba(255,255,255,0.3)" />
            <Text className="text-xs text-white/30">
              {publication.viewCount || 0}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Heart size={11} color="rgba(255,255,255,0.3)" />
            <Text className="text-xs text-white/30">
              {publication.likeCount || 0}
            </Text>
          </View>
          {publication.shareCount && publication.shareCount > 0 ? (
            <View className="flex-row items-center gap-1">
              <Share2 size={11} color="rgba(255,255,255,0.3)" />
              <Text className="text-xs text-white/30">
                {publication.shareCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Actions sociales */}
      <View className="px-4 py-2.5 border-t border-white/5 flex-row items-center justify-between flex-wrap gap-2">
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={handleLike}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              backgroundColor: liked ? "rgba(244,63,94,0.1)" : "transparent",
            }}
          >
            <Heart
              size={14}
              color={liked ? "#FB7185" : "rgba(255,255,255,0.4)"}
              fill={liked ? "#FB7185" : "transparent"}
            />
            <Text
              className="text-xs font-medium"
              style={{ color: liked ? "#FB7185" : "rgba(255,255,255,0.4)" }}
            >
              {publication.likeCount || 0}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleComment}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
          >
            <MessageCircle size={14} color="rgba(255,255,255,0.4)" />
            <Text className="text-xs font-medium text-white/40">
              {publication.commentCount || 0}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
          >
            <Share2 size={14} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </View>

        <Pressable
          onPress={handleCTA}
          className="flex-row items-center gap-1.5 px-4 py-1.5 rounded-xl"
          style={{ backgroundColor: color }}
        >
          <Home size={12} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">Voir le logement</Text>
          <ChevronRight size={12} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>
    </View>
  );
}

// Utilitaire pour parser les métadonnées
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
