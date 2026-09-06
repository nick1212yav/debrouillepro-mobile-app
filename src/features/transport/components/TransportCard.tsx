import { useRouter } from "expo-router";
import { View, Pressable, Image, Text, GestureResponderEvent } from "react-native";

// src/features/transport/components/TransportCard.tsx
import { useState, useCallback } from "react";
import {
  Clock,
  Users,
  Car,
  MapPin,
  ShieldCheck,
  CreditCard,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  CalendarDays,
  ChevronRight,
  Eye,
  TrendingUp,
  CheckCircle,
  XCircle,
  Package,
  Dog,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { PublicationHeader } from "@/features/publications/components/PublicationHeader";
import { PublicationGallery } from "@/features/publications/components/PublicationGallery";
import {
  formatTime,
  parseMeta,
  getModuleEmoji,
} from "@/features/publications/utils/format.utils";
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

// Couleur dynamique selon le type de véhicule
const VEHICLE_COLORS: Record<string, string> = {
  taxi: "#F97316",
  bus: "#3B82F6",
  moto: "#8B5CF6",
  minibus: "#10B981",
  voiture: "#6366F1",
  camion: "#EF4444",
  helicoptère: "#EC4899",
  bateau: "#06B6D4",
  train: "#F59E0B",
  avion: "#7C3AED",
};

export function TransportCard({
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
  const emoji = getModuleEmoji(publication.type);
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const images = publication.images?.length ? publication.images : [];

  // Extraction des données
  const origin = meta.origin || "";
  const destination = meta.destination || "";
  const departureTime = meta.departureTime || "";
  const pricePerSeat = meta.pricePerSeat ? parseFloat(meta.pricePerSeat) : 0;
  const currency = meta.currency || "FCFA";
  const seats = meta.seatsAvailable || 0;
  const vehicleType = meta.vehicleType || "";
  const amenities = meta.amenities || [];
  const luggageAllowed = meta.luggageAllowed ?? false;
  const petsAllowed = meta.petsAllowed ?? false;
  const insuranceIncluded = meta.insuranceIncluded ?? false;
  const company = meta.company || "";
  const driverName = meta.driverName || "";
  const tripStatus = meta.status || publication.status;
  const viewCount = publication.viewCount || 0;
  const likeCount = publication.likeCount || 0;
  const createdAt = publication._creationTime || Date.now();

  const color = VEHICLE_COLORS[vehicleType.toLowerCase()] || "#8B5CF6";

  // Formatage
  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: fr,
  });
  const formattedPrice = pricePerSeat
    ? `${pricePerSeat.toLocaleString()} ${currency}`
    : "Prix sur demande";

  // Handlers
  const handleCardClick = useCallback(() => {
    router.push(`/transport/${publication._id}`);
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

  const handleBook = (e: GestureResponderEvent) => {
    router.push(`/transport/${publication._id}?tab=booking`);
  };

  // Badge de statut
  const renderStatusBadge = () => {
    if (tripStatus === "active") {
      return (
        <Text className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/90 text-white border border-blue-400/30">
          <CheckCircle size={10} /> Disponible
        </Text>
      );
    }
    if (tripStatus === "completed") {
      return (
        <Text className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500/90 text-white border border-green-400/30">
          <CheckCircle size={10} /> Terminé
        </Text>
      );
    }
    if (tripStatus === "cancelled") {
      return (
        <Text className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/90 text-white border border-red-400/30">
          <XCircle size={10} /> Annulé
        </Text>
      );
    }
    if (tripStatus === "sold" || tripStatus === "closed") {
      return (
        <Text className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-500/90 text-white border border-gray-400/30">
          <XCircle size={10} /> Fermé
        </Text>
      );
    }
    return null;
  };

  // Équipements
  const amenityBadges = amenities.slice(0, 3).map((amenity: string) => (
    <Text
      key={amenity}
      className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
      style={{ backgroundColor: `${color}15`, color: color, borderStyle: "solid" }}
    >
      {amenity}
    </Text>
  ));

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

      {/* Image / Gallery */}
      <View className="relative h-52 overflow-hidden bg-black/20">
        {images.length > 0 ? (
          <Image
            src={images[0]}
            alt={`${origin} → ${destination}`}
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
            <Car size={48} className="opacity-30" style={{ color }} />
          </View>
        )}

        {/* Gradient overlay */}
        <View
          className="absolute inset-0"
          style={{  }}
        />

        {/* Badge statut */}
        <View className="absolute top-3 left-3">{renderStatusBadge()}</View>

        {/* Type de véhicule */}
        <View
          className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold"
          style={{ backgroundColor: `${color}cc` }}
        >
          {vehicleType || "Transport"}
        </View>

        {/* Prix sur l'image */}
        {pricePerSeat > 0 && (
          <View className="absolute bottom-3 left-3">
            <Text
              className="px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
            >
              {formattedPrice}
            </Text>
          </View>
        )}

        {/* Places disponibles */}
        {seats > 0 && (
          <View className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-white/80 bg-black/30">
            <Users size={12} />
            {seats} <Text>place</Text>{seats > 1 ? "s" : ""}
          </View>
        )}
      </View>

      {/* Contenu */}
      <View className="p-4 space-y-3">
        {/* En-tête : origine → destination */}
        <View className="flex items-start justify-between gap-3">
          <View className="flex-1 min-w-0">
            <View className="flex items-center gap-2 mb-0.5">
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color }}
              >
                Transport
              </Text>
              <Text className="text-white/20">·</Text>
              <Text className="text-[9px] text-white/30">{timeAgo}</Text>
            </View>
            {origin && destination && (
              <Text className="text-white font-bold text-base leading-tight">
                {origin} <Text className="text-violet-400">→</Text>{" "}
                {destination}
              </Text>
            )}
          </View>
        </View>

        {/* Détails du trajet */}
        <View className="flex flex-wrap items-center gap-3 text-xs text-white/60">
          {departureTime && (
            <Text className="flex items-center gap-1.5">
              <Clock size={12} className="text-white/30" />
              {departureTime}
            </Text>
          )}
          {vehicleType && (
            <Text className="flex items-center gap-1.5 capitalize">
              <Car size={12} className="text-white/30" />
              {vehicleType}
            </Text>
          )}
          {company && (
            <Text className="flex items-center gap-1.5">
              <Text className="text-white/30">•</Text>
              {company}
            </Text>
          )}
        </View>

        {/* Équipements / options */}
        {(amenities.length > 0 ||
          luggageAllowed ||
          petsAllowed ||
          insuranceIncluded) && (
          <View className="flex flex-wrap gap-1.5">
            {amenityBadges}
            {luggageAllowed && (
              <Text className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <Package size={10} /> Bagages
              </Text>
            )}
            {petsAllowed && (
              <Text className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Dog size={10} /> Animaux
              </Text>
            )}
            {insuranceIncluded && (
              <Text className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-300 border border-green-500/20">
                <ShieldCheck size={10} /> Assuré
              </Text>
            )}
          </View>
        )}

        {/* Statistiques */}
        <View className="flex items-center gap-3 text-xs text-white/30">
          <View className="flex items-center gap-1">
            <Eye size={11} />
            <Text>{viewCount}</Text>
          </View>
          <View className="flex items-center gap-1">
            <Heart size={11} />
            <Text>{likeCount}</Text>
          </View>
          {publication.shareCount && publication.shareCount > 0 && (
            <View className="flex items-center gap-1">
              <Share2 size={11} />
              <Text>{publication.shareCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
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
            <Text>{likeCount}</Text>
          </Pressable>

          {/* Comment */}
          <Pressable
            onPress={handleComment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
          >
            <MessageCircle size={14} />
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/40"
          >
            <Share2 size={14} />
          </Pressable>

          {/* Bookmark */}
          <Pressable
            onPress={handleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              bookmarked
                ? "text-amber-400 bg-amber-500/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bookmark
              size={14}
              className={bookmarked ? "fill-amber-400" : ""}
            />
          </Pressable>
        </View>

        {/* CTA Réserver */}
        <Pressable
          onPress={handleBook}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white"
          style={{  }}
        >
          <CalendarDays size={12} />
          <Text><Text>Réserver</Text></Text>
          <ChevronRight size={12} className="opacity-60" />
        </Pressable>
      </View>
    </Pressable>
  );
}
