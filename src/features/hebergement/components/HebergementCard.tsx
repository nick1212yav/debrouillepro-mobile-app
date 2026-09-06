import { useRouter } from "expo-router";
import { View, Pressable, Image, Text, GestureResponderEvent } from "react-native";

// src/features/hebergement/components/HebergementCard.tsx
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
  const router = useRouter();
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
    router.push(`/hebergement/${publication._id}`);
  }, [router, publication._id]);

  const handleLike = (e: GestureResponderEvent) => {
    setLiked(!liked);
    onLike?.();
  };

  const handleBookmark = (e: GestureResponderEvent) => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  const handleShare = (e: GestureResponderEvent) => {
    onShare?.();
  };

  const handleComment = (e: GestureResponderEvent) => {
    onComment?.();
  };

  const handleCTA = (e?: GestureResponderEvent) => {
    router.push(`/hebergement/${publication._id}`);
  };

  // Rendu des badges
  const renderBadges = () => {
    const badges = [];
    if (isAvailable) {
      badges.push(
        <Text
          key="available"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white border border-emerald-400/30"
        >
          <Text className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Disponible
        </Text>,
      );
    } else {
      badges.push(
        <Text
          key="unavailable"
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/90 text-white border border-red-400/30"
        >
          Indisponible
        </Text>,
      );
    }
    if (isVerified) {
      badges.push(
        <Text
          key="verified"
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/90 text-white border border-blue-400/30 flex items-center gap-1"
        >
          <CheckCircle size={10} /> Vérifié
        </Text>,
      );
    }
    if (isPromoted) {
      badges.push(
        <Text
          key="promoted"
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/90 text-white border border-purple-400/30 flex items-center gap-1"
        >
          <Sparkles size={10} /> Promu
        </Text>,
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
      stars.push(
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />,
      );
    }
    if (hasHalfStar) {
      stars.push(
        <View key="half" className="relative">
          <Star size={14} className="text-amber-400" />
          <View className="absolute inset-0 overflow-hidden w-1/2">
            <Star size={14} className="fill-amber-400 text-amber-400" />
          </View>
        </View>,
      );
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={14} className="text-white/20" />,
      );
    }
    return stars;
  };

  return (
    <Pressable
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onPress={handleCardClick}
      className="relative rounded-3xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", transform: isHovered ? "scale(1.015)" : "scale(1)" }}
    >
      {/* Glow effect */}
      <View
        className="absolute inset-0 opacity-0"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Images */}
      <View className="relative h-48 overflow-hidden bg-black/20">
        {images && images.length > 0 ? (
          <Image
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover"
            style={{
              transform: isHovered ? "scale(1.05)" : "scale(1)"
            }}
            loading="lazy"
          />
        ) : (
          <View
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${color}22` }}
          >
            <Home size={48} className="opacity-30" style={{ color }} />
          </View>
        )}

        {/* Gradient overlay */}
        <View
          className="absolute inset-0"
          style={{  }}
        />

        {/* Badges */}
        <View className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {badges}
        </View>

        {/* Actions rapides (bookmark) sur l'image */}
        <Pressable
          onPress={handleBookmark}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          <Bookmark
            size={16}
            className={
              bookmarked ? "fill-amber-400 text-amber-400" : "text-white/80"
            }
          />
        </Pressable>

        {/* Prix sur l'image */}
        {price > 0 && (
          <View className="absolute bottom-3 left-3">
            <Text
              className="px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
            >
              {price.toLocaleString()} {currency} / {period}
            </Text>
          </View>
        )}

        {/* Type */}
        <View
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold"
          style={{ backgroundColor: `${color}cc` }}
        >
          {type || "Hébergement"}
        </View>
      </View>

      {/* Contenu */}
      <View className="p-4 space-y-3">
        {/* Header : titre + temps */}
        <View className="flex items-start justify-between gap-3">
          <View className="flex-1 min-w-0">
            <View className="flex items-center gap-2 mb-0.5">
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
          {/* Note */}
          <View className="flex items-center gap-1 flex-shrink-0">
            <View className="flex items-center gap-0.5">{renderStars()}</View>
            {reviewCount > 0 && (
              <Text className="text-white/40 text-xs ml-1">
                ({reviewCount})
              </Text>
            )}
          </View>
        </View>

        {/* Localisation */}
        {location && (
          <View className="flex items-center gap-1.5 text-xs text-white/50">
            <MapPin size={12} className="text-white/30" />
            <Text className="truncate">{location}</Text>
          </View>
        )}

        {/* Caractéristiques */}
        <View className="flex items-center gap-3 flex-wrap text-xs text-white/60">
          {bedrooms > 0 && (
            <Text className="flex items-center gap-1">
              <Bed size={12} className="text-white/30" /> {bedrooms} ch.
            </Text>
          )}
          {bathrooms > 0 && (
            <Text className="flex items-center gap-1">
              <Bath size={12} className="text-white/30" /> {bathrooms} sdb
            </Text>
          )}
          {area > 0 && (
            <Text className="flex items-center gap-1">
              <Square size={12} className="text-white/30" /> {area} m²
            </Text>
          )}
        </View>

        {/* Description courte */}
        {description && (
          <Text className="text-sm text-white/60 leading-relaxed">
            {description}
          </Text>
        )}

        {/* Statistiques */}
        <View className="flex items-center gap-3 text-xs text-white/30">
          <View className="flex items-center gap-1">
            <Eye size={11} />
            <Text>{publication.viewCount || 0}</Text>
          </View>
          <View className="flex items-center gap-1">
            <Heart size={11} />
            <Text>{publication.likeCount || 0}</Text>
          </View>
          {publication.shareCount && publication.shareCount > 0 && (
            <View className="flex items-center gap-1">
              <Share2 size={11} />
              <Text>{publication.shareCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions sociales */}
      <View className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
        <View className="flex items-center gap-1">
          {/* Like */}
          <Pressable
            onPress={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              liked
                ? "text-rose-400 bg-rose-500/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <Heart size={14} className={liked ? "fill-rose-400" : ""} />
            <Text>{publication.likeCount || 0}</Text>
          </Pressable>

          {/* Comment */}
          <Pressable
            onPress={handleComment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
          >
            <MessageCircle size={14} />
            <Text>{publication.commentCount || 0}</Text>
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
          >
            <Share2 size={14} />
          </Pressable>
        </View>

        {/* CTA Voir le logement */}
        <Pressable
          onPress={handleCTA}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white"
          style={{  }}
        >
          <Home size={12} />
          <Text><Text>Voir le logement</Text></Text>
          <ChevronRight size={12} className="opacity-60" />
        </Pressable>
      </View>
    </Pressable>
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
